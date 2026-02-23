import fs from 'fs/promises';
import path from 'path';

export interface SyntheticDataEntry {
  taskInput: string;
  reasoningTrace: string[];
  selectedStrategy: string;
  failureMode: string;
  benchmarkLabel: string;
}

const DATASET_PATH = path.join(process.cwd(), 'swarm', 'benchmarks', 'synthetic_dataset.json');

function seededUnit(seed: number): number {
  const value = Math.sin(seed * 931.13) * 1493.57;
  return value - Math.floor(value);
}

export function generateSyntheticData(options: {
  strategyId: string;
  hardFailures: string[];
  cycle: number;
  seed: number;
}): SyntheticDataEntry[] {
  const entries: SyntheticDataEntry[] = [];
  const failureModes = options.hardFailures.length > 0 ? options.hardFailures : ['none'];

  for (let i = 0; i < Math.max(3, failureModes.length); i += 1) {
    const randomness = seededUnit(options.seed + i + options.cycle);
    const failureMode = failureModes[i % failureModes.length];
    const benchmarkLabel = randomness > 0.66 ? 'robustness' : randomness > 0.33 ? 'accuracy' : 'efficiency';

    entries.push({
      taskInput: `synthetic_task_cycle_${options.cycle}_${i}`,
      reasoningTrace: [
        `strategy=${options.strategyId}`,
        `seed=${options.seed}`,
        `failureMode=${failureMode}`,
      ],
      selectedStrategy: options.strategyId,
      failureMode,
      benchmarkLabel,
    });
  }

  const dedup = new Map(entries.map((entry) => [entry.taskInput, entry]));
  return [...dedup.values()];
}

export async function persistSyntheticDataset(entries: SyntheticDataEntry[]): Promise<{ datasetVersion: number; samples: number }> {
  let history: { datasetVersion: number; entries: SyntheticDataEntry[] }[] = [];

  try {
    const existing = await fs.readFile(DATASET_PATH, 'utf8');
    history = JSON.parse(existing);
  } catch {
    history = [];
  }

  const datasetVersion = history.length + 1;
  history.push({ datasetVersion, entries });

  await fs.mkdir(path.dirname(DATASET_PATH), { recursive: true });
  await fs.writeFile(DATASET_PATH, JSON.stringify(history, null, 2), 'utf8');

  return { datasetVersion, samples: entries.length };
}
