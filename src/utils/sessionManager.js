/**
 * Advanced Session Management
 * Secure session handling with device tracking and anomaly detection
 */

export const SESSION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  SUSPENDED: 'suspended',
};

export const SESSION_EVENTS = {
  CREATED: 'session.created',
  RENEWED: 'session.renewed',
  EXPIRED: 'session.expired',
  REVOKED: 'session.revoked',
  ACTIVITY: 'session.activity',
  SUSPICIOUS: 'session.suspicious',
};

/**
 * Device fingerprint
 */
export class DeviceFingerprint {
  static generate(request) {
    const components = {
      userAgent: request.headers['user-agent'] || '',
      acceptLanguage: request.headers['accept-language'] || '',
      acceptEncoding: request.headers['accept-encoding'] || '',
      ip: request.ip || request.connection?.remoteAddress || '',
    };

    return {
      fingerprint: this._hash(JSON.stringify(components)),
      components,
      platform: this._parsePlatform(components.userAgent),
      browser: this._parseBrowser(components.userAgent),
      os: this._parseOS(components.userAgent),
    };
  }

  static _hash(data) {
    // Simplified hash - in production use crypto.createHash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  static _parsePlatform(userAgent) {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  static _parseBrowser(userAgent) {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  static _parseOS(userAgent) {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/ios/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }
}

/**
 * Session data
 */
export class Session {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.expiresAt = data.expiresAt;
    this.lastActivityAt = data.lastActivityAt || this.createdAt;
    this.status = data.status || SESSION_STATUS.ACTIVE;
    
    // Device information
    this.deviceFingerprint = data.deviceFingerprint;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.location = data.location; // GeoIP data
    
    // Session metadata
    this.metadata = data.metadata || {};
    this.activityCount = data.activityCount || 0;
    this.suspiciousActivityCount = data.suspiciousActivityCount || 0;
  }

  isExpired() {
    return new Date() > new Date(this.expiresAt);
  }

  isActive() {
    return this.status === SESSION_STATUS.ACTIVE && !this.isExpired();
  }

  updateActivity() {
    this.lastActivityAt = new Date().toISOString();
    this.activityCount++;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      lastActivityAt: this.lastActivityAt,
      status: this.status,
      deviceFingerprint: this.deviceFingerprint,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      location: this.location,
      metadata: this.metadata,
      activityCount: this.activityCount,
    };
  }
}

/**
 * Session Manager
 */
export class SessionManager {
  constructor(options = {}) {
    this.sessions = new Map();
    this.userSessions = new Map(); // userId -> Set of session IDs
    
    // Configuration
    this.sessionTTL = options.sessionTTL || 3600 * 24; // 24 hours in seconds
    this.idleTimeout = options.idleTimeout || 1800; // 30 minutes
    this.absoluteTimeout = options.absoluteTimeout || 3600 * 24 * 7; // 7 days
    this.maxSessionsPerUser = options.maxSessionsPerUser || 10;
    this.enableDeviceTracking = options.enableDeviceTracking !== false;
    this.enableAnomalyDetection = options.enableAnomalyDetection !== false;
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Create new session
   */
  async createSession(userId, request = {}) {
    const sessionId = this._generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTTL * 1000);

    // Get device fingerprint
    const device = this.enableDeviceTracking 
      ? DeviceFingerprint.generate(request)
      : null;

    // Create session
    const session = new Session({
      id: sessionId,
      userId,
      expiresAt: expiresAt.toISOString(),
      deviceFingerprint: device?.fingerprint,
      ipAddress: request.ip,
      userAgent: request.headers?.['user-agent'],
      location: await this._getLocation(request.ip),
      metadata: {
        platform: device?.platform,
        browser: device?.browser,
        os: device?.os,
      },
    });

    // Store session
    this.sessions.set(sessionId, session);

    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId).add(sessionId);

    // Enforce max sessions per user
    await this._enforceMaxSessions(userId);

    // Emit event
    this._emit(SESSION_EVENTS.CREATED, { session });

