/**
 * 🧠 Quantum Engine - Ollama Model Router
 * 
 * Automatically selects the optimal Ollama model based on task type.
 * Supports:
 * - llama3: General orchestration (8GB VRAM)
 * - deepseek-coder: Code analysis (8-16GB VRAM)
 * - phi-3: Quick summarization (4GB VRAM)
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import { OllamaProvider } from './ollama_provider.js';

// ============================================================================
// Task Types
// ============================================================================

export type TaskType = 
  | 'general'           // General conversation and orchestration
  | 'code_analysis'     // Code review, refactoring, bug detection
  | 'code_generation'   // Writing new code
  | 'summarization'     // Quick document summarization
  | 'reasoning'         // Complex reasoning and analysis
  | 'creative'          // Creative writing and ideation
  | 'data_extraction'   // Structured data extraction
  | 'translation'      // Language translation
  | 'question_answer'  // Q&A tasks
  | 'fast_response';   // Quick, lightweight responses

// ============================================================================
// Model Configuration
// ============================================================================

export interface ModelConfig {
  name: string;
  vramRequirement: 'low' | 'medium' | 'high';
  contextWindow: number;
  strengths: TaskType[];
  temperature: number;
  maxTokens: number;
}

export interface RouterConfig {
  host: string;
  strategy: 'performance' | 'quality' | 'balanced';
  fallbackEnabled: boolean;
  defaultModel: string;
  modelMappings: Record<TaskType, string>;
}

// ============================================================================
// Model Definitions
// ============================================================================

const MODEL_REGISTRY: Record<string, ModelConfig> = {
  'llama3': {
    name: 'llama3',
    vramRequirement: 'medium',
    contextWindow: 8192,
    strengths: ['general', 'reasoning', 'creative', 'translation', 'question_answer'],
    temperature: 0.7,
    maxTokens: 4096,
  },
  'llama3.1': {
    name: 'llama3.1',
    vramRequirement: 'medium',
    contextWindow: 131072,
    strengths: ['general', 'reasoning', 'creative', 'translation', 'question_answer', 'data_extraction'],
    temperature: 0.7,
    maxTokens: 8192,
  },
  'llama3.2': {
    name: 'llama3.2',
    vramRequirement: 'medium',
    contextWindow: 131072,
    strengths: ['general', 'reasoning', 'creative', 'translation', 'question_answer', 'data_extraction'],
    temperature: 0.7,
    maxTokens: 8192,
  },
  'deepseek-coder': {
    name: 'deepseek-coder',
    vramRequirement: 'high',
    contextWindow: 16384,
    strengths: ['code_analysis', 'code_generation'],
    temperature: 0.2,
    maxTokens: 4096,
  },
  'codellama': {
    name: 'codellama',
    vramRequirement: 'high',
    contextWindow: 16384,
    strengths: ['code_analysis', 'code_generation'],
    temperature: 0.3,
    maxTokens: 4096,
  },
  'phi-3': {
    name: 'phi-3',
    vramRequirement: 'low',
    contextWindow: 4096,
    strengths: ['summarization', 'fast_response', 'question_answer'],
    temperature: 0.5,
    maxTokens: 2048,
  },
  'mistral': {
    name: 'mistral',
    vramRequirement: 'medium',
    contextWindow: 32768,
    strengths: ['general', 'reasoning', 'translation'],
    temperature: 0.7,
    maxTokens: 4096,
  },
  'neural-chat': {
    name: 'neural-chat',
    vramRequirement: 'low',
    contextWindow: 8192,
    strengths: ['general', 'summarization', 'question_answer'],
    temperature: 0.6,
    maxTokens: 4096,
  },
};

// ============================================================================
// Ollama Model Router
// ============================================================================

export class OllamaModelRouter {
  private providers: Map<string, OllamaProvider> = new Map();
  private config: RouterConfig;
  private healthStatus: Map<string, boolean> = new Map();

  constructor(config?: Partial<RouterConfig>) {
    this.config = {
      host: config?.host || process.env.OLLAMA_HOST || 'http://localhost:11434',
      strategy: config?.strategy || (process.env.OLLAMA_MODEL_STRATEGY as 'performance' | 'quality' | 'balanced') || 'balanced',
      fallbackEnabled: config?.fallbackEnabled ?? (process.env.OLLAMA_FALLBACK_ENABLED !== 'false'),
      defaultModel: config?.defaultModel || process.env.OLLAMA_MODEL || 'llama3',
      modelMappings: {
        general: config?.modelMappings?.general || process.env.OLLAMA_MODEL || 'llama3',
        code_analysis: config?.modelMappings?.code_analysis || process.env.CODELLAMA_MODEL || 'deepseek-coder',
        code_generation: config?.modelMappings?.code_generation || process.env.CODELLAMA_MODEL || 'deepseek-coder',
        summarization: config?.modelMappings?.summarization || process.env.PHI3_MODEL || 'phi-3',
        reasoning: config?.modelMappings?.reasoning || process.env.OLLAMA_MODEL || 'llama3',
        creative: config?.modelMappings?.creative || process.env.OLLAMA_MODEL || 'llama3',
        data_extraction: config?.modelMappings?.data_extraction || process.env.OLLAMA_MODEL || 'llama3',
        translation: config?.modelMappings?.translation || process.env.OLLAMA_MODEL || 'llama3',
        question_answer: config?.modelMappings?.question_answer || process.env.PHI3_MODEL || 'phi-3',
        fast_response: config?.modelMappings?.fast_response || process.env.PHI3_MODEL || 'phi-3',
      },
    };

    console.log(`[OllamaModelRouter] Initialized with strategy: ${this.config.strategy}`);
  }

  /**
   * Register a provider instance for a model
   */
  registerProvider(modelName: string, provider: OllamaProvider): void {
    this.providers.set(modelName, provider);
    console.log(`[OllamaModelRouter] Registered provider for model: ${modelName}`);
  }

  /**
   * Select the best model for a given task type
   */
  selectModel(taskType: TaskType, options?: { 
    preferSpeed?: boolean;
    preferQuality?: boolean;
    maxContextRequired?: number;
  }): string {
    let primaryModel = this.config.modelMappings[taskType];
    
    // Check if primary model is available
    const isPrimaryHealthy = this.healthStatus.get(primaryModel) !== false;
    
    // Strategy-based selection
    switch (this.config.strategy) {
      case 'performance':
        // Always prefer fastest available model
        if (taskType === 'fast_response' || taskType === 'summarization') {
          return this.findFastestHealthyModel(['phi-3', 'neural-chat']) || primaryModel;
        }
        if (taskType === 'code_analysis' || taskType === 'code_generation') {
          return this.findFastestHealthyModel(['deepseek-coder', 'codellama']) || primaryModel;
        }
        break;
        
      case 'quality':
        // Prefer most capable model
        if (taskType === 'code_analysis' || taskType === 'code_generation') {
          const preferred = this.findMostCapableHealthy(['llama3.1', 'llama3.2', 'deepseek-coder']);
          if (preferred) return preferred;
        }
        if (taskType === 'reasoning' || taskType === 'creative') {
          const preferred = this.findMostCapableHealthy(['llama3.1', 'llama3.2', 'llama3']);
          if (preferred) return preferred;
        }
        break;
        
      case 'balanced':
      default:
        // Use default mapping, fallback if unhealthy
        if (!isPrimaryHealthy && this.config.fallbackEnabled) {
          return this.findFallbackModel(taskType);
        }
        break;
    }

    // Check context window requirements
    if (options?.maxContextRequired) {
      const modelConfig = MODEL_REGISTRY[primaryModel];
      if (modelConfig && modelConfig.contextWindow < options.maxContextRequired) {
        const betterModel = this.findModelWithContext(options.maxContextRequired);
        if (betterModel) return betterModel;
      }
    }

    return primaryModel;
  }

  /**
   * Get provider for a specific model
   */
  getProvider(modelName: string): OllamaProvider | undefined {
    return this.providers.get(modelName);
  }

  /**
   * Get provider for task type
   */
  getProviderForTask(taskType: TaskType): OllamaProvider | undefined {
    const modelName = this.selectModel(taskType);
    return this.providers.get(modelName);
  }

  /**
   * Generate response for a task
   */
  async generateForTask(
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
    const modelName = this.selectModel(taskType, options);
    const provider = this.providers.get(modelName);
    
    if (!provider) {
      throw new Error(`[OllamaModelRouter] No provider available for model: ${modelName}`);
    }

    const modelConfig = MODEL_REGISTRY[modelName];
    const configOptions = {
      temperature: options?.temperature ?? modelConfig?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? modelConfig?.maxTokens ?? 4096,
    };

    console.log(`[OllamaModelRouter] Using model: ${modelName} for task: ${taskType}`);
    return provider.generate(prompt, configOptions);
  }

  /**
   * Chat completion for a task
   */
  async chatForTask(
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
    const modelName = this.selectModel(taskType, options);
    const provider = this.providers.get(modelName);
    
    if (!provider) {
      throw new Error(`[OllamaModelRouter] No provider available for model: ${modelName}`);
    }

    const modelConfig = MODEL_REGISTRY[modelName];
    const configOptions = {
      temperature: options?.temperature ?? modelConfig?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? modelConfig?.maxTokens ?? 4096,
    };

    console.log(`[OllamaModelRouter] Using model: ${modelName} for task: ${taskType}`);
    return provider.chat(messages, configOptions);
  }

  /**
   * Update health status for a model
   */
  updateHealthStatus(modelName: string, isHealthy: boolean): void {
    this.healthStatus.set(modelName, isHealthy);
    console.log(`[OllamaModelRouter] Health status for ${modelName}: ${isHealthy ? 'healthy' : 'unhealthy'}`);
  }

  /**
   * Get all available models
   */
  getAvailableModels(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get health status for all models
   */
  getHealthStatus(): Record<string, boolean> {
    return Object.fromEntries(this.healthStatus);
  }

  /**
   * Get model configuration
   */
  getModelConfig(modelName: string): ModelConfig | undefined {
    return MODEL_REGISTRY[modelName];
  }

  /**
   * Get all supported task types
   */
  getSupportedTaskTypes(): TaskType[] {
    return Object.keys(this.config.modelMappings) as TaskType[];
  }

  /**
   * Check if a task type is supported
   */
  isTaskSupported(taskType: TaskType): boolean {
    return taskType in this.config.modelMappings;
  }

  /**
   * Get routing configuration
   */
  getConfig(): RouterConfig {
    return { ...this.config };
  }

  /**
   * Find fastest healthy model from list
   */
  private findFastestHealthyModel(models: string[]): string | undefined {
    for (const model of models) {
      if (this.healthStatus.get(model) !== false && this.providers.has(model)) {
        return model;
      }
    }
    return undefined;
  }

  /**
   * Find most capable healthy model from list
   */
  private findMostCapableHealthy(models: string[]): string | undefined {
    for (const model of models) {
      if (this.healthStatus.get(model) !== false && this.providers.has(model)) {
        return model;
      }
    }
    return undefined;
  }

  /**
   * Find model with sufficient context window
   */
  private findModelWithContext(requiredContext: number): string | undefined {
    for (const [name, config] of Object.entries(MODEL_REGISTRY)) {
      if (config.contextWindow >= requiredContext && this.healthStatus.get(name) !== false) {
        return name;
      }
    }
    return undefined;
  }

  /**
   * Find fallback model for task type
   */
  private findFallbackModel(taskType: TaskType): string {
    // Find any healthy provider
    for (const [model, provider] of this.providers) {
      if (this.healthStatus.get(model) !== false) {
        const config = MODEL_REGISTRY[model];
        if (config && config.strengths.includes(taskType)) {
          return model;
        }
      }
    }
    
    // Fallback to any healthy provider
    for (const [model] of this.providers) {
      if (this.healthStatus.get(model) !== false) {
        return model;
      }
    }
    
    // Last resort: default model
    return this.config.defaultModel;
  }

  /**
   * Dispose all providers
   */
  dispose(): void {
    for (const [, provider] of this.providers) {
      provider.dispose();
    }
    this.providers.clear();
    this.healthStatus.clear();
    console.log('[OllamaModelRouter] All providers disposed');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createDefaultRouter(): OllamaModelRouter {
  return new OllamaModelRouter();
}

export function createRouterWithProviders(providers: Map<string, OllamaProvider>): OllamaModelRouter {
  const router = new OllamaModelRouter();
  for (const [name, provider] of providers) {
    router.registerProvider(name, provider);
  }
  return router;
}

// ============================================================================
// Export
// ============================================================================

export { MODEL_REGISTRY };
