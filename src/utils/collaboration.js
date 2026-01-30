/**
 * Team Collaboration System
 * Real-time presence, activity tracking, and team communication
 */

// In-memory collaboration store
const collaborationStore = {
  users: new Map(), // userId -> user presence
  activities: [], // Activity feed
  mentions: new Map(), // userId -> mentions
  rooms: new Map(), // roomId -> room data
  cursors: new Map(), // userId -> cursor position
  subscribers: new Set()
};

/**
 * UserPresence - Track user online status and activity
 */
export class UserPresence {
  /**
   * Set user online status
   * @param {string} userId - User ID
   * @param {Object} data - User data
   */
  static setOnline(userId, data = {}) {
    const presence = {
      userId,
      status: 'online',
      lastSeen: new Date().toISOString(),
      currentPage: data.currentPage || '',
      currentProject: data.currentProject || '',
      avatar: data.avatar || '',
      name: data.name || userId,
      metadata: data.metadata || {}
    };

    collaborationStore.users.set(userId, presence);
    this._notify();
    return presence;
  }

  /**
   * Set user away status
   * @param {string} userId - User ID
   */
  static setAway(userId) {
    const user = collaborationStore.users.get(userId);
    if (user) {
      user.status = 'away';
      user.lastSeen = new Date().toISOString();
      this._notify();
    }
  }

  /**
   * Set user offline status
   * @param {string} userId - User ID
   */
  static setOffline(userId) {
    const user = collaborationStore.users.get(userId);
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date().toISOString();
      this._notify();
    }
  }

  /**
   * Get all online users
   * @returns {Array} Online users
   */
  static getOnlineUsers() {
    return Array.from(collaborationStore.users.values())
      .filter(u => u.status === 'online');
  }

  /**
   * Get users by project
   * @param {string} projectId - Project ID
   * @returns {Array} Users in project
   */
  static getUsersInProject(projectId) {
    return Array.from(collaborationStore.users.values())
      .filter(u => u.currentProject === projectId);
  }

  /**
   * Update user cursor position
   * @param {string} userId - User ID
   * @param {Object} position - Cursor position {x, y, element}
   */
  static updateCursor(userId, position) {
    collaborationStore.cursors.set(userId, {
      userId,
      position,
      timestamp: Date.now()
    });
    this._notify();
  }

  /**
   * Get all cursors
   * @returns {Array} Cursor positions
   */
  static getCursors() {
    return Array.from(collaborationStore.cursors.values());
  }

  static subscribe(callback) {
    collaborationStore.subscribers.add(callback);
    return () => collaborationStore.subscribers.delete(callback);
  }

  static _notify() {
    collaborationStore.subscribers.forEach(callback => callback());
  }
}

/**
 * ActivityFeed - Track team activities
 */
export class ActivityFeed {
  /**
   * Log an activity
   * @param {Object} activity - Activity data
   */
  static logActivity(activity) {
    const entry = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: activity.userId,
      userName: activity.userName,
      type: activity.type, // 'edit', 'create', 'delete', 'comment', 'deploy'
      action: activity.action,
      target: activity.target, // What was affected
      timestamp: new Date().toISOString(),
      metadata: activity.metadata || {}
    };

    collaborationStore.activities.unshift(entry);

    // Keep only last 1000 activities
    if (collaborationStore.activities.length > 1000) {
      collaborationStore.activities = collaborationStore.activities.slice(0, 1000);
    }

    UserPresence._notify();
    return entry;
  }

  /**
   * Get activities
   * @param {Object} options - Filter options
   * @returns {Array} Activities
   */
  static getActivities(options = {}) {
    let activities = [...collaborationStore.activities];

    // Filter by user
    if (options.userId) {
      activities = activities.filter(a => a.userId === options.userId);
    }

    // Filter by type
    if (options.type) {
      activities = activities.filter(a => a.type === options.type);
    }

    // Filter by project
    if (options.projectId) {
      activities = activities.filter(a => a.metadata?.projectId === options.projectId);
    }

    // Filter by time range
    if (options.since) {
      const sinceDate = new Date(options.since);
      activities = activities.filter(a => new Date(a.timestamp) >= sinceDate);
    }

    // Limit results
    const limit = options.limit || 50;
    return activities.slice(0, limit);
  }

  /**
   * Get activity statistics
   * @param {string} projectId - Project ID (optional)
   * @returns {Object} Activity stats
   */
  static getStats(projectId = null) {
    let activities = collaborationStore.activities;
    
    if (projectId) {
      activities = activities.filter(a => a.metadata?.projectId === projectId);
    }

    const stats = {
      total: activities.length,
      byType: {},
      byUser: {},
      today: 0,
      thisWeek: 0
    };

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    activities.forEach(activity => {
      // By type
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;

      // By user
      stats.byUser[activity.userId] = (stats.byUser[activity.userId] || 0) + 1;

      // Time-based
      const activityTime = new Date(activity.timestamp).getTime();
      if (now - activityTime < dayMs) stats.today++;
      if (now - activityTime < weekMs) stats.thisWeek++;
    });

    return stats;
  }
}

