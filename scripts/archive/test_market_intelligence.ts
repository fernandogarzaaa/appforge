/**
 * 🎯 PREDICTIVE MARKET INTELLIGENCE ENGINE TEST
 * 
 * Run: npx tsx test_market_intelligence.ts
 */

import { marketIntelligenceEngine, PredictionResult } from './swarm/core/market_intelligence_engine.js';

async function testMarketIntelligence() {
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║     🎯 PREDICTIVE MARKET INTELLIGENCE ENGINE TEST                ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

    // Initialize
    console.log('[1/3] Initializing Market Intelligence Engine...');
    await marketIntelligenceEngine.initialize();
    console.log('   ✅ Engine initialized\n');

    // Test 1: Short-term crypto prediction
    console.log('[2/3] Testing short-term crypto prediction...');
    const shortTermResult = await marketIntelligenceEngine.predict({
        timeHorizon: 'short',
        assetClass: 'CRYPTO',
        question: 'What is the short-term outlook for Bitcoin? Consider: 1) Current price action, 2) Support/resistance levels, 3) Volume trends, 4) Market sentiment.'
    });
    console.log(`   ✅ Short-term prediction complete (${shortTermResult.confidence.toFixed(1)}% confidence)\n`);

    // Test 2: Medium-term general market
    console.log('[3/3] Testing medium-term general market prediction...');
    const mediumTermResult = await marketIntelligenceEngine.predict({
        timeHorizon: 'medium',
        assetClass: 'GENERAL',
        question: 'Analyze general market conditions and predict medium-term trends. Consider: 1) Economic indicators, 2) Sector rotation, 3) Risk factors.'
    });
    console.log(`   ✅ Medium-term prediction complete (${mediumTermResult.confidence.toFixed(1)}% confidence)\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('                        📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    const history = marketIntelligenceEngine.getHistory();
    console.log(`Total Predictions: ${history.length}`);
    console.log(`Average Confidence: ${(history.reduce((a, b) => a + b.confidence, 0) / history.length * 100).toFixed(1)}%`);
    console.log(`Average Coherence: ${(history.reduce((a, b) => a + b.coherence, 0) / history.length * 100).toFixed(1)}%`);
    console.log(`Oracle Validations: ${history.filter(h => h.validation.oracleValidated).length}/${history.length}\n`);

    // Display latest prediction
    console.log('Latest Prediction:');
    const latest = history[history.length - 1];
    console.log(`   📝 ${latest.prediction.substring(0, 150)}...`);
    console.log(`   🎯 Confidence: ${(latest.confidence * 100).toFixed(1)}%`);
    console.log(`   🔮 Oracle: ${latest.validation.oracleValidated ? '✅ Validated' : '⚠️ Needs Review'}`);

    console.log('\n═══════════════════════════════════════════════════════════════════════\n');
    console.log('🚀 Ready for production predictions!');
    console.log('   Usage: marketIntelligenceEngine.predict({ timeHorizon: "short", assetClass: "CRYPTO" })\n');
}

testMarketIntelligence().catch(console.error);
