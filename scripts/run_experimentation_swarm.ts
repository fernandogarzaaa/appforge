/**
 * Run one ExperimentationSwarm cycle from the terminal.
 */

import { ExperimentationSwarm } from '../swarm/agents/ExperimentationSwarm.js';

async function main(): Promise<void> {
    const swarm = new ExperimentationSwarm();
    const report = await swarm.runCycle();

    console.log('EXPERIMENTATION SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`internalAgents:${report.internalAgents}`);
    console.log(`experiments:  ${report.experimentsEvaluated}`);
    console.log(`handoffs:     ${report.executedHandovers}`);
    console.log(`top:          ${report.topRecommendation}`);
    console.log(`oracle:       ${report.oracleRecommendation}`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\experimentation_swarm_report.json`);
}

main().catch((error) => {
    console.error('ExperimentationSwarm run failed:', error);
    process.exit(1);
});
