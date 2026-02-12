/**
 * Run one DevOpsSwarm cycle from the terminal.
 */

import { DevOpsSwarm } from '../swarm/agents/DevOpsSwarm.js';

async function main(): Promise<void> {
    const swarm = new DevOpsSwarm();
    const report = await swarm.runCycle();

    console.log('DEVOPS SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`checks:       ${report.checks.length}`);
    console.log(`action:       ${report.action.recommendation}`);
    console.log(`confidence:   ${(report.action.confidence * 100).toFixed(1)}%`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\devops_swarm_report.json`);
}

main().catch((error) => {
    console.error('DevOpsSwarm run failed:', error);
    process.exit(1);
});

