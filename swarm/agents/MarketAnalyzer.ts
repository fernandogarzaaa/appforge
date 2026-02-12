/**
 * MarketAnalyzer Agent
 * 
 * Provides real-time market analysis, trend detection, and opportunity identification.
 * Integrates with the Quantum Engine for prediction-powered insights.
 */

import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';

interface MarketData {
    asset: string;
    price: number;
    volume: number;
    timestamp: string;
    trends: string[];
    signals: string[];
}

interface AnalysisReport {
    timestamp: string;
    summary: string;
    opportunities: string[];
    risks: string[];
    recommendations: string[];
}

export class MarketAnalyzer {
    private base44: Base44Tool;
    private fs: FileSystemTool;
    private marketData: Map<string, MarketData>;
    private watchlist: string[];

    constructor(base44: Base44Tool, fs: FileSystemTool) {
        this.base44 = base44;
        this.fs = fs;
        this.marketData = new Map();
        this.watchlist = ['SOL', 'BTC', 'ETH', 'RAY', 'SRM', 'Bonk'];
    }

    /**
     * Main analysis cycle
     */
    async analyze(): Promise<AnalysisReport> {
        console.log('📈 [MarketAnalyzer] Running market analysis...');

        const report: AnalysisReport = {
            timestamp: new Date().toISOString(),
            summary: '',
            opportunities: [],
            risks: [],
            recommendations: []
        };

        try {
            // Fetch market data for watchlist
            await this.fetchMarketData();

            // Analyze each asset
            for (const [asset, data] of this.marketData) {
                const analysis = await this.analyzeAsset(asset, data);
                report.opportunities.push(...analysis.opportunities);
                report.risks.push(...analysis.risks);
                report.recommendations.push(...analysis.recommendations);
            }

            // Generate summary
            report.summary = this.generateSummary(report);

            // Log activity
            await this.base44.logActivity('MarketAnalyzer', `Analysis complete. Found ${report.opportunities.length} opportunities.`);

            console.log(`📈 [MarketAnalyzer] Analysis complete: ${report.opportunities.length} opportunities found`);

            return report;
        } catch (error: any) {
            console.error('❌ [MarketAnalyzer] Error:', error.message);
            throw error;
        }
    }

    /**
     * Fetch market data for watchlist
     */
    private async fetchMarketData(): Promise<void> {
        console.log('📈 [MarketAnalyzer] Fetching REAL market data...');
        
        // Fetch from DexScreener for crypto
        await this.fetchFromDexScreener();
        
        // Fetch from CoinGecko for broader market
        await this.fetchFromCoinGecko();
        
        console.log(`📈 [MarketAnalyzer] Loaded ${this.marketData.size} real market data points`);
    }

    /**
     * Fetch from DexScreener
     */
    private async fetchFromDexScreener(): Promise<void> {
        try {
            const response = await fetch('https://api.dexscreener.com/latest/dex/tokens');
            if (response.ok) {
                const data = await response.json();
                
                for (const pair of data.pairs || []) {
                    const symbol = pair.baseToken.symbol;
                    if (this.watchlist.includes(symbol)) {
                        const trends = this.analyzeTrendsFromData(pair);
                        
                        this.marketData.set(symbol, {
                            asset: symbol,
                            price: parseFloat(pair.priceUsd) || 0,
                            volume: parseFloat(pair.volume.h24) || 0,
                            timestamp: new Date().toISOString(),
                            trends,
                            signals: this.generateSignalsFromData(pair)
                        });
                    }
                }
            }
        } catch (error) {
            console.log('📈 [MarketAnalyzer] ⚠️ DexScreener API unavailable');
        }
    }

