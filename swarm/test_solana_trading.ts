/**
 * 🪐 Test Jupiter/Solana Trading Integration
 */

import { jupiter, getSOLPrice, getWalletBalance, buySOL, sellSOL } from './integrations/jupiter.js';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * 🛡️ Wallet Validation for Trading
 */
function parseBoolean(value: string | undefined, fallback = false): boolean {
    if (!value) return fallback;
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function resolveSecretKey(privateKey: string): Keypair {
    const trimmed = privateKey.trim();
    if (!trimmed) throw new Error('SOLANA_PRIVATE_KEY is empty');

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const parsed = JSON.parse(trimmed) as number[];
        const secret = Uint8Array.from(parsed);
        if (secret.length >= 64) return Keypair.fromSecretKey(secret.slice(0, 64));
        return Keypair.fromSeed(secret.slice(0, 32));
    }

    const decoded = bs58.decode(trimmed);
    if (decoded.length === 64) return Keypair.fromSecretKey(decoded);
    if (decoded.length === 32) return Keypair.fromSeed(decoded);
    throw new Error(`Unsupported SOLANA_PRIVATE_KEY length: ${decoded.length}`);
}

async function validateWallet(): Promise<boolean> {
    try {
        const walletAddress = (process.env.SOLANA_WALLET_ADDRESS || '').trim();
        const privateKey = (process.env.SOLANA_PRIVATE_KEY || '').trim();

        const liveTradingEnabled = parseBoolean(process.env.REAL_TRADING_ENABLED, false);
        const autoExecuteTrades = parseBoolean(process.env.SWARM_AUTO_EXECUTE_TRADES, false);
        const autonomousTradingEnabled = parseBoolean(process.env.SWARM_AUTONOMOUS_TRADING_ENABLED, false);

        const requiresSigning = autonomousTradingEnabled || (liveTradingEnabled && autoExecuteTrades);

        if (!walletAddress) {
            console.error('❌ SOLANA_WALLET_ADDRESS missing in environment');
            return false;
        }

        try {
            new PublicKey(walletAddress);
        } catch {
            console.error('❌ Invalid Solana address format');
            return false;
        }

        if (requiresSigning) {
            const signer = resolveSecretKey(privateKey);
            if (signer.publicKey.toBase58() !== walletAddress) {
                console.error('❌ SOLANA_PRIVATE_KEY does not match SOLANA_WALLET_ADDRESS');
                return false;
            }
        }
        
        console.log('✅ Wallet validated:', walletAddress.slice(0, 8) + '...' + walletAddress.slice(-8));
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

  const maxTradeSol = status.maxTradeSol || 0.2;
  const testBuyUsdc = Math.max(1, Number((Math.min(10, maxTradeSol * solPrice * 0.8)).toFixed(2)));
  const testSellSol = Math.max(0.001, Number((Math.min(maxTradeSol * 0.5, Math.max(balance * 0.25, 0.001))).toFixed(6)));

  // Test quote
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Quote Test (Buy SOL with ${testBuyUsdc} USDC)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const buyResult = await buySOL(testBuyUsdc);
  console.log(`   Success: ${buyResult.success ? '✅' : '❌'}`);
  if (buyResult.txId) {
    console.log(`   Tx ID: ${buyResult.txId}`);
    console.log(`   Route: ${buyResult.route}`);
  } else if (buyResult.error) {
    console.log(`   Error: ${buyResult.error}`);
  }
  console.log();

  // Test sell
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Quote Test (Sell ${testSellSol} SOL for USDC)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const sellResult = await sellSOL(testSellSol);
  console.log(`   Success: ${sellResult.success ? '✅' : '❌'}`);
  if (sellResult.txId) {
    console.log(`   Tx ID: ${sellResult.txId}`);
    console.log(`   Output: ${(sellResult.outputAmount! / 1e6).toFixed(2)} USDC`);
  } else if (sellResult.error) {
    console.log(`   Error: ${sellResult.error}`);
  }
  console.log();

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                   📋 TRADING SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (status.mode === 'LIVE') {
    console.log('🎉 TRADING IS LIVE!');
    console.log('   Your swarms can now execute real trades on Solana.');
  } else if (status.mode === 'LIVE_READONLY') {
    console.log('✅ REAL MARKET MODE ACTIVE (READ-ONLY)');
    console.log('   Quotes and market data are real. Enable execution with:');
    console.log('   REAL_TRADING_ENABLED=true');
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
