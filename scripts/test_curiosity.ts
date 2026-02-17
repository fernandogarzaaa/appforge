import { Base44Tool } from '../swarm/tools/base44.js';
import { CuriosityEngine } from '../swarm/core/curiosity_engine.js';
import quantumCore from '../swarm/core/quantum_core.js';

// Mock specific paths if needed, effectively we rely on the filesystem
// Mock Base44 to avoid real API writes during test, but we want to see logs
const mockBase44 = {
    client: {
        entities: {
            Task: {
                create: async (data: any) => {
                    console.log('   🧪 [MockBase44] Task Created:', data);
                    return { id: 'task_mock_123' };
                }
            }
        }
    }
} as unknown as Base44Tool;

async function testCuriosity() {
    console.log('🧪 Testing Curiosity Engine...');

    try {
        const engine = new CuriosityEngine(mockBase44);

        // 1. Scan
        console.log('   Running scanForNovelty...');
        const bounties = await engine.scanForNovelty(1);

        if (bounties.length === 0) {
            console.error('   ❌ No bounties found. File system scan might be empty or failing.');
            process.exit(1);
        }

        const bounty = bounties[0];
        console.log(`   ✅ Bounty Found: ${bounty.file}`);
        console.log(`      Hypothesis: ${bounty.hypothesis}`);

        // 2. Synthesize
        console.log('   Synthesizing Bounty...');
        await engine.synthesizeBounty(bounty);
        console.log('   ✅ Bounty Synthesis Complete.');

    } catch (e: any) {
        console.error('   ❌ Test Failed:', e.message);
        process.exit(1);
    }
}

testCuriosity();
