import type { DetectedSignal, SignalType } from './swarm_signal_detector.ts';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface SwarmTask {
  id: string;
  signal: SignalType;
  description: string;
  priority: number;
  retries: number;
  status: TaskStatus;
  failed_strategies: string[];
  created_at: string;
  updated_at: string;
}

const TASK_MAP: Record<SignalType, { description: string; priority: number }> = {
  ci_failure: { description: 'repair CI pipeline', priority: 1 },
  failing_tests: { description: 'fix failing tests', priority: 1 },
  benchmark_regression: { description: 'optimize performance', priority: 2 },
  outdated_dependencies: { description: 'update dependencies', priority: 2 },
  missing_tests: { description: 'add missing tests', priority: 3 },
  low_code_coverage: { description: 'improve code coverage', priority: 3 }
};

export function generateTasksFromSignals(signals: DetectedSignal[], maxTasks = 5): SwarmTask[] {
  const now = new Date().toISOString();

  return signals.slice(0, maxTasks).map((signal, index) => {
    const mapped = TASK_MAP[signal.type];
    return {
      id: `task_${Date.now()}_${index + 1}`,
      signal: signal.type,
      description: mapped.description,
      priority: Math.min(mapped.priority, signal.severity),
      retries: 0,
      status: 'pending',
      failed_strategies: [],
      created_at: now,
      updated_at: now
    };
  });
}
