/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { runBenchmarkSuite, aggregateByBenchmark } from '../../src/swarm/evolution/benchmarkHarness';

describe('benchmarkHarness', () => {
  it('runs benchmark suite and reports aggregate scores', async () => {
    const result = await runBenchmarkSuite('benchmarks/evolution/benchmark_suite.json');

    expect(result.cases.length).toBeGreaterThan(0);
    expect(result.aggregate['SWE-Bench']).toBeGreaterThan(0.7);
    expect(result.aggregate.HumanEval).toBeGreaterThan(0.7);
    expect(result.totalDurationMs).toBeGreaterThan(0);
    expect(result.memoryUsageMb).toBeGreaterThan(0);
  });

  it('aggregates individual case scores by benchmark', () => {
    const aggregate = aggregateByBenchmark([
      { id: '1', benchmark: 'SWE-Bench', passed: true, score: 0.9, latencyMs: 5 },
      { id: '2', benchmark: 'SWE-Bench', passed: true, score: 0.7, latencyMs: 5 },
      { id: '3', benchmark: 'ARC', passed: true, score: 0.8, latencyMs: 5 },
    ]);

    expect(aggregate['SWE-Bench']).toBe(0.8);
    expect(aggregate.ARC).toBe(0.8);
  });


  it('produces deterministic strategy-specific benchmark scores', async () => {
    const directA = await runBenchmarkSuite('benchmarks/evolution/benchmark_suite.json', 'direct', 19);
    const directB = await runBenchmarkSuite('benchmarks/evolution/benchmark_suite.json', 'direct', 19);
    const debate = await runBenchmarkSuite('benchmarks/evolution/benchmark_suite.json', 'debate', 19);

    expect(directA.aggregate).toEqual(directB.aggregate);
    expect(directA.aggregate).not.toEqual(debate.aggregate);
  });

});
