import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

export interface Bounty {
    id: string;
    description: string;
    priority: number; // 0.0 to 1.0
    status: 'backlog' | 'assigned' | 'completed' | 'verified';
    reward: number; // "Value" units
    category: 'code' | 'docs' | 'telemetry' | 'optimization';
    assignedAgent?: string;
    createdAt: string;
    completedAt?: string;
}

/**
 * ⚛️ Bounty Registry
 * Manages the autonomous growth tasks identified by the Swarm.
 */
export class BountyRegistry {
    private ledgerPath: string;
    private bounties: Bounty[] = [];

    private vectorClock: Record<string, number> = { [process.env.NODE_ID || 'CORE']: 1 };

    constructor() {
        this.ledgerPath = path.join(PROJECT_ROOT, 'src/data/bounty_ledger.json');
    }

    /**
     * Initialize the registry by loading from the ledger.
     */
    async init(): Promise<void> {
        try {
            const content = await fs.readFile(this.ledgerPath, 'utf8');
            const loaded = JSON.parse(content);
            if (Array.isArray(loaded)) {
                // Legacy migration
                this.bounties = loaded;
            } else {
                // New format with vector clocks
                this.bounties = loaded.bounties || [];
                if (loaded._vectorClock) this.vectorClock = loaded._vectorClock;
            }
        } catch (error) {
            this.bounties = [];
            await this.save();
        }
    }

    /**
     * Add a new bounty to the registry.
     */
    async addBounty(bounty: Omit<Bounty, 'id' | 'createdAt' | 'status'>): Promise<Bounty> {
        const newBounty: Bounty = {
            ...bounty,
            id: `BTY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: 'backlog',
            createdAt: new Date().toISOString()
        };
        this.bounties.push(newBounty);
        await this.save();
        return newBounty;
    }

    /**
     * Get the highest priority pending bounty.
     */
    getHighestPriorityBounty(): Bounty | undefined {
        return this.bounties
            .filter(b => b.status === 'backlog')
            .sort((a, b) => b.priority - a.priority)[0];
    }

    /**
     * Update bounty status.
     */
    async updateStatus(id: string, status: Bounty['status']): Promise<boolean> {
        const bounty = this.bounties.find(b => b.id === id);
        if (bounty) {
            bounty.status = status;
            if (status === 'completed') bounty.completedAt = new Date().toISOString();
            await this.save();
            return true;
        }
        return false;
    }

    /**
     * Save the ledger to disk.
     */
    private async save(): Promise<void> {
        const nodeId = process.env.NODE_ID || 'CORE';
        this.vectorClock[nodeId] = (this.vectorClock[nodeId] || 0) + 1;

        const payload = {
            _vectorClock: this.vectorClock,
            bounties: this.bounties
        };
        await fs.writeFile(this.ledgerPath, JSON.stringify(payload, null, 2), 'utf8');
    }

    /**
     * Get all bounties.
     */
    getBounties(): Bounty[] {
        return [...this.bounties];
    }
}
