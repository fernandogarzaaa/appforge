/**
 * Notification Center
 * Centralized notification system with preferences and multiple channels
 */

// deno-lint-ignore-file no-explicit-any
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Notification storage (use database in production)
const notifications: Notification[] = [];
const userPreferences = new Map();

interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  category: string;
  actionUrl?: string;
  actionText?: string;
  read: boolean;
  archived: boolean;
  createdAt: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

interface NotificationPreferences {
  userId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  categories: {
    [key: string]: {
      email: boolean;
      sms: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    switch (action) {
      case 'create': {
        const { type, title, message, category, actionUrl, actionText, metadata } = await req.json();

        if (!title || !message) {
          return Response.json({ error: 'Title and message required' }, { status: 400 });
        }

        const notification: Notification = {
          id: crypto.randomUUID(),
          userId: user.id,
          type: type || 'info',
          title,
          message,
          category: category || 'general',
          actionUrl,
          actionText,
          read: false,
          archived: false,
          createdAt: new Date(),
          metadata
        };

        notifications.push(notification);

        // Send via enabled channels
        await sendNotification(user, notification);

        return Response.json({ 
          success: true, 
          notificationId: notification.id 
        }, { status: 200 });
      }

      case 'getAll': {
        const { includeRead, includeArchived, limit, offset } = await req.json();

        let userNotifications = notifications.filter(n => n.userId === user.id);

        if (!includeRead) {
          userNotifications = userNotifications.filter(n => !n.read);
        }

        if (!includeArchived) {
          userNotifications = userNotifications.filter(n => !n.archived);
        }

        // Sort by date descending
        userNotifications.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );

        // Pagination
        const total = userNotifications.length;
        const start = offset || 0;
        const end = start + (limit || 50);
        const paginated = userNotifications.slice(start, end);

        return Response.json({
          notifications: paginated,
          total,
          unread: userNotifications.filter(n => !n.read).length
        }, { status: 200 });
      }

      case 'markAsRead': {
        const { notificationId, notificationIds } = await req.json();

        const ids = notificationIds || [notificationId];

        ids.forEach((id: string) => {
          const notification = notifications.find(n => 
            n.id === id && n.userId === user.id
          );

          if (notification) {
            notification.read = true;
            notification.readAt = new Date();
          }
        });

        return Response.json({ success: true }, { status: 200 });
      }

      case 'markAllAsRead': {
        notifications.forEach(n => {
          if (n.userId === user.id && !n.read) {
            n.read = true;
            n.readAt = new Date();
          }
        });

        return Response.json({ success: true }, { status: 200 });
      }

      case 'archive': {
        const { notificationId } = await req.json();

        const notification = notifications.find(n => 
          n.id === notificationId && n.userId === user.id
        );

        if (notification) {
          notification.archived = true;
        }

        return Response.json({ success: true }, { status: 200 });
      }

      case 'delete': {
        const { notificationId } = await req.json();

        const index = notifications.findIndex(n => 
          n.id === notificationId && n.userId === user.id
        );

        if (index !== -1) {
          notifications.splice(index, 1);
        }

        return Response.json({ success: true }, { status: 200 });
      }

      case 'getPreferences': {
        let prefs = userPreferences.get(user.id);

        if (!prefs) {
          prefs = {
            userId: user.id,
            email: true,
            sms: false,
            push: true,
            categories: {
              general: { email: true, sms: false, push: true, inApp: true },
              payment: { email: true, sms: true, push: true, inApp: true },
              security: { email: true, sms: true, push: true, inApp: true },
              updates: { email: true, sms: false, push: false, inApp: true },
              collaboration: { email: false, sms: false, push: true, inApp: true }
            }
          };
          userPreferences.set(user.id, prefs);
        }

        return Response.json({ preferences: prefs }, { status: 200 });
      }

      case 'updatePreferences': {
        const { preferences } = await req.json();

        if (!preferences) {
          return Response.json({ error: 'Preferences required' }, { status: 400 });
        }

        userPreferences.set(user.id, {
          ...preferences,
          userId: user.id
        });

        return Response.json({ success: true }, { status: 200 });
      }

      case 'getStats': {
        const userNotifications = notifications.filter(n => n.userId === user.id);

        const stats = {
          total: userNotifications.length,
          unread: userNotifications.filter(n => !n.read).length,
          archived: userNotifications.filter(n => n.archived).length,
          byType: {
            info: userNotifications.filter(n => n.type === 'info').length,
            success: userNotifications.filter(n => n.type === 'success').length,
            warning: userNotifications.filter(n => n.type === 'warning').length,
            error: userNotifications.filter(n => n.type === 'error').length
          },
          byCategory: {}
        };

        userNotifications.forEach(n => {
          stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1;
        });

        return Response.json({ stats }, { status: 200 });
      }

      case 'testNotification': {
        // Send test notification
        const testNotification: Notification = {
          id: crypto.randomUUID(),
          userId: user.id,
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification to verify your notification settings.',
          category: 'general',
          read: false,
          archived: false,
          createdAt: new Date()
        };

        notifications.push(testNotification);
        await sendNotification(user, testNotification);

        return Response.json({ 
          success: true,
          message: 'Test notification sent'
        }, { status: 200 });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Send notification via enabled channels
 */
async function sendNotification(user: any, notification: Notification) {
  const prefs = userPreferences.get(user.id);

  if (!prefs) return;

  const categoryPrefs = prefs.categories[notification.category] || {};

  // Send via email
  if (prefs.email && categoryPrefs.email) {
    // In production, send actual email
    console.log(`Sending email to ${user.email}:`, notification.title);
  }

  // Send via SMS
  if (prefs.sms && categoryPrefs.sms) {
    // In production, send actual SMS
    console.log(`Sending SMS to ${user.phone}:`, notification.title);
  }

  // Send push notification
  if (prefs.push && categoryPrefs.push) {
    // In production, send actual push notification
    console.log(`Sending push to ${user.id}:`, notification.title);
  }
}

// Cleanup old notifications every day
setInterval(() => {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Remove archived notifications older than 1 month
  const validNotifications = notifications.filter(n => 
    !n.archived || n.createdAt >= monthAgo
  );

  notifications.length = 0;
  notifications.push(...validNotifications);
}, 24 * 60 * 60 * 1000);
