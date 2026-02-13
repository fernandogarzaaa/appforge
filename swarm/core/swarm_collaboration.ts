/**
 * Swarm Collaboration System
 * 
 * Enables direct agent-to-agent communication without LLM tokens.
 * Uses quantum state, task signals, and message passing.
 */

import * as fs from 'fs/promises';
import path from 'path';

const SWARM_SIGNAL_FILE = path.join(process.cwd(), 'src/data/swarm_signals.json');
const COLLAB_CHANNEL_FILE = path.join(process.cwd(), 'src/data/collab_channel.json');

interface SwarmSignal {
    id: string;
    fromAgent: string;
    toAgent: string | 'ALL';
    type: 'TASK' | 'QUERY' | 'RESPONSE' | 'FINDING' | 'ALERT';
    payload: any;
    timestamp: string;
    status: 'PENDING' | 'PROCESSED' | 'ACKNOWLEDGED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface CollaborationMessage {
    id: string;
    from: string;
    to: string;
    subject: string;
    content: string;
    timestamp: string;
    acknowledged: boolean;
}

/**
 * Swarm Collaboration Manager
 * Enables token-free agent communication
 */
export class SwarmCollaboration {
    private signals: Map<string, SwarmSignal>;
    private messages: Map<string, CollaborationMessage>;
    private agentCallbacks: Map<string, (signal: SwarmSignal) => void>;
    private collectiveMembers: Map<string, string[]>;

    constructor() {
        this.signals = new Map();
        this.messages = new Map();
        this.agentCallbacks = new Map();
        this.collectiveMembers = new Map();
        this.loadFromDisk();
    }

    /**
     * Register an agent to receive signals
     */
    registerAgent(agentName: string, callback: (signal: SwarmSignal) => void): void {
        this.agentCallbacks.set(agentName, callback);
        console.log(`🤝 [Collab] Agent registered: ${agentName}`);
    }

    /**
     * Register a swarm collective (multi-agent team) to receive signals.
     */
    registerCollective(collectiveName: string, members: string[], callback: (signal: SwarmSignal) => void): void {
        const normalizedMembers = Array.from(
            new Set(
                members
                    .map((member) => String(member || '').trim())
                    .filter((member) => member.length > 0)
            )
        );

        const effectiveMembers = normalizedMembers.length >= 2
            ? normalizedMembers
            : ['coordinator_cell', 'execution_cell'];

        this.collectiveMembers.set(collectiveName, effectiveMembers);
        this.agentCallbacks.set(collectiveName, callback);

        console.log(`🤝 [Collab] Collective registered: ${collectiveName} (${effectiveMembers.length} members)`);
    }

    /**
     * Send a signal to another agent
     */
    /**
     * Trigger callbacks for a signal safely
     */
    async triggerCallbacks(signal: SwarmSignal): Promise<void> {
        if (signal.toAgent === 'ALL') {
            const promises = Array.from(this.agentCallbacks.entries())
                .filter(([agentName]) => agentName !== signal.fromAgent)
                .map(async ([agentName, callback]) => {
                    try {
                        await callback(signal);
                    } catch (error: any) {
                        console.error(`❌ [Collab] Callback failed for agent ${agentName}:`, error.message);
                    }
                });
            await Promise.all(promises);
        } else {
            const callback = this.agentCallbacks.get(signal.toAgent);
            if (callback) {
                try {
                    await callback(signal);
                } catch (error: any) {
                    console.error(`❌ [Collab] Callback failed for agent ${signal.toAgent}:`, error.message);
                }
            }
        }
    }

    /**
     * Send a new signal and trigger its callbacks
     */
    async sendSignal(signal: Omit<SwarmSignal, 'id' | 'timestamp' | 'status'>): Promise<string> {
        const id = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const fullSignal: SwarmSignal = {
            ...signal,
            id,
            timestamp: new Date().toISOString(),
            status: 'PENDING'
        };

        this.signals.set(id, fullSignal);
        await this.persistSignals();

        console.log(`📡 [Collab] Signal sent: ${signal.fromAgent} → ${signal.toAgent} (${signal.type})`);

        // Trigger callbacks asynchronously
        this.triggerCallbacks(fullSignal).catch(err =>
            console.error('❌ [Collab] Fatal error in triggerCallbacks:', err.message)
        );

        return id;
    }

