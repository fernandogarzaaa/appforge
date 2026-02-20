/**
 * Multi-Swarm Coordinator
 * 
 * Manages multiple swarms with different objectives and enables
 * inter-swarm communication and coordination.
 */

import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swarm definitions
export const SWARM_CONFIGS = {
    main: {
        name: 'appforge-swarm-main',
        objective: 'Default admin-controlled operations',
        priority: 1,
        color: '🟢',
        agents: ['Sentinel', 'BugHunter', 'Optimizer', 'ProductOwner', 'GodMode', 'Antigravity']
    },
    finance: {
        name: 'appforge-swarm-finance',
        objective: 'Revenue generation and financial optimization',
        priority: 2,
        color: '💰',
        agents: ['Analyst', 'Strategist', 'OpportunityHunter']
    },
    crypto: {
        name: 'appforge-swarm-crypto',
        objective: 'Cryptocurrency trading and blockchain analysis',
        priority: 3,
        color: '🪙',
        agents: ['Trader', 'BlockchainAnalyzer', 'MarketPredictor']
    },
    god: {
        name: 'appforge-swarm-god',
        objective: 'Self-evolution and swarm coordination',
        priority: 4,
        color: '🌌',
        agents: ['Architect', 'EvolutionaryEngine', 'KnowledgeHarvester', 'UpgradeDistributor']
    }
};

interface SwarmMessage {
    id: string;
    from: string;
    to: string;
    type: 'directive' | 'status' | 'request' | 'upgrade' | 'alert';
    payload: any;
    timestamp: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
}

interface SwarmStatus {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'training' | 'error';
    uptime: number;
    tasksCompleted: number;
    lastUpdate: string;
}

export class MultiSwarmCoordinator {
    private messageQueue: SwarmMessage[] = [];
    private swarmStatuses: Map<string, SwarmStatus> = new Map();
    private outputPath: string;
    private interSwarmChannel: string;

    constructor() {
        this.outputPath = path.join(__dirname, '..', 'multi_swarm_channel.json');
        this.interSwarmChannel = path.join(__dirname, '..', 'swarm_intercomms.json');
        this.initializeCoordinator();
    }

    private initializeCoordinator() {
        // Initialize channel file
        if (!fs.existsSync(this.outputPath)) {
            fs.writeFileSync(this.outputPath, JSON.stringify({
                messages: [],
                swarmStatuses: {},
                lastUpdated: new Date().toISOString()
            }, null, 2));
        }
        console.log('✅ [Coordinator] Multi-swarm coordinator initialized');
    }

    /**
     * Send message between swarms
     */
    sendMessage(from: string, to: string, type: SwarmMessage['type'], payload: any, priority: SwarmMessage['priority'] = 'normal'): string {
        const message: SwarmMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from,
            to,
            type,
            payload,
            timestamp: new Date().toISOString(),
            priority
        };

        this.messageQueue.push(message);
        this.persistMessage(message);
        console.log(`📨 [Coordinator] Message from ${from} to ${to}: ${type}`);

        return message.id;
    }

    /**
     * Broadcast message to all swarms
     */
    broadcast(from: string, type: SwarmMessage['type'], payload: any, priority: SwarmMessage['priority'] = 'normal'): void {
        Object.keys(SWARM_CONFIGS).forEach(swarmId => {
            if (swarmId !== from) {
                this.sendMessage(from, swarmId, type, payload, priority);
            }
        });
    }

    /**
     * Register swarm status
     */
    registerStatus(swarmId: string, status: Partial<SwarmStatus>): void {
        const currentStatus = this.swarmStatuses.get(swarmId) || {
            id: swarmId,
            name: SWARM_CONFIGS[swarmId as keyof typeof SWARM_CONFIGS]?.name || swarmId,
            status: 'offline',
            uptime: 0,
            tasksCompleted: 0,
            lastUpdate: new Date().toISOString()
        };

        this.swarmStatuses.set(swarmId, { ...currentStatus, ...status, lastUpdate: new Date().toISOString() });
        this.persistStatuses();
    }

    /**
     * Get all swarm statuses
     */
    getAllStatuses(): SwarmStatus[] {
        return Array.from(this.swarmStatuses.values());
    }

    /**
     * Process pending messages for a swarm
     */
    getMessagesForSwarm(swarmId: string): SwarmMessage[] {
        const messages = this.messageQueue.filter(m => m.to === swarmId && m.to !== m.from);
        this.messageQueue = this.messageQueue.filter(m => m.to !== swarmId);
        return messages;
    }

    /**
     * Persist message to channel file
     */
    private persistMessage(message: SwarmMessage): void {
        try {
            const data = fs.existsSync(this.outputPath)
                ? JSON.parse(fs.readFileSync(this.outputPath, 'utf8'))
                : { messages: [], swarmStatuses: {}, lastUpdated: new Date().toISOString() };

            data.messages = data.messages || [];
            data.messages.push(message);
            data.lastUpdated = new Date().toISOString();

            fs.writeFileSync(this.outputPath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('❌ [Coordinator] Failed to persist message:', e);
        }
    }

    /**
     * Persist swarm statuses
     */
    private persistStatuses(): void {
        try {
            const statuses: Record<string, SwarmStatus> = {};
            this.swarmStatuses.forEach((status, id) => {
                statuses[id] = status;
            });

            const data = fs.existsSync(this.outputPath)
                ? JSON.parse(fs.readFileSync(this.outputPath, 'utf8'))
                : { messages: [], swarmStatuses: {}, lastUpdated: new Date().toISOString() };

            data.swarmStatuses = statuses;
            data.lastUpdated = new Date().toISOString();

            fs.writeFileSync(this.outputPath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('❌ [Coordinator] Failed to persist statuses:', e);
        }
    }

    /**
     * Generate swarm report
     */
    generateReport(): string {
        const statuses = this.getAllStatuses();
        let report = `📊 **MULTI-SWARM STATUS REPORT**\n\n`;

        Object.entries(SWARM_CONFIGS).forEach(([id, config]) => {
            const status = this.swarmStatuses.get(id);
            const emoji = status?.status === 'online' ? '🟢' : '🔴';
            report += `${emoji} **${config.name}**\n`;
            report += `   Objective: ${config.objective}\n`;
            report += `   Status: ${status?.status || 'Not registered'}\n`;
            if (status?.uptime) {
                report += `   Uptime: ${Math.floor(status.uptime / 60)}m\n`;
            }
            report += `   Agents: ${config.agents.join(', ')}\n\n`;
        });

        return report;
    }
}

export const multiSwarmCoordinator = new MultiSwarmCoordinator();
