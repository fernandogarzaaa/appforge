import React from 'react'
import { useActivity } from '@/contexts/ActivityContext'
import { Bell, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import ActivityCard from '@/components/ActivityCard'

/**
 * NotificationBell - Header notification bell with dropdown
 */
export function NotificationBell({ className = '' }) {
  const { activities, unreadCount, deleteActivity, markAsRead } = useActivity()
  const [isOpen, setIsOpen] = React.useState(false)

  // Get recent unread notifications (last 5)
  const recentNotifications = activities
    .filter(a => !a.read)
    .slice(0, 5)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold text-sm">
              Notifications {unreadCount > 0 && <span className="text-xs text-gray-500">({unreadCount})</span>}
            </h3>
          </div>

          {recentNotifications.length === 0 ? (
            <div className="p-6 text-center">
              {activities.length === 0 ? (
                <div className="space-y-2 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm">All caught up!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {recentNotifications.map(notification => (
                <div key={notification.id} className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800">
                  <ActivityCard
                    activity={notification}
                    onDelete={deleteActivity}
                    onRead={(id) => markAsRead([id])}
                  />
                </div>
              ))}
            </div>
          )}

          {activities.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 text-center">
              <a
                href="/notifications"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
