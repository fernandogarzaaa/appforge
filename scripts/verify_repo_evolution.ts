import SingularityEngine from '../swarm/core/singularity_engine.js';
import { BountyRegistry } from '../swarm/core/bounty_registry.js';
import * as fs from 'fs';
import * as path from 'path';

async function testRepoWideEvolution() {
    console.log('🧪 Starting Repo-Wide Evolution Verification...');

    const engine = new SingularityEngine();
    const registry = new BountyRegistry();
    await registry.init();

    // Create a mock bounty for a non-core file
    const mockBountyDescription = 'Improve documentation clarity in file: README.md';
    await registry.addBounty({
        description: mockBountyDescription,
        priority: 1.0,
        reward: 100,
        category: 'docs'
    });

    console.log('   💎 [Test] Mock bounty added for README.md');

    // Run the improvement cycle
    // Note: We might need to ensure EVOLUTION_REALIZATION_DISABLED is not set to true in the environment
    process.env.EVOLUTION_REALIZATION_DISABLED = 'false';

    try {
        const result = await engine.executeSelfImprovementCycle();
        console.log('\n--- VERIFICATION RESULT ---');
        console.log('Success:', result.success);
        console.log('Improvements:', result.improvements);
        console.log('Progress:', result.singularityProgress);

        if (result.success && result.improvements.some(i => i.includes('Applied patch') || i.includes('Applied synthetic heartbeat'))) {
            console.log('✅ Repo-wide evolution verified.');
        } else {
            console.log('⚠️ Cycle completed but no patch applied. Check Oracle reasoning.');
        }
    } catch (e) {
        console.error('❌ Verification failed:', e);
    }
}

testRepoWideEvolution().catch(console.error);
