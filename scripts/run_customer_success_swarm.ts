/**
 * Run one CustomerSuccessSwarm cycle from the terminal.
 */

import { CustomerSuccessSwarm } from '../swarm/agents/CustomerSuccessSwarm.js';

async function main(): Promise<void> {
    const swarm = new CustomerSuccessSwarm();
    const report = await swarm.runCycle();

    console.log('CUSTOMER SUCCESS SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`accounts:     ${report.accountsProcessed}`);
    console.log(`highRisk:     ${report.highRiskAccounts}`);
    console.log(`upsellTargets:${report.upsellTargets}`);
    console.log(`retention:    ${report.retentionActions}`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\customer_success_swarm_report.json`);
}

main().catch((error) => {
    console.error('CustomerSuccessSwarm run failed:', error);
    process.exit(1);
});

