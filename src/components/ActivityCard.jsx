import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Clock, User, CheckCircle2 } from 'lucide-react'
import { ActivityIcons, ActivitySeverity } from '@/services/activityService'
import { formatDistanceToNow } from 'date-fns'

/**
 * ActivityCard - Individual activity/notification item
 */
export function ActivityCard({ activity, onDelete, onRead }) {
  const icon = ActivityIcons[activity.type] || '📌'
  
  // Determine severity color
  const getSeverityColor = () => {
    switch (activity.severity) {
      case ActivitySeverity.SUCCESS:
        return 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
      case ActivitySeverity.ERROR:
        return 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
      case ActivitySeverity.WARNING:
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400'
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400'
    }
  }

  const timeAgo = activity.timestamp
    ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
    : 'Just now'

  return (
    <div className={`p-3 rounded-lg border transition-colors ${getSeverityColor()}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 flex-1">
          {/* Activity Icon */}
          <div className="text-xl flex-shrink-0 mt-0.5">{icon}</div>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm">{activity.title}</h4>
              {!activity.read && (
                <Badge variant="secondary" className="text-xs">New</Badge>
              )}
              {activity.badge && (
                <Badge variant="outline" className="text-xs">{activity.badge}</Badge>
              )}
            </div>

            <p className="text-sm mt-1 opacity-90">{activity.description}</p>

            {/* Activity Metadata */}
            <div className="flex items-center gap-3 mt-2 text-xs opacity-75 flex-wrap">
              {activity.userId && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{activity.userName || activity.userId}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          {!activity.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRead?.(activity.id)}
              title="Mark as read"
              className="h-7 w-7 p-0"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(activity.id)}
            title="Delete activity"
            className="h-7 w-7 p-0 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ActivityCard
