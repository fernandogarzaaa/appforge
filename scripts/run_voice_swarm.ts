/**
 * Run one VoiceAgentSwarm cycle from the terminal.
 */

import { VoiceAgentSwarm } from '../swarm/agents/VoiceAgentSwarm.js';

async function main(): Promise<void> {
    const swarm = new VoiceAgentSwarm();
    const report = await swarm.runCycle();

    console.log('VOICE SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`processed:    ${report.processed}`);
    console.log(`autoResolved: ${report.autoResolved}`);
    console.log(`escalated:    ${report.escalated}`);
    console.log(`upgradeOffers:${report.upgradeOffers}`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\voice_swarm_report.json`);
}

main().catch((error) => {
    console.error('VoiceAgentSwarm run failed:', error);
    process.exit(1);
});

