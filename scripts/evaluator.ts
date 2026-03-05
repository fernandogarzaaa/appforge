import { execSync } from 'node:child_process';

export interface EvaluationResult {
  buildSuccess: boolean;
  testsPassed: boolean;
  benchmarkPassed: boolean;
  score: number;
  detail: string[];
}

function runCheck(command: string): { passed: boolean; output: string } {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { passed: true, output };
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string };
    return { passed: false, output: `${e.stdout ?? ''}\n${e.stderr ?? ''}` };
  }
}

export function evaluateExperiment(): EvaluationResult {
  const build = runCheck('npm run build -- --mode production');
  const tests = runCheck('npm run test -- --run');
  const benchmark = runCheck('node benchmark.py');

  let score = 0;
  if (build.passed) score += 40;
  if (tests.passed) score += 40;
  if (benchmark.passed) score += 20;

  return {
    buildSuccess: build.passed,
    testsPassed: tests.passed,
    benchmarkPassed: benchmark.passed,
    score,
    detail: [
      `build:${build.passed ? 'pass' : 'fail'}`,
      `tests:${tests.passed ? 'pass' : 'fail'}`,
      `benchmark:${benchmark.passed ? 'pass' : 'fail'}`,
    ],
  };
}
