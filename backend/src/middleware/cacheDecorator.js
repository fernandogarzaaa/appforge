/**
 * Cache Decorator for Hot Queries
 * Implements automatic caching for frequently-accessed data
 */

import redisCache from '../utils/redisCache.js';
import * as Sentry from '@sentry/node';

/**
 * Cache configuration for different query types
 */
const CACHE_CONFIG = {
  // User data - 5 minutes
  USER_PROFILE: { ttl: 300000, key: 'user:profile:' },
  USER_SETTINGS: { ttl: 300000, key: 'user:settings:' },
  
  // Subscription data - 10 minutes
  SUBSCRIPTION_INFO: { ttl: 600000, key: 'user:subscription:' },
  SUBSCRIPTION_USAGE: { ttl: 60000, key: 'user:subscription:usage:' },
  
  // API Keys - 5 minutes (security: frequently rotated)
  API_KEYS: { ttl: 300000, key: 'user:apikeys:' },
  
  // Analytics - 15 minutes
  ANALYTICS_SUMMARY: { ttl: 900000, key: 'analytics:summary:' },
  ANALYTICS_DETAILED: { ttl: 600000, key: 'analytics:detailed:' },
  
  // Settings - 30 minutes
  ADMIN_CONFIG: { ttl: 1800000, key: 'admin:config:' },
  FEATURE_FLAGS: { ttl: 600000, key: 'feature:flags' },
};

/**
 * Decorator for caching async functions
 * @param {string} cacheType - Cache configuration key from CACHE_CONFIG
 * @param {function} keyGenerator - Function to generate cache key (receives args)
 */
