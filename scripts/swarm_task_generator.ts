import { randomUUID } from 'node:crypto';
import type { RepositorySignal } from './swarm_signal_detector';

export interface SwarmTask {
  id: string;
  description: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  signalType: RepositorySignal['type'];
  retries: number;
  createdAt: string;
}

const TASK_MAP: Record<RepositorySignal['type'], { description: string; priority: number }> = {
  ci_failure: { description: 'repair CI pipeline', priority: 1 },
  failing_tests: { description: 'fix failing tests', priority: 1 },
  benchmark_regression: { description: 'optimize performance regression', priority: 2 },
  outdated_dependencies: { description: 'update dependencies', priority: 3 },
  missing_tests: { description: 'add missing automated tests', priority: 2 },
  low_coverage: { description: 'raise test coverage', priority: 2 },
};

export function generateTasksFromSignals(signals: RepositorySignal[], maxTasks = 5): SwarmTask[] {
  return signals
    .slice()
    .sort((a, b) => a.severity - b.severity)
    .slice(0, maxTasks)
    .map((signal) => {
      const taskTemplate = TASK_MAP[signal.type];
      return {
        id: `task_${randomUUID().slice(0, 8)}`,
        description: `${taskTemplate.description} (${signal.detail})`,
        priority: taskTemplate.priority,
        status: 'pending',
        signalType: signal.type,
        retries: 0,
        createdAt: new Date().toISOString(),
      } satisfies SwarmTask;
    });
}
