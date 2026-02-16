import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

export interface EconomicState {
    totalValue: number;
    availableBudget: number;
    realizationCost: number;
    metrics: {
        cyclesCompleted: number;
        successfulPatches: number;
        bountiesResolved: number;
    };
    lastUpdate: string;
}

/**
 * ⚛️ Economic Engine
 * Manages the Swarm's "internal economy" and budgets for self-evolution.
 */
export class EconomicEngine {
    private statePath: string;
    private state: EconomicState;

    constructor() {
        this.statePath = path.join(PROJECT_ROOT, 'src/data/economic_state.json');
        this.state = {
            totalValue: 0,
            availableBudget: 100, // Initial seed
            realizationCost: 10,
            metrics: {
                cyclesCompleted: 0,
                successfulPatches: 0,
                bountiesResolved: 0
            },
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Initialize the engine by loading the state.
     */
    async init(): Promise<void> {
        try {
            const content = await fs.readFile(this.statePath, 'utf8');
            this.state = JSON.parse(content);
        } catch (error) {
            await this.save();
        }
    }

    /**
     * Attribute value to the Swarm based on an outcome.
     */
    async attributeValue(amount: number): Promise<void> {
        this.state.totalValue += amount;
        this.state.availableBudget += amount * 0.5; // Reinvest 50% into budget
        this.state.lastUpdate = new Date().toISOString();
        await this.save();
    }

    /**
     * Check if the Swarm can afford a realization.
     */
    canAffordRealization(): boolean {
        return this.state.availableBudget >= this.state.realizationCost;
    }

    /**
     * Record a successful realization.
     */
    async recordRealization(): Promise<void> {
        if (this.canAffordRealization()) {
            this.state.availableBudget -= this.state.realizationCost;
            this.state.metrics.successfulPatches++;
            this.state.lastUpdate = new Date().toISOString();
            await this.save();
        }
    }

    /**
     * Record a resolved bounty.
     */
    async recordBountyResolved(reward: number): Promise<void> {
        this.state.totalValue += reward;
        this.state.availableBudget += reward; // 100% of bounty reward goes to budget
        this.state.metrics.bountiesResolved++;
        this.state.lastUpdate = new Date().toISOString();
        await this.save();
    }

    /**
     * Increment cycle count.
     */
    async incrementCycle(): Promise<void> {
        this.state.metrics.cyclesCompleted++;
        await this.save();
    }

    /**
     * Save the state to disk.
     */
    private async save(): Promise<void> {
        await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf8');
    }

    /**
     * Get current state.
     */
    getState(): EconomicState {
        return { ...this.state };
    }
}
