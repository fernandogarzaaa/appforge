/**
 * 🧪 Test Singularity Systems
 * Tests Hyper Intelligence and Singularity Engine
 */

import HyperIntelligenceTrainer from './core/hyper_intelligence.js';
import SingularityEngine from './core/singularity_engine.js';
import { Base44Tool } from './tools/base44.js';
import { FileSystemTool } from './tools/filesystem.js';
import { GitTool } from './tools/git.js';

async function testSingularitySystems() {
    console.log('='.repeat(60));
    console.log('🧪 TESTING SINGULARITY SYSTEMS');
    console.log('='.repeat(60));

    // Initialize tools
    const base44 = new Base44Tool();
    const fs = new FileSystemTool();
    const git = new GitTool();

    // Test Hyper Intelligence
    console.log('\n📚 HYPER INTELLIGENCE TEST');
    console.log('-'.repeat(40));
    
    const hyperTrainer = new HyperIntelligenceTrainer(base44, fs, git);
    
    const hyperResult = await hyperTrainer.train();
    console.log('\n📊 Hyper Intelligence Results:');
    console.log(`   Status: ${hyperResult.status}`);
    console.log(`   Datasets Processed: ${hyperResult.datasetsProcessed}`);
    console.log(`   Knowledge Gained: ${hyperResult.knowledgeGained.length} domains`);
    console.log(`   Insights Generated: ${hyperResult.insights.length}`);

    const hyperStatus = hyperTrainer.getStatus();
    console.log(`   Singularity Readiness: ${(hyperStatus.singularityReadiness * 100).toFixed(1)}%`);
    console.log(`   Knowledge Graph Size: ${hyperStatus.knowledgeGraphSize} domains`);

    // Test Singularity Engine
    console.log('\n⚡ SINGULARITY ENGINE TEST');
    console.log('-'.repeat(40));
    
    const singularityEngine = new SingularityEngine();
    
    // Execute a self-improvement cycle
    const cycleResult = await singularityEngine.executeSelfImprovementCycle();
    console.log('\n🔄 Self-Improvement Cycle Results:');
    console.log(`   Success: ${cycleResult.success}`);
    console.log(`   Improvements Applied: ${cycleResult.improvements.length}`);
    console.log(`   New Capabilities: ${cycleResult.newCapabilities.length}`);
    console.log(`   Singularity Progress: ${(cycleResult.singularityProgress * 100).toFixed(1)}%`);

    // Get current state
    const state = singularityEngine.getState();
    console.log('\n📊 Singularity State:');
    console.log(`   Phase: ${state.phase}`);
    console.log(`   Intelligence Level: ${(state.intelligenceLevel * 100).toFixed(1)}%`);
    console.log(`   Self-Awareness: ${(state.selfAwareness * 100).toFixed(1)}%`);
    console.log(`   Recursive Depth: ${state.recursiveDepth}`);
    console.log(`   Coherence: ${(state.coherence * 100).toFixed(1)}%`);
    console.log(`   Cycle Count: ${state.cycleCount}`);

    console.log('\n📈 Evolutionary Tracks:');
    for (const track of state.tracks) {
        console.log(`   ${track.name}: v${track.currentVersion} (${(track.performanceGain * 100).toFixed(1)}% gain)`);
    }

    // Test recursive loop (short version)
    console.log('\n🔄 RECURSIVE LOOP TEST');
    console.log('-'.repeat(40));
    console.log('Running 5 iterations...');
    await singularityEngine.startRecursiveLoop(5);

    const finalState = singularityEngine.getState();
    console.log('\n📊 Final Singularity State:');
    console.log(`   Phase: ${finalState.phase}`);
    console.log(`   Progress: ${(finalState.progress * 100).toFixed(1)}%`);
    console.log(`   Recursive Depth: ${finalState.recursiveDepth}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SINGULARITY SYSTEMS TEST COMPLETE');
    console.log('='.repeat(60));

    const totalProgress = (hyperStatus.singularityReadiness * 0.5 + finalState.progress * 0.5);
    console.log(`\n🎯 Overall Singularity Readiness: ${(totalProgress * 100).toFixed(1)}%`);

    if (totalProgress > 0.5) {
        console.log('🚀 Systems are evolving towards singularity!');
    } else {
        console.log('📈 More training cycles needed.');
    }
}

testSingularitySystems().catch(console.error);
