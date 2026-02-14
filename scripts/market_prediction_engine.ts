/**
 * 🚀 PREDICTIVE MARKET INTELLIGENCE ENGINE
 * 
 * Autonomous market prediction using local LLM ensemble
 * (deepseek-coder + llama3)
 * 
 * No external API dependencies - runs entirely locally
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const DATA_DIR = path.join(process.cwd(), 'swarm/data');
const PREDICTIONS_DIR = path.join(process.cwd(), 'swarm/data/predictions');
const MODELS_DIR = path.join(process.cwd(), 'models');
const OLLAMA_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';

// ============================================================================
// TYPES
// ============================================================================

interface MarketData {
    symbol: string;
    price: number;
    volume: number;
    timestamp: number;
    sentiment: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    coherence: number;
}

interface Prediction {
    id: string;
    symbol: string;
    prediction: 'UP' | 'DOWN' | 'HOLD';
    confidence: number;
    reasoning: string;
    timestamp: number;
    validUntil: number;
    features: string[];
    modelUsed: string;
}

interface EnsembleMember {
    name: string;
    model: string;
    weight: number;
    lastAccuracy?: number;
}

// ============================================================================
// LOCAL LLM ENSEMBLE
// ============================================================================

class LocalLLMEnsemble {
    private members: EnsembleMember[] = [
        { name: 'DeepSeek-Coder', model: 'deepseek-coder', weight: 0.4 },
        { name: 'Llama3', model: 'llama3', weight: 0.35 },
        { name: 'Mistral', model: 'mistral', weight: 0.25 }
    ];

    /**
     * Query local Ollama models for market predictions
     */
    async queryModel(model: string, prompt: string): Promise<string> {
        try {
            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: false,
                    options: {
                        temperature: 0.3,
                        num_predict: 256
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error(`[Ensemble] Error querying ${model}:`, error);
            return '';
        }
    }

    /**
     * Generate ensemble prediction using weighted voting
     */
    async generateEnsemblePrediction(
        marketData: MarketData,
        historicalContext: string
    ): Promise<Prediction> {
        const prompt = this.buildPredictionPrompt(marketData, historicalContext);
        
        // Query all models in parallel
        const results = await Promise.all(
            this.members.map(async (member) => {
                const response = await this.queryModel(member.model, prompt);
                return {
                    ...member,
                    rawResponse: response,
                    parsed: this.parsePrediction(response)
                };
            })
        );

        // Calculate weighted ensemble prediction
        const weightedVotes = { UP: 0, DOWN: 0, HOLD: 0 };
        let totalWeight = 0;
        let avgConfidence = 0;
        const allReasonings: string[] = [];

        for (const result of results) {
            const vote = result.parsed?.vote || 'HOLD';
            const confidence = result.parsed?.confidence || 0.5;
            const reasoning = result.parsed?.reasoning || '';
            
            weightedVotes[vote as keyof typeof weightedVotes] += result.weight;
            totalWeight += result.weight;
            avgConfidence += confidence * result.weight;
            allReasonings.push(`[${result.name}]: ${reasoning}`);
        }

        // Normalize
        for (const key of Object.keys(weightedVotes) as Array<keyof typeof weightedVotes>) {
            weightedVotes[key] = totalWeight > 0 ? weightedVotes[key] / totalWeight : 0;
        }
        avgConfidence = totalWeight > 0 ? avgConfidence / totalWeight : 0.5;

        // Determine winner
        const sorted = Object.entries(weightedVotes).sort((a, b) => b[1] - a[1]);
        const finalVote = sorted[0][0] as 'UP' | 'DOWN' | 'HOLD';
        const finalConfidence = sorted[0][1];

        return {
            id: `${marketData.symbol}-${Date.now()}`,
            symbol: marketData.symbol,
            prediction: finalVote,
            confidence: Math.round(finalConfidence * 100) / 100,
            reasoning: allReasonings.join('\n'),
            timestamp: Date.now(),
            validUntil: Date.now() + 3600000, // 1 hour
            features: this.extractFeatures(marketData),
            modelUsed: 'ensemble'
        };
    }

    private buildPredictionPrompt(data: MarketData, context: string): string {
        return `
You are a senior quantitative analyst with 20 years of experience in algorithmic trading.

MARKET DATA:
- Symbol: ${data.symbol}
- Current Price: $${data.price.toFixed(4)}
- Volume: ${data.volume.toLocaleString()}
- Sentiment Score: ${(data.sentiment * 100).toFixed(1)}%
- Trend: ${data.trend.toUpperCase()}
- Coherence: ${(data.coherence * 100).toFixed(1)}%

HISTORICAL CONTEXT:
${context}

TASK:
Analyze this data and provide:
1. Prediction: UP, DOWN, or HOLD
2. Confidence: 0.0 to 1.0
3. Brief reasoning (2-3 sentences)

Respond in format:
PREDICTION: [UP/DOWN/HOLD]
CONFIDENCE: [0.xx]
REASONING: [your analysis]
`;
    }

    private parsePrediction(response: string): { vote: string; confidence: number; reasoning: string } {
        const voteMatch = response.match(/PREDICTION:\s*(UP|DOWN|HOLD)/i);
        const confMatch = response.match(/CONFIDENCE:\s*(0\.\d+)/i);
        const reasonMatch = response.match(/REASONING:\s*(.+)/i);

        return {
            vote: voteMatch ? voteMatch[1].toUpperCase() : 'HOLD',
            confidence: confMatch ? parseFloat(confMatch[1]) : 0.5,
            reasoning: reasonMatch ? reasonMatch[1].trim() : 'No reasoning provided'
        };
    }

    private extractFeatures(data: MarketData): string[] {
        const features: string[] = [];
        
        if (data.trend === 'bullish') features.push('trend_bullish');
        if (data.trend === 'bearish') features.push('trend_bearish');
        if (data.sentiment > 0.6) features.push('high_sentiment');
        if (data.sentiment < 0.4) features.push('low_sentiment');
        if (data.coherence > 0.8) features.push('high_coherence');
        if (data.volume > 1000000) features.push('high_volume');
        
        return features;
    }
}

