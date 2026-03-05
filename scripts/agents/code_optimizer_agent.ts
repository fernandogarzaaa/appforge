import type { SwarmTask } from '../swarm_task_generator';
import type { ExperimentStrategy } from '../swarm_experiment_generator';

export function proposeCodeOptimization(task: SwarmTask, strategy: ExperimentStrategy): string[] {
  return [
    `Task ${task.id}: ${task.description}`,
    `Strategy ${strategy.id} (${strategy.title})`,
    'Proposed changes:',
    '- Profile and optimize expensive paths.',
    '- Reduce bundle/runtime overhead using caching or algorithmic improvements.',
  ];
}
