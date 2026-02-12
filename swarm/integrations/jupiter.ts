/**
 * 🪐 Jupiter/Solana Trading Integration
 *
 * Reality-first mode:
 * - Uses live Jupiter Lite API endpoints for quotes/swap transactions.
 * - Refuses simulation fallback when SWARM_REALITY_MODE=true.
 * - Requires explicit REAL_TRADING_ENABLED=true for on-chain execution.
 */

import { existsSync } from 'fs';
import dotenv from 'dotenv';
import bs58 from 'bs58';
import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';

// Common token mints
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDT_MINT = 'Es9vMFrzaCERmBfrSWZ1GD7UdbFMBvYbV9CqyWzGz3q';

const DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com';
const DEFAULT_JUPITER_BASE_URL = 'https://lite-api.jup.ag';

type JupiterMode = 'SIMULATION' | 'LIVE_READONLY' | 'LIVE' | 'MISCONFIGURED';

interface TradeExecutionOptions {
  execute?: boolean;
  slippage?: number;
}

interface TradeParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippage: number;
  execute?: boolean;
}

interface TradeResult {
  success: boolean;
  txId?: string;
  inputAmount?: number;
  outputAmount?: number;
  route?: string;
  error?: string;
  simulated?: boolean;
  requiresSignature?: boolean;
  mode?: JupiterMode;
}

interface JupiterStatus {
  configured: boolean;
  signingConfigured: boolean;
  realityMode: boolean;
  liveTradingEnabled: boolean;
  autoExecuteTrades: boolean;
  maxTradeSol: number;
  mode: JupiterMode;
  wallet?: string;
  rpcUrl?: string;
  jupiterBaseUrl: string;
  configError?: string;
}

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function loadEnv(): void {
  if (existsSync('.env.local')) {
    dotenv.config({ path: '.env.local', override: false });
  }
  if (existsSync('.env')) {
    dotenv.config({ path: '.env', override: false });
  }
}

loadEnv();

class JupiterIntegration {
  private rpcUrl: string = '';
  private walletAddress: string = '';
  private privateKey: string = '';
  private configured: boolean = false;
  private signingConfigured: boolean = false;
  private realityMode: boolean = false;
  private liveTradingEnabled: boolean = false;
  private autoExecuteTrades: boolean = false;
  private maxTradeSol: number = 0.2;
  private configError: string | null = null;
  private readonly jupiterBaseUrl: string;

  constructor() {
    this.jupiterBaseUrl = process.env.JUPITER_API_BASE_URL || DEFAULT_JUPITER_BASE_URL;
    this.loadConfig();
  }

  private get quoteEndpoint(): string {
    return `${this.jupiterBaseUrl}/swap/v1/quote`;
  }

  private get swapEndpoint(): string {
    return `${this.jupiterBaseUrl}/swap/v1/swap`;
  }

  private get priceEndpoint(): string {
    return `${this.jupiterBaseUrl}/price/v3`;
  }

  private loadConfig() {
    this.rpcUrl = process.env.SOLANA_RPC_URL || DEFAULT_RPC_URL;
    this.walletAddress = process.env.SOLANA_WALLET_ADDRESS || '';
    this.privateKey = process.env.SOLANA_PRIVATE_KEY || '';

    this.realityMode = parseBoolean(process.env.SWARM_REALITY_MODE, false);
    this.liveTradingEnabled = parseBoolean(process.env.REAL_TRADING_ENABLED, false);
    this.autoExecuteTrades = parseBoolean(process.env.SWARM_AUTO_EXECUTE_TRADES, false);

    const configuredMaxTrade = Number(process.env.SWARM_MAX_TRADE_SOL || '0.2');
    this.maxTradeSol = Number.isFinite(configuredMaxTrade) && configuredMaxTrade > 0
      ? configuredMaxTrade
      : 0.2;

    this.configured = Boolean(this.rpcUrl && this.walletAddress);
    this.signingConfigured = Boolean(this.privateKey);

    if (!this.configured) {
      this.configError = 'SOLANA_RPC_URL and SOLANA_WALLET_ADDRESS are required';
      if (this.realityMode) {
        console.error('❌ [Jupiter] Reality mode enabled but wallet/RPC is not fully configured.');
      } else {
        console.warn('⚠️ [Jupiter] Wallet/RPC not configured - simulation fallback remains enabled.');
      }
      return;
    }

    console.log('✅ [Jupiter] Connected to Solana RPC');
    console.log(`   📍 Wallet: ${this.walletAddress.slice(0, 8)}...${this.walletAddress.slice(-8)}`);
    console.log(`   🛰️ Mode: ${this.getMode()}`);
    console.log(`   🧱 Max trade size: ${this.maxTradeSol.toFixed(4)} SOL`);

    if (this.liveTradingEnabled && !this.signingConfigured) {
      console.warn('⚠️ [Jupiter] REAL_TRADING_ENABLED=true but SOLANA_PRIVATE_KEY is missing. Execution will require manual signing.');
    }
  }

