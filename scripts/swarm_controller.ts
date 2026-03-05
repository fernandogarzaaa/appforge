import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { detectRepositorySignals } from './swarm_signal_detector';
import { generateTasksFromSignals, type SwarmTask } from './swarm_task_generator';
import { generateExperimentStrategies, type ExperimentStrategy } from './swarm_experiment_generator';
import { evaluateExperiment } from './evaluator';
import { discardFailedBranches, mergeBestResult, selectBestResult, type ExperimentScore } from './swarm_result_selector';
import { proposeCiRepair } from './agents/ci_repair_agent';
import { proposeTestRepair } from './agents/test_repair_agent';
import { proposeDependencyUpdate } from './agents/dependency_update_agent';
import { proposeCodeOptimization } from './agents/code_optimizer_agent';

interface TaskQueueFile {
  tasks: SwarmTask[];
}

interface SwarmMemory {
  lastRunAt: string;
  cycles: number;
  completedTasks: number;
  experiments: Array<{ taskId: string; strategyId: string; branch: string; score: number }>;
}

const MAX_TASKS_PER_CYCLE = 5;
const MAX_EXPERIMENTS_PER_TASK = 4;
const MAX_RETRIES_PER_TASK = 3;
const TASK_QUEUE_PATH = path.resolve('swarm/task_queue.json');
const MEMORY_PATH = path.resolve('swarm/swarm_memory.json');

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

function planAgentChanges(task: SwarmTask, strategy: ExperimentStrategy): string[] {
  if (task.signalType === 'ci_failure') return proposeCiRepair(task, strategy);
  if (task.signalType === 'failing_tests' || task.signalType === 'missing_tests' || task.signalType === 'low_coverage') {
    return proposeTestRepair(task, strategy);
  }
  if (task.signalType === 'outdated_dependencies') return proposeDependencyUpdate(task, strategy);
  return proposeCodeOptimization(task, strategy);
}

function evaluateStrategy(task: SwarmTask, strategy: ExperimentStrategy, runId: string): ExperimentScore {
  const branch = `experiment/${runId}/${strategy.id}`;
  const plan = planAgentChanges(task, strategy);
  const artifactPath = path.resolve(`swarm/experiments/${runId}/${task.id}_${strategy.id}.md`);
  mkdirSync(path.dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, plan.join('\n'));

  const fullEvaluation = process.env.SWARM_FULL_EVAL === 'true';
  const score = fullEvaluation ? evaluateExperiment().score : 50 + strategy.id.charCodeAt(0) % 25;

  return {
    branch,
    score,
    taskId: task.id,
    strategyId: strategy.id,
  };
}

async function runTaskExperiments(task: SwarmTask, runId: string): Promise<ExperimentScore[]> {
  const strategies = generateExperimentStrategies(task, MAX_EXPERIMENTS_PER_TASK);
  const jobs = strategies.map(async (strategy) => evaluateStrategy(task, strategy, runId));
  return Promise.all(jobs);
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

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const allResults: ExperimentScore[] = [];

  for (const task of selectedTasks) {
    task.status = 'running';
    const experimentResults = await runTaskExperiments(task, runId);
    const best = selectBestResult(experimentResults);

    if (best) {
      mergeBestResult(best, true);
      discardFailedBranches(experimentResults, best.branch);
      task.status = 'completed';
      memory.completedTasks += 1;
      allResults.push(...experimentResults);
    } else {
      task.status = 'failed';
      task.retries += 1;
    }
  }

  memory.lastRunAt = new Date().toISOString();
  memory.cycles += 1;
  memory.experiments.push(...allResults);
  saveMemory(memory);
  saveQueue(queue);

  console.log(`✅ Swarm cycle complete | tasks=${selectedTasks.length} signals=${signals.length}`);
}

async function runSingleExperimentMode(): Promise<void> {
  ensureStateFiles();
  const strategyId = process.env.SWARM_STRATEGY_ID ?? process.argv.find((arg) => arg.startsWith('--strategy='))?.split('=')[1] ?? 'A';
  const task: SwarmTask = {
    id: 'task_matrix',
    description: 'matrix experiment execution',
    priority: 1,
    status: 'running',
    signalType: 'ci_failure',
    retries: 0,
    createdAt: new Date().toISOString(),
  };
  const strategy: ExperimentStrategy = {
    id: strategyId,
    title: `Matrix strategy ${strategyId}`,
    plan: ['Run isolated strategy experiment in workflow matrix'],
  };

  const result = evaluateStrategy(task, strategy, process.env.GITHUB_RUN_ID ?? 'local');
  console.log(JSON.stringify(result, null, 2));
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
