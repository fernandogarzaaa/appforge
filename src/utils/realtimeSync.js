/**
 * @fileoverview Real-time Collaboration System
 * Enables WebSocket-based real-time collaboration with presence tracking
 * @module realtimeSync
 */

/**
 * @typedef {Object} PresenceData
 * @property {string} userId - User ID
 * @property {string} userName - User name
 * @property {string} status - Online/offline/idle
 * @property {number} lastSeen - Last activity timestamp
 * @property {Object} cursor - Cursor position {x, y}
 * @property {string} color - User color
 * @property {Object} activeDocument - Current document {id, type}
 */

/**
 * @typedef {Object} Change
 * @property {string} id - Change ID
 * @property {string} userId - User who made change
 * @property {string} type - Change type (insert, delete, update)
 * @property {any} data - Change data
 * @property {number} timestamp - Change timestamp
 * @property {number} version - Document version
 */

/**
 * @typedef {Object} Activity
 * @property {string} id - Activity ID
 * @property {string} userId - User ID
 * @property {string} action - Action type
 * @property {string} description - Human-readable description
 * @property {number} timestamp - Activity timestamp
 */

// =======================
// Real-time Sync Manager
// =======================

class RealtimeSyncManager {
  constructor() {
    this.userId = null
    this.userColor = this.generateUserColor()
    this.presenceMap = new Map() // userId -> PresenceData
    this.changes = [] // Change history
    this.activities = [] // Activity log
    this.subscribers = new Map() // eventType -> callbacks
    this.documentVersions = new Map() // documentId -> version
    this.changeBuffer = [] // Pending changes
    this.syncInterval = null
    this.heartbeatInterval = null
    this.lastSyncTime = Date.now()
    this.conflictResolver = new ConflictResolver()
    this.changeTimestamps = new Map() // Track change timestamps
  }

  /**
   * Initialize real-time sync
   * @param {string} userId - Current user ID
   * @param {string} userName - Current user name
   * @param {Function} onPresenceUpdate - Presence update callback
   */
  initialize(userId, userName, onPresenceUpdate) {
    this.userId = userId
    this.userName = userName
    this.onPresenceUpdate = onPresenceUpdate

    // Initialize own presence
    this.presenceMap.set(userId, {
      userId,
      userName,
      status: 'online',
      lastSeen: Date.now(),
      cursor: { x: 0, y: 0 },
      color: this.userColor,
      activeDocument: null
    })

    // Start heartbeat
    this.startHeartbeat()
    this.startSyncLoop()

    this.emit('initialized', { userId, userName })
  }

  /**
   * Generate consistent user color
   * @private
   * @returns {string} Hex color
   */
  generateUserColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * Update presence status
   * @param {string} status - Status (online/offline/idle)
   * @param {Object} additionalData - Additional presence data
   */
  updatePresence(status, additionalData = {}) {
    const presence = this.presenceMap.get(this.userId) || {}
    const updated = {
      ...presence,
      status,
      lastSeen: Date.now(),
      ...additionalData
    }
    this.presenceMap.set(this.userId, updated)

    this.emit('presence-changed', {
      userId: this.userId,
      presence: updated
    })
  }

  /**
   * Update cursor position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updateCursor(x, y) {
    const presence = this.presenceMap.get(this.userId)
    if (presence) {
      presence.cursor = { x, y }
      this.emit('cursor-moved', {
        userId: this.userId,
        cursor: { x, y }
      })
    }
  }

  /**
   * Set active document
   * @param {string} documentId - Document ID
   * @param {string} documentType - Document type
   */
  setActiveDocument(documentId, documentType) {
    const presence = this.presenceMap.get(this.userId)
    if (presence) {
      presence.activeDocument = { id: documentId, type: documentType }
      this.updatePresence('online')
    }
  }

  /**
   * Get all online users
   * @returns {PresenceData[]} Online users
   */
  getOnlineUsers() {
    return Array.from(this.presenceMap.values()).filter(p => p.status === 'online')
  }