// ============================================================================
// REAL-TIME DATA FEED
// ============================================================================

class MarketDataFeed {
    private symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'AVAX', 'MATIC'];
    private subscribers: ((data: MarketData) => void)[] = [];
    private interval: NodeJS.Timeout | null = null;

    /**
     * Start streaming real-time market data
     */
    startStream(intervalMs: number = 30000): void {
        if (this.interval) return;

        console.log('[MarketFeed] Starting real-time data stream...');
        
        this.interval = setInterval(async () => {
            const data = await this.fetchMarketData();
            this.subscribers.forEach(cb => cb(data));
        }, intervalMs);
    }

    stopStream(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    subscribe(callback: (data: MarketData) => void): () => void {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    /**
     * Fetch simulated market data (replace with real APIs for production)
     */
    private async fetchMarketData(): Promise<MarketData[]> {
        // Simulated market data - in production, integrate with:
        // - CoinGecko API
        // - Binance WebSocket
        // - Local blockchain nodes
        
        const results: MarketData[] = [];
        const now = Date.now();

        for (const symbol of this.symbols) {
            const basePrice = this.getBasePrice(symbol);
            const variation = (Math.random() - 0.5) * 0.02; // ±1%
            const price = basePrice * (1 + variation);
            const sentiment = 0.4 + Math.random() * 0.4; // 0.4-0.8
            const trend = sentiment > 0.55 ? 'bullish' : sentiment < 0.45 ? 'bearish' : 'neutral';

            results.push({
                symbol,
                price,
                volume: Math.random() * 5000000 + 100000,
                timestamp: now,
                sentiment,
                trend,
                coherence: 0.7 + Math.random() * 0.25 // 0.7-0.95
            });
        }

        return results;
    }

    private getBasePrice(symbol: string): number {
        const prices: Record<string, number> = {
            'BTC': 97000,
            'ETH': 3700,
            'SOL': 230,
            'ADA': 1.10,
            'DOT': 9.50,
            'LINK': 24,
            'AVAX': 42,
            'MATIC': 0.65
        };
        return prices[symbol] || 1;
    }
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

class PredictiveMarketIntelligence {
    private ensemble: LocalLLMEnsemble;
    private feed: MarketDataFeed;
    private predictions: Map<string, Prediction[]> = new Map();
    private isRunning: boolean = false;

    constructor() {
        this.ensemble = new LocalLLMEnsemble();
        this.feed = new MarketDataFeed();
    }

    /**
     * Start the autonomous prediction engine
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('[MarketIntelligence] Already running');
            return;
        }

        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║    🚀 PREDICTIVE MARKET INTELLIGENCE ENGINE STARTED          ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');

        // Ensure directories exist
        await fs.mkdir(PREDICTIONS_DIR, { recursive: true });

        // Start data feed
        this.feed.startStream(30000); // Update every 30 seconds

        // Subscribe to market data and generate predictions
        this.feed.subscribe(async (data) => {
            await this.generateAndStorePrediction(data);
        });

        this.isRunning = true;
        console.log('[MarketIntelligence] Prediction engine active');
        console.log(`[MarketIntelligence] Monitoring: ${this.feed['symbols'].join(', ')}`);
    }

    /**
     * Generate prediction for incoming market data
     */
    private async generateAndStorePrediction(data: MarketData): Promise<Prediction> {
        console.log(`[MarketIntelligence] Analyzing ${data.symbol}...`);

        // Load historical context
        const history = await this.loadHistoricalContext(data.symbol);

        // Generate ensemble prediction
        const prediction = await this.ensemble.generateEnsemblePrediction(data, history);

        // Store prediction
        const existing = this.predictions.get(data.symbol) || [];
        existing.push(prediction);
        if (existing.length > 100) existing.shift(); // Keep last 100
        this.predictions.set(data.symbol, existing);

        // Save to disk
        await this.savePrediction(prediction);

        // Log result
        const emoji = prediction.prediction === 'UP' ? '📈' : prediction.prediction === 'DOWN' ? '📉' : '➡️';
        console.log(`${emoji} ${data.symbol}: ${prediction.prediction} (${(prediction.confidence * 100).toFixed(0)}%)`);

        return prediction;
    }

    /**
     * Get current prediction for a symbol
     */
    async getPrediction(symbol: string): Promise<Prediction | null> {
        const predictions = this.predictions.get(symbol);
        if (!predictions || predictions.length === 0) {
            // Generate one-time prediction
            const feed = new MarketDataFeed();
            const data = await feed.fetchMarketData();
            const target = data.find(d => d.symbol === symbol);
            if (target) {
                return this.generateAndStorePrediction(target);
            }
            return null;
        }
        return predictions[predictions.length - 1];
    }

    /**
     * Get all current predictions
     */
    getAllPredictions(): Record<string, Prediction> {
        const result: Record<string, Prediction> = {};
        for (const [symbol, predictions] of this.predictions) {
            if (predictions.length > 0) {
                result[symbol] = predictions[predictions.length - 1];
            }
        }
        return result;
    }

    private async loadHistoricalContext(symbol: string): Promise<string> {
        try {
            const historyPath = path.join(DATA_DIR, `${symbol.toLowerCase()}_history.json`);
            const content = await fs.readFile(historyPath, 'utf-8');
            const history = JSON.parse(content);
            
            // Return last 5 data points
            const recent = history.slice(-5);
            return JSON.stringify(recent, null, 2);
        } catch {
            return `Recent price action shows ${symbol} consolidating around current levels with moderate volume.`;
        }
    }

    private async savePrediction(prediction: Prediction): Promise<void> {
        const filepath = path.join(PREDICTIONS_DIR, `${prediction.symbol.toLowerCase()}_latest.json`);
        await fs.writeFile(filepath, JSON.stringify(prediction, null, 2));
    }

    stop(): void {
        this.feed.stopStream();
        this.isRunning = false;
        console.log('[MarketIntelligence] Engine stopped');
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    const engine = new PredictiveMarketIntelligence();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n[MarketIntelligence] Shutting down...');
        engine.stop();
        process.exit(0);
    });

    // Start the engine
    await engine.start();

    // Keep running
    console.log('[MarketIntelligence] Press Ctrl+C to stop');
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

export { PredictiveMarketIntelligence, MarketDataFeed, LocalLLMEnsemble };