/**
 * Mentions - Handle @mentions and notifications
 */
export class Mentions {
  /**
   * Create a mention
   * @param {Object} mention - Mention data
   */
  static create(mention) {
    const entry = {
      id: `mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId: mention.fromUserId,
      fromUserName: mention.fromUserName,
      toUserId: mention.toUserId,
      context: mention.context, // 'comment', 'chat', 'document'
      message: mention.message,
      link: mention.link, // Where to go when clicked
      timestamp: new Date().toISOString(),
      read: false
    };

    if (!collaborationStore.mentions.has(mention.toUserId)) {
      collaborationStore.mentions.set(mention.toUserId, []);
    }

    collaborationStore.mentions.get(mention.toUserId).unshift(entry);
    UserPresence._notify();
    return entry;
  }

  /**
   * Get mentions for user
   * @param {string} userId - User ID
   * @param {boolean} unreadOnly - Only unread mentions
   * @returns {Array} Mentions
   */
  static getMentions(userId, unreadOnly = false) {
    const userMentions = collaborationStore.mentions.get(userId) || [];
    
    if (unreadOnly) {
      return userMentions.filter(m => !m.read);
    }

    return userMentions;
  }

  /**
   * Mark mention as read
   * @param {string} mentionId - Mention ID
   */
  static markAsRead(mentionId) {
    collaborationStore.mentions.forEach(mentions => {
      const mention = mentions.find(m => m.id === mentionId);
      if (mention) {
        mention.read = true;
        UserPresence._notify();
      }
    });
  }

  /**
   * Mark all mentions as read for user
   * @param {string} userId - User ID
   */
  static markAllAsRead(userId) {
    const mentions = collaborationStore.mentions.get(userId);
    if (mentions) {
      mentions.forEach(m => m.read = true);
      UserPresence._notify();
    }
  }

  /**
   * Get unread count
   * @param {string} userId - User ID
   * @returns {number} Unread count
   */
  static getUnreadCount(userId) {
    const mentions = collaborationStore.mentions.get(userId) || [];
    return mentions.filter(m => !m.read).length;
  }
}

/**
 * CollaborativeRoom - Shared workspace for real-time collaboration
 */
export class CollaborativeRoom {
  /**
   * Create or join a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   */
  static join(roomId, userId, userData = {}) {
    if (!collaborationStore.rooms.has(roomId)) {
      collaborationStore.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        messages: [],
        sharedState: {},
        createdAt: new Date().toISOString()
      });
    }

    const room = collaborationStore.rooms.get(roomId);
    room.users.set(userId, {
      userId,
      name: userData.name || userId,
      avatar: userData.avatar,
      joinedAt: new Date().toISOString()
    });

    UserPresence._notify();
    return room;
  }

  /**
   * Leave a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   */
  static leave(roomId, userId) {
    const room = collaborationStore.rooms.get(roomId);
    if (room) {
      room.users.delete(userId);

      // Delete room if empty
      if (room.users.size === 0) {
        collaborationStore.rooms.delete(roomId);
      }

      UserPresence._notify();
    }
  }

  /**
   * Send message to room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @param {string} message - Message content
   */
  static sendMessage(roomId, userId, message) {
    const room = collaborationStore.rooms.get(roomId);
    if (!room) return null;

    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      message,
      timestamp: new Date().toISOString()
    };

    room.messages.push(msg);

    // Keep only last 100 messages
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    UserPresence._notify();
    return msg;
  }

  /**
   * Get room data
   * @param {string} roomId - Room ID
   * @returns {Object} Room data
   */
  static getRoom(roomId) {
    return collaborationStore.rooms.get(roomId);
  }

  /**
   * Get all rooms
   * @returns {Array} All rooms
   */
  static getAllRooms() {
    return Array.from(collaborationStore.rooms.values());
  }

  /**
   * Update shared state in room
   * @param {string} roomId - Room ID
   * @param {string} key - State key
   * @param {*} value - State value
   */
  static updateSharedState(roomId, key, value) {
    const room = collaborationStore.rooms.get(roomId);
    if (room) {
      room.sharedState[key] = value;
      UserPresence._notify();
    }
  }

  /**
   * Get shared state
   * @param {string} roomId - Room ID
   * @returns {Object} Shared state
   */
  static getSharedState(roomId) {
    const room = collaborationStore.rooms.get(roomId);
    return room ? room.sharedState : {};
  }
}

/**
 * Clear all collaboration data
 */
export function clearCollaborationData() {
  collaborationStore.users.clear();
  collaborationStore.activities = [];
  collaborationStore.mentions.clear();
  collaborationStore.rooms.clear();
  collaborationStore.cursors.clear();
  UserPresence._notify();
}

export default {
  UserPresence,
  ActivityFeed,
  Mentions,
  CollaborativeRoom,
  clearCollaborationData
};
