/**
 * Clawd-Phi2 LLM Client
 * Integration with self-hosted zero-budget LLM on Hugging Face Spaces
 * 
 * Usage:
 * import { freeLLM } from '@/api/freeLLM';
 * const response = await freeLLM.generate('Write a React component');
 */

// Default to Hugging Face Space URL (update after deployment)
const DEFAULT_LLM_URL = import.meta.env.VITE_FREE_LLM_URL || 'https://your-username-clawd-phi2.hf.space';

interface GenerateOptions {
  max_tokens?: number;
  temperature?: number;
  context?: string;
}

interface GenerateResponse {
  response: string;
  model: string;
  tokens_generated: number;
  generation_time_ms: number;
  prompt_tokens: number;
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

class FreeLLMClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = DEFAULT_LLM_URL, timeout: number = 60000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  /**
   * Simple text generation
   */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          max_tokens: options.max_tokens || 256,
          temperature: options.temperature ?? 0.7,
          context: options.context || ''
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'LLM request failed');
    }

    const data: GenerateResponse = await response.json();
    return data.response;
  }

  /**
   * OpenAI-compatible chat completions
   */
  async chatCompletion(
    messages: ChatMessage[],
    options: { max_tokens?: number; temperature?: number } = {}
  ): Promise<string> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          max_tokens: options.max_tokens || 256,
          temperature: options.temperature ?? 0.7
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'LLM request failed');
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; model: string; quantized: boolean }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Check if LLM is available and responding
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.health();
      return health.status === 'healthy';
    } catch {
      return false;
    }
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

// Export singleton instance
export const freeLLM = new FreeLLMClient();

// Export class for custom instances
export { FreeLLMClient };

/**
 * Integration with existing AppForge LLM system
 * Can be used as a fallback or primary LLM
 */
export const freeLLMProvider = {
  name: 'clawd-phi2-free',
  
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    return freeLLM.generate(prompt, options);
  },
  
  async chat(messages: ChatMessage[], options?: any): Promise<string> {
    return freeLLM.chatCompletion(messages, options);
  },
  
  async isAvailable(): Promise<boolean> {
    return freeLLM.isAvailable();
  }
};
