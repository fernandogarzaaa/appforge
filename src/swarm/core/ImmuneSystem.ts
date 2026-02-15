
import fs from 'fs';
import path from 'path';
import { broadcastLog } from '../../logger.js';
import { Orchestrator } from '../orchestrator.js';

export interface RefactorIntent {
    file: string;
    metric: string;
    timestamp: string;
    status: 'PENDING_REVIEW' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export class ImmuneSystem {
    private BACKLOG_PATH = path.resolve(process.cwd(), 'memory/architect_backlog.json');
    private orchestrator: Orchestrator;

    constructor() {
        this.orchestrator = new Orchestrator();
    }

    /**
     * startHealingPulse:
     * Periodically checks the backlog and executes refactoring tasks.
     */
    async startHealingPulse() {
        broadcastLog('IMMUNE_SYSTEM', 'Immune System Pulse: Active.', 'INFO');

        const backlog = this.loadBacklog();
        const pending = backlog.filter(item => item.status === 'PENDING_REVIEW');

        if (pending.length === 0) {
            broadcastLog('IMMUNE_SYSTEM', 'No infections detected. System is healthy.', 'SUCCESS');
            return;
        }

        broadcastLog('IMMUNE_SYSTEM', `Detected ${pending.length} logic inconsistencies. Initiating Turbo-Heal [PHASE 45]...`, 'WARN');

        // Batched Parallel Execution (Max 4)
        const BATCH_SIZE = 4;
        for (let i = 0; i < pending.length; i += BATCH_SIZE) {
            const batch = pending.slice(i, i + BATCH_SIZE);
            broadcastLog('IMMUNE_SYSTEM', `Turbo-Heal: Processing Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pending.length / BATCH_SIZE)}`, 'INFO');
            await Promise.all(batch.map(item => this.heal(item)));
        }
    }

    private loadBacklog(): RefactorIntent[] {
        if (!fs.existsSync(this.BACKLOG_PATH)) return [];
        try {
            return JSON.parse(fs.readFileSync(this.BACKLOG_PATH, 'utf-8'));
        } catch (e) {
            return [];
        }
    }

    private saveBacklog(backlog: RefactorIntent[]) {
        fs.writeFileSync(this.BACKLOG_PATH, JSON.stringify(backlog, null, 2));
    }

    private async heal(item: RefactorIntent) {
        broadcastLog('IMMUNE_SYSTEM', `Healing ${path.basename(item.file)} (Metric: ${item.metric})`, 'INFO');

        const backlog = this.loadBacklog();
        const index = backlog.findIndex(b => b.file === item.file && b.timestamp === item.timestamp);

        if (index === -1) return;

        backlog[index].status = 'IN_PROGRESS';
        this.saveBacklog(backlog);

        try {
            const taskDescription = `REFAC_HEAL: Refactor ${item.file} to fix ${item.metric} violation and optimize for Sovereign Safety.`;

            // Execute task via Orchestrator (which enforces Handshake and Oracle)
            await this.orchestrator.executeTask(taskDescription, 'standard');

            const updatedBacklog = this.loadBacklog();
            updatedBacklog[index].status = 'COMPLETED';
            this.saveBacklog(updatedBacklog);

            broadcastLog('IMMUNE_SYSTEM', `Successfully healed ${path.basename(item.file)}.`, 'SUCCESS');
        } catch (error: any) {
            broadcastLog('IMMUNE_SYSTEM', `Healing Failed for ${path.basename(item.file)}: ${error.message}`, 'CRITICAL');

            const updatedBacklog = this.loadBacklog();
            updatedBacklog[index].status = 'FAILED';
            this.saveBacklog(updatedBacklog);
        }
    }
}
