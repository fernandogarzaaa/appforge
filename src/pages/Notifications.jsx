// @ts-ignore - Component uses runtime base44.functions.execute API
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Settings, Trash2, CheckCheck, Mail, Smartphone, Globe } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Notifications() {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const queryClient = useQueryClient();

  // Get notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', showUnreadOnly],
    queryFn: async () => {
      const response = await base44.functions.execute('notificationCenter', {
        action: 'getAll',
        includeRead: !showUnreadOnly,
        includeArchived: false,
        limit: 50
      });
      return response.data;
    },
    refetchInterval: 5000
  });

  // Get preferences
  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await base44.functions.execute('notificationCenter', {
        action: 'getPreferences'
      });
      return response.data;
    }
  });

  // Get stats
  const { data: stats } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await base44.functions.execute('notificationCenter', {
        action: 'getStats'
      });
      return response.data;
    }
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId) => {
      await base44.functions.execute('notificationCenter', {
        action: 'markAsRead',
        notificationId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    }
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await base44.functions.execute('notificationCenter', {
        action: 'markAllAsRead'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    }
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId) => {
      await base44.functions.execute('notificationCenter', {
        action: 'delete',
        notificationId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    }
  });

  // Send test notification
  const sendTest = useMutation({
    mutationFn: async () => {
      await base44.functions.execute('notificationCenter', {
        action: 'testNotification'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Update preferences
  const updatePreferences = useMutation({
    mutationFn: async (newPrefs) => {
      await base44.functions.execute('notificationCenter', {
        action: 'updatePreferences',
        preferences: newPrefs
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    }
  });

  const getNotificationIcon = (type) => {
    const icons = {
      info: Bell,
      success: CheckCheck,
      warning: Bell,
      error: Bell
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colors = {
      info: 'border-blue-500 bg-blue-50',
      success: 'border-green-500 bg-green-50',
      warning: 'border-yellow-500 bg-yellow-50',
      error: 'border-red-500 bg-red-50'
    };
    return colors[type] || 'border-gray-500 bg-gray-50';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Center</h1>
        <p className="text-muted-foreground">
          Manage your notifications and preferences across email, SMS, and push channels.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.stats.unread}</div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.stats.byType?.success || 0}</div>
              <div className="text-sm text-muted-foreground">Success</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.stats.byType?.error || 0}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                >
                  {showUnreadOnly ? 'Show All' : 'Unread Only'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={notificationsData?.unread === 0}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {notificationsData?.notifications?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notificationsData?.notifications?.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`border-l-4 rounded-lg p-4 ${getNotificationColor(notification.type)} ${
                          !notification.read ? 'border-l-4' : 'opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5" />
                            <h3 className="font-semibold">{notification.title}</h3>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead.mutate(notification.id)}
                              >
                                <CheckCheck className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification.mutate(notification.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm mb-2">{notification.message}</p>

                        {notification.actionUrl && (
                          <Button variant="link" className="p-0 h-auto text-sm">
                            {notification.actionText || 'View Details'}
                          </Button>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{notification.category}</Badge>
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Channels</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences?.preferences?.email}
                    onChange={(e) => {
                      updatePreferences.mutate({
                        ...preferences.preferences,
                        email: e.target.checked
                      });
                    }}
                    className="rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm">SMS</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences?.preferences?.sms}
                    onChange={(e) => {
                      updatePreferences.mutate({
                        ...preferences.preferences,
                        sms: e.target.checked
                      });
                    }}
                    className="rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">Push</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences?.preferences?.push}
                    onChange={(e) => {
                      updatePreferences.mutate({
                        ...preferences.preferences,
                        push: e.target.checked
                      });
                    }}
                    className="rounded"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Categories</h4>
              <div className="space-y-2 text-sm">
                {preferences?.preferences?.categories && 
                  Object.entries(preferences.preferences.categories).map(([category, prefs]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="capitalize">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {Object.values(prefs).filter(Boolean).length} enabled
                      </Badge>
                    </div>
                  ))
                }
              </div>
            </div>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => sendTest.mutate()}
            >
              Send Test Notification
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
