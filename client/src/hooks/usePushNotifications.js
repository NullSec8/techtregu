import { useEffect, useRef, useState, useCallback } from 'react';
import { useI18n } from '../context/I18nProvider';

export function usePushNotifications(userId) {
  const [permission, setPermission] = useState(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  const [supported] = useState(() => 'Notification' in window);
  const socketRef = useRef(null);
  const permissionRef = useRef(permission);

  useEffect(() => {
    if (!userId || !supported) return;

    async function requestPermission() {
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);
        permissionRef.current = result;
      }
    }
    requestPermission();
  }, [userId, supported]);

  const showNotification = useCallback(({ title, body, icon }) => {
    if (permissionRef.current !== 'granted') return;

    const notif = new Notification(title || 'TechTregu', {
      body,
      icon: icon || '/favicon.svg',
      tag: 'techtregu',
      requireInteraction: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  }, []);

  useEffect(() => {
    if (!userId || permission !== 'granted') return;

    const socket = new WebSocket(`ws://${window.location.host}`, [
      'soap',
      'http://localhost:5000',
    ].includes(window.location.origin)
      ? undefined
      : undefined);

    socketRef.current = socket;

    let reconnectTimer = null;

    function connect() {
      try {
        socket.onopen = () => {
          socket.send(
            JSON.stringify({
              type: 'auth',
              userId,
            })
          );
        };
      } catch {
        // WebSocket not connected
      }
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          showNotification(data);
        }
      } catch {
        // Invalid message format
      }
    };

    socket.onclose = () => {
      reconnectTimer = setTimeout(connect, 5000);
    };

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket.close();
    };
  }, [userId, permission, showNotification]);

  return { permission, supported, showNotification };
}

export function PushNotificationBanner() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [permission, setPermission] = useState(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  useEffect(() => {
    if (!('Notification' in window)) return;
    const id = setTimeout(() => setPermission(Notification.permission));
    return () => clearTimeout(id);
  }, []);

  if (dismissed || permission !== 'default') return null;

  return (
    <div className="push-banner">
      <span>{t('enableNotifications')}</span>
      <button
        type="button"
        className="push-banner-accept"
        onClick={async () => {
          const result = await Notification.requestPermission();
          setPermission(result);
          if (result !== 'granted') setDismissed(true);
        }}
      >
        {t('enableBtn')}
      </button>
      <button
        type="button"
        className="push-banner-dismiss"
        onClick={() => setDismissed(true)}
        aria-label={t('dismissBtn')}
      >
        ×
      </button>
    </div>
  );
}