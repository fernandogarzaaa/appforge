/**
 * API Rate Limiting System
 * Implements token bucket and sliding window algorithms for rate limiting
 * 
 * @typedef {Object} RateLimitConfig
 * @property {number} maxRequests
 * @property {number} windowMs
 * @property {string} [keyPrefix]
 * @property {boolean} [skipSuccessfulRequests]
 * @property {boolean} [skipFailedRequests]
 * 
 * @typedef {Object} RateLimitInfo
 * @property {number} limit
 * @property {number} remaining
 * @property {Date} reset
 * @property {number} [retryAfter]
 * @property {boolean} blocked
 */

const rateLimiters = new Map();
const rateLimitListeners = new Map();

/**
 * Create or get rate limiter for key
 */
export const getRateLimiter = (key, config = {}) => {
  const defaultConfig = {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    keyPrefix: 'api:',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  const mergedConfig = { ...defaultConfig, ...config };
  const fullKey = mergedConfig.keyPrefix + key;

  if (!rateLimiters.has(fullKey)) {
    rateLimiters.set(fullKey, {
      key: fullKey,
      config: mergedConfig,
      requests: [],
      tokens: mergedConfig.maxRequests,
      lastRefillTime: Date.now(),
    });
  }

  return rateLimiters.get(fullKey);
};

/**
 * Check if request should be allowed (token bucket algorithm)
 */
export const checkRateLimit = (key, config = {}) => {
  const limiter = getRateLimiter(key, config);
  const now = Date.now();

  // Refill tokens based on elapsed time
  const timePassed = now - limiter.lastRefillTime;
  const tokensToAdd = (timePassed / limiter.config.windowMs) * limiter.config.maxRequests;
  
  limiter.tokens = Math.min(
    limiter.config.maxRequests,
    limiter.tokens + tokensToAdd
  );
  limiter.lastRefillTime = now;

  // Check if we have tokens available
  const allowed = limiter.tokens >= 1;

  if (allowed) {
    limiter.tokens -= 1;
  }

  const resetTime = new Date(limiter.lastRefillTime + limiter.config.windowMs);
  const remaining = Math.floor(limiter.tokens);
  const retryAfter = allowed ? undefined : Math.ceil((1 - limiter.tokens) * limiter.config.windowMs / 1000);

  const info = {
    limit: limiter.config.maxRequests,
    remaining: Math.max(0, remaining),
    reset: resetTime,
    retryAfter,
    blocked: !allowed,
  };

  notifyRateLimitListeners('rate_limit_checked', { key, info, allowed });

  return info;
};

/**
 * Check rate limit with sliding window algorithm
 */
export const checkRateLimitSlidingWindow = (key, config = {}) => {
  const limiter = getRateLimiter(key, config);
  const now = Date.now();

  // Remove old requests outside the window
  limiter.requests = limiter.requests.filter(
    timestamp => now - timestamp < limiter.config.windowMs
  );

  const allowed = limiter.requests.length < limiter.config.maxRequests;

  if (allowed) {
    limiter.requests.push(now);
  }

  const resetTime = limiter.requests.length > 0
    ? new Date(limiter.requests[0] + limiter.config.windowMs)
    : new Date(now + limiter.config.windowMs);

  const remaining = limiter.config.maxRequests - limiter.requests.length;
  const retryAfter = allowed ? undefined : Math.ceil((limiter.requests[0] + limiter.config.windowMs - now) / 1000);

  const info = {
    limit: limiter.config.maxRequests,
    remaining: Math.max(0, remaining),
    reset: resetTime,
    retryAfter,
    blocked: !allowed,
  };

  notifyRateLimitListeners('rate_limit_checked', { key, info, allowed });

  return info;
};

/**
 * Get rate limit info for key
 */
export const getRateLimitInfo = (key, config = {}) => {
  const limiter = getRateLimiter(key, config);
  const now = Date.now();

  const resetTime = new Date(limiter.lastRefillTime + limiter.config.windowMs);
  const remaining = Math.max(0, Math.floor(limiter.tokens));

  return {
    limit: limiter.config.maxRequests,
    remaining,
    reset: resetTime,
    blocked: limiter.tokens < 1,
  };
};

/**
 * Reset rate limit for key
 */
export const resetRateLimit = (key) => {
  const keyPrefix = 'api:';
  const fullKey = keyPrefix + key;

  if (rateLimiters.has(fullKey)) {
    const limiter = rateLimiters.get(fullKey);
    limiter.tokens = limiter.config.maxRequests;
    limiter.requests = [];
    limiter.lastRefillTime = Date.now();

    notifyRateLimitListeners('rate_limit_reset', { key, fullKey });
  }
};

/**
 * Create rate limit middleware
 */
export const createRateLimitMiddleware = (config = {}) => {
  return (req, res, next) => {
    const keyPrefix = config.keyPrefix || 'api:';
    const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || 'unknown';
    const fullKey = keyPrefix + key;

    const info = config.useSlidingWindow
      ? checkRateLimitSlidingWindow(key, config)
      : checkRateLimit(key, config);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(info.limit));
    res.set('X-RateLimit-Remaining', String(info.remaining));
    res.set('X-RateLimit-Reset', info.reset.toISOString());

    if (info.blocked) {
      res.set('Retry-After', String(info.retryAfter));
      
      notifyRateLimitListeners('rate_limit_exceeded', {
        key,
        fullKey,
        info,
      });

      if (config.onLimitReached) {
        config.onLimitReached(req, res);
      } else {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: info.retryAfter,
          resetAt: info.reset.toISOString(),
        });
      }
    }

    next();
  };
};

