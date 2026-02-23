/**
 * Clawd Omega: Quantum-Hyper LLM Client
 * Integration with zero-budget quantum-enhanced LLM
 * 
 * Features:
 * - Quantum superposition reasoning
 * - Holographic memory
 * - Self-improving strategies
 * - Evolutionary optimization
 */

const OMEGA_URL = import.meta.env.VITE_OMEGA_LLM_URL || 'https://your-username-clawd-omega.hf.space';

interface QuantumMetrics {
  coherence: number;
  generation_time_ms: number;
  tokens_generated: number;
  prompt_tokens: number;
}

interface StrategyDNA {
  temperature: number;
  top_p: number;
  top_k: number;
  repetition_penalty: number;
  system_prompt_weight: number;
  fitness_score: number;
  generation: number;
}

interface EvolutionMetrics {
  evolution_count: number;
  current_generation: number;
  fitness_score: number;
  performance_trend: string;
  memory_size: number;
  strategy: {
    temperature: number;
    top_p: number;
    top_k: number;
    repetition_penalty: number;
  };
}

interface GenerateResponse {
  response: string;
  quantum_metrics: QuantumMetrics;
  strategy: StrategyDNA;
  evolution: EvolutionMetrics;
  model: string;
  version: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class ClawdOmegaClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = OMEGA_URL, timeout: number = 120000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
  }

  /**
   * Generate with quantum-hyper intelligence
   */
  async generate(
    prompt: string,
    context?: string,
    maxTokens: number = 256
  ): Promise<GenerateResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context,
          max_tokens: maxTokens
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Omega LLM request failed');
    }

    return response.json();
  }

  /**
   * OpenAI-compatible chat completions
   */
  async chatCompletion(
    messages: ChatMessage[],
    maxTokens: number = 256
  ): Promise<ChatCompletionResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          max_tokens: maxTokens
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Omega LLM chat failed');
    }

    return response.json();
  }

  /**
   * Submit feedback for evolutionary learning
   */
  async submitFeedback(queryHash: string, score: number): Promise<{ status: string; new_fitness: number }> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/feedback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_hash: queryHash,
          score: Math.max(0, Math.min(1, score))  // Clamp 0-1
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Feedback submission failed');
    }

    return response.json();
  }

  /**
   * Get health and evolution metrics
   */
  async getHealth(): Promise<{
    status: string;
    model: string;
    hyper_mode: boolean;
    evolution_enabled: boolean;
    hyper_intelligence: EvolutionMetrics;
  }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }

  /**
   * Get holographic memory insights
   */
  async getMemoryInsights(): Promise<{
    memory_count: number;
    strategic_knowledge: Record<string, any>;
    access_patterns: Record<string, number>;
  }> {
    const response = await fetch(`${this.baseUrl}/memory`);
    
    if (!response.ok) {
      throw new Error('Memory insights failed');
    }

    return response.json();
  }

  /**
   * Check if Omega LLM is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Simple text generation (convenience method)
   */
  async complete(prompt: string, context?: string): Promise<string> {
    const result = await this.generate(prompt, context);
    return result.response;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Export singleton
export const cladwOmega = new ClawdOmegaClient();

// Export class for custom instances
export { ClawdOmegaClient };

/**
 * AppForge LLM Provider Integration
 * Can be swapped with other providers in the LLM context
 */
export const omegaProvider = {
  name: 'clawd-omega',
  displayName: 'Clawd Omega (Quantum-Hyper)',
  
  async generate(prompt: string, options?: { context?: string; max_tokens?: number }) {
    return cladwOmega.generate(prompt, options?.context, options?.max_tokens);
  },
  
  async chat(messages: ChatMessage[], options?: { max_tokens?: number }) {
    return cladwOmega.chatCompletion(messages, options?.max_tokens);
  },
  
  async isAvailable() {
    return cladwOmega.isAvailable();
  },
  
  getMetrics() {
    return cladwOmega.getHealth();
  }
};
