/**
 * CHIMERA Quantum LLM Client
 * Integrates with local CHIMERA server (port 7861) or fallback APIs
 */
const CHIMERA_URL = import.meta.env.VITE_CHIMERA_URL || 'http://localhost:7861/v1';
const CHIMERA_API_KEY = import.meta.env.VITE_CHIMERA_API_KEY || 'chimera-local';
export class ChimeraClient {
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl || CHIMERA_URL;
        this.apiKey = apiKey || CHIMERA_API_KEY;
    }
    /**
     * Send a chat completion request to CHIMERA
     */
    async chat(messages, options) {
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
    async sendMessage(content, systemPrompt) {
        const messages = [];
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
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl.replace('/v1', '')}/health`, {
                method: 'GET',
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    /**
     * Get available models
     */
    async listModels() {
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