export function withCache(cacheType, keyGenerator) {
  const config = CACHE_CONFIG[cacheType];
  
  if (!config) {
    throw new Error(`Unknown cache type: ${cacheType}`);
  }

  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      // Generate cache key
      const cacheKey = config.key + keyGenerator(...args);

      try {
        // Try to get from cache
        const cached = await redisCache.get(cacheKey);
        
        if (cached !== null) {
          Sentry.captureMessage(`Cache HIT: ${cacheKey}`, 'debug', {
            tags: {
              'cache.hit': 'true',
              'cache.type': cacheType,
            },
          });
          
          return cached;
        }
      } catch (error) {
        console.warn(`Cache GET error for ${cacheKey}:`, error.message);
        // Fall through to original method
      }

      // Cache miss - execute original method
      try {
        const result = await originalMethod.apply(this, args);

        // Store in cache
        try {
          await redisCache.set(cacheKey, result, config.ttl);
        } catch (error) {
          console.warn(`Cache SET error for ${cacheKey}:`, error.message);
          // Still return result even if cache fails
        }

        return result;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            'cache.error': 'true',
            'cache.type': cacheType,
          },
          extra: {
            cache_key: cacheKey,
          },
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Manual cache helper functions
 */
export const CacheManager = {
  /**
   * Get or compute cached value
   */
  async getOrCompute(cacheKey, computeFn, ttl = 300000) {
    try {
      // Try cache first
      const cached = await redisCache.get(cacheKey);
      if (cached !== null) {
        return { value: cached, source: 'cache' };
      }
    } catch (error) {
      console.warn(`Cache GET error: ${error.message}`);
    }

    // Compute value
    const value = await computeFn();

    // Store in cache
    try {
      await redisCache.set(cacheKey, value, ttl);
    } catch (error) {
      console.warn(`Cache SET error: ${error.message}`);
    }

    return { value, source: 'computed' };
  },

  /**
   * Invalidate specific cache key
   */
  async invalidate(cacheKey) {
    try {
      await redisCache.del(cacheKey);
      console.log(`✅ Cache invalidated: ${cacheKey}`);
    } catch (error) {
      console.warn(`Cache DELETE error: ${error.message}`);
    }
  },

  /**
   * Invalidate pattern (e.g., "user:123:*")
   */
  async invalidatePattern(pattern) {
    try {
      await redisCache.delPattern(pattern);
      console.log(`✅ Cache pattern invalidated: ${pattern}`);
    } catch (error) {
      console.warn(`Cache PATTERN DELETE error: ${error.message}`);
    }
  },

  /**
   * Invalidate all user-related caches
   */
  async invalidateUserCache(userId) {
    const patterns = [
      `user:profile:${userId}`,
      `user:settings:${userId}:*`,
      `user:subscription:${userId}`,
      `user:subscription:usage:${userId}:*`,
      `user:apikeys:${userId}`,
      `analytics:*:${userId}:*`,
    ];

    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  },

  /**
   * Warm cache with precomputed values
   */
  async warm(cacheKey, value, ttl = 300000) {
    try {
      await redisCache.set(cacheKey, value, ttl);
      console.log(`🔥 Cache warmed: ${cacheKey}`);
    } catch (error) {
      console.warn(`Cache WARM error: ${error.message}`);
    }
  },

  /**
   * Get cache stats
   */
  async getStats() {
    return {
      redis_connected: redisCache.isRedisConnected(),
      redis_status: redisCache.redis ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Express middleware for automatic query result caching
 */
export const queryResultCacheMiddleware = (cacheKeyPrefix, ttl = 300000) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = cacheKeyPrefix + JSON.stringify({
      path: req.path,
      query: req.query,
      userId: req.user?.id,
    });

    try {
      const cached = await redisCache.get(cacheKey);
      
      if (cached !== null) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (error) {
      console.warn(`Cache middleware error: ${error.message}`);
      // Continue to handler if cache fails
    }

    // Capture original res.json
    const originalJson = res.json;

    res.json = function(data) {
      // Cache the response
      try {
        redisCache.set(cacheKey, data, ttl).catch(err => {
          console.warn(`Failed to cache response: ${err.message}`);
        });
      } catch (error) {
        console.warn(`Cache error: ${error.message}`);
      }

      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Cache invalidation helpers for common operations
 */
export const CacheInvalidation = {
  /**
   * After user update
   */
  onUserUpdated(userId) {
    const patterns = [
      `user:profile:${userId}`,
      `user:settings:${userId}:*`,
      `analytics:*:${userId}:*`,
    ];
    patterns.forEach(p => CacheManager.invalidatePattern(p));
  },

  /**
   * After subscription change
   */
  onSubscriptionChanged(userId) {
    const patterns = [
      `user:subscription:${userId}`,
      `user:subscription:usage:${userId}:*`,
      `analytics:summary:${userId}:*`,
    ];
    patterns.forEach(p => CacheManager.invalidatePattern(p));
  },

  /**
   * After API key created/deleted
   */
  onApiKeyChanged(userId) {
    CacheManager.invalidatePattern(`user:apikeys:${userId}`);
  },

  /**
   * After analytics recorded
   */
  onAnalyticsRecorded(userId) {
    const patterns = [
      `analytics:summary:${userId}:*`,
      `analytics:detailed:${userId}:*`,
    ];
    patterns.forEach(p => CacheManager.invalidatePattern(p));
  },

  /**
   * After team/collaboration changed
   */
  onCollaborationChanged(userId) {
    const patterns = [
      `user:profile:${userId}`,
      `analytics:*:${userId}:*`,
    ];
    patterns.forEach(p => CacheManager.invalidatePattern(p));
  },
};

/**
 * Hot query caching example implementations
 */
export const CachedQueries = {
  /**
   * Get user profile with caching
   */
  async getUserProfile(userId) {
    return CacheManager.getOrCompute(
      `user:profile:${userId}`,
      async () => {
        // Simulate DB query
        return {
          id: userId,
          email: 'user@example.com',
          created_at: new Date(),
        };
      },
      CACHE_CONFIG.USER_PROFILE.ttl
    );
  },

  /**
   * Get user subscription with caching
   */
  async getUserSubscription(userId) {
    return CacheManager.getOrCompute(
      `user:subscription:${userId}`,
      async () => {
        // Simulate DB query
        return {
          plan: 'pro',
          status: 'active',
          renewsAt: new Date(),
        };
      },
      CACHE_CONFIG.SUBSCRIPTION_INFO.ttl
    );
  },

  /**
   * Get user API keys with caching
   */
  async getUserApiKeys(userId) {
    return CacheManager.getOrCompute(
      `user:apikeys:${userId}`,
      async () => {
        // Simulate DB query
        return [
          { id: 'key_1', created_at: new Date() },
          { id: 'key_2', created_at: new Date() },
        ];
      },
      CACHE_CONFIG.API_KEYS.ttl
    );
  },

  /**
   * Get analytics summary with caching
   */
  async getAnalyticsSummary(userId) {
    return CacheManager.getOrCompute(
      `analytics:summary:${userId}:daily`,
      async () => {
        // Simulate DB aggregation
        return {
          total_requests: 1523,
          errors: 12,
          avg_response_time_ms: 145,
        };
      },
      CACHE_CONFIG.ANALYTICS_SUMMARY.ttl
    );
  },
};

export default {
  withCache,
  CACHE_CONFIG,
  CacheManager,
  queryResultCacheMiddleware,
  CacheInvalidation,
  CachedQueries,
};