    /**
     * Fetch from CoinGecko
     */
    private async fetchFromCoinGecko(): Promise<void> {
        try {
            const ids = ['solana', 'bitcoin', 'ethereum', 'raydium', 'bonk'];
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
            );
            if (response.ok) {
                const data = await response.json();
                
                const symbolMap: Record<string, string> = {
                    'solana': 'SOL',
                    'bitcoin': 'BTC',
                    'ethereum': 'ETH',
                    'raydium': 'RAY',
                    'bonk': 'BONK'
                };
                
                for (const [id, priceData] of Object.entries(data)) {
                    const symbol = symbolMap[id] || id.toUpperCase();
                    if (this.watchlist.includes(symbol)) {
                        const priceInfo = priceData as any;
                        const trends = this.analyzeTrendsFromPriceData(priceInfo);
                        
                        this.marketData.set(symbol, {
                            asset: symbol,
                            price: priceInfo.usd || 0,
                            volume: priceInfo.usd_24h_vol || 0,
                            timestamp: new Date().toISOString(),
                            trends,
                            signals: this.generateSignalsFromPriceData(priceInfo)
                        });
                    }
                }
            }
        } catch (error) {
            console.log('📈 [MarketAnalyzer] ⚠️ CoinGecko API unavailable');
        }
    }

    /**
     * Analyze trends from DexScreener data
     */
    private analyzeTrendsFromData(pair: any): string[] {
        const trends: string[] = [];
        const change24h = parseFloat(pair.priceChange.h24) || 0;
        
        if (change24h > 10) trends.push('bullish', 'momentum');
        else if (change24h > 3) trends.push('bullish');
        else if (change24h < -10) trends.push('bearish', 'downtrend');
        else if (change24h < -3) trends.push('bearish');
        else trends.push('neutral', 'consolidating');
        
        return trends;
    }

    /**
     * Analyze trends from price data
     */
    private analyzeTrendsFromPriceData(priceData: any): string[] {
        const trends: string[] = [];
        const change24h = priceData.usd_24h_change || 0;
        
        if (change24h > 5) trends.push('bullish');
        else if (change24h > 2) trends.push('slightly_bullish');
        else if (change24h < -5) trends.push('bearish');
        else if (change24h < -2) trends.push('slightly_bearish');
        else trends.push('neutral');
        
        return trends;
    }

    /**
     * Generate signals from DexScreener data
     */
    private generateSignalsFromData(pair: any): string[] {
        const signals: string[] = [];
        const change24h = parseFloat(pair.priceChange.h24) || 0;
        const liquidity = parseFloat(pair.liquidity.usd) || 0;
        
        if (change24h > 15 && liquidity > 100000) signals.push('BUY_STRONG');
        else if (change24h > 5 && liquidity > 50000) signals.push('BUY');
        else if (change24h < -15) signals.push('SELL');
        else if (change24h < -5) signals.push('SELL_WEAK');
        else signals.push('HOLD');
        
        return signals;
    }

    /**
     * Generate signals from price data
     */
    private generateSignalsFromPriceData(priceData: any): string[] {
        const change24h = priceData.usd_24h_change || 0;
        
        if (change24h > 10) return ['BUY', 'momentum'];
        if (change24h > 3) return ['BUY', 'accumulate'];
        if (change24h < -10) return ['SELL', 'stop_loss'];
        if (change24h < -3) return ['SELL', 'caution'];
        return ['HOLD', 'watch'];
    }

    /**
     * Analyze individual asset
     */
    private async analyzeAsset(asset: string, data: MarketData): Promise<{
        opportunities: string[];
        risks: string[];
        recommendations: string[];
    }> {
        const result = {
            opportunities: [] as string[],
            risks: [] as string[],
            recommendations: [] as string[]
        };

        // Trend analysis
        if (data.trends.includes('bullish')) {
            result.opportunities.push(`${asset}: Strong bullish momentum detected`);
            result.recommendations.push(`Consider accumulating ${asset} on dips`);
        }

        if (data.trends.includes('bearish')) {
            result.risks.push(`${asset}: Bearish trend identified`);
            result.recommendations.push(`Exercise caution with ${asset} positions`);
        }

        // Volume analysis
        if (data.volume > 500000) {
            result.opportunities.push(`${asset}: High volume breakout potential`);
        }

        return result;
    }



    /**
     * Generate analysis summary
     */
    private generateSummary(report: AnalysisReport): string {
        return `Market Analysis Report
============================
Timestamp: ${report.timestamp}
Opportunities Found: ${report.opportunities.length}
Risks Identified: ${report.risks.length}
Recommendations: ${report.recommendations.length}

Market Sentiment: ${report.opportunities.length > report.risks.length ? 'Bullish' : 'Bearish'}
`;
    }

    /**
     * Add asset to watchlist
     */
    addToWatchlist(asset: string): void {
        if (!this.watchlist.includes(asset)) {
            this.watchlist.push(asset);
            console.log(`📈 [MarketAnalyzer] Added ${asset} to watchlist`);
        }
    }

    /**
     * Get current market data
     */
    getMarketData(): MarketData[] {
        return Array.from(this.marketData.values());
    }
}

export default MarketAnalyzer;
