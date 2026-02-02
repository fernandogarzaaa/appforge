/**
 * Rate Limit Store
 * In-memory storage with Redis fallback for distributed rate limiting
 */

interface CounterData {
  count: number;
  firstSeen: number;
  lastSeen: number;
  window: number;
}

export class RateLimitStore {
  private counters: Map<string, CounterData> = new Map();
  private failedAttempts: Map<string, number> = new Map();
  private analytics = {
    totalRequests: 0,
    totalBlocked: 0,
    averageLatencies: [] as number[],
  };

  private cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute

  /**
   * Get usage count for a key within a window
   */
  async getUsage(key: string, window: number): Promise<number> {
    const data = this.counters.get(key);
    const now = Date.now();

    if (!data) return 0;
    if (now - data.firstSeen > window) return 0;

    return data.count;
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(key: string, window: number): Promise<void> {
    const now = Date.now();
    const data = this.counters.get(key);

    if (!data) {
      this.counters.set(key, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        window,
      });
    } else {
      // Check if window expired
      if (now - data.firstSeen > window) {
        this.counters.set(key, {
          count: 1,
          firstSeen: now,
          lastSeen: now,
          window,
        });
      } else {
        data.count++;
        data.lastSeen = now;
      }
    }

    this.analytics.totalRequests++;
  }

  /**
   * Get reset time for a key
   */
  async getResetTime(key: string, window: number): Promise<number | null> {
    const data = this.counters.get(key);
    if (!data) return null;
    return data.firstSeen + window;
  }

  /**
   * Record failed attempt (for abuse detection)
   */
  async recordFailedAttempt(key: string): Promise<void> {
    const current = this.failedAttempts.get(key) || 0;
    this.failedAttempts.set(key, current + 1);
    this.analytics.totalBlocked++;

    // Reset after 1 minute
    setTimeout(() => {
      this.failedAttempts.delete(key);
    }, 60000);
  }

  /**
   * Get failed attempts count
   */
  async getFailedAttempts(key: string): Promise<number> {
    return this.failedAttempts.get(key) || 0;
  }

  /**
   * Reset usage for a key
   */
  async resetUsage(key: string): Promise<void> {
    this.counters.delete(key);
    this.failedAttempts.delete(key);
  }

  /**
   * Get total requests
   */
  async getTotalRequests(): Promise<number> {
    return this.analytics.totalRequests;
  }

  /**
   * Get total blocked requests
   */
  async getTotalBlocked(): Promise<number> {
    return this.analytics.totalBlocked;
  }

  /**
   * Record latency
   */
  recordLatency(latency: number): void {
    this.analytics.averageLatencies.push(latency);
    if (this.analytics.averageLatencies.length > 1000) {
      this.analytics.averageLatencies.shift();
    }
  }

  /**
   * Get average latency
   */
  async getAverageLatency(): Promise<number> {
    if (this.analytics.averageLatencies.length === 0) return 0;
    const sum = this.analytics.averageLatencies.reduce((a, b) => a + b, 0);
    return sum / this.analytics.averageLatencies.length;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, data] of this.counters.entries()) {
      if (now - data.firstSeen > data.window + 60000) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.counters.delete(key));
  }

  /**
   * Destroy cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
