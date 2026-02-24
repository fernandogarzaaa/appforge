/**
 * Autonomous System Core Types
 * Based on AppForge Autonomous Architecture Specification
 */

// Task Priority Levels
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';

// Task Status
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying';

// Health Status
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'critical';

// Decision confidence levels
export type ConfidenceLevel = 'certain' | 'probable' | 'possible' | 'uncertain';

// ==================== Execution Engine Types ====================

export interface Task {
  id: string;
  name: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dependencies: string[];
  subtasks: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  payload: unknown;
  result?: unknown;
  error?: Error;
  metadata: Record<string, unknown>;
}

export interface TaskDefinition {
  name: string;
  description?: string;
  priority?: TaskPriority;
  dependencies?: string[];
  maxRetries?: number;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  subgoals: string[];
  tasks: string[];
  parentGoal?: string;
  createdAt: Date;
  targetCompletion?: Date;
  completedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface GoalDefinition {
  name: string;
  description: string;
  priority?: TaskPriority;
  parentGoal?: string;
  targetCompletion?: Date;
  metadata?: Record<string, unknown>;
}

export interface ResourceAllocation {
  taskId: string;
  cpu: number; // 0-100
  memory: number; // MB
  network: number; // Mbps
  storage: number; // MB
  priority: TaskPriority;
}

export interface ExecutionContext {
  taskId: string;
  resources: ResourceAllocation;
  timeout: number; // ms
  abortSignal?: AbortSignal;
}

// ==================== Self-Healing Types ====================

export interface HealthMetric {
  component: string;
  status: HealthStatus;
  latency: number;
  errorRate: number;
  throughput: number;
  timestamp: Date;
  details: Record<string, unknown>;
}

export interface ErrorPattern {
  id: string;
  pattern: RegExp;
  category: 'syntax' | 'runtime' | 'behavioral' | 'systemic' | 'strategic';
  autoFix?: (error: Error, context: unknown) => Promise<FixResult>;
  severity: TaskPriority;
}

export interface FixResult {
  success: boolean;
  action: string;
  rollbackAvailable: boolean;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface SystemSnapshot {
  id: string;
  timestamp: Date;
  version: string;
  components: Record<string, HealthMetric>;
  config: Record<string, unknown>;
  state: Record<string, unknown>;
}

export interface HealingStrategy {
  level: 1 | 2 | 3; // 1=Immediate, 2=Structural, 3=Architectural
  trigger: (metric: HealthMetric) => boolean;
  action: (metric: HealthMetric, context: HealingContext) => Promise<FixResult>;
  rollback: (snapshot: SystemSnapshot) => Promise<void>;
}

export interface HealingContext {
  metric: HealthMetric;
  snapshot?: SystemSnapshot;
  previousAttempts: number;
  maxAttempts: number;
}

// ==================== Self-Improvement Types ====================

export interface CodeGenerationRequest {
  id: string;
  naturalLanguage: string;
  targetLanguage: string;
  context?: string;
  constraints?: string[];
  priority: TaskPriority;
  timestamp: Date;
}

export interface CodeGenerationResult {
  requestId: string;
  code: string;
  language: string;
  confidence: number;
  tests?: string;
  documentation?: string;
  validationResult?: ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  syntaxErrors: string[];
  runtimeErrors: string[];
  securityIssues: string[];
  performanceScore: number;
}

export interface RefactoringTarget {
  id: string;
  filePath: string;
  code: string;
  metrics: CodeMetrics;
  suggestedImprovements: string[];
}

export interface CodeMetrics {
  complexity: number; // Cyclomatic complexity
  linesOfCode: number;
  duplicateLines: number;
  testCoverage: number;
  maintainabilityIndex: number; // 0-100
}

export interface PerformanceOptimization {
  id: string;
  target: string;
  currentMetrics: PerformanceMetrics;
  targetMetrics: PerformanceMetrics;
  strategies: OptimizationStrategy[];
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  expectedImprovement: number;
  risk: 'low' | 'medium' | 'high';
  implementation: string;
}

export interface UserFeedback {
  id: string;
  type: 'positive' | 'negative' | 'suggestion';
  context: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface LearningEntry {
  id: string;
  pattern: string;
  outcome: 'success' | 'failure';
  context: unknown;
  confidence: number;
  timestamp: Date;
  feedbackIds: string[];
}

// ==================== Decision Tree Types ====================

export interface Decision {
  id: string;
  description: string;
  possibleActions: Action[];
  selectedAction?: Action;
  confidence: number;
  context: DecisionContext;
  timestamp: Date;
  outcome?: DecisionOutcome;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  expectedOutcome: string;
  probability: number; // 0-1
  cost: number; // Resource cost
  risk: number; // 0-1
  dependencies: string[];
  execute: () => Promise<unknown>;
}

export interface DecisionContext {
  goal: string;
  constraints: string[];
  availableResources: ResourceAllocation;
  historicalDecisions: string[];
  urgency: number; // 0-1
  metadata: Record<string, unknown>;
}

export interface DecisionOutcome {
  success: boolean;
  result: unknown;
  metrics: Record<string, number>;
  timestamp: Date;
}

export interface StrategicPlan {
  id: string;
  name: string;
  description: string;
  objectives: Objective[];
  timeline: Timeline;
  dependencies: string[];
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Objective {
  id: string;
  description: string;
  priority: TaskPriority;
  targetDate: Date;
  successCriteria: string[];
  completed: boolean;
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  deliverables: string[];
  completed: boolean;
}

// ==================== Quantum-Inspired Types ====================

export interface QuantumState<T> {
  amplitudes: Map<T, Complex>;
  phase: number;
  entangledWith?: string[];
}

export interface Complex {
  real: number;
  imaginary: number;
}

export interface Superposition<T> {
  states: Map<T, number>; // State -> Probability amplitude squared
  collapsed: boolean;
  observedValue?: T;
}

// ==================== Autonomous System Types ====================

export interface AutonomousConfig {
  enabled: boolean;
  mode: 'passive' | 'active' | 'aggressive';
  safetyLevel: 'strict' | 'moderate' | 'permissive';
  maxConcurrentTasks: number;
  healingEnabled: boolean;
  improvementEnabled: boolean;
  decisionLogging: boolean;
  humanApprovalRequired: string[]; // Action types requiring approval
}

export interface SystemEvent {
  id: string;
  type: string;
  source: string;
  payload: unknown;
  timestamp: Date;
  priority: TaskPriority;
}

export interface AutonomousState {
  status: 'idle' | 'running' | 'paused' | 'error';
  activeTasks: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  lastHealthCheck: Date;
  healthStatus: HealthStatus;
  config: AutonomousConfig;
}

// ==================== Safety & Containment Types ====================

export interface SafetyConstraint {
  id: string;
  name: string;
  description: string;
  check: (action: Action) => boolean;
  violationAction: 'block' | 'warn' | 'log';
}

export interface CapabilityBoundary {
  domain: string;
  allowedOperations: string[];
  forbiddenOperations: string[];
  resourceLimits: ResourceAllocation;
}

export interface OverrideRequest {
  id: string;
  level: 1 | 2 | 3 | 4 | 5; // 5 = Kill switch
  reason: string;
  timestamp: Date;
  approved?: boolean;
  approvedBy?: string;
}
