import type { SwarmTask } from './swarm_task_generator.ts';

export interface ExperimentStrategy {
  id: string;
  strategy: string;
  prompt: string;
}

const DEFAULT_STRATEGIES: ExperimentStrategy[] = [
  { id: 'A', strategy: 'minimal_fix', prompt: 'Apply the smallest safe fix that resolves the task.' },
  { id: 'B', strategy: 'test_first', prompt: 'Prioritize improving tests before code changes.' },
  { id: 'C', strategy: 'performance_tuned', prompt: 'Prioritize stable performance and benchmark safety.' },
  { id: 'D', strategy: 'refactor_hardened', prompt: 'Refactor for maintainability while preserving behavior.' }
];

export function generateExperimentStrategies(task: SwarmTask, maxExperiments = 4): ExperimentStrategy[] {
  const excluded = new Set(task.failed_strategies ?? []);
  return DEFAULT_STRATEGIES
    .filter((candidate) => !excluded.has(candidate.id))
    .slice(0, Math.max(1, Math.min(maxExperiments, 4)));
}
