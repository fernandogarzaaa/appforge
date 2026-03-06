import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { detectSwarmSignals } from './swarm_signal_detector.ts';
import { generateTasksFromSignals, type SwarmTask } from './swarm_task_generator.ts';
import { selectNextTask } from './swarm_task_executor.ts';
import { generateExperimentStrategies } from './swarm_experiment_generator.ts';

interface QueueState {
  tasks: SwarmTask[];
}

interface SwarmMemory {
  cycle_count: number;
  last_cycle_at: string;
  last_signals: string[];
  completed_tasks: number;
  failed_tasks: number;
  empty_strategy_cycles: number;
  failed_strategy_attempts: Record<string, number>;
  failed_strategies: Record<string, string[]>;
  failed_mutated_strategies: Record<string, string[]>;
}

const TASK_QUEUE_PATH = path.join('swarm', 'task_queue.json');
const SWARM_MEMORY_PATH = path.join('swarm', 'swarm_memory.json');
const LOOP_TELEMETRY_PATH = path.join('swarm', 'loop_telemetry.json');
const RUN_CONTEXT_PATH = path.join('swarm', 'run_context.json');
const MAX_TASKS_PER_CYCLE = 5;
const MAX_EXPERIMENTS_PER_TASK = 4;
const MAX_RETRIES = 3;
const MAX_TELEMETRY_POINTS = 1000;

interface LoopTelemetryPoint {
  timestamp: string;
  cycle_count: number;
  empty_strategy_cycles: number;
}

function dedupeNewTasks(queue: QueueState, generatedTasks: SwarmTask[]): SwarmTask[] {
  const activeSignals = new Set(
    queue.tasks
      .filter((task) => task.status === 'pending' || task.status === 'running')
      .map((task) => task.signal)
  );

  return generatedTasks.filter((task) => !activeSignals.has(task.signal));
}

function ensurePersistenceFiles(): void {
  mkdirSync('swarm', { recursive: true });

  if (!existsSync(TASK_QUEUE_PATH)) {
    writeFileSync(TASK_QUEUE_PATH, JSON.stringify({ tasks: [] }, null, 2));
  }

  if (!existsSync(SWARM_MEMORY_PATH)) {
    writeFileSync(
      SWARM_MEMORY_PATH,
      JSON.stringify(
        {
          cycle_count: 0,
          last_cycle_at: new Date(0).toISOString(),
          last_signals: [],
          completed_tasks: 0,
          failed_tasks: 0,
          empty_strategy_cycles: 0,
          failed_strategy_attempts: {},
          failed_strategies: {},
          failed_mutated_strategies: {}
        },
        null,
        2
      )
    );
  }

  if (!existsSync(LOOP_TELEMETRY_PATH)) {
    writeFileSync(LOOP_TELEMETRY_PATH, JSON.stringify([], null, 2));
  }
}

function loadQueue(): QueueState {
  return JSON.parse(readFileSync(TASK_QUEUE_PATH, 'utf-8')) as QueueState;
}

function saveQueue(state: QueueState): void {
  writeFileSync(TASK_QUEUE_PATH, JSON.stringify(state, null, 2));
}

function loadMemory(): SwarmMemory {
  const loaded = JSON.parse(readFileSync(SWARM_MEMORY_PATH, 'utf-8')) as Partial<SwarmMemory>;
  return {
    cycle_count: loaded.cycle_count ?? 0,
    last_cycle_at: loaded.last_cycle_at ?? new Date(0).toISOString(),
    last_signals: loaded.last_signals ?? [],
    completed_tasks: loaded.completed_tasks ?? 0,
    failed_tasks: loaded.failed_tasks ?? 0,
    empty_strategy_cycles: loaded.empty_strategy_cycles ?? 0,
    failed_strategy_attempts: loaded.failed_strategy_attempts ?? {},
    failed_strategies: loaded.failed_strategies ?? {},
    failed_mutated_strategies: loaded.failed_mutated_strategies ?? {}
  };
}

