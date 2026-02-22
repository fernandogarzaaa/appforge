/**
 * TradeOptimizer Agent - Trading Swarm
 * 
 * Monitors and optimizes open trading positions,
 * dynamically adjusts stop losses, takes profits,
 * and reinvests profits for compound growth.
 */

import * as fs from 'fs/promises';
import path from 'path';
import { Base44Tool } from '../tools/base44.js';

interface TradePosition {
    id: string;
    pair: string;
    side: 'BUY' | 'SELL';
    amount: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    timestamp: string;
    status: 'open' | 'closed' | 'pending';
}

interface PortfolioStats {
    totalBalance: number;
    openPositions: number;
    totalPnL: number;
    winRate: number;
    bestPerformer: string;
    worstPerformer: string;
}

export class TradeOptimizer {
    private base44: Base44Tool;
    private fsTool: any;
    private positions: Map<string, TradePosition>;
    private portfolioStats: PortfolioStats;
    private dataDir: string;
    private walletFile: string;

    constructor(base44: Base44Tool) {
        this.base44 = base44;
        this.positions = new Map();
        this.portfolioStats = {
            totalBalance: 0.1,
            openPositions: 0,
            totalPnL: 0,
            winRate: 0.75,
            bestPerformer: 'JUP/USDC',
            worstPerformer: 'BONK/USDC'
        };
        this.dataDir = './swarm/data';
        this.walletFile = `${this.dataDir}/trading_wallet.json`;
        
        this.loadPositions();
    }

    /**
     * Main execution - optimize all trading positions
     */
    async run(): Promise<{ optimized: number; closed: number; reinvested: number }> {
        console.log('📈 [TradeOptimizer] Starting position optimization...');
        
        const results = {
            optimized: 0,
            closed: 0,
            reinvested: 0
        };

        // Load wallet data
        await this.loadWalletData();

        // Update all positions with current prices
        await this.updateAllPrices();

        // Check each position for optimization opportunities
        for (const [id, position] of this.positions) {
            if (position.status !== 'open') continue;

            // Check if stop loss should be adjusted (trailing stop)
            if (position.pnlPercent > 5) {
                await this.adjustStopLoss(position);
                results.optimized++;
            }

            // Check if take profit should be triggered
            if (position.pnlPercent >= 15) {
                const closed = await this.closePosition(position, 'TAKE_PROFIT');
                if (closed) {
                    results.closed++;
                    const reinvested = await this.reinvestProfit(position);
                    results.reinvested += reinvested;
                }
            }

            // Check if stop loss was hit
            if (position.currentPrice <= position.stopLoss && position.side === 'BUY') {
                await this.closePosition(position, 'STOP_LOSS');
                results.closed++;
            }
            if (position.currentPrice >= position.stopLoss && position.side === 'SELL') {
                await this.closePosition(position, 'STOP_LOSS');
                results.closed++;
            }
        }

        // Update portfolio stats
        await this.updatePortfolioStats();

        // Log activity
        await this.base44.logActivity('TradeOptimizer', 
            `Optimized ${results.optimized} positions, closed ${results.closed}, reinvested ${results.reinvested}`);

        // Generate report
        this.generateReport(results);

        return results;
    }

    /**
     * Load positions from file
     */
    private async loadPositions(): Promise<void> {
        try {
            const data = await fs.readFile(`${this.dataDir}/positions.json`, 'utf8');
            const parsed = JSON.parse(data);
            Object.entries(parsed).forEach(([id, pos]) => {
                this.positions.set(id, pos as TradePosition);
            });
            console.log(`📂 [TradeOptimizer] Loaded ${this.positions.size} positions`);
        } catch (error) {
            console.log('📂 [TradeOptimizer] No existing positions found');
        }
    }

    /**
     * Load wallet data
     */
    private async loadWalletData(): Promise<void> {
        try {
            const data = await fs.readFile(this.walletFile, 'utf8');
            const wallet = JSON.parse(data);
            this.portfolioStats.totalBalance = wallet.balance || 0.1;
        } catch (error) {
            console.log('📂 [TradeOptimizer] Using default balance: 0.1 SOL');
        }
    }

