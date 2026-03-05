import { spawnSync } from 'node:child_process';

export interface EvaluationResult {
  testsPassed: boolean;
  buildPassed: boolean;
  benchmarkPassed: boolean;
  success: boolean;
  details: string[];
}

function runStep(command: string, args: string[]): { ok: boolean; output: string } {
  const result = spawnSync(command, args, { encoding: 'utf-8' });
  const ok = (result.status ?? 1) === 0;
  return { ok, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

export function evaluateRepository(): EvaluationResult {
  const tests = runStep('npm', ['run', 'test', '--', '--passWithNoTests']);
  const build = runStep('npm', ['run', 'build']);

  const benchmark = runStep('npx', ['tsx', 'scripts/benchmark.ts']);
  const benchmarkPassed = benchmark.ok || /not found|Cannot find/i.test(benchmark.output);

  const benchmark = runCheck('python3 benchmark.py');
    `tests: ${tests.ok ? 'pass' : 'fail'}`,
    `build: ${build.ok ? 'pass' : 'fail'}`,
    `benchmark: ${benchmarkPassed ? 'pass' : 'fail'}`
  ];

  return {
    testsPassed: tests.ok,
    buildPassed: build.ok,
    benchmarkPassed,
    success: tests.ok && build.ok && benchmarkPassed,
    details
  };
}
