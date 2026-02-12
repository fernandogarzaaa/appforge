/**
 * Persistent Memory Layer - Redis Integration
 * Provides long-term memory for swarm agents across sessions
 */

import * as fs from 'fs/promises';
import path from 'path';

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
    private storageFile: string;
    private loadPromise: Promise<void>;

    constructor() {
        this.localStorage = new Map();
        this.storageFile = path.join(process.cwd(), 'swarm', 'data', 'persistent_memory.json');
        this.loadPromise = this.loadFromDisk();
    }

    /**
     * Store a value with optional TTL
     */
    async set(key: string, value: any, ttlSeconds: number = 86400): Promise<void> {
        await this.loadPromise;
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
        await this.loadPromise;
        const item = this.localStorage.get(key);

        if (!item) {
            return null;
        }

        // Check TTL
        if (Date.now() - item.timestamp > item.ttl * 1000) {
            this.localStorage.delete(key);
            await this.saveToDisk();
            return null;
        }

        return item.value as T;
    }

    /**
     * Delete a value
     */
    async delete(key: string): Promise<void> {
        await this.loadPromise;
        this.localStorage.delete(key);
        await this.saveToDisk();
        console.log(`🗑️ [Memory] Deleted: ${key}`);
    }

    /**
     * Get all keys matching a pattern
     */
    async keys(pattern: string): Promise<string[]> {
        await this.loadPromise;
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(this.localStorage.keys()).filter(k => regex.test(k));
    }

    /**
     * Get memory statistics
     */
    async stats(): Promise<MemoryStats> {
        await this.loadPromise;
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
        await this.loadPromise;
        this.localStorage.clear();
        await this.saveToDisk();
        console.log('💾 [Memory] Cleared all');
    }

    /**
     * Save to disk (simulated Redis)
     */
    private async saveToDisk(): Promise<void> {
        const data: Record<string, MemoryItem> = Object.fromEntries(this.localStorage);
        await fs.mkdir(path.dirname(this.storageFile), { recursive: true });
        await fs.writeFile(this.storageFile, JSON.stringify(data, null, 2), 'utf8');
    }

    /**
     * Load from disk
     */
    private async loadFromDisk(): Promise<void> {
        try {
            const raw = await fs.readFile(this.storageFile, 'utf8');
            const parsed = JSON.parse(raw) as Record<string, MemoryItem>;
            for (const [key, value] of Object.entries(parsed)) {
                if (value && typeof value === 'object') {
                    this.localStorage.set(key, value);
                }
            }
            console.log(`💾 [Memory] Loaded ${this.localStorage.size} items from disk`);
        } catch {
            console.log('💾 [Memory] No existing disk state found, starting fresh');
        }
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
