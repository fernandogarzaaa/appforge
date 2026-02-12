/**
 * Run one KnowledgeGraphSwarm cycle from the terminal.
 */

import { KnowledgeGraphSwarm } from '../swarm/agents/KnowledgeGraphSwarm.js';

async function main(): Promise<void> {
    const swarm = new KnowledgeGraphSwarm();
    const report = await swarm.runCycle();

    console.log('KNOWLEDGE GRAPH SWARM COMPLETE');
    console.log('='.repeat(64));
    console.log(`nodes:        ${report.nodes.length}`);
    console.log(`edges:        ${report.edges.length}`);
    console.log(`strategy:     ${report.strategyRecommendation}`);
    console.log(`confidence:   ${(report.confidence * 100).toFixed(1)}%`);
    console.log(`reportFile:   ${process.cwd()}\\swarm\\data\\knowledge_graph_swarm_report.json`);
}

main().catch((error) => {
    console.error('KnowledgeGraphSwarm run failed:', error);
    process.exit(1);
});

