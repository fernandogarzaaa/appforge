import { runAgent as runCiRepairAgent } from './agents/ci_repair_agent.ts';
import { runAgent as runTestRepairAgent } from './agents/test_repair_agent.ts';
import { runAgent as runDependencyAgent } from './agents/dependency_update_agent.ts';
import { runAgent as runOptimizerAgent } from './agents/code_optimizer_agent.ts';
import type { SwarmTask } from './swarm_task_generator.ts';

export interface TaskExecutionResult {
  task: SwarmTask;
  success: boolean;
  log: string;
}

export function selectNextTask(tasks: SwarmTask[]): SwarmTask | null {
  const pending = tasks
    .filter((task) => task.status === 'pending' && task.retries < 3)
    .sort((a, b) => a.priority - b.priority || a.created_at.localeCompare(b.created_at));

  return pending[0] ?? null;
}

export function executeTask(task: SwarmTask): TaskExecutionResult {
  const input = { task_id: task.id, description: task.description };

  if (task.description.includes('CI')) {
    const result = runCiRepairAgent(input);
    return { task, ...result };
  }

  if (task.description.includes('tests') || task.description.includes('coverage')) {
    const result = runTestRepairAgent(input);
    return { task, ...result };
  }

  if (task.description.includes('dependencies')) {
    const result = runDependencyAgent(input);
    return { task, ...result };
  }

  const result = runOptimizerAgent(input);
  return { task, ...result };
}
