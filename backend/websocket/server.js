/**
 * WebSocket Server
 * Real-time collaboration with Socket.io on port 5001
 * Handles session management and event broadcasting
 */

import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import { verifyJWT } from '../middleware/auth.js';
import { logger } from '../config/logger.js';
import RedisAdapter from './redisAdapter.js';
import SessionManager from './sessionManager.js';
import * as eventHandlers from './handlers/index.js';

let io = null;
let httpServer = null;
let sessionManager = null;

/**
 * Initialize WebSocket server
 */
export async function initializeWebSocketServer(port = 5001) {
  try {
    httpServer = createServer();

    io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'https://appforge.fun'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type']
      },
      path: process.env.WEBSOCKET_PATH || '/socket.io',
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
      maxHttpBufferSize: 1e6, // 1MB
      allowUpgrades: true
    });

    // Initialize session manager
    sessionManager = new SessionManager();

    // Set up Redis adapter for horizontal scaling
    if (process.env.REDIS_URL) {
      const redisAdapter = new RedisAdapter(process.env.REDIS_URL);
      await redisAdapter.connect();
      io.adapter(redisAdapter.getAdapter());
      logger.info('Redis adapter configured for WebSocket scaling');
    }

    // Authentication middleware
    io.use(authenticateSocket);

    // Connection handler
    io.on('connection', handleConnection);

    // Start listening
    httpServer.listen(port, () => {
      logger.info(`✅ WebSocket server running on port ${port}`);
    });

    return { io, httpServer, sessionManager };
  } catch (error) {
    logger.error('WebSocket server initialization failed:', error);
    throw error;
  }
}

/**
 * WebSocket authentication middleware
 */
async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('No authentication token'));
    }

    const decoded = await verifyJWT(token);
    socket.userId = decoded.id;
    socket.user = decoded;
    next();
  } catch (error) {
    logger.warn('WebSocket authentication failed:', error.message);
    next(new Error('Authentication failed'));
  }
}

/**
 * Handle new WebSocket connections
 */
function handleConnection(socket) {
  logger.info(`👤 User connected: ${socket.userId} (${socket.id})`);

  // Track user online status
  socket.emit('connect_success', {
    socketId: socket.id,
    userId: socket.userId,
    timestamp: new Date()
  });

  /**
   * Collaboration Events
   */

  // Join session/room
  socket.on('join-session', (data, callback) => {
    eventHandlers.joinSession(io, socket, sessionManager, data, callback);
  });

  // Leave session/room
  socket.on('leave-session', (data, callback) => {
    eventHandlers.leaveSession(io, socket, sessionManager, data, callback);
  });

  // Cursor position sync
  socket.on('cursor-update', (data) => {
    eventHandlers.cursorUpdate(io, socket, data);
  });

  // Code changes broadcast
  socket.on('code-change', (data, callback) => {
    eventHandlers.codeChange(io, socket, sessionManager, data, callback);
  });

  // Get session state
  socket.on('get-session-state', (data, callback) => {
    eventHandlers.getSessionState(sessionManager, data, callback);
  });

  /**
   * Error handling
   */
  socket.on('error', (error) => {
    logger.error(`WebSocket error for user ${socket.userId}:`, error);
  });

  /**
   * Disconnect handler
   */
  socket.on('disconnect', (reason) => {
    logger.info(`👤 User disconnected: ${socket.userId} (${reason})`);
    
    // Clean up sessions
    if (socket.sessionId) {
      sessionManager.leaveSession(socket.sessionId, socket.userId);
      io.to(socket.sessionId).emit('participant-left', {
        userId: socket.userId,
        username: socket.user?.username,
        timestamp: new Date()
      });
    }
  });

  /**
   * Heartbeat to detect dead connections
   */
  socket.on('pong', () => {
    socket.isAlive = true;
  });
}

/**
 * Broadcast event to specific room
 */
export function broadcastToRoom(roomId, eventName, data) {
  if (!io) throw new Error('WebSocket server not initialized');
  io.to(roomId).emit(eventName, data);
}

/**
 * Send event to specific user
 */
export function sendToUser(userId, eventName, data) {
  if (!io) throw new Error('WebSocket server not initialized');
  io.to(`user:${userId}`).emit(eventName, data);
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount() {
  if (!io) return 0;
  return io.engine.clientsCount;
}

/**
 * Get room participants
 */
export function getRoomParticipants(roomId) {
  if (!io) return [];
  return io.sockets.adapter.rooms.get(roomId)?.size || 0;
}

/**
 * Shutdown WebSocket server
 */
export async function shutdownWebSocketServer() {
  if (sessionManager) {
    await sessionManager.cleanup();
  }
  if (httpServer) {
    httpServer.close();
    logger.info('WebSocket server shutdown');
  }
}

// Graceful shutdown on process signals
process.on('SIGTERM', shutdownWebSocketServer);
process.on('SIGINT', shutdownWebSocketServer);

export default {
  initializeWebSocketServer,
  broadcastToRoom,
  sendToUser,
  getConnectedUsersCount,
  getRoomParticipants,
  shutdownWebSocketServer
};
