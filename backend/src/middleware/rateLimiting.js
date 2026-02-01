/**
 * Rate Limiting Configuration
 * Per-user rate limiting for API endpoints
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisCache from '../utils/redisCache.js';

/**
 * Create a rate limiter for persistence endpoints
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware
 */
export function createPersistenceRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = 'Too many requests from this user, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  const config = {
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    
    // Use userId from JWT token as key
    keyGenerator: (req) => {
      const userId = req.user?.id || req.ip;
      return `ratelimit:user:${userId}`;
    },

    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  };

  // Use Redis store if connected, otherwise use default memory store
  if (redisCache.isRedisConnected() && redisCache.redis) {
    config.store = new RedisStore({
      client: redisCache.redis,
      prefix: 'ratelimit:',
      sendCommand: (...args) => redisCache.redis.call(...args)
    });
  } else {
    console.warn('⚠️  Rate limiting using in-memory store (not suitable for distributed systems)');
  }

  return rateLimit(config);
}

/**
 * Strict rate limiter for write operations (POST, PUT, DELETE)
 */
export const strictWriteLimiter = createPersistenceRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 writes per 15 minutes
  message: 'Too many write requests. Please try again later.',
  skipSuccessfulRequests: false
});

/**
 * Lenient rate limiter for read operations (GET)
 */
export const readLimiter = createPersistenceRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 reads per minute
  message: 'Too many requests. Please slow down.',
  skipSuccessfulRequests: true
});

/**
 * Very strict rate limiter for sensitive operations (admin)
 */
export const adminLimiter = createPersistenceRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: 'Too many admin requests. Please try again later.',
  skipSuccessfulRequests: false
});

export default {
  createPersistenceRateLimiter,
  strictWriteLimiter,
  readLimiter,
  adminLimiter
};
