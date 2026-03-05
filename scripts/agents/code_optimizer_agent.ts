import { spawnSync } from 'node:child_process';

interface AgentInput {
  task_id: string;
  description: string;
}

export function runAgent(input: AgentInput): { success: boolean; log: string } {
  const build = spawnSync('npm', ['run', 'build'], { encoding: 'utf-8' });
  const success = (build.status ?? 1) === 0;
  const log = `[${input.task_id}] ${input.description}\n${build.stdout ?? ''}${build.stderr ?? ''}`;
  return { success, log };
}
