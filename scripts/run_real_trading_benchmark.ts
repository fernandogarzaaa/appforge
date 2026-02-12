/**
 * Real trading benchmark for Solana/Jupiter.
 *
 * By default this runs REAL market-data + quote benchmarking only.
 * Use --execute with REAL_TRADING_ENABLED=true to place on-chain transactions.
 */

import fs from 'fs/promises';
import path from 'path';
import {
  buySOL,
  getSOLPrice,
  getWalletBalance,
  jupiter,
  sellSOL,
  SOL_MINT,
  USDC_MINT,
  type TradeExecutionOptions,
  type TradeResult
} from '../swarm/integrations/jupiter.js';

type BenchmarkArgs = {
  amountSol: number;
  execute: boolean;
  roundTrip: boolean;
  slippage: number;
  strictReality: boolean;
};

type QuoteProbe = {
  amountSol: number;
  outUsdc: number;
  priceImpactPct: number;
  latencyMs: number;
};

type BenchmarkReport = {
  timestamp: string;
  mode: string;
  wallet?: string;
  realityMode: boolean;
  liveTradingEnabled: boolean;
  execute: boolean;
  roundTrip: boolean;
  slippage: number;
  amountSolRequested: number;
  balanceBeforeSol: number;
  balanceAfterSol?: number;
  solPriceUsd: number;
  quoteProbes: QuoteProbe[];
  execution?: {
    sell: TradeResult;
    buyBack?: TradeResult;
    approxRoundTripPnlSol?: number;
  };
  checks: {
    noSimulationFallback: boolean;
    rpcConfigured: boolean;
    signingConfigured: boolean;
  };
};

function parseArgs(argv: string[]): BenchmarkArgs {
  const getValue = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };

  const amountSol = Number(getValue('--amount-sol') || '0.2');
  const slippage = Number(getValue('--slippage') || '1');

  return {
    amountSol: Number.isFinite(amountSol) && amountSol > 0 ? amountSol : 0.2,
    execute: argv.includes('--execute'),
    roundTrip: argv.includes('--roundtrip'),
    slippage: Number.isFinite(slippage) && slippage > 0 ? slippage : 1,
    strictReality: argv.includes('--strict-reality')
  };
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.filter((v) => Number.isFinite(v) && v > 0))].sort((a, b) => a - b);
}

function toUsd(solAmount: number, solPrice: number): number {
  return Number((solAmount * solPrice).toFixed(2));
}

async function runQuoteProbe(amountSol: number, slippage: number): Promise<QuoteProbe> {
  const amountLamports = Math.floor(amountSol * 1e9);
  const quote = await jupiter.getQuote(SOL_MINT, USDC_MINT, amountLamports, slippage);

  const outAmount = Number(quote?.outAmount || 0);
  const outUsdc = Number((outAmount / 1e6).toFixed(6));
  const priceImpact = Number(quote?.priceImpactPct || 0);
  const latencyMs = Number(quote?._latencyMs || 0);

  return {
    amountSol: Number(amountSol.toFixed(6)),
    outUsdc,
    priceImpactPct: Number(priceImpact.toFixed(6)),
    latencyMs
  };
}

