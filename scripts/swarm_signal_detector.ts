import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export type SignalType =
  | 'ci_failure'
  | 'failing_tests'
  | 'benchmark_regression'
  | 'outdated_dependencies'
  | 'missing_tests'
  | 'low_coverage';

export interface RepositorySignal {
  type: SignalType;
  severity: number;
  detail: string;
  source: string;
}

const COVERAGE_THRESHOLD = 80;

function safeExec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    return (error as { stdout?: string }).stdout ?? '';
  }
}

function detectCiFailure(): RepositorySignal[] {
  const ciStatusPath = path.resolve('.swarm/last_ci_status.json');
  if (!existsSync(ciStatusPath)) return [];

  const payload = JSON.parse(readFileSync(ciStatusPath, 'utf8')) as { status?: string; reason?: string };
  if (payload.status === 'failed') {
    return [
      {
        type: 'ci_failure',
        severity: 1,
        detail: payload.reason ?? 'Previous CI run reported failure.',
        source: '.swarm/last_ci_status.json',
      },
    ];
  }

  return [];
}

function detectFailingTests(): RepositorySignal[] {
  const failLogCandidates = ['local_test_fail.txt', 'final_test_output.txt', 'build_log.txt'];
  for (const filePath of failLogCandidates) {
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, 'utf8');
    if (/\b(fail(?:ed|ure)?|error)\b/i.test(content)) {
      return [
        {
          type: 'failing_tests',
          severity: 1,
          detail: `Potential failures detected in ${filePath}.`,
          source: filePath,
        },
      ];
    }
  }

  return [];
}

function detectBenchmarkRegression(): RepositorySignal[] {
  const baselinePath = path.resolve('swarm/benchmark_baseline.json');
  const latestPath = path.resolve('swarm/benchmark_latest.json');
  if (!existsSync(baselinePath) || !existsSync(latestPath)) return [];

  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as { score?: number };
  const latest = JSON.parse(readFileSync(latestPath, 'utf8')) as { score?: number };
  if (typeof baseline.score === 'number' && typeof latest.score === 'number' && latest.score < baseline.score) {
    return [
      {
        type: 'benchmark_regression',
        severity: 2,
        detail: `Benchmark dropped from ${baseline.score} to ${latest.score}.`,
        source: 'swarm/benchmark_latest.json',
      },
    ];
  }

  return [];
}

function detectOutdatedDependencies(): RepositorySignal[] {
  const output = safeExec('npm outdated --json');
  if (!output.trim()) return [];

  try {
    const parsed = JSON.parse(output) as Record<string, unknown>;
    const total = Object.keys(parsed).length;
    if (total > 0) {
      return [
        {
          type: 'outdated_dependencies',
          severity: total > 10 ? 2 : 3,
          detail: `${total} dependencies are outdated.`,
          source: 'npm outdated --json',
        },
      ];
    }
  } catch {
    return [];
  }

  return [];
}

function detectLowCoverage(): RepositorySignal[] {
  const coverageSummaryPath = path.resolve('coverage/coverage-summary.json');
  if (!existsSync(coverageSummaryPath)) return [];

  const summary = JSON.parse(readFileSync(coverageSummaryPath, 'utf8')) as {
    total?: { lines?: { pct?: number } };
  };
  const pct = summary.total?.lines?.pct;
  if (typeof pct === 'number' && pct < COVERAGE_THRESHOLD) {
    return [
      {
        type: 'low_coverage',
        severity: 2,
        detail: `Coverage ${pct}% is below ${COVERAGE_THRESHOLD}%.`,
        source: coverageSummaryPath,
      },
    ];
  }

  return [];
}

function detectMissingTests(): RepositorySignal[] {
  const sourceFiles = safeExec("rg --files src functions | wc -l").trim();
  const testFiles = safeExec("rg --files tests | wc -l").trim();
  const sourceCount = Number(sourceFiles || 0);
  const testCount = Number(testFiles || 0);

  if (sourceCount === 0) return [];

  const ratio = testCount / sourceCount;
  if (ratio < 0.2) {
    return [
      {
        type: 'missing_tests',
        severity: 2,
        detail: `Test-to-source ratio (${ratio.toFixed(2)}) appears low.`,
        source: 'rg --files src functions / tests',
      },
    ];
  }

  return [];
}

export function detectRepositorySignals(): RepositorySignal[] {
  return [
    ...detectCiFailure(),
    ...detectFailingTests(),
    ...detectBenchmarkRegression(),
    ...detectOutdatedDependencies(),
    ...detectMissingTests(),
    ...detectLowCoverage(),
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const signals = detectRepositorySignals();
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), signals }, null, 2));
}
