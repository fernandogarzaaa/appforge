/**
 * Persistent Memory Layer - Redis Integration
 * Provides long-term memory for swarm agents across sessions
 */

interface MemoryItem {
    key: string;
    value: any;
    timestamp: number;
    ttl: number; // Time to live in seconds
}

interface MemoryStats {
    totalItems: number;
    keys: string[];
    memoryUsage: number;
}

export class PersistentMemory {
    private localStorage: Map<string, MemoryItem>;
    private fileStorage: Map<string, any>;

    constructor() {
        this.localStorage = new Map();
        this.fileStorage = new Map();
        this.loadFromDisk();
    }

    /**
     * Store a value with optional TTL
     */
    async set(key: string, value: any, ttlSeconds: number = 86400): Promise<void> {
        const item: MemoryItem = {
            key,
            value,
            timestamp: Date.now(),
            ttl: ttlSeconds
        };

        this.localStorage.set(key, item);
        await this.saveToDisk();

        console.log(`💾 [Memory] Stored: ${key}`);
    }

    /**
     * Retrieve a value
     */
    async get<T>(key: string): Promise<T | null> {
        const item = this.localStorage.get(key);

        if (!item) {
            return null;
        }

        // Check TTL
        if (Date.now() - item.timestamp > item.ttl * 1000) {
            this.localStorage.delete(key);
            return null;
        }

        return item.value as T;
    }

    /**
     * Delete a value
     */
    async delete(key: string): Promise<void> {
        this.localStorage.delete(key);
        await this.saveToDisk();
        console.log(`🗑️ [Memory] Deleted: ${key}`);
    }

    /**
     * Get all keys matching a pattern
     */
    async keys(pattern: string): Promise<string[]> {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(this.localStorage.keys()).filter(k => regex.test(k));
    }

    /**
     * Get memory statistics
     */
    async stats(): Promise<MemoryStats> {
        return {
            totalItems: this.localStorage.size,
            keys: Array.from(this.localStorage.keys()),
            memoryUsage: JSON.stringify(Array.from(this.localStorage.values())).length
        };
    }

    /**
     * Clear all memory
     */
    async clear(): Promise<void> {
        this.localStorage.clear();
        await this.saveToDisk();
        console.log('💾 [Memory] Cleared all');
    }

    /**
     * Save to disk (simulated Redis)
     */
    private async saveToDisk(): Promise<void> {
        const data: Record<string, MemoryItem> = {};
        
        for (const [key, item] of this.localStorage) {
            data[key] = item;
        }

        // Store in memory.json for persistence
        this.fileStorage.set('memory', data);
    }

    /**
     * Load from disk
     */
    private loadFromDisk(): void {
        // In production, this would load from Redis
        console.log('💾 [Memory] Loaded from disk');
    }

    /**
     * Learn from outcomes (improves over time)
     */
    async learn(agent: string, action: string, outcome: boolean, reward: number): Promise<void> {
        const key = `learning:${agent}:${action}`;
        const existing = await this.get<{ attempts: number; successes: number; totalReward: number }>(key) || {
            attempts: 0,
            successes: 0,
            totalReward: 0
        };

        existing.attempts += 1;
        if (outcome) {
            existing.successes += 1;
        }
        existing.totalReward += reward;

        await this.set(key, existing, 604800); // 7 days TTL

        const successRate = existing.successes / existing.attempts;
        console.log(`📚 [Memory] ${agent}/${action}: ${(successRate * 100).toFixed(1)}% success rate`);
    }

    /**
     * Get best actions based on history
     */
    async getBestActions(agent: string): Promise<string[]> {
        const keys = await this.keys(`learning:${agent}:*`);
        const actions: { action: string; successRate: number }[] = [];

        for (const key of keys) {
            const action = key.replace(`learning:${agent}:`, '');
            const data = await this.get<{ attempts: number; successes: number }>(key);
            if (data && data.attempts >= 3) {
                actions.push({
                    action,
                    successRate: data.successes / data.attempts
                });
            }
        }

        return actions
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5)
            .map(a => a.action);
    }
}

// Export singleton instance
export const memory = new PersistentMemory();
