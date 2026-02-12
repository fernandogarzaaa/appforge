/**
 * Run one ResearchSwarm cycle from the terminal.
 */

import { ResearchSwarm } from '../swarm/agents/ResearchSwarm.js';

async function main(): Promise<void> {
    const swarm = new ResearchSwarm();
    const report = await swarm.runCycle();

    console.log('RESEARCH SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`signals:      ${report.signalsAnalyzed}`);
    console.log(`competitors:  ${report.competitorsTracked}`);
    console.log(`topFocus:     ${report.topFocus}`);
    console.log(`oracle:       ${report.oracleRecommendation}`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\research_swarm_report.json`);
}

main().catch((error) => {
    console.error('ResearchSwarm run failed:', error);
    process.exit(1);
});

