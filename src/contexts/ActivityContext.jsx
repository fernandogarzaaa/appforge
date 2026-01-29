import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { activityService } from '@/services/activityService'

// Create Activity Context
const ActivityContext = createContext(null)

// Activity Provider Component
export function ActivityProvider({ children }) {
  const [activities, setActivities] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load initial activities
  useEffect(() => {
    setActivities(activityService.getActivities())
  }, [])

  // Subscribe to activity updates
  useEffect(() => {
    const unsubscribe = activityService.subscribe((newActivity) => {
      setActivities(prev => [newActivity, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    return unsubscribe
  }, [])

  // Mark activities as read
  const markAsRead = useCallback((activityIds = null) => {
    setActivities(prev =>
      prev.map(activity =>
        !activityIds || activityIds.includes(activity.id)
          ? { ...activity, read: true }
          : activity
      )
    )
    setUnreadCount(0)
  }, [])

  // Log a new activity
  const logActivity = useCallback((activity) => {
    return activityService.logActivity(activity)
  }, [])

  // Delete activity
  const deleteActivity = useCallback((activityId) => {
    setActivities(prev => prev.filter(a => a.id !== activityId))
  }, [])

  // Clear all activities
  const clearActivities = useCallback(() => {
    activityService.clearActivities()
    setActivities([])
    setUnreadCount(0)
  }, [])

  const value = {
    activities,
    unreadCount,
    markAsRead,
    logActivity,
    deleteActivity,
    clearActivities,
  }

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  )
}

// Hook to use Activity context
export function useActivity() {
  const context = useContext(ActivityContext)
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider')
  }
  return context
}
