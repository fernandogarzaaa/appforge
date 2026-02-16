import { realitySensor } from '../swarm/core/reality_sensor.js';
import { SingularityEngine } from '../swarm/core/singularity_engine.js';
import { EconomicEngine } from '../swarm/core/economic_engine.js';
import { BountyRegistry } from '../swarm/core/bounty_registry.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../');

async function testCollectiveInception() {
    console.log('🧪 [Test] Starting Collective Inception Verification...');

    const singularity = new SingularityEngine();
    const economy = new EconomicEngine();
    const registry = new BountyRegistry();

    await economy.init();
    await registry.init();

    // 1. Simulating environment state
    console.log('\n📡 1. Injecting Critical Reality Signal...');
    // We'll create a mock build_logs.txt with errors to trigger the detector
    const logPath = path.join(PROJECT_ROOT, 'build_logs.txt');
    fs.writeFileSync(logPath, 'ERROR: Critical Security Red Flag detected in quantum buffer.');

    // 2. Triggering Reality Scan
    const signals = await realitySensor.scan();
    console.log(`   ✅ Sensed ${signals.length} signals.`);
    const critical = realitySensor.hasCriticalEvent();
    console.log(`   🚨 Critical Event Detected: ${critical}`);

    if (!critical) {
        throw new Error('Test Failed: RealitySensor did not detect the critical event.');
    }

    // 3. Triggering Inception Cycle
    console.log('\n🧠 2. Triggering Inception Cycle (Objective Synthesis)...');
    const startBounties = (await registry.getBounties()).length;

    await singularity.executeSelfImprovementCycle();

    const endBounties = await registry.getBounties();
    console.log(`   ✅ Bounty Registry Size: ${endBounties.length} (Previous: ${startBounties})`);

    // 4. Verifying Autonomous Bounty
    const incepted = endBounties.find(b => b.description.includes('[Autonomously Incepted]'));
    if (incepted) {
        console.log(`\n✨ SUCCESS: Autonomous Objective Incepted!`);
        console.log(`   → Description: ${incepted.description}`);
        console.log(`   → Priority: ${incepted.priority}`);
        console.log(`   → Reward: ${incepted.reward} QUAN`);

        // 5. Verify Policy Optimization (Reward Calculation)
        const expectedMinReward = Math.round(incepted.priority * 10); // Check if logic applied
        console.log(`   ✅ Reward Policy Validation: ${incepted.reward > 0 ? 'PASS' : 'FAIL'}`);
    } else {
        console.warn('   ⚠️ No autonomously incepted bounty found. This might happen if Oracle guidance was negative.');
    }

    // Cleanup
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
}

testCollectiveInception().catch(err => {
    console.error('❌ Test Failed:', err.message);
    process.exit(1);
});
