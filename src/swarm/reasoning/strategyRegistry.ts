import {
  DebateStrategy,
  DirectStrategy,
  MultiDebateStrategy,
  ReflectionStrategy,
  SelfConsistencyStrategy,
  TreeOfThoughtStrategy,
  type ReasoningStrategy,
} from './strategy.js';
import { EvolutionState } from '../../../swarm/core/evolution_state.js';

export interface StrategyRunStat {
  score: number;
  cycle: number;
}

export class StrategyRegistry {
  private readonly strategies = new Map<string, ReasoningStrategy>();
  private readonly enabled = new Set<string>();

  constructor() {
    const defaults: ReasoningStrategy[] = [
      new DirectStrategy(),
      new ReflectionStrategy(2),
      new TreeOfThoughtStrategy(3),
      new DebateStrategy(),
      new MultiDebateStrategy(4),
      new SelfConsistencyStrategy(5),
    ];

    for (const strategy of defaults) {
      this.register(strategy);
    }
  }

  register(strategy: ReasoningStrategy): void {
    this.strategies.set(strategy.id, strategy);
    this.enabled.add(strategy.id);
  }

  enable(id: string): void {
    if (this.strategies.has(id)) this.enabled.add(id);
  }

  disable(id: string): void {
    this.enabled.delete(id);
  }

  eliminateUnderperformers(underperformanceCounts: Record<string, number>, threshold = 5): string[] {
    const eliminated: string[] = [];
    for (const [strategyId, count] of Object.entries(underperformanceCounts)) {
      if (count >= threshold && this.enabled.has(strategyId)) {
        this.enabled.delete(strategyId);
        eliminated.push(strategyId);
      }
    }
    return eliminated;
  }

  listEnabled(): ReasoningStrategy[] {
    return [...this.enabled].map((id) => this.strategies.get(id)).filter((s): s is ReasoningStrategy => Boolean(s));
  }

  listAll(): ReasoningStrategy[] {
    return [...this.strategies.values()];
  }

  async persistStrategyScore(strategyId: string, score: number): Promise<void> {
    const state = await EvolutionState.load();
    const current = state.strategyPerformance[strategyId] ?? {
      runs: 0,
      avgScore: 0,
      lastScore: 0,
      improvementRate: 0,
      underperformingCycles: 0,
      enabled: true,
    };

    const runs = current.runs + 1;
    const avgScore = Number((((current.avgScore * current.runs) + score) / runs).toFixed(4));
    const improvementRate = current.runs === 0
      ? 0
      : Number(((score - current.lastScore) / Math.max(current.lastScore, 0.0001)).toFixed(4));

    state.strategyPerformance[strategyId] = {
      ...current,
      runs,
      avgScore,
      lastScore: score,
      improvementRate,
      enabled: this.enabled.has(strategyId),
    };

    await EvolutionState.save(state);
  }
}
