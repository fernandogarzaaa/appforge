import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { detectSwarmSignals } from './swarm_signal_detector.ts';
import { generateTasksFromSignals, type SwarmTask } from './swarm_task_generator.ts';
import { executeTask, selectNextTask } from './swarm_task_executor.ts';
import { evaluateRepository } from './evaluator.ts';

interface QueueState {
  tasks: SwarmTask[];
}

interface SwarmMemory {
  cycle_count: number;
  last_cycle_at: string;
  last_signals: string[];
  completed_tasks: number;
  failed_tasks: number;
}

const TASK_QUEUE_PATH = path.join('swarm', 'task_queue.json');
const SWARM_MEMORY_PATH = path.join('swarm', 'swarm_memory.json');
const MAX_TASKS_PER_CYCLE = 5;
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
          failed_tasks: 0
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
  return JSON.parse(readFileSync(SWARM_MEMORY_PATH, 'utf-8')) as SwarmMemory;
}

function saveMemory(memory: SwarmMemory): void {
  writeFileSync(SWARM_MEMORY_PATH, JSON.stringify(memory, null, 2));
}

function gitHasChanges(): boolean {
  const result = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf-8' });
  return (result.stdout ?? '').trim().length > 0;
}

function commitChanges(message: string): void {
  spawnSync('git', ['config', 'user.name', 'appforge-swarm-bot'], { encoding: 'utf-8' });
  spawnSync('git', ['config', 'user.email', 'swarm-bot@appforge.local'], { encoding: 'utf-8' });
  spawnSync('git', ['add', '-A'], { encoding: 'utf-8' });
  spawnSync('git', ['commit', '-m', message], { encoding: 'utf-8' });
}

function revertRepoChanges(): void {
  spawnSync('git', ['reset', '--hard', 'HEAD'], { encoding: 'utf-8' });
  spawnSync('git', ['clean', '-fd'], { encoding: 'utf-8' });
}

async function main(): Promise<void> {
  ensurePersistenceFiles();

  const queue = loadQueue();
  const memory = loadMemory();

  const signals = await detectSwarmSignals();
  const tasks = generateTasksFromSignals(signals, MAX_TASKS_PER_CYCLE);

  if (tasks.length > 0) {
    queue.tasks.push(...tasks);
  }

  const nextTask = selectNextTask(queue.tasks);
  if (!nextTask) {
    console.log('No runnable tasks detected in queue.');
    memory.cycle_count += 1;
    memory.last_cycle_at = new Date().toISOString();
    memory.last_signals = signals.map((signal) => signal.type);
    saveQueue(queue);
    saveMemory(memory);
    return;
  }

  nextTask.status = 'running';
  nextTask.updated_at = new Date().toISOString();
  saveQueue(queue);

  const execution = executeTask(nextTask);
  const evaluation = evaluateRepository();

  if (execution.success && evaluation.success) {
    nextTask.status = 'completed';
    memory.completed_tasks += 1;

    if (gitHasChanges()) {
      commitChanges(`swarm: complete ${nextTask.id} (${nextTask.description})`);
    }
  } else {
    nextTask.retries += 1;
    nextTask.status = nextTask.retries >= MAX_RETRIES ? 'failed' : 'pending';
    memory.failed_tasks += 1;
    revertRepoChanges();
  }

  nextTask.updated_at = new Date().toISOString();
  memory.cycle_count += 1;
  memory.last_cycle_at = new Date().toISOString();
  memory.last_signals = signals.map((signal) => signal.type);

  saveQueue(queue);
  saveMemory(memory);

  console.log('Task execution log:');
  console.log(execution.log);
  console.log('Evaluation:', evaluation.details.join(' | '));
}

main().catch((error) => {
  console.error('Swarm controller failed:', error);
  process.exit(1);
});
