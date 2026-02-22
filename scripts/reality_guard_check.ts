/**
 * Reality guard check for swarm runtime.
 * Verifies strict real-mode settings, integration readiness, and holographic integrity.
 */

import fs from 'fs/promises';
import path from 'path';
import { isRealityMode, realityStatusSummary } from '../swarm/core/reality_mode.js';
import { jupiter } from '../swarm/integrations/jupiter.js';
import { binance } from '../swarm/integrations/binance.js';
import { twitter } from '../swarm/integrations/twitter.js';
import { youtube } from '../swarm/integrations/youtube.js';
import { QuantumSwarmCore } from '../swarm/core/quantum_core.js';

async function main(): Promise<void> {
  console.log('SWARM REALITY GUARD CHECK');
  console.log('='.repeat(64));
  console.log(`env: ${realityStatusSummary()}`);

  const failures: string[] = [];
  const warnings: string[] = [];

  if (!isRealityMode()) {
    failures.push('SWARM_REALITY_MODE must be true');
  }

  const jupiterStatus = jupiter.getStatus();
  const binanceStatus = binance.getStatus();
  const twitterStatus = twitter.getStatus();
  const youtubeStatus = youtube.getStatus();
  const autoTradeRaw = (process.env.SWARM_AUTONOMOUS_TRADING_ENABLED || '').trim().toLowerCase();
  const autoTradeEnabled = autoTradeRaw
    ? ['1', 'true', 'yes', 'on'].includes(autoTradeRaw)
    : isRealityMode();

  console.log(`jupiter: mode=${jupiterStatus.mode}, configured=${jupiterStatus.configured}`);
  console.log(`binance: mode=${binanceStatus.mode}, configured=${binanceStatus.configured}`);
  console.log(`twitter: mode=${twitterStatus.mode}, configured=${twitterStatus.configured}`);
  console.log(`youtube: mode=${youtubeStatus.mode}, configured=${youtubeStatus.configured}`);
  console.log(`autotrade: enabled=${autoTradeEnabled}`);

  if (jupiterStatus.mode === 'SIMULATION' || jupiterStatus.mode === 'MISCONFIGURED') {
    failures.push('Jupiter integration is not live-ready');
  }

  if (binanceStatus.mode === 'MISCONFIGURED') {
    warnings.push('Binance authenticated trading not configured (AutomatedTradingSwarm runs signal-only)');
  }

  if (autoTradeEnabled && !jupiterStatus.liveTradingEnabled) {
    failures.push('SWARM_AUTONOMOUS_TRADING_ENABLED=true requires REAL_TRADING_ENABLED=true');
  }

  if (autoTradeEnabled && !jupiterStatus.signingConfigured) {
    failures.push('SWARM_AUTONOMOUS_TRADING_ENABLED=true requires SOLANA_PRIVATE_KEY for transaction signing');
  }

  if (twitterStatus.mode === 'MISCONFIGURED') {
    warnings.push('Twitter integration missing keys (SocialMediaSwarm will disable Twitter in reality mode)');
  }

  if (youtubeStatus.mode === 'MISCONFIGURED') {
    warnings.push('YouTube integration missing keys (SocialMediaSwarm will disable YouTube in reality mode)');
  }

  const benchmarkPath = path.join(process.cwd(), 'swarm', 'benchmarks', 'real_trading_benchmark_latest.json');
  try {
    const raw = await fs.readFile(benchmarkPath, 'utf8');
    const report = JSON.parse(raw) as { checks?: { noSimulationFallback?: boolean } };
    const noFallback = Boolean(report?.checks?.noSimulationFallback);
    console.log(`latest benchmark noSimulationFallback=${noFallback}`);
    if (!noFallback) {
      failures.push('Latest real trading benchmark indicates simulation fallback still active');
    }
  } catch {
    warnings.push('No real trading benchmark report found yet');
  }

  // --- HOLOGRAPHIC INTEGRITY CHECK (Phase 1060) ---
  console.log('\n--- HOLOGRAPHIC INTEGRITY ---');
  try {
    const core = new QuantumSwarmCore();
    const stats = core.getStats();
    console.log(`coherence_level: ${stats.quantum_coherence.toFixed(4)}`);
    console.log(`swarm_integrity: ${stats.swarm_integrity}`);
    console.log(`coherence_lock: ${stats.coherence_lock}`);

    if (stats.quantum_coherence < 0.9) {
      warnings.push(`Low quantum coherence detected: ${stats.quantum_coherence.toFixed(4)}. Stability might be compromised.`);
    }

    if (stats.swarm_integrity !== 'Peak') {
      failures.push('Swarm integrity is not at Peak state.');
    }
  } catch (error: any) {
    warnings.push(`Holographic integrity check failed to initialize: ${error.message}`);
  }

  if (warnings.length > 0) {
    console.log('\nWARNINGS');
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (failures.length > 0) {
    console.log('\nFAILURES');
    for (const failure of failures) {
      console.log(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('\nPASS: Reality guard is active for swarm runtime.');
}

main().catch((error) => {
  console.error('Reality guard check failed:', error);
  process.exit(1);
});
