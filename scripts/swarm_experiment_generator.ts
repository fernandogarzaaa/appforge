import type { SwarmTask } from './swarm_task_generator';

export interface ExperimentStrategy {
  id: string;
  title: string;
  plan: string[];
}

const STRATEGY_BANK: Record<SwarmTask['signalType'], ExperimentStrategy[]> = {
  ci_failure: [
    { id: 'A', title: 'Normalize Node runtime', plan: ['pin Node LTS', 'sync toolchain versions'] },
    { id: 'B', title: 'Fix workflow triggers', plan: ['adjust trigger paths', 'reduce noisy runs'] },
    { id: 'C', title: 'Repair CI cache', plan: ['scope npm cache key', 'invalidate stale lock hash'] },
    { id: 'D', title: 'Stabilize dependencies', plan: ['refresh lockfile', 'patch insecure package ranges'] },
  ],
  failing_tests: [
    { id: 'A', title: 'Fix deterministic flakes', plan: ['seed randomness', 'stabilize async waits'] },
    { id: 'B', title: 'Repair assertions', plan: ['update brittle snapshots', 'align expected outputs'] },
    { id: 'C', title: 'Harden fixtures', plan: ['create isolated fixtures', 'remove shared state'] },
    { id: 'D', title: 'Refactor flaky module', plan: ['target failing module', 'reduce timing coupling'] },
  ],
  benchmark_regression: [
    { id: 'A', title: 'Algorithmic optimization', plan: ['profile hotspots', 'apply lower-complexity path'] },
    { id: 'B', title: 'Caching optimization', plan: ['memoize expensive calls', 'add invalidation guards'] },
    { id: 'C', title: 'Bundling optimization', plan: ['tree-shake dead code', 'split heavy chunks'] },
    { id: 'D', title: 'Concurrency tuning', plan: ['parallelize safe jobs', 'remove blocking steps'] },
  ],
  outdated_dependencies: [
    { id: 'A', title: 'Minor and patch updates', plan: ['upgrade non-breaking ranges', 'run smoke checks'] },
    { id: 'B', title: 'Security-first upgrade', plan: ['target vulnerable packages', 'validate advisories fixed'] },
    { id: 'C', title: 'Toolchain alignment', plan: ['align ts/eslint toolchain', 'rebuild lockfile'] },
    { id: 'D', title: 'Runtime update', plan: ['update runtime libs', 'validate app boot'] },
  ],
  missing_tests: [
    { id: 'A', title: 'Critical path tests', plan: ['add tests for high-risk paths', 'assert error handling'] },
    { id: 'B', title: 'Regression suite', plan: ['encode recent bugs into tests', 'add guards'] },
    { id: 'C', title: 'API behavior tests', plan: ['cover endpoints', 'validate contracts'] },
    { id: 'D', title: 'Integration coverage', plan: ['cover module interactions', 'verify side effects'] },
  ],
  low_coverage: [
    { id: 'A', title: 'Line coverage boost', plan: ['target uncovered files', 'add unit tests'] },
    { id: 'B', title: 'Branch coverage boost', plan: ['cover conditionals', 'exercise fallbacks'] },
    { id: 'C', title: 'Mutation-resistance tests', plan: ['add assertion depth', 'cover edge-case behavior'] },
    { id: 'D', title: 'E2E confidence path', plan: ['add smoke e2e route', 'validate journey'] },
  ],
};

export function generateExperimentStrategies(task: SwarmTask, maxExperiments = 4): ExperimentStrategy[] {
  return (STRATEGY_BANK[task.signalType] ?? []).slice(0, maxExperiments);
}
