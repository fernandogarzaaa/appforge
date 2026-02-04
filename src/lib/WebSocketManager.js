/**
 * WebSocket Manager for Real-Time Features (Phase 3 & 4)
 * Handles pair programming, real-time sync, and collaboration
 */

class WebSocketManager {
  constructor(url = null) {
    this.url = url || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
    this.ws = null;
    this.messageHandlers = new Map();
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventListeners = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  connect(token = null) {
    return new Promise((resolve, reject) => {
      try {
        const url = token ? `${this.url}?token=${token}` : this.url;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          console.log('✅ WebSocket connected');
          this.emit('connected');
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.connectionState = 'disconnected';
          console.log('🔌 WebSocket closed');
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = 'disconnected';
  }

  /**
   * Send message to server
   */
  send(type, data = {}) {
    if (this.connectionState !== 'connected') {
      console.warn('WebSocket not connected');
      return false;
    }

    try {
      this.ws.send(
        JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
        })
      );
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      return false;
    }
  }

  /**
   * Register message handler for type
   */
  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    const { type, data } = message;

    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in handler for ${type}:`, err);
        }
      });
    }
  }

  /**
   * Emit event
   */
  emit(eventName, data = null) {
    if (this.eventListeners.has(eventName)) {
      this.eventListeners.get(eventName).forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error(`Error in listener for ${eventName}:`, err);
        }
      });
    }
  }

  /**
   * Listen to events
   */
  listen(eventName, listener) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventName);
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('reconnectionFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.connectionState === 'disconnected') {
        this.connect().catch(() => {
          // Silently fail, will retry on next timeout
        });
      }
    }, delay);
  }

  /**
   * Get connection state
   */
  getState() {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connectionState === 'connected';
  }
}

// Create singleton instance
let wsManager = null;

export function getWebSocketManager() {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

export default WebSocketManager;
