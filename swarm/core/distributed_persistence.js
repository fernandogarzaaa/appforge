import { p2pResonance } from './p2p_resonance.js';
import * as fs from 'fs/promises';
import * as path from 'path';
const PROJECT_ROOT = process.cwd();
const HOLOGRAPHIC_MEMORY_PATH = path.join(PROJECT_ROOT, 'src/data/quantum_brain_state.json');
/**
 * 🌌 Distributed Persistence
 * Synchronizes holographic memory (QuantumStateStore) across the P2P mesh.
 */
export class DistributedPersistence {
    /**
     * Broadcasts the local holographic memory state to all connected peers.
     */
    static async broadcastHolographicMemory() {
        try {
            const fullPath = path.resolve(PROJECT_ROOT, HOLOGRAPHIC_MEMORY_PATH);
            const data = await fs.readFile(fullPath, 'utf8');
            const memory = JSON.parse(data);
            await p2pResonance.broadcastState('HOLOGRAPHIC_SYNC', memory);
            console.log('   🌌 [DistributedPersistence] Broadcasted holographic memory to mesh.');
        }
        catch (e) {
            // Ignore if file doesn't exist yet
            if (e.code !== 'ENOENT') {
                console.warn('   ⚠️ [DistributedPersistence] Broadcast failed:', e.message);
            }
        }
    }
    /**
     * Forces a re-sync from peers (simulation)
     */
    static async initiateMeshRecall() {
        console.log('   🧠 [DistributedPersistence] Initiating mesh-wide holographic recall...');
        // In a real P2P setup, we'd send a HELLO or GET_SYNC request.
        // For Phase 91, we rely on incoming broadcasts from other nodes.
    }
}
