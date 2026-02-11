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

    constructor() {
        this.signals = new Map();
        this.messages = new Map();
        this.agentCallbacks = new Map();
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
     * Send a signal to another agent
     */
    async sendSignal(signal: Omit<SwarmSignal, 'id' | 'timestamp' | 'status'>): Promise<string> {
        const id = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullSignal: SwarmSignal = {
            ...signal,
            id,
            timestamp: new Date().toISOString(),
            status: 'PENDING'
        };

        this.signals.set(id, fullSignal);
        await this.persistSignals();

        console.log(`📡 [Collab] Signal sent: ${signal.fromAgent} → ${signal.toAgent} (${signal.type})`);

        // If target is 'ALL', notify all registered agents
        if (signal.toAgent === 'ALL') {
            this.agentCallbacks.forEach((callback, agentName) => {
                if (agentName !== signal.fromAgent) {
                    callback(fullSignal);
                }
            });
        } else {
            // Notify specific agent
            const callback = this.agentCallbacks.get(signal.toAgent);
            if (callback) {
                callback(fullSignal);
            }
        }

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

        // For now, return a simulated response (in production, would wait for response)
        return {
            signalId,
            response: `Query sent to ${toAgent}. Awaiting response...`,
            note: 'This is a token-free collaboration query.'
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
        return {
            totalSignals: this.signals.size,
            pendingSignals: pending.length,
            registeredAgents: this.agentCallbacks.size,
            agentNames: Array.from(this.agentCallbacks.keys())
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
