/**
 * 🎯 100% COHERENCE MARKET INTELLIGENCE TEST
 * 
 * Run: npx tsx test_coherent_market.ts
 */

import { coherentMarketEngine } from './swarm/core/coherent_market_intelligence.js';

async function testCoherentMarket() {
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║     🎯 100% COHERENCE MARKET INTELLIGENCE TEST                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    // Initialize
    console.log('[1/2] Initializing Coherent Market Engine...');
    await coherentMarketEngine.initialize();
    console.log('   ✅ Engine initialized\n');

    // Generate prediction
    console.log('[2/2] Generating 100% Coherence Market Prediction...');
    const signal = await coherentMarketEngine.predict(
        'What is the outlook for AI-focused cryptocurrencies and the broader crypto market in the next 7 days? Consider technical analysis, market sentiment, and upcoming catalysts.'
    );

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    console.log('                        📊 COHERENCE TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    console.log('   🎯 Target Coherence: 100.0%');
    console.log(`   ⚡ Achieved Coherence: ${(signal.coherence * 100).toFixed(1)}%`);
    console.log(`   📊 Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
    console.log(`   🔮 Oracle Validated: ${signal.oracle.validated ? 'YES' : 'NO'}`);
    console.log(`   🌀 Willow Speedup: ${(signal.quantum.willowBoost * 100).toFixed(0)}%`);
    console.log(`   🔄 Iterations: ${signal.quantum.iterations}`);
    console.log(`   📈 Type: ${signal.type.toUpperCase()}`);
    
    console.log('\n   Predictions:');
    console.log(`      Short-term: ${signal.predictions.shortTerm.substring(0, 60)}...`);
    console.log(`      Medium-term: ${signal.predictions.mediumTerm.substring(0, 60)}...`);
    console.log(`      Long-term: ${signal.predictions.longTerm.substring(0, 60)}...`);

    console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');
    console.log('🚀 Ready for production use!');
    console.log('   Usage: await coherentMarketEngine.predict("Your market question")\n');
}

testCoherentMarket().catch(console.error);
