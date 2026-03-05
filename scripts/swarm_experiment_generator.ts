import type { SwarmTask } from './swarm_task_generator.ts';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { mutateStrategies } from './swarm_strategy_mutator.ts';

export interface ExperimentStrategy {
  id: string;
  strategy: string;
  prompt: string;
}

const DEFAULT_STRATEGIES: ExperimentStrategy[] = [
  { id: 'A', strategy: 'minimal_fix', prompt: 'Apply the smallest safe fix that resolves the task.' },
  { id: 'B', strategy: 'test_first', prompt: 'Prioritize improving tests before code changes.' },
  { id: 'C', strategy: 'performance_tuned', prompt: 'Prioritize stable performance and benchmark safety.' },
  { id: 'D', strategy: 'refactor_hardened', prompt: 'Refactor for maintainability while preserving behavior.' }
];

const SWARM_MEMORY_PATH = path.join('swarm', 'swarm_memory.json');
const STRATEGY_LOG_DIR = path.join('swarm', 'experiments');
const MAX_MUTATIONS_PER_TASK = 8;
const MAX_EXPERIMENTS_PER_TASK = 4;

interface SwarmMemory {
  failed_strategies?: Record<string, string[]>;
  failed_mutated_strategies?: Record<string, string[]>;
}

function loadSwarmMemory(): SwarmMemory {
  if (!existsSync(SWARM_MEMORY_PATH)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(SWARM_MEMORY_PATH, 'utf-8')) as SwarmMemory;
  } catch {
    return {};
  }
}

function getTaskTypeKey(task: SwarmTask): string {
  return task.signal;
}

function logGeneratedStrategies(task: SwarmTask, base: ExperimentStrategy[], mutated: ExperimentStrategy[], selected: ExperimentStrategy[]): void {
  mkdirSync(STRATEGY_LOG_DIR, { recursive: true });
  const filename = `${task.id}_${new Date().toISOString().replaceAll(':', '-')}.json`;
  const payload = {
    task_id: task.id,
    task_signal: task.signal,
    generated_at: new Date().toISOString(),
    counts: {
      base: base.length,
      mutated: mutated.length,
      selected: selected.length
    },
    base,
    mutated,
    selected
  };

  writeFileSync(path.join(STRATEGY_LOG_DIR, filename), JSON.stringify(payload, null, 2));
}

export function generateExperimentStrategies(task: SwarmTask, maxExperiments = MAX_EXPERIMENTS_PER_TASK): ExperimentStrategy[] {
  const safeMax = Math.max(1, Math.min(maxExperiments, MAX_EXPERIMENTS_PER_TASK));
  const memory = loadSwarmMemory();

  const historicalFailures = memory.failed_strategies?.[getTaskTypeKey(task)] ?? [];
  const historicalMutatedFailures = memory.failed_mutated_strategies?.[getTaskTypeKey(task)] ?? [];
  const excluded = new Set([...(task.failed_strategies ?? []), ...historicalFailures, ...historicalMutatedFailures]);

  const baseStrategies = DEFAULT_STRATEGIES.filter((candidate) => !excluded.has(candidate.id));
  const selectedBase = baseStrategies.length > 0 ? baseStrategies : DEFAULT_STRATEGIES;
  const mutated = mutateStrategies(selectedBase, {
    maxMutations: Math.min(MAX_MUTATIONS_PER_TASK, safeMax * 2),
    maxMutationsPerStrategy: 2
  });

  const availableBase = selectedBase.filter((candidate) => !excluded.has(candidate.id));
  const availableMutated = mutated.filter((candidate, index, list) => {
    if (excluded.has(candidate.id)) {
      return false;
    }
    return list.findIndex((entry) => entry.id === candidate.id) === index;
  });

  const selected: ExperimentStrategy[] = [];
  let baseIndex = 0;
  let mutatedIndex = 0;

  while (selected.length < safeMax && (baseIndex < availableBase.length || mutatedIndex < availableMutated.length)) {
    if (baseIndex < availableBase.length) {
      selected.push(availableBase[baseIndex]);
      baseIndex += 1;
      if (selected.length >= safeMax) {
        break;
      }
    }

    if (mutatedIndex < availableMutated.length) {
      selected.push(availableMutated[mutatedIndex]);
      mutatedIndex += 1;
    }
  }

  logGeneratedStrategies(task, selectedBase, mutated, selected);
  return selected;
}
