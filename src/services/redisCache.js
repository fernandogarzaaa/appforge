/**
 * Redis Caching Layer
 * Centralized cache management for AI responses, user preferences, and analytics
 */
import Redis from 'redis';
class RedisCache {
    client;
    connected = false;
    async connect() {
        try {
            this.client = Redis.createClient({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            return false;
                        }
                        return Math.min(retries * 100, 3000);
                    }
                },
                password: process.env.REDIS_PASSWORD,
                database: parseInt(process.env.REDIS_DB || '0'),
            });
            this.client.on('error', (err) => console.error('Redis error:', err));
            this.client.on('connect', () => {
                this.connected = true;
                console.log('✅ Redis connected');
            });
            await this.client.connect();
        }
        catch (err) {
            console.error('Failed to connect to Redis:', err);
            this.connected = false;
        }
    }
    /**
     * Cache AI response from multiple models
     */
    async cacheAIResponse(query, responses, ttlSeconds = 3600) {
        if (!this.connected)
            return;
        const key = `ai:response:${this.hashQuery(query)}`;
        const value = JSON.stringify({
            query,
            responses,
            cached_at: new Date().toISOString(),
        });
        await this.client.setEx(key, ttlSeconds, value);
    }
    /**
     * Get cached AI response
     */
    async getAIResponse(query) {
        if (!this.connected)
            return null;
        const key = `ai:response:${this.hashQuery(query)}`;
        const cached = await this.client.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    }
    /**
     * Cache user preferences
     */
    async cacheUserPreferences(userId, prefs, ttlSeconds = 86400) {
        if (!this.connected)
            return;
        const key = `user:prefs:${userId}`;
        await this.client.setEx(key, ttlSeconds, JSON.stringify(prefs));
    }
    /**
     * Get cached user preferences
     */
    async getUserPreferences(userId) {
        if (!this.connected)
            return null;
        const key = `user:prefs:${userId}`;
        const cached = await this.client.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    }
    /**
     * Cache quantum analysis results
     */
    async cacheQuantumAnalysis(analysisId, result, ttlSeconds = 7200) {
        if (!this.connected)
            return;
        const key = `quantum:analysis:${analysisId}`;
        await this.client.setEx(key, ttlSeconds, JSON.stringify(result));
    }
    /**
     * Get cached quantum analysis
     */
    async getQuantumAnalysis(analysisId) {
        if (!this.connected)
            return null;
        const key = `quantum:analysis:${analysisId}`;
        const cached = await this.client.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    }
    /**
     * Cache analytics aggregates
     */
    async cacheAnalytics(metric, value, ttlSeconds = 1800) {
        if (!this.connected)
            return;
        const key = `analytics:${metric}`;
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    }
    /**
     * Get cached analytics
     */
    async getAnalytics(metric) {
        if (!this.connected)
            return null;
        const key = `analytics:${metric}`;
        const cached = await this.client.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    }
    /**
     * Increment counter for rate limiting
     */
    async incrementCounter(key, ttlSeconds = 60) {
        if (!this.connected)
            return 0;
        const fullKey = `counter:${key}`;
        const count = await this.client.incr(fullKey);
        if (count === 1) {
            await this.client.expire(fullKey, ttlSeconds);
        }
        return count;
    }
    /**
     * Check rate limit
     */
    async checkRateLimit(userId, operation, limit, windowSeconds = 3600) {
        const key = `ratelimit:${userId}:${operation}`;
        const count = await this.incrementCounter(key, windowSeconds);
        return count <= limit;
    }
    /**
     * Set rate limit TTL
     */
    async setRateLimitWindow(userId, operation, windowSeconds) {
        if (!this.connected)
            return;
        const key = `ratelimit:${userId}:${operation}`;
        await this.client.expire(key, windowSeconds);
    }
    /**
     * Clear cache key
     */
    async invalidate(key) {
        if (!this.connected)
            return;
        await this.client.del(`${key}`);
    }
    /**
     * Clear all cache
     */
    async flush() {
        if (!this.connected)
            return;
        await this.client.flushDb();
    }
    /**
     * Get cache stats
     */
    async getStats() {
        if (!this.connected)
            return null;
        const info = await this.client.info('stats');
        return {
            connected: this.connected,
            info,
        };
    }
    /**
     * Hash query for cache key
     */
    hashQuery(query) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(query).digest('hex').substring(0, 16);
    }
    /**
     * Close Redis connection
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.connected = false;
            console.log('Redis disconnected');
        }
    }
}
// Singleton instance
export const cache = new RedisCache();
// Initialize on module load
cache.connect().catch(err => console.error('Redis init error:', err));
export default cache;
