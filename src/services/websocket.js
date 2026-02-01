/**
 * WebSocket Service for Real-Time Collaboration
 * Handles websocket connections, presence, and collaborative editing
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.presence = new Map();
    this.roomId = null;
    this.userId = null;
    this.heartbeatInterval = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect(url, userId, roomId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    this.userId = userId;
    this.roomId = roomId;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.joinRoom(roomId, userId);
        this.startHeartbeat();
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.stopHeartbeat();
        this.emit('disconnected');
        this.attemptReconnect(url, userId, roomId);
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.attemptReconnect(url, userId, roomId);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.presence.clear();
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect(url, userId, roomId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`[WebSocket] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(url, userId, roomId);
    }, delay);
  }

  /**
   * Join a collaboration room
   */
  joinRoom(roomId, userId) {
    this.send({
      type: 'join',
      roomId,
      userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (this.roomId) {
      this.send({
        type: 'leave',
        roomId: this.roomId,
        userId: this.userId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'presence':
        this.updatePresence(data);
        this.emit('presence', data);
        break;

      case 'cursor':
        this.emit('cursor', data);
        break;

      case 'edit':
        this.emit('edit', data);
        break;

      case 'selection':
        this.emit('selection', data);
        break;

      case 'chat':
        this.emit('chat', data);
        break;

      case 'notification':
        this.emit('notification', data);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.warn('[WebSocket] Unknown message type:', type);
    }
  }

  /**
   * Update presence information
   */
  updatePresence(users) {
    this.presence.clear();
    users.forEach((user) => {
      this.presence.set(user.id, user);
    });
  }

  /**
   * Send cursor position
   */
  sendCursorPosition(position) {
    this.send({
      type: 'cursor',
      data: {
        userId: this.userId,
        roomId: this.roomId,
        position,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Send code edit
   */
  sendEdit(edit) {
    this.send({
      type: 'edit',
      data: {
        userId: this.userId,
        roomId: this.roomId,
        edit,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Send selection change
   */
  sendSelection(selection) {
    this.send({
      type: 'selection',
      data: {
        userId: this.userId,
        roomId: this.roomId,
        selection,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Send chat message
   */
  sendChatMessage(message) {
    this.send({
      type: 'chat',
      data: {
        userId: this.userId,
        roomId: this.roomId,
        message,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
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
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Get current presence list
   */
  getPresence() {
    return Array.from(this.presence.values());
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
