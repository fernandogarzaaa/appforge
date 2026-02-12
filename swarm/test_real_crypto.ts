/**
 * Test REAL CryptoSwarm Analysis
 * Run from appforge-main directory: npx tsx swarm/test_real_crypto.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

import { Base44Tool } from './tools/base44.js';
import { FileSystemTool } from './tools/filesystem.js';
import { CryptoSwarm } from './agents/CryptoSwarm.js';

async function testRealCrypto() {
    console.log('🧪 Testing REAL CryptoSwarm Analysis...\n');

    const base44 = new Base44Tool();
    const fsTool = new FileSystemTool();
    const cryptoSwarm = new CryptoSwarm(base44, fsTool);

    try {
        const result = await cryptoSwarm.run();
        
        console.log('\n📊 REAL Analysis Results:');
        console.log('─'.repeat(40));
        console.log(`Status: ${result.status}`);
        console.log(`Tokens Analyzed: ${result.analyzedTokens}`);
        console.log(`Signals Generated: ${result.signals.length}`);
        
        if (result.signals.length > 0) {
            console.log('\n🎯 Trading Signals:');
            for (const signal of result.signals.slice(0, 5)) {
                console.log(`  • ${signal.token}: ${signal.signal} (${signal.confidence * 100}% confidence)`);
                console.log(`    ${signal.reason}`);
            }
        }

        if (result.opportunities.length > 0) {
            console.log('\n💰 Opportunities:');
            for (const opp of result.opportunities.slice(0, 5)) {
                console.log(`  • ${opp}`);
            }
        }

        if (result.risks.length > 0) {
            console.log('\n⚠️ Risks:');
            for (const risk of result.risks.slice(0, 5)) {
                console.log(`  • ${risk}`);
            }
        }

        // Show real market data
        const marketData = cryptoSwarm.getMarketData();
        console.log('\n📈 Market Data (REAL from DexScreener):');
        console.log('─'.repeat(40));
        for (const token of marketData.filter(t => t.price > 0).slice(0, 5)) {
            const changeEmoji = token.priceChange24h >= 0 ? '📈' : '📉';
            console.log(`${token.symbol}: $${token.price.toFixed(6)} ${changeEmoji} ${token.priceChange24h.toFixed(2)}%`);
            console.log(`  Vol: $${(token.volume24h/1000000).toFixed(2)}M | Liq: $${(token.liquidity/1000).toFixed(0)}K`);
        }

        console.log('\n✅ REAL CryptoSwarm Test Complete!');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testRealCrypto();
