/**
 * WebSocket Service - Real-time Collaboration
 * Handles WebSocket connections for live document editing, presence tracking, and messaging
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.userId = null;
    this.userName = null;
    this.projectId = null;
    this.documentId = null;
    this.listeners = new Map();
    this.messageQueue = [];
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.heartbeatInterval = null;
    this.activeUsers = new Map(); // userId -> user info
    this.cursorPositions = new Map(); // userId -> { x, y, line, column }
    this.editHistory = []; // Operation history for conflict resolution
  }

  /**
   * Connect to WebSocket server
   */
  connect(wsUrl, userId, userName, projectId, documentId) {
    return new Promise((resolve, reject) => {
      try {
        this.url = wsUrl;
        this.userId = userId;
        this.userName = userName;
        this.projectId = projectId;
        this.documentId = documentId;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');

          // Send join message
          this.send('join', {
            userId,
            userName,
            projectId,
            documentId,
            timestamp: new Date().toISOString(),
          });

          // Start heartbeat
          this.startHeartbeat();

          // Flush queued messages
          this.flushQueue();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(data) {
    const { type, payload } = data;

    switch (type) {
      case 'presence-update':
        this.handlePresenceUpdate(payload);
        break;

      case 'cursor-move':
        this.handleCursorMove(payload);
        break;

      case 'document-edit':
        this.handleDocumentEdit(payload);
        break;

      case 'message':
        this.emit('message', payload);
        break;

      case 'notification':
        this.emit('notification', payload);
        break;

      case 'sync-request':
        this.emit('sync-request', payload);
        break;

      case 'ack':
        this.emit('ack', payload);
        break;

      default:
        this.emit(type, payload);
    }
  }

  /**
   * Handle presence update (user joined/left)
   */
  handlePresenceUpdate(payload) {
    const { userId, action, userName, color } = payload;

    if (action === 'join') {
      this.activeUsers.set(userId, {
        userId,
        userName,
        color,
        joinedAt: new Date(),
      });
      this.emit('user-joined', { userId, userName, color });
    } else if (action === 'leave') {
      this.activeUsers.delete(userId);
      this.cursorPositions.delete(userId);
      this.emit('user-left', { userId });
    }

    this.emit('presence-changed', {
      activeUsers: Array.from(this.activeUsers.values()),
    });
  }

  /**
   * Handle cursor movement
   */
  handleCursorMove(payload) {
    const { userId, x, y, line, column, userName } = payload;

    this.cursorPositions.set(userId, { x, y, line, column, userName });
    this.emit('cursor-moved', {
      userId,
      x,
      y,
      line,
      column,
      userName,
    });
  }

  /**
   * Handle document edit
   */
  handleDocumentEdit(payload) {
    const { userId, operation, version, timestamp } = payload;

    // Track edit history for conflict resolution
    this.editHistory.push({
      userId,
      operation,
      version,
      timestamp,
    });

    // Keep only last 1000 edits
    if (this.editHistory.length > 1000) {
      this.editHistory.shift();
    }

    this.emit('document-edited', {
      userId,
      operation,
      version,
      timestamp,
    });
  }

  /**
   * Send message to server
   */
  send(type, payload) {
    const message = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    if (!this.isConnected) {
      this.messageQueue.push(message);
      console.warn('⚠️ WebSocket not connected. Message queued.');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Flush queued messages
   */
  flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send document edit
   */
  sendEdit(operation, version) {
    this.send('document-edit', {
      userId: this.userId,
      operation,
      version,
      documentId: this.documentId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send cursor position
   */
  sendCursor(x, y, line, column) {
    this.send('cursor-move', {
      userId: this.userId,
      userName: this.userName,
      x,
      y,
      line,
      column,
      documentId: this.documentId,
    });
  }

  /**
   * Send message
   */
  sendMessage(content, type = 'text') {
    this.send('message', {
      userId: this.userId,
      userName: this.userName,
      content,
      type,
      documentId: this.documentId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Request document sync
   */
  requestSync() {
    this.send('sync-request', {
      userId: this.userId,
      documentId: this.documentId,
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send('ping', { timestamp: new Date().toISOString() });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(
        `🔄 Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (!this.isConnected) {
          this.connect(this.url, this.userId, this.userName, this.projectId, this.documentId).catch(
            (error) => {
              console.error('Reconnection failed:', error);
            }
          );
        }
      }, delay);
    } else {
      this.emit('max-reconnect-attempts-reached');
    }
  }

  /**
   * Subscribe to event
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit event
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Get active users
   */
  getActiveUsers() {
    return Array.from(this.activeUsers.values());
  }

  /**
   * Get user cursor position
   */
  getCursorPosition(userId) {
    return this.cursorPositions.get(userId);
  }

  /**
   * Get all cursor positions
   */
  getAllCursorPositions() {
    return Array.from(this.cursorPositions.entries()).map(([userId, pos]) => ({
      userId,
      ...pos,
    }));
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.stopHeartbeat();
    this.messageQueue = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.activeUsers.clear();
    this.cursorPositions.clear();
    this.editHistory = [];
    this.emit('disconnected');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      userId: this.userId,
      projectId: this.projectId,
      documentId: this.documentId,
      activeUsers: this.getActiveUsers(),
      queuedMessages: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Resolve edit conflict (Operational Transformation)
   */
  resolveConflict(localOp, remoteOp, version) {
    // Simple OT: remote op gets priority
    // In production, implement full OT algorithm
    return {
      operation: remoteOp,
      version: version + 1,
    };
  }
}

// Singleton instance
let instance = null;

export function getWebSocketService() {
  if (!instance) {
    instance = new WebSocketService();
  }
  return instance;
}

export default WebSocketService;
