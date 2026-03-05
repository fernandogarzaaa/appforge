import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface ExperimentScore {
  branch: string;
  score: number;
  taskId: string;
  strategyId: string;
}

export function selectBestResult(results: ExperimentScore[]): ExperimentScore | null {
  if (!results.length) return null;
  return results.slice().sort((a, b) => b.score - a.score)[0];
}

export function mergeBestResult(best: ExperimentScore, dryRun = true): void {
  if (!best.branch.startsWith('experiment/')) {
    throw new Error(`Unsafe merge source: ${best.branch}`);
  }

  if (dryRun) {
    console.log(`🧪 [dry-run] Would merge ${best.branch} into main with score ${best.score}`);
    return;
  }

  execSync('git checkout main', { stdio: 'inherit' });
  execSync(`git merge --no-ff ${best.branch}`, { stdio: 'inherit' });
}

export function discardFailedBranches(results: ExperimentScore[], selectedBranch?: string): void {
  for (const result of results) {
    if (result.branch === selectedBranch) continue;
    console.log(`🗑️  Discard experiment branch ${result.branch}`);
  }
}

function loadRunResults(runId: string): ExperimentScore[] {
  const dir = path.resolve(`swarm/results/${runId}`);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as ExperimentScore);
}

async function main(): Promise<void> {
  const runContextPath = path.resolve('swarm/run_context.json');
  if (!existsSync(runContextPath)) {
    throw new Error('Missing swarm/run_context.json for result selection.');
  }

  const runContext = JSON.parse(readFileSync(runContextPath, 'utf8')) as { runId: string };
  const results = loadRunResults(runContext.runId);
  const best = selectBestResult(results);
  if (!best) {
    console.log('No experiment results found.');
    return;
  }

  mergeBestResult(best, process.env.SWARM_ALLOW_MAIN_MERGE !== 'true');
  discardFailedBranches(results, best.branch);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Result selector failed:', error);
    process.exit(1);
  });
}
