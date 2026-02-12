/**
 * AutomatedTradingSwarm - Crypto & Stock Trading Automation
 * Focus: Automated trading, portfolio management, market analysis
 */

import { QuantumSwarmCore } from '../core/quantum_core.js';

interface TradingConfig {
    exchange: string;
    apiKey?: string;
    apiSecret?: string;
    tradingPairs: string[];
    riskLevel: 'low' | 'medium' | 'high';
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
}

interface Trade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    timestamp: Date;
    pnl?: number;
    status: 'pending' | 'executed' | 'closed';
}

interface Portfolio {
    totalValue: number;
    holdings: Record<string, { quantity: number; avgPrice: number }>;
    pnl: number;
    winRate: number;
}

interface MarketData {
    symbol: string;
    price: number;
    change24h: number;
    volume: number;
    trend: 'bullish' | 'bearish' | 'neutral';
}

export class AutomatedTradingSwarm {
    private quantumCore: QuantumSwarmCore;
    private config: TradingConfig;
    private portfolio: Portfolio;
    private tradeHistory: Trade[];
    private marketData: Map<string, MarketData>;

    constructor(config?: Partial<TradingConfig>) {
        this.quantumCore = new QuantumSwarmCore();
        
        this.config = {
            exchange: config?.exchange || 'binance',
            tradingPairs: config?.tradingPairs || ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
            riskLevel: config?.riskLevel || 'medium',
            maxPositionSize: config?.maxPositionSize || 0.1,
            stopLoss: config?.stopLoss || 0.05,
            takeProfit: config?.takeProfit || 0.15
        };

        this.portfolio = {
            totalValue: 10000, // Starting with $10k
            holdings: {},
            pnl: 0,
            winRate: 0
        };

        this.tradeHistory = [];
        this.marketData = new Map();
    }

    /**
     * Run trading cycle
     */
    async runCycle(): Promise<void> {
        console.log('📈 [AutomatedTradingSwarm] Starting trading cycle...');

        // Step 1: Fetch market data
        await this.fetchMarketData();

        // Step 2: Analyze trends
        const signals = await this.analyzeMarket();

        // Step 3: Execute trades based on signals
        await this.executeTrades(signals);

        // Step 4: Update portfolio
        this.updatePortfolio();

        // Step 5: Report to Oracle
        await this.reportPerformance();

        console.log('✅ [AutomatedTradingSwarm] Trading cycle complete');
    }

    /**
     * Fetch real-time market data
     */
    private async fetchMarketData(): Promise<void> {
        console.log('📊 [AutomatedTradingSwarm] Fetching market data...');

        for (const pair of this.config.tradingPairs) {
            // Placeholder for exchange API integration
            const data: MarketData = {
                symbol: pair,
                price: this.getSimulatedPrice(pair),
                change24h: (Math.random() - 0.5) * 10,
                volume: Math.random() * 1000000000,
                trend: this.determineTrend()
            };

            this.marketData.set(pair, data);
        }

        console.log(`✅ [AutomatedTradingSwarm] Fetched ${this.marketData.size} markets`);
    }

    private getSimulatedPrice(pair: string): number {
        const basePrices: Record<string, number> = {
            'BTC/USDT': 65000,
            'ETH/USDT': 3500,
            'SOL/USDT': 145
        };
        return basePrices[pair] || 100;
    }

    private determineTrend(): 'bullish' | 'bearish' | 'neutral' {
        const rand = Math.random();
        if (rand > 0.6) return 'bullish';
        if (rand < 0.4) return 'bearish';
        return 'neutral';
    }

    /**
     * Analyze market and generate trading signals
     */
    private async analyzeMarket(): Promise<{ symbol: string; signal: 'buy' | 'sell' | 'hold'; confidence: number }[]> {
        console.log('🔮 [AutomatedTradingSwarm] Analyzing market...');

        const signals: { symbol: string; signal: 'buy' | 'sell' | 'hold'; confidence: number }[] = [];

        for (const [symbol, data] of this.marketData) {
            // Consult Oracle for trading decision
            const decision = await this.quantumCore.consultOracle(
                `Should we trade ${symbol} at $${data.price}? Trend: ${data.trend}, 24h change: ${data.change24h.toFixed(2)}%`,
                [
                    'BUY: Strong bullish trend with positive momentum',
                    'SELL: Bearish trend, take profits or cut losses',
                    'HOLD: Wait for clearer signals'
                ],
                ['profit_potential', 'risk_level', 'timing']
            );

            const signal = decision.recommendation.startsWith('BUY') ? 'buy' 
                : decision.recommendation.startsWith('SELL') ? 'sell' 
                : 'hold';

            signals.push({
                symbol,
                signal,
                confidence: decision.confidence
            });
        }

        return signals;
    }

