/**
 * Run one LearningSwarm cycle from the terminal.
 */

import { LearningSwarm } from '../swarm/agents/LearningSwarm.js';

async function main(): Promise<void> {
    const swarm = new LearningSwarm();
    const report = await swarm.runCycle();

    console.log('LEARNING SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`focus:        ${report.focus}`);
    console.log(`successRate:  ${(report.successRate * 100).toFixed(1)}%`);
    console.log(`drills:       ${report.drillsPassed}/${report.drillsExecuted}`);
    console.log(`strategy:     ${report.strategicRecommendation}`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\learning_swarm_report.json`);
}

main().catch((error) => {
    console.error('LearningSwarm run failed:', error);
    process.exit(1);
});

