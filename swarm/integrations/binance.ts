/**
 * 🚀 Binance Integration
 *
 * In SWARM_REALITY_MODE=true, simulation fallbacks are blocked.
 */

import crypto from 'crypto';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { isRealityMode } from '../core/reality_mode.js';

function loadEnv(): void {
  if (existsSync('.env.local')) {
    dotenv.config({ path: '.env.local', override: false });
  }
  if (existsSync('.env')) {
    dotenv.config({ path: '.env', override: false });
  }
}

loadEnv();

interface BinanceConfig {
  apiKey: string;
  secretKey: string;
}

interface BinanceOrder {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
}

type BinanceMode = 'LIVE' | 'SIMULATION' | 'MISCONFIGURED';

class BinanceIntegration {
  private baseUrl = 'https://api.binance.com';
  private config: BinanceConfig | null = null;
  private realityMode = isRealityMode();

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const apiKey = process.env.BINANCE_API_KEY;
    const secretKey = process.env.BINANCE_SECRET_KEY;

    if (apiKey && secretKey) {
      this.config = { apiKey, secretKey };
      console.log('✅ [Binance] Connected to Binance API');
      return;
    }

    if (this.realityMode) {
      console.error('❌ [Binance] Reality mode active: API keys missing for authenticated trading endpoints.');
    } else {
      console.warn('⚠️ [Binance] API keys not configured - using simulation mode for authenticated endpoints');
    }
  }

  private isConfigured(): boolean {
    return this.config !== null;
  }

  private requireConfiguredForReality(scope: string): void {
    if (this.realityMode && !this.isConfigured()) {
      throw new Error(`[Binance] ${scope} requires BINANCE_API_KEY/BINANCE_SECRET_KEY in reality mode`);
    }
  }

  private getSignature(queryString: string): string {
    if (!this.config) {
      throw new Error('Binance not configured');
    }

    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(queryString)
      .digest('hex');
  }

  private async requestSigned(method: string, endpoint: string, params?: Record<string, string | number>): Promise<any> {
    this.requireConfiguredForReality(`Signed request ${endpoint}`);

    if (!this.isConfigured()) {
      return this.simulateResponse(method, params);
    }

    const queryString = params
      ? new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
      : '';

    const signature = queryString ? this.getSignature(queryString) : '';
    const url = `${this.baseUrl}${endpoint}?${queryString}${signature ? `&signature=${signature}` : ''}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-MBX-APIKEY': this.config!.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Binance API error (${response.status}): ${body.slice(0, 200)}`);
      }

      return response.json();
    } catch (error: any) {
      if (this.realityMode) {
        throw new Error(`[Binance] Signed request failed: ${error.message || error}`);
      }

      console.error('❌ [Binance] API request failed:', error);
      return this.simulateResponse(method, params);
    }
  }

  private simulateResponse(method: string, params?: Record<string, string | number>): any {
    if (this.realityMode) {
      throw new Error('[Binance] Simulation response requested while reality mode is enabled');
    }

    if (method === 'GET' && params?.symbol) {
      const symbol = params.symbol as string;
      return {
        price: symbol === 'BTCUSDT' ? '65000.00'
          : symbol === 'ETHUSDT' ? '3500.00'
            : '100.00',
        symbol
      };
    }

    if (method === 'POST' && params?.symbol) {
      return {
        symbol: params.symbol,
        orderId: Math.floor(Math.random() * 1000000),
        price: params.price || '0',
        origQty: params.quantity,
        executedQty: params.quantity,
        status: 'FILLED',
        side: params.side,
        type: params.type
      };
    }

    return {};
  }

  /**
   * Public ticker endpoint (no API key required).
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Ticker price error (${response.status}): ${body.slice(0, 160)}`);
      }

      const data = await response.json() as { price?: string };
      return parseFloat(data.price || '0');
    } catch (error: any) {
      if (this.realityMode) {
        throw new Error(`[Binance] Failed to fetch live price for ${symbol}: ${error.message || error}`);
      }

      const data = this.simulateResponse('GET', { symbol });
      return parseFloat(data.price || '0');
    }
  }

  async getBalance(asset: string): Promise<number> {
    const data = await this.requestSigned('GET', '/api/v3/account', { timestamp: Date.now() });
    const balance = data.balances?.find((b: any) => b.asset === asset);
    return parseFloat(balance?.free || '0');
  }

  async placeOrder(order: BinanceOrder): Promise<any> {
    const params = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      ...(order.price && { price: order.price }),
      ...(order.stopPrice && { stopPrice: order.stopPrice }),
      timestamp: Date.now()
    };

    return this.requestSigned('POST', '/api/v3/order', params);
  }

  async buyMarket(symbol: string, quantity: number): Promise<any> {
    return this.placeOrder({ symbol, side: 'BUY', type: 'MARKET', quantity });
  }

  async sellMarket(symbol: string, quantity: number): Promise<any> {
    return this.placeOrder({ symbol, side: 'SELL', type: 'MARKET', quantity });
  }

  getStatus(): { configured: boolean; mode: BinanceMode } {
    return {
      configured: this.isConfigured(),
      mode: this.isConfigured() ? 'LIVE' : (this.realityMode ? 'MISCONFIGURED' : 'SIMULATION')
    };
  }
}

export const binance = new BinanceIntegration();
export const isBinanceConfigured = () => binance.getStatus().configured;
export const executeBinanceTrade = (order: BinanceOrder) => binance.placeOrder(order);
export const getBinancePrice = (symbol: string) => binance.getPrice(symbol);