    /**
     * Update all positions with current prices (simulated)
     */
    private async updateAllPrices(): Promise<void> {
        console.log('💹 [TradeOptimizer] Updating position prices...');
        
        const pairs = ['SOL/USDC', 'BTC/USDC', 'ETH/USDC', 'BONK/USDC', 'JUP/USDC'];
        
        for (const [id, position] of this.positions) {
            if (position.status !== 'open') continue;

            // Simulate price movement with small variance
            const variance = (Math.random() - 0.5) * 0.02; // ±1% variance
            const priceChange = position.entryPrice * variance;
            position.currentPrice = position.entryPrice + priceChange;
            
            // Calculate PnL
            if (position.side === 'BUY') {
                position.pnl = (position.currentPrice - position.entryPrice) * position.amount;
                position.pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
            } else {
                position.pnl = (position.entryPrice - position.currentPrice) * position.amount;
                position.pnlPercent = ((position.entryPrice - position.currentPrice) / position.entryPrice) * 100;
            }
        }
    }

    /**
     * Adjust stop loss to lock in profits (trailing stop)
     */
    private async adjustStopLoss(position: TradePosition): Promise<void> {
        const trailPercent = 3; // 3% trailing stop
        
        if (position.side === 'BUY') {
            const newStopLoss = position.currentPrice * (1 - trailPercent / 100);
            if (newStopLoss > position.stopLoss) {
                const oldStopLoss = position.stopLoss;
                position.stopLoss = newStopLoss;
                console.log(`🎯 [TradeOptimizer] ${position.pair}: Stop loss adjusted ${oldStopLoss.toFixed(4)} → ${newStopLoss.toFixed(4)}`);
                
                await this.base44.logActivity('TradeOptimizer', 
                    `${position.pair} trailing stop adjusted: ${oldStopLoss.toFixed(4)} → ${newStopLoss.toFixed(4)}`);
            }
        }
    }

    /**
     * Close a position
     */
    private async closePosition(position: TradePosition, reason: string): Promise<boolean> {
        console.log(`🔴 [TradeOptimizer] Closing ${position.pair} via ${reason} | PnL: ${position.pnl.toFixed(6)} SOL (${position.pnlPercent.toFixed(2)}%)`);
        
        position.status = 'closed';
        position.timestamp = new Date().toISOString();
        
        // Update portfolio balance
        this.portfolioStats.totalBalance += position.pnl;
        this.portfolioStats.totalPnL += position.pnl;
        this.portfolioStats.openPositions--;

        // Save updated data
        await this.savePositions();
        await this.saveWalletData();

        await this.base44.logActivity('TradeOptimizer', 
            `${position.pair} closed via ${reason}: PnL ${position.pnl.toFixed(6)} SOL`);

        return true;
    }

    /**
     * Reinvest profits into new positions
     */
    private async reinvestProfit(position: TradePosition): Promise<number> {
        const reinvestPercent = 0.5; // Reinvest 50% of profits
        const profitToReinvest = position.pnl * reinvestPercent;
        
        if (profitToReinvest < 0.0001) {
            console.log('💰 [TradeOptimizer] Profit too small to reinvest');
            return 0;
        }

        console.log(`💰 [TradeOptimizer] Reinvesting ${profitToReinvest.toFixed(6)} SOL (50% of profits)`);
        
        // Create new position with reinvested amount
        const newPosition: TradePosition = {
            id: `reinvest_${Date.now()}`,
            pair: position.pair,
            side: position.side,
            amount: profitToReinvest / position.currentPrice,
            entryPrice: position.currentPrice,
            stopLoss: position.currentPrice * 0.95,
            takeProfit: position.currentPrice * 1.20,
            currentPrice: position.currentPrice,
            pnl: 0,
            pnlPercent: 0,
            timestamp: new Date().toISOString(),
            status: 'open'
        };

        this.positions.set(newPosition.id, newPosition);
        this.portfolioStats.openPositions++;
        
        await this.savePositions();
        
        console.log(`✅ [TradeOptimizer] New position opened: ${newPosition.pair} (${newPosition.amount.toFixed(4)} @ $${newPosition.entryPrice.toFixed(2)})`);
        
        return profitToReinvest;
    }

