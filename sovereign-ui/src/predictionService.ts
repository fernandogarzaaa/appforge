/**
 * 🚀 MARKET PREDICTION SERVICE
 * 
 * Connects sovereign-ui to the Predictive Market Intelligence Engine
 * Provides real-time predictions from local LLM ensemble
 */

import { io, Socket } from 'socket.io-client';

interface Prediction {
    id: string;
    symbol: string;
    prediction: 'UP' | 'DOWN' | 'HOLD';
    confidence: number;
    reasoning: string;
    timestamp: number;
    validUntil: number;
    features: string[];
}

interface MarketData {
    symbol: string;
    price: number;
    volume: number;
    timestamp: number;
    sentiment: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    coherence: number;
}

class PredictionService {
    private socket: Socket | null = null;
    private predictions: Map<string, Prediction> = new Map();
    private marketData: Map<string, MarketData> = new Map();
    private listeners: Set<(data: { predictions: Map<string, Prediction>; marketData: Map<string, MarketData> }) => void> = new Set();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    /**
     * Connect to prediction engine via WebSocket
     */
    connect(url: string = 'http://localhost:3001'): void {
        if (this.socket?.connected) {
            console.log('[PredictionService] Already connected');
            return;
        }

        console.log('[PredictionService] Connecting to prediction engine...');

        this.socket = io(url, {
            timeout: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('[PredictionService] Connected to engine');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', () => {
            console.warn('[PredictionService] Disconnected from engine');
        });

        this.socket.on('connect_error', (err: Error) => {
            console.warn('[PredictionService] Connection error:', err.message);
            this.reconnectAttempts++;
        });

        // Listen for predictions
        this.socket.on('prediction', (data: Prediction) => {
            this.predictions.set(data.symbol, data);
            this.notifyListeners();
        });

        // Listen for all predictions broadcast
        this.socket.on('all_predictions', (data: Record<string, Prediction>) => {
            Object.entries(data).forEach(([symbol, prediction]) => {
                this.predictions.set(symbol, prediction);
            });
            this.notifyListeners();
        });

        // Listen for market data updates
        this.socket.on('market_data', (data: MarketData[]) => {
            data.forEach(item => this.marketData.set(item.symbol, item));
            this.notifyListeners();
        });
    }

    /**
     * Disconnect from engine
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Subscribe to updates
     */
    subscribe(callback: (data: { predictions: Map<string, Prediction>; marketData: Map<string, MarketData> }) => void): () => void {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    private notifyListeners(): void {
        const data = {
            predictions: this.predictions,
            marketData: this.marketData
        };
        this.listeners.forEach(cb => cb(data));
    }

    /**
     * Get prediction for a specific symbol
     */
    getPrediction(symbol: string): Prediction | undefined {
        return this.predictions.get(symbol);
    }

    /**
     * Get all current predictions
     */
    getAllPredictions(): Prediction[] {
        return Array.from(this.predictions.values());
    }

    /**
     * Get market data for a symbol
     */
    getMarketData(symbol: string): MarketData | undefined {
        return this.marketData.get(symbol);
    }

    /**
     * Get all market data
     */
    getAllMarketData(): MarketData[] {
        return Array.from(this.marketData.values());
    }

    /**
     * Request a new prediction
     */
    requestPrediction(symbol: string): void {
        if (this.socket?.connected) {
            this.socket.emit('request_prediction', symbol);
        }
    }

    /**
     * Get prediction summary for dashboard
     */
    getSummary(): {
        totalPredictions: number;
        bullishCount: number;
        bearishCount: number;
        holdCount: number;
        avgConfidence: number;
        topPrediction: Prediction | null;
    } {
        const predictions = this.getAllPredictions();
        
        if (predictions.length === 0) {
            return {
                totalPredictions: 0,
                bullishCount: 0,
                bearishCount: 0,
                holdCount: 0,
                avgConfidence: 0,
                topPrediction: null
            };
        }

        const bullishCount = predictions.filter(p => p.prediction === 'UP').length;
        const bearishCount = predictions.filter(p => p.prediction === 'DOWN').length;
        const holdCount = predictions.filter(p => p.prediction === 'HOLD').length;
        const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
        const topPrediction = predictions.reduce((best, p) => 
            p.confidence > (best?.confidence || 0) ? p : best
        , null as Prediction | null);

        return {
            totalPredictions: predictions.length,
            bullishCount,
            bearishCount,
            holdCount,
            avgConfidence: Math.round(avgConfidence * 100) / 100,
            topPrediction
        };
    }
}

// Singleton instance
export const predictionService = new PredictionService();
export default predictionService;
