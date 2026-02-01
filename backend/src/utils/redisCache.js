/**
 * Redis Cache Adapter with fallback to in-memory cache
 * Provides distributed caching with graceful degradation
 */

import Redis from 'ioredis';

class RedisCache {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.fallbackCache = new Map();
    this.initializeRedis();
  }

  initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: false,
        lazyConnect: true,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError(err) {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        }
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      this.redis.on('error', (err) => {
        console.warn('⚠️  Redis error (falling back to in-memory cache):', err.message);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.log('⚠️  Redis connection closed');
        this.isConnected = false;
      });

      // Attempt connection
      this.redis.connect().catch((err) => {
        console.warn('⚠️  Redis connection failed (using in-memory cache):', err.message);
        this.isConnected = false;
      });
    } catch (error) {
      console.warn('⚠️  Redis initialization failed (using in-memory cache):', error.message);
      this.redis = null;
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    try {
      if (this.isConnected && this.redis) {
        const value = await this.redis.get(key);
        if (value === null) return null;
        return JSON.parse(value);
      }
    } catch (error) {
      console.warn(`Redis GET error for key ${key}:`, error.message);
    }

    // Fallback to in-memory cache
    return this.getFallback(key);
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlMs - Time to live in milliseconds
   * @returns {Promise<void>}
   */
  async set(key, value, ttlMs = 60000) {
    const serialized = JSON.stringify(value);
    const ttlSeconds = Math.ceil(ttlMs / 1000);

    try {
      if (this.isConnected && this.redis) {
        await this.redis.setex(key, ttlSeconds, serialized);
        return;
      }
    } catch (error) {
      console.warn(`Redis SET error for key ${key}:`, error.message);
    }

    // Fallback to in-memory cache
    this.setFallback(key, value, ttlMs);
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async del(key) {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(key);
        return;
      }
    } catch (error) {
      console.warn(`Redis DEL error for key ${key}:`, error.message);
    }

    // Fallback to in-memory cache
    this.delFallback(key);
  }

  /**
   * Clear all cache entries
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.flushdb();
      }
    } catch (error) {
      console.warn('Redis CLEAR error:', error.message);
    }

    this.clearFallback();
  }

  /**
   * Delete keys matching a pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<void>}
   */
  async delPattern(pattern) {
    try {
      if (this.isConnected && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return;
      }
    } catch (error) {
      console.warn(`Redis DEL pattern error for ${pattern}:`, error.message);
    }

    // Fallback: delete matching keys from in-memory cache
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.fallbackCache.keys()) {
      if (regex.test(key)) {
        this.fallbackCache.delete(key);
      }
    }
  }

  /**
   * Check Redis connection status
   * @returns {boolean}
   */
  isRedisConnected() {
    return this.isConnected;
  }

  /**
   * Gracefully close Redis connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  // Fallback in-memory cache methods

  getFallback(key) {
    const entry = this.fallbackCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.fallbackCache.delete(key);
      return null;
    }

    return entry.value;
  }

  setFallback(key, value, ttlMs) {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this.fallbackCache.set(key, { value, expiresAt });
  }

  delFallback(key) {
    this.fallbackCache.delete(key);
  }

  clearFallback() {
    this.fallbackCache.clear();
  }
}

// Export singleton instance
const redisCache = new RedisCache();
export default redisCache;