async function persistReport(report: BenchmarkReport): Promise<string> {
  const outDir = path.join(process.cwd(), 'swarm', 'benchmarks');
  const outPath = path.join(outDir, 'real_trading_benchmark_latest.json');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');
  return outPath;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const status = jupiter.getStatus();

  console.log('REAL TRADING BENCHMARK');
  console.log('='.repeat(64));
  console.log(`mode:            ${status.mode}`);
  console.log(`wallet:          ${status.wallet || 'not configured'}`);
  console.log(`realityMode:     ${status.realityMode}`);
  console.log(`liveTrading:     ${status.liveTradingEnabled}`);
  console.log(`execute:         ${args.execute}`);
  console.log(`roundTrip:       ${args.roundTrip}`);
  console.log(`amountSol:       ${args.amountSol}`);
  console.log(`slippage:        ${args.slippage}%`);
  console.log(`strictReality:   ${args.strictReality}`);
  if (!status.realityMode) {
    console.warn('⚠️ Strict real-only fallback guard is OFF. Set SWARM_REALITY_MODE=true in .env.local to disable all simulation fallback paths.');
  }

  if (status.mode === 'SIMULATION' || status.mode === 'MISCONFIGURED') {
    throw new Error(
      `Benchmark aborted: mode=${status.mode}. Configure wallet/RPC and set SWARM_REALITY_MODE=true to force real-only operation.`
    );
  }

  if (args.strictReality && !status.realityMode) {
    throw new Error('Benchmark aborted: SWARM_REALITY_MODE=true is required for strict real-only execution.');
  }

  const balanceBeforeSol = await getWalletBalance();
  const solPriceUsd = await getSOLPrice();

  console.log(`balanceBefore:   ${balanceBeforeSol.toFixed(6)} SOL ($${toUsd(balanceBeforeSol, solPriceUsd)})`);
  console.log(`solPrice:        $${solPriceUsd.toFixed(4)}`);

  if (args.amountSol > balanceBeforeSol) {
    if (args.execute) {
      throw new Error(
        `Insufficient balance for executable benchmark amount ${args.amountSol} SOL (available ${balanceBeforeSol.toFixed(6)} SOL)`
      );
    }

    console.warn(
      `⚠️ Requested amount ${args.amountSol} SOL exceeds current balance ${balanceBeforeSol.toFixed(6)} SOL. Running quote-only benchmark anyway.`
    );
  }

  const probeSizes = uniqueSorted([
    Math.min(0.02, args.amountSol),
    Math.min(0.05, args.amountSol),
    args.amountSol
  ]);

  const quoteProbes: QuoteProbe[] = [];
  for (const amount of probeSizes) {
    const probe = await runQuoteProbe(amount, args.slippage);
    quoteProbes.push(probe);
    console.log(
      `quote: ${probe.amountSol.toFixed(4)} SOL -> ${probe.outUsdc.toFixed(4)} USDC | impact=${probe.priceImpactPct.toFixed(4)}% | latency=${probe.latencyMs}ms`
    );
  }

  let execution: BenchmarkReport['execution'];

  if (args.execute) {
    if (!status.liveTradingEnabled) {
      throw new Error('REAL_TRADING_ENABLED=true is required for --execute');
    }

    const tradeOptions: TradeExecutionOptions = {
      execute: true,
      slippage: args.slippage
    };

    console.log('\nexecuting: SELL SOL -> USDC');
    const sell = await sellSOL(args.amountSol, tradeOptions);
    console.log(`sell: ${sell.success ? 'ok' : 'fail'} | tx=${sell.txId || 'n/a'}`);

    let buyBack: TradeResult | undefined;
    let approxRoundTripPnlSol: number | undefined;

    if (args.roundTrip && sell.success && Number(sell.outputAmount || 0) > 0) {
      const usdcOut = Number(sell.outputAmount || 0) / 1e6;
      // Keep a tiny reserve for slippage/fees on buyback.
      const rebuyBudgetUsdc = Number((usdcOut * 0.995).toFixed(6));

      console.log(`executing: BUY SOL with ${rebuyBudgetUsdc.toFixed(6)} USDC`);
      buyBack = await buySOL(rebuyBudgetUsdc, tradeOptions);
      console.log(`buyBack: ${buyBack.success ? 'ok' : 'fail'} | tx=${buyBack.txId || 'n/a'}`);

      if (buyBack.success && Number(buyBack.outputAmount || 0) > 0) {
        const solReturned = Number(buyBack.outputAmount || 0) / 1e9;
        approxRoundTripPnlSol = Number((solReturned - args.amountSol).toFixed(9));
      }
    }

    execution = {
      sell,
      buyBack,
      approxRoundTripPnlSol
    };
  }

  const balanceAfterSol = await getWalletBalance();

  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    mode: status.mode,
    wallet: status.wallet,
    realityMode: status.realityMode,
    liveTradingEnabled: status.liveTradingEnabled,
    execute: args.execute,
    roundTrip: args.roundTrip,
    slippage: args.slippage,
    amountSolRequested: args.amountSol,
    balanceBeforeSol,
    balanceAfterSol,
    solPriceUsd,
    quoteProbes,
    execution,
    checks: {
      noSimulationFallback: status.realityMode,
      rpcConfigured: status.configured,
      signingConfigured: status.signingConfigured
    }
  };

  const outPath = await persistReport(report);

  console.log('\n'.concat('='.repeat(64)));
  console.log('benchmark status: complete');
  console.log(`balanceAfter:      ${balanceAfterSol.toFixed(6)} SOL ($${toUsd(balanceAfterSol, solPriceUsd)})`);
  console.log(`reportFile:        ${outPath}`);
}

main().catch((error) => {
  console.error('Real trading benchmark failed:', error?.message || error);
  process.exit(1);
});
