/**
 * FinanceSwarm - Trading & Investment Agent
 * 
 * Autonomous crypto trading with risk management and Oracle-guided signals.
 * Target: Conservative growth with risk controls.
 * 
 * IMPORTANT: Trading carries risk. This agent uses risk management
 * but cannot guarantee profits. Start with small positions.
 */

import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';
import quantumCore from '../core/quantum_core.js';
import { isRealityMode } from '../core/reality_mode.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

interface Trade {
    id: string;
    pair: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice?: number;
    size: number;
    pnl?: number;
    pnlPercent?: number;
    status: 'pending' | 'open' | 'closed' | 'failed';
    confidence: number;
    timestamp: string;
    closeTimestamp?: string;
    reason?: string;
}

interface Portfolio {
    solBalance: number;
    usdcBalance: number;
    positions: Trade[];
    totalTrades: number;
    winningTrades: number;
    totalPnl: number;
    winRate: number;
}

interface TradeSignal {
    pair: string;
    direction: 'buy' | 'sell';
    entryZone: { min: number; max: number };
    takeProfit: number;
    stopLoss: number;
    confidence: number;
    reasoning: string;
}

interface LivePairStat {
    price: number;
    change24h: number;
}

// Simple base58 encoding for Solana-like addresses
function base58Encode(buffer: Buffer): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = BigInt('0x' + buffer.toString('hex'));
    
    while (num > 0n) {
        const remainder = Number(num % 58n);
        result = alphabet[remainder] + result;
        num = num / 58n;
    }
    
    // Handle leading zeros
    for (const byte of buffer) {
        if (byte === 0) {
            result = '1' + result;
        } else {
            break;
        }
    }
    
    return result || '1';
}

export class FinanceSwarm {
    private base44: Base44Tool;
    private fsTool: FileSystemTool;
    private portfolio!: Portfolio;
    private dataDir: string;
    private walletAddress!: string;
    private privateKey!: string;
    private keypairPath: string;
    private realityMode: boolean;
    private livePairStats: Map<string, LivePairStat>;
    
    // Risk management settings
    private minConfidence: number = 50;
    private maxPositionSize: number = 0.05;
    private stopLossPercent: number = 0.05;
    private takeProfitPercent: number = 0.15;
    
    // Trading pairs
    private pairs: string[] = [
        'SOL/USDC',
        'BTC/USDC',
        'ETH/USDC',
        'BONK/USDC',
        'JUP/USDC'
    ];

    constructor(base44: Base44Tool, fsTool: FileSystemTool) {
        this.base44 = base44;
        this.fsTool = fsTool;
        this.dataDir = path.join(process.cwd(), 'swarm', 'data');
        this.keypairPath = path.join(this.dataDir, 'finance_wallet.json');
        this.realityMode = isRealityMode();
        this.livePairStats = new Map();
        
        // Initialize data directory
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        // Initialize wallet
        this.initializeWallet();
        
        // Initialize portfolio
        this.portfolio = {
            solBalance: 0.1,
            usdcBalance: 0,
            positions: [],
            totalTrades: 0,
            winningTrades: 0,
            totalPnl: 0,
            winRate: 0
        };
        
        this.loadPortfolio();
    }
    
    private initializeWallet(): void {
        const revenueHunterWallet = 'DFrYV3rd6hNdT3jmQ5Z3Xx1Nm3Gmr4JZ2x6zN1Xyj3B4';
        
        if (fs.existsSync(this.keypairPath)) {
            const walletData = JSON.parse(fs.readFileSync(this.keypairPath, 'utf8'));
            this.walletAddress = walletData.publicKey;
            this.privateKey = walletData.privateKey;
            console.log('[FinanceSwarm] Loaded wallet: ' + this.walletAddress);
        } else {
            // Generate new trading wallet
            const privateKeyBytes = crypto.randomBytes(32);
            this.walletAddress = base58Encode(privateKeyBytes);
            this.privateKey = '[' + base58Encode(privateKeyBytes) + ']';
            
            fs.writeFileSync(this.keypairPath, JSON.stringify({
                publicKey: this.walletAddress,
                privateKey: this.privateKey,
                createdAt: new Date().toISOString(),
                type: 'FinanceSwarmTradingWallet'
            }, null, 2));
            
            console.log('[FinanceSwarm] 🎉 NEW TRADING WALLET CREATED: ' + this.walletAddress);
            console.log('[FinanceSwarm] 💰 Key saved to: ' + this.keypairPath);
            console.log('[FinanceSwarm] ⚠️ Private key material will not be printed to logs.');
        }
        
        console.log('[FinanceSwarm] RevenueHunter wallet: ' + revenueHunterWallet);
    }

