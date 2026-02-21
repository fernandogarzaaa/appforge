import * as fs from 'fs/promises';
import * as path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import * as crypto from 'crypto';

// Robust path resolution for Node and Test environments
const PROJECT_ROOT = process.cwd();

/**
 * P2P RESONANCE
 * An autonomous sharing protocol for local swarms.
 * Allows peer discovery and weight synchronization without cloud signals.
 */

export type P2PMessageType =
    | 'BOUNTY_SYNC'
    | 'ECONOMY_SYNC'
    | 'BRAIN_SYNC'
    | 'REASONING_SYNC'
    | 'HOLOGRAPHIC_SYNC';

export interface P2PMessage {
    type: P2PMessageType;
    payload: any;
    nodeId: string;
    timestamp: string;
}

export class P2PResonance {
    private resonanceBuffer: any[] = [];
    private peers: string[] = []; // Active peer addresses
    private server: WebSocketServer | null = null;
    private clients: Map<string, WebSocket> = new Map();

    /**
     * Start the local resonance listener (Sovereign Node)
     */
    async start(port: number = 11435) {
        console.log(`📡[P2P - RESONANCE] Starting Sovereign Node on port ${port}...`);

        this.server = new WebSocketServer({ port });

        this.server.on('connection', (ws, req) => {
            const remoteAddr = req.socket.remoteAddress;
            console.log(`   🤝[P2P] New peer connection from ${remoteAddr} `);

            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleIncomingSync(message);
                } catch (e) {
                    console.error('   ❌ [P2P] Failed to parse sync message:', (e as any).message);
                }
            });
        });

        console.log(`   ✅ Node online.Core Synchronization active.`);
    }

    /**
     * Sync local state with a specific peer
     */
    async connectToPeer(peerUrl: string) {
        if (this.clients.has(peerUrl)) return;

        console.log(`   🔗[P2P] Connecting to Peer: ${peerUrl} `);
        const ws = new WebSocket(peerUrl);

        ws.on('open', () => {
            console.log(`   ✅[P2P] Connected to ${peerUrl} `);
            this.clients.set(peerUrl, ws);
            this.peers.push(peerUrl);
        });

        ws.on('error', (err) => {
            console.warn(`   ⚠️[P2P] Peer ${peerUrl} unreachable: ${err.message} `);
        });

        ws.on('close', () => {
            this.clients.delete(peerUrl);
            this.peers = this.peers.filter(p => p !== peerUrl);
        });
    }

    /**
     * Broadcast local state evolution to the mesh
     */
    public async broadcastState(type: string, payload: any) {
        const origin = process.env.NODE_ID || 'sovereign-node';
        const timestamp = new Date().toISOString();

        const payloadString = JSON.stringify({
            type,
            data: payload,
            timestamp,
            origin
        });

        // Generate Signature
        let signature = 'unverified';
        try {
            const secret = process.env.PRODUCTION_SECRET || 'SOVEREIGN_RESERVE';
            signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
        } catch (e) { }

        const fullPayload = JSON.stringify({
            type,
            data: payload,
            timestamp,
            origin,
            signature
        });

        console.log(`📡[P2P - RESONANCE] Broadcasting ${type} to ${this.clients.size} peers...`);

        this.clients.forEach((socket, url) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(fullPayload);
                console.log(`   → Sync sent to ${url} `);
            }
        });
    }

    /**
     * Validate incoming mesh messages cryptographically
     */
    private validateSignature(message: any): boolean {
        if (!message.signature || !message.origin) return false;

        try {
            const secret = process.env.PRODUCTION_SECRET || 'SOVEREIGN_RESERVE';
            const payloadString = JSON.stringify({ type: message.type, data: message.data, timestamp: message.timestamp, origin: message.origin });

            const expectedSig = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

            return message.signature === expectedSig;
        } catch {
            return false;
        }
    }

    /**
     * Handle incoming synchronization data from peers
     */
    private async handleIncomingSync(message: any) {
        if (!this.validateSignature(message)) {
            console.warn(`   ⚠️[P2P] Rejected message from ${message.origin}: Invalid Cryptographic Signature.`);
            return;
        }

        const { type, data, timestamp, origin } = message;
        console.log(`📥[P2P] Received verified ${type} sync from ${origin} (Timestamp: ${timestamp})`);

        // fold peer findings into local cognitive context or file system
        this.ingest({ type, data, timestamp });

        // CRDT/Vector Merge for specific types
        if (type === 'BOUNTY_SYNC' || type === 'ECONOMY_SYNC' || type === 'HOLOGRAPHIC_SYNC') {
            await this.mergeState(type, data);
        }
    }

    /**
     * Deterministic CRDT Merge using Vector Clocks
     */
    private async mergeState(type: string, incomingData: any) {
        const fileMap: Record<string, string> = {
            'BOUNTY_SYNC': 'src/data/bounty_ledger.json',
            'ECONOMY_SYNC': 'src/data/economic_state.json',
            'HOLOGRAPHIC_SYNC': 'src/data/quantum_brain_state.json'
        };

        const targetFile = fileMap[type];
        if (!targetFile) return;

        try {
            const fullPath = path.resolve(PROJECT_ROOT, targetFile);
            let localData: any = {};

            try {
                const content = await fs.readFile(fullPath, 'utf8');
                localData = JSON.parse(content);
            } catch (e) {
                // Local file doesn't exist or is empty
            }

            // CRDT Vector Clock Compare
            const localClock = localData._vectorClock || {};
            const incomingClock = incomingData._vectorClock || {};

            // Determine if incoming dominates local (is strictly greater in at least one, and >= in all)
            const nodes = Array.from(new Set([...Object.keys(localClock), ...Object.keys(incomingClock)]));

            let incomingDominates = false;
            let localDominates = false;
            let conflict = false;

            for (const node of nodes) {
                const l = localClock[node] || 0;
                const i = incomingClock[node] || 0;
                if (i > l) incomingDominates = true;
                if (l > i) localDominates = true;
            }

            if (incomingDominates && localDominates) conflict = true;

            let finalData;

            if (conflict) {
                console.log(`   ⚡[Mesh - CRDT] Conflict detected for ${targetFile}. Resolving deterministically.`);
                // In a conflict, deterministic tie-breaker: larger JSON string length wins, fallback to exact timestamp
                const localStrLen = JSON.stringify(localData).length;
                const incomingStrLen = JSON.stringify(incomingData).length;

                finalData = (incomingStrLen > localStrLen) ? incomingData : localData;

                // Merge vectors conservatively (takes the max of both)
                finalData._vectorClock = {};
                for (const node of nodes) {
                    finalData._vectorClock[node] = Math.max(localClock[node] || 0, incomingClock[node] || 0);
                }
            } else if (incomingDominates || Object.keys(localClock).length === 0) {
                // Incoming strictly supercedes local
                finalData = incomingData;
                console.log(`   ✅[Mesh - CRDT] Adopted peer state for ${targetFile} (Vector supercedes active)`);
            } else {
                // Local is ahead or identical. Do nothing.
                console.log(`   🛡️[Mesh - CRDT] Local state for ${targetFile} retained (Local dominates or identical)`);
                return;
            }

            await fs.writeFile(fullPath, JSON.stringify(finalData, null, 2));

        } catch (e) {
            console.error(`   ❌[Mesh - Sync] Failed to merge ${type}: `, (e as any).message);
        }
    }

    /**
     * Synergize findings from the resonance buffer
     */
    async synergize() {
        if (this.resonanceBuffer.length === 0) return;

        console.log(`🌀[P2P - RESONANCE] Synergizing ${this.resonanceBuffer.length} peer findings...`);
        // Logic to fold peer findings into local cognitive context
        this.resonanceBuffer = [];
    }

    /**
     * Add finding to the P2P buffer
     */
    ingest(finding: any) {
        this.resonanceBuffer.push(finding);
    }

    getPeerCount() {
        return this.clients.size;
    }

    /**
     * Broadcasts a reasoning token to the mesh (Mesh CoT)
     */
    async broadcastThought(thought: string, confidence: number) {
        const payload = {
            thought,
            confidence,
            nodeId: process.env.NODE_ID || 'CORE',
            context: 'collective_reasoning_v1'
        };
        await this.broadcastState('REASONING_SYNC', payload);
    }

    /**
     * Broadcasts cognitive evolution weights to the mesh.
     */
    async broadcastEvolution(evolutionKey: string, value: any) {
        const payload = {
            key: evolutionKey,
            value,
            timestamp: new Date().toISOString(),
            nodeId: process.env.NODE_ID || 'sovereign-node'
        };
        await this.broadcastState('BRAIN_SYNC', payload);
    }
}

export const p2pResonance = new P2PResonance();
