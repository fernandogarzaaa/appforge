import { Base44Tool } from '../swarm/tools/base44.js';
import { CuriosityEngine } from '../swarm/core/curiosity_engine.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function trigger() {
    console.log('🕵️ Triggering Manual Curiosity Scan...');

    try {
        // Initialize Real Base44 (uses local DB/Logs)
        const base44 = new Base44Tool();
        const engine = new CuriosityEngine(base44);

        const bounties = await engine.scanForNovelty(1);

        if (bounties.length > 0) {
            const bounty = bounties[0];
            console.log(`   ✨ Found Candidate: ${bounty.file}`);
            console.log(`   🤔 Hypothesis: ${bounty.hypothesis}`);

            await engine.synthesizeBounty(bounty);
            console.log('   ✅ Bounty Synthesized & Logged.');
        } else {
            console.log('   🤷 No neglected files found (or heuristic limit reached).');
        }

        console.log('🏁 Manual Curiosity Scan Complete.');
        process.exit(0);
    } catch (error) {
        console.error('   ❌ Scan failed:', error);
        process.exit(1);
    }
}

trigger().catch((err) => {
    console.error('🏁 [Fatal] Trigger crashed:', err);
    process.exit(1);
});
