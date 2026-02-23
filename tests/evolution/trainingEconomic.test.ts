/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { calculateEconomicScore } from '../../src/swarm/evolution/economicScoring';
import { generateSyntheticData } from '../../src/swarm/training/dataGeneration';
import { SimulatedModelAdapter } from '../../src/swarm/training/modelAdapter';

describe('training + economic modules', () => {
  it('calculates economic score fields', () => {
    const score = calculateEconomicScore({
      correctSolutions: 8,
      totalSolutions: 10,
      totalTokenUsage: 2500,
      totalCostUsd: 0.09,
      totalLatencyMs: 4400,
      performanceGain: 0.04,
    });

    expect(score.costPerCorrectSolution).toBeGreaterThan(0);
    expect(score.economicScore).toBeGreaterThan(0);
  });

  it('generates deterministic synthetic data', () => {
    const a = generateSyntheticData({ strategyId: 'debate', hardFailures: ['regression'], cycle: 2, seed: 19 });
    const b = generateSyntheticData({ strategyId: 'debate', hardFailures: ['regression'], cycle: 2, seed: 19 });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('simulated model adapter fine-tuning increments checkpoint', async () => {
    const adapter = new SimulatedModelAdapter();
    const before = await adapter.evaluate(7);
    const tuned = await adapter.fineTune({ datasetVersion: 2, samples: 5, seed: 7 });
    expect(tuned.checkpointVersion).toBeGreaterThan(before.checkpointVersion);
  });
});
