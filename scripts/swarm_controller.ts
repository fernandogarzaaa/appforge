import { execSync } from 'node:child_process';

type SwarmOperation = 'autonomous' | 'evolution' | 'qa';

function runCommand(command: string): void {
  console.log(`\n▶ ${command}`);
  execSync(command, { stdio: 'inherit' });
}

export function runAutonomousSwarm(): void {
  runCommand('npx tsx scripts/autonomous_ci_healer.ts');
}

export function runEvolution(): void {
  runCommand('npx tsx scripts/verify_evolution.ts');
}

export function runQA(): void {
  runCommand('npx tsx scripts/run_qa_swarm.ts');
}

function pickOperation(now: Date): SwarmOperation {
  const slot = Math.floor(now.getUTCMinutes() / 20) % 3;
  if (slot === 0) return 'autonomous';
  if (slot === 1) return 'evolution';
  return 'qa';
}

async function main(): Promise<void> {
  const now = new Date();
  const selectedOperation = pickOperation(now);
  console.log(`🌀 Swarm loop controller tick: ${now.toISOString()} | operation=${selectedOperation}`);

  if (selectedOperation === 'autonomous') {
    runAutonomousSwarm();
    return;
  }

  if (selectedOperation === 'evolution') {
    runEvolution();
    return;
  }

  runQA();
}

main().catch((error) => {
  console.error('❌ Swarm controller failed:', error);
  process.exit(1);
});