  private getMode(): JupiterMode {
    if (!this.configured) {
      return this.realityMode ? 'MISCONFIGURED' : 'SIMULATION';
    }

    if (this.liveTradingEnabled) {
      return this.signingConfigured ? 'LIVE' : 'LIVE_READONLY';
    }

    return 'LIVE_READONLY';
  }

  private ensureRealityGuard(condition: boolean, message: string): void {
    if (this.realityMode && !condition) {
      throw new Error(message);
    }
  }

  private resolveSecretKey(privateKey: string): Keypair {
    const trimmed = privateKey.trim();
    if (!trimmed) {
      throw new Error('SOLANA_PRIVATE_KEY is empty');
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const parsed = JSON.parse(trimmed) as number[];
      if (!Array.isArray(parsed) || parsed.length < 32) {
        throw new Error('Invalid JSON private key format');
      }

      const secret = Uint8Array.from(parsed);
      if (secret.length >= 64) {
        return Keypair.fromSecretKey(secret.slice(0, 64));
      }
      return Keypair.fromSeed(secret.slice(0, 32));
    }

    const decoded = bs58.decode(trimmed);
    if (decoded.length === 64) {
      return Keypair.fromSecretKey(decoded);
    }
    if (decoded.length === 32) {
      return Keypair.fromSeed(decoded);
    }

    throw new Error(`Unsupported SOLANA_PRIVATE_KEY length: ${decoded.length}`);
  }