    /**
     * Update portfolio statistics
     */
    private async updatePortfolioStats(): Promise<void> {
        let totalOpenPnL = 0;
        let winningPositions = 0;
        let losingPositions = 0;

        for (const position of this.positions.values()) {
            if (position.status === 'open') {
                totalOpenPnL += position.pnl;
                if (position.pnl > 0) winningPositions++;
                else losingPositions++;
            }
        }

        this.portfolioStats.totalPnL = this.portfolioStats.totalPnL + totalOpenPnL;
        this.portfolioStats.openPositions = Array.from(this.positions.values()).filter(p => p.status === 'open').length;
        this.portfolioStats.winRate = winningPositions + losingPositions > 0 
            ? winningPositions / (winningPositions + losingPositions) 
            : 0.75;

        // Save wallet data
        await this.saveWalletData();
    }

    /**
     * Save positions to file
     */
    private async savePositions(): Promise<void> {
        const data: Record<string, TradePosition> = {};
        this.positions.forEach((pos, id) => {
            data[id] = pos;
        });
        await fs.writeFile(`${this.dataDir}/positions.json`, JSON.stringify(data, null, 2));
    }

    /**
     * Save wallet data
     */
    private async saveWalletData(): Promise<void> {
        const wallet = {
            address: '7q4QCFxP99PbosKx4NnMJddhhoYNazpXitRDXsEpXo5S',
            balance: this.portfolioStats.totalBalance,
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(this.walletFile, JSON.stringify(wallet, null, 2));
    }

    /**
     * Generate optimization report
     */
    private generateReport(results: { optimized: number; closed: number; reinvested: number }): void {
        console.log('\n📊═══════════════════════════════════════📊');
        console.log('       TRADE OPTIMIZER REPORT');
        console.log('📊═══════════════════════════════════════📊\n');

        console.log('📈 Portfolio Status:');
        console.log(`   💰 Total Balance: ${this.portfolioStats.totalBalance.toFixed(4)} SOL`);
        console.log(`   📊 Total PnL: ${this.portfolioStats.totalPnL >= 0 ? '+' : ''}${this.portfolioStats.totalPnL.toFixed(6)} SOL`);
        console.log(`   🎯 Open Positions: ${this.portfolioStats.openPositions}`);
        console.log(`   📈 Win Rate: ${(this.portfolioStats.winRate * 100).toFixed(1)}%`);

        console.log('\n🔧 Optimization Results:');
        console.log(`   ✅ Positions Optimized: ${results.optimized}`);
        console.log(`   🔴 Positions Closed: ${results.closed}`);
        console.log(`   💰 Profits Reinvested: ${results.reinvested.toFixed(6)} SOL`);

        console.log('\n📋 Open Positions:');
        for (const [id, pos] of this.positions) {
            if (pos.status === 'open') {
                const pnlEmoji = pos.pnl >= 0 ? '🟢' : '🔴';
                console.log(`   ${pnlEmoji} ${pos.pair}: ${pos.pnlPercent >= 0 ? '+' : ''}${pos.pnlPercent.toFixed(2)}% (${pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(6)} SOL)`);
            }
        }

        console.log('\n💡 Recommendations:');
        if (this.portfolioStats.totalBalance < 0.05) {
            console.log('   ⚠️ Low balance - consider depositing more SOL');
        }
        if (this.portfolioStats.openPositions < 3) {
            console.log('   📈 Opportunity to open more positions');
        }
        if (this.portfolioStats.winRate < 0.5) {
            console.log('   🎯 Review stop loss settings for better entries');
        }

        console.log('\n📊═══════════════════════════════════════📊\n');
    }

    /**
     * Get current portfolio stats
     */
    getPortfolioStats(): PortfolioStats {
        return { ...this.portfolioStats };
    }

    /**
     * Get all open positions
     */
    getOpenPositions(): TradePosition[] {
        return Array.from(this.positions.values()).filter(p => p.status === 'open');
    }
}

export default TradeOptimizer;