  /**
   * Get users viewing same document
   * @param {string} documentId - Document ID
   * @returns {PresenceData[]} Co-viewers
   */
  getDocumentViewers(documentId) {
    return this.getOnlineUsers().filter(p => p.activeDocument?.id === documentId)
  }

  /**
   * Record a change
   * @param {string} documentId - Document ID
   * @param {string} changeType - Change type
   * @param {any} data - Change data
   * @returns {Change} Recorded change
   */
  recordChange(documentId, changeType, data) {
    const change = {
      id: this.generateId(),
      userId: this.userId,
      type: changeType,
      data,
      timestamp: Date.now(),
      version: (this.documentVersions.get(documentId) || 0) + 1,
      documentId
    }

    this.changes.push(change)
    this.documentVersions.set(documentId, change.version)
    this.changeBuffer.push(change)
    this.changeTimestamps.set(change.id, change.timestamp)

    this.emit('change-recorded', change)
    return change
  }

  /**
   * Apply change from another user
   * @param {Change} change - Change to apply
   * @param {any} currentState - Current document state
   * @returns {Object} Resolution result
   */
  applyRemoteChange(change, currentState) {
    const resolution = this.conflictResolver.resolve(
      change,
      this.getRecentChanges(change.documentId),
      currentState
    )

    if (resolution.accepted) {
      this.changes.push(change)
      const docVersion = this.documentVersions.get(change.documentId) || 0
      this.documentVersions.set(change.documentId, Math.max(docVersion, change.version))
    }

    this.emit('remote-change', { change, resolution })
    return resolution
  }

  /**
   * Get change history for document
   * @param {string} documentId - Document ID
   * @param {Object} options - Query options
   * @returns {Change[]} Filtered changes
   */
  getChangeHistory(documentId, options = {}) {
    let changes = this.changes.filter(c => c.documentId === documentId)

    if (options.since) {
      changes = changes.filter(c => c.timestamp >= options.since)
    }

    if (options.userId) {
      changes = changes.filter(c => c.userId === options.userId)
    }

    if (options.limit) {
      changes = changes.slice(-options.limit)
    }

    return changes
  }

  /**
   * Get recent changes
   * @param {string} documentId - Document ID
   * @param {number} timeWindow - Time window in ms
   * @returns {Change[]} Recent changes
   */
  getRecentChanges(documentId, timeWindow = 5000) {
    const cutoff = Date.now() - timeWindow
    return this.changes.filter(c =>
      c.documentId === documentId && c.timestamp >= cutoff
    )
  }

  /**
   * Record activity
   * @param {string} action - Action type
   * @param {string} description - Description
   * @param {Object} metadata - Additional metadata
   * @returns {Activity} Recorded activity
   */
  recordActivity(action, description, metadata = {}) {
    const activity = {
      id: this.generateId(),
      userId: this.userId,
      action,
      description,
      timestamp: Date.now(),
      ...metadata
    }

    this.activities.push(activity)
    this.emit('activity', activity)
    return activity
  }

  /**
   * Get activity log
   * @param {Object} options - Query options
   * @returns {Activity[]} Filtered activities
   */
  getActivityLog(options = {}) {
    let activities = [...this.activities]

    if (options.since) {
      activities = activities.filter(a => a.timestamp >= options.since)
    }

    if (options.userId) {
      activities = activities.filter(a => a.userId === options.userId)
    }

    if (options.action) {
      activities = activities.filter(a => a.action === options.action)
    }

    if (options.limit) {
      activities = activities.slice(-options.limit)
    }

    return activities
  }

  /**
   * Start sync loop
   * @private
   */
  startSyncLoop() {
    this.syncInterval = setInterval(() => {
      if (this.changeBuffer.length > 0) {
        const batch = this.changeBuffer.splice(0, 50) // Batch changes
        this.emit('sync-batch', {
          changes: batch,
          timestamp: Date.now()
        })
        this.lastSyncTime = Date.now()
      }
    }, 1000) // Sync every second
  }

