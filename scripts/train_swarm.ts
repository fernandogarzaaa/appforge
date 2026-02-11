/**
 * Swarm Training Script
 * 
 * Trains the swarm on repositories and LLM datasets.
 */

import { repositoryTrainer } from '../swarm/core/repository_trainer.js';

async function main() {
    console.log('🚀 [Training] Starting swarm training pipeline...\n');

    try {
        // Run complete training
        const knowledge = await repositoryTrainer.train();

        console.log(`\n📊 [Training] Summary:`);
        console.log(`   Total knowledge items: ${knowledge.length}`);
        
        // Group by source
        const bySource = knowledge.reduce((acc, item) => {
            acc[item.source] = (acc[item.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('\n📚 Knowledge by Source:');
        Object.entries(bySource).forEach(([source, count]) => {
            console.log(`   ${source}: ${count} items`);
        });

        // Group by type
        const byType = knowledge.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('\n🏷️ Knowledge by Type:');
        Object.entries(byType).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} items`);
        });

        console.log('\n✅ [Training] Complete!');

    } catch (error) {
        console.error('❌ [Training] Failed:', error);
        process.exit(1);
    }
}

main();