    /**
     * Query another agent for information
     */
    async queryAgent(fromAgent: string, toAgent: string, question: string): Promise<any> {
        const signalId = await this.sendSignal({
            fromAgent: fromAgent,
            toAgent: toAgent,
            type: 'QUERY',
            payload: { question },
            priority: 'MEDIUM'
        });

        // Return delivery confirmation only. Query responses arrive asynchronously via RESPONSE signals.
        return {
            signalId,
            response: `Query dispatched to ${toAgent}. Awaiting asynchronous RESPONSE signal.`,
            note: 'Token-free collaboration query queued (no simulated response body).'
        };
    }

    /**
     * Broadcast finding to all agents
     */
    async broadcastFinding(agentName: string, finding: any): Promise<void> {
        await this.sendSignal({
            fromAgent: agentName,
            toAgent: 'ALL',
            type: 'FINDING',
            payload: finding,
            priority: 'MEDIUM'
        });
    }

    /**
     * Send alert to all agents
     */
    async sendAlert(agentName: string, alert: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): Promise<void> {
        await this.sendSignal({
            fromAgent: agentName,
            toAgent: 'ALL',
            type: 'ALERT',
            payload: { alert, severity },
            priority: severity
        });
    }

    /**
     * Mark signal as processed
     */
    async acknowledgeSignal(signalId: string): Promise<void> {
        const signal = this.signals.get(signalId);
        if (signal) {
            signal.status = 'ACKNOWLEDGED';
            await this.persistSignals();
        }
    }

    /**
     * Get pending signals for an agent
     */
    getPendingSignals(agentName: string): SwarmSignal[] {
        return Array.from(this.signals.values()).filter(
            s => (s.toAgent === agentName || s.toAgent === 'ALL') && s.status === 'PENDING'
        );
    }

    /**
     * Get all signals
     */
    getAllSignals(): SwarmSignal[] {
        return Array.from(this.signals.values());
    }

    /**
     * Clear old signals (older than 24 hours)
     */
    async clearOldSignals(): Promise<number> {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000);
        let removed = 0;

        for (const [id, signal] of this.signals) {
            if (new Date(signal.timestamp).getTime() < cutoff) {
                this.signals.delete(id);
                removed++;
            }
        }

        if (removed > 0) {
            await this.persistSignals();
            console.log(`🧹 [Collab] Cleared ${removed} old signals`);
        }

        return removed;
    }

    /**
     * Get collaboration stats
     */
    getStats(): any {
        const pending = Array.from(this.signals.values()).filter(s => s.status === 'PENDING');
        const agentNames = Array.from(this.agentCallbacks.keys());
        const collectiveNames = Array.from(this.collectiveMembers.keys());
        const individualAgentNames = agentNames.filter((name) => !this.collectiveMembers.has(name));

        return {
            totalSignals: this.signals.size,
            pendingSignals: pending.length,
            registeredAgents: this.agentCallbacks.size,
            agentNames,
            registeredCollectives: collectiveNames.length,
            collectiveNames,
            collectiveMembers: collectiveNames.reduce<Record<string, string[]>>((acc, name) => {
                acc[name] = [...(this.collectiveMembers.get(name) || [])];
                return acc;
            }, {}),
            registeredIndividualAgents: individualAgentNames.length,
            individualAgentNames
        };
    }

    /**
     * Persist signals to disk
     */
    private async persistSignals(): Promise<void> {
        try {
            const data = Array.from(this.signals.values());
            await fs.writeFile(SWARM_SIGNAL_FILE, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ [Collab] Failed to persist signals:', error);
        }
    }

    /**
     * Load signals from disk
     */
    private async loadFromDisk(): Promise<void> {
        try {
            const data = await fs.readFile(SWARM_SIGNAL_FILE, 'utf8');
            const signals = JSON.parse(data);
            signals.forEach((s: SwarmSignal) => this.signals.set(s.id, s));
            console.log(`📚 [Collab] Loaded ${this.signals.size} signals`);
        } catch (error) {
            // File doesn't exist yet
        }
    }
}

// Export singleton instance
export const swarmCollaboration = new SwarmCollaboration();

export default swarmCollaboration;
