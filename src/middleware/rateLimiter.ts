/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and cost overruns
 */

import rateLimit from 'express-rate-limit';
import { cache } from '../services/redisCache';

/**
 * Global rate limiter (all requests)
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate limit health checks
    return req.path === '/health';
  },
});

/**
 * Quantum analysis rate limiter (expensive operations)
 */
export const quantumLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req, res) => {
    // Get user's subscription tier
    const userId = req.user?.id;
    if (!userId) return 10; // 10 per hour for anonymous

    const prefs = await cache.getUserPreferences(userId);
    
    switch (prefs?.subscription || 'free') {
      case 'free':
        return 10; // 10 per hour
      case 'pro':
        return 100; // 100 per hour
      case 'enterprise':
        return 1000; // 1000 per hour
      default:
        return 10;
    }
  },
  message: 'Quantum analysis limit exceeded for your subscription tier',
  skip: (req) => req.user?.role === 'admin',
});

/**
 * API key rate limiter
 */
export const apiKeyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10000, // 10k requests per day
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  },
  message: 'API key rate limit exceeded',
});

/**
 * Login attempt limiter
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later',
  onLimitReached: (req, res, options) => {
    console.warn(`Login attempt limit reached from ${req.ip}`);
  },
});

/**
 * Signup rate limiter
 */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 signups per hour
  keyGenerator: (req) => req.ip,
  message: 'Too many signup attempts from this IP',
});

/**
 * Stripe webhook limiter (very permissive)
 */
export const stripeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  skip: (req) => {
    // Verify Stripe signature
    return req.headers['stripe-signature'] === undefined;
  },
});

/**
 * Custom rate limiter middleware factory
 */
export function createCustomLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests',
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Cost-aware rate limiter
 * Limits based on estimated API call costs
 */
export async function costAwareLimiter(req: any, res: any, next: any) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Estimate cost of operation
  const costEstimate = estimateOperationCost(req);

  // Check user credits
  const userPrefs = await cache.getUserPreferences(userId);
  if (!userPrefs) {
    return res.status(403).json({ error: 'User preferences not found' });
  }

  if (userPrefs.credits < costEstimate) {
    return res.status(429).json({
      error: 'Insufficient credits',
      required: costEstimate,
      available: userPrefs.credits,
    });
  }

  // Reserve credits
  userPrefs.credits -= costEstimate;
  await cache.cacheUserPreferences(userId, userPrefs);

  // Attach cost info to request
  req.cost = costEstimate;
  req.remainingCredits = userPrefs.credits;

  next();
}

/**
 * Estimate operation cost based on request
 */
function estimateOperationCost(req: any): number {
  const path = req.path;
  const method = req.method;

  // Quantum analysis is expensive
  if (path.includes('/quantum')) {
    return 100; // 100 credits per quantum analysis
  }

  // AI consensus is moderately expensive
  if (path.includes('/consensus')) {
    return 50; // 50 credits per consensus
  }

  // Standard API calls are cheap
  if (method === 'GET') {
    return 1; // 1 credit per read
  }

  if (method === 'POST' || method === 'PUT') {
    return 5; // 5 credits per write
  }

  return 1; // default 1 credit
}

/**
 * Rate limit info middleware
 * Adds rate limit info to response headers
 */
export function rateLimitInfo(limiter: any) {
  return (req: any, res: any, next: any) => {
    res.on('finish', () => {
      if (res.get('RateLimit-Limit')) {
        console.log(`Rate limit: ${res.get('RateLimit-Remaining')}/${res.get('RateLimit-Limit')}`);
      }
    });
    next();
  };
}

export default {
  globalLimiter,
  quantumLimiter,
  apiKeyLimiter,
  loginLimiter,
  signupLimiter,
  stripeLimiter,
  createCustomLimiter,
  costAwareLimiter,
  rateLimitInfo,
};
