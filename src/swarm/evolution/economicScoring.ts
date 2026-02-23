export interface EconomicInput {
  correctSolutions: number;
  totalSolutions: number;
  totalTokenUsage: number;
  totalCostUsd: number;
  totalLatencyMs: number;
  performanceGain: number;
}

export interface EconomicScore {
  costPerCorrectSolution: number;
  latencyPerTask: number;
  tokenEfficiencyRatio: number;
  improvementPerDollar: number;
  economicScore: number;
}

export function calculateEconomicScore(input: EconomicInput): EconomicScore {
  const safeCorrect = Math.max(1, input.correctSolutions);
  const safeTasks = Math.max(1, input.totalSolutions);
  const safeCost = Math.max(0.0001, input.totalCostUsd);

  const costPerCorrectSolution = Number((input.totalCostUsd / safeCorrect).toFixed(6));
  const latencyPerTask = Number((input.totalLatencyMs / safeTasks).toFixed(4));
  const tokenEfficiencyRatio = Number((safeCorrect / Math.max(1, input.totalTokenUsage)).toFixed(8));
  const improvementPerDollar = Number((input.performanceGain / safeCost).toFixed(6));
  const economicScore = Number((improvementPerDollar * tokenEfficiencyRatio * (1 / Math.max(1, latencyPerTask / 1000))).toFixed(8));

  return {
    costPerCorrectSolution,
    latencyPerTask,
    tokenEfficiencyRatio,
    improvementPerDollar,
    economicScore,
  };
}
