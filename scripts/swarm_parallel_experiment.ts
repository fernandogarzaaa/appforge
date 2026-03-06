import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { executeTask } from './swarm_task_executor.ts';

interface StrategyContext {
  id: string;
  strategy: string;
}

interface RunContext {
  run_id: string;
  has_task: boolean;
  task?: any;
  strategies: StrategyContext[];
}

interface ExperimentResult {
  run_id: string;
  task_id?: string;
  strategy_id: string;
  strategy?: string;
  branch?: string;
  success: boolean;
  skipped?: boolean;
  checks: {
    execution: boolean;
    lint_fix: boolean;
    typecheck: boolean;
    lint: boolean;
    tests: boolean;
    benchmark: boolean;
    build: boolean;
  };
  benchmark_score: number;
  execution_log: string;
  typecheck_mode?: 'delta' | 'full' | 'skipped';
}

const contextPath = path.join('swarm', 'run_context.json');
const resultsDir = path.join('swarm', 'experiment_results');
const strategyId = process.env.SWARM_STRATEGY_ID ?? process.argv[2] ?? '';

function run(command: string): { ok: boolean; output: string } {
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    return { ok: true, output };
  } catch (error) {
    const output = error instanceof Error ? error.message : String(error);
    return { ok: false, output };
  }
}

function cleanupTransientSwarmArtifacts(): void {
  const transientFiles = [path.join('swarm', 'run_context.json')];

  for (const file of transientFiles) {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  }
}

function main(): void {
  if (!existsSync(contextPath)) {
    throw new Error('swarm/run_context.json is missing. Run swarm_controller first.');
  }

  const context = JSON.parse(readFileSync(contextPath, 'utf-8')) as RunContext;
  mkdirSync(resultsDir, { recursive: true });

  if (!context.has_task || !context.task) {
    writeFileSync(path.join(resultsDir, 'no_task.json'), JSON.stringify({ status: 'idle' }, null, 2));
    return;
  }

  const strategy = context.strategies.find((entry) => entry.id === strategyId);
  if (!strategy) {
    const skipped: ExperimentResult = {
      run_id: context.run_id,
      strategy_id: strategyId || 'unknown',
      success: false,
      skipped: true,
      checks: {
        execution: false,
        lint_fix: false,
        typecheck: false,
        lint: false,
        tests: false,
        benchmark: false,
        build: false
      },
      benchmark_score: 0,
      execution_log: 'Strategy not selected for this run context.'
    };
    writeFileSync(path.join(resultsDir, `${strategyId || 'unknown'}.json`), JSON.stringify(skipped, null, 2));
    return;
  }

  const branch = `experiment/${context.run_id}/${strategy.id}`;
  run('git fetch origin main');
  run('git checkout main');
  run('git reset --hard origin/main');
  run(`git checkout -B ${branch}`);

  const execution = executeTask(context.task);
  const lint = run('npm run lint');
  const tests = run('npm run test -- --run');
  const benchmark = run('npm run swarm:benchmark');
  const build = run('npm run build');

  const benchmarkMatch = benchmark.output.match(/(?:score|benchmark(?:_score)?)\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i);
  const benchmarkScore = benchmarkMatch ? Number(benchmarkMatch[1]) : (benchmark.ok ? 1 : 0);

  const success = execution.success && lint.ok && tests.ok && benchmark.ok && build.ok;

  if (success) {
    cleanupTransientSwarmArtifacts();
    run('git add -A');
    run(`git commit -m "swarm(experiment): ${context.task.id} strategy ${strategy.id}"`);
    if (process.env.GITHUB_ACTIONS === 'true') {
      run(`git push origin ${branch}`);
    }
  }

  const result: ExperimentResult = {
    run_id: context.run_id,
    task_id: context.task.id,
    strategy_id: strategy.id,
    strategy: strategy.strategy,
    branch,
    success,
    checks: {
      execution: execution.success,
      lint_fix: execution.checks?.lint_fix ?? false,
      typecheck: execution.checks?.typecheck ?? false,
      lint: lint.ok,
      tests: tests.ok,
      benchmark: benchmark.ok,
      build: build.ok
    },
    benchmark_score: benchmarkScore,
    execution_log: execution.log,
    typecheck_mode: execution.typecheck_mode
  };

  writeFileSync(path.join(resultsDir, `${strategy.id}.json`), JSON.stringify(result, null, 2));
}

main();
