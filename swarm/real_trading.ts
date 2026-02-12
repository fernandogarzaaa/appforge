/**
 * 🪐 REAL Jupiter/Solana Trading
 * 
 * This file uses your REAL wallet: 7q4QCFxP99PbosKx4NnMJddhhoYNazpXitRDXsEpXo5S
 * 
 * ⚠️ WARNING: This executes REAL trades on Solana mainnet!
 */

import https from 'https';

// Your wallet
const WALLET = '7q4QCFxP99PbosKx4NnMJddhhoYNazpXitRDXsEpXo5S';
const RPC_URL = 'https://api.mainnet-beta.solana.com';

// Token mints
const SOL_MINT = 'So11111111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function rpc(method: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 10000),
      method,
      params
    });

    const req = https.request(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body).result));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getBalance(): Promise<number> {
  const result = await rpc('getBalance', [WALLET]);
  return (result?.value || 0) / 1e9;
}

async function getSOLPrice(): Promise<number> {
  try {
    const response = await fetch('https://price.jup.ag/v4/price?ids=SOL');
    const data = await response.json();
    return data?.data?.SOL?.price || 165;
  } catch {
    return 165;
  }
}

async function getQuote(inputMint: string, outputMint: string, amount: number): Promise<any> {
  const url = `https://api.jup.ag/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippage=1`;
  const response = await fetch(url);
  return response.json();
}

async function createSwap(quoteResponse: any): Promise<any> {
  const response = await fetch('https://api.jup.ag/v1/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: WALLET,
      wrapUnwrapSOL: true
    })
  });
  return response.json();
}

async function simulateTrade(direction: 'BUY' | 'SELL', amount: number): Promise<void> {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🪐 REAL TRADE: ${direction} ${amount} SOL`);
  console.log(`${'═'.repeat(50)}\n`);

  const balance = await getBalance();
  const solPrice = await getSOLPrice();

  console.log(`📊 Current Status:`);
  console.log(`   Wallet: ${WALLET.slice(0, 8)}...${WALLET.slice(-8)}`);
  console.log(`   Balance: ${balance.toFixed(4)} SOL ($${(balance * solPrice).toFixed(2)})`);
  console.log(`   SOL Price: $${solPrice.toFixed(2)}`);

  if (direction === 'SELL' && amount > balance) {
    console.log(`\n❌ Error: Insufficient balance!`);
    console.log(`   Have: ${balance.toFixed(4)} SOL`);
    console.log(`   Need: ${amount} SOL`);
    return;
  }

  const inputMint = direction === 'BUY' ? USDC_MINT : SOL_MINT;
  const outputMint = direction === 'BUY' ? SOL_MINT : USDC_MINT;
  const amountLamports = Math.floor(amount * 1e9);

  console.log(`\n📋 Trade Details:`);
  console.log(`   ${direction}: ${amount} SOL`);
  console.log(`   Input: ${inputMint === SOL_MINT ? 'SOL' : 'USDC'}`);
  console.log(`   Output: ${outputMint === SOL_MINT ? 'SOL' : 'USDC'}`);
  console.log(`   Amount (lamports): ${amountLamports}`);

  // Get quote
  console.log(`\n🔍 Getting Jupiter quote...`);
  const quote = await getQuote(inputMint, outputMint, amountLamports);
  
  if (quote?.error) {
    console.log(`❌ Quote error: ${quote.error}`);
    return;
  }

  console.log(`   ✅ Quote received:`);
  console.log(`   Output: ${(quote.outAmount / (outputMint === SOL_MINT ? 1e9 : 1e6)).toFixed(4)} ${outputMint === SOL_MINT ? 'SOL' : 'USDC'}`);
  console.log(`   Price impact: ${quote.priceImpactPct?.toFixed(4)}%`);
  console.log(`   Route: ${quote.route}`);

  // Create swap transaction
  console.log(`\n🔐 Creating swap transaction...`);
  const swapData = await createSwap(quote);

  if (swapData?.error) {
    console.log(`❌ Swap error: ${swapData.error}`);
    return;
  }

  console.log(`\n⚠️  IMPORTANT - MANUAL ACTION REQUIRED:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   This is a REAL trade with REAL money!`);
  console.log(`   `);
  console.log(`   To execute, you need to sign this transaction.`);
  console.log(`   `);
  console.log(`   Option 1: Use Phantom Wallet`);
  console.log(`   1. Copy the swapTransaction below`);
  console.log(`   2. Go to https://jup.ag/swap`);
  console.log(`   3. Connect Phantom and sign`);
  console.log(`   `);
  console.log(`   Option 2 (Advanced): Sign with private key`);
  console.log(`   Add SOLANA_PRIVATE_KEY to .env.local`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Show truncated transaction for verification
  const txPreview = swapData.swapTransaction?.slice(0, 100) + '...';
  console.log(`Transaction (first 100 chars):`);
  console.log(`   ${txPreview}\n`);
}

async function main() {
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║     🪐 ANTIGRAVITY SWARM - REAL SOLANA TRADING        ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);

  const args = process.argv.slice(2);
  const direction = (args[0]?.toUpperCase() === 'BUY') ? 'BUY' : 'SELL';
  const amount = parseFloat(args[1]) || 0.05;

  await simulateTrade(direction, amount);
}

main().catch(console.error);
