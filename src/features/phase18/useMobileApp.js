import { useState, useCallback } from 'react';

/**
 * Hook for mobile app integration
 * @returns {Object} Mobile app utilities
 */
export const useMobileApp = () => {
  const [syncStatus, setSyncStatus] = useState({ lastSync: null, status: 'idle' });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const syncData = useCallback(async () => {
    setLoading(true);
    setSyncStatus({ lastSync: new Date().toISOString(), status: 'syncing' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSyncStatus({ lastSync: new Date().toISOString(), status: 'synced' });
    } finally {
      setLoading(false);
    }
  }, []);

  const sendPushNotification = useCallback(async (title, body) => {
    const notification = { id: Date.now(), title, body, sentAt: new Date().toISOString() };
    setNotifications(prev => [...prev, notification]);
    return notification;
  }, []);

  return { syncStatus, notifications, loading, syncData, sendPushNotification };
};
