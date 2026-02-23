import type { BenchmarkName, BenchmarkRunResult } from './benchmarkHarness.js';

export interface EvolutionScore {
  finalScore: number;
  weightedBenchmarkScore: number;
  efficiencyScore: number;
  stabilityScore: number;
  benchmarkAggregate: Record<BenchmarkName, number>;
  runtimeMs: number;
  memoryUsageMb: number;
}

export interface EvolutionScoreInput {
  benchmark: BenchmarkRunResult;
  mutationRisk: number;
  baselineRuntimeMs?: number;
  baselineMemoryUsageMb?: number;
}

export interface EvolutionBaseline {
  finalScore: number;
  benchmarkAggregate: Record<BenchmarkName, number>;
}

export interface ScoreGateConfig {
  regressionTolerance: number;
  minRelativeDelta: number;
}

export interface ScoreComparison {
  improved: boolean;
  minDeltaMet: boolean;
  nonRegressionPassed: boolean;
  delta: number;
  relativeDelta: number;
  regressionFailures: string[];
}

export const DEFAULT_SCORE_GATE_CONFIG: ScoreGateConfig = {
  regressionTolerance: 0.005,
  minRelativeDelta: 0.01,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateEvolutionScore(input: EvolutionScoreInput): EvolutionScore {
  const benchmarkAggregate = input.benchmark.aggregate;
  const weightedBenchmarkScore = Number(average(Object.values(benchmarkAggregate)).toFixed(4));

  const baselineRuntimeMs = input.baselineRuntimeMs ?? input.benchmark.totalDurationMs;
  const baselineMemoryUsageMb = input.baselineMemoryUsageMb ?? input.benchmark.memoryUsageMb;

  const runtimeRatio = input.benchmark.totalDurationMs > 0
    ? baselineRuntimeMs / input.benchmark.totalDurationMs
    : 1;
  const memoryRatio = input.benchmark.memoryUsageMb > 0
    ? baselineMemoryUsageMb / input.benchmark.memoryUsageMb
    : 1;

  const efficiencyScore = Number(clamp01(average([runtimeRatio, memoryRatio])).toFixed(4));
  const stabilityScore = Number(clamp01(1 - input.mutationRisk).toFixed(4));

  const finalScore = Number(
    (
      weightedBenchmarkScore * 0.7 +
      efficiencyScore * 0.15 +
      stabilityScore * 0.15
    ).toFixed(4),
  );

  return {
    finalScore,
    weightedBenchmarkScore,
    efficiencyScore,
    stabilityScore,
    benchmarkAggregate,
    runtimeMs: input.benchmark.totalDurationMs,
    memoryUsageMb: input.benchmark.memoryUsageMb,
  };
}

export function compareScores(
  candidate: EvolutionScore,
  baseline: EvolutionBaseline | undefined,
  config: ScoreGateConfig = DEFAULT_SCORE_GATE_CONFIG,
): ScoreComparison {
  if (!baseline) {
    return {
      improved: true,
      minDeltaMet: true,
      nonRegressionPassed: true,
      delta: candidate.finalScore,
      relativeDelta: 1,
      regressionFailures: [],
    };
  }

  const delta = Number((candidate.finalScore - baseline.finalScore).toFixed(4));
  const relativeDelta = baseline.finalScore > 0
    ? Number((delta / baseline.finalScore).toFixed(4))
    : delta > 0 ? 1 : 0;

  const regressionFailures = Object.entries(candidate.benchmarkAggregate)
    .filter(([name, score]) => {
      const baselineScore = baseline.benchmarkAggregate[name as BenchmarkName] ?? 0;
      return score < baselineScore - config.regressionTolerance;
    })
    .map(([name, score]) => {
      const baselineScore = baseline.benchmarkAggregate[name as BenchmarkName] ?? 0;
      return `${name} dropped from ${baselineScore.toFixed(4)} to ${score.toFixed(4)}`;
    });

  const nonRegressionPassed = regressionFailures.length === 0;
  const improved = delta > 0;
  const minDeltaMet = improved && relativeDelta >= config.minRelativeDelta;

  return {
    improved,
    minDeltaMet,
    nonRegressionPassed,
    delta,
    relativeDelta,
    regressionFailures,
  };
}
