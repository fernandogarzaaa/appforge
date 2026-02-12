/**
 * AutonomousTradingController
 *
 * Reality-only autonomous trading loop:
 * - Waits for funding threshold (default: 0.2 SOL)
 * - Starts a 72-hour challenge window
 * - Executes live Jupiter trades with strict risk controls
 * - Persists state for crash/restart continuity
 */

import fs from 'fs/promises';
import path from 'path';
import {
    buySOL,
    getSOLPrice,
    getWalletBalance,
    jupiter,
    sellSOL,
    type TradeExecutionOptions,
    type TradeResult
} from '../integrations/jupiter.js';
import { isRealityMode, requireRealityMode } from './reality_mode.js';

type ChallengePhase = 'waiting_funding' | 'active' | 'completed' | 'expired' | 'halted';
type LedgerAction = 'ACTIVATE' | 'SELL_SOL' | 'BUY_SOL' | 'HALT' | 'COMPLETE' | 'ERROR' | 'INFO';

interface PricePoint {
    ts: string;
    priceUsd: number;
}

interface TradeLedgerEntry {
    id: string;
    ts: string;
    action: LedgerAction;
    reason: string;
    success: boolean;
    txId?: string;
    amountSol?: number;
    amountUsdc?: number;
    outputSol?: number;
    outputUsdc?: number;
    signalStrengthPct?: number;
    error?: string;
}

interface ChallengeState {
    version: number;
    phase: ChallengePhase;
    startedAt: string;
    activatedAt?: string;
    expiresAt?: string;
    completedAt?: string;
    startBalanceSol?: number;
    latestBalanceSol?: number;
    peakBalanceSol?: number;
    trackedUsdcBalance: number;
    tradesToday: number;
    tradesDayKey: string;
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    consecutiveFailures: number;
    lastTradeAt?: string;
    blockedReason?: string;
    haltedReason?: string;
    completionReason?: string;
    priceHistory: PricePoint[];
    ledger: TradeLedgerEntry[];
}

interface ControllerConfig {
    enabled: boolean;
    pollIntervalMs: number;
    tradeIntervalMs: number;
    fundingTriggerSol: number;
    targetSol: number;
    challengeDurationHours: number;
    minSolReserve: number;
    riskPerTrade: number;
    minTradeSol: number;
    minTradeUsdc: number;
    maxTradeSol: number;
    maxDrawdownPct: number;
    maxTradesPerDay: number;
    minSignalPct: number;
    slippagePct: number;
    maxConsecutiveFailures: number;
}

interface TickContext {
    isPaused?: boolean;
    cycleCount?: number;
}

interface TradeSignal {
    action: 'SELL_SOL' | 'BUY_SOL' | 'HOLD';
    strengthPct: number;
    reason: string;
}

interface TradePlan {
    action: 'SELL_SOL' | 'BUY_SOL';
    amountSol?: number;
    amountUsdc?: number;
}

function parseBoolean(value: string | undefined, fallback = false): boolean {
    if (!value) return fallback;
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function parseNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 6): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, current) => sum + current, 0) / values.length;
}

function dayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export class AutonomousTradingController {
    private readonly statePath: string;
    private readonly config: ControllerConfig;
    private state: ChallengeState;
    private initialized = false;
    private lastTickAtMs = 0;

    constructor(statePath = path.join(process.cwd(), 'swarm', 'data', 'autonomous_trading_state.json')) {
        const jupiterStatus = jupiter.getStatus();
        const maxTradeFromJupiter = Number.isFinite(jupiterStatus.maxTradeSol) && jupiterStatus.maxTradeSol > 0
            ? jupiterStatus.maxTradeSol
            : 0.2;

        this.config = {
            // Live trading must be explicitly enabled. Reality mode only enforces "no simulation",
            // it must never implicitly turn on auto-signing or real execution.
            enabled: parseBoolean(process.env.SWARM_AUTONOMOUS_TRADING_ENABLED, false),
            pollIntervalMs: Math.max(5_000, parseNumber(process.env.SWARM_AUTOTRADE_POLL_INTERVAL_MS, 15_000)),
            tradeIntervalMs: Math.max(60_000, parseNumber(process.env.SWARM_AUTOTRADE_INTERVAL_MS, 5 * 60 * 1000)),
            fundingTriggerSol: Math.max(0.001, parseNumber(process.env.SWARM_AUTOTRADE_TRIGGER_SOL, 0.2)),
            targetSol: Math.max(0.01, parseNumber(process.env.SWARM_AUTOTRADE_TARGET_SOL, 50)),
            challengeDurationHours: Math.max(1, parseNumber(process.env.SWARM_AUTOTRADE_DURATION_HOURS, 72)),
            minSolReserve: Math.max(0.001, parseNumber(process.env.SWARM_AUTOTRADE_MIN_SOL_RESERVE, 0.02)),
            riskPerTrade: clamp(parseNumber(process.env.SWARM_AUTOTRADE_RISK_PER_TRADE, 0.1), 0.01, 0.25),
            minTradeSol: Math.max(0.001, parseNumber(process.env.SWARM_AUTOTRADE_MIN_TRADE_SOL, 0.01)),
            minTradeUsdc: Math.max(1, parseNumber(process.env.SWARM_AUTOTRADE_MIN_TRADE_USDC, 5)),
            maxTradeSol: Math.max(0.001, Math.min(parseNumber(process.env.SWARM_MAX_TRADE_SOL, maxTradeFromJupiter), maxTradeFromJupiter)),
            maxDrawdownPct: clamp(parseNumber(process.env.SWARM_AUTOTRADE_MAX_DRAWDOWN_PCT, 35), 5, 90),
            maxTradesPerDay: Math.floor(clamp(parseNumber(process.env.SWARM_AUTOTRADE_MAX_TRADES_PER_DAY, 18), 1, 200)),
            minSignalPct: clamp(parseNumber(process.env.SWARM_AUTOTRADE_MIN_SIGNAL_PCT, 0.002), 0.0005, 0.05),
            slippagePct: clamp(parseNumber(process.env.SWARM_AUTOTRADE_SLIPPAGE_PCT, 1), 0.1, 5),
            maxConsecutiveFailures: Math.floor(clamp(parseNumber(process.env.SWARM_AUTOTRADE_MAX_CONSECUTIVE_FAILURES, 4), 1, 20))
        };

        this.statePath = statePath;
        this.state = this.createDefaultState();
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        if (!this.config.enabled) {
            this.initialized = true;
            return;
        }

        requireRealityMode('AutonomousTradingController');
        await this.loadState();
        this.reconcilePhaseWithClock();
        await this.persistState();
        this.initialized = true;

        console.log('🤖 [AutoTrade] Controller initialized');
        console.log(`   Trigger: ${this.config.fundingTriggerSol.toFixed(3)} SOL`);
        console.log(`   Target: ${this.config.targetSol.toFixed(2)} SOL in ${this.config.challengeDurationHours}h`);
        console.log(`   Risk/trade: ${(this.config.riskPerTrade * 100).toFixed(1)}% | Max drawdown: ${this.config.maxDrawdownPct.toFixed(1)}%`);
    }

    getStatus(): {
        enabled: boolean;
        phase: ChallengePhase;
        triggerSol: number;
        targetSol: number;
        latestBalanceSol?: number;
        trackedUsdcBalance: number;
        tradesToday: number;
        totalTrades: number;
        successfulTrades: number;
        failedTrades: number;
        activatedAt?: string;
        expiresAt?: string;
        haltedReason?: string;
        blockedReason?: string;
        completionReason?: string;
    } {
        return {
            enabled: this.config.enabled,
            phase: this.state.phase,
            triggerSol: this.config.fundingTriggerSol,
            targetSol: this.config.targetSol,
            latestBalanceSol: this.state.latestBalanceSol,
            trackedUsdcBalance: round(this.state.trackedUsdcBalance, 6),
            tradesToday: this.state.tradesToday,
            totalTrades: this.state.totalTrades,
            successfulTrades: this.state.successfulTrades,
            failedTrades: this.state.failedTrades,
            activatedAt: this.state.activatedAt,
            expiresAt: this.state.expiresAt,
            haltedReason: this.state.haltedReason,
            blockedReason: this.state.blockedReason,
            completionReason: this.state.completionReason
        };
    }

    async reset(reason = 'manual_reset'): Promise<void> {
        this.state = this.createDefaultState();
        this.recordLedger({
            action: 'INFO',
            reason: `state_reset:${reason}`,
            success: true
        });
        await this.persistState();
        console.log(`♻️ [AutoTrade] State reset (${reason})`);
    }

    async tick(context: TickContext = {}): Promise<void> {
        if (!this.config.enabled) return;
        if (!this.initialized) {
            await this.initialize();
        }

        const now = Date.now();
        if (now - this.lastTickAtMs < this.config.pollIntervalMs) {
            return;
        }
        this.lastTickAtMs = now;

        try {
            const jupiterStatus = jupiter.getStatus();
            if (jupiterStatus.mode === 'SIMULATION' || jupiterStatus.mode === 'MISCONFIGURED') {
                this.handleExecutionPrerequisiteFailure(`Jupiter mode is ${jupiterStatus.mode}. Live wallet/RPC configuration is required.`);
                await this.persistState();
                return;
            }

            if (!jupiterStatus.liveTradingEnabled) {
                this.handleExecutionPrerequisiteFailure('REAL_TRADING_ENABLED=true is required for autonomous execution.');
                await this.persistState();
                return;
            }

            if (!jupiterStatus.signingConfigured) {
                this.handleExecutionPrerequisiteFailure('SOLANA_PRIVATE_KEY is required for autonomous execution.');
                await this.persistState();
                return;
            }

            this.state.blockedReason = undefined;

            this.rollTradingDay(now);

            const balanceSol = await getWalletBalance();
            const solPriceUsd = await getSOLPrice();
            this.state.latestBalanceSol = round(balanceSol, 9);
            this.state.peakBalanceSol = Math.max(this.state.peakBalanceSol || 0, balanceSol);
            this.pushPrice(solPriceUsd);

            if (this.state.phase === 'waiting_funding' && balanceSol >= this.config.fundingTriggerSol) {
                const activatedAt = new Date(now);
                this.state.phase = 'active';
                this.state.activatedAt = activatedAt.toISOString();
                this.state.expiresAt = new Date(activatedAt.getTime() + this.config.challengeDurationHours * 60 * 60 * 1000).toISOString();
                this.state.startBalanceSol = round(balanceSol, 9);
                this.state.peakBalanceSol = round(balanceSol, 9);
                this.state.blockedReason = undefined;
                this.state.haltedReason = undefined;
                this.state.completionReason = undefined;
                this.recordLedger({
                    action: 'ACTIVATE',
                    reason: `funding_trigger_reached:${balanceSol.toFixed(6)}SOL`,
                    success: true,
                    amountSol: round(balanceSol, 6)
                });
                console.log(`🚀 [AutoTrade] Challenge activated at ${balanceSol.toFixed(6)} SOL`);
            }

            if (this.state.phase !== 'active') {
                await this.persistState();
                return;
            }

            if (this.state.expiresAt && now >= Date.parse(this.state.expiresAt)) {
                this.complete('challenge_window_expired');
                await this.persistState();
                return;
            }

            if (balanceSol >= this.config.targetSol) {
                this.complete('target_balance_reached');
                await this.persistState();
                return;
            }

            if (context.isPaused) {
                this.recordLedger({
                    action: 'INFO',
                    reason: 'swarm_paused_autotrade_idle',
                    success: true
                });
                await this.persistState();
                return;
            }

            const peak = this.state.peakBalanceSol || balanceSol;
            const drawdownPct = peak > 0 ? ((peak - balanceSol) / peak) * 100 : 0;
            if (drawdownPct >= this.config.maxDrawdownPct) {
                this.halt(`Max drawdown breached (${drawdownPct.toFixed(2)}% >= ${this.config.maxDrawdownPct.toFixed(2)}%).`);
                await this.persistState();
                return;
            }

            if (this.state.tradesToday >= this.config.maxTradesPerDay) {
                await this.persistState();
                return;
            }

            if (this.state.lastTradeAt) {
                const elapsed = now - Date.parse(this.state.lastTradeAt);
                if (elapsed < this.config.tradeIntervalMs) {
                    await this.persistState();
                    return;
                }
            }

            const signal = this.computeSignal();
            if (signal.action === 'HOLD') {
                await this.persistState();
                return;
            }

            const plan = this.buildTradePlan(signal, balanceSol, solPriceUsd);
            if (!plan) {
                await this.persistState();
                return;
            }

            const result = await this.executePlan(plan);
            this.applyTradeResult(plan, result, signal);
            await this.persistState();

            const cycleInfo = typeof context.cycleCount === 'number' ? ` | cycle ${context.cycleCount}` : '';
            console.log(`📈 [AutoTrade] ${plan.action} ${result.success ? 'executed' : 'failed'}${cycleInfo}`);
        } catch (error: any) {
            const message = error?.message || String(error);
            this.state.consecutiveFailures += 1;
            this.recordLedger({
                action: 'ERROR',
                reason: 'tick_failure',
                success: false,
                error: message
            });

            if (this.state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
                this.halt(`Too many consecutive failures (${this.state.consecutiveFailures}). Last error: ${message}`);
            }

            await this.persistState();
            console.error(`[AutoTrade] Tick error: ${message}`);
        }
    }

    private createDefaultState(): ChallengeState {
        const now = new Date();
        return {
            version: 1,
            phase: 'waiting_funding',
            startedAt: now.toISOString(),
            trackedUsdcBalance: 0,
            tradesToday: 0,
            tradesDayKey: dayKey(now),
            totalTrades: 0,
            successfulTrades: 0,
            failedTrades: 0,
            consecutiveFailures: 0,
            priceHistory: [],
            ledger: []
        };
    }

    private reconcilePhaseWithClock(): void {
        if (
            this.state.phase === 'halted' &&
            this.state.totalTrades === 0 &&
            typeof this.state.haltedReason === 'string' &&
            this.state.haltedReason.includes('required for autonomous execution')
        ) {
            this.state.phase = 'waiting_funding';
            this.state.haltedReason = undefined;
        }

        if (this.state.phase !== 'active') return;
        if (!this.state.expiresAt) return;
        if (Date.now() >= Date.parse(this.state.expiresAt)) {
            this.complete('challenge_window_expired');
        }
    }

    private async loadState(): Promise<void> {
        try {
            const raw = await fs.readFile(this.statePath, 'utf8');
            const parsed = JSON.parse(raw) as Partial<ChallengeState>;
            this.state = {
                ...this.createDefaultState(),
                ...parsed,
                priceHistory: Array.isArray(parsed.priceHistory) ? parsed.priceHistory.slice(-240) : [],
                ledger: Array.isArray(parsed.ledger) ? parsed.ledger.slice(-500) : []
            };
        } catch {
            this.state = this.createDefaultState();
        }
    }

    private async persistState(): Promise<void> {
        const dir = path.dirname(this.statePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf8');
    }

    private pushPrice(priceUsd: number): void {
        this.state.priceHistory.push({
            ts: new Date().toISOString(),
            priceUsd: round(priceUsd, 6)
        });
        this.state.priceHistory = this.state.priceHistory.slice(-240);
    }

    private rollTradingDay(nowMs: number): void {
        const currentKey = dayKey(new Date(nowMs));
        if (this.state.tradesDayKey === currentKey) return;
        this.state.tradesDayKey = currentKey;
        this.state.tradesToday = 0;
    }

    private computeSignal(): TradeSignal {
        const prices = this.state.priceHistory.map((point) => point.priceUsd);
        if (prices.length < 8) {
            return { action: 'HOLD', strengthPct: 0, reason: 'insufficient_price_history' };
        }

        const short = average(prices.slice(-3));
        const medium = average(prices.slice(-5));
        const long = average(prices.slice(-8));
        if (long <= 0) {
            return { action: 'HOLD', strengthPct: 0, reason: 'invalid_price_average' };
        }

        const momentum = (short - long) / long;
        const confirmation = (medium - long) / long;
        const strength = round(momentum * 100, 4);

        if (Math.abs(momentum) < this.config.minSignalPct || Math.abs(confirmation) < this.config.minSignalPct * 0.7) {
            return { action: 'HOLD', strengthPct: strength, reason: 'signal_below_threshold' };
        }

        if (momentum > 0 && confirmation > 0) {
            return { action: 'BUY_SOL', strengthPct: strength, reason: 'bullish_momentum' };
        }

        if (momentum < 0 && confirmation < 0) {
            return { action: 'SELL_SOL', strengthPct: strength, reason: 'bearish_momentum' };
        }

        return { action: 'HOLD', strengthPct: strength, reason: 'mixed_signal' };
    }

    private buildTradePlan(signal: TradeSignal, balanceSol: number, solPriceUsd: number): TradePlan | null {
        if (signal.action === 'SELL_SOL') {
            const tradableSol = Math.max(0, balanceSol - this.config.minSolReserve);
            if (tradableSol < this.config.minTradeSol) {
                return null;
            }

            const sizedByRisk = tradableSol * this.config.riskPerTrade;
            const amountSol = Math.min(tradableSol, sizedByRisk, this.config.maxTradeSol);
            if (amountSol < this.config.minTradeSol) {
                return null;
            }

            return {
                action: 'SELL_SOL',
                amountSol: round(amountSol, 6)
            };
        }

        if (signal.action === 'BUY_SOL') {
            if (this.state.trackedUsdcBalance < this.config.minTradeUsdc) {
                return null;
            }

            const sizeByRiskUsdc = this.state.trackedUsdcBalance * this.config.riskPerTrade;
            const sizeByCapUsdc = this.config.maxTradeSol * solPriceUsd;
            const amountUsdc = Math.min(this.state.trackedUsdcBalance, sizeByRiskUsdc, sizeByCapUsdc);
            if (amountUsdc < this.config.minTradeUsdc) {
                return null;
            }

            return {
                action: 'BUY_SOL',
                amountUsdc: round(amountUsdc, 6)
            };
        }

        return null;
    }

    private async executePlan(plan: TradePlan): Promise<TradeResult> {
        const options: TradeExecutionOptions = {
            execute: true,
            slippage: this.config.slippagePct
        };

        if (plan.action === 'SELL_SOL') {
            return sellSOL(plan.amountSol || 0, options);
        }

        return buySOL(plan.amountUsdc || 0, options);
    }

    private applyTradeResult(plan: TradePlan, result: TradeResult, signal: TradeSignal): void {
        const nowIso = new Date().toISOString();
        this.state.lastTradeAt = nowIso;
        this.state.totalTrades += 1;
        this.state.tradesToday += 1;

        const outputUsdc = plan.action === 'SELL_SOL' ? round((Number(result.outputAmount || 0) / 1e6), 6) : undefined;
        const outputSol = plan.action === 'BUY_SOL' ? round((Number(result.outputAmount || 0) / 1e9), 9) : undefined;

        if (result.success) {
            this.state.successfulTrades += 1;
            this.state.consecutiveFailures = 0;

            if (plan.action === 'SELL_SOL') {
                this.state.trackedUsdcBalance = round(this.state.trackedUsdcBalance + (outputUsdc || 0), 6);
            } else {
                const spent = plan.amountUsdc || 0;
                this.state.trackedUsdcBalance = round(Math.max(0, this.state.trackedUsdcBalance - spent), 6);
            }
        } else {
            this.state.failedTrades += 1;
            this.state.consecutiveFailures += 1;
        }

        this.recordLedger({
            action: plan.action,
            reason: signal.reason,
            success: result.success,
            txId: result.txId,
            amountSol: plan.amountSol,
            amountUsdc: plan.amountUsdc,
            outputSol,
            outputUsdc,
            signalStrengthPct: signal.strengthPct,
            error: result.error
        });

        if (!result.success && this.state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
            this.halt(`Trade failures reached limit (${this.state.consecutiveFailures}): ${result.error || 'unknown error'}`);
        }
    }

    private halt(reason: string): void {
        if (this.state.phase === 'halted') return;
        this.state.phase = 'halted';
        this.state.blockedReason = undefined;
        this.state.haltedReason = reason;
        this.state.completedAt = new Date().toISOString();
        this.recordLedger({
            action: 'HALT',
            reason,
            success: false
        });
        console.error(`🛑 [AutoTrade] Halted: ${reason}`);
    }

    private complete(reason: string): void {
        if (this.state.phase === 'completed' || this.state.phase === 'expired') return;
        this.state.phase = reason === 'challenge_window_expired' ? 'expired' : 'completed';
        this.state.completionReason = reason;
        this.state.completedAt = new Date().toISOString();
        this.recordLedger({
            action: 'COMPLETE',
            reason,
            success: true
        });
        console.log(`✅ [AutoTrade] Challenge finished: ${reason}`);
    }

    private handleExecutionPrerequisiteFailure(reason: string): void {
        if (this.state.phase === 'active') {
            this.halt(reason);
            return;
        }

        if (this.state.blockedReason === reason) {
            return;
        }

        this.state.blockedReason = reason;
        this.recordLedger({
            action: 'INFO',
            reason: `blocked:${reason}`,
            success: true
        });
        console.log(`⏸️ [AutoTrade] Waiting: ${reason}`);
    }

    private recordLedger(entry: Omit<TradeLedgerEntry, 'id' | 'ts'>): void {
        this.state.ledger.push({
            id: `autotrade_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            ts: new Date().toISOString(),
            ...entry
        });
        this.state.ledger = this.state.ledger.slice(-500);
    }
}