    return session;
  }

  /**
   * Get session
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if expired
    if (session.isExpired()) {
      this.expireSession(sessionId);
      return null;
    }

    // Check idle timeout
    const idleTime = Date.now() - new Date(session.lastActivityAt).getTime();
    if (idleTime > this.idleTimeout * 1000) {
      this.expireSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Validate and update session
   */
  async validateSession(sessionId, request = {}) {
    const session = this.getSession(sessionId);

    if (!session) {
      return { valid: false, reason: 'session_not_found' };
    }

    if (!session.isActive()) {
      return { valid: false, reason: 'session_inactive' };
    }

    // Update activity
    session.updateActivity();

    // Anomaly detection
    if (this.enableAnomalyDetection && request) {
      const anomaly = await this._detectAnomaly(session, request);
      if (anomaly.detected) {
        session.suspiciousActivityCount++;
        this._emit(SESSION_EVENTS.SUSPICIOUS, { session, anomaly });

        if (anomaly.severity === 'high') {
          await this.revokeSession(sessionId, 'suspicious_activity');
          return { valid: false, reason: 'suspicious_activity', anomaly };
        }
      }
    }

    this._emit(SESSION_EVENTS.ACTIVITY, { session });

    return { valid: true, session };
  }

  /**
   * Renew session
   */
  async renewSession(sessionId) {
    const session = this.getSession(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    const now = new Date();
    session.expiresAt = new Date(now.getTime() + this.sessionTTL * 1000).toISOString();
    session.updateActivity();

    this._emit(SESSION_EVENTS.RENEWED, { session });

    return session;
  }

  /**
   * Expire session
   */
  expireSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.status = SESSION_STATUS.EXPIRED;
      this._emit(SESSION_EVENTS.EXPIRED, { session });
      this._removeSession(sessionId);
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId, reason = 'user_logout') {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.status = SESSION_STATUS.REVOKED;
      session.metadata.revokeReason = reason;
      session.metadata.revokedAt = new Date().toISOString();
      
      this._emit(SESSION_EVENTS.REVOKED, { session, reason });
      this._removeSession(sessionId);
    }

    return { success: true };
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllUserSessions(userId, exceptSessionId = null) {
    const sessionIds = this.userSessions.get(userId);

    if (!sessionIds) {
      return { count: 0 };
    }

    let count = 0;
    for (const sessionId of sessionIds) {
      if (sessionId !== exceptSessionId) {
        await this.revokeSession(sessionId, 'revoke_all');
        count++;
      }
    }

    return { count };
  }

  /**
   * List user sessions
   */
  listUserSessions(userId) {
    const sessionIds = this.userSessions.get(userId);

    if (!sessionIds) {
      return [];
    }

    const sessions = [];
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && session.isActive()) {
        sessions.push(session.toJSON());
      }
    }

    return sessions;
  }

  /**
   * Get session statistics
   */
  getSessionStats(userId = null) {
    if (userId) {
      const sessions = this.listUserSessions(userId);
      return {
        total: sessions.length,
        active: sessions.filter(s => s.status === SESSION_STATUS.ACTIVE).length,
        devices: [...new Set(sessions.map(s => s.metadata?.platform))],
      };
    }

    return {
      total: this.sessions.size,
      active: Array.from(this.sessions.values())
        .filter(s => s.status === SESSION_STATUS.ACTIVE).length,
      users: this.userSessions.size,
    };
  }

  /**
   * Detect anomalies
   */
  async _detectAnomaly(session, request) {
    const anomalies = [];

    // Different IP address
    if (request.ip && request.ip !== session.ipAddress) {
      anomalies.push({
        type: 'ip_change',
        severity: 'medium',
        details: { from: session.ipAddress, to: request.ip },
      });
    }

    // Different device fingerprint
    if (this.enableDeviceTracking && request.headers) {
      const newDevice = DeviceFingerprint.generate(request);
      if (newDevice.fingerprint !== session.deviceFingerprint) {
        anomalies.push({
          type: 'device_change',
          severity: 'high',
          details: { 
            from: session.deviceFingerprint, 
            to: newDevice.fingerprint,
          },
        });
      }
    }

    // Impossible travel (IP geolocation)
    if (session.location && request.ip) {
      const newLocation = await this._getLocation(request.ip);
      if (newLocation && session.location) {
        const distance = this._calculateDistance(
          session.location.lat,
          session.location.lon,
          newLocation.lat,
          newLocation.lon
        );
        const timeDiff = (Date.now() - new Date(session.lastActivityAt).getTime()) / 1000 / 3600; // hours
        const speed = distance / timeDiff; // km/h

        if (speed > 1000) { // Impossible travel speed
          anomalies.push({
            type: 'impossible_travel',
            severity: 'high',
            details: { distance, timeDiff, speed },
          });
        }
      }
    }

    return {
      detected: anomalies.length > 0,
      anomalies,
      severity: anomalies.some(a => a.severity === 'high') ? 'high' : 'medium',
    };
  }

  /**
   * Get location from IP
   */
  async _getLocation(ip) {
    // Simplified geolocation - integrate with GeoIP service
    if (!ip || ip === '127.0.0.1' || ip === 'localhost') {
      return null;
    }

    // Mock location data
    return {
      ip,
      country: 'US',
      city: 'San Francisco',
      lat: 37.7749,
      lon: -122.4194,
    };
  }

  /**
   * Calculate distance between coordinates (Haversine formula)
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  _toRad(degrees) {
    return degrees * Math.PI / 180;
  }

  /**
   * Enforce max sessions per user
   */
  async _enforceMaxSessions(userId) {
    const sessionIds = this.userSessions.get(userId);

    if (!sessionIds || sessionIds.size <= this.maxSessionsPerUser) {
      return;
    }

    // Get all sessions sorted by last activity
    const sessions = Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(s => s)
      .sort((a, b) => 
        new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime()
      );

    // Revoke oldest sessions
    const toRevoke = sessions.slice(0, sessions.length - this.maxSessionsPerUser);
    for (const session of toRevoke) {
      await this.revokeSession(session.id, 'max_sessions_exceeded');
    }
  }

  /**
   * Remove session from storage
   */
  _removeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      const userSessionIds = this.userSessions.get(session.userId);
      if (userSessionIds) {
        userSessionIds.delete(sessionId);
        if (userSessionIds.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Generate session ID
   */
  _generateSessionId() {
    // Generate cryptographically secure random ID
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Start cleanup interval
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this._cleanupExpiredSessions();
    }, 60000); // Run every minute
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Cleanup expired sessions
   */
  _cleanupExpiredSessions() {
    const now = Date.now();
    const toRemove = [];

    for (const [sessionId, session] of this.sessions) {
      if (session.isExpired() || 
          session.status !== SESSION_STATUS.ACTIVE) {
        toRemove.push(sessionId);
      }
    }

    for (const sessionId of toRemove) {
      this._removeSession(sessionId);
    }

    return toRemove.length;
  }

  /**
   * Event management
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  _emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

export default SessionManager;
