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

        const scanLimit = Math.max(1, Number.parseInt(process.env.CURIOSITY_SCAN_LIMIT ?? '5', 10) || 5);
        const synthesisLimit = Math.max(1, Number.parseInt(process.env.CURIOSITY_SYNTHESIS_LIMIT ?? '3', 10) || 3);

        console.log(`   🔍 scanLimit=${scanLimit}, synthesisLimit=${synthesisLimit}`);

        const bounties = await engine.scanForNovelty(scanLimit);

        console.log(`   📦 Candidates found: ${bounties.length}`);

        if (bounties.length > 0) {
            for (const [index, bounty] of bounties.entries()) {
                console.log(`   ${index + 1}. ✨ Candidate: ${bounty.file}`);
                console.log(`      🤔 Hypothesis: ${bounty.hypothesis}`);
                console.log(`      🧠 WhyInteresting: ${bounty.whyInteresting}`);
                console.log(`      📈 Priority: ${bounty.priority.toFixed(2)}`);
            }

            const selected = bounties.slice(0, synthesisLimit);
            for (const bounty of selected) {
                await engine.synthesizeBounty(bounty);
            }
            console.log(`   ✅ Synthesized ${selected.length} bount${selected.length === 1 ? 'y' : 'ies'} & logged.`);
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
