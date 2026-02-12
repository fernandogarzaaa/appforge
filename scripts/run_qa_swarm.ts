/**
 * Run one QualityAssuranceSwarm cycle from the terminal.
 */

import { QualityAssuranceSwarm } from '../swarm/agents/QualityAssuranceSwarm.js';

async function main(): Promise<void> {
    const swarm = new QualityAssuranceSwarm();
    const report = await swarm.runCycle();

    console.log('QA SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`gatePassed:   ${report.gatePassed}`);
    console.log(`passed:       ${report.passed}`);
    console.log(`failed:       ${report.failed}`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\qa_swarm_report.json`);
}

main().catch((error) => {
    console.error('QualityAssuranceSwarm run failed:', error);
    process.exit(1);
});

