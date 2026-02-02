/**
 * Backend Cache Integration
 * Express middleware and route wrappers for easy cache integration
 */

import {
  getCached,
  setCached,
  deleteCached,
  cacheMiddleware,
  invalidateRelatedCaches,
  subscriptionCache,
  userCache,
  quantumCache,
  checkCacheHealth,
  CACHE_CONFIG,
} from './redisCache.js';

/**
 * Decorator for caching API responses
 * Usage: @cached('model_response', 300)
 */
export function cached(keyPrefix, ttl = CACHE_CONFIG.API_RESPONSE) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args) {
      const req = args[0];
      const cacheKey = `${keyPrefix}:${req.url || req.path}:${JSON.stringify(req.query || req.params)}`;
      
      // Try cache first
      const cached = await getCached(cacheKey);
      if (cached) {
        console.log(`[Cached] Retrieved ${keyPrefix} from cache`);
        return cached;
      }
      
      // Call original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await setCached(cacheKey, result, ttl);
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Subscription API wrapper with automatic caching
 */
export const subscriptionAPI = {
  /**
   * Get subscription info with caching
   */
  async getSubscription(userId) {
    // Try cache first
    let subscription = await subscriptionCache.get(userId);
    if (subscription) return subscription;
    
    // If not cached, fetch from database/API
    // This would typically call your backend API
    // subscription = await fetchSubscriptionFromDatabase(userId);
    
    // Cache the result
    if (subscription) {
      await subscriptionCache.set(userId, subscription);
    }
    
    return subscription;
  },

  /**
   * Update subscription and invalidate cache
   */
  async updateSubscription(userId, subscriptionData) {
    // Update in database
    // await updateSubscriptionInDatabase(userId, subscriptionData);
    
    // Invalidate cache
    await subscriptionCache.invalidate(userId);
    await invalidateRelatedCaches(userId, 'subscription');
    
    return subscriptionData;
  },

  /**
   * Get billing history with caching
   */
  async getBillingHistory(userId, limit = 50) {
    const cacheKey = `billing:${userId}:history:${limit}`;
    let history = await getCached(cacheKey);
    
    if (!history) {
      // Fetch from database
      // history = await fetchBillingHistoryFromDatabase(userId, limit);
      // Cache it
      await setCached(cacheKey, history, CACHE_CONFIG.SUBSCRIPTION);
    }
    
    return history;
  },
};

/**
 * User API wrapper with automatic caching
 */
export const userAPI = {
  /**
   * Get user profile with caching
   */
  async getProfile(userId) {
    let profile = await userCache.get(userId, 'profile');
    
    if (!profile) {
      // Fetch from database
      // profile = await fetchUserProfileFromDatabase(userId);
      if (profile) {
        await userCache.set(userId, profile, 'profile');
      }
    }
    
    return profile;
  },

  /**
   * Update user profile and invalidate cache
   */
  async updateProfile(userId, profileData) {
    // Update in database
    // await updateUserProfileInDatabase(userId, profileData);
    
    // Invalidate cache
    await userCache.invalidate(userId);
    
    return profileData;
  },

  /**
   * Get user settings with caching
   */
  async getSettings(userId) {
    let settings = await userCache.get(userId, 'settings');
    
    if (!settings) {
      // Fetch from database
      // settings = await fetchUserSettingsFromDatabase(userId);
      if (settings) {
        await userCache.set(userId, settings, 'settings');
      }
    }
    
    return settings;
  },
};

/**
 * Quantum Analysis API wrapper with caching
 */
export const quantumAPI = {
  /**
   * Analyze code with result caching
   */
  async analyzeCode(code) {
    // Generate hash of code for cache key
    const codeHash = generateHash(code);
    
    // Try cache first
    let result = await quantumCache.get(codeHash);
    if (result) return result;
    
    // Perform analysis
    // result = await performQuantumAnalysis(code);
    
    // Cache result
    if (result) {
      await quantumCache.set(codeHash, result);
    }
    
    return result;
  },

  /**
   * Invalidate quantum analysis cache when models update
   */
  async invalidateAnalysis(pattern = 'quantum:analysis:*') {
    return deleteCached(pattern);
  },
};

/**
 * Express route wrapper for automatic caching
 * Usage: app.get('/api/data', cachedRoute('data', 300, handler))
 */
export function cachedRoute(keyPrefix, ttl = CACHE_CONFIG.API_RESPONSE, handler) {
  return cacheMiddleware(keyPrefix, ttl), handler;
}

/**
 * Batch cache invalidation for user operations
 */
export async function invalidateUserCaches(userId, operations = ['all']) {
  const invalidations = [];
  
  for (const op of operations) {
    switch (op) {
      case 'all':
        invalidations.push(invalidateRelatedCaches(userId, 'all'));
        break;
      case 'profile':
        invalidations.push(userCache.invalidate(userId));
        break;
      case 'subscription':
        invalidations.push(subscriptionCache.invalidate(userId));
        break;
      case 'quantum':
        invalidations.push(deleteCached(`quantum:*:${userId}`));
        break;
    }
  }
  
  await Promise.all(invalidations);
  console.log(`[Cache] Invalidated ${operations.length} cache operations for user ${userId}`);
}

/**
 * Cache monitoring and health check endpoint
 * Usage: app.get('/health/cache', cacheHealthEndpoint)
 */
export async function cacheHealthEndpoint(req, res) {
  const health = await checkCacheHealth();
  res.status(health.connected ? 200 : 503).json(health);
}

/**
 * Cache statistics endpoint
 * Usage: app.get('/admin/cache/stats', cacheStatsEndpoint)
 */
export async function cacheStatsEndpoint(req, res) {
  const stats = await getCacheStats();
  res.json(stats);
}

/**
 * Simple hash function for generating cache keys
 */
function generateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export default {
  subscriptionAPI,
  userAPI,
  quantumAPI,
  invalidateUserCaches,
  cacheHealthEndpoint,
  cacheStatsEndpoint,
};
