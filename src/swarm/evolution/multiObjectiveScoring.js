export const DEFAULT_MULTI_OBJECTIVE_WEIGHTS = {
    accuracy: 0.45,
    cost: 0.2,
    latency: 0.15,
    robustness: 0.15,
    hallucination: 0.05,
};
function clamp(value) {
    return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}
export function weightedMultiObjectiveScore(metrics, weights = DEFAULT_MULTI_OBJECTIVE_WEIGHTS) {
    const weightedComposite = Number((metrics.accuracyScore * weights.accuracy +
        metrics.costScore * weights.cost +
        metrics.latencyScore * weights.latency +
        metrics.robustnessScore * weights.robustness -
        metrics.hallucinationPenalty * weights.hallucination).toFixed(4));
    return {
        genomeId: metrics.genomeId,
        weightedComposite: clamp(weightedComposite),
        metrics,
    };
}
export function dominates(a, b) {
    const noWorse = a.accuracyScore >= b.accuracyScore &&
        a.costScore >= b.costScore &&
        a.latencyScore >= b.latencyScore &&
        a.robustnessScore >= b.robustnessScore &&
        a.hallucinationPenalty <= b.hallucinationPenalty &&
        a.validationStability >= b.validationStability;
    const strictlyBetter = a.accuracyScore > b.accuracyScore ||
        a.costScore > b.costScore ||
        a.latencyScore > b.latencyScore ||
        a.robustnessScore > b.robustnessScore ||
        a.hallucinationPenalty < b.hallucinationPenalty ||
        a.validationStability > b.validationStability;
    return noWorse && strictlyBetter;
}
export function computeParetoFrontier(metricsList, previousFrontier = []) {
    const nonDominated = [];
    const rejectedGenomeIds = [];
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
        }
        else {
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
