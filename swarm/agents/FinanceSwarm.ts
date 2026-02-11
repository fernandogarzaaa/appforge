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
import fs from 'fs';
import path from 'path';

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

export class FinanceSwarm {
    private base44: Base44Tool;
    private fsTool: FileSystemTool;
    private portfolio: Portfolio;
    private dataDir: string;
    private walletAddress: string = 'DFrYV3rd6hNdT3jmQ5Z3Xx1Nm3Gmr4JZ2x6zN1Xyj3B4';
    
    // Risk management settings
    private minConfidence: number = 50; // Lower threshold for more trades
    private maxPositionSize: number = 0.05; // Max 5% per trade
    private stopLossPercent: number = 0.05; // 5% stop loss
    private takeProfitPercent: number = 0.15; // 15% take profit
    
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
        this.portfolio = {
            solBalance: 0.1, // Starting with 0.1 SOL
            usdcBalance: 0,
            positions: [],
            totalTrades: 0,
            winningTrades: 0,
            totalPnl: 0,
            winRate: 0
        };
        this.dataDir = path.join(process.cwd(), 'swarm', 'data');
        
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        this.loadPortfolio();
    }

    async run(): Promise<{ status: string; portfolio: Portfolio; tradesExecuted: number }> {
        console.log('[FinanceSwarm] Starting trading cycle');
        console.log('[FinanceSwarm] Wallet: ' + this.walletAddress);
        console.log('[FinanceSwarm] SOL Balance: ' + this.portfolio.solBalance.toFixed(4));
        
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

    private async getOracleSignal(): Promise<TradeSignal | null> {
        try {
            const pair = this.pairs[Math.floor(Math.random() * this.pairs.length)];
            
            const oracleResult = await quantumCore.consultOracle(
                'Analyze ' + pair + ' price. Give a specific BUY or SELL recommendation with reasoning:',
                [
                    'BUY ' + pair + ' - Strong buy signal, technical indicators bullish, RSI oversold',
                    'SELL ' + pair + ' - Overbought conditions, resistance level, bearish divergence'
                ],
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
                confidence: 50 + Math.floor(Math.random() * 40), // 50-90%
                reasoning: recommendation
            };

            return signal;
        } catch (error) {
            console.error('[FinanceSwarm] Oracle error:', error);
            return null;
        }
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
  Wins:        ${this.portfolio.winningTrades}
  Win Rate:    ${winRate}%
  Avg PnL:     ${avgPnl} SOL

Risk Control:
  Max Position: ${(this.maxPositionSize * 100).toFixed(0)}%
  Stop Loss:    ${(this.stopLossPercent * 100).toFixed(0)}%
  Take Profit:  ${(this.takeProfitPercent * 100).toFixed(0)}%
================================
        `.trim();
    }

    getPortfolio(): Portfolio {
        return this.portfolio;
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

main().catch(console.error);

export default FinanceSwarm;
