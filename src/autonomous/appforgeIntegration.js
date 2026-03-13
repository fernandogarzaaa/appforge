/**
 * AppForge Autonomous Integration
 *
 * Hooks the autonomous system into existing AppForge components:
 * - Base44 integration
 * - API services
 * - WebSocket events
 * - React components
 */
import { AutonomousSystem, getAutonomousSystem, getSelfImprovementLoop, } from './index';
// ==================== AppForge Component Integration ====================
/**
 * Integrate autonomous system with AppForge React components
 */
export function integrateWithAppForge() {
    const system = getAutonomousSystem({ autoStart: true });
    // Hook into AppForge lifecycle
    setupAppForgeLifecycleHooks(system);
    // Setup health monitoring for AppForge components
    setupAppForgeHealthMonitoring(system);
    // Setup decision making for AppForge events
    setupAppForgeDecisionIntegration(system);
    // Setup improvement loop for AppForge code
    setupAppForgeImprovementIntegration(system);
    console.log('[AutonomousIntegration] AppForge integration complete');
}
/**
 * Setup lifecycle hooks
 */
function setupAppForgeLifecycleHooks(system) {
    // Hook into page navigation
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
            system.shutdown();
        });
    }
    // Hook into React error boundaries via global error handler
    window.addEventListener('error', (event) => {
        system.updateHealthMetric({
            component: 'appforge-frontend',
            status: 'degraded',
            latency: 0,
            errorRate: 1,
            throughput: 0,
            timestamp: new Date(),
            details: { error: event.error?.message, stack: event.error?.stack },
        });
    });
    // Hook into unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        system.updateHealthMetric({
            component: 'appforge-async',
            status: 'degraded',
            latency: 0,
            errorRate: 1,
            throughput: 0,
            timestamp: new Date(),
            details: { reason: String(event.reason) },
        });
    });
}
/**
 * Setup health monitoring for AppForge components
 */
function setupAppForgeHealthMonitoring(system) {
    // Monitor key AppForge services
    const appForgeComponents = [
        'base44-client',
        'api-gateway',
        'websocket-manager',
        'auth-service',
        'deployment-service',
        'swarm-coordinator',
        'quantum-engine',
    ];
    // Register components
    appForgeComponents.forEach(component => {
        system.updateHealthMetric({
            component,
            status: 'healthy',
            latency: 0,
            errorRate: 0,
            throughput: 0,
            timestamp: new Date(),
            details: { initialized: true },
        });
    });
    // Setup periodic health checks
    setInterval(() => {
        checkAppForgeHealth(system);
    }, 30000); // Every 30 seconds
}
/**
 * Check AppForge health status
 */
async function checkAppForgeHealth(system) {
    // Check API connectivity
    try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const startTime = performance.now();
        const response = await fetch(`${apiUrl}/health`, { method: 'HEAD' });
        const latency = performance.now() - startTime;
        system.updateHealthMetric({
            component: 'api-gateway',
            status: response.ok ? 'healthy' : 'degraded',
            latency,
            errorRate: response.ok ? 0 : 1,
            throughput: 0,
            timestamp: new Date(),
            details: { statusCode: response.status },
        });
    }
    catch (error) {
        system.updateHealthMetric({
            component: 'api-gateway',
            status: 'unhealthy',
            latency: 0,
            errorRate: 1,
            throughput: 0,
            timestamp: new Date(),
            details: { error: String(error) },
        });
    }
}
/**
 * Setup decision integration for AppForge events
 */
function setupAppForgeDecisionIntegration(system) {
    // Listen for deployment events
    system.on('deployment:requested', async (event) => {
        const result = await system.makeDecision('Deployment strategy selection', [
            {
                name: 'Blue-Green Deploy',
                description: 'Zero-downtime deployment',
                execute: async () => ({ strategy: 'blue-green' }),
            },
            {
                name: 'Rolling Deploy',
                description: 'Gradual rollout',
                execute: async () => ({ strategy: 'rolling' }),
            },
            {
                name: 'Canary Deploy',
                description: 'Test with small traffic',
                execute: async () => ({ strategy: 'canary' }),
            },
        ], {
            goal: 'safe_deployment',
            urgency: 0.7,
            constraints: ['zero_downtime', 'rollback_capable'],
        });
        console.log('[Autonomous] Selected deployment strategy:', result);
    });
    // Listen for error events
    system.on('error:critical', async (event) => {
        await system.createGoal('Critical Error Recovery', `Address critical error: ${event.error}`, 'critical');
    });
}
/**
 * Setup improvement integration for AppForge code
 */
