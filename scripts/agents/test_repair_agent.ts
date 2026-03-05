import type { SwarmTask } from '../swarm_task_generator';
import type { ExperimentStrategy } from '../swarm_experiment_generator';

export function proposeTestRepair(task: SwarmTask, strategy: ExperimentStrategy): string[] {
  return [
    `Task ${task.id}: ${task.description}`,
    `Strategy ${strategy.id} (${strategy.title})`,
    'Proposed changes:',
    '- Isolate flaky tests and remove shared state.',
    '- Update assertions and fixtures for deterministic behavior.',
  ];
}