    /**
     * Execute trades based on signals
     */
    private async executeTrades(signals: { symbol: string; signal: 'buy' | 'sell' | 'hold'; confidence: number }[]): Promise<void> {
        console.log('💰 [AutomatedTradingSwarm] Executing trades...');

        for (const { symbol, signal, confidence } of signals) {
            if (signal === 'hold') continue;

            const marketData = this.marketData.get(symbol);
            if (!marketData) continue;

            const trade: Trade = {
                id: `trade_${Date.now()}_${symbol}`,
                symbol,
                side: signal,
                quantity: this.calculatePositionSize(symbol, confidence),
                price: marketData.price,
                timestamp: new Date(),
                status: 'executed'
            };

            this.tradeHistory.push(trade);

            // Calculate potential P&L
            trade.pnl = signal === 'buy' 
                ? (marketData.price * 0.1) // Simulate 10% gain
                : (marketData.price * 0.05); // Simulate 5% gain

            console.log(`✅ [AutomatedTradingSwarm] Executed ${signal.toUpperCase()} ${trade.quantity} ${symbol} at $${trade.price.toFixed(2)}`);
        }
    }

    private calculatePositionSize(symbol: string, confidence: number): number {
        const marketData = this.marketData.get(symbol);
        if (!marketData) return 0;
        
        const price = marketData.price;
        const portfolioValue = this.portfolio.totalValue;
        const maxPositionValue = portfolioValue * this.config.maxPositionSize;
        
        // Calculate quantity based on position value and price
        let quantity = (maxPositionValue * confidence) / price;
        
        // Ensure minimum trade size
        if (quantity < 0.0001) {
            // For small positions, trade a fixed minimum
            quantity = 0.001; // Minimum 0.001 BTC equivalent
        }
        
        return parseFloat(quantity.toFixed(6));
    }

    /**
     * Update portfolio with current holdings
     */
    private updatePortfolio(): void {
        console.log('📊 [AutomatedTradingSwarm] Updating portfolio...');

        let totalPnl = 0;
        let winningTrades = 0;

        for (const trade of this.tradeHistory) {
            if (trade.status === 'closed') {
                totalPnl += trade.pnl || 0;
                if ((trade.pnl || 0) > 0) winningTrades++;
            }
        }

        this.portfolio.pnl = totalPnl;
        this.portfolio.winRate = this.tradeHistory.length > 0 
            ? winningTrades / this.tradeHistory.length 
            : 0;

        console.log(`📈 Portfolio P&L: $${totalPnl.toFixed(2)} | Win Rate: ${(this.portfolio.winRate * 100).toFixed(1)}%`);
    }

    /**
     * Report performance to Oracle for learning
     */
    private async reportPerformance(): Promise<void> {
        await this.quantumCore.reportOutcome('trading_cycle', true, {
            portfolio: this.portfolio,
            tradesExecuted: this.tradeHistory.length,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get current portfolio status
     */
    getPortfolio(): Portfolio {
        return this.portfolio;
    }

    /**
     * Get trade history
     */
    getTradeHistory(): Trade[] {
        return this.tradeHistory;
    }

    /**
     * Train on trading patterns
     */
    async train(): Promise<void> {
        console.log('📚 [AutomatedTradingSwarm] Training on trading patterns...');

        const patterns = await this.quantumCore.consultOracle(
            'What are the best trading strategies for crypto markets?',
            [
                'Trend following with stop losses',
                'Mean reversion strategy',
                'Breakout trading',
                'Dollar cost averaging'
            ],
            ['win_rate', 'profit_potential', 'risk_management']
        );

        console.log(`✅ [AutomatedTradingSwarm] Training complete - Recommendation: ${patterns.recommendation}`);
    }
}

export { Trade, Portfolio, MarketData };
