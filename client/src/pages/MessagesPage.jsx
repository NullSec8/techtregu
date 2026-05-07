import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { MessagesPageSkeleton } from '../components/PageSkeletons';
import { useI18n } from '../context/I18nProvider';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
  return d.toLocaleDateString();
}

function formatLastSeen(ts, t) {
  if (!ts) return null;
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return t('onlineNow');
  if (diff < 3600000) return `${t('lastSeen')} ${Math.floor(diff / 60000)}m ${t('ago')}`;
  if (diff < 86400000) return `${t('lastSeen')} ${Math.floor(diff / 3600000)}h ${t('ago')}`;
  if (diff < 604800000) return `${t('lastSeen')} ${Math.floor(diff / 86400000)}d ${t('ago')}`;
  return `${t('lastSeen')} ${d.toLocaleDateString()}`;
}

function formatMessageTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(firstName, lastName) {
  const f = firstName?.[0] || '';
  const l = lastName?.[0] || '';
  return (f + l).toUpperCase() || '?';
}

function buildConversations(messages, meId) {
  const map = new Map();
  for (const msg of messages) {
    const isMine = Number(msg.sender?.id) === Number(meId);
    const other = isMine ? msg.receiver : msg.sender;
    if (!other?.id) continue;
    const existing = map.get(other.id);
    const created = new Date(msg.createdAt || 0).getTime();
    const isUnread = !isMine && !msg.isRead;
    const unreadCount = isUnread ? 1 : 0;
    if (!existing) {
      map.set(other.id, {
        user: other,
        lastMessage: msg,
        createdAtMs: created,
        unreadCount: unreadCount,
      });
    } else {
      if (created > existing.createdAtMs) {
        existing.lastMessage = msg;
        existing.createdAtMs = created;
      }
      existing.unreadCount += unreadCount;
    }
  }
  return [...map.values()].sort((a, b) => b.createdAtMs - a.createdAtMs);
}

