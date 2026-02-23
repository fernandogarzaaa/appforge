import { randomUUID } from 'crypto';
import { runBenchmarkSuite } from './benchmarkHarness.js';
import { MetricsInstrumentation } from './metricsInstrumentation.js';
import { evaluateMutationSafety, type MutationProposal } from './mutationSafeguards.js';
import {
  calculateEvolutionScore,
  compareScores,
  DEFAULT_SCORE_GATE_CONFIG,
  type EvolutionBaseline,
} from './evolutionScoringEngine.js';
import { EvolutionState } from '../../../swarm/core/evolution_state.js';
import { StrategyRegistry } from '../reasoning/strategyRegistry.js';
import { runStrategySearch } from './strategySearch.js';
import { calculateEconomicScore } from './economicScoring.js';
import {
  computeParetoFrontier,
  weightedMultiObjectiveScore,
  type MultiObjectiveMetrics,
} from './multiObjectiveScoring.js';
import { runRealWorldHarness } from './realWorldHarness.js';
import { generateSyntheticData, persistSyntheticDataset } from '../training/dataGeneration.js';
import { SimulatedModelAdapter } from '../training/modelAdapter.js';

export interface EvolutionCycleInput {
  suitePath: string;
  mutationProposal: MutationProposal;
  baseline?: EvolutionBaseline;
  regressionTolerance?: number;
  minRelativeDelta?: number;
  seed?: number;
  crossSeedCount?: number;
  enableFineTune?: boolean;
}

export interface EvolutionCycleOutcome {
  runId: string;
  shouldOpenPr: boolean;
  finalScore: number;
  scoreDelta: number;
  relativeDelta: number;
  nonRegressionPassed: boolean;
  minDeltaMet: boolean;
  plateaued: boolean;
  mutationIntensity: 'normal' | 'elevated';
  mutationScope: 'standard' | 'expanded';
  guardrailReasons: string[];
  regressionFailures: string[];
  selectedStrategyId: string;
  strategyScores: Record<string, number>;
  eliminatedStrategies: string[];
  bestGenome: {
    strategyType: string;
    mutationIntensity: number;
    parameters: Record<string, number | boolean | undefined>;
  };
  paretoSummary: {
    nonDominatedGenomes: string[];
    dominatedCount: number;
    frontierChangesPerCycle: number;
  };
  seedVariance: number;
  stabilityIndex: number;
  economicScore: number;
  datasetVersion: number;
  checkpointVersion: number;
  learningCycles: number;
}

function parseEnvNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function simulatedTokenUsage(strategyId: string, seed: number): number {
  return 400 + strategyId.length * 20 + (seed % 7) * 15;
}

