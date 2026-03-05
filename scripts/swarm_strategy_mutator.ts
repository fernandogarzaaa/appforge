import type { ExperimentStrategy } from './swarm_experiment_generator.ts';

export interface StrategyMutationOptions {
  maxMutations?: number;
  maxMutationsPerStrategy?: number;
}

const DEFAULT_MAX_MUTATIONS = 12;
const DEFAULT_MAX_MUTATIONS_PER_STRATEGY = 3;

const PARAMETER_VARIATIONS = [
  { suffix: 'high_confidence', prompt: 'Use stricter validation thresholds and conservative fallback behavior.' },
  { suffix: 'rapid_iteration', prompt: 'Favor quicker iteration with narrow scoped changes and frequent checks.' }
] as const;

const CONFIG_VARIATIONS = [
  { suffix: 'strict_config', prompt: 'Tighten configuration defaults and reject ambiguous runtime options.' },
  { suffix: 'minimal_config', prompt: 'Reduce configuration surface to the smallest deterministic set.' }
] as const;

const DEPENDENCY_VARIATIONS = [
  { suffix: 'dependency_major', prompt: 'Apply major dependency upgrades with migration safeguards.' },
  { suffix: 'dependency_minor', prompt: 'Apply minor/patch dependency upgrades and preserve compatibility.' },
  { suffix: 'dependency_replace', prompt: 'Replace risky dependency choices with safer maintained alternatives.' }
] as const;

function createMutation(
  base: ExperimentStrategy,
  index: number,
  suffix: string,
  mutationPrompt: string,
  descriptor: string
): ExperimentStrategy {
  return {
    id: `${base.id}_mut_${index}`,
    strategy: `${base.strategy}_${suffix}`,
    prompt: `${base.prompt} Mutation(${descriptor}): ${mutationPrompt}`
  };
}

function combineStrategies(primary: ExperimentStrategy, secondary: ExperimentStrategy, index: number): ExperimentStrategy {
  return {
    id: `${primary.id}_mut_${index}`,
    strategy: `${primary.strategy}_x_${secondary.strategy}`,
    prompt: `${primary.prompt} Combine with ${secondary.strategy}: ${secondary.prompt}`
  };
}

export function mutateStrategies(
  baseStrategies: ExperimentStrategy[],
  options: StrategyMutationOptions = {}
): ExperimentStrategy[] {
  if (baseStrategies.length === 0) {
    return [];
  }

  const maxMutations = Math.max(0, options.maxMutations ?? DEFAULT_MAX_MUTATIONS);
  const maxPerStrategy = Math.max(1, options.maxMutationsPerStrategy ?? DEFAULT_MAX_MUTATIONS_PER_STRATEGY);
  const usedIds = new Set(baseStrategies.map((strategy) => strategy.id));
  const mutated: ExperimentStrategy[] = [];

  for (let index = 0; index < baseStrategies.length; index += 1) {
    if (mutated.length >= maxMutations) {
      break;
    }

    const base = baseStrategies[index];
    const combinations = [
      ...PARAMETER_VARIATIONS.map((variation) => ({ ...variation, descriptor: 'parameter_variation' })),
      ...CONFIG_VARIATIONS.map((variation) => ({ ...variation, descriptor: 'configuration_change' })),
      ...DEPENDENCY_VARIATIONS.map((variation) => ({ ...variation, descriptor: 'dependency_change' }))
    ];

    let createdForBase = 0;

    for (const variation of combinations) {
      if (createdForBase >= maxPerStrategy || mutated.length >= maxMutations) {
        break;
      }

      const candidate = createMutation(base, createdForBase + 1, variation.suffix, variation.prompt, variation.descriptor);
      if (usedIds.has(candidate.id)) {
        continue;
      }

      usedIds.add(candidate.id);
      mutated.push(candidate);
      createdForBase += 1;
    }

    if (createdForBase < maxPerStrategy && mutated.length < maxMutations && baseStrategies.length > 1) {
      const partner = baseStrategies[(index + 1) % baseStrategies.length];
      const combined = combineStrategies(base, partner, createdForBase + 1);
      if (!usedIds.has(combined.id)) {
        usedIds.add(combined.id);
        mutated.push(combined);
      }
    }
  }

  return mutated.slice(0, maxMutations);
}
