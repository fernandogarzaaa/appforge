import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logAudit } from './utils/auditLogger.js';

/**
 * WebSocket server for real-time collaboration
 */
export class WebSocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.users = new Map(); // Map of socket.id -> user data
    this.rooms = new Map(); // Map of roomId -> Set of socket.ids
    this.presence = new Map(); // Map of userId -> presence status

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userEmail = decoded.email;
        socket.userName = decoded.name;

        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId} (${socket.id})`);

      // Store user data
      this.users.set(socket.id, {
        userId: socket.userId,
        email: socket.userEmail,
        name: socket.userName,
        connectedAt: new Date()
      });

      // Update presence
      this.updatePresence(socket.userId, 'online');

      // Handle room join
      socket.on('join-room', (data) => this.handleJoinRoom(socket, data));

      // Handle room leave
      socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));

      // Handle cursor movement
      socket.on('cursor-move', (data) => this.handleCursorMove(socket, data));

      // Handle selection change
      socket.on('selection-change', (data) => this.handleSelectionChange(socket, data));

      // Handle text change
      socket.on('text-change', (data) => this.handleTextChange(socket, data));

      // Handle file lock
      socket.on('file-lock', (data) => this.handleFileLock(socket, data));

      // Handle file unlock
      socket.on('file-unlock', (data) => this.handleFileUnlock(socket, data));

      // Handle typing indicator
      socket.on('typing', (data) => this.handleTyping(socket, data));

      // Handle presence update
      socket.on('presence-update', (data) => this.handlePresenceUpdate(socket, data));

      // Handle disconnect
      socket.on('disconnect', () => this.handleDisconnect(socket));

      // Send initial presence
      this.sendPresenceUpdate(socket);
    });
  }

  /**
   * Handle room join
   */
  handleJoinRoom(socket, data) {
    const { roomId, resourceType, resourceId } = data;

    if (!roomId) {
      socket.emit('error', { message: 'Room ID required' });
      return;
    }

    // Join the room
    socket.join(roomId);

    // Track room membership
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(socket.id);

    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      userId: socket.userId,
      name: socket.userName,
      email: socket.userEmail
    });

    // Send current room users to the joining user
    const roomUsers = this.getRoomUsers(roomId);
    socket.emit('room-users', roomUsers);

    // Log audit
    logAudit({
      action: 'collaboration.join',
      userId: socket.userId,
      resourceType: resourceType || 'room',
      resourceId: resourceId || roomId,
      details: { roomId }
    });

    console.log(`User ${socket.userId} joined room ${roomId}`);
  }

  /**
   * Handle room leave
   */
  handleLeaveRoom(socket, data) {
    const { roomId } = data;

    if (!roomId) return;

    socket.leave(roomId);

    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(socket.id);
      
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }

    socket.to(roomId).emit('user-left', {
      userId: socket.userId,
      name: socket.userName
    });

    console.log(`User ${socket.userId} left room ${roomId}`);
  }

  /**
   * Handle cursor movement
   */
  handleCursorMove(socket, data) {
    const { roomId, position, file } = data;

    socket.to(roomId).emit('cursor-update', {
      userId: socket.userId,
      name: socket.userName,
      position,
      file
    });
  }

  /**
   * Handle selection change
   */
  handleSelectionChange(socket, data) {
    const { roomId, selection, file } = data;

    socket.to(roomId).emit('selection-update', {
      userId: socket.userId,
      name: socket.userName,
      selection,
      file
    });
  }

  /**
   * Handle text change (collaborative editing)
   */
  handleTextChange(socket, data) {
    const { roomId, changes, version, file } = data;

    socket.to(roomId).emit('text-update', {
      userId: socket.userId,
      name: socket.userName,
      changes,
      version,
      file
    });
  }

  /**
   * Handle file lock
   */
  handleFileLock(socket, data) {
    const { roomId, fileId, fileName } = data;

    socket.to(roomId).emit('file-locked', {
      userId: socket.userId,
      name: socket.userName,
      fileId,
      fileName
    });
  }

  /**
   * Handle file unlock
   */
  handleFileUnlock(socket, data) {
    const { roomId, fileId } = data;

    socket.to(roomId).emit('file-unlocked', {
      userId: socket.userId,
      fileId
    });
  }

  /**
   * Handle typing indicator
   */
  handleTyping(socket, data) {
    const { roomId, isTyping, file } = data;

    socket.to(roomId).emit('typing-update', {
      userId: socket.userId,
      name: socket.userName,
      isTyping,
      file
    });
  }

  /**
   * Handle presence update
   */
  handlePresenceUpdate(socket, data) {
    const { status } = data;

    this.updatePresence(socket.userId, status);
    this.broadcastPresenceUpdate(socket.userId, status);
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.userId} (${socket.id})`);

    // Remove from all rooms
    this.rooms.forEach((members, roomId) => {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        
        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          name: socket.userName
        });

        if (members.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });

    // Update presence
    this.updatePresence(socket.userId, 'offline');

    // Remove user data
    this.users.delete(socket.id);
  }

  /**
   * Get users in a room
   */
  getRoomUsers(roomId) {
    const socketIds = this.rooms.get(roomId);
    if (!socketIds) return [];

    return Array.from(socketIds).map((socketId) => {
      const user = this.users.get(socketId);
      return {
        userId: user.userId,
        name: user.name,
        email: user.email,
        presence: this.presence.get(user.userId) || 'online'
      };
    });
  }

  /**
   * Update user presence
   */
  updatePresence(userId, status) {
    this.presence.set(userId, status);
  }

  /**
   * Broadcast presence update
   */
  broadcastPresenceUpdate(userId, status) {
    this.io.emit('presence-update', {
      userId,
      status
    });
  }

  /**
   * Send presence update to a specific socket
   */
  sendPresenceUpdate(socket) {
    const allPresence = Array.from(this.presence.entries()).map(([userId, status]) => ({
      userId,
      status
    }));

    socket.emit('presence-list', allPresence);
  }

  /**
   * Broadcast to a specific room
   */
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      connectedUsers: this.users.size,
      activeRooms: this.rooms.size,
      onlineUsers: Array.from(this.presence.values()).filter(s => s === 'online').length
    };
  }
}

export default WebSocketServer;
