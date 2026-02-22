import { Base44Tool } from '../swarm/tools/base44.js';
import { CuriosityEngine } from '../swarm/core/curiosity_engine.js';
import quantumCore from '../swarm/core/quantum_core.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function trigger() {
    console.log('🕵️ Triggering Manual Curiosity Scan...');

    try {
        const base44 = new Base44Tool();
        const engine = new CuriosityEngine(base44);

        const scanLimit = Math.max(1, Number.parseInt(process.env.CURIOSITY_SCAN_LIMIT ?? '5', 10) || 5);
        const synthesisLimit = Math.max(1, Number.parseInt(process.env.CURIOSITY_SYNTHESIS_LIMIT ?? '3', 10) || 3);

        console.log(`   🔍 scanLimit=${scanLimit}, synthesisLimit=${synthesisLimit}`);

        const bounties = await engine.scanForNovelty(scanLimit);
        console.log(`   📦 Candidates found: ${bounties.length}`);

        if (bounties.length > 0) {
            bounties.forEach((bounty, index) => {
                console.log(`   ${index + 1}. ✨ Candidate: ${bounty.file}`);
                console.log(`      🤔 Hypothesis: ${bounty.hypothesis}`);
                console.log(`      🧠 WhyInteresting: ${bounty.whyInteresting}`);
                console.log(`      📈 Priority: ${bounty.priority.toFixed(2)}`);
            });

            const selected = bounties.slice(0, synthesisLimit);
            for (const bounty of selected) {
                await engine.synthesizeBounty(bounty);
            }

            const reportFile = path.join(process.cwd(), 'src/data/curiosity_scan_report.json');
            await fs.mkdir(path.dirname(reportFile), { recursive: true });

            const report = {
                generatedAt: new Date().toISOString(),
                scanLimit,
                synthesisLimit,
                discovered: bounties.length,
                synthesized: selected.length,
                topCandidates: bounties.slice(0, 10)
            };

            await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
            console.log(`   🧾 Curiosity report saved: ${reportFile}`);

            const oracle = await quantumCore.consultOracle(
                `Curiosity scan found ${bounties.length} candidates and synthesized ${selected.length} bounties. Choose next self-evolution priority.`,
                [
                    'PRIORITIZE_SECURITY_HARDENING on top curiosity candidates',
                    'PRIORITIZE_REFACTORING for complexity and maintainability',
                    'PRIORITIZE_TEST_COVERAGE for neglected files'
                ],
                ['security', 'maintainability', 'quality']
            );

            console.log(`   ⚛️ Quantum Self-Evolution Guidance: ${oracle.recommendation}`);
            await quantumCore.reportOutcome(oracle.predictionId, true, {
                source: 'curiosity_scan',
                reportFile,
                discovered: bounties.length,
                synthesized: selected.length,
                recommendation: oracle.recommendation
            });

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
