import fs from 'fs/promises';
import path from 'path';
const DATASET_PATH = path.join(process.cwd(), 'swarm', 'benchmarks', 'synthetic_dataset.json');
function seededUnit(seed) {
    const value = Math.sin(seed * 931.13) * 1493.57;
    return value - Math.floor(value);
}
export function generateSyntheticData(options) {
    const entries = [];
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
export async function persistSyntheticDataset(entries) {
    let history = [];
    try {
        const existing = await fs.readFile(DATASET_PATH, 'utf8');
        history = JSON.parse(existing);
    }
    catch {
        history = [];
    }
    const datasetVersion = history.length + 1;
    history.push({ datasetVersion, entries });
    await fs.mkdir(path.dirname(DATASET_PATH), { recursive: true });
    await fs.writeFile(DATASET_PATH, JSON.stringify(history, null, 2), 'utf8');
    return { datasetVersion, samples: entries.length };
}
