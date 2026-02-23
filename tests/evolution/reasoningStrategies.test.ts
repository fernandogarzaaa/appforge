/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  DirectStrategy,
  ReflectionStrategy,
  TreeOfThoughtStrategy,
  DebateStrategy,
  MultiDebateStrategy,
  SelfConsistencyStrategy,
} from '../../src/swarm/reasoning/strategy';

describe('reasoning strategies determinism', () => {
  const task = { taskId: 't-1', prompt: 'stabilize deployment rollout', seed: 11 };

  it('direct strategy deterministic output', async () => {
    const strategy = new DirectStrategy();
    const first = await strategy.execute(task);
    const second = await strategy.execute(task);
    expect(first).toEqual(second);
    expect(first.trace.length).toBeGreaterThan(0);
  });

  it('advanced strategies return deterministic traces for same seed', async () => {
    const strategies = [
      new ReflectionStrategy(2),
      new TreeOfThoughtStrategy(3),
      new DebateStrategy(),
      new MultiDebateStrategy(4),
      new SelfConsistencyStrategy(5),
    ];

    for (const strategy of strategies) {
      const first = await strategy.execute(task);
      const second = await strategy.execute(task);
      expect(first).toEqual(second);
      expect(first.trace.length).toBeGreaterThan(0);
    }
  });
});
