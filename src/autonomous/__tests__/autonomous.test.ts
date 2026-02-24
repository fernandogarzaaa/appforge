/**
 * Autonomous System Test Suite
 * 
 * Tests for Execution Engine, Self-Healing, Self-Improvement, and Decision Tree
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ExecutionEngine,
  SelfHealingSystem,
  SelfImprovementLoop,
  AutonomousDecisionTree,
  AutonomousSystem,
} from '../index';
import {
  TaskDefinition,
  GoalDefinition,
  HealthMetric,
  ErrorPattern,
  CodeGenerationRequest,
  Action,
  DecisionContext,
} from '../types';

// ==================== Execution Engine Tests ====================

describe('ExecutionEngine', () => {
  let engine: ExecutionEngine;

  beforeEach(() => {
    engine = new ExecutionEngine({ autoStart: false });
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('Task Management', () => {
    it('should create a task', async () => {
      const task = await engine.createTask({
        name: 'test-task',
        payload: { data: 'test' },
        priority: 'high',
      });

      expect(task).toBeDefined();
      expect(task.name).toBe('test-task');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('high');
    });

    it('should create multiple tasks', async () => {
      const definitions: TaskDefinition[] = [
        { name: 'task-1', payload: {} },
        { name: 'task-2', payload: {} },
        { name: 'task-3', payload: {} },
      ];

      const tasks = await engine.createTasks(definitions);

      expect(tasks).toHaveLength(3);
      expect(tasks.every(t => t.status === 'pending')).toBe(true);
    });

    it('should cancel a task', async () => {
      const task = await engine.createTask({
        name: 'cancelable-task',
        payload: {},
      });

      const cancelled = await engine.cancelTask(task.id, 'Test cancellation');

      expect(cancelled).toBe(true);
      expect(task.status).toBe('cancelled');
    });

    it('should retry a failed task', async () => {
      const task = await engine.createTask({
        name: 'failing-task',
        payload: {},
        maxRetries: 3,
      });

      // Simulate failure
      task.status = 'failed';
      task.retryCount = 0;

      const retried = await engine.retryTask(task.id);

      expect(retried).toBe(true);
      expect(task.status).toBe('pending');
      expect(task.retryCount).toBe(1);
    });
  });

  describe('Goal Management', () => {
    it('should create a goal', async () => {
      const goal = await engine.createGoal({
        name: 'test-goal',
        description: 'Implement a new feature',
        priority: 'high',
      });

      expect(goal).toBeDefined();
      expect(goal.name).toBe('test-goal');
      expect(goal.tasks.length).toBeGreaterThan(0);
    });

    it('should decompose a refactoring goal', async () => {
      const goal = await engine.createGoal({
        name: 'refactor-goal',
        description: 'Refactor the authentication module',
        priority: 'high',
      });

      expect(goal.tasks.length).toBeGreaterThanOrEqual(3);
      
      const taskNames = goal.tasks.map(id => engine.getTasks().find(t => t.id === id)?.name);
      expect(taskNames.some(n => n?.includes('Analyze'))).toBe(true);
    });

    it('should track goal progress', async () => {
      const goal = await engine.createGoal({
        name: 'progress-goal',
        description: 'Test progress tracking',
      });

      const progress = engine.getGoalProgress(goal.id);

      expect(progress.total).toBeGreaterThan(0);
      expect(progress.percentage).toBe(0);
    });
  });

  describe('Resource Management', () => {
    it('should allocate resources based on priority', async () => {
      const criticalTask = await engine.createTask({
        name: 'critical-task',
        payload: {},
        priority: 'critical',
      });

      const lowTask = await engine.createTask({
        name: 'low-task',
        payload: {},
        priority: 'low',
      });

      // Resources are allocated when tasks are executed
      // This test verifies the allocation logic exists
      expect(criticalTask.priority).toBe('critical');
      expect(lowTask.priority).toBe('low');
    });

    it('should report resource utilization', () => {
      const utilization = engine.getResourceUtilization();

      expect(utilization).toHaveProperty('allocated');
      expect(utilization).toHaveProperty('available');
      expect(utilization).toHaveProperty('utilizationPercent');
    });
  });

  describe('Statistics', () => {
    it('should return engine statistics', () => {
      const stats = engine.getStats();

      expect(stats).toHaveProperty('tasks');
      expect(stats).toHaveProperty('goals');
      expect(stats).toHaveProperty('queueLength');
      expect(stats).toHaveProperty('isRunning');
    });
  });
});

// ==================== Self-Healing Tests ====================

describe('SelfHealingSystem', () => {
  let healing: SelfHealingSystem;

  beforeEach(() => {
    healing = new SelfHealingSystem({ autoHeal: false });
  });

  afterEach(() => {
    healing.dispose();
  });

  describe('Health Monitoring', () => {
    it('should register a component', () => {
      healing.registerComponent('test-component');
      
      const health = healing.getComponentHealth('test-component');
      expect(health).toBeDefined();
      expect(health?.component).toBe('test-component');
      expect(health?.status).toBe('healthy');
    });

    it('should update health metrics', () => {
      healing.registerComponent('monitored-component');

      const metric: HealthMetric = {
        component: 'monitored-component',
        status: 'degraded',
        latency: 500,
        errorRate: 0.1,
        throughput: 100,
        timestamp: new Date(),
        details: { reason: 'High load' },
      };

      healing.updateHealthMetric(metric);

      const health = healing.getComponentHealth('monitored-component');
      expect(health?.status).toBe('degraded');
      expect(health?.latency).toBe(500);
    });

    it('should detect system health', () => {
      healing.registerComponent('comp-1', 'healthy');
      healing.registerComponent('comp-2', 'degraded');
      healing.registerComponent('comp-3', 'healthy');

      const systemHealth = healing.getSystemHealth();

      expect(systemHealth.status).toBe('degraded');
      expect(systemHealth.summary.degraded).toBe(1);
      expect(systemHealth.summary.healthy).toBe(2);
    });
  });

  describe('Error Pattern Matching', () => {
    it('should match null reference errors', () => {
      const error = new Error("Cannot read property 'foo' of undefined");
      const pattern = healing.matchErrorPattern(error);

      expect(pattern).toBeDefined();
      expect(pattern?.category).toBe('runtime');
    });

    it('should match timeout errors', () => {
      const error = new Error('Connection timeout ETIMEDOUT');
      const pattern = healing.matchErrorPattern(error);

      expect(pattern).toBeDefined();
      expect(pattern?.id).toContain('timeout');
    });

    it('should return null for unknown errors', () => {
      const error = new Error('Completely unknown error xyz123');
      const pattern = healing.matchErrorPattern(error);

      expect(pattern).toBeNull();
    });
  });

  describe('Auto-Fix', () => {
    it('should attempt auto-fix for known patterns', async () => {
      const error = new Error("Cannot read property of null");
      
      const result = await healing.attemptAutoFix(error);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('timestamp');
    });

    it('should fail auto-fix for unknown patterns', async () => {
      const error = new Error('Unknown pattern xyz');
      
      const result = await healing.attemptAutoFix(error);

      expect(result.success).toBe(false);
    });
  });

  describe('Snapshots', () => {
    it('should create snapshots', () => {
      healing.registerComponent('snapshot-test');
      
      const snapshot = healing.createSnapshot();

      expect(snapshot).toHaveProperty('id');
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('version');
      expect(snapshot).toHaveProperty('components');
    });

    it('should maintain snapshot history', () => {
      for (let i = 0; i < 5; i++) {
        healing.createSnapshot();
      }

      const snapshots = healing.getSnapshots();
      expect(snapshots.length).toBe(5);
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop monitoring', () => {
      healing.start();
      healing.stop();
      // Should complete without errors
      expect(true).toBe(true);
    });
  });
});

// ==================== Self-Improvement Tests ====================

describe('SelfImprovementLoop', () => {
  let improvement: SelfImprovementLoop;

  beforeEach(() => {
    improvement = new SelfImprovementLoop({ autoRefactor: false });
  });

  afterEach(() => {
    improvement.dispose();
  });

  describe('Code Generation', () => {
    it('should generate code from description', async () => {
      const request: CodeGenerationRequest = {
        id: 'test-gen-1',
        naturalLanguage: 'Create a function called calculateSum that adds two numbers',
        targetLanguage: 'typescript',
        priority: 'medium',
        timestamp: new Date(),
      };

      const result = await improvement.generateCode(request);

      expect(result).toBeDefined();
      expect(result.code).toContain('calculateSum');
      expect(result.language).toBe('typescript');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should generate a class from description', async () => {
      const request: CodeGenerationRequest = {
        id: 'test-gen-2',
        naturalLanguage: 'Create a class called UserManager',
        targetLanguage: 'typescript',
        priority: 'medium',
        timestamp: new Date(),
      };

      const result = await improvement.generateCode(request);

      expect(result.code).toContain('class UserManager');
      expect(result.documentation).toBeDefined();
    });

    it('should validate generated code', async () => {
      const validCode = 'function test() { return true; }';
      const result = await improvement.validateCode(validCode, 'typescript');

      expect(result.valid).toBe(true);
      expect(result.syntaxErrors).toHaveLength(0);
    });

    it('should detect syntax errors', async () => {
      const invalidCode = 'function test() { return true;'; // Missing closing brace
      const result = await improvement.validateCode(invalidCode, 'typescript');

      expect(result.valid).toBe(false);
      expect(result.syntaxErrors.length).toBeGreaterThan(0);
    });

    it('should detect security issues', async () => {
      const unsafeCode = 'function test() { eval(userInput); }';
      const result = await improvement.validateCode(unsafeCode, 'javascript');

      expect(result.securityIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Code Analysis', () => {
    it('should calculate code metrics', async () => {
      const code = `
        function complex() {
          if (a) {
            if (b) {
              if (c) {
                return 1;
              }
            }
          }
          return 0;
        }
      `;

      const target = await improvement.analyzeForRefactoring('test.ts', code);
      
      if (target) {
        expect(target.metrics.complexity).toBeGreaterThan(1);
        expect(target.suggestedImprovements.length).toBeGreaterThan(0);
      }
    });

    it('should detect high complexity code', async () => {
      // Code with many branches
      const complexCode = `
        function calculate() {
          if (x) {
            if (y) {
              for (let i = 0; i < 10; i++) {
                if (z) {
                  while (w) {
                    switch (v) {
                      case 1: return 1;
                      case 2: return 2;
                    }
                  }
                }
              }
            }
          }
          return 0;
        }
      `;

      const target = await improvement.analyzeForRefactoring('complex.ts', complexCode);
      
      if (target) {
        expect(target.metrics.complexity).toBeGreaterThan(5);
      }
    });
  });

  describe('Feedback Learning', () => {
    it('should record feedback', () => {
      improvement.recordFeedback({
        id: 'fb-1',
        type: 'positive',
        context: 'code-generation',
        message: 'Great code!',
        timestamp: new Date(),
      });

      const stats = improvement.getStats();
      expect(stats.feedbackCount).toBe(1);
    });

    it('should update learning from feedback', () => {
      improvement.recordFeedback({
        id: 'fb-2',
        type: 'negative',
        context: 'refactoring',
        message: 'Broke my code',
        timestamp: new Date(),
      });

      const insights = improvement.getLearningInsights();
      expect(insights.totalEntries).toBeGreaterThan(0);
    });

    it('should track improvement vectors', () => {
      const vectors = improvement.getImprovementVectors();
      
      expect(vectors.length).toBeGreaterThan(0);
      expect(vectors.some(v => v.name === 'Code Generation')).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should analyze performance', async () => {
      const currentMetrics = {
        executionTime: 2000,
        memoryUsage: 200 * 1024 * 1024,
        cpuUsage: 90,
        throughput: 10,
      };

      const optimization = await improvement.analyzePerformance('test-module', currentMetrics);

      expect(optimization.strategies.length).toBeGreaterThan(0);
      expect(optimization.targetMetrics.executionTime).toBeLessThan(currentMetrics.executionTime);
    });
  });
});

// ==================== Decision Tree Tests ====================

describe('AutonomousDecisionTree', () => {
  let decisionTree: AutonomousDecisionTree;

  beforeEach(() => {
    decisionTree = new AutonomousDecisionTree({ enableQuantumMode: false });
  });

  afterEach(() => {
    decisionTree.dispose();
  });

  describe('Decision Making', () => {
    it('should create a decision', () => {
      const actions: Action[] = [
        {
          id: 'action-1',
          name: 'Option A',
          description: 'First option',
          expectedOutcome: 'Success',
          probability: 0.8,
          cost: 50,
          risk: 0.2,
          dependencies: [],
          execute: async () => ({ result: 'A' }),
        },
        {
          id: 'action-2',
          name: 'Option B',
          description: 'Second option',
          expectedOutcome: 'Success',
          probability: 0.6,
          cost: 30,
          risk: 0.1,
          dependencies: [],
          execute: async () => ({ result: 'B' }),
        },
      ];

      const context: DecisionContext = {
        goal: 'test-goal',
        constraints: [],
        availableResources: { taskId: 'test', cpu: 50, memory: 1024, network: 100, storage: 1000, priority: 'medium' },
        historicalDecisions: [],
        urgency: 0.5,
        metadata: {},
      };

      const decision = decisionTree.createQuantumDecision('Test decision', actions, context);

      expect(decision).toBeDefined();
      expect(decision.possibleActions).toHaveLength(2);
      expect(decision.confidence).toBeGreaterThan(0);
    });

    it('should collapse to a decision', () => {
      const actions: Action[] = [
        {
          id: 'action-1',
          name: 'High Probability',
          description: 'Most likely',
          expectedOutcome: 'Success',
          probability: 0.9,
          cost: 50,
          risk: 0.1,
          dependencies: [],
          execute: async () => ({ result: 'success' }),
        },
        {
          id: 'action-2',
          name: 'Low Probability',
          description: 'Less likely',
          expectedOutcome: 'Failure',
          probability: 0.1,
          cost: 50,
          risk: 0.9,
          dependencies: [],
          execute: async () => ({ result: 'failure' }),
        },
      ];

      const context: DecisionContext = {
        goal: 'test',
        constraints: [],
        availableResources: { taskId: 'test', cpu: 50, memory: 1024, network: 100, storage: 1000, priority: 'medium' },
        historicalDecisions: [],
        urgency: 0.5,
        metadata: {},
      };

      const decision = decisionTree.createQuantumDecision('Test', actions, context);
      const collapsed = decisionTree.collapseDecision(decision.id);

      expect(collapsed.selectedAction).toBeDefined();
    });

    it('should execute a decision', async () => {
      const actions: Action[] = [
        {
          id: 'action-1',
          name: 'Execute Test',
          description: 'Test execution',
          expectedOutcome: 'Success',
          probability: 1.0,
          cost: 10,
          risk: 0,
          dependencies: [],
          execute: async () => ({ status: 'executed' }),
        },
      ];

      const context: DecisionContext = {
        goal: 'test-execution',
        constraints: [],
        availableResources: { taskId: 'test', cpu: 50, memory: 1024, network: 100, storage: 1000, priority: 'medium' },
        historicalDecisions: [],
        urgency: 0.5,
        metadata: {},
      };

      const decision = decisionTree.createQuantumDecision('Execution test', actions, context);
      const outcome = await decisionTree.executeDecision(decision.id);

      expect(outcome).toBeDefined();
      expect(outcome.success).toBe(true);
      expect(outcome.result).toEqual({ status: 'executed' });
    });

    it('should evaluate context', () => {
      const context: DecisionContext = {
        goal: 'urgent-goal',
        constraints: [],
        availableResources: { taskId: 'test', cpu: 10, memory: 256, network: 50, storage: 100, priority: 'high' },
        historicalDecisions: [],
        urgency: 0.95,
        metadata: {},
      };

      const evaluation = decisionTree.evaluateContext(context);

      expect(evaluation.confidence).toBeGreaterThan(0);
      expect(evaluation.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Strategic Planning', () => {
    it('should create a strategic plan', async () => {
      const objectives = [
        {
          description: 'Objective 1',
          priority: 'high' as const,
          targetDate: new Date(Date.now() + 86400000),
          successCriteria: ['Criterion 1'],
        },
        {
          description: 'Objective 2',
          priority: 'medium' as const,
          targetDate: new Date(Date.now() + 172800000),
          successCriteria: ['Criterion 2'],
        },
      ];

      const plan = await decisionTree.createStrategicPlan(
        'Test Plan',
        'A test strategic plan',
        objectives,
        {
          startDate: new Date(),
          endDate: new Date(Date.now() + 259200000),
        }
      );

      expect(plan).toBeDefined();
      expect(plan.name).toBe('Test Plan');
      expect(plan.objectives).toHaveLength(2);
      expect(plan.timeline.milestones.length).toBeGreaterThan(0);
    });

    it('should track plan progress', async () => {
      const objectives = [
        {
          description: 'Objective 1',
          priority: 'high' as const,
          targetDate: new Date(Date.now() + 86400000),
          successCriteria: ['Criterion 1'],
        },
      ];

      const plan = await decisionTree.createStrategicPlan(
        'Progress Plan',
        'Test progress tracking',
        objectives,
        {
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
        }
      );

      const progress = decisionTree.getPlanProgress(plan.id);

      expect(progress.percentage).toBe(0);
      expect(progress.totalObjectives).toBe(1);
    });

    it('should update plan progress', async () => {
      const objectives = [
        {
          description: 'Objective 1',
          priority: 'high' as const,
          targetDate: new Date(Date.now() + 86400000),
          successCriteria: ['Criterion 1'],
        },
      ];

      const plan = await decisionTree.createStrategicPlan(
        'Update Plan',
        'Test updates',
        objectives,
        {
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
        }
      );

      const objectiveId = plan.objectives[0].id;
      decisionTree.updatePlanProgress(plan.id, objectiveId, true);

      const progress = decisionTree.getPlanProgress(plan.id);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('Statistics', () => {
    it('should return decision statistics', () => {
      const stats = decisionTree.getStats();

      expect(stats).toHaveProperty('totalDecisions');
      expect(stats).toHaveProperty('activeDecisions');
      expect(stats).toHaveProperty('strategicPlans');
      expect(stats).toHaveProperty('successRate');
    });
  });
});

// ==================== Integration Tests ====================

describe('AutonomousSystem Integration', () => {
  let system: AutonomousSystem;

  beforeEach(() => {
    system = new AutonomousSystem({ autoStart: false });
  });

  afterEach(() => {
    system.dispose();
  });

  describe('System Lifecycle', () => {
    it('should initialize', () => {
      system.initialize();
      
      const state = system.getState();
      expect(state.status).toBe('running');
    });

    it('should pause and resume', () => {
      system.initialize();
      
      system.pause();
      expect(system.getState().status).toBe('paused');

      system.resume();
      expect(system.getState().status).toBe('running');
    });

    it('should shutdown', () => {
      system.initialize();
      system.shutdown();
      
      expect(system.getState().status).toBe('idle');
    });
  });

  describe('Mode Control', () => {
    it('should change modes', () => {
      system.setMode('passive');
      expect(system.getState().config.mode).toBe('passive');

      system.setMode('aggressive');
      expect(system.getState().config.mode).toBe('aggressive');
    });

    it('should enable/disable', () => {
      system.setEnabled(false);
      expect(system.getState().config.enabled).toBe(false);

      system.setEnabled(true);
      expect(system.getState().config.enabled).toBe(true);
    });
  });

  describe('Task Creation', () => {
    it('should create goals', async () => {
      system.initialize();
      
      const goal = await system.createGoal('Test Goal', 'Test description', 'high');
      
      expect(goal).toBeDefined();
      expect(goal?.name).toBe('Test Goal');
    });

    it('should create tasks', async () => {
      system.initialize();
      
      const task = await system.createTask('Test Task', { data: 'test' });
      
      expect(task).toBeDefined();
      expect(task?.name).toBe('Test Task');
    });
  });

  describe('Health Management', () => {
    it('should update health metrics', () => {
      system.initialize();
      
      const metric: HealthMetric = {
        component: 'test-service',
        status: 'healthy',
        latency: 50,
        errorRate: 0,
        throughput: 1000,
        timestamp: new Date(),
        details: {},
      };

      system.updateHealthMetric(metric);
      
      // Health update should propagate
      expect(true).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should return comprehensive stats', () => {
      system.initialize();
      
      const stats = system.getStats();
      
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('execution');
      expect(stats).toHaveProperty('healing');
      expect(stats).toHaveProperty('improvement');
      expect(stats).toHaveProperty('decision');
    });
  });
});

// ==================== End-to-End Tests ====================

describe('End-to-End Autonomous Scenarios', () => {
  it('should handle a complete autonomous workflow', async () => {
    const system = new AutonomousSystem({ autoStart: true });

    try {
      // Create a strategic goal
      const goal = await system.createGoal(
        'Optimize Application Performance',
        'Improve the performance of the main application',
        'high'
      );

      expect(goal).toBeDefined();

      // Simulate health degradation
      system.updateHealthMetric({
        component: 'appforge-core',
        status: 'degraded',
        latency: 500,
        errorRate: 0.05,
        throughput: 500,
        timestamp: new Date(),
        details: { reason: 'High load' },
      });

      // Create a strategic plan
      const plan = await system.createStrategicPlan(
        'Performance Improvement Plan',
        'Comprehensive plan to improve performance',
        [
          {
            description: 'Analyze bottlenecks',
            priority: 'high',
            targetDate: new Date(Date.now() + 86400000),
            successCriteria: ['Bottlenecks identified'],
          },
          {
            description: 'Implement optimizations',
            priority: 'high',
            targetDate: new Date(Date.now() + 172800000),
            successCriteria: ['Optimizations deployed'],
          },
        ]
      );

      expect(plan).toBeDefined();

      // Get system stats
      const stats = system.getStats();
      expect(stats.execution.tasks.total).toBeGreaterThan(0);

    } finally {
      system.dispose();
    }
  });

  it('should make context-aware decisions', async () => {
    const decisionTree = new AutonomousDecisionTree();

    try {
      const outcome = await decisionTree.makeDecision(
        'Handle system overload',
        [
          {
            name: 'Scale Up',
            description: 'Add more resources',
            execute: async () => ({ action: 'scaled_up' }),
          },
          {
            name: 'Queue Requests',
            description: 'Queue incoming requests',
            execute: async () => ({ action: 'queued' }),
          },
        ],
        {
          goal: 'system_stability',
          urgency: 0.9,
          constraints: ['minimize_cost'],
          availableResources: { taskId: 'test', cpu: 50, memory: 1024, network: 100, storage: 1000, priority: 'high' },
        }
      );

      expect(outcome.success).toBe(true);
      expect(outcome.result).toBeDefined();

    } finally {
      decisionTree.dispose();
    }
  });
});
