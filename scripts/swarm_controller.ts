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
  failed_strategy_attempts: Record<string, number>;
  failed_strategies: Record<string, string[]>;
  failed_mutated_strategies: Record<string, string[]>;
}

const TASK_QUEUE_PATH = path.join('swarm', 'task_queue.json');
const SWARM_MEMORY_PATH = path.join('swarm', 'swarm_memory.json');
const RUN_CONTEXT_PATH = path.join('swarm', 'run_context.json');
const MAX_TASKS_PER_CYCLE = 5;
const MAX_EXPERIMENTS_PER_TASK = 4;
const MAX_RETRIES = 3;

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
          failed_strategy_attempts: {},
          failed_strategies: {},
          failed_mutated_strategies: {}
        },
        null,
        2
      )
    );
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
    failed_strategy_attempts: loaded.failed_strategy_attempts ?? {},
    failed_strategies: loaded.failed_strategies ?? {},
    failed_mutated_strategies: loaded.failed_mutated_strategies ?? {}
  };
}

function saveMemory(memory: SwarmMemory): void {
  writeFileSync(SWARM_MEMORY_PATH, JSON.stringify(memory, null, 2));
}

async function prepareRunContext(): Promise<void> {
  ensurePersistenceFiles();

  const queue = loadQueue();
  const memory = loadMemory();

  const signals = await detectSwarmSignals();
  const tasks = generateTasksFromSignals(signals, MAX_TASKS_PER_CYCLE);
  if (tasks.length > 0) {
    queue.tasks.push(...tasks);
  }

  const nextTask = selectNextTask(queue.tasks);
  const runId = process.env.GITHUB_RUN_ID ?? `${Date.now()}`;

  if (!nextTask) {
    const context = { run_id: runId, has_task: false, strategies: [] };
    writeFileSync(RUN_CONTEXT_PATH, JSON.stringify(context, null, 2));

    memory.cycle_count += 1;
    memory.last_cycle_at = new Date().toISOString();
    memory.last_signals = signals.map((signal) => signal.type);
    saveQueue(queue);
    saveMemory(memory);
    return;
  }

  const strategies = generateExperimentStrategies(nextTask, MAX_EXPERIMENTS_PER_TASK);

  nextTask.status = 'running';
  nextTask.updated_at = new Date().toISOString();
  saveQueue(queue);

  const context = {
    run_id: runId,
    has_task: true,
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
  saveMemory(memory);
}

prepareRunContext().catch((error) => {
  console.error('Swarm controller failed:', error);
  process.exit(1);
});
