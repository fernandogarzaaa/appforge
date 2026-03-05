import { spawnSync } from 'node:child_process';

interface AgentInput {
  task_id: string;
  description: string;
}

export function runAgent(input: AgentInput): { success: boolean; log: string } {
  const lintFix = spawnSync('npm', ['run', 'lint:fix'], { encoding: 'utf-8' });
  const typecheck = spawnSync('npm', ['run', 'typecheck'], { encoding: 'utf-8' });

  const success = (lintFix.status ?? 1) === 0 && (typecheck.status ?? 1) === 0;
  const log = `[${input.task_id}] ${input.description}\n${lintFix.stdout ?? ''}\n${typecheck.stdout ?? ''}`;

  return { success, log };
}
