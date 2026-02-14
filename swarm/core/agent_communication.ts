/**
 * 🤖 AGENT COMMUNICATION PROTOCOL
 * 
 * Multi-agent communication with quantum-entangled channels
 * Features:
 * - Quantum-entangled message channels
 * - Coherence-based message validation
 * - Swarm consensus protocol
 * - Real-time agent coordination
 */

import { EventEmitter } from 'events';
import { secureRandom } from './secure_entropy.js';

// ============================================================================
// TYPES
// ============================================================================

interface Agent {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    coherence: number;
    status: 'idle' | 'busy' | 'offline';
    lastSeen: number;
}

interface Message {
    id: string;
    senderId: string;
    recipientId?: string;
    channelId: string;
    type: MessageType;
    payload: any;
    priority: 'critical' | 'high' | 'medium' | 'low';
    coherence: number;
    timestamp: number;
    signature?: string;
}

type MessageType = 
    | 'task_request'
    | 'task_response'
    | 'status_update'
    | 'capability_discovery'
    | 'coherence_sync'
    | 'consensus_proposal'
    | 'consensus_vote'
    | 'error'
    | 'heartbeat';

interface Channel {
    id: string;
    name: string;
    type: 'broadcast' | 'unicast' | 'multicast' | 'entangled';
    participants: Set<string>;
    coherence: number;
    messageHistory: Message[];
    maxHistory: number;
}

interface ConsensusProposal {
    id: string;
    channelId: string;
    proposerId: string;
    proposal: any;
    votes: Map<string, 'accept' | 'reject' | 'abstain'>;
    quorum: number;
    deadline: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

interface CommunicationConfig {
    coherenceThreshold: number;
    messageTimeout: number;
    heartbeatInterval: number;
    maxRetries: number;
    entangledPairs: Map<string, string>;
}

// ============================================================================
// QUANTUM ENTANGLED CHANNEL
// ============================================================================

class QuantumEntangledChannel extends EventEmitter {
    private agentA: string;
    private agentB: string;
    private coherence: number = 0.95;
    private messageBuffer: Message[] = [];
    private entanglementStrength: number = 0.9;

    constructor(agentA: string, agentB: string) {
        super();
        this.agentA = agentA;
        this.agentB = agentB;
    }

    /**
     * Send message through entangled channel
     */
    async send(message: Omit<Message, 'id' | 'timestamp' | 'coherence'>): Promise<Message> {
        const fullMessage: Message = {
            ...message,
            id: `msg_${Date.now()}_${secureRandomRange(0, 10000)}`,
            timestamp: Date.now(),
            coherence: this.coherence
        };

        // Add to buffer (simulated entangled transmission)
        this.messageBuffer.push(fullMessage);
        this.emit('messageSent', fullMessage);

        return fullMessage;
    }

    /**
     * Receive message from entangled channel
     */
    async receive(): Promise<Message | null> {
        if (this.messageBuffer.length === 0) return null;
        return this.messageBuffer.shift() || null;
    }

    /**
     * Get channel coherence
     */
    getCoherence(): number {
        return this.coherence;
    }

    /**
     * Update entanglement strength
     */
    updateEntanglement(strength: number): void {
        this.entanglementStrength = Math.max(0, Math.min(1, strength));
        this.coherence = this.entanglementStrength * 0.95 + 0.05;
    }
}

// ============================================================================
// AGENT COMMUNICATION MANAGER
// ============================================================================

export class AgentCommunicationManager extends EventEmitter {
    private agents: Map<string, Agent> = new Map();
    private channels: Map<string, Channel> = new Map();
    private proposals: Map<string, ConsensusProposal> = new Map();
    private entangledChannels: Map<string, QuantumEntangledChannel> = new Map();
    private config: CommunicationConfig;
    private messageCounter: number = 0;
    private coherenceValidator: CoherenceValidator;
    private messageRouter: MessageRouter;