function saveMemory(memory: SwarmMemory): void {
  writeFileSync(SWARM_MEMORY_PATH, JSON.stringify(memory, null, 2));
}

function appendLoopTelemetry(memory: SwarmMemory): void {
  const history = existsSync(LOOP_TELEMETRY_PATH)
    ? (JSON.parse(readFileSync(LOOP_TELEMETRY_PATH, 'utf-8')) as LoopTelemetryPoint[])
    : [];

  history.push({
    timestamp: memory.last_cycle_at,
    cycle_count: memory.cycle_count,
    empty_strategy_cycles: memory.empty_strategy_cycles
  });

  writeFileSync(LOOP_TELEMETRY_PATH, JSON.stringify(history.slice(-MAX_TELEMETRY_POINTS), null, 2));
}

async function prepareRunContext(): Promise<void> {
  ensurePersistenceFiles();

  const queue = loadQueue();
  const memory = loadMemory();

  const signals = await detectSwarmSignals();
  const generatedTasks = generateTasksFromSignals(signals, MAX_TASKS_PER_CYCLE);
  const tasksToQueue = dedupeNewTasks(queue, generatedTasks);

  if (generatedTasks.length > tasksToQueue.length) {
    console.log(
      `[swarm-controller] Skipped ${generatedTasks.length - tasksToQueue.length} duplicate task(s) due to active signal queue entries.`
    );
  }

  if (tasksToQueue.length > 0) {
    queue.tasks.push(...tasksToQueue);
  }

  const nextTask = selectNextTask(queue.tasks);
  const runId = process.env.GITHUB_RUN_ID ?? `${Date.now()}`;

  if (!nextTask) {
    const context = { run_id: runId, has_task: false, reason: 'no_task', strategies: [] };
    writeFileSync(RUN_CONTEXT_PATH, JSON.stringify(context, null, 2));

    memory.cycle_count += 1;
    memory.last_cycle_at = new Date().toISOString();
    memory.last_signals = signals.map((signal) => signal.type);
    saveQueue(queue);
    appendLoopTelemetry(memory);
    saveMemory(memory);
    return;
  }

  const strategies = generateExperimentStrategies(nextTask, MAX_EXPERIMENTS_PER_TASK);

  if (strategies.length === 0) {
    console.warn(
      `[swarm-controller] No experiment strategies generated for task ${nextTask.id} (${nextTask.signal}); retrying later.`
    );

    nextTask.retries = (nextTask.retries ?? 0) + 1;
    nextTask.status = nextTask.retries >= MAX_RETRIES ? 'failed' : 'pending';
    nextTask.updated_at = new Date().toISOString();
    saveQueue(queue);

    const context = {
      run_id: runId,
      has_task: false,
      reason: 'empty_strategies',
      task: nextTask,
      strategies: []
    };
    writeFileSync(RUN_CONTEXT_PATH, JSON.stringify(context, null, 2));

    memory.cycle_count += 1;
    memory.last_cycle_at = new Date().toISOString();
    memory.last_signals = signals.map((signal) => signal.type);
    memory.empty_strategy_cycles += 1;
    appendLoopTelemetry(memory);
    saveMemory(memory);

    return;
  }

  nextTask.status = 'running';
  nextTask.updated_at = new Date().toISOString();
  saveQueue(queue);

  const context = {
    run_id: runId,
    has_task: true,
    reason: 'task_selected',
    task: nextTask,
    strategies,
    limits: {
      max_tasks_per_cycle: MAX_TASKS_PER_CYCLE,
      max_experiments_per_task: MAX_EXPERIMENTS_PER_TASK,
      max_retries_per_task: MAX_RETRIES
    }
  };

  writeFileSync(RUN_CONTEXT_PATH, JSON.stringify(context, null, 2));

  memory.cycle_count += 1;
  memory.last_cycle_at = new Date().toISOString();
  memory.last_signals = signals.map((signal) => signal.type);
  appendLoopTelemetry(memory);
  saveMemory(memory);
}

prepareRunContext().catch((error) => {
  console.error('Swarm controller failed:', error);
  process.exit(1);
});
