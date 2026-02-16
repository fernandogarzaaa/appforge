import fs from 'fs';
import path from 'path';
import { p2pResonance } from './p2p_resonance.js';

export class NexusGateway {
    private registeredPeers: string[] = [];

    /**
     * Transports a Seed to a target "Spawn Point".
     */
    async transportSeed(seedPath: string, targetPath: string): Promise<boolean> {
        console.log(`📡 [NexusGateway] Transporting Seed to ${targetPath}...`);

        try {
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }

            const targetFile = path.join(targetPath, path.basename(seedPath));
            fs.copyFileSync(seedPath, targetFile);

            console.log(`   ✅ Transport Complete: ${targetFile}`);
            return true;
        } catch (error) {
            console.error(`   ❌ Transport Failed: ${error}`);
            return false;
        }
    }

    /**
     * Performs a "Nexus Handshake" to verify connectivity and node health.
     */
    async handshake(target: string): Promise<boolean> {
        console.log(`🤝 [NexusGateway] Initiating Handshake with ${target}...`);
        try {
            await p2pResonance.connectToPeer(target);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Maintains the P2P Mesh by discovering and connecting to peers.
     */
    async discoverPeers() {
        console.log('🔍 [NexusGateway] Scanning for Quantum Mesh peers...');

        // In a real P2P mesh, this would use mDNS, DHT, or a known bootstrap list.
        // For local development, we use a default resonance port range.
        const localRange = [11435, 11436, 11437];
        const selfPort = Number(process.env.RESONANCE_PORT) || 11435;

        for (const port of localRange) {
            if (port === selfPort) continue;
            const target = `ws://localhost:${port}`;
            await this.handshake(target);
        }
    }

    getMeshStatus() {
        return {
            connectedPeers: p2pResonance.getPeerCount(),
            isGatewayActive: true
        };
    }
}

export const nexusGateway = new NexusGateway();