    constructor(config?: Partial<CommunicationConfig>) {
        super();
        this.config = {
            coherenceThreshold: config?.coherenceThreshold ?? 0.85,
            messageTimeout: config?.messageTimeout ?? 30000,
            heartbeatInterval: config?.heartbeatInterval ?? 5000,
            maxRetries: config?.maxRetries ?? 3,
            entangledPairs: config?.entangledPairs ?? new Map()
        };
        this.coherenceValidator = new CoherenceValidator(this.config.coherenceThreshold);
        this.messageRouter = new MessageRouter(this);

        // Start heartbeat monitor
        this.startHeartbeatMonitor();
    }

    // ============================================================================
    // AGENT MANAGEMENT
    // ============================================================================

    /**
     * Register an agent
     */
    registerAgent(agent: Omit<Agent, 'coherence' | 'status' | 'lastSeen'>): void {
        const fullAgent: Agent = {
            ...agent,
            coherence: 0.95,
            status: 'idle',
            lastSeen: Date.now()
        };
        
        this.agents.set(agent.id, fullAgent);
        this.emit('agentRegistered', { agentId: agent.id, agent: fullAgent });

        // Create personal channel for agent
        this.createChannel({
            id: `channel_${agent.id}`,
            name: `${agent.name} Personal Channel`,
            type: 'unicast',
            participants: new Set([agent.id]),
            maxHistory: 100
        });
    }

    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): boolean {
        const agent = this.agents.get(agentId);
        if (!agent) return false;

        this.agents.delete(agentId);
        this.emit('agentUnregistered', { agentId });

        return true;
    }

    /**
     * Get agent by ID
     */
    getAgent(agentId: string): Agent | undefined {
        return this.agents.get(agentId);
    }

    /**
     * List all agents
     */
    listAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Find agents by capability
     */
    findByCapability(capability: string): Agent[] {
        return Array.from(this.agents.values())
            .filter(a => a.capabilities.includes(capability));
    }

    // ============================================================================
    // CHANNEL MANAGEMENT
    // ============================================================================

    /**
     * Create a communication channel
     */
    createChannel(config: Omit<Channel, 'id' | 'coherence' | 'messageHistory'>): Channel {
        const channel: Channel = {
            ...config,
            id: config.id,
            coherence: 0.95,
            messageHistory: []
        };
        
        this.channels.set(channel.id, channel);
        this.emit('channelCreated', { channelId: channel.id, channel });
        
        return channel;
    }

    /**
     * Join channel
     */
    joinChannel(agentId: string, channelId: string): boolean {
        const channel = this.channels.get(channelId);
        const agent = this.agents.get(agentId);
        
        if (!channel || !agent) return false;
        
        channel.participants.add(agentId);
        this.emit('agentJoinedChannel', { agentId, channelId });
        
        return true;
    }

    /**
     * Leave channel
     */
    leaveChannel(agentId: string, channelId: string): boolean {
        const channel = this.channels.get(channelId);
        
        if (!channel) return false;
        
        channel.participants.delete(agentId);
        this.emit('agentLeftChannel', { agentId, channelId });
        
        return true;
    }

    /**
     * Create entangled channel between two agents
     */
    createEntangledChannel(agentAId: string, agentBId: string): QuantumEntangledChannel {
        const channel = new QuantumEntangledChannel(agentAId, agentBId);
        const channelId = `entangled_${agentAId}_${agentBId}`;
        
        this.entangledChannels.set(channelId, channel);
        this.config.entangledPairs.set(agentAId, agentBId);
        this.config.entangledPairs.set(agentBId, agentAId);
        
        this.emit('entangledChannelCreated', { agentAId, agentBId, channelId });
        
        return channel;
    }

    // ============================================================================
    // MESSAGE SENDING
    // ============================================================================

