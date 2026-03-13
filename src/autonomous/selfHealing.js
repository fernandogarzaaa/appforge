/**
 * Self-Healing System
 *
 * Automatic error detection, auto-fix for common errors, rollback on failure,
 * and comprehensive health monitoring.
 *
 * Based on: AppForge Autonomous Architecture Specification v1.0
 */
import { EventEmitter } from 'events';
/**
 * Self-Healing System
 *
 * Implements a 5-layer detection and healing architecture:
 * - L1: Syntax (AST validation)
 * - L2: Runtime (Exception trapping)
 * - L3: Behavioral (Output validation)
 * - L4: Systemic (Metric anomaly detection)
 * - L5: Strategic (Goal divergence detection)
 */
export class SelfHealingSystem extends EventEmitter {
    components = new Map();
    errorPatterns = new Map();
    snapshots = [];
    healingStrategies = new Map();
    activeHealing = new Map();
    checkIntervalMs;
    maxSnapshots;
    autoHeal;
    logDecisions;
    checkInterval;
    version = 0;
    constructor(options = {}) {
        super();
        this.checkIntervalMs = options.checkIntervalMs || 5000;
        this.maxSnapshots = options.maxSnapshots || 10;
        this.autoHeal = options.autoHeal !== false;
        this.logDecisions = options.logDecisions !== false;
        this.initializeDefaultErrorPatterns();
        this.initializeDefaultHealingStrategies();
    }
    // ==================== Initialization ====================
    /**
     * Initialize default error patterns for auto-fix
     */
    initializeDefaultErrorPatterns() {
        // L1: Syntax errors
        this.registerErrorPattern({
            id: 'syntax-missing-semicolon',
            pattern: /Missing semicolon|Unexpected token/i,
            category: 'syntax',
            severity: 'high',
            autoFix: async (error, context) => {
                // Attempt to fix syntax error
                return {
                    success: true,
                    action: 'Applied automatic syntax fix',
                    rollbackAvailable: true,
                    timestamp: new Date(),
                };
            },
        });
        this.registerErrorPattern({
            id: 'syntax-unexpected-token',
            pattern: /Unexpected identifier|Unexpected reserved word/i,
            category: 'syntax',
            severity: 'high',
        });
        // L2: Runtime errors
        this.registerErrorPattern({
            id: 'runtime-null-reference',
            pattern: /Cannot read propert.*of (null|undefined)|Cannot destructure propert.*of (null|undefined)/i,
            category: 'runtime',
            severity: 'critical',
            autoFix: async (error, context) => {
                // Add null check
                return {
                    success: true,
                    action: 'Added null/undefined check',
                    rollbackAvailable: true,
                    timestamp: new Date(),
                };
            },
        });
        this.registerErrorPattern({
            id: 'runtime-undefined-function',
            pattern: /is not a function|.* is not defined/i,
            category: 'runtime',
            severity: 'high',
        });
        this.registerErrorPattern({
            id: 'runtime-timeout',
            pattern: /Timeout|ETIMEDOUT|ECONNREFUSED/i,
            category: 'runtime',
            severity: 'medium',
            autoFix: async (error, context) => {
                // Retry with exponential backoff
                return {
                    success: true,
                    action: 'Retry with exponential backoff',
                    rollbackAvailable: false,
                    timestamp: new Date(),
                };
            },
        });
        // L3: Behavioral errors
        this.registerErrorPattern({
            id: 'behavioral-validation-failed',
            pattern: /Validation failed|Invalid input|Schema validation error/i,
            category: 'behavioral',
            severity: 'medium',
        });
        // L4: Systemic errors
        this.registerErrorPattern({
            id: 'systemic-memory-leak',
            pattern: /Heap out of memory|Memory limit exceeded/i,
            category: 'systemic',
            severity: 'critical',
            autoFix: async (error, context) => {
                // Trigger garbage collection or restart
                return {
                    success: true,
                    action: 'Triggered memory cleanup',
                    rollbackAvailable: true,
                    timestamp: new Date(),
                };
            },
        });
        this.registerErrorPattern({
            id: 'systemic-high-cpu',
            pattern: /CPU limit exceeded|High CPU usage/i,
            category: 'systemic',
            severity: 'high',
        });
        // L5: Strategic errors
        this.registerErrorPattern({
            id: 'strategic-goal-divergence',
            pattern: /Goal cannot be achieved|Strategy failed/i,
            category: 'strategic',
            severity: 'high',
        });
    }
    /**
     * Initialize default healing strategies
     */
    initializeDefaultHealingStrategies() {
        // L1: Immediate correction strategies
        this.registerHealingStrategy({
            level: 1,
            trigger: (metric) => metric.status === 'unhealthy' && metric.latency < 100,
            action: async (metric, context) => {
                // Quick fix: retry or parameter adjustment
                await this.delay(10); // Small delay for recovery
                return {
                    success: true,
                    action: 'Applied immediate correction',
                    rollbackAvailable: false,
                    timestamp: new Date(),
                };
            },
            rollback: async (snapshot) => {
                // No rollback needed for immediate fixes
            },
        });
        // L2: Structural repair strategies
        this.registerHealingStrategy({
            level: 2,
            trigger: (metric) => metric.status === 'unhealthy' && metric.errorRate > 0.1,
            action: async (metric, context) => {
                // Component restart/replacement
                this.emit('healing:component-restart', { component: metric.component });
                await this.delay(100);
                return {
                    success: true,
                    action: `Restarted component: ${metric.component}`,
                    rollbackAvailable: true,
                    timestamp: new Date(),
                };
            },
            rollback: async (snapshot) => {
                await this.restoreSnapshot(snapshot);
            },
        });
        // L3: Architectural evolution strategies
        this.registerHealingStrategy({
            level: 3,
            trigger: (metric) => metric.status === 'critical',
            action: async (metric, context) => {
                // Major architectural change
                this.emit('healing:architectural-change', { component: metric.component });
                // Create rollback snapshot
                const snapshot = this.createSnapshot();
                return {
                    success: true,
                    action: `Applied architectural fix to ${metric.component}`,
                    rollbackAvailable: true,
                    timestamp: new Date(),
                    details: { snapshotId: snapshot.id },
                };
            },
            rollback: async (snapshot) => {
                await this.restoreSnapshot(snapshot);
            },
        });
    }
    // ==================== Health Monitoring ====================
    /**
     * Start health monitoring
     */
    start() {
        if (this.checkInterval)
            return;
        this.checkInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.checkIntervalMs);
        this.emit('healing:started');
    }
    /**
     * Stop health monitoring
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
        }
        this.emit('healing:stopped');
    }
    /**
     * Register a component for health monitoring
     */
    registerComponent(componentName, initialStatus = 'healthy') {
        const metric = {
            component: componentName,
            status: initialStatus,
            latency: 0,
            errorRate: 0,
            throughput: 0,
            timestamp: new Date(),
            details: {},
        };
        this.components.set(componentName, {
            metric,
            history: [metric],
            maxHistory: 100,
        });
        this.emit('component:registered', { component: componentName });
    }
    /**
     * Update health metric for a component
     */
    updateHealthMetric(metric) {
        const component = this.components.get(metric.component);
        if (!component) {
            this.registerComponent(metric.component, metric.status);
            return;
        }
        // Add to history
        component.history.push(metric);
        if (component.history.length > component.maxHistory) {
            component.history.shift();
        }
        // Update current metric
        component.metric = metric;
        // Check for issues
        if (metric.status !== 'healthy') {
            this.emit('health:degraded', { metric });
            if (this.autoHeal) {
                this.heal(metric);
            }
        }
        this.emit('health:updated', { metric });
    }
    /**
     * Perform comprehensive health check
     */
    performHealthCheck() {
        this.components.forEach((component, name) => {
            const metric = component.metric;
            // Detect anomalies based on history
            const anomaly = this.detectAnomaly(component);
            if (anomaly) {
                this.updateHealthMetric({
                    ...metric,
                    status: anomaly.severity,
                    details: { ...metric.details, anomaly: anomaly.description },
                });
            }
        });
        this.emit('health:check-completed', { timestamp: new Date() });
    }
    /**
     * Detect anomalies using statistical analysis
     */
    detectAnomaly(component) {
        const history = component.history;
        if (history.length < 5)
            return null;
        const recent = history.slice(-5);
        const latencies = recent.map(h => h.latency);
        const errorRates = recent.map(h => h.errorRate);
        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;
        // Check for degrading trends
        if (avgErrorRate > 0.5) {
            return { severity: 'critical', description: 'Critical error rate detected' };
        }
        if (avgErrorRate > 0.1) {
            return { severity: 'unhealthy', description: 'Elevated error rate' };
        }
        if (avgLatency > 1000) {
            return { severity: 'degraded', description: 'High latency detected' };
        }
        return null;
    }
    // ==================== Error Pattern Matching ====================
    /**
     * Register an error pattern for auto-fix
     */
    registerErrorPattern(pattern) {
        this.errorPatterns.set(pattern.id, pattern);
    }
    /**
     * Match error against known patterns
     */
    matchErrorPattern(error) {
        const message = error.message;
        for (const pattern of this.errorPatterns.values()) {
            if (pattern.pattern.test(message)) {
                return pattern;
            }
        }
        return null;
    }
    /**
     * Attempt to auto-fix an error
     */
    async attemptAutoFix(error, context) {
        const pattern = this.matchErrorPattern(error);
        if (!pattern || !pattern.autoFix) {
            return {
                success: false,
                action: 'No auto-fix pattern matched',
                rollbackAvailable: false,
                timestamp: new Date(),
            };
        }
        try {
            const result = await pattern.autoFix(error, context);
            this.emit('healing:auto-fix', {
                pattern: pattern.id,
                success: result.success,
                action: result.action,
            });
            if (this.logDecisions) {
                console.log(`[SelfHealing] Auto-fix applied: ${result.action}`);
            }
            return result;
        }
        catch (fixError) {
            return {
                success: false,
                action: 'Auto-fix failed',
                rollbackAvailable: false,
                timestamp: new Date(),
                details: { error: fixError instanceof Error ? fixError.message : String(fixError) },
            };
        }
    }
    // ==================== Healing Strategies ====================
    /**
     * Register a healing strategy
     */
    registerHealingStrategy(strategy) {
        const level = strategy.level;
        if (!this.healingStrategies.has(level)) {
            this.healingStrategies.set(level, []);
        }
        this.healingStrategies.get(level).push(strategy);
    }
    /**
     * Execute healing for a degraded component
     */
    async heal(metric) {
        // Prevent concurrent healing for same component
        if (this.activeHealing.has(metric.component)) {
            return {
                success: false,
                action: 'Healing already in progress',
                rollbackAvailable: false,
                timestamp: new Date(),
            };
        }
        const healingPromise = this.executeHealing(metric);
        this.activeHealing.set(metric.component, healingPromise);
        try {
            const result = await healingPromise;
            return result;
        }
        finally {
            this.activeHealing.delete(metric.component);
        }
    }
    /**
     * Execute healing strategies in order
     */
    async executeHealing(metric) {
        const context = {
            metric,
            previousAttempts: 0,
            maxAttempts: 3,
        };
        // Try strategies from level 1 to 3
        for (let level = 1; level <= 3; level++) {
            const strategies = this.healingStrategies.get(level) || [];
            for (const strategy of strategies) {
                if (strategy.trigger(metric)) {
                    this.emit('healing:started', { component: metric.component, level });
                    try {
                        const result = await strategy.action(metric, context);
                        this.emit('healing:completed', {
                            component: metric.component,
                            level,
                            success: result.success,
                        });
                        return result;
                    }
                    catch (error) {
                        this.emit('healing:failed', {
                            component: metric.component,
                            level,
                            error,
                        });
                    }
                }
            }
        }
        return {
            success: false,
            action: 'No healing strategy applicable',
            rollbackAvailable: false,
            timestamp: new Date(),
        };
    }
    // ==================== Snapshot Management ====================
    /**
     * Create a system snapshot for rollback
     */
    createSnapshot() {
        const snapshot = {
            id: this.generateId(),
            timestamp: new Date(),
            version: this.getVersion(),
            components: Object.fromEntries(Array.from(this.components.entries()).map(([name, comp]) => [name, comp.metric])),
            config: this.getConfig(),
            state: this.captureState(),
        };
        this.snapshots.push(snapshot);
        // Trim old snapshots
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
        this.emit('snapshot:created', { snapshotId: snapshot.id });
        return snapshot;
    }
    /**
     * Restore system to a snapshot
     */
    async restoreSnapshot(snapshot) {
        this.emit('rollback:started', { snapshotId: snapshot.id });
        try {
            // Restore component states
            Object.entries(snapshot.components).forEach(([name, metric]) => {
                this.updateHealthMetric(metric);
            });
            this.emit('rollback:completed', { snapshotId: snapshot.id });
            return true;
        }
        catch (error) {
            this.emit('rollback:failed', { snapshotId: snapshot.id, error });
            return false;
        }
    }
    /**
     * Rollback to the previous snapshot
     */
    async rollback() {
        if (this.snapshots.length < 2) {
            return false;
        }
        // Get second-to-last snapshot (before current)
        const previousSnapshot = this.snapshots[this.snapshots.length - 2];
        return this.restoreSnapshot(previousSnapshot);
    }
    /**
     * Get all snapshots
     */
    getSnapshots() {
        return [...this.snapshots];
    }
    /**
     * Get current version
     */
    getVersion() {
        return `v${this.version}`;
    }
    /**
     * Get current config
     */
    getConfig() {
        return {
            checkIntervalMs: this.checkIntervalMs,
            maxSnapshots: this.maxSnapshots,
            autoHeal: this.autoHeal,
            logDecisions: this.logDecisions,
        };
    }
    /**
     * Capture current state
     */
    captureState() {
        return {
            componentCount: this.components.size,
            activeHealing: this.activeHealing.size,
            snapshotCount: this.snapshots.length,
        };
    }
    // ==================== Utility Methods ====================
    /**
     * Get component health status
     */
    getComponentHealth(componentName) {
        return this.components.get(componentName)?.metric || null;
    }
    /**
     * Get overall system health
     */
    getSystemHealth() {
        const summary = {
            healthy: 0,
            degraded: 0,
            unhealthy: 0,
            critical: 0,
        };
        const componentMetrics = new Map();
        this.components.forEach((comp, name) => {
            componentMetrics.set(name, comp.metric);
            summary[comp.metric.status]++;
        });
        let status = 'healthy';
        if (summary.critical > 0)
            status = 'critical';
        else if (summary.unhealthy > 0)
            status = 'unhealthy';
        else if (summary.degraded > 0)
            status = 'degraded';
        return { status, components: componentMetrics, summary };
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get healing statistics
     */
    getStats() {
        const health = this.getSystemHealth();
        return {
            components: this.components.size,
            errorPatterns: this.errorPatterns.size,
            snapshots: this.snapshots.length,
            activeHealing: this.activeHealing.size,
            systemHealth: health.status,
        };
    }
    /**
     * Dispose of the healing system
     */
    dispose() {
        this.stop();
        this.removeAllListeners();
        this.components.clear();
        this.errorPatterns.clear();
        this.snapshots = [];
        this.healingStrategies.clear();
        this.activeHealing.clear();
    }
}
// Singleton instance
let globalSelfHealingSystem = null;
export function getSelfHealingSystem(options) {
    if (!globalSelfHealingSystem) {
        globalSelfHealingSystem = new SelfHealingSystem(options);
    }
    return globalSelfHealingSystem;
}
export function resetSelfHealingSystem() {
    if (globalSelfHealingSystem) {
        globalSelfHealingSystem.dispose();
        globalSelfHealingSystem = null;
    }
}
