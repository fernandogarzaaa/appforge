import type { SwarmTask } from '../swarm_task_generator';
import type { ExperimentStrategy } from '../swarm_experiment_generator';

export function proposeDependencyUpdate(task: SwarmTask, strategy: ExperimentStrategy): string[] {
  return [
    `Task ${task.id}: ${task.description}`,
    `Strategy ${strategy.id} (${strategy.title})`,
    'Proposed changes:',
    '- Upgrade outdated package ranges and refresh lockfile.',
    '- Re-run lint/tests to validate dependency migration safety.',
  ];
}
