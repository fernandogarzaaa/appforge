import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

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
        totalInceptionValue: number;
    };
    excellenceIndex: number; // 0.0 to 1.0 (Quality score)
    lastUpdate: string;
    _vectorClock?: Record<string, number>;
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
                bountiesResolved: 0,
                totalInceptionValue: 0
            },
            excellenceIndex: 0.5, // Start at baseline
            lastUpdate: new Date().toISOString(),
            _vectorClock: { [process.env.NODE_ID || 'CORE']: 1 }
        };
    }

    /**
     * Initialize the engine by loading the state.
     */
    async init(): Promise<void> {
        try {
            const content = await fs.readFile(this.statePath, 'utf8');
            const loaded = JSON.parse(content);
            this.state = { ...this.state, ...loaded, metrics: { ...this.state.metrics, ...loaded.metrics } };
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
        this.calculateExcellenceIndex();
        await this.save();
    }

    /**
     * Attributes value specifically for new "Inceptions"
     */
    async attributeInceptionValue(amount: number): Promise<void> {
        this.state.metrics.totalInceptionValue += amount;
        this.state.totalValue += amount * 0.2;
        this.calculateExcellenceIndex();
        await this.save();
    }

    /**
     * Updates the Excellence Index based on swarm performance
     */
    private calculateExcellenceIndex() {
        const patchSuccessRate = this.state.metrics.successfulPatches / (this.state.metrics.cyclesCompleted || 1);
        const bountyWeight = Math.min(1.0, this.state.metrics.bountiesResolved / 10);

        // Balanced score: 40% patch stability, 40% bounty completion, 20% total value growth
        const newValue = (patchSuccessRate * 0.4) + (bountyWeight * 0.4) + (Math.min(1.0, this.state.totalValue / 5000) * 0.2);

        this.state.excellenceIndex = Math.min(1.0, newValue);
    }

    /**
     * Save the state to disk.
     */
    private async save(): Promise<void> {
        const nodeId = process.env.NODE_ID || 'CORE';
        if (!this.state._vectorClock) this.state._vectorClock = {};
        this.state._vectorClock[nodeId] = (this.state._vectorClock[nodeId] || 0) + 1;

        await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf8');
    }

    /**
     * Calculates the optimal bounty reward based on policy optimization.
     * Formula: max_pi E_pi [ sum_{t=0}^T gamma^t * r_t ]
     * Ensures agents prioritize tasks with highest long-term Sovereign Utility.
     */
    calculateOptimalReward(baseValue: number, priority: number): number {
        const gamma = 0.95; // Discount factor for long-term utility
        const horizon = 10; // Tactical horizon

        // Simplified policy estimation: baseValue * priority * discounted growth factor
        let estimatedUtility = 0;
        for (let t = 0; t < horizon; t++) {
            estimatedUtility += Math.pow(gamma, t) * (baseValue * priority);
        }

        return Math.round(estimatedUtility / 5); // Normalized for swarm economy
    }

    /**
     * Get current state.
     */
    getState(): EconomicState {
        return { ...this.state };
    }
}
