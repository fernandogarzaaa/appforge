/**
 * 🐝 MULTI-SWARM COORDINATOR LAUNCHER v1.0 🐝
 * 
 * Direct Import Singleton for Multi-Swarm Coordination
 * Event-driven architecture with file-based channel messaging
 * Registers with all known swarms
 * 
 * Usage:
 *   import { swarmCoordinator, broadcast } from './swarm/core/swarm_coordinator_launcher.js';
 *   swarmCoordinator.broadcast('orchestrator', 'optimize', { target: 'latency' });
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import SWARM_CONFIGS
import { SWARM_CONFIGS } from './multi_swarm_coordinator.js';

// Known swarms registry
export const KNOWN_SWARMS = [
    'main',
    'finance',
    'crypto',
    'god',
    'social',
    'development',
    'monitoring',
    'analytics',
    'security',
    'deployment'
];

export interface SwarmRegistration {
    swarmId: string;
    name: string;
    status: 'online' | 'offline' | 'training' | 'error';
    registeredAt: string;
    lastHeartbeat: string;
    capabilities: string[];
}

export interface BroadcastResult {
    messageId: string;
    timestamp: string;
    command: string;
    recipients: string[];
    successful: string[];
    failed: string[];
    pending: string[];
}

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

/**
 * Multi-Swarm Coordinator Implementation (inline to avoid import issues)
 */
class SwarmCoordinatorImpl {
    private messageQueue: SwarmMessage[] = [];
    private swarmStatuses: Map<string, SwarmStatus> = new Map();
    private outputPath: string;
    
    constructor() {
        this.outputPath = path.join(__dirname, '..', 'multi_swarm_channel.json');
        this.initializeCoordinator();
    }
    
    private initializeCoordinator() {
        if (!fs.existsSync(this.outputPath)) {
            fs.writeFileSync(this.outputPath, JSON.stringify({
                messages: [],
                swarmStatuses: {},
                lastUpdated: new Date().toISOString()
            }, null, 2));
        }
        console.log('✅ [Coordinator] Multi-swarm coordinator initialized');
    }
    
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
    
    broadcast(from: string, type: SwarmMessage['type'], payload: any, priority: SwarmMessage['priority'] = 'normal'): void {
        Object.keys(SWARM_CONFIGS).forEach(swarmId => {
            if (swarmId !== from) {
                this.sendMessage(from, swarmId, type, payload, priority);
            }
        });
    }
    
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
    
    getAllStatuses(): SwarmStatus[] {
        return Array.from(this.swarmStatuses.values());
    }
    
    getMessagesForSwarm(swarmId: string): SwarmMessage[] {
        const messages = this.messageQueue.filter(m => m.to === swarmId && m.to !== m.from);
        this.messageQueue = this.messageQueue.filter(m => m.to !== swarmId);
        return messages;
    }
    
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
}

// Coordinator Singleton
let _coordinator: SwarmCoordinatorImpl | null = null;

/**
 * Get or create the Multi-Swarm Coordinator singleton
 */
export function getSwarmCoordinator(): SwarmCoordinatorImpl {
    if (!_coordinator) {
        _coordinator = new SwarmCoordinatorImpl();
        console.log('🐝 [SwarmLauncher] Multi-Swarm Coordinator singleton initialized');
    }
    return _coordinator;
}

/**
 * Broadcast a command to all registered swarms
 */
export function broadcast(
    command: string,
    payload: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
): string {
    const coordinator = getSwarmCoordinator();
    coordinator.broadcast('orchestrator', command as any, payload, priority);
    return `broadcast_${Date.now()}`;
}

/**
 * Send a message to a specific swarm
 */
export function sendMessage(
    swarmId: string,
    type: 'directive' | 'status' | 'request' | 'upgrade' | 'alert',
    payload: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
): string {
    const coordinator = getSwarmCoordinator();
    return coordinator.sendMessage('orchestrator', swarmId, type, payload, priority);
}

/**
 * Register a new swarm with the coordinator
 */
export function registerSwarm(swarmId: string, capabilities: string[]): SwarmRegistration {
    const coordinator = getSwarmCoordinator();
    const config = SWARM_CONFIGS[swarmId as keyof typeof SWARM_CONFIGS];
    const name = config?.name || swarmId;
    
    coordinator.registerStatus(swarmId, {
        status: 'online',
        tasksCompleted: 0,
        uptime: Date.now()
    });
    
    return {
        swarmId,
        name,
        status: 'online',
        registeredAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        capabilities
    };
}

/**
 * Get status of all registered swarms
 */