/**
 * Get rate limit statistics
 */
export const getRateLimitStats = () => {
  const stats = {
    totalKeys: rateLimiters.size,
    limiters: [],
  };

  for (const [key, limiter] of rateLimiters) {
    stats.limiters.push({
      key,
      config: limiter.config,
      currentTokens: Math.floor(limiter.tokens),
      requestsInWindow: limiter.requests.length,
      lastRefillTime: new Date(limiter.lastRefillTime),
    });
  }

  return stats;
};

/**
 * Cleanup old rate limiters
 */
export const cleanupRateLimiters = (minAgeMs = 24 * 60 * 60 * 1000) => {
  const now = Date.now();
  let removedCount = 0;

  for (const [key, limiter] of rateLimiters) {
    if (now - limiter.lastRefillTime > minAgeMs && limiter.requests.length === 0) {
      rateLimiters.delete(key);
      removedCount++;
    }
  }

  notifyRateLimitListeners('cleanup_completed', { removedCount });

  return removedCount;
};

/**
 * Subscribe to rate limit events
 */
export const onRateLimitEvent = (eventType, callback) => {
  if (!rateLimitListeners.has(eventType)) {
    rateLimitListeners.set(eventType, []);
  }
  rateLimitListeners.get(eventType).push(callback);

  return () => {
    const callbacks = rateLimitListeners.get(eventType);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  };
};

/**
 * Create tiered rate limits (different limits for different tiers)
 */
export const createTieredRateLimits = (tiers = {}) => {
  const defaultTiers = {
    free: { maxRequests: 100, windowMs: 60000 },
    pro: { maxRequests: 1000, windowMs: 60000 },
    enterprise: { maxRequests: 10000, windowMs: 60000 },
    ...tiers,
  };

  return {
    getTierConfig: (tier) => defaultTiers[tier],
    checkTierLimit: (key, tier) => {
      const config = defaultTiers[tier];
      if (!config) throw new Error(`Unknown tier: ${tier}`);
      return checkRateLimit(key, config);
    },
  };
};

/**
 * Notify rate limit listeners
 */
function notifyRateLimitListeners(eventType, data) {
  const listeners = rateLimitListeners.get(eventType) || [];
  listeners.forEach(callback => callback(data));
}

export default {
  getRateLimiter,
  checkRateLimit,
  checkRateLimitSlidingWindow,
  getRateLimitInfo,
  resetRateLimit,
  createRateLimitMiddleware,
  getRateLimitStats,
  cleanupRateLimiters,
  onRateLimitEvent,
  createTieredRateLimits,
};
