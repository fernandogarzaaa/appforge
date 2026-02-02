/**
 * Rate Limiting Service
 * Per-user and per-IP rate limiting with adaptive throttling
 */

import { RateLimitStore } from './rateLimitStore';

interface RateLimitConfig {
  // Per-user limits (requests per minute)
  perUserLimit: number;
  perUserWindow: number; // milliseconds

  // Per-IP limits (requests per minute)
  perIPLimit: number;
  perIPWindow: number;

  // Quantum analysis limits (stricter)
  quantumAnalysisLimit: number;
  quantumAnalysisWindow: number;

  // API key limits (generous)
  apiKeyLimit: number;
  apiKeyWindow: number;

  // Burst allowance (temporary spike tolerance)
  burstMultiplier: number;
  burstWindow: number;
}

interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
}

interface RequestContext {
  userId?: string;
  clientIP: string;
  apiKey?: string;
  endpoint: string;
  method: string;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;
  private blacklist: Set<string> = new Set();
  private whitelist: Set<string> = new Set();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      perUserLimit: 1000,
      perUserWindow: 60000, // 1 minute
      perIPLimit: 5000,
      perIPWindow: 60000,
      quantumAnalysisLimit: 100,
      quantumAnalysisWindow: 60000,
      apiKeyLimit: 10000,
      apiKeyWindow: 60000,
      burstMultiplier: 1.5,
      burstWindow: 5000, // 5 seconds
      ...config,
    };
    this.store = new RateLimitStore();
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(context: RequestContext): Promise<RateLimitStatus> {
    const { userId, clientIP, apiKey, endpoint, method } = context;

    // Check blacklist first
    if (this.blacklist.has(clientIP) || (userId && this.blacklist.has(userId))) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000, // Blocked for 1 hour
        reason: 'IP/User is blacklisted due to abuse',
      };
    }

    // Whitelist bypass
    if (this.whitelist.has(clientIP) || (userId && this.whitelist.has(userId))) {
      return {
        allowed: true,
        remaining: this.config.perUserLimit,
        resetTime: Date.now() + this.config.perUserWindow,
      };
    }

    // Determine which limit to check
    let limit = this.config.perIPLimit;
    let window = this.config.perIPWindow;
    let key = `ip:${clientIP}`;

    // Stricter limits for quantum endpoints
    if (endpoint.includes('/api/quantum')) {
      limit = this.config.quantumAnalysisLimit;
      window = this.config.quantumAnalysisWindow;
    }

    // Per-user limits (if authenticated)
    if (userId) {
      key = `user:${userId}`;
      limit = this.config.perUserLimit;
      window = this.config.perUserWindow;
    }

    // API key limits (if provided)
    if (apiKey) {
      key = `key:${apiKey}`;
      limit = this.config.apiKeyLimit;
      window = this.config.apiKeyWindow;
    }

    // Check current usage
    const usage = await this.store.getUsage(key, window);
    const remaining = Math.max(0, limit - usage);

    if (usage >= limit) {
      // Check if burst tolerance applies
      const burstKey = `burst:${key}`;
      const burstUsage = await this.store.getUsage(burstKey, this.config.burstWindow);
      const burstLimit = Math.ceil(limit * this.config.burstMultiplier);

      if (burstUsage >= burstLimit) {
        // Hard limit exceeded
        await this.store.recordFailedAttempt(key);

        // Auto-blacklist after 10 failed attempts in 1 minute
        const failedAttempts = await this.store.getFailedAttempts(key);
        if (failedAttempts > 10) {
          this.blacklist.add(key);
        }

        const resetTime = (await this.store.getResetTime(key, window)) || Date.now() + window;

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
          reason: `Rate limit exceeded. ${remaining} requests remaining. Retry after ${Math.ceil(
            (resetTime - Date.now()) / 1000
          )}s`,
        };
      }
    }

    // Increment counter
    await this.store.incrementUsage(key, window);

    return {
      allowed: true,
      remaining: Math.max(0, limit - usage - 1),
      resetTime: (await this.store.getResetTime(key, window)) || Date.now() + window,
    };
  }

  /**
   * Get rate limit status for monitoring
   */
  async getStatus(key: string): Promise<{
    perUser: number;
    perIP: number;
    quantum: number;
    perKey: number;
  }> {
    const now = Date.now();
    return {
      perUser: await this.store.getUsage(`user:${key}`, this.config.perUserWindow),
      perIP: await this.store.getUsage(`ip:${key}`, this.config.perIPWindow),
      quantum: await this.store.getUsage(`quantum:${key}`, this.config.quantumAnalysisWindow),
      perKey: await this.store.getUsage(`key:${key}`, this.config.apiKeyWindow),
    };
  }

  /**
   * Whitelist IP/User (bypass rate limiting)
   */
  whitelistKey(key: string): void {
    this.whitelist.add(key);
  }

  /**
   * Blacklist IP/User (block all requests)
   */
  blacklistKey(key: string, duration: number = 3600000): void {
    this.blacklist.add(key);
    setTimeout(() => {
      this.blacklist.delete(key);
    }, duration);
  }

  /**
   * Remove from blacklist
   */
  removeBlacklist(key: string): void {
    this.blacklist.delete(key);
  }

  /**
   * Check if key is blacklisted
   */
  isBlacklisted(key: string): boolean {
    return this.blacklist.has(key);
  }

  /**
   * Get all blacklisted keys
   */
  getBlacklist(): string[] {
    return Array.from(this.blacklist);
  }

  /**
   * Reset counter for a key
   */
  async resetKey(key: string): Promise<void> {
    await this.store.resetUsage(key);
  }

  /**
   * Get analytics for rate limiting
   */
  async getAnalytics(): Promise<{
    totalRequests: number;
    blockedRequests: number;
    blacklistedKeys: number;
    whitelistedKeys: number;
    averageLatency: number;
  }> {
    return {
      totalRequests: await this.store.getTotalRequests(),
      blockedRequests: await this.store.getTotalBlocked(),
      blacklistedKeys: this.blacklist.size,
      whitelistedKeys: this.whitelist.size,
      averageLatency: await this.store.getAverageLatency(),
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter({
  perUserLimit: 1000,
  perUserWindow: 60000,
  perIPLimit: 5000,
  perIPWindow: 60000,
  quantumAnalysisLimit: 100,
  quantumAnalysisWindow: 60000,
  apiKeyLimit: 10000,
  apiKeyWindow: 60000,
});