function setupAppForgeImprovementIntegration(system) {
    const improvement = getSelfImprovementLoop();
    // Analyze AppForge code periodically
    setInterval(async () => {
        // This would analyze actual AppForge code
        // For now, just log that improvement loop is active
        const stats = improvement.getStats();
        if (stats.pendingOptimizations > 0) {
            console.log('[Autonomous] Pending optimizations:', stats.pendingOptimizations);
        }
    }, 60000); // Every minute
}
// ==================== React Component Integration ====================
/**
 * HOC to add autonomous capabilities to a component
 */
export function withAutonomous(Component, options) {
    return function AutonomousWrappedComponent(props) {
        const system = getAutonomousSystem();
        // Register component health on mount
        React.useEffect(() => {
            if (options.monitorHealth) {
                system.updateHealthMetric({
                    component: options.componentName,
                    status: 'healthy',
                    latency: 0,
                    errorRate: 0,
                    throughput: 0,
                    timestamp: new Date(),
                    details: { mounted: true },
                });
                return () => {
                    system.updateHealthMetric({
                        component: options.componentName,
                        status: 'healthy',
                        latency: 0,
                        errorRate: 0,
                        throughput: 0,
                        timestamp: new Date(),
                        details: { mounted: false },
                    });
                };
            }
        }, []);
        return React.createElement(Component, props);
    };
}
// ==================== Service Integration ====================
/**
 * Wrap an API service with autonomous monitoring
 */
export function wrapServiceWithAutonomous(service, serviceName) {
    const system = getAutonomousSystem();
    return new Proxy(service, {
        get(target, prop) {
            const value = target[prop];
            if (typeof value === 'function') {
                return async (...args) => {
                    const startTime = performance.now();
                    try {
                        const result = await value.apply(target, args);
                        const latency = performance.now() - startTime;
                        // Update health on success
                        system.updateHealthMetric({
                            component: serviceName,
                            status: 'healthy',
                            latency,
                            errorRate: 0,
                            throughput: 1,
                            timestamp: new Date(),
                            details: { method: String(prop) },
                        });
                        return result;
                    }
                    catch (error) {
                        const latency = performance.now() - startTime;
                        // Update health on failure
                        system.updateHealthMetric({
                            component: serviceName,
                            status: 'degraded',
                            latency,
                            errorRate: 1,
                            throughput: 0,
                            timestamp: new Date(),
                            details: { method: String(prop), error: String(error) },
                        });
                        throw error;
                    }
                };
            }
            return value;
        },
    });
}
/**
 * Get autonomous status for UI display
 */
export function getAutonomousStatus() {
    const system = getAutonomousSystem();
    const state = system.getState();
    const stats = system.getStats();
    return {
        enabled: state.config.enabled,
        mode: state.config.mode,
        status: state.status,
        stats: {
            activeTasks: state.activeTasks,
            completedTasks: state.completedTasks,
            failedTasks: state.failedTasks,
            healthStatus: state.healthStatus,
        },
    };
}
/**
 * Control functions for UI
 */
export const autonomousControls = {
    enable: () => getAutonomousSystem().setEnabled(true),
    disable: () => getAutonomousSystem().setEnabled(false),
    setMode: (mode) => getAutonomousSystem().setMode(mode),
    pause: () => getAutonomousSystem().pause(),
    resume: () => getAutonomousSystem().resume(),
    shutdown: () => getAutonomousSystem().shutdown(),
    createGoal: (name, description, priority) => getAutonomousSystem().createGoal(name, description, priority),
    getStats: () => getAutonomousSystem().getStats(),
    getState: () => getAutonomousSystem().getState(),
};
// ==================== Export Integration ====================
import React from 'react';
export { AutonomousSystem, getAutonomousSystem, };
export * from './index';
export * from './hooks';
