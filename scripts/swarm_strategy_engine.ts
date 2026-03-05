import fs from 'fs/promises';
import path from 'path';
import { setRedisValue } from './swarm_redis.js';
import { emitSwarmTelemetry } from './swarm_telemetry.js';

export interface SwarmStrategy {
  name: string;
  goal: string;
  description: string;
  success_rate: number;
  attempts: number;
}

const STRATEGY_REGISTRY = path.resolve(process.cwd(), 'swarm/strategy_registry.json');
const STRATEGY_METRICS_KEY = 'appforge:strategy_metrics';
const MAX_STRATEGIES_PER_TASK = 3;

async function loadStrategies(): Promise<SwarmStrategy[]> {
  const raw = await fs.readFile(STRATEGY_REGISTRY, 'utf8');
  return JSON.parse(raw) as SwarmStrategy[];
}

async function saveStrategies(strategies: SwarmStrategy[]): Promise<void> {
  await fs.writeFile(STRATEGY_REGISTRY, JSON.stringify(strategies, null, 2));
}

export async function selectStrategies(goal: string): Promise<SwarmStrategy[]> {
  const strategies = await loadStrategies();
  const selected = strategies
    .filter((s) => s.goal === goal)
    .sort((a, b) => b.success_rate - a.success_rate)
    .slice(0, MAX_STRATEGIES_PER_TASK);

  await emitSwarmTelemetry({
    event: 'strategy_selected',
    timestamp: new Date().toISOString(),
    goal,
    selected: selected.map((s) => s.name)
  });

  return selected;
}

export async function recordStrategyResult(strategyName: string, success: boolean): Promise<void> {
  const strategies = await loadStrategies();
  const strategy = strategies.find((item) => item.name === strategyName);

  if (!strategy) {
    return;
  }

  strategy.attempts += 1;
  const previousSuccessCount = Math.round(strategy.success_rate * (strategy.attempts - 1));
  const updatedSuccessCount = previousSuccessCount + (success ? 1 : 0);
  strategy.success_rate = updatedSuccessCount / strategy.attempts;

  await saveStrategies(strategies);
  await setRedisValue(STRATEGY_METRICS_KEY, {
    updated_at: new Date().toISOString(),
    strategies
  });

  await emitSwarmTelemetry({
    event: success ? 'strategy_success' : 'strategy_failure',
    timestamp: new Date().toISOString(),
    strategy: strategyName,
    success_rate: strategy.success_rate,
    attempts: strategy.attempts
  });
}
