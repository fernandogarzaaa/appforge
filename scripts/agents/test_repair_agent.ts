import { spawnSync } from 'node:child_process';

interface AgentInput {
  task_id: string;
  description: string;
}

export function runAgent(input: AgentInput): { success: boolean; log: string } {
  const run = spawnSync('npm', ['run', 'test', '--', '--passWithNoTests'], { encoding: 'utf-8' });
  const success = (run.status ?? 1) === 0;
  const log = `[${input.task_id}] ${input.description}\n${run.stdout ?? ''}${run.stderr ?? ''}`;
  return { success, log };
}
