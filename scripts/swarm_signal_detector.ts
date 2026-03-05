import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export type SignalType =
  | 'ci_failure'
  | 'failing_tests'
  | 'benchmark_regression'
  | 'outdated_dependencies'
  | 'missing_tests'
  | 'low_code_coverage';

export interface DetectedSignal {
  type: SignalType;
  severity: number;
  details: string;
}

function run(command: string, args: string[]): { code: number; stdout: string; stderr: string } {
  const result = spawnSync(command, args, { encoding: 'utf-8', timeout: 120000 });
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  };
}

function detectCiFailure(): DetectedSignal | null {
  const candidates = ['final_scan.txt', 'verification_results.txt', 'lint_output.json'];
  const failPattern = /(fail|error|panic|fatal)/i;

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const content = readFileSync(candidate, 'utf-8').slice(0, 5000);
    if (failPattern.test(content)) {
      return {
        type: 'ci_failure',
        severity: 1,
        details: `Detected failure markers in ${candidate}`
      };
    }
  }

  return null;
}

function detectFailingTests(): DetectedSignal | null {
  if (process.env.SWARM_SKIP_EXPENSIVE_SIGNALS !== 'false') {
    return null;
  }

  const result = run('npm', ['run', 'test', '--', '--passWithNoTests']);
  if (result.code !== 0) {
    return {
      type: 'failing_tests',
      severity: 1,
      details: 'Unit tests are failing.'
    };
  }

  return null;
}

function detectBenchmarkRegression(): DetectedSignal | null {
  const benchmarkPath = path.join('swarm', 'benchmark_results.json');
  if (!existsSync(benchmarkPath)) return null;

  try {
    const payload = JSON.parse(readFileSync(benchmarkPath, 'utf-8')) as Record<string, unknown>;
    const hasRegression =
      payload.regression === true || payload.performance_regression === true || payload.status === 'regression';

    if (hasRegression) {
      return {
        type: 'benchmark_regression',
        severity: 2,
        details: 'Benchmark file indicates a regression.'
      };
    }
  } catch {
    return {
      type: 'benchmark_regression',
      severity: 3,
      details: 'Benchmark metadata is unreadable.'
    };
  }

  return null;
}

function detectOutdatedDependencies(): DetectedSignal | null {
  if (process.env.SWARM_SKIP_EXPENSIVE_SIGNALS !== 'false') {
    return null;
  }

  const result = run('npm', ['outdated', '--json']);
  if (result.code === 0) return null;

  const trimmed = result.stdout.trim();
  if (!trimmed) return null;

  return {
    type: 'outdated_dependencies',
    severity: 2,
    details: 'Outdated dependencies detected via npm outdated.'
  };
}

function detectTestCoverageSignals(): DetectedSignal[] {
  const srcFiles = run('bash', ['-lc', "rg --files src --glob '*.ts' --glob '*.tsx' | wc -l"]);
  const testFiles = run('bash', ['-lc', "rg --files src tests --glob '*.{test,spec}.{ts,tsx,js,jsx}' | wc -l"]);

  const srcCount = Number.parseInt(srcFiles.stdout.trim(), 10) || 0;
  const testsCount = Number.parseInt(testFiles.stdout.trim(), 10) || 0;
  if (srcCount === 0) return [];

  const ratio = testsCount / srcCount;
  const signals: DetectedSignal[] = [];

  if (testsCount === 0) {
    signals.push({
      type: 'missing_tests',
      severity: 1,
      details: 'No test files detected for source tree.'
    });
  }

  if (ratio < 0.12) {
    signals.push({
      type: 'low_code_coverage',
      severity: 2,
      details: `Estimated test-to-source ratio is ${ratio.toFixed(2)}.`
    });
  }

  return signals;
}

export async function detectSwarmSignals(): Promise<DetectedSignal[]> {
  const signals: DetectedSignal[] = [];

  const ciFailure = detectCiFailure();
  if (ciFailure) signals.push(ciFailure);

  const failingTests = detectFailingTests();
  if (failingTests) signals.push(failingTests);

  const benchmarkRegression = detectBenchmarkRegression();
  if (benchmarkRegression) signals.push(benchmarkRegression);

  const outdatedDependencies = detectOutdatedDependencies();
  if (outdatedDependencies) signals.push(outdatedDependencies);

  signals.push(...detectTestCoverageSignals());

  return signals;
}
