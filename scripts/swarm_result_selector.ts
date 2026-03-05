import { execSync } from 'node:child_process';

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
  if (dryRun) {
    console.log(`🧪 [dry-run] Would merge ${best.branch} with score ${best.score}`);
    return;
  }

  execSync(`git checkout ${best.branch}`, { stdio: 'inherit' });
  execSync('git checkout main', { stdio: 'inherit' });
  execSync(`git merge --no-ff ${best.branch}`, { stdio: 'inherit' });
}

export function discardFailedBranches(results: ExperimentScore[], selectedBranch?: string): void {
  for (const result of results) {
    if (result.branch === selectedBranch) continue;
    console.log(`🗑️  Discard experiment branch ${result.branch}`);
  }
}
