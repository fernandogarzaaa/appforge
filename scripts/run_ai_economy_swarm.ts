/**
 * Run one AIEconomySwarm cycle from the terminal.
 */

import { AIEconomySwarm } from '../swarm/agents/AIEconomySwarm.js';

async function main(): Promise<void> {
    const swarm = new AIEconomySwarm();
    const report = await swarm.runCycle();

    console.log('AI ECONOMY SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`strategy:     ${report.strategy}`);
    console.log(`strategyFrom: ${report.strategySource}`);
    console.log(`grossInflow:  $${report.grossInflow.toFixed(2)}`);
    console.log(`netInflow:    $${report.netInflow.toFixed(2)}`);
    console.log(`reserveAfter: $${report.reserveAfter.toFixed(2)}`);
    console.log(`sustainability:${(report.sustainabilityScore * 100).toFixed(1)}%`);
    console.log(`oracle:       ${report.oracleRecommendation}`);
    console.log(`oracleConf:   ${(report.oracleConfidence * 100).toFixed(1)}% (min ${(report.oracleMinConfidence * 100).toFixed(1)}%, accepted=${report.oracleAccepted ? 'yes' : 'no'})`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\ai_economy_swarm_report.json`);
}

main().catch((error) => {
    console.error('AIEconomySwarm run failed:', error);
    process.exit(1);
});
