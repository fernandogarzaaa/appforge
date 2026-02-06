/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting requests per IP
 * Supports Redis store for distributed rate limiting
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Redis client for rate limiting (conditional)
let redisClient = null;
let store = undefined;

export function createRateLimiter(customStore = undefined) {
  const activeStore = customStore ?? store;

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: activeStore, // Use Redis if available, otherwise in-memory
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/status';
    },
    keyGenerator: (req) => {
      // Use X-Forwarded-For if behind a proxy, otherwise use remoteAddress
      return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }
  });
}

// Async initialization function
async function initializeRateLimiter() {
  if (process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      redisClient.on('error', (err) => {
        console.error('Redis rate limiter connection error:', err.message);
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis rate limiter connected');
      });

      // Wait for Redis connection before creating store
      await redisClient.connect();

      store = new RedisStore({
        client: redisClient,
        prefix: 'rl:', // rate limit prefix
        sendCommand: (...args) => redisClient.call(...args)
      });
    } catch (error) {
      console.warn('⚠️  Redis not available, using in-memory rate limiting:', error.message);
      redisClient = null;
      store = undefined;
    }
  }

  return createRateLimiter(store);
}
export { redisClient, initializeRateLimiter };
