/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { computeParetoFrontier, dominates, weightedMultiObjectiveScore } from '../../src/swarm/evolution/multiObjectiveScoring';

describe('multi objective scoring', () => {
  it('computes weighted composite deterministically', () => {
    const result = weightedMultiObjectiveScore({
      genomeId: 'g1',
      accuracyScore: 0.9,
      costScore: 0.8,
      latencyScore: 0.7,
      robustnessScore: 0.85,
      hallucinationPenalty: 0.05,
      validationStability: 0.8,
    });

    expect(result.weightedComposite).toBeGreaterThan(0.7);
  });

  it('tracks non-dominated genomes', () => {
    const metrics = [
      { genomeId: 'a', accuracyScore: 0.9, costScore: 0.8, latencyScore: 0.8, robustnessScore: 0.8, hallucinationPenalty: 0.02, validationStability: 0.8 },
      { genomeId: 'b', accuracyScore: 0.88, costScore: 0.6, latencyScore: 0.6, robustnessScore: 0.7, hallucinationPenalty: 0.04, validationStability: 0.7 },
      { genomeId: 'c', accuracyScore: 0.91, costScore: 0.4, latencyScore: 0.4, robustnessScore: 0.8, hallucinationPenalty: 0.02, validationStability: 0.8 },
    ];

    expect(dominates(metrics[0], metrics[1])).toBe(true);
    const summary = computeParetoFrontier(metrics, []);
    expect(summary.nonDominatedGenomes).toContain('a');
    expect(summary.rejectedGenomeIds).toContain('c');
  });
});
