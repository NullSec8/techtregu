import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function useUnreadMessageCount(userId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;

    async function load() {
      try {
        const { data } = await api.get('/messages/unread-count');
        setCount(data.count ?? 0);
      } catch {
        setCount(0);
      }
    }

    load();
    const interval = setInterval(load, 45000);
    const onRefresh = () => load();
    window.addEventListener('focus', onRefresh);
    window.addEventListener('tt-messages-refresh', onRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onRefresh);
      window.removeEventListener('tt-messages-refresh', onRefresh);
    };
  }, [userId]);

  if (!userId) return 0;
  return count;
}