    /**
     * Send a message
     */
    async send(
        senderId: string,
        channelId: string,
        type: MessageType,
        payload: any,
        priority: Message['priority'] = 'medium',
        recipientId?: string
    ): Promise<Message> {
        const sender = this.agents.get(senderId);
        if (!sender) {
            throw new Error(`Sender not found: ${senderId}`);
        }

        // Validate coherence
        if (sender.coherence < this.config.coherenceThreshold) {
            throw new Error('Sender coherence below threshold');
        }

        const message: Message = {
            id: `msg_${++this.messageCounter}_${Date.now()}`,
            senderId,
            recipientId,
            channelId,
            type,
            payload,
            priority,
            coherence: sender.coherence,
            timestamp: Date.now()
        };

        // Route message
        await this.messageRouter.route(message);

        return message;
    }

    /**
     * Broadcast message to channel
     */
    async broadcast(
        senderId: string,
        channelId: string,
        type: MessageType,
        payload: any,
        priority: Message['priority'] = 'medium'
    ): Promise<Message[]> {
        const messages: Message[] = [];
        const channel = this.channels.get(channelId);
        
        if (!channel) {
            throw new Error(`Channel not found: ${channelId}`);
        }

        // Create message
        const message = await this.send(senderId, channelId, type, payload, priority);
        messages.push(message);

        return messages;
    }

    // ============================================================================
    // SWARM CONSENSUS
    // ============================================================================

    /**
     * Propose consensus
     */
    async proposeConsensus(
        proposerId: string,
        channelId: string,
        proposal: any,
        quorum: number = 3
    ): Promise<ConsensusProposal> {
        const proposalId = `proposal_${Date.now()}_${secureRandomRange(0, 10000)}`;
        
        const consensusProposal: ConsensusProposal = {
            id: proposalId,
            channelId,
            proposerId,
            proposal,
            votes: new Map(),
            quorum,
            deadline: Date.now() + this.config.messageTimeout,
            status: 'pending'
        };

        this.proposals.set(proposalId, consensusProposal);

        // Request votes
        await this.send(proposerId, channelId, 'consensus_proposal', {
            proposalId,
            proposal,
            deadline: consensusProposal.deadline
        }, 'high');

        // Start vote collection
        this.collectVotes(proposalId);

        return consensusProposal;
    }

    /**
     * Collect votes for proposal
     */
    private async collectVotes(proposalId: string): Promise<void> {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) return;

