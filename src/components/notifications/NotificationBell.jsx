import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Subscribe to real-time updates
      const unsubscribe = base44.entities.Notification.subscribe((event) => {
        if (event.type === 'create' && event.data?.user_id === user.email) {
          setNotifications(prev => [event.data, ...prev]);
          setUnreadCount(prev => prev + 1);
        } else if (event.type === 'update' && event.data?.user_id === user.email) {
          setNotifications(prev => 
            prev.map(n => n.id === event.id ? event.data : n)
          );
        }
      });

      return unsubscribe;
    }
  }, [user]);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const loadNotifications = async () => {
    try {
      const notifs = await base44.entities.Notification.filter(
        { user_id: user.email },
        '-created_date',
        20
      );
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await base44.entities.Notification.update(id, { is_read: true });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDismiss = async (id) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'payment_confirmation':
      case 'plan_upgrade':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'expiry_warning':
      case 'failed_payment':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'payment_confirmation':
      case 'plan_upgrade':
        return 'bg-green-50';
      case 'expiry_warning':
      case 'failed_payment':
        return 'bg-red-50';
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {showPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 transition-colors',
                    !notif.is_read && 'bg-blue-50'
                  )}
                >
                  <div className="flex gap-3">
                    {getIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(notif.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}