/**
 * Autonomous Execution Engine
 * 
 * Self-triggering task scheduler with goal decomposition and planning,
 * resource allocation without human input, and priority management system.
 * 
 * Based on: AppForge Autonomous Architecture Specification v1.0
 */

import {
  Task,
  TaskDefinition,
  Goal,
  GoalDefinition,
  TaskPriority,
  TaskStatus,
  ResourceAllocation,
  ExecutionContext,
  AutonomousConfig,
  SystemEvent,
} from './types';

import { EventEmitter } from 'events';

// Priority weights for scheduling
const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  critical: 1000,
  high: 100,
  medium: 10,
  low: 1,
  background: 0.1,
};

interface ExecutionEngineOptions {
  maxConcurrentTasks?: number;
  defaultTimeout?: number;
  autoStart?: boolean;
  config?: AutonomousConfig;
}

/**
 * Autonomous Execution Engine
 * 
 * Core capabilities:
 * - Self-triggering task scheduler
 * - Goal decomposition and planning
 * - Resource allocation without human input
 * - Priority management system
 */
export class ExecutionEngine extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private goals: Map<string, Goal> = new Map();
  private taskQueue: string[] = [];
  private runningTasks: Set<string> = new Set();
  private resources: Map<string, ResourceAllocation> = new Map();
  private taskHandlers: Map<string, (task: Task, context: ExecutionContext) => Promise<unknown>> = new Map();
  
  private maxConcurrentTasks: number;
  private defaultTimeout: number;
  private config: AutonomousConfig;
  private isRunning: boolean = false;
  private schedulerInterval?: NodeJS.Timeout;
  private readonly schedulerTickMs: number = 100;

  constructor(options: ExecutionEngineOptions = {}) {
    super();
    this.maxConcurrentTasks = options.maxConcurrentTasks || 10;
    this.defaultTimeout = options.defaultTimeout || 30000;
    this.config = options.config || {
      enabled: true,
      mode: 'active',
      safetyLevel: 'moderate',
      maxConcurrentTasks: 10,
      healingEnabled: true,
      improvementEnabled: true,
      decisionLogging: true,
      humanApprovalRequired: ['delete', 'modify_core', 'deploy_production'],
    };

    if (options.autoStart !== false) {
      this.start();
    }
  }

  // ==================== Task Management ====================

  /**
   * Create and queue a new task
   */
  async createTask(definition: TaskDefinition): Promise<Task> {
    const task: Task = {
      id: this.generateId(),
      name: definition.name,
      description: definition.description,
      priority: definition.priority || 'medium',
      status: 'pending',
      dependencies: definition.dependencies || [],
      subtasks: [],
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: definition.maxRetries || 3,
      payload: definition.payload,
      metadata: definition.metadata || {},
    };

    this.tasks.set(task.id, task);
    
    // Check if dependencies are satisfied
    if (this.areDependenciesMet(task)) {
      this.enqueueTask(task.id);
    }

    this.emit('task:created', { task });
    this.logDecision('task_created', { taskId: task.id, priority: task.priority });

    return task;
  }

  /**
   * Create multiple tasks in batch
   */
  async createTasks(definitions: TaskDefinition[]): Promise<Task[]> {
    return Promise.all(definitions.map(def => this.createTask(def)));
  }

  /**
   * Cancel a pending or running task
   */
  async cancelTask(taskId: string, reason?: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === 'running') {
      this.runningTasks.delete(taskId);
      task.status = 'cancelled';
      this.emit('task:cancelled', { task, reason });
    } else if (task.status === 'pending') {
      this.taskQueue = this.taskQueue.filter(id => id !== taskId);
      task.status = 'cancelled';
      this.emit('task:cancelled', { task, reason });
    }

    return true;
  }

  /**
   * Retry a failed task
   */
  async retryTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'failed') return false;
    if (task.retryCount >= task.maxRetries) return false;

    task.retryCount++;
    task.status = 'pending';
    task.error = undefined;
    
    this.enqueueTask(taskId);
    this.emit('task:retry', { task });

    return true;
  }

  // ==================== Goal Management ====================

  /**
   * Create a high-level goal and decompose it into tasks
   */
  async createGoal(definition: GoalDefinition): Promise<Goal> {
    const goal: Goal = {
      id: this.generateId(),
      name: definition.name,
      description: definition.description,
      priority: definition.priority || 'medium',
      status: 'pending',
      subgoals: [],
      tasks: [],
      parentGoal: definition.parentGoal,
      createdAt: new Date(),
      targetCompletion: definition.targetCompletion,
      metadata: definition.metadata || {},
    };

    this.goals.set(goal.id, goal);

    // Auto-decompose goal into tasks based on description
    const subtasks = await this.decomposeGoal(goal);
    goal.tasks = subtasks.map(t => t.id);

    this.emit('goal:created', { goal, tasks: subtasks });
    this.logDecision('goal_created', { goalId: goal.id, taskCount: subtasks.length });

    return goal;
  }

  /**
   * Decompose a goal into executable tasks using AI-powered planning
   */
  private async decomposeGoal(goal: Goal): Promise<Task[]> {
    // This would integrate with LLM for intelligent decomposition
    // For now, use rule-based decomposition
    const tasks: TaskDefinition[] = this.ruleBasedDecomposition(goal);
    
    // Create tasks
    const createdTasks: Task[] = [];
    for (const taskDef of tasks) {
      taskDef.metadata = { ...taskDef.metadata, parentGoal: goal.id };
      const task = await this.createTask(taskDef);
      createdTasks.push(task);
    }

    return createdTasks;
  }

  /**
   * Rule-based goal decomposition (fallback when LLM unavailable)
   */
  private ruleBasedDecomposition(goal: Goal): TaskDefinition[] {
    const tasks: TaskDefinition[] = [];
    const description = goal.description.toLowerCase();

    // Pattern-based task generation
    if (description.includes('refactor') || description.includes('optimize')) {
      tasks.push(
        {
          name: 'Analyze Current Code',
          description: 'Analyze codebase for refactoring opportunities',
          priority: 'high',
          payload: { type: 'analysis', target: goal.description },
        },
        {
          name: 'Generate Refactoring Plan',
          description: 'Create detailed refactoring plan',
          priority: 'high',
          dependencies: [], // Will be updated after task creation
          payload: { type: 'planning', target: goal.description },
        },
        {
          name: 'Apply Refactoring',
          description: 'Execute refactoring changes',
          priority: goal.priority,
          payload: { type: 'execution', target: goal.description },
        },
        {
          name: 'Validate Changes',
          description: 'Run tests and validation',
          priority: 'high',
          payload: { type: 'validation', target: goal.description },
        }
      );
    } else if (description.includes('implement') || description.includes('create')) {
      tasks.push(
        {
          name: 'Requirements Analysis',
          description: 'Analyze requirements for implementation',
          priority: 'high',
          payload: { type: 'analysis', target: goal.description },
        },
        {
          name: 'Design Solution',
          description: 'Design the implementation approach',
          priority: 'high',
          payload: { type: 'design', target: goal.description },
        },
        {
          name: 'Implement Feature',
          description: 'Write the code implementation',
          priority: goal.priority,
          payload: { type: 'implementation', target: goal.description },
        },
        {
          name: 'Test Implementation',
          description: 'Write and run tests',
          priority: 'high',
          payload: { type: 'testing', target: goal.description },
        }
      );
    } else {
      // Generic decomposition
      tasks.push(
        {
          name: 'Analyze Task',
          description: `Analyze: ${goal.description}`,
          priority: 'medium',
          payload: { type: 'analysis', target: goal.description },
        },
        {
          name: 'Execute Task',
          description: `Execute: ${goal.description}`,
          priority: goal.priority,
          payload: { type: 'execution', target: goal.description },
        },
        {
          name: 'Verify Results',
          description: 'Verify task completion',
          priority: 'medium',
          payload: { type: 'verification', target: goal.description },
        }
      );
    }

    // Link dependencies
    for (let i = 1; i < tasks.length; i++) {
      // Tasks depend on previous tasks
      tasks[i].dependencies = [this.generateId()]; // Placeholder
    }

    return tasks;
  }

  /**
   * Get goal progress
   */
  getGoalProgress(goalId: string): { completed: number; total: number; percentage: number } {
    const goal = this.goals.get(goalId);
    if (!goal) return { completed: 0, total: 0, percentage: 0 };

    const tasks = goal.tasks.map(id => this.tasks.get(id)).filter(Boolean) as Task[];
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;

    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  // ==================== Task Scheduling ====================

  /**
   * Start the execution engine scheduler
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.emit('engine:started');
    
    this.schedulerInterval = setInterval(() => {
      this.scheduleTasks();
    }, this.schedulerTickMs);
  }

  /**
   * Stop the execution engine
   */
  stop(): void {
    this.isRunning = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }
    this.emit('engine:stopped');
  }

  /**
   * Main scheduling loop
   */
  private scheduleTasks(): void {
    if (!this.isRunning) return;
    if (this.runningTasks.size >= this.maxConcurrentTasks) return;

    // Sort queue by priority (weighted scheduling)
    this.taskQueue.sort((a, b) => {
      const taskA = this.tasks.get(a)!;
      const taskB = this.tasks.get(b)!;
      return this.calculatePriorityScore(taskB) - this.calculatePriorityScore(taskA);
    });

    // Execute tasks up to concurrency limit
    while (
      this.runningTasks.size < this.maxConcurrentTasks &&
      this.taskQueue.length > 0
    ) {
      const taskId = this.taskQueue.shift()!;
      const task = this.tasks.get(taskId);
      
      if (task && this.areDependenciesMet(task)) {
        this.executeTask(task);
      } else if (task) {
        // Put back in queue if dependencies not met
        this.taskQueue.push(taskId);
        break; // Stop processing to avoid infinite loop
      }
    }
  }

  /**
   * Calculate priority score for scheduling
   */
  private calculatePriorityScore(task: Task): number {
    const baseWeight = PRIORITY_WEIGHTS[task.priority];
    const age = Date.now() - task.createdAt.getTime();
    const ageBonus = Math.log(age / 1000 + 1); // Logarithmic age bonus
    const retryPenalty = task.retryCount * 0.5;

    return baseWeight + ageBonus - retryPenalty;
  }

  /**
   * Check if task dependencies are satisfied
   */
  private areDependenciesMet(task: Task): boolean {
    return task.dependencies.every(depId => {
      const dep = this.tasks.get(depId);
      return dep?.status === 'completed';
    });
  }

  /**
   * Add task to execution queue
   */
  private enqueueTask(taskId: string): void {
    if (!this.taskQueue.includes(taskId)) {
      this.taskQueue.push(taskId);
      this.emit('task:queued', { taskId });
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task): Promise<void> {
    task.status = 'running';
    task.startedAt = new Date();
    this.runningTasks.add(task.id);

    this.emit('task:started', { task });

    const context: ExecutionContext = {
      taskId: task.id,
      resources: this.allocateResources(task),
      timeout: this.defaultTimeout,
    };

    try {
      const handler = this.taskHandlers.get(task.name) || this.getDefaultHandler();
      const result = await this.runWithTimeout(handler(task, context), context.timeout);
      
      task.result = result;
      task.status = 'completed';
      task.completedAt = new Date();
      
      this.emit('task:completed', { task, result });
      this.logDecision('task_completed', { taskId: task.id, duration: task.completedAt.getTime() - task.startedAt.getTime() });

      // Check parent goal completion
      this.checkGoalCompletion(task);

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error : new Error(String(error));
      
      this.emit('task:failed', { task, error: task.error });
      this.logDecision('task_failed', { taskId: task.id, error: task.error.message });

      // Auto-retry if enabled
      if (this.config.healingEnabled && task.retryCount < task.maxRetries) {
        await this.retryTask(task.id);
      }
    } finally {
      this.runningTasks.delete(task.id);
      this.releaseResources(task.id);
    }
  }

  /**
   * Run task with timeout
   */
  private runWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), timeout);
      }),
    ]);
  }

  // ==================== Resource Management ====================

  /**
   * Allocate resources for a task
   */
  private allocateResources(task: Task): ResourceAllocation {
    const allocation: ResourceAllocation = {
      taskId: task.id,
      cpu: task.priority === 'critical' ? 50 : task.priority === 'high' ? 30 : 10,
      memory: task.priority === 'critical' ? 1024 : task.priority === 'high' ? 512 : 256,
      network: 100,
      storage: 100,
      priority: task.priority,
    };

    this.resources.set(task.id, allocation);
    return allocation;
  }

  /**
   * Release resources for a task
   */
  private releaseResources(taskId: string): void {
    this.resources.delete(taskId);
  }

  /**
   * Get current resource utilization
   */
  getResourceUtilization(): {
    allocated: ResourceAllocation;
    available: ResourceAllocation;
    utilizationPercent: number;
  } {
    const allocated = Array.from(this.resources.values()).reduce(
      (acc, curr) => ({
        taskId: 'total',
        cpu: acc.cpu + curr.cpu,
        memory: acc.memory + curr.memory,
        network: acc.network + curr.network,
        storage: acc.storage + curr.storage,
        priority: 'medium' as TaskPriority,
      }),
      { taskId: 'total', cpu: 0, memory: 0, network: 0, storage: 0, priority: 'medium' as TaskPriority }
    );

    return {
      allocated,
      available: {
        taskId: 'available',
        cpu: 100 - allocated.cpu,
        memory: 4096 - allocated.memory,
        network: 1000 - allocated.network,
        storage: 10000 - allocated.storage,
        priority: 'medium',
      },
      utilizationPercent: (this.runningTasks.size / this.maxConcurrentTasks) * 100,
    };
  }

  // ==================== Task Handlers ====================

  /**
   * Register a handler for a specific task type
   */
  registerHandler(
    taskName: string,
    handler: (task: Task, context: ExecutionContext) => Promise<unknown>
  ): void {
    this.taskHandlers.set(taskName, handler);
  }

  /**
   * Get default task handler
   */
  private getDefaultHandler(): (task: Task, context: ExecutionContext) => Promise<unknown> {
    return async (task: Task) => {
      // Default handler - log and return payload
      console.log(`[ExecutionEngine] Executing task: ${task.name}`);
      return { success: true, payload: task.payload };
    };
  }

  // ==================== Goal Tracking ====================

  /**
   * Check if parent goal is completed
   */
  private checkGoalCompletion(task: Task): void {
    const parentGoalId = task.metadata?.parentGoal as string | undefined;
    if (!parentGoalId) return;

    const goal = this.goals.get(parentGoalId);
    if (!goal) return;

    const progress = this.getGoalProgress(parentGoalId);
    
    if (progress.percentage === 100) {
      goal.status = 'completed';
      goal.completedAt = new Date();
      this.emit('goal:completed', { goal });
      this.logDecision('goal_completed', { goalId: goal.id });
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log autonomous decision
   */
  private logDecision(action: string, data: Record<string, unknown>): void {
    if (!this.config.decisionLogging) return;
    
    const event: SystemEvent = {
      id: this.generateId(),
      type: 'decision',
      source: 'ExecutionEngine',
      payload: { action, ...data },
      timestamp: new Date(),
      priority: 'low',
    };

    this.emit('decision:logged', event);
  }

  /**
   * Get engine statistics
   */
  getStats(): {
    tasks: {
      total: number;
      pending: number;
      running: number;
      completed: number;
      failed: number;
    };
    goals: {
      total: number;
      completed: number;
    };
    queueLength: number;
    isRunning: boolean;
  } {
    const allTasks = Array.from(this.tasks.values());
    const allGoals = Array.from(this.goals.values());

    return {
      tasks: {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === 'pending').length,
        running: allTasks.filter(t => t.status === 'running').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        failed: allTasks.filter(t => t.status === 'failed').length,
      },
      goals: {
        total: allGoals.length,
        completed: allGoals.filter(g => g.status === 'completed').length,
      },
      queueLength: this.taskQueue.length,
      isRunning: this.isRunning,
    };
  }

  /**
   * Get all tasks
   */
  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get all goals
   */
  getGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  /**
   * Dispose of the engine
   */
  dispose(): void {
    this.stop();
    this.removeAllListeners();
    this.tasks.clear();
    this.goals.clear();
    this.taskQueue = [];
    this.runningTasks.clear();
    this.resources.clear();
    this.taskHandlers.clear();
  }
}

// Singleton instance for app-wide use
let globalExecutionEngine: ExecutionEngine | null = null;

export function getExecutionEngine(options?: ExecutionEngineOptions): ExecutionEngine {
  if (!globalExecutionEngine) {
    globalExecutionEngine = new ExecutionEngine(options);
  }
  return globalExecutionEngine;
}

export function resetExecutionEngine(): void {
  if (globalExecutionEngine) {
    globalExecutionEngine.dispose();
    globalExecutionEngine = null;
  }
}
