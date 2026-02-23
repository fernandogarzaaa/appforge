/**
 * @vitest-environment node
 */
import fs from 'fs/promises';
import path from 'path';
import { beforeEach, describe, it, expect } from 'vitest';
import { executeEvolutionCycle } from '../../src/swarm/evolution/evolutionCoordinator';

const statePath = path.join(process.cwd(), 'swarm', 'evolution_state.json');
const metricsPath = path.join(process.cwd(), 'swarm', 'benchmarks', 'evolution_metrics_history.json');
const populationPath = path.join(process.cwd(), 'swarm', 'benchmarks', 'strategy_population.json');

async function resetPersistentArtifacts(): Promise<void> {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.mkdir(path.dirname(metricsPath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify({
    totalCycles: 0,
    totalPRsCreated: 0,
    totalMerges: 0,
    lastMutationScore: 0,
    mutationHistory: [],
    benchmarkHistory: [],
    lastBenchmarkScore: 0,
    consecutiveNoImprovementCycles: 0,
    bestHistoricalScore: 0,
    plateaued: false,
    mutationIntensity: 'normal',
    mutationScope: 'standard',
    strategyPerformance: {},
  }, null, 2));
  await fs.writeFile(metricsPath, '[]');
  try { await fs.unlink(populationPath); } catch {}
}

describe('evolutionCoordinator strategy evolution', () => {
  beforeEach(async () => {
    await resetPersistentArtifacts();
  });

  it('produces deterministic selection and traceable strategy scores for same seed', async () => {
    const input = {
      suitePath: 'benchmarks/evolution/benchmark_suite.json',
      seed: 13,
      baseline: {
        finalScore: 0.7,
        benchmarkAggregate: {
          'SWE-Bench': 0.7,
          HumanEval: 0.7,
          MMLU: 0.7,
          ARC: 0.7,
        },
      },
      mutationProposal: { touchedFiles: ['src/swarm/reasoning/strategy.ts'] },
    };

    const first = await executeEvolutionCycle(input);
    await resetPersistentArtifacts();
    const second = await executeEvolutionCycle(input);

    expect(first.selectedStrategyId).toBe(second.selectedStrategyId);
    expect(first.strategyScores).toEqual(second.strategyScores);
  });

  it('blocks PR if composite improves but benchmark regresses beyond tolerance', async () => {
    const outcome = await executeEvolutionCycle({
      suitePath: 'benchmarks/evolution/benchmark_suite_with_regression_candidate.json',
      seed: 7,
      baseline: {
        finalScore: 0.5,
        benchmarkAggregate: {
          'SWE-Bench': 0.9,
          HumanEval: 0.9,
          MMLU: 0.9,
          ARC: 0.9,
        },
      },
      mutationProposal: { touchedFiles: ['src/swarm/evolution/evolutionCoordinator.ts'] },
    });

    expect(outcome.scoreDelta).toBeGreaterThan(0);
    expect(outcome.nonRegressionPassed).toBe(false);
    expect(outcome.shouldOpenPr).toBe(false);
  });

  it('increments plateau and escalates mutation intensity after five cycles', async () => {
    let last;
    for (let index = 0; index < 5; index += 1) {
      last = await executeEvolutionCycle({
        suitePath: 'benchmarks/evolution/benchmark_suite.json',
        seed: 21,
        baseline: {
          finalScore: 1,
          benchmarkAggregate: {
            'SWE-Bench': 1,
            HumanEval: 1,
            MMLU: 1,
            ARC: 1,
          },
        },
        mutationProposal: { touchedFiles: ['src/swarm/evolution/evolutionCoordinator.ts'] },
      });
    }

    expect(last?.plateaued).toBe(true);
    expect(last?.mutationIntensity).toBe('elevated');
    expect(last?.mutationScope).toBe('expanded');
  });

  it('eliminates underperforming strategies after 5 cycles', async () => {
    for (let index = 0; index < 6; index += 1) {
      await executeEvolutionCycle({
        suitePath: 'benchmarks/evolution/benchmark_suite.json',
        seed: 31,
        baseline: {
          finalScore: 0.3,
          benchmarkAggregate: {
            'SWE-Bench': 0.3,
            HumanEval: 0.3,
            MMLU: 0.3,
            ARC: 0.3,
          },
        },
        mutationProposal: { touchedFiles: ['src/swarm/reasoning/strategy.ts'] },
      });
    }

    const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
    const disabled = Object.values(state.strategyPerformance).filter((entry: any) => entry.enabled === false);
    expect(disabled.length).toBeGreaterThan(0);
  });
});
