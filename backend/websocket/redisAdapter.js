/**
 * Redis Adapter for WebSocket Scaling
 * Enables horizontal scaling with Redis pub/sub
 */

import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { logger } from '../config/logger.js';

class RedisAdapter {
  constructor(redisUrl) {
    this.redisUrl = redisUrl || 'redis://localhost:6379';
    this.pubClient = null;
    this.subClient = null;
    this.adapter = null;
  }

  /**
   * Connect to Redis
   */
  async connect() {
    try {
      this.pubClient = new Redis(this.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        enableOfflineQueue: true,
        lazyConnect: false
      });

      this.subClient = new Redis(this.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        enableOfflineQueue: true,
        lazyConnect: false
      });

      // Wait for both connections
      await Promise.all([
        new Promise((resolve) => this.pubClient.once('ready', resolve)),
        new Promise((resolve) => this.subClient.once('ready', resolve))
      ]);

      // Create Socket.io adapter
      this.adapter = createAdapter(this.pubClient, this.subClient);

      logger.info('✅ Redis adapter connected');

      // Handle errors
      this.pubClient.on('error', (err) => {
        logger.error('Redis pub client error:', err);
      });

      this.subClient.on('error', (err) => {
        logger.error('Redis sub client error:', err);
      });

      return this;
    } catch (error) {
      logger.error('Redis adapter connection failed:', error);
      throw error;
    }
  }

  /**
   * Get Socket.io adapter
   */
  getAdapter() {
    if (!this.adapter) {
      throw new Error('Redis adapter not initialized. Call connect() first.');
    }
    return this.adapter;
  }

  /**
   * Publish event to channel
   */
  async publish(channel, message) {
    try {
      if (!this.pubClient) {
        throw new Error('Redis pub client not connected');
      }

      await this.pubClient.publish(channel, JSON.stringify(message));
      logger.debug(`Published to ${channel}:`, message);
    } catch (error) {
      logger.error(`Failed to publish to ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to channel
   */
  async subscribe(channel, handler) {
    try {
      if (!this.subClient) {
        throw new Error('Redis sub client not connected');
      }

      const subscriber = new Redis(this.redisUrl);
      
      subscriber.subscribe(channel, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to ${channel}:`, err);
        } else {
          logger.debug(`Subscribed to ${channel}`);
        }
      });

      subscriber.on('message', (chan, message) => {
        if (chan === channel) {
          try {
            handler(JSON.parse(message));
          } catch (err) {
            logger.error(`Message handler error on ${channel}:`, err);
          }
        }
      });

      return subscriber;
    } catch (error) {
      logger.error(`Subscription to ${channel} failed:`, error);
      throw error;
    }
  }

  /**
   * Get Redis stats
   */
  async getStats() {
    try {
      if (!this.pubClient) {
        return null;
      }

      const info = await this.pubClient.info();
      const stats = {};

      // Parse info output
      info.split('\r\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            stats[key] = value;
          }
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get Redis stats:', error);
      return null;
    }
  }

  /**
   * Clean up connections
   */
  async disconnect() {
    try {
      if (this.pubClient) {
        await this.pubClient.quit();
      }
      if (this.subClient) {
        await this.subClient.quit();
      }
      logger.info('Redis adapter disconnected');
    } catch (error) {
      logger.error('Disconnect failed:', error);
    }
  }
}

export default RedisAdapter;
