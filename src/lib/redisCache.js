/**
 * Redis Caching Layer
 * Provides distributed caching for models, subscriptions, and API responses
 */

import Redis from 'ioredis';

// Initialize Redis client with fallback
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
});

// Handle Redis connection events
redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (error) => {
  console.error('[Redis] Connection error:', error.message);
});

redis.on('close', () => {
  console.log('[Redis] Connection closed');
});

/**
 * Cache configuration with TTL (Time To Live) in seconds
 */
export const CACHE_CONFIG = {
  // Model responses - cache for 5 minutes
  MODEL_RESPONSE: 5 * 60,
  
  // Subscription info - cache for 1 hour
  SUBSCRIPTION: 60 * 60,
  
  // User data - cache for 30 minutes
  USER_DATA: 30 * 60,
  
  // API responses - cache for 10 minutes
  API_RESPONSE: 10 * 60,
  
  // Quantum analysis results - cache for 1 hour
  QUANTUM_ANALYSIS: 60 * 60,
  
  // Template data - cache for 24 hours
  TEMPLATES: 24 * 60 * 60,
  
  // Session data - cache for 2 hours
  SESSION: 2 * 60 * 60,
};

/**
 * Get a value from cache
 */
export async function getCached(key) {
  try {
    const value = await redis.get(key);
    if (value) {
      console.log(`[Cache HIT] ${key}`);
      return JSON.parse(value);
    }
    console.log(`[Cache MISS] ${key}`);
    return null;
  } catch (error) {
    console.error(`[Cache] Error reading ${key}:`, error.message);
    return null;
  }
}

/**
 * Set a value in cache with optional TTL
 */
export async function setCached(key, value, ttl = CACHE_CONFIG.API_RESPONSE) {
  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
    console.log(`[Cache SET] ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.error(`[Cache] Error writing ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete a cache entry
 */
export async function deleteCached(key) {
  try {
    await redis.del(key);
    console.log(`[Cache DELETE] ${key}`);
    return true;
  } catch (error) {
    console.error(`[Cache] Error deleting ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete multiple cache entries
 */
export async function deleteMultipleCached(keys) {
  try {
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache DELETE] ${keys.length} keys`);
    }
    return true;
  } catch (error) {
    console.error('[Cache] Error deleting multiple keys:', error.message);
    return false;
  }
}

/**
 * Clear cache by pattern (e.g., 'user:123:*')
 */
export async function clearCachePattern(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache CLEAR] Pattern ${pattern} - ${keys.length} keys deleted`);
    }
    return true;
  } catch (error) {
    console.error(`[Cache] Error clearing pattern ${pattern}:`, error.message);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const info = await redis.info('stats');
    const keys = await redis.dbsize();
    
    return {
      keys,
      info: info.split('\r\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key] = value;
        return acc;
      }, {}),
    };
  } catch (error) {
    console.error('[Cache] Error getting stats:', error.message);
    return null;
  }
}

/**
 * Cache middleware for Express
 * Usage: app.get('/api/data', cacheMiddleware('data', 300), handler)
 */
export function cacheMiddleware(keyPrefix, ttl = CACHE_CONFIG.API_RESPONSE) {
  return async (req, res, next) => {
    // Generate cache key from route and query params
    const cacheKey = `${keyPrefix}:${req.url}:${JSON.stringify(req.query)}`;
    
    // Try to get from cache
    const cached = await getCached(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
    
    // Store original send method
    const originalSend = res.json.bind(res);
    
    // Override send to cache response
    res.json = (data) => {
      setCached(cacheKey, data, ttl).catch(err => {
        console.error('[Cache] Failed to cache response:', err.message);
      });
      res.set('X-Cache', 'MISS');
      return originalSend(data);
    };
    
    next();
  };
}

/**
 * Invalidate related caches when data changes
 */
export async function invalidateRelatedCaches(userId, type = 'all') {
  const patterns = {
    all: [`user:${userId}:*`, `subscription:${userId}:*`, `data:${userId}:*`],
    subscription: [`subscription:${userId}:*`, `billing:${userId}:*`],
    profile: [`user:${userId}:profile:*`, `user:${userId}:settings:*`],
    quantum: [`quantum:*:${userId}`, `analysis:${userId}:*`],
  };
  
  const keysToInvalidate = patterns[type] || patterns.all;
  
  for (const pattern of keysToInvalidate) {
    await clearCachePattern(pattern);
  }
}

/**
 * Subscription cache helpers
 */
export const subscriptionCache = {
  key: (userId) => `subscription:${userId}:info`,
  
  async get(userId) {
    return getCached(subscriptionCache.key(userId));
  },
  
  async set(userId, data) {
    return setCached(subscriptionCache.key(userId), data, CACHE_CONFIG.SUBSCRIPTION);
  },
  
  async invalidate(userId) {
    return deleteCached(subscriptionCache.key(userId));
  },
};

/**
 * User data cache helpers
 */
export const userCache = {
  key: (userId, type = 'data') => `user:${userId}:${type}`,
  
  async get(userId, type = 'data') {
    return getCached(userCache.key(userId, type));
  },
  
  async set(userId, data, type = 'data') {
    return setCached(userCache.key(userId, type), data, CACHE_CONFIG.USER_DATA);
  },
  
  async invalidate(userId) {
    await clearCachePattern(`user:${userId}:*`);
  },
};

/**
 * Quantum analysis cache helpers
 */
export const quantumCache = {
  key: (codeHash) => `quantum:analysis:${codeHash}`,
  
  async get(codeHash) {
    return getCached(quantumCache.key(codeHash));
  },
  
  async set(codeHash, data) {
    return setCached(quantumCache.key(codeHash), data, CACHE_CONFIG.QUANTUM_ANALYSIS);
  },
  
  async invalidate(codeHash) {
    return deleteCached(quantumCache.key(codeHash));
  },
};

/**
 * Cache invalidation on specific events
 */
export function setupCacheInvalidation() {
  // Listen for cache invalidation events
  const invalidationRedis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  });
  
  invalidationRedis.subscribe('cache:invalidate', (err, count) => {
    if (err) {
      console.error('[Cache] Subscription error:', err);
    } else {
      console.log(`[Cache] Subscribed to ${count} channels`);
    }
  });
  
  invalidationRedis.on('message', async (channel, message) => {
    if (channel === 'cache:invalidate') {
      const { pattern, type } = JSON.parse(message);
      console.log(`[Cache] Invalidation message received: ${pattern}`);
      
      if (pattern === '*') {
        // Full cache clear
        await redis.flushdb();
        console.log('[Cache] Full cache cleared');
      } else {
        // Pattern-based invalidation
        await clearCachePattern(pattern);
      }
    }
  });
  
  return invalidationRedis;
}

/**
 * Publish cache invalidation event
 */
export async function publishCacheInvalidation(pattern = '*') {
  try {
    const pubRedis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    });
    
    await pubRedis.publish('cache:invalidate', JSON.stringify({ pattern }));
    await pubRedis.quit();
    console.log(`[Cache] Invalidation published for pattern: ${pattern}`);
  } catch (error) {
    console.error('[Cache] Error publishing invalidation:', error.message);
  }
}

/**
 * Cache health check
 */
export async function checkCacheHealth() {
  try {
    const pong = await redis.ping();
    const info = await redis.info('server');
    const keys = await redis.dbsize();
    
    return {
      connected: pong === 'PONG',
      keys,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeCacheConnection() {
  try {
    await redis.quit();
    console.log('[Redis] Connection closed gracefully');
  } catch (error) {
    console.error('[Redis] Error closing connection:', error.message);
  }
}

export default redis;
