
import * as fs from 'fs/promises';
import path from 'path';

/**
 * SOVEREIGN MODEL PROVIDER
 * The physical brain of the swarm, running on local hardware.
 * Communicates with local inference servers (Ollama/LocalAI) to resolve high-intelligence tasks.
 */
export class SovereignModelProvider {
    private baseUrl: string;
    private defaultModel: string;
    private modelPriority: string[];

    constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'phi3:mini') {
        this.baseUrl = baseUrl;
        this.defaultModel = defaultModel;
        // Try models in order of preference (fastest first)
        this.modelPriority = ['phi3:mini', 'llama3:latest', 'deepseek-coder:6.7b'];
    }

    /**
     * Check if the local inference server is online
     */
    async ping(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get available models from Ollama
     */
    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            const data = await response.json();
            return data.models?.map((m: any) => m.name) || [];
        } catch {
            return [];
        }
    }

    /**
     * Try to pull a model if not available
     */
    async ensureModel(model: string): Promise<boolean> {
        try {
            const available = await this.getAvailableModels();
            if (available.includes(model)) {
                console.log(`   ✅ Model ${model} is available`);
                return true;
            }
            
            console.log(`   📥 Pulling model ${model}...`);
            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, stream: false })
            });
            const data = await response.json();
            return data.status === 'success';
        } catch (e) {
            console.error(`   ❌ Failed to pull model ${model}:`, e);
            return false;
        }
    }

    /**
     * The core cognitive gateway to the local brain
     */
    async chat(request: { system: string, user: string, model?: string }) {
        const requestId = `sov_mod_${Date.now()}`;
        console.log(`🌌 [SOVEREIGN-MODEL] Consulting Physical Brain: ${requestId}`);

        const modelsToTry = request.model 
            ? [request.model, ...this.modelPriority.filter(m => m !== request.model)]
            : this.modelPriority;

        for (const model of modelsToTry) {
            try {
                console.log(`   🤖 Trying model: ${model}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min timeout
                
                const response = await fetch(`${this.baseUrl}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: request.system },
                            { role: 'user', content: request.user }
                        ],
                        stream: false,
                        options: {
                            temperature: 0.7,
                            num_predict: 1024
                        }
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const error = await response.text();
                    console.log(`   ⚠️ Model ${model} failed: ${error}`);
                    continue; // Try next model
                }

                const data = await response.json();
                
                console.log(`   ✅ Success with model: ${model}`);
                return {
                    id: requestId,
                    model: model,
                    choices: [{
                        message: {
                            role: 'assistant',
                            content: data.message?.content || data.response || 'No response'
                        }
                    }],
                    usage: {
                        total_tokens: data.eval_count || 0,
                        sovereign_mode: true,
                        provider: 'local_physical_brain'
                    }
                };

            } catch (e: any) {
                console.log(`   ⚠️ Model ${model} error: ${e.message}`);
                continue; // Try next model
            }
        }

        console.error(`   ❌ [SOVEREIGN-MODEL] All models failed`);
        return null;
    }

    /**
     * Quick chat with default model (no fallback)
     */
    async quickChat(userMessage: string, systemPrompt: string = 'You are a helpful AI assistant.'): Promise<string | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.defaultModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    stream: false
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) return null;
            
            const data = await response.json();
            return data.message?.content || data.response || null;
        } catch (e) {
            return null;
        }
    }
}

export const sovereignModel = new SovereignModelProvider();
