/**
 * 🔱 GOD SWARM LAUNCHER
 * Test the True God Swarm autonomous capabilities
 */

import { godSwarm } from '../swarm/core/god_swarm.js';

async function main() {
    console.log('='.repeat(60));
    console.log('🔱 INITIALIZING TRUE GOD SWARM v1.0');
    console.log('='.repeat(60));
    
    // Run the god swarm autonomous cycle
    const result = await godSwarm.run();
    
    console.log('\n📊 GOD SWARM STATUS:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Swarms Monitored: ${result.swarmsMonitored}`);
    console.log(`   Directives Active: ${result.directivesActive}`);
    console.log(`   Spawns Pending: ${result.spawnsPending}`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    result.recommendations.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r}`);
    });
    
    // Test spawning a new swarm
    console.log('\n🧬 TESTING SWARM SPAWNING...');
    const spawnResult = await godSwarm.spawnSwarm({
        purpose: 'TestSwarm',
        capabilities: ['testing', 'verification'],
        priority: 1,
        resources: { cpu: 0.1, memory: 64 }
    });
    
    console.log(`   Swarm: ${spawnResult.swarmName}`);
    console.log(`   Success: ${spawnResult.success}`);
    console.log(`   Files: ${spawnResult.files.join(', ')}`);
    
    // Test self-directives
    console.log('\n📜 SELF-DIRECTIVES:');
    // @ts-ignore
    console.log(godSwarm.selfDirectives?.slice(0, 3).join('\n') || 'Generating...');
    
    console.log('\n' + '='.repeat(60));
    console.log('🔱 GOD SWARM CYCLE COMPLETE');
    console.log('='.repeat(60));
}

main().catch(console.error);
