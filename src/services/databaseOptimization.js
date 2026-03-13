/**
 * Database Optimization Service
 * Handles query indexing, connection pooling, and read replicas
 */
class DatabaseOptimizationEngine {
    indices = new Map();
    poolConfig;
    readReplicas = [];
    queryStats = new Map();
    constructor() {
        this.poolConfig = {
            min: 5,
            max: 50,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        };
        this.initializeIndices();
    }
    /**
     * Initialize critical database indices
     */
    initializeIndices() {
        // User indices
        this.addIndex('users', {
            name: 'idx_users_email',
            fields: ['email'],
            unique: true
        });
        this.addIndex('users', {
            name: 'idx_users_username',
            fields: ['username'],
            unique: true
        });
        this.addIndex('users', {
            name: 'idx_users_created_at',
            fields: ['createdAt']
        });
        // Project indices
        this.addIndex('projects', {
            name: 'idx_projects_user_id',
            fields: ['userId']
        });
        this.addIndex('projects', {
            name: 'idx_projects_status',
            fields: ['status', 'createdAt']
        });
        this.addIndex('projects', {
            name: 'idx_projects_public',
            fields: ['isPublic', 'updatedAt']
        });
        // API Key indices
        this.addIndex('apikeys', {
            name: 'idx_apikeys_key_hash',
            fields: ['keyHash'],
            unique: true
        });
        this.addIndex('apikeys', {
            name: 'idx_apikeys_user_id',
            fields: ['userId', 'active']
        });
        // Analytics indices
        this.addIndex('analytics', {
            name: 'idx_analytics_user_date',
            fields: ['userId', 'date']
        });
        this.addIndex('analytics', {
            name: 'idx_analytics_event_time',
            fields: ['eventType', 'timestamp']
        });
        // Webhook indices
        this.addIndex('webhooks', {
            name: 'idx_webhooks_user_id',
            fields: ['userId', 'active']
        });
        this.addIndex('webhooks', {
            name: 'idx_webhooks_events',
            fields: ['events']
        });
        // Quantum analysis indices
        this.addIndex('quantum_analyses', {
            name: 'idx_quantum_user_status',
            fields: ['userId', 'status']
        });
        this.addIndex('quantum_analyses', {
            name: 'idx_quantum_created_at',
            fields: ['createdAt']
        });
    }
    /**
     * Add index to a collection
     */
    addIndex(collection, index) {
        if (!this.indices.has(collection)) {
            this.indices.set(collection, []);
        }
        this.indices.get(collection).push(index);
    }
    /**
     * Get all indices for a collection
     */
    getIndices(collection) {
        return this.indices.get(collection) || [];
    }
    /**
     * Configure connection pooling
     */
    configureConnectionPool(config) {
        this.poolConfig = { ...this.poolConfig, ...config };
        console.log(`[DB] Connection pool configured:`, this.poolConfig);
        return this.poolConfig;
    }
    /**
     * Get current pool configuration
     */
    getPoolConfig() {
        return this.poolConfig;
    }
    /**
     * Add read replica
     */
    addReadReplica(config) {
        this.readReplicas.push(config);
        console.log(`[DB] Read replica added: ${config.host}:${config.port} (weight: ${config.weight})`);
    }
    /**
     * Get read replicas with load balancing
     */
    getReadReplica() {
        if (this.readReplicas.length === 0)
            return null;
        const totalWeight = this.readReplicas.reduce((sum, r) => sum + r.weight, 0);
        let random = Math.random() * totalWeight;
        for (const replica of this.readReplicas) {
            random -= replica.weight;
            if (random <= 0)
                return replica;
        }
        return this.readReplicas[0];
    }
    /**
     * Get all read replicas
     */
    getReadReplicas() {
        return this.readReplicas;
    }
    /**
     * Track query performance
     */
    trackQueryPerformance(query, executionTimeMs, rowsAffected) {
        const queryKey = query.substring(0, 100); // Use first 100 chars as key
        if (!this.queryStats.has(queryKey)) {
            this.queryStats.set(queryKey, {
                count: 0,
                totalTime: 0,
                minTime: Infinity,
                maxTime: 0,
                totalRows: 0
            });
        }
        const stats = this.queryStats.get(queryKey);
        stats.count++;
        stats.totalTime += executionTimeMs;
        stats.minTime = Math.min(stats.minTime, executionTimeMs);
        stats.maxTime = Math.max(stats.maxTime, executionTimeMs);
        stats.totalRows += rowsAffected;
    }
    /**
     * Get slow queries (> 100ms average)
     */
    getSlowQueries(threshold = 100) {
        return Array.from(this.queryStats.values())
            .filter(s => s.totalTime / s.count > threshold)
            .sort((a, b) => (b.totalTime / b.count) - (a.totalTime / a.count))
            .slice(0, 10);
    }
    /**
     * Get query statistics
     */
    getQueryStats() {
        const slowQueries = this.getSlowQueries();
        const totalQueries = Array.from(this.queryStats.values()).reduce((sum, s) => sum + s.count, 0);
        const avgQueryTime = Array.from(this.queryStats.values()).reduce((sum, s) => sum + s.totalTime, 0) / (totalQueries || 1);
        return {
            totalQueries,
            avgQueryTime: Math.round(avgQueryTime * 100) / 100,
            slowQueries,
            indexCount: Array.from(this.indices.values()).reduce((sum, arr) => sum + arr.length, 0),
            replicaCount: this.readReplicas.length
        };
    }
    /**
     * Generate database migration script
     */
    generateMigrationScript() {
        let script = '-- Database Optimization Migration\n\n';
        for (const [collection, indices] of this.indices.entries()) {
            for (const index of indices) {
                const fields = index.fields.join(', ');
                const unique = index.unique ? 'UNIQUE ' : '';
                const sparse = index.sparse ? 'SPARSE ' : '';
                script += `-- Create ${unique}${sparse}index on ${collection}\n`;
                script += `db.${collection}.createIndex({${index.fields.map(f => `${f}: 1`).join(', ')}}, {`;
                script += `name: '${index.name}'`;
                if (index.unique)
                    script += `, unique: true`;
                if (index.sparse)
                    script += `, sparse: true`;
                script += `});\n\n`;
            }
        }
        return script;
    }
    /**
     * Get optimization recommendations
     */
    getRecommendations() {
        const recommendations = [];
        const stats = this.getQueryStats();
        if (stats.totalQueries > 10000 && this.readReplicas.length === 0) {
            recommendations.push('Add read replicas for read-heavy workloads');
        }
        if (stats.slowQueries.length > 0) {
            recommendations.push(`${stats.slowQueries.length} slow queries detected - add missing indices`);
        }
        if (this.poolConfig.max < 100) {
            recommendations.push('Consider increasing connection pool size for high throughput');
        }
        return recommendations;
    }
}
// Export singleton instance
export const dbOptimization = new DatabaseOptimizationEngine();
// Configure default read replicas
dbOptimization.configureConnectionPool({
    min: 10,
    max: 100,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});
export default DatabaseOptimizationEngine;
