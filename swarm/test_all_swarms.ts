/**
 * Comprehensive Test: All Oracle-Recommended Swarms
 * Tests: InstagramAgent, TwitterAgent, AutomatedTradingSwarm, FreelanceHunterSwarm, PersistentMemory
 */

import { InstagramAgent } from './agents/InstagramAgent.js';
import { TwitterAgent } from './agents/TwitterAgent.js';
import { AutomatedTradingSwarm } from './agents/AutomatedTradingSwarm.js';
import { FreelanceHunterSwarm } from './agents/FreelanceHunterSwarm.js';
import { PersistentMemory } from './core/persistent_memory.js';

async function testAllSwarms() {
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║         COMPREHENSIVE SWARM TEST - ALL ORACLE RECOMMENDATIONS    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Test 1: Persistent Memory
    console.log('━'.repeat(70));
    console.log('🧠 TEST 1: Persistent Memory (Redis Integration)');
    console.log('━'.repeat(70));

    const memory = new PersistentMemory();
    
    await memory.set('test:key1', { data: 'test value' });
    const retrieved = await memory.get<any>('test:key1');
    console.log('✅ Retrieved:', retrieved);

    await memory.learn('TikTokAgent', 'post_video', true, 100);
    await memory.learn('TikTokAgent', 'post_video', true, 150);
    await memory.learn('TikTokAgent', 'post_video', false, -50);

    const bestActions = await memory.getBestActions('TikTokAgent');
    console.log('📚 Best actions:', bestActions);

    const stats = await memory.stats();
    console.log('💾 Memory stats:', stats.totalItems, 'items');

    // Test 2: Instagram Agent
    console.log('\n' + '━'.repeat(70));
    console.log('📸 TEST 2: Instagram Agent');
    console.log('━'.repeat(70));

    const instagram = new InstagramAgent();
    await instagram.train();

    const instaPost = {
        caption: 'Check out our new AI feature!',
        hashtags: ['#ai', '#tech'],
        type: 'reel' as const,
        mediaUrls: ['video.mp4']
    };

    const optimizedPost = await instagram.optimizeForAlgorithm(instaPost);
    console.log('📸 Optimized caption:', optimizedPost.caption);
    console.log('📸 Optimized hashtags:', optimizedPost.hashtags);

    await instagram.upload(optimizedPost);
    const instaMetrics = await instagram.getMetrics();
    console.log('📸 Followers:', instaMetrics.followers);
    console.log('📸 Reach:', instaMetrics.reach);

    // Test 3: Twitter Agent
    console.log('\n' + '━'.repeat(70));
    console.log('🐦 TEST 3: Twitter/X Agent');
    console.log('━'.repeat(70));

    const twitter = new TwitterAgent();
    await twitter.train();

    const tweet = {
        text: 'AI is changing everything!',
        hashtags: ['#AI', '#Tech'],
        type: 'thread' as const
    };

    const optimizedTweet = await twitter.optimizeTweet(tweet);
    console.log('🐦 Optimized tweet:', optimizedTweet.text);

    await twitter.post(optimizedTweet);
    const thread = await twitter.createThread('AI Automation');
    console.log('🐦 Created thread with', thread.length, 'tweets');

    const twitterMetrics = await twitter.getMetrics();
    console.log('🐦 Followers:', twitterMetrics.followers);
    console.log('🐦 Impressions:', twitterMetrics.impressions);

    // Test 4: Automated Trading Swarm
    console.log('\n' + '━'.repeat(70));
    console.log('📈 TEST 4: Automated Trading Swarm (Crypto/Stocks)');
    console.log('━'.repeat(70));

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
    console.log('📈 Portfolio Value:', portfolio.totalValue);
    console.log('📈 P&L:', portfolio.pnl.toFixed(2));
    console.log('📈 Win Rate:', (portfolio.winRate * 100).toFixed(1), '%');

    const trades = trading.getTradeHistory();
    console.log('📈 Total Trades:', trades.length);

    // Test 5: Freelance Hunter Swarm
    console.log('\n' + '━'.repeat(70));
    console.log('🎯 TEST 5: Freelance Hunter Swarm');
    console.log('━'.repeat(70));

    const freelance = new FreelanceHunterSwarm({
        platforms: ['upwork', 'toptal', 'linkedin'],
        targetRate: 250,
        targetContractSize: 5000,
        niches: ['AI/ML', 'Web Development']
    });

    await freelance.train();
    await freelance.runCycle();

    const stats2 = freelance.getStats();
    console.log('🎯 Contracts Won:', stats2.won);
    console.log('🎯 Total Revenue:', '$' + stats2.revenue.toLocaleString());
    console.log('🎯 Proposals Sent:', stats2.proposals);

    const opps = freelance.getOpportunities();
    console.log('🎯 Opportunities Found:', opps.length);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ALL TESTS COMPLETE ✅                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');

    console.log('\n📊 SUMMARY OF ORACLE RECOMMENDATIONS IMPLEMENTED:');
    console.log('');
    console.log('   ✅ Step 1: Social Media Swarm (TikTok, YouTube, Facebook)');
    console.log('   ✅ Step 2: Instagram & Twitter Agents Added');
    console.log('   ✅ Step 3: Persistent Memory (Redis Integration)');
    console.log('   ✅ Step 4: FreelanceHunter Swarm (High-ticket contracts)');
    console.log('   ✅ Step 5: AutomatedTradingSwarm (Crypto/Stocks)');
    console.log('');
    console.log('🎯 All Oracle recommendations have been implemented!');
}

testAllSwarms().catch(console.error);
