export interface StrategyGenome {
  strategyType: string;
  parameters: {
    treeDepth?: number;
    debateAgents?: number;
    reflectionRounds?: number;
    selfConsistencyK?: number;
    usesRetrieval?: boolean;
    usesStaticAnalysis?: boolean;
    usesTestLoop?: boolean;
    reasoningBudget?: number;
  };
  mutationIntensity: number;
}

export const GENOME_BOUNDS = {
  treeDepth: { min: 1, max: 6 },
  debateAgents: { min: 2, max: 8 },
  reflectionRounds: { min: 1, max: 6 },
  selfConsistencyK: { min: 2, max: 10 },
  reasoningBudget: { min: 1, max: 12 },
  mutationIntensity: { min: 0.05, max: 1 },
};

export function boundedGenome(genome: StrategyGenome): StrategyGenome {
  const clampInt = (value: number | undefined, min: number, max: number): number | undefined => {
    if (value === undefined) return undefined;
    return Math.max(min, Math.min(max, Math.round(value)));
  };

  const clampFloat = (value: number, min: number, max: number): number => {
    return Number(Math.max(min, Math.min(max, value)).toFixed(4));
  };

  return {
    strategyType: genome.strategyType,
    parameters: {
      treeDepth: clampInt(genome.parameters.treeDepth, GENOME_BOUNDS.treeDepth.min, GENOME_BOUNDS.treeDepth.max),
      debateAgents: clampInt(genome.parameters.debateAgents, GENOME_BOUNDS.debateAgents.min, GENOME_BOUNDS.debateAgents.max),
      reflectionRounds: clampInt(genome.parameters.reflectionRounds, GENOME_BOUNDS.reflectionRounds.min, GENOME_BOUNDS.reflectionRounds.max),
      selfConsistencyK: clampInt(genome.parameters.selfConsistencyK, GENOME_BOUNDS.selfConsistencyK.min, GENOME_BOUNDS.selfConsistencyK.max),
      reasoningBudget: clampInt(genome.parameters.reasoningBudget, GENOME_BOUNDS.reasoningBudget.min, GENOME_BOUNDS.reasoningBudget.max),
      usesRetrieval: genome.parameters.usesRetrieval ?? false,
      usesStaticAnalysis: genome.parameters.usesStaticAnalysis ?? false,
      usesTestLoop: genome.parameters.usesTestLoop ?? false,
    },
    mutationIntensity: clampFloat(genome.mutationIntensity, GENOME_BOUNDS.mutationIntensity.min, GENOME_BOUNDS.mutationIntensity.max),
  };
}