export async function executeEvolutionCycle(input: EvolutionCycleInput): Promise<EvolutionCycleOutcome> {
  const runId = randomUUID();
  const seed = input.seed ?? 17;
  const crossSeedCount = input.crossSeedCount ?? 5;
  const guardrails = evaluateMutationSafety(input.mutationProposal);
  const registry = new StrategyRegistry();

  const currentState = await EvolutionState.load();
  const search = await runStrategySearch(
    ['SWE-Bench', 'HumanEval', 'MMLU', 'ARC'],
    seed,
    currentState.plateaued,
    currentState.bestHistoricalScore,
  );

  const strategyScores: Record<string, number> = {};
  const strategyMetrics: MultiObjectiveMetrics[] = [];
  const perStrategyComparison: Record<string, ReturnType<typeof compareScores>> = {};

  let selectedStrategyId = '';
  let selectedFinalScore = -1;
  let selectedComparison: ReturnType<typeof compareScores> | null = null;
  let selectedBenchmarkAverage = 0;
  let selectedBenchmarkAggregate: EvolutionBaseline['benchmarkAggregate'] = {
    'SWE-Bench': 0,
    HumanEval: 0,
    MMLU: 0,
    ARC: 0,
  };
  let selectedSeedVariance = 0;
  let selectedStabilityIndex = 1;
  let selectedRuntime = 1;
  let selectedTokenUsage = 1;

  const strategies = registry.listEnabled();
  for (const strategy of strategies) {
    const seedScores: number[] = [];
    const seedDurations: number[] = [];
    const seedMemory: number[] = [];
    let benchmarkAggregate = selectedBenchmarkAggregate;

    for (let offset = 0; offset < crossSeedCount; offset += 1) {
      const benchmarkResult = await runBenchmarkSuite(input.suitePath, strategy.id, seed + offset);
      const score = calculateEvolutionScore({
        benchmark: benchmarkResult,
        mutationRisk: guardrails.riskScore,
      });
      seedScores.push(score.finalScore);
      seedDurations.push(benchmarkResult.totalDurationMs);
      seedMemory.push(benchmarkResult.memoryUsageMb);
      benchmarkAggregate = score.benchmarkAggregate;
    }

    const avgScore = Number(mean(seedScores).toFixed(4));
    const variance = Number(stddev(seedScores).toFixed(6));
    const stabilityIndex = Number(Math.max(0, 1 - variance * 10).toFixed(4));
    const avgRuntime = Number(mean(seedDurations).toFixed(4));
    const avgMemory = Number(mean(seedMemory).toFixed(4));
    const tokenUsage = simulatedTokenUsage(strategy.id, seed);

    const comparison = compareScores({
      finalScore: avgScore,
      weightedBenchmarkScore: avgScore,
      efficiencyScore: Number(Math.max(0, 1 - avgRuntime / 100).toFixed(4)),
      stabilityScore: stabilityIndex,
      benchmarkAggregate,
      runtimeMs: avgRuntime,
      memoryUsageMb: avgMemory,
    }, input.baseline, {
      regressionTolerance: input.regressionTolerance ?? parseEnvNumber(process.env.EVOLUTION_REGRESSION_TOLERANCE, DEFAULT_SCORE_GATE_CONFIG.regressionTolerance),
      minRelativeDelta: input.minRelativeDelta ?? parseEnvNumber(process.env.EVOLUTION_MIN_RELATIVE_DELTA, DEFAULT_SCORE_GATE_CONFIG.minRelativeDelta),
    });

    const accuracyScore = avgScore;
    const costScore = Number(Math.max(0, 1 - tokenUsage / 1200).toFixed(4));
    const latencyScore = Number(Math.max(0, 1 - avgRuntime / 90).toFixed(4));
    const robustnessScore = stabilityIndex;
    const hallucinationPenalty = guardrails.reasons.length > 0 ? 0.4 : 0.02;

    const objective = {
      genomeId: strategy.id,
      accuracyScore,
      costScore,
      latencyScore,
      robustnessScore,
      hallucinationPenalty,
      validationStability: stabilityIndex,
    };

    const objectiveScore = weightedMultiObjectiveScore(objective);

    strategyScores[strategy.id] = objectiveScore.weightedComposite;
    strategyMetrics.push(objective);
    perStrategyComparison[strategy.id] = comparison;
    await registry.persistStrategyScore(strategy.id, objectiveScore.weightedComposite);

    if (objectiveScore.weightedComposite > selectedFinalScore) {
      selectedFinalScore = objectiveScore.weightedComposite;
      selectedStrategyId = strategy.id;
      selectedComparison = comparison;
      selectedBenchmarkAverage = accuracyScore;
      selectedBenchmarkAggregate = benchmarkAggregate;
      selectedSeedVariance = variance;
      selectedStabilityIndex = stabilityIndex;
      selectedRuntime = avgRuntime;
      selectedTokenUsage = tokenUsage;
    }
  }

  if (!selectedComparison) throw new Error('No strategy available for selection');

  const paretoSummary = computeParetoFrontier(strategyMetrics, currentState.nonDominatedGenomes);

  const stateAfterScoring = await EvolutionState.load();
  const underperformanceCounts: Record<string, number> = {};
  for (const [strategyId, perf] of Object.entries(stateAfterScoring.strategyPerformance)) {
    const selectedScore = strategyScores[selectedStrategyId] ?? selectedFinalScore;
    const underperforming = perf.lastScore + 0.005 < selectedScore;
    const count = underperforming ? perf.underperformingCycles + 1 : 0;
    underperformanceCounts[strategyId] = count;
    stateAfterScoring.strategyPerformance[strategyId] = {
      ...perf,
      underperformingCycles: count,
    };
  }

  const eliminatedStrategies = registry.eliminateUnderperformers(underperformanceCounts, 5);
  for (const id of eliminatedStrategies) {
    if (stateAfterScoring.strategyPerformance[id]) stateAfterScoring.strategyPerformance[id].enabled = false;
  }
  stateAfterScoring.nonDominatedGenomes = paretoSummary.nonDominatedGenomes;
  stateAfterScoring.dominatedCount = paretoSummary.dominatedCount;
  stateAfterScoring.frontierChangesPerCycle = paretoSummary.frontierChangesPerCycle;
  stateAfterScoring.seedVariance = selectedSeedVariance;
  stateAfterScoring.stabilityIndex = selectedStabilityIndex;
  await EvolutionState.save(stateAfterScoring);

  const realWorld = await runRealWorldHarness(seed);
  const economic = calculateEconomicScore({
    correctSolutions: Math.round(realWorld.averageScore * realWorld.taskCount),
    totalSolutions: realWorld.taskCount,
    totalTokenUsage: selectedTokenUsage,
    totalCostUsd: Number((selectedTokenUsage * 0.000002).toFixed(6)),
    totalLatencyMs: selectedRuntime * realWorld.taskCount,
    performanceGain: Math.max(0, selectedComparison.delta),
  });

  const model = new SimulatedModelAdapter();
  const beforeEval = await model.evaluate(seed);
  let checkpointVersion = beforeEval.checkpointVersion;
  let datasetVersion = stateAfterScoring.datasetVersion;
  let learningCycles = stateAfterScoring.learningCycles;

  const hardFailures = [
    ...selectedComparison.regressionFailures,
    ...paretoSummary.rejectedGenomeIds,
  ];

  const synthetic = generateSyntheticData({
    strategyId: selectedStrategyId,
    hardFailures,
    cycle: stateAfterScoring.totalCycles + 1,
    seed,
  });

  const dataset = await persistSyntheticDataset(synthetic);
  datasetVersion = dataset.datasetVersion;

  if (input.enableFineTune ?? true) {
    const tuned = await model.fineTune({ datasetVersion, samples: dataset.samples, seed });
    checkpointVersion = tuned.checkpointVersion;
    learningCycles += 1;

    const collapse = tuned.qualityScore + 0.1 < beforeEval.qualityScore;
    if (collapse) {
      await model.loadCheckpoint(beforeEval.checkpointVersion);
      checkpointVersion = beforeEval.checkpointVersion;
    }
  }

  const frontierImproved = paretoSummary.frontierChangesPerCycle > 0
    && paretoSummary.nonDominatedGenomes.includes(selectedStrategyId);

  const prEligible = selectedComparison.improved
    && selectedComparison.nonRegressionPassed
    && selectedComparison.minDeltaMet
    && guardrails.allowed
    && frontierImproved;

  const state = await EvolutionState.recordBenchmarkCycle({
    runId,
    finalScore: selectedFinalScore,
    benchmarkAverage: selectedBenchmarkAverage,
    prEligible,
    scoreDelta: selectedComparison.delta,
    relativeDelta: selectedComparison.relativeDelta,
    regressionFailures: selectedComparison.regressionFailures,
    strategyId: selectedStrategyId,
    strategyScores,
    eliminatedStrategies,
    seedVariance: selectedSeedVariance,
    stabilityIndex: selectedStabilityIndex,
    paretoFrontierSize: paretoSummary.nonDominatedGenomes.length,
    economicScore: economic.economicScore,
    datasetVersion,
    checkpointVersion,
    learningCycles,
    timestamp: new Date().toISOString(),
  });

  state.nonDominatedGenomes = paretoSummary.nonDominatedGenomes;
  state.dominatedCount = paretoSummary.dominatedCount;
  state.frontierChangesPerCycle = paretoSummary.frontierChangesPerCycle;
  state.seedVariance = selectedSeedVariance;
  state.stabilityIndex = selectedStabilityIndex;
  state.datasetVersion = datasetVersion;
  state.checkpointVersion = checkpointVersion;
  state.learningCycles = learningCycles;
  await EvolutionState.save(state);

  const metricsStore = new MetricsInstrumentation();
  await metricsStore.append({
    runId,
    timestamp: new Date().toISOString(),
    benchmark: selectedBenchmarkAggregate,
    finalScore: selectedFinalScore,
    weightedBenchmarkScore: selectedBenchmarkAverage,
    efficiencyScore: Number(Math.max(0, 1 - selectedRuntime / 100).toFixed(4)),
    stabilityScore: selectedStabilityIndex,
    mutationRisk: guardrails.riskScore,
    nonRegressionPassed: selectedComparison.nonRegressionPassed,
    minDeltaMet: selectedComparison.minDeltaMet,
    plateaued: state.plateaued,
    prEligible,
    selectedStrategyId,
    strategyScores,
  });

  return {
    runId,
    shouldOpenPr: prEligible,
    finalScore: selectedFinalScore,
    scoreDelta: selectedComparison.delta,
    relativeDelta: selectedComparison.relativeDelta,
    nonRegressionPassed: selectedComparison.nonRegressionPassed,
    minDeltaMet: selectedComparison.minDeltaMet,
    plateaued: state.plateaued,
    mutationIntensity: state.mutationIntensity,
    mutationScope: state.mutationScope,
    guardrailReasons: guardrails.reasons,
    regressionFailures: selectedComparison.regressionFailures,
    selectedStrategyId,
    strategyScores,
    eliminatedStrategies,
    bestGenome: {
      strategyType: search.bestGenome.strategyType,
      mutationIntensity: search.bestGenome.mutationIntensity,
      parameters: search.bestGenome.parameters,
    },
    paretoSummary: {
      nonDominatedGenomes: paretoSummary.nonDominatedGenomes,
      dominatedCount: paretoSummary.dominatedCount,
      frontierChangesPerCycle: paretoSummary.frontierChangesPerCycle,
    },
    seedVariance: selectedSeedVariance,
    stabilityIndex: selectedStabilityIndex,
    economicScore: economic.economicScore,
    datasetVersion,
    checkpointVersion,
    learningCycles,
  };
}
