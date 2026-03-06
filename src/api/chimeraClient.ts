/**
 * CHIMERA Quantum LLM Client
 * Integrates with local CHIMERA server (port 7861) or fallback APIs
 */

const CHIMERA_URL = import.meta.env.VITE_CHIMERA_URL || 'http://localhost:7861/v1';
const CHIMERA_API_KEY = import.meta.env.VITE_CHIMERA_API_KEY || 'chimera-local';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ChimeraClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || CHIMERA_URL;
    this.apiKey = apiKey || CHIMERA_API_KEY;
  }

  /**
   * Send a chat completion request to CHIMERA
   */
  async chat(messages: ChatMessage[], options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'chimera-local',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`CHIMERA error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Simple chat with a single message
   */
  async sendMessage(content: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content });

    const response = await this.chat(messages);
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Check if CHIMERA is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/v1', '')}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models
   */
  async listModels(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
    return response.json();
  }
}

// Singleton instance
export const chimera = new ChimeraClient();

export default chimera;