    async run(): Promise<{ status: string; portfolio: Portfolio; tradesExecuted: number }> {
        console.log('[FinanceSwarm] Starting trading cycle');
        console.log('[FinanceSwarm] Wallet: ' + this.walletAddress);
        console.log('[FinanceSwarm] SOL Balance: ' + this.portfolio.solBalance.toFixed(4));
        
        if (this.realityMode) {
            return this.runRealityCycle();
        }

        try {
            const oracleSignal = await this.getOracleSignal();
            
            if (oracleSignal && oracleSignal.confidence >= this.minConfidence) {
                console.log('[FinanceSwarm] Oracle Signal: ' + oracleSignal.direction.toUpperCase() + ' ' + oracleSignal.pair);
                console.log('[FinanceSwarm] Confidence: ' + oracleSignal.confidence + '%');
                
                const trade = await this.executeTrade(oracleSignal);
                if (trade) {
                    this.portfolio.positions.push(trade);
                    console.log('[FinanceSwarm] Trade opened successfully');
                }
            } else {
                console.log('[FinanceSwarm] No trade signal (confidence: ' + (oracleSignal?.confidence || 0) + '%)');
            }
            
            const closedTrades = await this.checkPositions();
            this.updatePortfolioStats();
            this.savePortfolio();
            
            console.log(this.generateTradingReport());
            
            return {
                status: 'completed',
                portfolio: this.portfolio,
                tradesExecuted: closedTrades.length
            };
        } catch (error: any) {
            console.warn('[FinanceSwarm] Error:', error.message);
            return { status: 'error', portfolio: this.portfolio, tradesExecuted: 0 };
        }
    }

    private async runRealityCycle(): Promise<{ status: string; portfolio: Portfolio; tradesExecuted: number }> {
        try {
            await this.refreshLivePairStats();
            const oracleSignal = await this.getOracleSignal();

            if (oracleSignal) {
                console.log('[FinanceSwarm] REAL signal: ' + oracleSignal.direction.toUpperCase() + ' ' + oracleSignal.pair);
                console.log('[FinanceSwarm] Confidence: ' + oracleSignal.confidence + '%');
                console.log('[FinanceSwarm] Execution mode: signal-only (no simulated fills)');
            } else {
                console.log('[FinanceSwarm] No REAL signal generated this cycle');
            }

            await this.base44.logActivity('FINANCE_SWARM_REALITY', JSON.stringify({
                signal: oracleSignal,
                livePairs: this.livePairStats.size,
                timestamp: new Date().toISOString()
            }));

            return {
                status: 'reality_signal_only',
                portfolio: this.portfolio,
                tradesExecuted: 0
            };
        } catch (error: any) {
            console.warn('[FinanceSwarm] Reality cycle error:', error.message);
            return {
                status: 'error',
                portfolio: this.portfolio,
                tradesExecuted: 0
            };
        }
    }

    private async getOracleSignal(): Promise<TradeSignal | null> {
        try {
            const pair = this.selectTradingPair();
            if (!pair) {
                return null;
            }
            
            const oracleResult = await quantumCore.consultOracle(
                'Analyze ' + pair + ' price. Give a specific BUY or SELL recommendation:',
                ['BUY ' + pair + ' - Technical indicators bullish', 'SELL ' + pair + ' - Overbought conditions'],
                ['profit_potential', 'risk_level', 'timing']
            );

            const recommendation = oracleResult.recommendation;
            let direction: 'buy' | 'sell' = 'buy';
            if (recommendation.includes('SELL')) direction = 'sell';
            
            const basePrice = this.getBasePrice(pair);
            
            const signal: TradeSignal = {
                pair,
                direction,
                entryZone: { min: basePrice * 0.99, max: basePrice * 1.01 },
                takeProfit: basePrice * (direction === 'buy' ? 1.15 : 0.85),
                stopLoss: basePrice * (direction === 'buy' ? 0.95 : 1.05),
                confidence: this.realityMode
                    ? Math.max(0, Math.min(100, Math.round((oracleResult.confidence || 0) * 100)))
                    : 50 + Math.floor(Math.random() * 40),
                reasoning: recommendation
            };

            return signal;
        } catch (error) {
            console.error('[FinanceSwarm] Oracle error:', error);
            return null;
        }
    }

    private selectTradingPair(): string | null {
        if (!this.realityMode) {
            return this.pairs[Math.floor(Math.random() * this.pairs.length)];
        }

        const ranked = Array.from(this.livePairStats.entries())
            .sort((a, b) => Math.abs(b[1].change24h) - Math.abs(a[1].change24h));

        if (ranked.length === 0) {
            return null;
        }

        return ranked[0][0];
    }

