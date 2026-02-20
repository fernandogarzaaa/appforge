import * as fs from 'fs/promises';
import * as path from 'path';

export interface MutationHistoryEntry {
    cycle: number;
    score: number;
    timestamp: string;
}

export interface EvolutionStateData {
    totalCycles: number;
    totalPRsCreated: number;
    totalMerges: number;
    lastMutationScore: number;
    mutationHistory: MutationHistoryEntry[];
}

export class EvolutionState {
    private static STATE_PATH = path.join(process.cwd(), 'swarm', 'evolution_state.json');

    static async load(): Promise<EvolutionStateData> {
        try {
            const data = await fs.readFile(this.STATE_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Return default state if file doesn't exist
            return {
                totalCycles: 0,
                totalPRsCreated: 0,
                totalMerges: 0,
                lastMutationScore: 0,
                mutationHistory: []
            };
        }
    }

    static async save(state: EvolutionStateData): Promise<void> {
        // Ensure directory exists
        const dir = path.dirname(this.STATE_PATH);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(this.STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
    }
}
