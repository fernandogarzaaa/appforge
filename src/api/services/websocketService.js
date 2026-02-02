/**
 * WebSocket Service
 * Real-time collaboration with AppForge backend
 */

import { io } from 'socket.io-client';
import { getAuthToken } from '../appforgeClient';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5001';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.socket) {
      return this.socket;
    }

    const token = getAuthToken();
    
    this.socket = io(WS_URL, {
      auth: {
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Connection events
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[WebSocket] Connected');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[WebSocket] Disconnected');
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.emit('error', error);
    });

    // Real-time collaboration events
    this.setupCollaborationEvents();

    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Set up collaboration event listeners
   */
  setupCollaborationEvents() {
    // Cursor tracking
    this.socket.on('cursor-update', (data) => {
      this.emit('cursor-update', data);
    });

    // Text changes
    this.socket.on('text-change', (data) => {
      this.emit('text-change', data);
    });

    // Selection changes
    this.socket.on('selection-change', (data) => {
      this.emit('selection-change', data);
    });

    // File locking
    this.socket.on('file-locked', (data) => {
      this.emit('file-locked', data);
    });

    this.socket.on('file-unlocked', (data) => {
      this.emit('file-unlocked', data);
    });

    // Typing indicators
    this.socket.on('user-typing', (data) => {
      this.emit('user-typing', data);
    });

    this.socket.on('user-stopped-typing', (data) => {
      this.emit('user-stopped-typing', data);
    });

    // Presence
    this.socket.on('presence-update', (data) => {
      this.emit('presence-update', data);
    });

    this.socket.on('user-joined', (data) => {
      this.emit('user-joined', data);
    });

    this.socket.on('user-left', (data) => {
      this.emit('user-left', data);
    });

    // Persistence events
    this.socket.on('state:updated', (data) => {
      this.emit('state:updated', data);
    });

    this.socket.on('analytics:event', (data) => {
      this.emit('analytics:event', data);
    });

    this.socket.on('sync:log', (data) => {
      this.emit('sync:log', data);
    });
  }

  /**
   * Join a collaboration room (project)
   */
  joinRoom(roomId, userData) {
    if (!this.socket || !this.connected) {
      console.warn('[WebSocket] Not connected, cannot join room');
      return false;
    }

    this.socket.emit('join-room', {
      roomId,
      userData
    });

    return true;
  }

  /**
   * Leave a collaboration room
   */
  leaveRoom(roomId) {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('leave-room', { roomId });
    return true;
  }

  /**
   * Send cursor position update
   */
  updateCursor(roomId, position, userId) {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('cursor-move', {
      roomId,
      position,
      userId
    });

    return true;
  }

  /**
   * Send text change
   */
  sendTextChange(roomId, change) {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('text-change', {
      roomId,
      change
    });

    return true;
  }

  /**
   * Request file lock
   */
  requestFileLock(roomId, fileId, userId) {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('request-file-lock', {
      roomId,
      fileId,
      userId
    });

    return true;
  }

  /**
   * Release file lock
   */
  releaseFileLock(roomId, fileId) {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('release-file-lock', {
      roomId,
      fileId
    });

    return true;
  }

  /**
   * Start typing indicator
   */
  startTyping(roomId, userId) {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('typing-start', {
      roomId,
      userId
    });

    return true;
  }

  /**
   * Stop typing indicator
   */
  stopTyping(roomId, userId) {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('typing-stop', {
      roomId,
      userId
    });

    return true;
  }

  /**
   * Update presence status
   */
  updatePresence(roomId, status) {
    if (!this.socket || !this.connected) {
      return false;
    }

    this.socket.emit('presence-update', {
      roomId,
      status // 'online', 'away', 'offline'
    });

    return true;
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
