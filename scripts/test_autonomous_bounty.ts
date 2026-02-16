import { BountyRegistry } from '../swarm/core/bounty_registry.js';
import { EconomicEngine } from '../swarm/core/economic_engine.js';
import { SingularityEngine } from '../swarm/core/singularity_engine.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../');

async function testAutonomousBounty() {
    console.log('🧪 Starting Autonomous Bounty Verification...');

    const registry = new BountyRegistry();
    const economy = new EconomicEngine();
    const singularity = new SingularityEngine();

    // 1. Manually add a "Code" bounty to the backlog
    await registry.init();
    await registry.addBounty({
        description: 'Optimize Quantum Core Heuristics (Bounty Verification)',
        priority: 0.95,
        reward: 50,
        category: 'code'
    });
    console.log('   ✅ Added Code Bounty.');

    // 2. Ensure economy has enough budget
    await economy.init();
    await economy.attributeValue(100); // Give it some initial capital for the test
    console.log('   ✅ Economy funded.');

    // 3. Execute a Singularity cycle
    console.log('\n🔄 Running Singularity Cycle (Bounty Priority)...');
    const result = await singularity.executeSelfImprovementCycle();

    // 4. Re-initialize to load changes from disk
    await registry.init();
    await economy.init();

    const finalEco = economy.getState();
    const finalRegistry = registry.getBounties();
    const completedBounty = finalRegistry.find(b => b.status === 'completed');

    console.log('\n📊 VERIFICATION REPORT:');
    console.log(`   - Cycle Success: ${result.success}`);
    console.log(`   - Improvements Applied: ${result.improvements.length}`);
    console.log(`   - Bounty Completed: ${completedBounty ? '✅ YES' : '❌ NO'}`);
    console.log(`   - Final Economy Value: ${finalEco.totalValue}`);
    console.log(`   - Final Budget: ${finalEco.availableBudget}`);

    if (completedBounty) {
        console.log('✨ [PASSED] Swarm autonomously identified and completed a growth bounty.');
    } else {
        console.log('❌ [FAILED] Bounty was not processed.');
    }
}

testAutonomousBounty().catch(console.error);
