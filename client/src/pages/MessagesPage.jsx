import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';

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

function buildConversations(messages, meId) {
  const map = new Map();
  for (const msg of messages) {
    const isMine = Number(msg.sender?.id) === Number(meId);
    const other = isMine ? msg.receiver : msg.sender;
    if (!other?.id) continue;
    const existing = map.get(other.id);
    const created = new Date(msg.createdAt || 0).getTime();
    if (!existing || created > existing.createdAtMs) {
      map.set(other.id, {
        user: other,
        lastMessage: msg,
        createdAtMs: created,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.createdAtMs - a.createdAtMs);
}

export function MessagesPage() {
  useDocumentTitle(pageTitle('Messages'));
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
    try {
      const { data } = await api.get(`/messages/conversation/${targetUserId}`);
      setThread(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load conversation');
      setThread([]);
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
    const socket = io({
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    function joinOwnRoom() {
      socket.emit('join', user.id);
    }
    socket.on('connect', joinOwnRoom);
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
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const conversations = useMemo(
    () => buildConversations(messages, user?.id),
    [messages, user?.id]
  );

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
      <h1>Messages</h1>
      <p className="products-sub">Chat with buyers and sellers without leaving the platform.</p>
      {error ? <div className="banner-error">{error}</div> : null}
      <div className="messages-layout">
        <aside className="messages-list">
          <h3>Conversations</h3>
          {loading ? (
            <div className="empty-state">
              <p className="products-sub">Loading…</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>No conversations yet.</p>
              <p className="products-sub">Start a chat from a listing page.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.user.id}
                type="button"
                className={`conversation-item${String(otherId) === String(conv.user.id) ? ' active' : ''}`}
                onClick={() => {
                  setOtherId(String(conv.user.id));
                  setListingId(conv.lastMessage?.listing?.id ? String(conv.lastMessage.listing.id) : '');
                }}
              >
                <span className="conversation-name">@{conv.user.username}</span>
                <span className="conversation-preview">
                  {conv.lastMessage.content?.slice(0, 40) || 'No messages yet'}
                </span>
                <span className="conversation-date">{formatTime(conv.createdAtMs)}</span>
              </button>
            ))
          )}
        </aside>

        <section className="messages-thread">
          <h3>Thread</h3>
          {!otherId ? (
            <div className="empty-state">
              <p>Select a conversation or open one from a product page.</p>
              <p className="empty-actions">
                <Link to="/" className="btn btn-primary">
                  Browse listings
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="thread-box">
                {thread.length === 0 ? (
                  <p className="products-sub">No messages yet. Send the first one.</p>
                ) : (
                  thread.map((msg) => {
                    const mine = Number(msg.sender?.id) === Number(user?.id);
                    return (
                      <div key={msg.id} className={`msg-bubble${mine ? ' mine' : ''}`}>
                        <div className="msg-head">
                          <strong>@{msg.sender?.username || 'user'}</strong>
                          <span>{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        {msg.listing?.id ? (
                          <p className="msg-listing">
                            Listing:{' '}
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
              </div>
<form className="message-compose" onSubmit={send}>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message..."
                  rows={2}
                  disabled={sending}
                />
                <div className="message-compose-actions">
                  <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
                    {sending ? 'Sending...' : 'Send message'}
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
