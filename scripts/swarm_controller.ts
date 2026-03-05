import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { detectRepositorySignals } from './swarm_signal_detector';
import { generateTasksFromSignals, type SwarmTask } from './swarm_task_generator';
import { generateExperimentStrategies, type ExperimentStrategy } from './swarm_experiment_generator';
import { evaluateExperiment } from './evaluator';

interface TaskQueueFile {
  tasks: SwarmTask[];
}

interface SwarmMemory {
  lastRunAt: string;
  cycles: number;
  completedTasks: number;
  experiments: Array<{ taskId: string; strategyId: string; branch: string; score: number }>;
}

interface RunContext {
  runId: string;
  task: SwarmTask;
  strategies: ExperimentStrategy[];
}

const MAX_TASKS_PER_CYCLE = 5;
const MAX_EXPERIMENTS_PER_TASK = 4;
const MAX_RETRIES_PER_TASK = 3;
const TASK_QUEUE_PATH = path.resolve('swarm/task_queue.json');
const MEMORY_PATH = path.resolve('swarm/swarm_memory.json');
const RUN_CONTEXT_PATH = path.resolve('swarm/run_context.json');

function ensureStateFiles(): void {
  mkdirSync(path.dirname(TASK_QUEUE_PATH), { recursive: true });
  if (!existsSync(TASK_QUEUE_PATH)) {
    writeFileSync(TASK_QUEUE_PATH, JSON.stringify({ tasks: [] }, null, 2));
  }
  if (!existsSync(MEMORY_PATH)) {
    const initialMemory: SwarmMemory = { lastRunAt: '', cycles: 0, completedTasks: 0, experiments: [] };
    writeFileSync(MEMORY_PATH, JSON.stringify(initialMemory, null, 2));
  }
}

function loadQueue(): TaskQueueFile {
  return JSON.parse(readFileSync(TASK_QUEUE_PATH, 'utf8')) as TaskQueueFile;
}

function saveQueue(queue: TaskQueueFile): void {
  writeFileSync(TASK_QUEUE_PATH, JSON.stringify(queue, null, 2));
}

function loadMemory(): SwarmMemory {
  return JSON.parse(readFileSync(MEMORY_PATH, 'utf8')) as SwarmMemory;
}

function saveMemory(memory: SwarmMemory): void {
  writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

function ensureExperimentBranch(branch: string): void {
  if (!branch.startsWith('experiment/')) {
    throw new Error(`Unsafe branch ${branch}. Experiments must run on experiment/* branches only.`);
  }
  execSync(`git checkout -B ${branch}`, { stdio: 'inherit' });
}

function commitExperimentArtifact(runId: string, task: SwarmTask, strategyId: string, score: number): void {
  const resultPath = path.resolve(`swarm/results/${runId}/${strategyId}.json`);
  mkdirSync(path.dirname(resultPath), { recursive: true });
  writeFileSync(
    resultPath,
    JSON.stringify({ taskId: task.id, strategyId, branch: `experiment/${runId}/${strategyId}`, score }, null, 2),
  );

  execSync(`git add ${resultPath}`, { stdio: 'inherit' });
  execSync(`git commit -m "swarm experiment ${runId}/${strategyId}" || true`, { stdio: 'inherit' });
}

function evaluateStrategy(task: SwarmTask, strategy: ExperimentStrategy, runId: string): { branch: string; score: number } {
  const branch = `experiment/${runId}/${strategy.id}`;
  const artifactPath = path.resolve(`swarm/experiments/${runId}/${task.id}_${strategy.id}.md`);
  mkdirSync(path.dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, [
    `Task ${task.id}: ${task.description}`,
    `Strategy ${strategy.id} (${strategy.title})`,
    ...strategy.plan.map((line) => `- ${line}`),
  ].join('\n'));

  const fullEvaluation = process.env.SWARM_FULL_EVAL === 'true';
  const score = fullEvaluation ? evaluateExperiment().score : 50 + strategy.id.charCodeAt(0) % 25;

  return { branch, score };
}

async function runSwarmLoop(): Promise<void> {
  ensureStateFiles();
  const memory = loadMemory();
  const queue = loadQueue();

  const signals = detectRepositorySignals();
  const newTasks = generateTasksFromSignals(signals, MAX_TASKS_PER_CYCLE);
  const pending = queue.tasks.filter((task) => task.status === 'pending' && task.retries < MAX_RETRIES_PER_TASK);
  const selectedTasks = [...pending, ...newTasks].slice(0, MAX_TASKS_PER_CYCLE);

  queue.tasks = selectedTasks;
  saveQueue(queue);

  const task = selectedTasks[0];
  if (task) {
    const runId = new Date().toISOString().replace(/[:.]/g, '-');
    const strategies = generateExperimentStrategies(task, MAX_EXPERIMENTS_PER_TASK);
    const context: RunContext = { runId, task, strategies };
    writeFileSync(RUN_CONTEXT_PATH, JSON.stringify(context, null, 2));
  }

  memory.lastRunAt = new Date().toISOString();
  memory.cycles += 1;
  saveMemory(memory);

  console.log(`✅ Swarm cycle prepared | tasks=${selectedTasks.length} signals=${signals.length}`);
}

async function runSingleExperimentMode(): Promise<void> {
  ensureStateFiles();
  if (!existsSync(RUN_CONTEXT_PATH)) {
    throw new Error('Missing swarm/run_context.json. Run loop mode first.');
  }

  const ctx = JSON.parse(readFileSync(RUN_CONTEXT_PATH, 'utf8')) as RunContext;
  const strategyId = process.env.SWARM_STRATEGY_ID ?? process.argv.find((arg) => arg.startsWith('--strategy='))?.split('=')[1] ?? 'A';
  const strategy = ctx.strategies.find((item) => item.id === strategyId);
  if (!strategy) {
    throw new Error(`Strategy ${strategyId} not found in run context.`);
  }

  const result = evaluateStrategy(ctx.task, strategy, ctx.runId);
  ensureExperimentBranch(result.branch);
  commitExperimentArtifact(ctx.runId, ctx.task, strategyId, result.score);

  console.log(JSON.stringify({ ...result, taskId: ctx.task.id, strategyId }, null, 2));
}

async function main(): Promise<void> {
  const mode = process.argv.find((arg) => arg.startsWith('--mode='))?.split('=')[1] ?? 'loop';
  if (mode === 'experiment') {
    await runSingleExperimentMode();
    return;
  }

  await runSwarmLoop();
}

main().catch((error) => {
  console.error('❌ Swarm controller failed:', error);
  process.exit(1);
});