  private async signAndBroadcast(swapTransactionBase64: string): Promise<string> {
    const connection = new Connection(this.rpcUrl, 'confirmed');
    const signer = this.resolveSecretKey(this.privateKey);

    if (this.walletAddress && signer.publicKey.toBase58() !== this.walletAddress) {
      throw new Error('SOLANA_PRIVATE_KEY does not match SOLANA_WALLET_ADDRESS');
    }

    const transaction = VersionedTransaction.deserialize(Buffer.from(swapTransactionBase64, 'base64'));
    transaction.sign([signer]);

    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3
    });

    await connection.confirmTransaction(signature, 'confirmed');
    return signature;
  }

  private estimateSolNotional(params: TradeParams, outAmount: number): number {
    if (params.inputMint === SOL_MINT) {
      return params.amount / 1e9;
    }

    if (params.outputMint === SOL_MINT && outAmount > 0) {
      return outAmount / 1e9;
    }

    return 0;
  }

  private validateTradeSize(solNotional: number): void {
    if (solNotional <= 0) return;
    if (solNotional > this.maxTradeSol) {
      throw new Error(`Trade exceeds SWARM_MAX_TRADE_SOL (${this.maxTradeSol} SOL)`);
    }
  }

  /**
   * Get SOL price in USD from Jupiter price API.
   */
  async getSOLPrice(): Promise<number> {
    try {
      const response = await fetch(`${this.priceEndpoint}?ids=${SOL_MINT}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Price API failed (${response.status})`);
      }

      const data = await response.json() as Record<string, { usdPrice?: number }>;
      const price = Number(data?.[SOL_MINT]?.usdPrice);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error('Invalid SOL price payload from Jupiter');
      }

      return price;
    } catch (error: any) {
      if (this.realityMode) {
        throw new Error(`Failed to fetch real SOL price: ${error.message || error}`);
      }

      return 165.42 + (Math.random() - 0.5) * 5;
    }
  }

  /**
   * Get a swap quote from Jupiter.
   */
  async getQuote(inputMint: string, outputMint: string, amount: number, slippage: number = 1): Promise<any> {
    try {
      const slippageBps = Math.max(1, Math.floor(slippage * 100));
      const quoteUrl = `${this.quoteEndpoint}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;

      const start = Date.now();
      const response = await fetch(quoteUrl, { headers: { 'Accept': 'application/json' } });
      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Quote API failed (${response.status}): ${body.slice(0, 180)}`);
      }

      const data = await response.json();
      return {
        ...data,
        _latencyMs: latencyMs
      };
    } catch (error: any) {
      if (this.realityMode) {
        throw new Error(`Failed to fetch real quote: ${error.message || error}`);
      }

      const price = await this.getSOLPrice();
      return {
        inAmount: amount,
        outAmount: Math.floor(amount * (inputMint === SOL_MINT ? price : 1 / price) * 1_000_000),
        priceImpactPct: 0.1,
        routePlan: [],
        route: 'Jupiter (Simulation)',
        _latencyMs: 0
      };
    }
  }

  /**
   * Execute swap via Jupiter API.
   * - In LIVE_READONLY mode, returns a real unsigned swap payload.
   * - In LIVE mode with execute=true, signs and broadcasts on-chain.
   */
  async swap(params: TradeParams): Promise<TradeResult> {
    try {
      const quote = await this.getQuote(params.inputMint, params.outputMint, params.amount, params.slippage);
      if (!quote) {
        return { success: false, error: 'Failed to get quote', mode: this.getMode() };
      }

      const outAmount = Number(quote?.outAmount || 0);
      this.validateTradeSize(this.estimateSolNotional(params, outAmount));

      if (!this.configured) {
        this.ensureRealityGuard(false, this.configError || 'Wallet/RPC not configured for reality mode');

        return {
          success: true,
          txId: `sim_${Date.now().toString(36)}`,
          inputAmount: params.amount,
          outputAmount: outAmount || undefined,
          route: 'Jupiter Aggregator (SIMULATION)',
          simulated: true,
          mode: 'SIMULATION'
        };
      }

      const swapBuildResponse = await fetch(this.swapEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: this.walletAddress,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto'
        })
      });

      if (!swapBuildResponse.ok) {
        const body = await swapBuildResponse.text();
        return {
          success: false,
          error: `Swap build failed (${swapBuildResponse.status}): ${body.slice(0, 220)}`,
          mode: this.getMode()
        };
      }

      const swapPayload = await swapBuildResponse.json() as { swapTransaction?: string };
      const swapTransaction = swapPayload?.swapTransaction;
      if (!swapTransaction) {
        return { success: false, error: 'Swap transaction missing from Jupiter response', mode: this.getMode() };
      }

      const shouldExecute = Boolean(params.execute ?? this.autoExecuteTrades);
      if (!this.liveTradingEnabled || !shouldExecute) {
        return {
          success: true,
          txId: 'manual_signature_required',
          inputAmount: params.amount,
          outputAmount: outAmount || undefined,
          route: 'Jupiter Aggregator (real quote + unsigned tx)',
          requiresSignature: true,
          mode: this.getMode()
        };
      }

      if (!this.signingConfigured) {
        return {
          success: false,
          error: 'SOLANA_PRIVATE_KEY missing. Cannot auto-sign live transaction.',
          mode: this.getMode()
        };
      }

      const signature = await this.signAndBroadcast(swapTransaction);
      return {
        success: true,
        txId: signature,
        inputAmount: params.amount,
        outputAmount: outAmount || undefined,
        route: 'Jupiter Aggregator',
        mode: this.getMode()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || String(error),
        mode: this.getMode()
      };
    }
  }

  /**
   * Buy SOL with USDC.
   */
  async buyWithUSDC(amountUSDC: number, options: TradeExecutionOptions = {}): Promise<TradeResult> {
    const amount = Math.floor(amountUSDC * 1e6); // USDC has 6 decimals
    return this.swap({
      inputMint: USDC_MINT,
      outputMint: SOL_MINT,
      amount,
      slippage: options.slippage ?? 1,
      execute: options.execute
    });
  }

  /**
   * Sell SOL for USDC.
   */
  async sellForUSDC(amountSOL: number, options: TradeExecutionOptions = {}): Promise<TradeResult> {
    const amount = Math.floor(amountSOL * 1e9); // SOL has 9 decimals
    return this.swap({
      inputMint: SOL_MINT,
      outputMint: USDC_MINT,
      amount,
      slippage: options.slippage ?? 1,
      execute: options.execute
    });
  }

  /**
   * Get wallet SOL balance.
   */
  async getBalance(): Promise<number> {
    if (!this.configured) {
      this.ensureRealityGuard(false, this.configError || 'Wallet/RPC not configured for reality mode');
      return Math.random() * 10;
    }

    try {
      const connection = new Connection(this.rpcUrl, 'confirmed');
      const lamports = await connection.getBalance(new PublicKey(this.walletAddress), 'confirmed');
      return lamports / 1e9;
    } catch (error: any) {
      if (this.realityMode) {
        throw new Error(`Failed to get on-chain balance: ${error.message || error}`);
      }
      return 0;
    }
  }

  getStatus(): JupiterStatus {
    const mode = this.getMode();

    const status: JupiterStatus = {
      configured: this.configured,
      signingConfigured: this.signingConfigured,
      realityMode: this.realityMode,
      liveTradingEnabled: this.liveTradingEnabled,
      autoExecuteTrades: this.autoExecuteTrades,
      maxTradeSol: this.maxTradeSol,
      mode,
      jupiterBaseUrl: this.jupiterBaseUrl,
      rpcUrl: this.rpcUrl || undefined,
      configError: this.configError || undefined
    };

    if (this.walletAddress) {
      status.wallet = `${this.walletAddress.slice(0, 8)}...${this.walletAddress.slice(-8)}`;
    }

    return status;
  }
}

// Singleton
export const jupiter = new JupiterIntegration();

// Convenience exports
export const isJupiterConfigured = () => jupiter.getStatus().configured;
export const buySOL = (amountUSDC: number, options: TradeExecutionOptions = {}) => jupiter.buyWithUSDC(amountUSDC, options);
export const sellSOL = (amountSOL: number, options: TradeExecutionOptions = {}) => jupiter.sellForUSDC(amountSOL, options);
export const getSOLPrice = () => jupiter.getSOLPrice();
export const getWalletBalance = () => jupiter.getBalance();

export type { TradeResult, TradeExecutionOptions, JupiterStatus };