  /**
   * Start heartbeat
   * @private
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.updatePresence('online', {
        heartbeat: true
      })
      
      // Check for idle users
      this.presenceMap.forEach((presence, userId) => {
        if (userId !== this.userId) {
          const idleTime = Date.now() - presence.lastSeen
          if (idleTime > 300000) { // 5 minutes
            presence.status = 'offline'
          } else if (idleTime > 60000) { // 1 minute
            presence.status = 'idle'
          }
        }
      })
    }, 30000) // Every 30 seconds
  }

  /**
   * Get collaboration stats
   * @returns {Object} Collaboration statistics
   */
  getStats() {
    return {
      totalUsers: this.presenceMap.size,
      onlineUsers: this.getOnlineUsers().length,
      totalChanges: this.changes.length,
      totalActivities: this.activities.length,
      lastSyncTime: this.lastSyncTime,
      uptime: Date.now() - (this.startTime || Date.now())
    }
  }

  /**
   * Event subscription
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, [])
    }
    this.subscribers.get(eventType).push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit event
   * @private
   * @param {string} eventType - Event type
   * @param {any} data - Event data
   */
  emit(eventType, data) {
    if (this.subscribers.has(eventType)) {
      this.subscribers.get(eventType).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${eventType} callback:`, error)
        }
      })
    }
  }

  /**
   * Generate unique ID
   * @private
   * @returns {string} Unique ID
   */
  generateId() {
    return `${this.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Cleanup
   */
  destroy() {
    clearInterval(this.syncInterval)
    clearInterval(this.heartbeatInterval)
    this.subscribers.clear()
    this.updatePresence('offline')
  }
}

// =======================
// Conflict Resolver
// =======================

class ConflictResolver {
  /**
   * Resolve conflict between changes
   * @param {Change} incomingChange - Incoming change
   * @param {Change[]} recentChanges - Recent changes
   * @param {any} currentState - Current state
   * @returns {Object} Resolution result
   */
  resolve(incomingChange, recentChanges, currentState) {
    // Check for conflicts
    const conflicts = recentChanges.filter(c =>
      this.hasConflict(c, incomingChange)
    )

    if (conflicts.length === 0) {
      return {
        accepted: true,
        conflicts: [],
        resolution: 'accepted'
      }
    }

    // Apply conflict resolution strategy
    const resolution = this.resolveByTimestamp(incomingChange, conflicts)

    return {
      accepted: resolution.accepted,
      conflicts: conflicts.map(c => c.id),
      resolution: resolution.strategy
    }
  }

  /**
   * Check if two changes conflict
   * @private
   * @param {Change} change1 - First change
   * @param {Change} change2 - Second change
   * @returns {boolean} True if conflicting
   */
  hasConflict(change1, change2) {
    // Same document and overlapping operations
    if (change1.documentId !== change2.documentId) {
      return false
    }

    // If both modify same data path
    const path1 = change1.data?.path || change1.data?.id
    const path2 = change2.data?.path || change2.data?.id

    return path1 && path2 && path1 === path2
  }

  /**
   * Resolve by timestamp (last-write-wins)
   * @private
   * @param {Change} incoming - Incoming change
   * @param {Change[]} recent - Recent changes
   * @returns {Object} Resolution
   */
  resolveByTimestamp(incoming, recent) {
    const latest = recent.reduce((prev, curr) =>
      curr.timestamp > prev.timestamp ? curr : prev
    )

    return {
      accepted: incoming.timestamp > latest.timestamp,
      strategy: incoming.timestamp > latest.timestamp ? 'accepted' : 'rejected'
    }
  }
}

// =======================
// Exports
// =======================

export const realtimeSync = new RealtimeSyncManager()

export function createRealtimeSyncManager() {
  return new RealtimeSyncManager()
}

export { ConflictResolver }

export default {
  realtimeSync,
  createRealtimeSyncManager,
  RealtimeSyncManager,
  ConflictResolver
}
