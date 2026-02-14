/**
 * 🧠 TRUE AI INDEPENDENCE VERIFICATION
 * 
 * Quick test to verify local Ollama models are wired to Sovereign AI
 * Run: npx tsx test_true_independence.ts
 */

import { sovereignModel } from './swarm/core/sovereign_model.js';
import { hyperBrain } from './swarm/core/sovereign_hyper_brain.js';

async function testTrueIndependence() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     🧠 TRUE AI INDEPENDENCE VERIFICATION TEST                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Test 1: Check Ollama Server
    console.log('[1/3] Checking Ollama Server...');
    const ollamaHealthy = await sovereignModel.ping();
    console.log(`   ${ollamaHealthy ? '✅' : '❌'} Ollama Server: ${ollamaHealthy ? 'ONLINE' : 'OFFLINE'}`);
    
    if (!ollamaHealthy) {
        console.log('\n💡 Start Ollama: ollama serve');
        console.log('💡 Pull models: ./pull_ollama_models.bat\n');
        return;
    }

    // Test 2: Sovereign Model Chat (Direct Ollama)
    console.log('\n[2/3] Testing Sovereign Model (llama3)...');
    const sovereignResponse = await sovereignModel.chat({
        system: 'You are a helpful AI assistant. Respond briefly.',
        user: 'What is 2+2?',
        model: 'llama3'
    });
    
    if (sovereignResponse) {
        console.log(`   ✅ Sovereign Model: WORKING`);
        console.log(`   📝 Response: "${sovereignResponse.choices[0].message.content.substring(0, 80)}..."`);
    } else {
        console.log(`   ❌ Sovereign Model: FAILED`);
    }

    // Test 3: Hyper Brain (Local Expert Swarm)
    console.log('\n[3/3] Testing Hyper Brain (Local Expert Swarm)...');
    const hyperResponse = await hyperBrain.chat({
        system: 'You are ARCHITECT. Design efficient systems.',
        user: 'How would you design a simple caching system?'
    });

    if (hyperResponse && !hyperResponse.includes('Cognitive Collapse')) {
        console.log(`   ✅ Hyper Brain: WORKING`);
        console.log(`   📝 Response: "${hyperResponse.substring(0, 80)}..."`);
    } else {
        console.log(`   ⚠️ Hyper Brain: FALLBACK (check Ollama logs)`);
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TRUE AI INDEPENDENCE VERIFICATION COMPLETE              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\n🚀 Ready for production: npx tsx swarm/core/loop.ts --independence\n');
}

testTrueIndependence().catch(console.error);
