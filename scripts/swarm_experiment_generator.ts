import type { SwarmTask } from './swarm_task_generator.ts';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface ExperimentStrategy {
  id: string;
  strategy: string;
  prompt: string;
}

const DEFAULT_STRATEGIES: ExperimentStrategy[] = [
  { id: 'A', strategy: 'minimal_fix', prompt: 'Apply the smallest safe fix that resolves the task.' },
  { id: 'B', strategy: 'test_first', prompt: 'Prioritize improving tests before code changes.' },
  { id: 'C', strategy: 'performance_tuned', prompt: 'Prioritize stable performance and benchmark safety.' },
  { id: 'D', strategy: 'refactor_hardened', prompt: 'Refactor for maintainability while preserving behavior.' },
  { id: 'E', strategy: 'security_first', prompt: 'Prioritize strict safety controls and defensive checks.' },
  { id: 'F', strategy: 'observability_boost', prompt: 'Improve logging, diagnostics, and verification signals.' },
  { id: 'G', strategy: 'resilience_guarded', prompt: 'Harden edge cases and failure recovery paths.' },
  { id: 'H', strategy: 'throughput_optimized', prompt: 'Optimize for execution throughput while maintaining correctness.' }
];

const SWARM_MEMORY_PATH = path.join('swarm', 'swarm_memory.json');

interface SwarmMemory {
  failed_strategies?: Record<string, string[]>;
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

export function generateExperimentStrategies(task: SwarmTask, maxExperiments = 4): ExperimentStrategy[] {
  const memory = loadSwarmMemory();
  const historicalFailures = memory.failed_strategies?.[getTaskTypeKey(task)] ?? [];
  const excluded = new Set([...(task.failed_strategies ?? []), ...historicalFailures]);

  const available = DEFAULT_STRATEGIES.filter((candidate) => !excluded.has(candidate.id));
  const pool = available.length > 0 ? available : DEFAULT_STRATEGIES;

  return pool.slice(0, Math.max(1, Math.min(maxExperiments, DEFAULT_STRATEGIES.length)));
}
