import { spawnSync } from 'node:child_process';

interface AgentInput {
  task_id: string;
  description: string;
}

export function runAgent(input: AgentInput): { success: boolean; log: string } {
  const update = spawnSync('npm', ['update', '--package-lock-only'], { encoding: 'utf-8' });
  const auditFix = spawnSync('npm', ['audit', 'fix', '--package-lock-only'], { encoding: 'utf-8' });

  const success = (update.status ?? 1) === 0;
  const log = `[${input.task_id}] ${input.description}\n${update.stdout ?? ''}\n${auditFix.stdout ?? ''}`;
  return { success, log };
}
