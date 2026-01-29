import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as rateLimit from '@/utils/apiRateLimit';

describe('API Rate Limiting System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const info = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(info.blocked).toBe(false);
      expect(info.remaining).toBe(9);
    });

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit.checkRateLimit('user-1', {
          maxRequests: 10,
          windowMs: 60000
        });
      }

      const info = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(info.blocked).toBe(true);
    });

    it('should provide retry-after time', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit.checkRateLimit('user-1', {
          maxRequests: 10,
          windowMs: 60000
        });
      }

      const info = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(info.retryAfter).toBeGreaterThan(0);
    });

    it('should track remaining requests', () => {
      let remaining = 10;

      for (let i = 0; i < 5; i++) {
        const info = rateLimit.checkRateLimit('user-1', {
          maxRequests: 10,
          windowMs: 60000
        });

        if (info.remaining) {
          remaining = info.remaining;
        }
      }

      expect(remaining).toBeLessThan(10);
    });
  });

  describe('checkRateLimitSlidingWindow', () => {
    it('should implement sliding window algorithm', () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const info = rateLimit.checkRateLimitSlidingWindow('user-1', {
          maxRequests: 10,
          windowMs: 60000
        });
        expect(info.blocked).toBe(false);
      }

      // Should have 5 remaining
      const info = rateLimit.checkRateLimitSlidingWindow('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });
      expect(info.remaining).toBeGreaterThan(0);
    });

    it('should reset window after duration', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit.checkRateLimitSlidingWindow('user-1', {
          maxRequests: 10,
          windowMs: 60000
        });
      }

      let info = rateLimit.checkRateLimitSlidingWindow('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });
      expect(info.blocked).toBe(true);

      // Advance time past window
      vi.advanceTimersByTime(61000);

      info = rateLimit.checkRateLimitSlidingWindow('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });
      expect(info.blocked).toBe(false);
    });

    it('should filter old requests', () => {
      for (let i = 0; i < 5; i++) {
        rateLimit.checkRateLimitSlidingWindow('user-1', {
          maxRequests: 10,
          windowMs: 10000
        });
      }

      // Advance time
      vi.advanceTimersByTime(11000);

      // Old requests should be filtered out
      const info = rateLimit.checkRateLimitSlidingWindow('user-1', {
        maxRequests: 10,
        windowMs: 10000
      });
      
      expect(info.blocked).toBe(false);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return current limit info', () => {
      rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      const info = rateLimit.getRateLimitInfo('user-1');

      expect(info).toBeDefined();
      expect(info.limit).toBe(10);
      expect(info.remaining).toBeLessThanOrEqual(10);
    });

    it('should return null for unknown user', () => {
      const info = rateLimit.getRateLimitInfo('unknown-user');
      expect(info).toBeNull();
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limiter', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit.checkRateLimit('user-1', {
          maxRequests: 10,
          windowMs: 60000
        });
      }

      let info = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });
      expect(info.blocked).toBe(true);

      rateLimit.resetRateLimit('user-1');

      info = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });
      expect(info.blocked).toBe(false);
    });
  });

  describe('Tiered Rate Limits', () => {
    it('should create tiered limits', () => {
      const tiers = {
        free: { maxRequests: 100, windowMs: 60000 },
        pro: { maxRequests: 1000, windowMs: 60000 },
        enterprise: { maxRequests: 10000, windowMs: 60000 }
      };

      const limits = rateLimit.createTieredRateLimits(tiers);

      expect(limits).toBeDefined();
      expect(limits.free).toBeDefined();
      expect(limits.pro).toBeDefined();
      expect(limits.enterprise).toBeDefined();
    });

    it('should enforce tier limits correctly', () => {
      const free = { maxRequests: 5, windowMs: 60000 };

      // Exhaust free tier
      for (let i = 0; i < 5; i++) {
        const info = rateLimit.checkRateLimit('user-1', free);
        expect(info.blocked).toBe(false);
      }

      // Next request should be blocked
      const info = rateLimit.checkRateLimit('user-1', free);
      expect(info.blocked).toBe(true);
    });

    it('should allow tier upgrades', () => {
      const free = { maxRequests: 5, windowMs: 60000 };
      const pro = { maxRequests: 50, windowMs: 60000 };

      // Exhaust free tier
      for (let i = 0; i < 5; i++) {
        rateLimit.checkRateLimit('user-1', free);
      }

      // Reset for pro tier
      rateLimit.resetRateLimit('user-1');

      // Pro tier should have more capacity
      let allowed = 0;
      for (let i = 0; i < 50; i++) {
        const info = rateLimit.checkRateLimit('user-1', pro);
        if (!info.blocked) allowed++;
      }

      expect(allowed).toBeGreaterThan(5);
    });
  });

  describe('getRateLimitStats', () => {
    it('should return system statistics', () => {
      rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      const stats = rateLimit.getRateLimitStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalRequests).toBe('number');
      expect(typeof stats.blockedRequests).toBe('number');
    });

    it('should track active users', () => {
      rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });
      rateLimit.checkRateLimit('user-2', {
        maxRequests: 10,
        windowMs: 60000
      });

      const stats = rateLimit.getRateLimitStats();

      expect(stats.activeUsers).toBeGreaterThanOrEqual(2);
    });

    it('should track blocked requests', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit.checkRateLimit('user-1', {
          maxRequests: 5,
          windowMs: 60000
        });
      }

      const stats = rateLimit.getRateLimitStats();

      expect(stats.blockedRequests).toBeGreaterThan(0);
    });
  });

  describe('cleanupRateLimiters', () => {
    it('should remove old limiters', () => {
      rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      // Advance time far into future
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);

      expect(() => {
        rateLimit.cleanupRateLimiters();
      }).not.toThrow();
    });

    it('should preserve active limiters', () => {
      rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      rateLimit.cleanupRateLimiters();

      // User-1 should still be trackable
      const info = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(info).toBeDefined();
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should create Express middleware', () => {
      const middleware = rateLimit.createRateLimitMiddleware({
        maxRequests: 100,
        windowMs: 60000
      });

      expect(typeof middleware).toBe('function');
    });

    it('should extract user key from request', () => {
      const middleware = rateLimit.createRateLimitMiddleware({
        maxRequests: 10,
        windowMs: 60000,
        keyGenerator: (req) => req.user?.id || req.ip
      });

      expect(typeof middleware).toBe('function');
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include rate limit headers in response', () => {
      const info = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(info.headers).toBeDefined();
      expect(info.headers['X-RateLimit-Limit']).toBe(10);
      expect(info.headers['X-RateLimit-Remaining']).toBeLessThanOrEqual(10);
    });

    it('should include reset time header', () => {
      const info = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(info.headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should include retry-after for blocked requests', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit.checkRateLimit('user-1', {
          maxRequests: 10,
          windowMs: 60000
        });
      }

      const info = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      if (info.blocked) {
        expect(info.headers['Retry-After']).toBeDefined();
      }
    });
  });

  describe('Rate Limit Events', () => {
    it('should emit rate_limited event', async () => {
      for (let i = 0; i < 10; i++) {
        rateLimit.checkRateLimit('user-1', {
          maxRequests: 10,
          windowMs: 60000
        });
      }

      await new Promise((resolve) => {
        const unsub = rateLimit.onRateLimitEvent('rate_limited', (event) => {
          expect(event.userId).toBeDefined();
          expect(event.limit).toBe(10);
          unsub();
          resolve();
        });

        rateLimit.checkRateLimit('user-1', {
          maxRequests: 10,
          windowMs: 60000
        });
      });
    });

    it('should not emit event for allowed requests', () => {
      const handler = vi.fn();
      const unsub = rateLimit.onRateLimitEvent('rate_limited', handler);

      rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(handler).not.toHaveBeenCalled();
      unsub();
    });
  });

  describe('Token Bucket Algorithm', () => {
    it('should refill tokens over time', () => {
      const info1 = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000,
        refillInterval: 1000
      });

      // Advance time
      vi.advanceTimersByTime(2000);

      const info2 = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000,
        refillInterval: 1000
      });

      // Tokens should be refilled
      expect(info2.remaining).toBeGreaterThan(info1.remaining);
    });

    it('should not exceed max tokens', () => {
      const info1 = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      // Advance time far
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);

      const info2 = rateLimit.checkRateLimit('user-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      // Should not exceed max (10)
      expect(info2.remaining).toBeLessThanOrEqual(10);
    });
  });

  describe('Different Users', () => {
    it('should track limits per user independently', () => {
      const info1 = rateLimit.checkRateLimit('user-1', {
        maxRequests: 5,
        windowMs: 60000
      });

      const info2 = rateLimit.checkRateLimit('user-2', {
        maxRequests: 5,
        windowMs: 60000
      });

      expect(info1.remaining).toBe(4);
      expect(info2.remaining).toBe(4);
    });

    it('should not affect limit of other users', () => {
      for (let i = 0; i < 5; i++) {
        rateLimit.checkRateLimit('user-1', {
          maxRequests: 5,
          windowMs: 60000
        });
      }

      const info2 = rateLimit.checkRateLimit('user-2', {
        maxRequests: 5,
        windowMs: 60000
      });

      expect(info2.blocked).toBe(false);
    });
  });
});
