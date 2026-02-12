/**
 * Swarm Diagnostic Tool
 * Investigates all swarms for issues
 */

import { InstagramAgent } from './agents/InstagramAgent.js';
import { TwitterAgent } from './agents/TwitterAgent.js';
import { AutomatedTradingSwarm } from './agents/AutomatedTradingSwarm.js';
import { FreelanceHunterSwarm } from './agents/FreelanceHunterSwarm.js';
import { PersistentMemory } from './core/persistent_memory.js';

async function diagnoseAllSwarms() {
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║              SWARM DIAGNOSTIC - FULL INVESTIGATION               ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    let allHealthy = true;

    // Test 1: Persistent Memory
    console.log('━'.repeat(70));
    console.log('🧠 TEST 1: Persistent Memory');
    console.log('━'.repeat(70));
    try {
        const memory = new PersistentMemory();
        await memory.set('test:key', { value: 'test' });
        const result = await memory.get<any>('test:key');
        if (result) {
            console.log('✅ Memory: HEALTHY');
        } else {
            console.log('❌ Memory: FAILED - Could not retrieve data');
            allHealthy = false;
        }
    } catch (e: any) {
        console.log('❌ Memory ERROR:', e.message);
        allHealthy = false;
    }

    // Test 2: Instagram Agent
    console.log('\n' + '━'.repeat(70));
    console.log('📸 TEST 2: Instagram Agent');
    console.log('━'.repeat(70));
    try {
        const insta = new InstagramAgent();
        await insta.train();
        const post = { caption: 'Test', hashtags: [], type: 'feed' as const, mediaUrls: [] };
        const optimized = await insta.optimizeForAlgorithm(post);
        await insta.upload(optimized);
        const metrics = await insta.getMetrics();
        console.log('✅ Instagram: HEALTHY');
        console.log(`   Metrics: ${metrics.followers} followers, ${metrics.reach} reach`);
    } catch (e: any) {
        console.log('❌ Instagram ERROR:', e.message);
        allHealthy = false;
    }

    // Test 3: Twitter Agent
    console.log('\n' + '━'.repeat(70));
    console.log('🐦 TEST 3: Twitter Agent');
    console.log('━'.repeat(70));
    try {
        const twitter = new TwitterAgent();
        await twitter.train();
        const tweet = { text: 'Test tweet', hashtags: [], type: 'single' as const };
        const optimized = await twitter.optimizeTweet(tweet);
        await twitter.post(optimized);
        const thread = await twitter.createThread('AI');
        const metrics = await twitter.getMetrics();
        console.log('✅ Twitter: HEALTHY');
        console.log(`   Created ${thread.length} tweets, ${metrics.impressions} impressions`);
    } catch (e: any) {
        console.log('❌ Twitter ERROR:', e.message);
        allHealthy = false;
    }

    // Test 4: Automated Trading Swarm
    console.log('\n' + '━'.repeat(70));
    console.log('📈 TEST 4: Automated Trading Swarm');
    console.log('━'.repeat(70));
    try {
        const trading = new AutomatedTradingSwarm({
            tradingPairs: ['BTC/USDT', 'ETH/USDT'],
            riskLevel: 'medium',
            maxPositionSize: 0.1,
            stopLoss: 0.05,
            takeProfit: 0.15
        });
        await trading.train();
        await trading.runCycle();
        const portfolio = trading.getPortfolio();
        const trades = trading.getTradeHistory();
        
        if (trades.length > 0) {
            console.log('✅ Trading: HEALTHY');
            console.log(`   Portfolio: $${portfolio.totalValue}, P&L: $${portfolio.pnl.toFixed(2)}`);
            console.log(`   Trades Executed: ${trades.length}`);
            trades.forEach(t => {
                console.log(`   - ${t.side.toUpperCase()} ${t.quantity} ${t.symbol} @ $${t.price}`);
            });
        } else {
            console.log('⚠️ Trading: NO TRADES EXECUTED');
            allHealthy = false;
        }
    } catch (e: any) {
        console.log('❌ Trading ERROR:', e.message);
        allHealthy = false;
    }

    // Test 5: Freelance Hunter Swarm
    console.log('\n' + '━'.repeat(70));
    console.log('🎯 TEST 5: Freelance Hunter Swarm');
    console.log('━'.repeat(70));
    try {
        const freelance = new FreelanceHunterSwarm({
            platforms: ['upwork', 'toptal'],
            targetRate: 250,
            targetContractSize: 5000
        });
        await freelance.train();
        await freelance.runCycle();
        const stats = freelance.getStats();
        const opps = freelance.getOpportunities();
        
        if (stats.revenue > 0) {
            console.log('✅ Freelance: HEALTHY');
            console.log(`   Revenue: $${stats.revenue}, Contracts: ${stats.won}`);
        } else {
            console.log('⚠️ Freelance: NO CONTRACTS WON');
            console.log(`   Opportunities Found: ${opps.length}`);
            if (opps.length === 0) {
                console.log('   ⚠️ Issue: No opportunities being found');
            }
            allHealthy = false;
        }
    } catch (e: any) {
        console.log('❌ Freelance ERROR:', e.message);
        allHealthy = false;
    }

    // Summary
    console.log('\n' + '╔════════════════════════════════════════════════════════════════════╗');
    if (allHealthy) {
        console.log('║                   ALL SWARMS: HEALTHY ✅                           ║');
    } else {
        console.log('║              ISSUES DETECTED - NEEDS FIX ⚠️                    ║');
    }
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    return allHealthy;
}

diagnoseAllSwarms().catch(console.error);
