/**
 * 🧪 Test Real Integrations
 * Run this to check which APIs are configured and which need keys
 */

import { binance } from './integrations/binance.js';
import { youtube } from './integrations/youtube.js';
import { twitter } from './integrations/twitter.js';

async function testIntegrations() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          🔑 REAL INTEGRATIONS STATUS CHECK                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test Binance
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 BINANCE (Crypto Trading)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const binanceStatus = binance.getStatus();
  console.log(`   Status: ${binanceStatus.configured ? '✅ LIVE' : '⚠️ SIMULATION'}`);
  console.log(`   Mode: ${binanceStatus.mode}`);
  
  if (binanceStatus.configured) {
    const btcPrice = await binance.getPrice('BTCUSDT');
    console.log(`   BTC/USDT: $${btcPrice.toLocaleString()}`);
  } else {
    console.log('   💡 Add BINANCE_API_KEY and BINANCE_SECRET_KEY to .env.local');
  }
  console.log();

  // Test YouTube
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📺 YOUTUBE (Video Uploads)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const ytStatus = youtube.getStatus();
  console.log(`   Status: ${ytStatus.configured ? '✅ LIVE' : '⚠️ SIMULATION'}`);
  console.log(`   Mode: ${ytStatus.mode}`);
  
  if (!ytStatus.configured) {
    console.log('   💡 Add YOUTUBE_API_KEY, YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET to .env.local');
  }
  console.log();

  // Test Twitter
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🐦 TWITTER/X (Tweets & Threads)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const twStatus = twitter.getStatus();
  console.log(`   Status: ${twStatus.configured ? '✅ LIVE' : '⚠️ SIMULATION'}`);
  console.log(`   Mode: ${twStatus.mode}`);
  
  if (!twStatus.configured) {
    console.log('   💡 Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET to .env.local');
  }
  console.log();

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                   📋 CONFIGURATION SUMMARY                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const allConfigured = binanceStatus.configured && ytStatus.configured && twStatus.configured;
  
  if (allConfigured) {
    console.log('🎉 ALL INTEGRATIONS ARE LIVE!');
    console.log('🚀 Your swarms will now execute REAL trades and posts.');
  } else {
    console.log('📝 To enable REAL revenue streams, add these keys:\n');
    
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│  CRYPTO TRADING                                          │');
    console.log('├────────────────────────────────────────────────────────────┤');
    console.log('│  BINANCE_API_KEY=your_api_key                            │');
    console.log('│  BINANCE_SECRET_KEY=your_secret_key                      │');
    console.log('└────────────────────────────────────────────────────────────┘\n');
    
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│  SOCIAL MEDIA                                            │');
    console.log('├────────────────────────────────────────────────────────────┤');
    console.log('│  YOUTUBE_API_KEY=your_key                                │');
    console.log('│  TWITTER_API_KEY=your_key                                │');
    console.log('│  INSTAGRAM_ACCESS_TOKEN=your_token                       │');
    console.log('└────────────────────────────────────────────────────────────┘\n');
    
    console.log('💡 Once keys are added, restart the swarm to go LIVE!');
  }
}

testIntegrations().catch(console.error);
