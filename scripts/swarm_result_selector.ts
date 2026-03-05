import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface ExperimentResult {
  run_id: string;
  task_id?: string;
  strategy_id: string;
  branch?: string;
  success: boolean;
  skipped?: boolean;
  benchmark_score: number;
  checks: { lint: boolean; tests: boolean; benchmark: boolean; build: boolean };
}

interface SwarmTask {
  id: string;
  retries: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  failed_strategies?: string[];
  updated_at?: string;
}

function run(command: string): void {
  execSync(command, { stdio: 'pipe' });
}

function isCiRuntime(): boolean {
  return process.env.GITHUB_ACTIONS === 'true';
}

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf-8')) as T;
}

function persistTaskOutcome(results: ExperimentResult[], winner: ExperimentResult | null): void {
  const queuePath = path.join('swarm', 'task_queue.json');
  const memoryPath = path.join('swarm', 'swarm_memory.json');

  if (!existsSync(queuePath) || !existsSync(memoryPath) || results.length === 0) {
    return;
  }

  const queue = loadJson<{ tasks: SwarmTask[] }>(queuePath);
  const memory = loadJson<Record<string, any>>(memoryPath);
  const taskId = results.find((result) => !!result.task_id)?.task_id;
  if (!taskId) {
    return;
  }

  const target = queue.tasks.find((task) => task.id === taskId);
  if (!target) {
    return;
  }

  const failedStrategies = results.filter((result) => !result.success).map((result) => result.strategy_id);
  target.failed_strategies = Array.from(new Set([...(target.failed_strategies ?? []), ...failedStrategies]));
  target.updated_at = new Date().toISOString();

  if (winner) {
    target.status = 'completed';
    memory.completed_tasks = (memory.completed_tasks ?? 0) + 1;
  } else {
    target.retries = (target.retries ?? 0) + 1;
    target.status = target.retries >= 3 ? 'failed' : 'pending';
    memory.failed_tasks = (memory.failed_tasks ?? 0) + 1;
    memory.failed_strategy_attempts = memory.failed_strategy_attempts ?? {};
    for (const strategyId of failedStrategies) {
      memory.failed_strategy_attempts[strategyId] = (memory.failed_strategy_attempts[strategyId] ?? 0) + 1;
    }
  }

  writeFileSync(queuePath, JSON.stringify(queue, null, 2));
  writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
}

function commitMemory(message: string): void {
  run('git add swarm/swarm_memory.json swarm/task_queue.json');
  try {
    run(`git commit -m "${message}"`);
  } catch {
    // no memory deltas
  }
}

function main(): void {
  const resultDir = process.argv[2] ?? path.join('swarm', 'experiment_results');
  if (!existsSync(resultDir)) {
    console.log('No experiment result directory found.');
    return;
  }

  const files = readdirSync(resultDir).filter((file) => file.endsWith('.json') && file !== 'no_task.json');
  const results: ExperimentResult[] = files.map((file) => loadJson<ExperimentResult>(path.join(resultDir, file)));

  if (results.length === 0) {
    console.log('No experiment results found.');
    return;
  }

  const successful = results
    .filter((result) => result.success)
    .filter((result) => result.checks.tests && result.checks.benchmark && result.checks.build && result.checks.lint)
    .sort((a, b) => b.benchmark_score - a.benchmark_score);

  run('git fetch --all --prune');

  if (successful.length === 0) {
    persistTaskOutcome(results, null);
    commitMemory('swarm: record failed experiment cycle');

    if (isCiRuntime()) {
      run('git push origin main');
      for (const result of results) {
        if (!result.branch) {
          continue;
        }
        try {
          run(`git push origin --delete ${result.branch}`);
        } catch {
          // ignore branch deletion failures
        }
      }
    }

    console.log('No successful experiments to merge. Task marked for retry/failure.');
    return;
  }

  const winner = successful[0];
  if (!winner.branch) {
    throw new Error('Winning experiment is missing branch metadata.');
  }

  const losers = results.filter((result) => result.branch && result.branch !== winner.branch);

  run('git checkout main');
  run(`git merge --no-ff origin/${winner.branch} -m "swarm: merge winning experiment ${winner.strategy_id}"`);

  persistTaskOutcome(results, winner);
  commitMemory('swarm: persist memory after experiment selection');

  if (isCiRuntime()) {
    run('git push origin main');
    for (const loser of losers) {
      try {
        run(`git push origin --delete ${loser.branch}`);
      } catch {
        // ignore missing remote branches
      }
    }
  }
}

main();
