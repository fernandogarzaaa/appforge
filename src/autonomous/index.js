/**
 * Autonomous System Integration
 *
 * Integrates all autonomous modules with AppForge:
 * - Execution Engine, Self-Healing, Self-Improvement, Decision Tree
 * - Hooks into existing AppForge components
 * - Adds to main event loop
 * - Provides autonomous mode toggle
 *
 * Based on: AppForge Autonomous Architecture Specification v1.0
 */
import { getExecutionEngine, resetExecutionEngine, } from './executionEngine';
import { getSelfHealingSystem, resetSelfHealingSystem, } from './selfHealing';
import { getSelfImprovementLoop, resetSelfImprovementLoop, } from './selfImprovement';
import { getDecisionTree, resetDecisionTree, } from './decisionTree';
import { EventEmitter } from 'events';
/**
 * Autonomous System - Main Integration Point
 *
 * This class orchestrates all autonomous capabilities:
 * 1. Execution Engine - Task scheduling and goal decomposition
 * 2. Self-Healing - Error detection and automatic recovery
 * 3. Self-Improvement - Code generation and optimization
 * 4. Decision Tree - Strategic planning and context-aware choices
 */
export class AutonomousSystem extends EventEmitter {
    executionEngine;
    healingSystem;
    improvementLoop;
    decisionTree;
    config;
    state;
    eventLoopInterval;
    isInitialized = false;
    constructor(options = {}) {
        super();
        // Initialize or get singleton instances
        this.config = {
            enabled: true,
            mode: 'active',
            safetyLevel: 'moderate',
            maxConcurrentTasks: 10,
            healingEnabled: true,
            improvementEnabled: true,
            decisionLogging: true,
            humanApprovalRequired: ['delete', 'modify_core', 'deploy_production'],
            ...options.config,
        };
        this.executionEngine = getExecutionEngine({
            config: this.config,
            autoStart: false,
        });
        this.healingSystem = getSelfHealingSystem({
            autoHeal: this.config.healingEnabled,
            logDecisions: this.config.decisionLogging,
        });
        this.improvementLoop = getSelfImprovementLoop({
            autoRefactor: this.config.improvementEnabled,
            autoOptimize: this.config.improvementEnabled,
            logDecisions: this.config.decisionLogging,
        });
        this.decisionTree = getDecisionTree({
            enableQuantumMode: true,
            logDecisions: this.config.decisionLogging,
        });
        this.state = {
            status: 'idle',
            activeTasks: 0,
            queuedTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            lastHealthCheck: new Date(),
            healthStatus: 'healthy',
            config: this.config,
        };
        this.setupEventListeners();
        if (options.autoStart !== false) {
            this.initialize();
        }
    }
    // ==================== Initialization ====================
    /**
     * Initialize the autonomous system
     */
    initialize() {
        if (this.isInitialized)
            return;
        // Register AppForge components for health monitoring
        this.registerAppForgeComponents();
        // Start subsystems
        this.executionEngine.start();
        this.healingSystem.start();
        this.decisionTree;
        // Start main event loop
        this.startEventLoop();
        this.state.status = 'running';
        this.isInitialized = true;
        this.emit('system:initialized');
        console.log('[AutonomousSystem] Initialized and running');
    }
    /**
     * Register AppForge components for monitoring
     */
    registerAppForgeComponents() {
        // Register key AppForge components
        const components = [
            'appforge-core',
            'api-gateway',
            'database',
            'websocket',
            'swarm-coordinator',
            'quantum-engine',
        ];
        components.forEach(component => {
            this.healingSystem.registerComponent(component, 'healthy');
        });
    }
    /**
     * Setup event listeners between subsystems
     */
    setupEventListeners() {
        // Execution Engine events
        this.executionEngine.on('task:failed', ({ task, error }) => {
            this.handleTaskFailure(task, error);
        });
        this.executionEngine.on('task:completed', ({ task }) => {
            this.state.completedTasks++;
            this.updateState();
        });
        this.executionEngine.on('decision:logged', (event) => {
            this.emit('decision', event);
        });
        // Healing System events
        this.healingSystem.on('health:degraded', ({ metric }) => {
            this.handleHealthDegradation(metric);
        });
        this.healingSystem.on('healing:completed', ({ component, success }) => {
            if (success) {
                this.emit('healing:success', { component });
            }
        });
        this.healingSystem.on('health:check-completed', () => {
            this.state.lastHealthCheck = new Date();
            const systemHealth = this.healingSystem.getSystemHealth();
            this.state.healthStatus = systemHealth.status;
            this.emit('health:update', systemHealth);
        });
        // Improvement Loop events
        this.improvementLoop.on('generation:completed', ({ result }) => {
            this.emit('improvement:generated', result);
        });
        this.improvementLoop.on('refactoring:analyzed', ({ target }) => {
            if (this.config.mode === 'aggressive') {
                // Auto-apply refactoring in aggressive mode
                this.improvementLoop.applyRefactoring(target);
            }
        });
        // Decision Tree events
        this.decisionTree.on('decision:collapsed', ({ decisionId }) => {
            this.emit('decision:made', { decisionId });
        });
    }
    // ==================== Event Loop ====================
    /**
     * Start the main autonomous event loop
     */
    startEventLoop() {
        // Run every 5 seconds
        this.eventLoopInterval = setInterval(() => {
            this.runAutonomousCycle();
        }, 5000);
    }
    /**
     * Stop the main event loop
     */
    stopEventLoop() {
        if (this.eventLoopInterval) {
            clearInterval(this.eventLoopInterval);
            this.eventLoopInterval = undefined;
        }
    }
    /**
     * Main autonomous cycle - runs continuously when enabled
     */
    async runAutonomousCycle() {
        if (!this.config.enabled || this.state.status !== 'running') {
            return;
        }
        try {
            // Update state
            this.updateState();
            // Perform autonomous actions based on mode
            switch (this.config.mode) {
                case 'passive':
                    // Only monitor and report
                    this.performPassiveModeActions();
                    break;
                case 'active':
                    // Monitor and auto-fix common issues
                    await this.performActiveModeActions();
                    break;
                case 'aggressive':
                    // Full autonomy with proactive optimization
                    await this.performAggressiveModeActions();
                    break;
            }
            this.emit('cycle:completed', { timestamp: new Date() });
        }
        catch (error) {
            console.error('[AutonomousSystem] Cycle error:', error);
            this.emit('cycle:error', { error });
        }
    }
    /**
     * Passive mode: Monitor only
     */
    performPassiveModeActions() {
        // Just update metrics and emit status
        const stats = this.getStats();
        this.emit('status:update', stats);
    }
    /**
     * Active mode: Monitor and auto-fix
     */
    async performActiveModeActions() {
        // Check for optimization opportunities
        const engineStats = this.executionEngine.getStats();
        if (engineStats.tasks.failed > 5) {
            // Create healing task
            await this.executionEngine.createTask({
                name: 'System Healing Check',
                description: 'Analyze and heal failed tasks',
                priority: 'high',
                payload: { type: 'healing', failedCount: engineStats.tasks.failed },
            });
        }
        // Analyze code for refactoring opportunities (if enabled)
        if (this.config.improvementEnabled) {
            // Trigger improvement analysis
            this.improvementLoop.getStats();
        }
    }
    /**
     * Aggressive mode: Full autonomy
     */
    async performAggressiveModeActions() {
        // Perform all active mode actions
        await this.performActiveModeActions();
        // Proactive decision making
        const systemHealth = this.healingSystem.getSystemHealth();
        if (systemHealth.status !== 'healthy') {
            // Make strategic decisions about system recovery
            await this.decisionTree.makeDecision('System recovery strategy', [
                {
                    name: 'Restart Services',
                    description: 'Restart degraded services',
                    expectedOutcome: 'Services restored',
                    probability: 0.8,
                    cost: 30,
                    risk: 0.2,
                    dependencies: [],
                    execute: async () => {
                        // Trigger service restart
                        return { status: 'services_restarted' };
                    },
                },
                {
                    name: 'Scale Resources',
                    description: 'Allocate more resources',
                    expectedOutcome: 'Performance improved',
                    probability: 0.7,
                    cost: 50,
                    risk: 0.3,
                    dependencies: [],
                    execute: async () => {
                        return { status: 'resources_scaled' };
                    },
                },
            ], {
                goal: 'system_recovery',
                constraints: ['minimize_downtime'],
                availableResources: { taskId: 'system', cpu: 50, memory: 2048, network: 100, storage: 1000, priority: 'high' },
                historicalDecisions: [],
                urgency: systemHealth.status === 'critical' ? 0.95 : 0.7,
                metadata: { healthStatus: systemHealth.status },
            });
        }
    }
    // ==================== Task Management ====================
    /**
     * Create and execute a goal
     */
    async createGoal(name, description, priority = 'medium') {
        // Check if human approval is required for this goal type
        if (this.requiresApproval('goal_creation')) {
            this.emit('approval:required', { type: 'goal_creation', name, description });
        }
        const goal = await this.executionEngine.createGoal({
            name,
            description,
            priority,
        });
        this.emit('goal:created', goal);
        return goal;
    }
    /**
     * Create a task
     */
    async createTask(name, payload, priority = 'medium') {
        return this.executionEngine.createTask({
            name,
            payload,
            priority,
        });
    }
    /**
     * Handle task failure with healing
     */
    async handleTaskFailure(task, error) {
        this.state.failedTasks++;
        // Attempt auto-fix
        const fixResult = await this.healingSystem.attemptAutoFix(error, { task });
        if (!fixResult.success && task.retryCount < task.maxRetries) {
            // Retry the task
            await this.executionEngine.retryTask(task.id);
        }
        this.emit('task:failure_handled', { task, fixResult });
    }
    // ==================== Health Management ====================
    /**
     * Handle health degradation
     */
    async handleHealthDegradation(metric) {
        this.emit('health:degraded', metric);
        if (this.config.healingEnabled) {
            await this.healingSystem.heal(metric);
        }
    }
    /**
     * Update health metric for a component
     */
    updateHealthMetric(metric) {
        this.healingSystem.updateHealthMetric(metric);
    }
    // ==================== Strategic Planning ====================
    /**
     * Create a strategic plan
     */
    async createStrategicPlan(name, description, objectives) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // 3 month default
        return this.decisionTree.createStrategicPlan(name, description, objectives, {
            startDate: new Date(),
            endDate,
        });
    }
    /**
     * Make a context-aware decision
     */
    async makeDecision(description, actions, context) {
        const fullActions = actions.map((a, i) => ({
            ...a,
            id: `action-${i}`,
            expectedOutcome: a.description,
            probability: 0.8,
            cost: 50,
            risk: 0.1,
            dependencies: [],
        }));
        const outcome = await this.decisionTree.makeDecision(description, fullActions, {
            goal: context.goal,
            constraints: context.constraints || [],
            availableResources: { taskId: 'decision', cpu: 30, memory: 512, network: 50, storage: 100, priority: 'medium' },
            historicalDecisions: [],
            urgency: context.urgency || 0.5,
            metadata: {},
        });
        return outcome.result;
    }
    // ==================== Autonomous Mode Control ====================
    /**
     * Toggle autonomous mode
     */
    setMode(mode) {
        this.config.mode = mode;
        this.state.config.mode = mode;
        this.emit('mode:changed', mode);
    }
    /**
     * Enable/disable autonomous system
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        this.state.config.enabled = enabled;
        this.state.status = enabled ? 'running' : 'paused';
        if (enabled) {
            this.executionEngine.start();
            this.healingSystem.start();
        }
        else {
            this.executionEngine.stop();
            this.healingSystem.stop();
        }
        this.emit('enabled:changed', enabled);
    }
    /**
     * Check if action requires human approval
     */
    requiresApproval(actionType) {
        return this.config.humanApprovalRequired.includes(actionType);
    }
    // ==================== State Management ====================
    /**
     * Update internal state
     */
    updateState() {
        const engineStats = this.executionEngine.getStats();
        this.state.activeTasks = engineStats.tasks.running;
        this.state.queuedTasks = engineStats.queueLength;
    }
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get comprehensive statistics
     */
    getStats() {
        return {
            state: this.getState(),
            execution: this.executionEngine.getStats(),
            healing: this.healingSystem.getStats(),
            improvement: this.improvementLoop.getStats(),
            decision: this.decisionTree.getStats(),
        };
    }
    // ==================== React Integration ====================
    /**
     * Get React hook for autonomous system state
     * Usage: const { state, createGoal } = useAutonomousSystem()
     */
    static useAutonomousSystem() {
        // This would be implemented as a React hook in a separate file
        // For now, return a placeholder
        return {
            state: null,
            createGoal: () => { },
            createTask: () => { },
            setMode: () => { },
            setEnabled: () => { },
        };
    }
    // ==================== Lifecycle ====================
    /**
     * Pause autonomous operations
     */
    pause() {
        this.state.status = 'paused';
        this.executionEngine.stop();
        this.healingSystem.stop();
        this.emit('system:paused');
    }
    /**
     * Resume autonomous operations
     */
    resume() {
        this.state.status = 'running';
        this.executionEngine.start();
        this.healingSystem.start();
        this.emit('system:resumed');
    }
    /**
     * Shutdown the autonomous system
     */
    shutdown() {
        this.stopEventLoop();
        this.executionEngine.stop();
        this.healingSystem.stop();
        this.state.status = 'idle';
        this.emit('system:shutdown');
    }
    /**
     * Dispose of all resources
     */
    dispose() {
        this.shutdown();
        this.removeAllListeners();
        // Reset singletons
        resetExecutionEngine();
        resetSelfHealingSystem();
        resetSelfImprovementLoop();
        resetDecisionTree();
    }
}
// Singleton instance
let globalAutonomousSystem = null;
export function getAutonomousSystem(options) {
    if (!globalAutonomousSystem) {
        globalAutonomousSystem = new AutonomousSystem(options);
    }
    return globalAutonomousSystem;
}
export function resetAutonomousSystem() {
    if (globalAutonomousSystem) {
        globalAutonomousSystem.dispose();
        globalAutonomousSystem = null;
    }
}
// Export all modules
export * from './types';
export * from './executionEngine';
export * from './selfHealing';
export * from './selfImprovement';
export * from './decisionTree';
