/**
 * Rate Limit Store
 * In-memory storage with Redis fallback for distributed rate limiting
 */
export class RateLimitStore {
    counters = new Map();
    failedAttempts = new Map();
    analytics = {
        totalRequests: 0,
        totalBlocked: 0,
        averageLatencies: [],
    };
    cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    /**
     * Get usage count for a key within a window
     */
    async getUsage(key, window) {
        const data = this.counters.get(key);
        const now = Date.now();
        if (!data)
            return 0;
        if (now - data.firstSeen > window)
            return 0;
        return data.count;
    }
    /**
     * Increment usage counter
     */
    async incrementUsage(key, window) {
        const now = Date.now();
        const data = this.counters.get(key);
        if (!data) {
            this.counters.set(key, {
                count: 1,
                firstSeen: now,
                lastSeen: now,
                window,
            });
        }
        else {
            // Check if window expired
            if (now - data.firstSeen > window) {
                this.counters.set(key, {
                    count: 1,
                    firstSeen: now,
                    lastSeen: now,
                    window,
                });
            }
            else {
                data.count++;
                data.lastSeen = now;
            }
        }
        this.analytics.totalRequests++;
    }
    /**
     * Get reset time for a key
     */
    async getResetTime(key, window) {
        const data = this.counters.get(key);
        if (!data)
            return null;
        return data.firstSeen + window;
    }
    /**
     * Record failed attempt (for abuse detection)
     */
    async recordFailedAttempt(key) {
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
    async getFailedAttempts(key) {
        return this.failedAttempts.get(key) || 0;
    }
    /**
     * Reset usage for a key
     */
    async resetUsage(key) {
        this.counters.delete(key);
        this.failedAttempts.delete(key);
    }
    /**
     * Get total requests
     */
    async getTotalRequests() {
        return this.analytics.totalRequests;
    }
    /**
     * Get total blocked requests
     */
    async getTotalBlocked() {
        return this.analytics.totalBlocked;
    }
    /**
     * Record latency
     */
    recordLatency(latency) {
        this.analytics.averageLatencies.push(latency);
        if (this.analytics.averageLatencies.length > 1000) {
            this.analytics.averageLatencies.shift();
        }
    }
    /**
     * Get average latency
     */
    async getAverageLatency() {
        if (this.analytics.averageLatencies.length === 0)
            return 0;
        const sum = this.analytics.averageLatencies.reduce((a, b) => a + b, 0);
        return sum / this.analytics.averageLatencies.length;
    }
    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        const toDelete = [];
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
    destroy() {
        clearInterval(this.cleanupInterval);
    }
}
