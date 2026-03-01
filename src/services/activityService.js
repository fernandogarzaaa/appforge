// Activity/Notification Service
// Manages all activity logging and notification events
import { telemetryService } from './telemetryService'

class ActivityService {
  constructor() {
    this.activities = []
    this.listeners = []
    this.loadFromStorage()
  }

  // Load activities from localStorage
  loadFromStorage() {
    const stored = localStorage.getItem('appforge_activities')
    if (stored) {
      try {
        this.activities = JSON.parse(stored).slice(-100) // Keep last 100
      } catch (e) {
        this.activities = []
      }
    }
  }

  // Save activities to localStorage
  saveToStorage() {
    try {
      localStorage.setItem('appforge_activities', JSON.stringify(this.activities.slice(-100)))
    } catch (e) {
      console.error('Failed to save activities:', e)
    }
  }

  // Log an activity event
  logActivity(activity) {
    const newActivity = {
      id: `activity-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      ...activity
    }

    // Add to beginning of array (most recent first)
    this.activities.unshift(newActivity)
    this.saveToStorage()
    this.notifyListeners(newActivity)
    telemetryService.reportActivity(newActivity)

    return newActivity
  }

  // Subscribe to activity updates
  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Notify all listeners of new activity
  notifyListeners(activity) {
    this.listeners.forEach(listener => listener(activity))
  }

  // Get all activities
  getActivities() {
    return this.activities
  }

  // Get activities by type
  getActivitiesByType(type) {
    return this.activities.filter(a => a.type === type)
  }

  // Get activities by user
  getActivitiesByUser(userId) {
    return this.activities.filter(a => a.userId === userId)
  }

  // Clear activities
  clearActivities() {
    this.activities = []
    this.saveToStorage()
  }

  // Get recent activities (last N)
  getRecentActivities(limit = 20) {
    return this.activities.slice(0, limit)
  }
}

// Export singleton instance
export const activityService = new ActivityService()

// Activity type constants
export const ActivityTypes = {
  // User actions
  USER_REGISTERED: 'user_registered',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_UPDATED_PROFILE: 'user_updated_profile',

  // Project actions
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',

  // Collaboration actions
  DOCUMENT_CREATED: 'document_created',
  DOCUMENT_UPDATED: 'document_updated',
  DOCUMENT_DELETED: 'document_deleted',
  DOCUMENT_SHARED: 'document_shared',

  // Quantum actions
  CIRCUIT_CREATED: 'circuit_created',
  CIRCUIT_EXECUTED: 'circuit_executed',

  // Team actions
  TEAM_MEMBER_ADDED: 'team_member_added',
  TEAM_MEMBER_REMOVED: 'team_member_removed',

  // Security actions
  ENCRYPTION_APPLIED: 'encryption_applied',
  DATA_EXPORTED: 'data_exported',
  DATA_DELETED: 'data_deleted',

  // System actions
  FEATURE_ENABLED: 'feature_enabled',
  ERROR_OCCURRED: 'error_occurred',
}

// Activity severity levels
export const ActivitySeverity = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
}

// Activity icon mapping
export const ActivityIcons = {
  user_registered: '👤',
  user_logged_in: '🔓',
  user_logged_out: '🔒',
  user_updated_profile: '✏️',
  project_created: '✨',
  project_updated: '🔄',
  project_deleted: '🗑️',
  document_created: '📄',
  document_updated: '📝',
  document_deleted: '❌',
  document_shared: '🔗',
  circuit_created: '⚛️',
  circuit_executed: '▶️',
  team_member_added: '👥',
  team_member_removed: '👤',
  encryption_applied: '🔐',
  data_exported: '📤',
  data_deleted: '💾',
  feature_enabled: '⚙️',
  error_occurred: '⚠️',
}