        // Wait for votes or deadline
        const checkInterval = setInterval(async () => {
            // Check deadline
            if (Date.now() > proposal.deadline) {
                clearInterval(checkInterval);
                proposal.status = this.countVotes(proposal) >= proposal.quorum ? 
                    'accepted' : 'expired';
                this.emit('consensusComplete', { proposalId, status: proposal.status });
            }
        }, 100);
    }

    /**
     * Submit vote
     */
    submitVote(agentId: string, proposalId: string, vote: 'accept' | 'reject' | 'abstain'): void {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) return;

        proposal.votes.set(agentId, vote);
        this.emit('voteSubmitted', { agentId, proposalId, vote });
    }

    /**
     * Count votes
     */
    private countVotes(proposal: ConsensusProposal): number {
        let acceptCount = 0;
        for (const vote of proposal.votes.values()) {
            if (vote === 'accept') acceptCount++;
        }
        return acceptCount;
    }

    // ============================================================================
    // HEARTBEAT MONITOR
    // ============================================================================

    /**
     * Start heartbeat monitoring
     */
    private startHeartbeatMonitor(): void {
        setInterval(() => {
            const now = Date.now();
            
            for (const [agentId, agent] of this.agents) {
                if (now - agent.lastSeen > this.config.heartbeatInterval * 3) {
                    agent.status = 'offline';
                    this.emit('agentOffline', { agentId });
                } else if (agent.status === 'offline') {
                    agent.status = 'idle';
                    this.emit('agentOnline', { agentId });
                }
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Send heartbeat
     */
    heartbeat(agentId: string): void {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastSeen = Date.now();
        }
    }

    // ============================================================================
    // COHERENCE MANAGEMENT
    // ============================================================================

    /**
     * Update agent coherence
     */
    updateAgentCoherence(agentId: string, coherence: number): void {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.coherence = Math.max(0, Math.min(1, coherence));
            this.emit('coherenceUpdated', { agentId, coherence: agent.coherence });
        }
    }

    /**
     * Sync coherence across channel
     */
    async syncCoherence(channelId: string): Promise<void> {
        const channel = this.channels.get(channelId);
        if (!channel) return;

        const agents = Array.from(channel.participants)
            .map(id => this.agents.get(id))
            .filter((a): a is Agent => a !== undefined);

        if (agents.length === 0) return;

        // Calculate average coherence
        const avgCoherence = agents.reduce((sum, a) => sum + a.coherence, 0) / agents.length;

        // Update channel coherence
        channel.coherence = avgCoherence;

        // Broadcast sync
        await this.broadcast('system', channelId, 'coherence_sync', {
            averageCoherence: avgCoherence,
            agentCoherences: agents.map(a => ({ id: a.id, coherence: a.coherence }))
        }, 'low');
    }

    // ============================================================================
    // STATISTICS
    // ============================================================================

    /**
     * Get communication statistics
     */
    getStats(): {
        agentCount: number;
        channelCount: number;
        entangledChannels: number;
        pendingProposals: number;
        averageCoherence: number;
    } {
        const agents = Array.from(this.agents.values());
        const avgCoherence = agents.length > 0 
            ? agents.reduce((sum, a) => sum + a.coherence, 0) / agents.length 
            : 0;

        return {
            agentCount: this.agents.size,
            channelCount: this.channels.size,
            entangledChannels: this.entangledChannels.size,
            pendingProposals: Array.from(this.proposals.values())
                .filter(p => p.status === 'pending').length,
            averageCoherence: avgCoherence
        };
    }
}

// ============================================================================
// COHERENCE VALIDATOR
// ============================================================================

class CoherenceValidator {
    private threshold: number;

    constructor(threshold: number) {
        this.threshold = threshold;
    }

    /**
     * Validate message coherence
     */
    validate(message: Message): { valid: boolean; reason?: string } {
        if (message.coherence < this.threshold) {
            return { valid: false, reason: 'Coherence below threshold' };
        }
        return { valid: true };
    }

    /**
     * Update threshold
     */
    setThreshold(threshold: number): void {
        this.threshold = threshold;
    }
}

// ============================================================================
// MESSAGE ROUTER
// ============================================================================

class MessageRouter {
    private communicationManager: AgentCommunicationManager;

    constructor(communicationManager: AgentCommunicationManager) {
        this.communicationManager = communicationManager;
    }

    /**
     * Route message to appropriate recipients
     */
    async route(message: Message): Promise<void> {
        const channel = this.communicationManager['channels'].get(message.channelId);
        if (!channel) return;

        // Add to channel history
        channel.messageHistory.push(message);
        if (channel.messageHistory.length > channel.maxHistory) {
            channel.messageHistory.shift();
        }

        // Emit message event
        this.communicationManager.emit('messageReceived', { message });

        // Handle specific message types
        switch (message.type) {
            case 'heartbeat':
                this.communicationManager.heartbeat(message.senderId);
                break;
            case 'consensus_proposal':
                await this.handleConsensusProposal(message);
                break;
            case 'consensus_vote':
                this.handleConsensusVote(message);
                break;
        }
    }

    /**
     * Handle consensus proposal
     */
    private async handleConsensusProposal(message: Message): Promise<void> {
        const payload = message.payload;
        // Forward to channel participants
    }

    /**
     * Handle consensus vote
     */
    private handleConsensusVote(message: Message): void {
        const payload = message.payload;
        this.communicationManager.submitVote(
            message.senderId,
            payload.proposalId,
            payload.vote
        );
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const agentCommunicationManager = new AgentCommunicationManager();
