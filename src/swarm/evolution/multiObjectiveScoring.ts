export interface MultiObjectiveMetrics {
  genomeId: string;
  accuracyScore: number;
  costScore: number;
  latencyScore: number;
  robustnessScore: number;
  hallucinationPenalty: number;
  validationStability: number;
}

export interface MultiObjectiveWeights {
  accuracy: number;
  cost: number;
  latency: number;
  robustness: number;
  hallucination: number;
}

export interface MultiObjectiveScoreResult {
  genomeId: string;
  weightedComposite: number;
  metrics: MultiObjectiveMetrics;
}

export interface ParetoSummary {
  nonDominatedGenomes: string[];
  dominatedCount: number;
  frontierChangesPerCycle: number;
  rejectedGenomeIds: string[];
}

export const DEFAULT_MULTI_OBJECTIVE_WEIGHTS: MultiObjectiveWeights = {
  accuracy: 0.45,
  cost: 0.2,
  latency: 0.15,
  robustness: 0.15,
  hallucination: 0.05,
};

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

export function weightedMultiObjectiveScore(
  metrics: MultiObjectiveMetrics,
  weights: MultiObjectiveWeights = DEFAULT_MULTI_OBJECTIVE_WEIGHTS,
): MultiObjectiveScoreResult {
  const weightedComposite = Number((
    metrics.accuracyScore * weights.accuracy +
    metrics.costScore * weights.cost +
    metrics.latencyScore * weights.latency +
    metrics.robustnessScore * weights.robustness -
    metrics.hallucinationPenalty * weights.hallucination
  ).toFixed(4));

  return {
    genomeId: metrics.genomeId,
    weightedComposite: clamp(weightedComposite),
    metrics,
  };
}

export function dominates(a: MultiObjectiveMetrics, b: MultiObjectiveMetrics): boolean {
  const noWorse =
    a.accuracyScore >= b.accuracyScore &&
    a.costScore >= b.costScore &&
    a.latencyScore >= b.latencyScore &&
    a.robustnessScore >= b.robustnessScore &&
    a.hallucinationPenalty <= b.hallucinationPenalty &&
    a.validationStability >= b.validationStability;

  const strictlyBetter =
    a.accuracyScore > b.accuracyScore ||
    a.costScore > b.costScore ||
    a.latencyScore > b.latencyScore ||
    a.robustnessScore > b.robustnessScore ||
    a.hallucinationPenalty < b.hallucinationPenalty ||
    a.validationStability > b.validationStability;

  return noWorse && strictlyBetter;
}

export function computeParetoFrontier(
  metricsList: MultiObjectiveMetrics[],
  previousFrontier: string[] = [],
): ParetoSummary {
  const nonDominated: string[] = [];
  const rejectedGenomeIds: string[] = [];

  for (const candidate of metricsList) {
    let dominatedByAny = false;

    for (const other of metricsList) {
      if (other.genomeId !== candidate.genomeId && dominates(other, candidate)) {
        dominatedByAny = true;
        break;
      }
    }

    const collapseOnEfficiency = candidate.accuracyScore >= 0.85 && (candidate.costScore < 0.5 || candidate.latencyScore < 0.5);
    const unstableValidation = candidate.accuracyScore > 0.8 && candidate.validationStability < 0.55;

    if (!dominatedByAny && !collapseOnEfficiency && !unstableValidation) {
      nonDominated.push(candidate.genomeId);
    } else {
      rejectedGenomeIds.push(candidate.genomeId);
    }
  }

  const frontierChangesPerCycle = nonDominated.filter((id) => !previousFrontier.includes(id)).length
    + previousFrontier.filter((id) => !nonDominated.includes(id)).length;

  return {
    nonDominatedGenomes: nonDominated,
    dominatedCount: metricsList.length - nonDominated.length,
    frontierChangesPerCycle,
    rejectedGenomeIds,
  };
}
