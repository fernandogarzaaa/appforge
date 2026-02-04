/**
 * WebSocket Session Manager
 * Manages collaborative sessions with state persistence in Redis
 */

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';

class SessionManager {
  constructor() {
    this.redis = null;
    this.sessions = new Map(); // Local cache for active sessions
    this.sessionTTL = parseInt(process.env.SESSION_TTL || 3600); // 1 hour default
    
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      
      this.redis.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });

      this.redis.on('connect', () => {
        logger.info('✅ Session Manager connected to Redis');
      });
    } catch (error) {
      logger.warn('Redis initialization failed, using local memory:', error.message);
      this.redis = null;
    }
  }

  /**
   * Create new session
   */
  async createSession(projectId, config = {}) {
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      projectId,
      participants: [],
      state: {
        code: config.initialCode || '',
        language: config.language || 'javascript',
        version: 1,
        lastModified: new Date()
      },
      settings: {
        maxParticipants: config.maxParticipants || 50,
        autoSave: config.autoSave !== false,
        saveInterval: config.saveInterval || 5000
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.sessionTTL * 1000)
    };

    try {
      // Store in Redis
      if (this.redis) {
        await this.redis.setex(
          `session:${sessionId}`,
          this.sessionTTL,
          JSON.stringify(session)
        );
        logger.info(`✅ Session created: ${sessionId}`);
      }

      // Store in local cache
      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Get session state
   */
  async getSession(sessionId) {
    try {
      let session;

      // Try Redis first
      if (this.redis) {
        const redisSession = await this.redis.get(`session:${sessionId}`);
        if (redisSession) {
          session = JSON.parse(redisSession);
        }
      }

      // Fallback to local cache
      if (!session) {
        session = this.sessions.get(sessionId);
      }

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      return session;
    } catch (error) {
      logger.error(`Failed to get session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Join session with user
   */
  async joinSession(sessionId, userId, userInfo = {}) {
    try {
      const session = await this.getSession(sessionId);

      // Check max participants
      if (session.participants.length >= session.settings.maxParticipants) {
        throw new Error('Session is full');
      }

      // Check if user already in session
      const existingParticipant = session.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        return session; // Already joined
      }

      // Add participant
      const participant = {
        userId,
        username: userInfo.username || `User-${userId.slice(0, 8)}`,
        avatar: userInfo.avatar,
        joinedAt: new Date(),
        cursor: { line: 0, column: 0 },
        selection: null,
        isActive: true
      };

      session.participants.push(participant);
      session.updatedAt = new Date();

      // Persist
      await this.updateSession(sessionId, session);

      logger.info(`👤 User ${userId} joined session ${sessionId}`);
      return session;
    } catch (error) {
      logger.error(`Failed to join session:`, error);
      throw error;
    }
  }

  /**
   * Leave session
   */
  async leaveSession(sessionId, userId) {
    try {
      const session = await this.getSession(sessionId);

      // Remove participant
      session.participants = session.participants.filter(p => p.userId !== userId);
      session.updatedAt = new Date();

      // Delete session if empty
      if (session.participants.length === 0) {
        await this.destroySession(sessionId);
        logger.info(`🗑️  Session destroyed (empty): ${sessionId}`);
        return null;
      }

      // Persist
      await this.updateSession(sessionId, session);

      logger.info(`👤 User ${userId} left session ${sessionId}`);
      return session;
    } catch (error) {
      logger.error(`Failed to leave session:`, error);
      throw error;
    }
  }

  /**
   * Update session state (code changes, etc)
   */
  async updateSessionState(sessionId, stateUpdates) {
    try {
      const session = await this.getSession(sessionId);

      // Update state
      session.state = {
        ...session.state,
        ...stateUpdates,
        version: (session.state.version || 0) + 1,
        lastModified: new Date()
      };

      await this.updateSession(sessionId, session);
      return session;
    } catch (error) {
      logger.error(`Failed to update session state:`, error);
      throw error;
    }
  }

  /**
   * Update participant cursor position
   */
  async updateParticipantCursor(sessionId, userId, cursor) {
    try {
      const session = await this.getSession(sessionId);

      const participant = session.participants.find(p => p.userId === userId);
      if (participant) {
        participant.cursor = cursor;
        participant.isActive = true;
        await this.updateSession(sessionId, session);
      }

      return session;
    } catch (error) {
      logger.error(`Failed to update cursor:`, error);
      throw error;
    }
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions() {
    try {
      const sessions = [];

      if (this.redis) {
        const keys = await this.redis.keys('session:*');
        for (const key of keys) {
          const data = await this.redis.get(key);
          if (data) {
            sessions.push(JSON.parse(data));
          }
        }
      } else {
        sessions.push(...this.sessions.values());
      }

      return sessions;
    } catch (error) {
      logger.error('Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Update session in storage
   */
  async updateSession(sessionId, session) {
    try {
      if (this.redis) {
        await this.redis.setex(
          `session:${sessionId}`,
          this.sessionTTL,
          JSON.stringify(session)
        );
      }

      this.sessions.set(sessionId, session);
    } catch (error) {
      logger.error(`Failed to update session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId) {
    try {
      if (this.redis) {
        await this.redis.del(`session:${sessionId}`);
      }

      this.sessions.delete(sessionId);
      logger.info(`🗑️  Session destroyed: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to destroy session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanup() {
    try {
      if (this.redis) {
        // Redis handles expiration automatically with TTL
        logger.info('Session cleanup completed');
      } else {
        // Clean up expired sessions from memory
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
          if (new Date(session.expiresAt).getTime() < now) {
            this.sessions.delete(sessionId);
          }
        }
      }
    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
  }

  /**
   * Get session statistics
   */
  async getStats() {
    try {
      const sessions = await this.getActiveSessions();
      
      return {
        totalSessions: sessions.length,
        totalParticipants: sessions.reduce((sum, s) => sum + s.participants.length, 0),
        sessionDetails: sessions.map(s => ({
          id: s.id,
          projectId: s.projectId,
          participants: s.participants.length,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt
        }))
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return {
        totalSessions: 0,
        totalParticipants: 0,
        sessionDetails: []
      };
    }
  }
}

export default SessionManager;
