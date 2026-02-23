import fs from 'fs/promises';
import path from 'path';
import type { BenchmarkRunResult } from './benchmarkHarness.js';

export interface EvolutionMetricsRecord {
  runId: string;
  timestamp: string;
  benchmark: BenchmarkRunResult['aggregate'];
  finalScore: number;
  weightedBenchmarkScore: number;
  efficiencyScore: number;
  stabilityScore: number;
  mutationRisk: number;
  nonRegressionPassed: boolean;
  minDeltaMet: boolean;
  plateaued: boolean;
  prEligible: boolean;
  selectedStrategyId?: string;
  strategyScores?: Record<string, number>;
}

export class MetricsInstrumentation {
  constructor(private readonly metricsPath = path.join(process.cwd(), 'swarm', 'benchmarks', 'evolution_metrics_history.json')) {}

  async readHistory(): Promise<EvolutionMetricsRecord[]> {
    try {
      const data = await fs.readFile(this.metricsPath, 'utf8');
      return JSON.parse(data) as EvolutionMetricsRecord[];
    } catch {
      return [];
    }
  }

  async append(record: EvolutionMetricsRecord): Promise<EvolutionMetricsRecord[]> {
    const history = await this.readHistory();
    const next = [...history, record];
    await fs.mkdir(path.dirname(this.metricsPath), { recursive: true });
    await fs.writeFile(this.metricsPath, JSON.stringify(next, null, 2), 'utf8');
    return next;
  }
}
