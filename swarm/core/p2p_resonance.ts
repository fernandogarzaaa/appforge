import * as fs from 'fs/promises';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';

// Safe ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * P2P RESONANCE
 * An autonomous sharing protocol for local swarms.
 * Allows peer discovery and weight synchronization without cloud signals.
 */

export type P2PMessageType =
    | 'BOUNTY_SYNC'
    | 'ECONOMY_SYNC'
    | 'BRAIN_SYNC'
    | 'REASONING_SYNC';

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
        console.log(`📡 [P2P-RESONANCE] Starting Sovereign Node on port ${port}...`);

        this.server = new WebSocketServer({ port });

        this.server.on('connection', (ws, req) => {
            const remoteAddr = req.socket.remoteAddress;
            console.log(`   🤝 [P2P] New peer connection from ${remoteAddr}`);

            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleIncomingSync(message);
                } catch (e) {
                    console.error('   ❌ [P2P] Failed to parse sync message:', (e as any).message);
                }
            });
        });

        console.log(`   ✅ Node online. Core Synchronization active.`);
    }

    /**
     * Sync local state with a specific peer
     */
    async connectToPeer(peerUrl: string) {
        if (this.clients.has(peerUrl)) return;

        console.log(`   🔗 [P2P] Connecting to Peer: ${peerUrl}`);
        const ws = new WebSocket(peerUrl);

        ws.on('open', () => {
            console.log(`   ✅ [P2P] Connected to ${peerUrl}`);
            this.clients.set(peerUrl, ws);
            this.peers.push(peerUrl);
        });

        ws.on('error', (err) => {
            console.warn(`   ⚠️ [P2P] Peer ${peerUrl} unreachable: ${err.message}`);
        });

        ws.on('close', () => {
            this.clients.delete(peerUrl);
            this.peers = this.peers.filter(p => p !== peerUrl);
        });
    }

    /**
     * Broadcast local state evolution to the mesh
     */
    async broadcastState(type: string, data: any) {
        const payload = JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString(),
            origin: process.env.NODE_ID || 'sovereign-node'
        });

        console.log(`📡 [P2P-RESONANCE] Broadcasting ${type} to ${this.clients.size} peers...`);

        for (const [url, ws] of this.clients.entries()) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
                console.log(`   → Sync sent to ${url}`);
            }
        }
    }

    /**
     * Handle incoming synchronization data from peers
     */
    private async handleIncomingSync(message: any) {
        const { type, data, timestamp } = message;
        console.log(`📥 [P2P] Received ${type} sync (Timestamp: ${timestamp})`);

        // fold peer findings into local cognitive context or file system
        this.ingest({ type, data, timestamp });

        // Simple file-based merge for specific types
        if (type === 'BOUNTY_SYNC' || type === 'ECONOMY_SYNC') {
            await this.mergeState(type, data);
        }
    }

    /**
     * Merge incoming peer state with local storage
     */
    private async mergeState(type: string, data: any) {
        const fileMap: Record<string, string> = {
            'BOUNTY_SYNC': 'src/data/bounty_ledger.json',
            'ECONOMY_SYNC': 'src/data/economic_state.json'
        };

        const targetFile = fileMap[type];
        if (!targetFile) return;

        try {
            const fullPath = path.resolve(PROJECT_ROOT, targetFile);
            // Basic LWW (Last Write Wins) implementation for now
            // Future phases: CRDT or Consensus Voting
            await fs.writeFile(fullPath, JSON.stringify(data, null, 2));
            console.log(`   ✅ [Mesh-Sync] Merged peer ${type} into ${targetFile}`);
        } catch (e) {
            console.error(`   ❌ [Mesh-Sync] Failed to merge ${type}:`, (e as any).message);
        }
    }

    /**
     * Synergize findings from the resonance buffer
     */
    async synergize() {
        if (this.resonanceBuffer.length === 0) return;

        console.log(`🌀 [P2P-RESONANCE] Synergizing ${this.resonanceBuffer.length} peer findings...`);
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
}

export const p2pResonance = new P2PResonance();