export function getAllSwarmStatuses(): any[] {
    const coordinator = getSwarmCoordinator();
    return coordinator.getAllStatuses();
}

/**
 * Get swarm coordinator status
 */
export function getCoordinatorStatus(): {
    initialized: boolean;
    registeredSwarms: number;
    messageQueueSize: number;
    channelPath: string;
    knownSwarms: string[];
} {
    const coordinator = getSwarmCoordinator();
    const statuses = coordinator.getAllStatuses();
    return {
        initialized: true,
        registeredSwarms: statuses.length,
        messageQueueSize: 0,
        channelPath: path.join(__dirname, '..', 'multi_swarm_channel.json'),
        knownSwarms: KNOWN_SWARMS
    };
}

/**
 * Check if coordinator is ready
 */
export function isReady(): boolean {
    return _coordinator !== null;
}

/**
 * Initialize coordinator with all known swarms
 */
export function initializeAllSwarms(): void {
    const coordinator = getSwarmCoordinator();
    
    // Register all known swarms
    const swarmConfigs = [
        { id: 'main', name: 'appforge-swarm-main', capabilities: ['sentinel', 'bug-hunter', 'optimizer', 'product-owner'] },
        { id: 'finance', name: 'appforge-swarm-finance', capabilities: ['analyst', 'strategist', 'opportunity-hunter'] },
        { id: 'crypto', name: 'appforge-swarm-crypto', capabilities: ['trader', 'blockchain-analyzer', 'market-predictor'] },
        { id: 'god', name: 'appforge-swarm-god', capabilities: ['architect', 'evolutionary-engine', 'knowledge-harvester'] },
        { id: 'social', name: 'appforge-swarm-social', capabilities: ['content-generator', 'sentiment-analyzer', 'engagement-optimizer'] },
        { id: 'development', name: 'appforge-swarm-dev', capabilities: ['code-generator', 'test-runner', 'refactorer'] },
        { id: 'monitoring', name: 'appforge-swarm-monitor', capabilities: ['health-check', 'alert-generator', 'metrics-collector'] },
        { id: 'analytics', name: 'appforge-swarm-analytics', capabilities: ['data-aggregator', 'trend-analyzer', 'report-generator'] },
        { id: 'security', name: 'appforge-swarm-security', capabilities: ['vulnerability-scanner', 'threat-detector', 'access-manager'] },
        { id: 'deployment', name: 'appforge-swarm-deploy', capabilities: ['deployer', 'rollback-manager', 'configurator'] }
    ];
    
    swarmConfigs.forEach(config => {
        try {
            registerSwarm(config.id, config.capabilities);
            console.log(`✅ [SwarmLauncher] Registered: ${config.name}`);
        } catch (error) {
            console.warn(`⚠️ [SwarmLauncher] Failed to register ${config.id}:`, error);
        }
    });
    
    console.log(`🚀 [SwarmLauncher] All ${swarmConfigs.length} swarms initialized`);
}

// Export launcher metadata
export const launcherInfo = {
    version: '1.0.0',
    type: 'Direct Import Singleton',
    architecture: 'Event-driven with file-based messaging',
    knownSwarms: KNOWN_SWARMS.length,
    exportedMethods: [
        'getSwarmCoordinator',
        'broadcast',
        'sendMessage',
        'registerSwarm',
        'getAllSwarmStatuses',
        'getCoordinatorStatus',
        'isReady',
        'initializeAllSwarms'
    ]
};

// Run self-test if executed directly
if (process.argv[1] === __filename) {
    console.log('🐝 [SwarmLauncher] Starting Multi-Swarm Coordinator...');
    
    const status = getCoordinatorStatus();
    console.log('📊 Initial Status:', JSON.stringify(status, null, 2));
    
    // Initialize all swarms
    console.log('\n🔧 Registering all known swarms...');
    initializeAllSwarms();
    
    const updatedStatus = getCoordinatorStatus();
    console.log('\n📊 Updated Status:', JSON.stringify(updatedStatus, null, 2));
    
    // Test broadcast
    console.log('\n📡 Testing broadcast command...');
    const messageId = broadcast('status_check', { timestamp: new Date().toISOString() });
    console.log('📨 Broadcast initiated:', messageId);
    
    console.log('\n✅ [SwarmLauncher] Self-test complete');
}

export default {
    getSwarmCoordinator,
    broadcast,
    sendMessage,
    registerSwarm,
    getAllSwarmStatuses,
    getCoordinatorStatus,
    isReady,
    initializeAllSwarms,
    KNOWN_SWARMS,
    launcherInfo
};
