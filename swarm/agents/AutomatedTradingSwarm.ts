/**
 * AutomatedTradingSwarm - Crypto & Stock Trading Automation
 * Focus: Automated trading, portfolio management, market analysis
 *
 * In SWARM_REALITY_MODE=true:
 * - Uses live market data only
 * - Disables simulated PnL fabrication
 */

import { QuantumSwarmCore } from '../core/quantum_core.js';
import { isRealityMode } from '../core/reality_mode.js';

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
    private realityMode: boolean;

    constructor(config?: Partial<TradingConfig>) {
        this.quantumCore = new QuantumSwarmCore();
        this.realityMode = isRealityMode();

        const defaultPairs = this.realityMode
            ? ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
            : ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AAPL/USD', 'TSLA/USD'];

        this.config = {
            exchange: config?.exchange || 'binance',
            tradingPairs: config?.tradingPairs || defaultPairs,
            riskLevel: config?.riskLevel || 'medium',
            maxPositionSize: config?.maxPositionSize || 0.1,
            stopLoss: config?.stopLoss || 0.05,
            takeProfit: config?.takeProfit || 0.15
        };

        this.portfolio = {
            totalValue: 10000,
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

        await this.fetchMarketData();
        const signals = await this.analyzeMarket();
        await this.executeTrades(signals);
        this.updatePortfolio();
        await this.reportPerformance();

        console.log('✅ [AutomatedTradingSwarm] Trading cycle complete');
    }

    /**
     * Fetch market data.
     * Reality mode pulls from Binance public 24h ticker.
     */
    private async fetchMarketData(): Promise<void> {
        console.log('📊 [AutomatedTradingSwarm] Fetching market data...');
        this.marketData.clear();

        for (const pair of this.config.tradingPairs) {
            try {
                const live = await this.fetchLiveMarketData(pair);
                if (live) {
                    this.marketData.set(pair, live);
                    continue;
                }

                if (this.realityMode) {
                    console.warn(`⚠️ [AutomatedTradingSwarm] Skipping unsupported live pair in reality mode: ${pair}`);
                    continue;
                }

                this.marketData.set(pair, {
                    symbol: pair,
                    price: this.getSimulatedPrice(pair),
                    change24h: (Math.random() - 0.5) * 10,
                    volume: Math.random() * 1_000_000_000,
                    trend: this.determineTrend((Math.random() - 0.5) * 10)
                });
            } catch (error: any) {
                if (this.realityMode) {
                    throw new Error(`[AutomatedTradingSwarm] Live market fetch failed for ${pair}: ${error.message || error}`);
                }

                console.warn(`⚠️ [AutomatedTradingSwarm] Falling back to simulated data for ${pair}`);
                this.marketData.set(pair, {
                    symbol: pair,
                    price: this.getSimulatedPrice(pair),
                    change24h: (Math.random() - 0.5) * 10,
                    volume: Math.random() * 1_000_000_000,
                    trend: this.determineTrend((Math.random() - 0.5) * 10)
                });
            }
        }

        if (this.realityMode && this.marketData.size === 0) {
            throw new Error('[AutomatedTradingSwarm] No live markets available in reality mode');
        }

        console.log(`✅ [AutomatedTradingSwarm] Fetched ${this.marketData.size} markets`);
    }

    private toBinanceSymbol(pair: string): string | null {
        const [base, quote] = pair.split('/');
        if (!base || !quote) return null;

        if (quote !== 'USDT') {
            return null;
        }

        return `${base}${quote}`;
    }

    private async fetchLiveMarketData(pair: string): Promise<MarketData | null> {
        const symbol = this.toBinanceSymbol(pair);
        if (!symbol) return null;

        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`);
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`HTTP ${response.status}: ${body.slice(0, 160)}`);
        }

        const data = await response.json() as {
            lastPrice?: string;
            priceChangePercent?: string;
            quoteVolume?: string;
        };

        const price = Number(data.lastPrice || 0);
        const change24h = Number(data.priceChangePercent || 0);
        const volume = Number(data.quoteVolume || 0);

        if (!Number.isFinite(price) || price <= 0) {
            throw new Error(`Invalid live price payload for ${pair}`);
        }

        return {
            symbol: pair,
            price,
            change24h,
            volume,
            trend: this.determineTrend(change24h)
        };
    }

    private getSimulatedPrice(pair: string): number {
        const basePrices: Record<string, number> = {
            'BTC/USDT': 65000,
            'ETH/USDT': 3500,
            'SOL/USDT': 145,
            'AAPL/USD': 198,
            'TSLA/USD': 225
        };
        return basePrices[pair] || 100;
    }

    private determineTrend(change24h: number): 'bullish' | 'bearish' | 'neutral' {
        if (change24h > 1) return 'bullish';
        if (change24h < -1) return 'bearish';
        return 'neutral';
    }

    /**
     * Analyze market and generate trading signals
     */
    private async analyzeMarket(): Promise<{ symbol: string; signal: 'buy' | 'sell' | 'hold'; confidence: number }[]> {
        console.log('🔮 [AutomatedTradingSwarm] Analyzing market...');

        const signals: { symbol: string; signal: 'buy' | 'sell' | 'hold'; confidence: number }[] = [];

        for (const [symbol, data] of this.marketData) {
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
     * Execute trades based on signals.
     * In reality mode this emits real-time trade intents and avoids fabricated PnL.
     */
    private async executeTrades(signals: { symbol: string; signal: 'buy' | 'sell' | 'hold'; confidence: number }[]): Promise<void> {
        console.log('💰 [AutomatedTradingSwarm] Executing trades...');

        for (const { symbol, signal, confidence } of signals) {
            if (signal === 'hold') continue;
            if (confidence < 0.35) {
                console.log(`⚠️ [AutomatedTradingSwarm] Skipping ${symbol} due to low confidence (${(confidence * 100).toFixed(1)}%)`);
                continue;
            }

            const marketData = this.marketData.get(symbol);
            if (!marketData) continue;

            const trade: Trade = {
                id: `trade_${Date.now()}_${symbol}`,
                symbol,
                side: signal,
                quantity: this.calculatePositionSize(symbol, confidence),
                price: marketData.price,
                timestamp: new Date(),
                status: this.realityMode ? 'pending' : 'executed'
            };

            this.tradeHistory.push(trade);

            if (!this.realityMode) {
                trade.pnl = signal === 'buy'
                    ? marketData.price * 0.1
                    : marketData.price * 0.05;
            }

            if (this.realityMode) {
                console.log(`📡 [AutomatedTradingSwarm] Live signal ${signal.toUpperCase()} ${trade.quantity} ${symbol} at $${trade.price.toFixed(2)} (manual execution required)`);
            } else {
                console.log(`✅ [AutomatedTradingSwarm] Executed ${signal.toUpperCase()} ${trade.quantity} ${symbol} at $${trade.price.toFixed(2)}`);
            }
        }
    }

    private calculatePositionSize(symbol: string, confidence: number): number {
        const marketData = this.marketData.get(symbol);
        if (!marketData) return 0;

        const price = marketData.price;
        const portfolioValue = this.portfolio.totalValue;
        const maxPositionValue = portfolioValue * this.config.maxPositionSize;

        let quantity = (maxPositionValue * confidence) / price;

        if (quantity < 0.0001) {
            quantity = 0.001;
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
            mode: this.realityMode ? 'REAL_SIGNALING' : 'SIMULATION',
            timestamp: new Date().toISOString()
        });
    }

    getPortfolio(): Portfolio {
        return this.portfolio;
    }

    getTradeHistory(): Trade[] {
        return this.tradeHistory;
    }

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
