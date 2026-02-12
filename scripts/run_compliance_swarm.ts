/**
 * Run one ComplianceSwarm cycle from the terminal.
 */

import { ComplianceSwarm } from '../swarm/agents/ComplianceSwarm.js';

async function main(): Promise<void> {
    const swarm = new ComplianceSwarm();
    const report = await swarm.runCycle();

    console.log('COMPLIANCE SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`checks:       ${report.checks.length}`);
    console.log(`recommendation:${report.recommendation}`);
    console.log(`confidence:   ${(report.confidence * 100).toFixed(1)}%`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\compliance_swarm_report.json`);
}

main().catch((error) => {
    console.error('ComplianceSwarm run failed:', error);
    process.exit(1);
});

