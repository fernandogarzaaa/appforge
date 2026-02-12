/**
 * 🪐 Test Jupiter/Solana Trading Integration
 */

import { jupiter, getSOLPrice, getWalletBalance, buySOL, sellSOL, isJupiterConfigured, SOL_MINT, USDC_MINT } from './integrations/jupiter.js';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Get wallet path - absolute path from project root
const walletPath = path.resolve(process.cwd(), 'swarm/data/swarm_wallet.json');

/**
 * 🛡️ Wallet Validation for Trading
 */
async function validateWallet(): Promise<boolean> {
    try {
        console.log(`📂 Checking wallet at: ${walletPath}`);
        const exists = await fs.access(walletPath).then(() => true).catch(() => false);
        if (!exists) {
            console.error('❌ Wallet file not found');
            return false;
        }
        
        const content = await fs.readFile(walletPath, 'utf8');
        
        // Check for corruption patterns
        if (content.includes('der mansion')) {
            console.error('❌ Wallet file is corrupted');
            return false;
        }
        
        const wallet = JSON.parse(content);
        
        if (!wallet.address || !wallet.privateKey?.value) {
            console.error('❌ Missing wallet fields');
            return false;
        }
        
        // Verify key format (base58, 32 bytes = 44 chars)
        const privateKeyBase58 = wallet.privateKey.value;
        if (privateKeyBase58.length !== 44) {
            console.error('❌ Invalid private key length');
            return false;
        }
        
        // Validate base58 address format
        if (!wallet.address.startsWith('1') && !wallet.address.startsWith('E')) {
            console.error('❌ Invalid Solana address format');
            return false;
        }
        
        console.log('✅ Wallet validated:', wallet.address.slice(0, 8) + '...' + wallet.address.slice(-8));
        return true;
        
    } catch (e: any) {
        console.error('❌ Wallet error:', e.message);
        return false;
    }
}

async function testJupiter() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        🪐 JUPITER/SOLANA TRADING TEST                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Validate wallet first
  console.log('🛡️ Validating wallet...');
  if (!await validateWallet()) {
    console.error('🚫 Trading aborted - wallet invalid');
    return;
  }

  // Check configuration
  const status = jupiter.getStatus();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Configuration Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Mode: ${status.mode}`);
  console.log(`   Wallet: ${status.wallet || 'Not configured'}`);
  console.log();

  // Get SOL price
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 Market Data');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const solPrice = await getSOLPrice();
  console.log(`   SOL Price: $${solPrice.toFixed(2)}`);
  console.log();

  // Get wallet balance
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👛 Wallet Balance');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const balance = await getWalletBalance();
  console.log(`   SOL Balance: ${balance.toFixed(4)} SOL`);
  console.log(`   USD Value: $${(balance * solPrice).toFixed(2)}`);
  console.log();

  // Test quote
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Quote Test (Buy 1 SOL with USDC)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const buyResult = await buySOL(100); // Buy $100 worth
  console.log(`   Success: ${buyResult.success ? '✅' : '❌'}`);
  if (buyResult.txId) {
    console.log(`   Tx ID: ${buyResult.txId}`);
    console.log(`   Route: ${buyResult.route}`);
  }
  console.log();

  // Test sell
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Quote Test (Sell 0.5 SOL for USDC)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const sellResult = await sellSOL(0.5);
  console.log(`   Success: ${sellResult.success ? '✅' : '❌'}`);
  if (sellResult.txId) {
    console.log(`   Tx ID: ${sellResult.txId}`);
    console.log(`   Output: ${(sellResult.outputAmount! / 1e6).toFixed(2)} USDC`);
  }
  console.log();

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                   📋 TRADING SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (status.mode === 'LIVE') {
    console.log('🎉 TRADING IS LIVE!');
    console.log('   Your swarms can now execute real trades on Solana.');
  } else {
    console.log('📝 To enable LIVE trading:\n');
    console.log('   1. Install Phantom Wallet: https://phantom.app');
    console.log('   2. Add your wallet address:');
    console.log('      SOLANA_WALLET_ADDRESS=your_phantom_address\n');
    console.log('   3. Add your private key (optional, for auto-trading):');
    console.log('      SOLANA_PRIVATE_KEY=your_private_key\n');
    console.log('💡 For manual trading, open: https://jup.ag');
  }
}

testJupiter().catch(console.error);