export function MessagesPage() {
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('messages')));
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [thread, setThread] = useState([]);
  const [otherId, setOtherId] = useState(searchParams.get('user') || '');
  const [listingId, setListingId] = useState(searchParams.get('listing') || '');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [convSearch, setConvSearch] = useState('');
  const otherIdRef = useRef(otherId);
  otherIdRef.current = otherId;

  async function loadThreads() {
    try {
      const { data } = await api.get('/messages');
      setMessages(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(targetUserId) {
    if (!targetUserId) return;
    setShowActions(false);
    try {
      const { data } = await api.get(`/messages/conversation/${targetUserId}`);
      setThread(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load conversation');
      setThread([]);
    }
  }

  async function handleBlockUser() {
    if (!otherId || blocking) return;
    setBlocking(true);
    try {
      await api.post(`/messages/blocks/${otherId}`);
      setShowActions(false);
      setOtherId('');
      setThread([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to block user');
    } finally {
      setBlocking(false);
    }
  }

  async function handleDeleteConversation() {
    if (!otherId || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/messages/conversation/${otherId}`);
      setShowActions(false);
      setOtherId('');
      setThread([]);
      await loadThreads();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete conversation');
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (otherId) loadConversation(otherId);
  }, [otherId]);

  useEffect(() => {
    if (!user?.id || !otherId) return undefined;
    api
      .put(`/messages/conversation/${otherId}/read`)
      .then(() => window.dispatchEvent(new Event('tt-messages-refresh')))
      .catch(() => {});
    return undefined;
  }, [user?.id, otherId]);

  useEffect(() => {
    if (!user?.id) return undefined;
    function readXsrfCookie() {
      const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    }
    const socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000', {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { xsrfToken: readXsrfCookie() },
    });
    function joinOwnRoom() {
      socket.emit('join', user.id);
    }
    socket.on('connect', joinOwnRoom);
    socket.on('online', (userIds) => {
      setOnlineUsers(new Set(userIds || []));
    });
    socket.on('typing', ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) {
          next.set(userId, true);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });
    async function onNewMessage() {
      try {
        const { data } = await api.get('/messages');
        setMessages(data || []);
        const oid = otherIdRef.current;
        if (oid) {
          const { data: thr } = await api.get(`/messages/conversation/${oid}`);
          setThread(thr || []);
        }
      } catch {
        // ignore
      }
      window.dispatchEvent(new Event('tt-messages-refresh'));
    }
    socket.on('message:new', onNewMessage);
    return () => {
      socket.off('connect', joinOwnRoom);
      socket.off('online', () => {});
      socket.off('typing', () => {});
      socket.off('message:new', onNewMessage);
      socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/messages');
        setMessages(data || []);
        const oid = otherIdRef.current;
        if (oid) {
          const { data: thr } = await api.get(`/messages/conversation/${oid}`);
          setThread(thr || []);
        }
      } catch {
        // ignore transient polling errors
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const conversations = useMemo(
    () => buildConversations(messages, user?.id),
    [messages, user?.id]
  );

  const filteredConversations = useMemo(() => {
    if (!convSearch.trim()) return conversations;
    const q = convSearch.toLowerCase();
    return conversations.filter((conv) => {
      const name = [conv.user.firstName, conv.user.lastName, conv.user.username]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return name.includes(q) || (conv.lastMessage?.content || '').toLowerCase().includes(q);
    });
  }, [conversations, convSearch]);

  async function send(e) {
    e.preventDefault();
    if (!otherId || !draft.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await api.post('/messages', {
        receiver: Number(otherId),
        content: draft.trim(),
        listing: listingId ? Number(listingId) : undefined,
      });
      setDraft('');
      await Promise.all([loadThreads(), loadConversation(otherId)]);
      window.dispatchEvent(new Event('tt-messages-refresh'));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page-messages">
      <h1>{t('messages')}</h1>
      <p className="products-sub">{t('messagesLead')}</p>
      {error ? <div className="banner-error">{error}</div> : null}
      <div className="messages-layout">
        <aside className="messages-list" aria-label={t('conversations')}>
          <h3>{t('conversations')}</h3>
          <div className="messages-search-wrap">
            <label className="sr-only" htmlFor="conv-search">{t('searchConversations') || 'Search conversations'}</label>
            <input
              id="conv-search"
              type="search"
              className="messages-search-input"
              placeholder={t('searchConversations') || 'Search conversations…'}
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              aria-label={t('searchConversations') || 'Search conversations'}
            />
          </div>
          {loading ? (
            <MessagesPageSkeleton />
          ) : filteredConversations.length === 0 && conversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>{t('noConversations')}</p>
              <p className="products-sub">{t('noConversationsDesc')}</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="products-sub" style={{ padding: '0.75rem' }}>{t('noSearchResults') || 'No conversations match your search.'}</p>
          ) : (
            filteredConversations.map((conv) => {
              const fullName = [conv.user.firstName, conv.user.lastName].filter(Boolean).join(' ') || conv.user.username;
              const avatarUrl = conv.user.avatar;
              const isOnline = onlineUsers.has(conv.user.id);
              return (
                <button
                  key={conv.user.id}
                  type="button"
                  className={`conversation-item${String(otherId) === String(conv.user.id) ? ' active' : ''}`}
                  onClick={() => {
                    setOtherId(String(conv.user.id));
                    setListingId(conv.lastMessage?.listing?.id ? String(conv.lastMessage.listing.id) : '');
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="conversation-avatar" />
                  ) : (
                    <span className="conversation-avatar conversation-avatar-initials">
                      {getInitials(conv.user.firstName, conv.user.lastName)}
                    </span>
                  )}
                  {isOnline && <span className="online-dot" />}
                  <span className="conversation-name">{fullName}</span>
                  <span className="conversation-preview">
                    {conv.lastMessage.content?.slice(0, 40) || t('noMessages')}
                  </span>
                  <span className="conversation-date">{formatTime(conv.createdAtMs)}</span>
                  {conv.unreadCount > 0 && (
                    <span className="conversation-unread">{conv.unreadCount}</span>
                  )}
                </button>
              );
            })
          )}
        </aside>

        <section className="messages-thread">
          <h3>
            {t('thread')}
            {otherId && (
              <button
                type="button"
                className="thread-actions-btn"
                onClick={() => setShowActions(!showActions)}
                aria-label={t('threadOptions')}
                aria-expanded={showActions}
              >
                ⋯
              </button>
            )}
          </h3>
          {showActions && (
            <div className="thread-actions-menu">
              <button
                type="button"
                className="thread-action-error"
                onClick={handleBlockUser}
                disabled={blocking}
              >
                {blocking ? t('blocking') : t('blockUser')}
              </button>
              <button
                type="button"
                className="thread-action-error"
                onClick={handleDeleteConversation}
                disabled={deleting}
              >
                {deleting ? t('deletingConversation') : t('deleteConversation')}
              </button>
            </div>
          )}
          {!otherId ? (
            <div className="empty-state">
              <p>{t('selectConversation')}</p>
              <Link to="/" className="btn btn-primary">{t('browseListings')}</Link>
            </div>
          ) : (
            <>
              <div className="thread-header">
                {(() => {
                  const conv = conversations.find(c => String(c.user.id) === otherId);
                  const displayUser = conv?.user;
                  const isOnline = onlineUsers.has(Number(otherId));
                  const fullName = displayUser ? [displayUser.firstName, displayUser.lastName].filter(Boolean).join(' ') : 'User';
                  return (
                    <div className="thread-user-info">
                      <span className="thread-user-name">{fullName}</span>
                      {isOnline ? (
                        <span className="thread-user-status online">{t('onlineNow')}</span>
                      ) : displayUser?.lastSeen ? (
                        <span className="thread-user-status">{formatLastSeen(displayUser.lastSeen, t)}</span>
                      ) : null}
                    </div>
                  );
                })()}
              </div>
              <div className="thread-box">
                {thread.length === 0 ? (
                  <p className="products-sub">{t('noMessagesYet')}</p>
                ) : (
                  thread.map((msg) => {
                    const mine = Number(msg.sender?.id) === Number(user?.id);
                    return (
                      <div key={msg.id} className={`msg-bubble${mine ? ' mine' : ''}`}>
                        <div className="msg-head">
                          <strong>@{msg.sender?.username || 'user'}</strong>
                          <span className="msg-time" title={new Date(msg.createdAt).toLocaleString()}>
                            {formatMessageTime(msg.createdAt)}
                            {mine && (
                              <span className={`msg-status ${msg.isRead ? 'read' : ''}`}>
                                {msg.isRead ? '✓✓' : msg.isDelivered ? '✓✓' : '✓'}
                              </span>
                            )}
                          </span>
                        </div>
                        {msg.listing?.id ? (
                          <p className="msg-listing">
                            {t('listing')}: {' '}
                            <Link to={`/products/${msg.listing.id}`}>
                              {msg.listing.title || `#${msg.listing.id}`}
                            </Link>
                          </p>
                        ) : null}
                        <p>{msg.content}</p>
                      </div>
                    );
                  })
                )}
                {typingUsers.has(Number(otherId)) && (
                  <div className="typing-indicator" role="status" aria-live="polite">
                    <span className="typing-dots">
                      <span></span><span></span><span></span>
                    </span>
                    <span className="typing-text">{t('typing')}</span>
                  </div>
                )}
              </div>
              <form className="message-compose" onSubmit={send}>
                <label className="sr-only" htmlFor="message-draft">{t('writeMessage')}</label>
                <textarea
                  id="message-draft"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                  }}
                  placeholder={t('writeMessage')}
                  rows={2}
                  disabled={sending}
                  aria-label={t('writeMessage')}
                />
                <div className="message-compose-actions">
                  <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
                    {sending ? t('sending') : t('send')}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
