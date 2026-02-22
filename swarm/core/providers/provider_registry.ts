/**
 * 🧠 Quantum Engine - Provider Registry
 * 
 * Central registry for all LLM providers with automatic discovery,
 * environment-based configuration, and health monitoring.
 * 
 * TRUE AI INDEPENDENCE MODE:
 * - Local Ollama providers are PRIMARY
 * - External APIs are DISABLED by default
 * - External APIs only activate if ENABLE_EXTERNAL_APIS=true
 * - True Independence completely blocks external APIs
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  BaseLLMProvider,
  LLMConfig,
  ProviderType,
  ProviderHealth,
  SmartProviderSelector,
  UsageTracker,
  TaskRequirements
} from './llm_provider_interface.js';

// Provider implementations
import { OpenAIProvider } from './openai_provider.js';
import { ClaudeProvider } from './claude_provider.js';
import { GeminiProvider } from './gemini_provider.js';
import { GrokProvider } from './grok_provider.js';
import { CodexProvider } from './codex_provider.js';
import { OllamaProvider } from './ollama_provider.js';
import { OllamaModelRouter, TaskType } from './ollama_model_router.js';
import { LlamaCppProvider } from './llamacpp_provider.js';
import { SyntheticProvider } from './synthetic_provider.js';
import { isRealityMode } from '../reality_mode.js';

// ============================================================================
// Environment Configuration
// ============================================================================

interface EnvConfig {
  // OpenAI
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  
  // Anthropic Claude
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  
  // Google Gemini
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  
  // xAI Grok
  XAI_API_KEY?: string;
  XAI_MODEL?: string;
  
  // OpenAI Codex
  CODEX_API_KEY?: string;
  CODEX_MODEL?: string;
  
  // Local Models (True Independence Configuration)
  OLLAMA_HOST?: string;
  OLLAMA_MODEL?: string;
  CODELLAMA_MODEL?: string;
  PHI3_MODEL?: string;
  EMBEDDING_MODEL?: string;
  LLAMACPP_HOST?: string;
  LLAMACPP_MODEL?: string;
  OLLAMA_MODEL_STRATEGY?: 'performance' | 'quality' | 'balanced';
  OLLAMA_FALLBACK_ENABLED?: string;
  
  // True AI Independence Settings
  TRUE_AI_INDEPENDENCE?: string;
  ENABLE_EXTERNAL_APIS?: string;
  
  // Provider Preferences
  PRIMARY_PROVIDER?: ProviderType;
  FALLBACK_PROVIDER?: ProviderType;
  LOCAL_MODEL_THRESHOLD?: string;
}

// ============================================================================
// Provider Registry
// ============================================================================

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<ProviderType, BaseLLMProvider> = new Map();
  private localProviders: Map<ProviderType, BaseLLMProvider> = new Map();
  private externalProviders: Map<ProviderType, BaseLLMProvider> = new Map();
  private ollamaRouter: OllamaModelRouter | null = null;
  private selector: SmartProviderSelector;
  private usageTracker: UsageTracker;
  private initialized: boolean = false;
  private envConfig: EnvConfig;
  private trueIndependenceMode: boolean = false;
  private externalEnabled: boolean = false;

  private constructor() {
    this.selector = new SmartProviderSelector();
    this.usageTracker = UsageTracker.getInstance();
    this.envConfig = this.loadEnvConfig();
    this.checkIndependenceMode();
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Check True AI Independence mode settings
   */
  private checkIndependenceMode(): void {
    // TRUE_AI_INDEPENDENCE=true completely disables external APIs
    this.trueIndependenceMode = process.env.TRUE_AI_INDEPENDENCE === 'true';
    
    // External APIs can only be enabled if NOT in True Independence mode
    // and ENABLE_EXTERNAL_APIS is explicitly set to true
    this.externalEnabled = !this.trueIndependenceMode && 
                          process.env.ENABLE_EXTERNAL_APIS === 'true';

    console.log(`[ProviderRegistry] 🔒 True Independence Mode: ${this.trueIndependenceMode}`);
    console.log(`[ProviderRegistry] 🌐 External APIs Enabled: ${this.externalEnabled}`);
    
    if (this.trueIndependenceMode) {
      console.log(`[ProviderRegistry] 🛡️ TRUE AI INDEPENDENCE ACTIVE - External APIs BLOCKED`);
    }
  }

  /**
   * Load environment configuration
   */
  private loadEnvConfig(): EnvConfig {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Try multiple env file locations
    const envPaths = [
      path.resolve(__dirname, '../../../.env.local'),
      path.resolve(__dirname, '../../../.env'),
      path.resolve(__dirname, '../../../.env.production'),
    ];

    for (const envPath of envPaths) {
      try {
        const result = dotenv.config({ path: envPath });
        if (!result.error) {
          console.log(`[ProviderRegistry] Loaded env from: ${envPath}`);
          break;
        }
      } catch {
        // Continue to next path
      }
    }

    return {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',
      
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      
      XAI_API_KEY: process.env.XAI_API_KEY,
      XAI_MODEL: process.env.XAI_MODEL || 'grok-2',
      
      CODEX_API_KEY: process.env.CODEX_API_KEY,
      CODEX_MODEL: process.env.CODEX_MODEL || 'codex-1',
      
      // TRUE INDEPENDENCE: Local models are PRIMARY
      OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
      OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3:70b-instruct-q4_0',
      CODELLAMA_MODEL: process.env.CODELLAMA_MODEL || 'deepseek-coder:33b-instruct-q4_0',
      PHI3_MODEL: process.env.PHI3_MODEL || 'phi3:mini-4k-instruct-q4_0',
      EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
      LLAMACPP_HOST: process.env.LLAMACPP_HOST || 'http://localhost:8080',
      LLAMACPP_MODEL: process.env.LLAMACPP_MODEL || 'llama-2-7b',
      OLLAMA_MODEL_STRATEGY: process.env.OLLAMA_MODEL_STRATEGY as 'performance' | 'quality' | 'balanced',
      OLLAMA_FALLBACK_ENABLED: process.env.OLLMACPP_FALLBACK_ENABLED,
      
      // True Independence settings
      TRUE_AI_INDEPENDENCE: process.env.TRUE_AI_INDEPENDENCE,
      ENABLE_EXTERNAL_APIS: process.env.ENABLE_EXTERNAL_APIS,
      
      PRIMARY_PROVIDER: (process.env.PRIMARY_PROVIDER as ProviderType) || 'ollama',
      FALLBACK_PROVIDER: (process.env.FALLBACK_PROVIDER as ProviderType) || 'ollama',
      LOCAL_MODEL_THRESHOLD: process.env.LOCAL_MODEL_THRESHOLD || '100',
    };
  }

  /**
   * Initialize all available providers
   * PRIORITY: Local Ollama providers first, external APIs only if explicitly enabled
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[ProviderRegistry] Already initialized');
      return;
    }

    console.log('[ProviderRegistry] 🚀 Initializing providers...');
    console.log('[ProviderRegistry] 📍 PRIORITY: Local Ollama providers first');

    // =========================================================================
    // PRIORITY 1: Initialize LOCAL OLLAMA providers (ALWAYS active)
    // =========================================================================
    
    await this.initializeLocalProviders();

    // =========================================================================
    // PRIORITY 2: Initialize EXTERNAL providers (DISABLED by default)
    // External APIs only activate if ENABLE_EXTERNAL_APIS=true AND
    // TRUE_AI_INDEPENDENCE is NOT true
    // =========================================================================
    
    if (this.externalEnabled) {
      console.log('[ProviderRegistry] 🌐 External APIs explicitly enabled');
      await this.initializeExternalProviders();
    } else {
      console.log('[ProviderRegistry] ⛔ External APIs disabled (use ENABLE_EXTERNAL_APIS=true to enable)');
    }

    this.initialized = true;
    console.log(`[ProviderRegistry] ✅ Initialization complete.`);
    console.log(`[ProviderRegistry] 📊 Local providers: ${this.localProviders.size}`);
    console.log(`[ProviderRegistry] 📊 External providers: ${this.externalProviders.size}`);
  }

  /**
   * Initialize local Ollama providers (PRIMARY)
   */
  private async initializeLocalProviders(): Promise<void> {
    console.log('[ProviderRegistry] 🏠 Initializing LOCAL providers...');

    // Initialize Ollama with multi-model support
    try {
      // Create Ollama model router
      this.ollamaRouter = new OllamaModelRouter({
        host: this.envConfig.OLLAMA_HOST,
        strategy: this.envConfig.OLLAMA_MODEL_STRATEGY || 'balanced',
        fallbackEnabled: this.envConfig.OLLAMA_FALLBACK_ENABLED !== 'false',
        defaultModel: this.envConfig.OLLAMA_MODEL!,
        modelMappings: {
          // TRUE INDEPENDENCE MODEL CONFIGURATION
          general: this.envConfig.OLLAMA_MODEL!,
          code_analysis: this.envConfig.CODELLAMA_MODEL!,
          code_generation: this.envConfig.CODELLAMA_MODEL!,
          summarization: this.envConfig.PHI3_MODEL!,
          reasoning: this.envConfig.OLLAMA_MODEL!,
          creative: this.envConfig.OLLAMA_MODEL!,
          data_extraction: this.envConfig.OLLAMA_MODEL!,
          translation: this.envConfig.OLLAMA_MODEL!,
          question_answer: this.envConfig.PHI3_MODEL!,
          fast_response: this.envConfig.PHI3_MODEL!,
          // Embedding model for embeddings
        },
      });

      // Initialize all configured Ollama models
      const ollamaModels = [
        { name: this.envConfig.OLLAMA_MODEL!, role: 'reasoning' },
        { name: this.envConfig.CODELLAMA_MODEL!, role: 'code' },
        { name: this.envConfig.PHI3_MODEL!, role: 'fast' },
        { name: this.envConfig.EMBEDDING_MODEL!, role: 'embedding' },
      ];

      for (const { name, role } of ollamaModels) {
        try {
          const ollama = new OllamaProvider({
            provider: 'ollama',
            model: name,
            baseUrl: this.envConfig.OLLAMA_HOST,
          });
          await ollama.initialize();
          this.registerLocal(ollama);
          this.ollamaRouter.registerProvider(name, ollama);
          
          // Update health status
          const health = await ollama.healthCheck();
          this.ollamaRouter.updateHealthStatus(name, health.status === 'healthy');
          
          console.log(`[ProviderRegistry] ✅ Ollama ${name} (${role}) registered`);
        } catch (e: any) {
          console.warn(`[ProviderRegistry] Ollama model ${name} initialization failed: ${e.message}`);
          this.ollamaRouter.updateHealthStatus(name, false);
        }
      }

      console.log('[ProviderRegistry] ✅ Ollama multi-model router initialized');
    } catch (e: any) {
      console.warn(`[ProviderRegistry] Ollama router initialization failed: ${e.message}`);
      if (isRealityMode()) {
        console.warn('[ProviderRegistry] ⚠️ Reality mode active: synthetic fallback provider disabled.');
      } else {
        // Add synthetic provider as fallback for local-only operation
        const synthetic = new SyntheticProvider({
          provider: 'synthetic',
          model: 'synthetic-local-v1',
        });
        this.registerLocal(synthetic);
        console.log('[ProviderRegistry] ✅ Synthetic provider registered as local fallback');
      }
    }

    // Initialize LlamaCpp as local provider
    try {
      const llamacpp = new LlamaCppProvider({
        provider: 'llamacpp',
        model: this.envConfig.LLAMACPP_MODEL!,
        baseUrl: this.envConfig.LLAMACPP_HOST,
      });
      await llamacpp.initialize();
      this.registerLocal(llamacpp);
      console.log('[ProviderRegistry] ✅ LlamaCpp registered (local)');
    } catch (e: any) {
      console.warn(`[ProviderRegistry] LlamaCpp initialization failed: ${e.message}`);
    }
  }

  /**
   * Initialize external providers (DISABLED by default)
   */
  private async initializeExternalProviders(): Promise<void> {
    console.log('[ProviderRegistry] 🌐 Initializing EXTERNAL providers...');

    // Initialize OpenAI
    if (this.envConfig.OPENAI_API_KEY) {
      try {
        const openai = new OpenAIProvider({
          provider: 'openai',
          model: this.envConfig.OPENAI_MODEL!,
          apiKey: this.envConfig.OPENAI_API_KEY,
        });
        await openai.initialize();
        this.registerExternal(openai);
        console.log('[ProviderRegistry] ✅ OpenAI registered (external)');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] OpenAI initialization failed: ${e.message}`);
      }
    }

    // Initialize Claude
    if (this.envConfig.ANTHROPIC_API_KEY) {
      try {
        const claude = new ClaudeProvider({
          provider: 'claude',
          model: this.envConfig.ANTHROPIC_MODEL!,
          apiKey: this.envConfig.ANTHROPIC_API_KEY,
        });
        await claude.initialize();
        this.registerExternal(claude);
        console.log('[ProviderRegistry] ✅ Claude registered (external)');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] Claude initialization failed: ${e.message}`);
      }
    }

    // Initialize Gemini
    if (this.envConfig.GEMINI_API_KEY) {
      try {
        const gemini = new GeminiProvider({
          provider: 'gemini',
          model: this.envConfig.GEMINI_MODEL!,
          apiKey: this.envConfig.GEMINI_API_KEY,
        });
        await gemini.initialize();
        this.registerExternal(gemini);
        console.log('[ProviderRegistry] ✅ Gemini registered (external)');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] Gemini initialization failed: ${e.message}`);
      }
    }

    // Initialize Grok
    if (this.envConfig.XAI_API_KEY) {
      try {
        const grok = new GrokProvider({
          provider: 'grok',
          model: this.envConfig.XAI_MODEL!,
          apiKey: this.envConfig.XAI_API_KEY,
        });
        await grok.initialize();
        this.registerExternal(grok);
        console.log('[ProviderRegistry] ✅ Grok registered (external)');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] Grok initialization failed: ${e.message}`);
      }
    }

    // Initialize Codex
    if (this.envConfig.CODEX_API_KEY) {
      try {
        const codex = new CodexProvider({
          provider: 'codex',
          model: this.envConfig.CODEX_MODEL!,
          apiKey: this.envConfig.CODEX_API_KEY,
        });
        await codex.initialize();
        this.registerExternal(codex);
        console.log('[ProviderRegistry] ✅ Codex registered (external)');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] Codex initialization failed: ${e.message}`);
      }
    }
  }

  /**
   * Register a local provider (Ollama, LlamaCpp, Synthetic)
   */
  private registerLocal(provider: BaseLLMProvider): void {
    this.providers.set(provider.getProviderType(), provider);
    this.localProviders.set(provider.getProviderType(), provider);
    this.selector.register(provider);
    console.log(`[ProviderRegistry] 📍 Registered local provider: ${provider.getProviderType()}`);
  }

  /**
   * Register an external provider (OpenAI, Claude, Gemini, Grok, Codex)
   */
  private registerExternal(provider: BaseLLMProvider): void {
    this.providers.set(provider.getProviderType(), provider);
    this.externalProviders.set(provider.getProviderType(), provider);
    this.selector.register(provider);
    console.log(`[ProviderRegistry] 🌐 Registered external provider: ${provider.getProviderType()}`);
  }

  /**
   * Register a provider (legacy method)
   */
  register(provider: BaseLLMProvider): void {
    // Determine if local or external based on provider type
    const externalTypes: ProviderType[] = ['openai', 'claude', 'gemini', 'grok', 'codex'];
    if (externalTypes.includes(provider.getProviderType())) {
      this.registerExternal(provider);
    } else {
      this.registerLocal(provider);
    }
  }

  // ============================================================================
  // TRUE INDEPENDENCE STATUS METHODS
  // ============================================================================

  /**
   * Check if running in True Independence mode (local-only)
   */
  isLocalOnly(): boolean {
    return this.localProviders.size > 0 && this.externalProviders.size === 0;
  }

  /**
   * Check if True AI Independence mode is enabled
   */
  isTrueIndependenceMode(): boolean {
    return this.trueIndependenceMode;
  }

  /**
   * Check if external APIs are enabled
   */
  areExternalAPIsEnabled(): boolean {
    return this.externalEnabled;
  }

  /**
   * Get only active (available) providers
   */
  getActiveProviders(): BaseLLMProvider[] {
    return Array.from(this.providers.values()).filter(p => {
      // Filter to only healthy providers
      return this.providers.has(p.getProviderType());
    });
  }

  /**
   * Get all local providers
   */
  getLocalProviders(): BaseLLMProvider[] {
    return Array.from(this.localProviders.values());
  }

  /**
   * Get all external providers
   */
  getExternalProviders(): BaseLLMProvider[] {
    return Array.from(this.externalProviders.values());
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): { local: number; external: number; total: number; independenceMode: boolean; externalEnabled: boolean } {
    return {
      local: this.localProviders.size,
      external: this.externalProviders.size,
      total: this.providers.size,
      independenceMode: this.trueIndependenceMode,
      externalEnabled: this.externalEnabled,
    };
  }

  // ============================================================================
  // PROVIDER ACCESS METHODS
  // ============================================================================

  /**
   * Get provider by type
   */
  getProvider(type: ProviderType): BaseLLMProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get primary provider (defaults to first local provider)
   */
  getPrimaryProvider(): BaseLLMProvider | undefined {
    // In True Independence mode, prefer local providers
    const primary = this.envConfig.PRIMARY_PROVIDER;
    if (primary) {
      return this.providers.get(primary);
    }
    // Fallback to first local provider
    return this.localProviders.values().next().value;
  }

  /**
   * Get fallback provider
   */
  getFallbackProvider(): BaseLLMProvider | undefined {
    const fallback = this.envConfig.FALLBACK_PROVIDER;
    if (fallback) {
      return this.providers.get(fallback);
    }
    // Fallback to first external provider if available, else second local
    const external = this.externalProviders.values().next().value;
    if (external) return external;
    const locals = Array.from(this.localProviders.values());
    return locals.length > 1 ? locals[1] : locals[0];
  }

  /**
   * Get best provider for task (prioritizes local in independence mode)
   */
  getBestProvider(requirements: TaskRequirements): BaseLLMProvider {
    // In True Independence mode, always prefer local providers
    if (this.trueIndependenceMode || this.isLocalOnly()) {
      const localBest = this.getBestLocalProvider(requirements);
      if (localBest) return localBest;
    }
    return this.selector.select(requirements);
  }

  /**
   * Get best local provider for task
   */
  private getBestLocalProvider(requirements: TaskRequirements): BaseLLMProvider | undefined {
    const locals = Array.from(this.localProviders.values());
    if (locals.length === 0) return undefined;
    
    // Simple selection - prefer Ollama for most tasks
    for (const provider of locals) {
      if (provider.getProviderType() === 'ollama') {
        return provider;
      }
    }
    return locals[0];
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): BaseLLMProvider[] {
    return Array.from(this.providers.values());
  }

  // ============================================================================
  // HEALTH & USAGE METHODS
  // ============================================================================

  /**
   * Check health of all providers
   */
  async checkHealth(): Promise<Map<ProviderType, ProviderHealth>> {
    const results = new Map<ProviderType, ProviderHealth>();
    
    for (const [type, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        results.set(type, health);
      } catch (e: any) {
        results.set(type, {
          provider: type,
          status: 'down',
          latency: -1,
          error: e.message,
          lastChecked: new Date(),
        });
      }
    }
    
    return results;
  }

  /**
   * Generate response using best available provider
   */
  async generate(
    prompt: string, 
    requirements?: Partial<TaskRequirements>,
    options?: Partial<LLMConfig>
  ): Promise<ReturnType<BaseLLMProvider['generate']>> {
    const taskReq: TaskRequirements = {
      complexity: requirements?.complexity || 'medium',
      requiresVision: requirements?.requiresVision || false,
      requiresFunctionCalling: requirements?.requiresFunctionCalling || false,
      maxLatency: requirements?.maxLatency,
      maxCost: requirements?.maxCost,
      minContextWindow: requirements?.minContextWindow,
    };

    const provider = this.getBestProvider(taskReq);
    
    if (!provider) {
      throw new Error('[ProviderRegistry] No providers available');
    }

    const startTime = Date.now();
    const response = await provider.generate(prompt, options);
    response.latency = Date.now() - startTime;

    // Track usage
    this.usageTracker.record({
      provider: provider.getProviderType(),
      model: provider.getModelName(),
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      cost: provider.calculateCost(response.usage),
      timestamp: new Date(),
    });

    return response;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): ReturnType<UsageTracker['getTotalUsage']> {
    return this.usageTracker.getTotalUsage();
  }

  /**
   * Clear usage data
   */
  clearUsage(): void {
    this.usageTracker.clear();
  }

  /**
   * Check if provider is available
   */
  isAvailable(type: ProviderType): boolean {
    return this.providers.has(type);
  }

  /**
   * Get provider count
   */
  getProviderCount(): number {
    return this.providers.size;
  }

  // ============================================================================
  // OLLAMA MULTI-MODEL METHODS
  // ============================================================================

  /**
   * Get the Ollama model router
   */
  getOllamaRouter(): OllamaModelRouter | null {
    return this.ollamaRouter;
  }

  /**
   * Generate response using Ollama with automatic model selection
   */
  async generateWithOllama(
    taskType: TaskType,
    prompt: string,
    options?: {
      preferSpeed?: boolean;
      preferQuality?: boolean;
      maxContextRequired?: number;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ReturnType<OllamaProvider['generate']>> {
    if (!this.ollamaRouter) {
      throw new Error('[ProviderRegistry] Ollama router not initialized');
    }
    return this.ollamaRouter.generateForTask(taskType, prompt, options);
  }

  /**
   * Chat completion using Ollama with automatic model selection
   */
  async chatWithOllama(
    taskType: TaskType,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: {
      preferSpeed?: boolean;
      preferQuality?: boolean;
      maxContextRequired?: number;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ReturnType<OllamaProvider['chat']>> {
    if (!this.ollamaRouter) {
      throw new Error('[ProviderRegistry] Ollama router not initialized');
    }
    return this.ollamaRouter.chatForTask(taskType, messages, options);
  }

  /**
   * Get best Ollama model for task
   */
  getBestOllamaModel(taskType: TaskType): string {
    if (!this.ollamaRouter) {
      throw new Error('[ProviderRegistry] Ollama router not initialized');
    }
    return this.ollamaRouter.selectModel(taskType);
  }

  /**
   * Get all available Ollama models
   */
  getAvailableOllamaModels(): string[] {
    if (!this.ollamaRouter) {
      return [];
    }
    return this.ollamaRouter.getAvailableModels();
  }

  /**
   * Get Ollama health status
   */
  getOllamaHealthStatus(): Record<string, boolean> {
    if (!this.ollamaRouter) {
      return {};
    }
    return this.ollamaRouter.getHealthStatus();
  }

  /**
   * Check Ollama model health
   */
  async checkOllamaHealth(): Promise<Map<string, ProviderHealth>> {
    const results = new Map<string, ProviderHealth>();
    
    if (!this.ollamaRouter) {
      return results;
    }

    const models = this.ollamaRouter.getAvailableModels();
    for (const model of models) {
      const provider = this.ollamaRouter.getProvider(model);
      if (provider) {
        const health = await provider.healthCheck();
        results.set(model, health);
        this.ollamaRouter.updateHealthStatus(model, health.status === 'healthy');
      }
    }

    return results;
  }

  /**
   * Dispose all providers
   */
  dispose(): void {
    for (const [, provider] of this.providers) {
      provider.dispose();
    }
    this.providers.clear();
    this.localProviders.clear();
    this.externalProviders.clear();
    this.initialized = false;
    
    if (this.ollamaRouter) {
      this.ollamaRouter.dispose();
      this.ollamaRouter = null;
    }
    
    console.log('[ProviderRegistry] All providers disposed');
  }
}

// ============================================================================
// Singleton Accessor
// ============================================================================

export function getProviderRegistry(): ProviderRegistry {
  return ProviderRegistry.getInstance();
}

// Initialize on import
ProviderRegistry.getInstance();
