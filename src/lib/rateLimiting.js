/**
 * Rate Limiting Middleware
 * Implements comprehensive rate limiting strategies for API protection
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from './redisCache.js';

/**
 * Base rate limiter factory
 */
function createLimiter(options = {}) {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rate-limit:',
    }),
    message: options.message || 'Too many requests, please try again later.',
    statusCode: options.statusCode || 429,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: options.skip || (() => false),
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    ...options,
  });
}

/**
 * Global rate limiter - moderate limit for all requests
 * 100 requests per 15 minutes per IP
 */
export const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth endpoints rate limiter - strict limit to prevent brute force
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  skip: (req) => {
    // Skip for logged-in users
    return req.isAuthenticated && req.isAuthenticated();
  },
});

/**
 * API endpoints rate limiter - moderate limit
 * 30 requests per minute per authenticated user
 */
export const apiLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many API requests, please try again after 1 minute.',
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  },
});

/**
 * Quantum analysis endpoints rate limiter - strict limit
 * 10 requests per minute per user (expensive operation)
 */
export const quantumLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many quantum analysis requests, please try again after 1 minute.',
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many quantum analysis requests',
      retryAfter: req.rateLimit.resetTime,
      message: 'Quantum analysis is computationally expensive. Please wait before making another request.',
    });
  },
});

/**
 * Stripe webhook rate limiter - very permissive
 * 100 requests per minute (webhooks are legitimate high-volume)
 */
export const webhookLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many webhook requests.',
  skip: (req) => {
    // Verify webhook signature before rate limiting
    return !req.headers['stripe-signature'];
  },
});

/**
 * Search endpoints rate limiter - moderate
 * 20 requests per minute per user
 */
export const searchLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many search requests, please try again after 1 minute.',
  keyGenerator: (req) => req.user?.id || req.ip,
});

/**
 * Upload endpoints rate limiter - strict
 * 5 uploads per 15 minutes per user (consider storage costs)
 */
export const uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many upload attempts, please try again after 15 minutes.',
  keyGenerator: (req) => req.user?.id || req.ip,
});

/**
 * Subscription endpoints rate limiter - strict
 * 3 requests per minute per user (sensitive operations)
 */
export const subscriptionLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 3,
  message: 'Too many subscription requests, please try again after 1 minute.',
  keyGenerator: (req) => req.user?.id || req.ip,
});

/**
 * Export endpoints rate limiter - moderate
 * 5 exports per 15 minutes per user
 */
export const exportLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many export requests, please try again after 15 minutes.',
  keyGenerator: (req) => req.user?.id || req.ip,
});

/**
 * Custom rate limiter factory for specific routes
 * Usage: const customLimiter = createCustomLimiter(10, '1m');
 */
export function createCustomLimiter(maxRequests, windowMs, keyGenerator = null) {
  return createLimiter({
    windowMs: parseTimeWindow(windowMs),
    max: maxRequests,
    keyGenerator: keyGenerator || ((req) => req.user?.id || req.ip),
  });
}

/**
 * Parse time window string to milliseconds
 * Usage: parseTimeWindow('5m') => 300000
 */
export function parseTimeWindow(timeStr) {
  const units = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
  };
  
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('Invalid time window format');
  
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

/**
 * Sliding window rate limiter (more flexible than fixed windows)
 */
export function createSlidingWindowLimiter(maxRequests, windowMs) {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rate-limit-sliding:',
      expiry: Math.ceil(windowMs / 1000),
    }),
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
}

/**
 * Rate limit status endpoint for debugging
 * Usage: app.get('/admin/rate-limit/:key', rateLimitStatusHandler)
 */
export async function rateLimitStatusHandler(req, res) {
  try {
    const { key } = req.params;
    const limitKey = `rate-limit:${key}`;
    const count = await redis.get(limitKey);
    const ttl = await redis.ttl(limitKey);
    
    res.json({
      key,
      limitKey,
      currentCount: parseInt(count) || 0,
      ttl: ttl > 0 ? ttl : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Reset rate limit for a specific key
 * Usage: app.post('/admin/rate-limit/:key/reset', rateLimitResetHandler)
 */
export async function rateLimitResetHandler(req, res) {
  try {
    const { key } = req.params;
    const limitKey = `rate-limit:${key}`;
    await redis.del(limitKey);
    
    res.json({
      message: `Rate limit reset for ${key}`,
      key,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Configure rate limiting for an Express app
 * Usage: configureRateLimiting(app);
 */
export function configureRateLimiting(app) {
  console.log('[Rate Limiting] Configuring rate limit middleware');
  
  // Apply global rate limiter
  app.use(globalLimiter);
  
  // Auth endpoints
  app.post('/auth/login', authLimiter);
  app.post('/auth/register', authLimiter);
  app.post('/auth/reset-password', authLimiter);
  
  // API endpoints
  app.use('/api/', apiLimiter);
  
  // Quantum endpoints (stricter)
  app.use('/api/quantum/', quantumLimiter);
  
  // Search endpoints
  app.use('/api/search/', searchLimiter);
  
  // Upload endpoints
  app.post('/api/upload', uploadLimiter);
  app.put('/api/upload', uploadLimiter);
  
  // Subscription endpoints
  app.use('/api/subscription/', subscriptionLimiter);
  
  // Export endpoints
  app.get('/api/export/', exportLimiter);
  
  // Webhook endpoints
  app.post('/webhooks/stripe', webhookLimiter);
  app.post('/webhooks/*', webhookLimiter);
  
  // Admin endpoints for rate limit management
  app.get('/admin/rate-limit/:key', rateLimitStatusHandler);
  app.post('/admin/rate-limit/:key/reset', rateLimitResetHandler);
  
  console.log('[Rate Limiting] Configuration complete');
}

/**
 * Rate limit info middleware to add info to response
 */
export function addRateLimitInfo(req, res, next) {
  res.locals.rateLimit = req.rateLimit;
  next();
}

export default {
  globalLimiter,
  authLimiter,
  apiLimiter,
  quantumLimiter,
  webhookLimiter,
  searchLimiter,
  uploadLimiter,
  subscriptionLimiter,
  exportLimiter,
  createCustomLimiter,
  parseTimeWindow,
  createSlidingWindowLimiter,
  configureRateLimiting,
  addRateLimitInfo,
};