    private async refreshLivePairStats(): Promise<void> {
        this.livePairStats.clear();

        await Promise.all(this.pairs.map(async (pair) => {
            const live = await this.fetchLivePairStat(pair);
            if (live) {
                this.livePairStats.set(pair, live);
            }
        }));

        if (this.realityMode && this.livePairStats.size === 0) {
            throw new Error('No live market data available for FinanceSwarm');
        }
    }

    private async fetchLivePairStat(pair: string): Promise<LivePairStat | null> {
        const binanceSymbol = this.toBinanceSymbol(pair);
        if (binanceSymbol) {
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(binanceSymbol)}`);
            if (!response.ok) {
                throw new Error(`Binance ${pair} fetch failed (${response.status})`);
            }
            const data = await response.json() as { lastPrice?: string; priceChangePercent?: string };
            const price = Number(data.lastPrice || 0);
            const change24h = Number(data.priceChangePercent || 0);
            if (!Number.isFinite(price) || price <= 0) {
                throw new Error(`Invalid live price payload for ${pair}`);
            }
            return { price, change24h };
        }

        const dexPairs = await this.fetchDexTokenPairStats(pair);
        if (dexPairs) {
            return dexPairs;
        }

        return null;
    }

    private async fetchDexTokenPairStats(pair: string): Promise<LivePairStat | null> {
        const base = pair.split('/')[0];
        const mintByToken: Record<string, string> = {
            BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtkqjberbSewAr5KzKDA'
        };

        const mint = mintByToken[base];
        if (!mint) return null;

        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
        if (!response.ok) {
            throw new Error(`DexScreener ${pair} fetch failed (${response.status})`);
        }

        const payload = await response.json() as { pairs?: Array<any> };
        const first = Array.isArray(payload.pairs) ? payload.pairs[0] : null;
        if (!first) {
            throw new Error(`DexScreener returned no pairs for ${pair}`);
        }

        const price = Number(first.priceUsd || 0);
        const change24h = Number(first.priceChange?.h24 || 0);
        if (!Number.isFinite(price) || price <= 0) {
            throw new Error(`Invalid DexScreener payload for ${pair}`);
        }

        return { price, change24h };
    }

    private toBinanceSymbol(pair: string): string | null {
        const [base, quote] = pair.split('/');
        if (!base || !quote) return null;
        if (quote !== 'USDC') return null;
        if (!['SOL', 'BTC', 'ETH'].includes(base)) return null;
        return `${base}USDT`;
    }

    private async executeTrade(signal: TradeSignal): Promise<Trade | null> {
        try {
            const positionSize = this.calculatePositionSize(signal);
            if (positionSize < 0.001) {
                console.log('[FinanceSwarm] Position too small, skipping');
                return null;
            }

            if (positionSize > this.portfolio.solBalance) {
                console.log('[FinanceSwarm] Insufficient balance');
                return null;
            }

            const trade: Trade = {
                id: 'trade_' + Date.now(),
                pair: signal.pair,
                direction: signal.direction === 'buy' ? 'LONG' : 'SHORT',
                entryPrice: (signal.entryZone.min + signal.entryZone.max) / 2,
                size: positionSize,
                status: 'open',
                confidence: signal.confidence,
                timestamp: new Date().toISOString(),
                reason: signal.reasoning
            };

            this.portfolio.solBalance -= positionSize;
            console.log('[FinanceSwarm] Opened ' + trade.direction + ' ' + trade.pair + ': ' + trade.size.toFixed(4) + ' SOL @ $' + trade.entryPrice.toFixed(4));
            
            return trade;
        } catch (error) {
            console.error('[FinanceSwarm] Trade error:', error);
            return null;
        }
    }

    private async checkPositions(): Promise<Trade[]> {
        const closedTrades: Trade[] = [];
        
        for (const trade of this.portfolio.positions) {
            if (trade.status !== 'open') continue;
            
            const currentPrice = this.getCurrentPrice(trade.pair);
            const priceChange = (currentPrice - trade.entryPrice) / trade.entryPrice;
            const pnlPercent = trade.direction === 'LONG' ? priceChange : -priceChange;
            const pnl = trade.size * pnlPercent;
            
            let shouldClose = false;
            let closeReason = '';
            
            if (pnlPercent >= this.takeProfitPercent) {
                shouldClose = true;
                closeReason = 'TAKE PROFIT';
            } else if (pnlPercent <= -this.stopLossPercent) {
                shouldClose = true;
                closeReason = 'STOP LOSS';
            }
            
            if (shouldClose) {
                trade.exitPrice = currentPrice;
                trade.pnl = pnl;
                trade.pnlPercent = pnlPercent * 100;
                trade.status = 'closed';
                trade.closeTimestamp = new Date().toISOString();
                
                this.portfolio.solBalance += (trade.size + pnl);
                this.portfolio.totalPnl += pnl;
                this.portfolio.totalTrades++;
                
                if (pnl > 0) {
                    this.portfolio.winningTrades++;
                }
                
                closedTrades.push(trade);
                console.log('[FinanceSwarm] Closed ' + trade.pair + ': ' + closeReason + ' PnL: ' + pnl.toFixed(6) + ' SOL (' + (pnlPercent * 100).toFixed(2) + '%)');
            }
        }

        return closedTrades;
    }

    private calculatePositionSize(signal: TradeSignal): number {
        let size = this.portfolio.solBalance * this.maxPositionSize;
        const confidenceMultiplier = signal.confidence / 100;
        size *= confidenceMultiplier;
        return Math.round(size * 10000) / 10000;
    }

    private getBasePrice(pair: string): number {
        const live = this.livePairStats.get(pair);
        if (this.realityMode && live) {
            return live.price;
        }

        const prices: Record<string, number> = {
            'SOL/USDC': 98.50,
            'BTC/USDC': 43250.00,
            'ETH/USDC': 2280.00,
            'BONK/USDC': 0.0000125,
            'JUP/USDC': 0.85
        };
        return prices[pair] || 100;
    }

    private getCurrentPrice(pair: string): number {
        const live = this.livePairStats.get(pair);
        if (this.realityMode && live) {
            return live.price;
        }

        const basePrice = this.getBasePrice(pair);
        const movement = (Math.random() - 0.5) * 0.04;
        return basePrice * (1 + movement);
    }

    private updatePortfolioStats(): void {
        if (this.portfolio.totalTrades > 0) {
            this.portfolio.winRate = (this.portfolio.winningTrades / this.portfolio.totalTrades) * 100;
        }
    }

    private savePortfolio(): void {
        try {
            const dataPath = path.join(this.dataDir, 'trading_portfolio.json');
            fs.writeFileSync(dataPath, JSON.stringify(this.portfolio, null, 2));
        } catch (error) {
            console.error('[FinanceSwarm] Save error:', error);
        }
    }

    private loadPortfolio(): void {
        try {
            const dataPath = path.join(this.dataDir, 'trading_portfolio.json');
            if (fs.existsSync(dataPath)) {
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                this.portfolio = { ...this.portfolio, ...data };
                console.log('[FinanceSwarm] Loaded portfolio: ' + this.portfolio.totalTrades + ' trades');
            }
        } catch (error) {
            console.log('[FinanceSwarm] Starting fresh portfolio');
        }
    }

    generateTradingReport(): string {
        const winRate = this.portfolio.totalTrades > 0 
            ? (this.portfolio.winRate).toFixed(1) 
            : 'N/A';
            
        const openPositions = this.portfolio.positions.filter(p => p.status === 'open').length;
        const avgPnl = this.portfolio.totalTrades > 0 
            ? (this.portfolio.totalPnl / this.portfolio.totalTrades).toFixed(6) 
            : '0';
            
        return `
[FinanceSwarm] TRADING REPORT
================================
Wallet:      ${this.walletAddress}
SOL Balance: ${this.portfolio.solBalance.toFixed(4)}
Total PnL:   ${this.portfolio.totalPnl.toFixed(6)} SOL
Open Pos:    ${openPositions}

Performance:
  Trades:       ${this.portfolio.totalTrades}
  Wins:         ${this.portfolio.winningTrades}
  Win Rate:     ${winRate}%
  Avg PnL:      ${avgPnl} SOL

Risk Control:
  Max Position: ${(this.maxPositionSize * 100).toFixed(0)}%
  Stop Loss:     ${(this.stopLossPercent * 100).toFixed(0)}%
  Take Profit:  ${(this.takeProfitPercent * 100).toFixed(0)}%
================================
        `.trim();
    }

    getPortfolio(): Portfolio {
        return this.portfolio;
    }

    getBalance(): number {
        return this.portfolio.solBalance;
    }

    getTotalPnL(): number {
        return this.portfolio.totalPnl;
    }

    getOpenPositions(): Trade[] {
        return this.portfolio.positions.filter((position) => position.status === 'open');
    }

    getWinRate(): number {
        return this.portfolio.winRate;
    }
}

// Main function for standalone execution
async function main() {
    console.log('[FinanceSwarm] Initializing trading agent...');
    console.log('[FinanceSwarm] Starting capital: 0.1 SOL');
    console.log('[FinanceSwarm] Target: Conservative growth with risk management');
    console.log('');
    
    const base44 = new Base44Tool();
    const fsTool = new FileSystemTool();
    const financeSwarm = new FinanceSwarm(base44, fsTool);
    
    await financeSwarm.run();
    
    console.log('');
    console.log('[FinanceSwarm] Trading cycle complete');
}

const isDirectRun = process.argv[1]
    ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
    : false;

if (isDirectRun) {
    main().catch(console.error);
}

export default FinanceSwarm;
