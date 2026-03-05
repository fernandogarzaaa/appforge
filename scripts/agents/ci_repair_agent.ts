import type { SwarmTask } from '../swarm_task_generator';
import type { ExperimentStrategy } from '../swarm_experiment_generator';

export function proposeCiRepair(task: SwarmTask, strategy: ExperimentStrategy): string[] {
  return [
    `Task ${task.id}: ${task.description}`,
    `Strategy ${strategy.id} (${strategy.title})`,
    'Proposed changes:',
    '- Update GitHub Actions Node setup to LTS and deterministic cache keys.',
    '- Harden workflow triggers and reduce redundant executions.',
  ];
}
