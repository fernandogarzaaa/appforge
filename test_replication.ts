import { replicator } from './swarm/core/replicate.js';
import { nexusGateway } from './swarm/core/nexus_gateway.js';
import path from 'path';
import fs from 'fs';

async function testReplication() {
    console.log('🧪 [Verification] Initiating Self-Replication Pulse...');

    const nodeName = 'test_spawn_v1';

    try {
        // 1. Create Seed
        const seedPath = await replicator.createSeed(nodeName);
        console.log(`   ✅ Seed verified at: ${seedPath}`);

        // 2. Create Spore
        const sporePath = await replicator.createSpore('windows');
        console.log(`   ✅ Spore verified at: ${sporePath}`);

        // 3. Transport
        const spawnPoint = path.join(process.cwd(), 'spawn_points', nodeName);
        const transportSuccess = await nexusGateway.transportSeed(seedPath, spawnPoint);

        if (transportSuccess && fs.existsSync(path.join(spawnPoint, path.basename(seedPath)))) {
            console.log('🧪 [Verification] Replication Sequence COMPLETE: SUCCESS');
        } else {
            console.error('🧪 [Verification] Replication Sequence FAILED: Transport mismatch');
        }

    } catch (err) {
        console.error(`🧪 [Verification] Replication Sequence FAILED: ${err}`);
    }
}

testReplication();
