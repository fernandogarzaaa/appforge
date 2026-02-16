
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
    private ironBrainMode: boolean;
    private kvCacheWarmed: boolean = false;
    private systemPromptCache: string = '';
    private performanceLog: { tokensPerSecond: number; timestamp: number }[] = [];

    constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'phi3:mini') {
        this.baseUrl = baseUrl;
        this.defaultModel = defaultModel;
        // Iron Brain mode: detect if llama-server is running (vs Ollama)
        this.ironBrainMode = false;
        // Try models in order of preference (fastest first)
        this.modelPriority = ['appforge-v1', 'phi3:mini', 'llama3:latest', 'deepseek-coder:6.7b'];
    }

    /**
     * Detect if Iron Brain (llama-server) or Ollama is running
     */
    async detectBackend(): Promise<'iron-brain' | 'ollama' | 'offline'> {
        try {
            // llama-server uses /health endpoint
            const healthRes = await fetch(`${this.baseUrl}/health`);
            if (healthRes.ok) {
                const data = await healthRes.json();
                if (data.status === 'ok') {
                    this.ironBrainMode = true;
                    console.log('🧠 [IRON BRAIN] Local inference engine detected');
                    return 'iron-brain';
                }
            }
        } catch { }
        try {
            // Ollama uses /api/tags
            const ollamaRes = await fetch(`${this.baseUrl}/api/tags`);
            if (ollamaRes.ok) {
                this.ironBrainMode = false;
                return 'ollama';
            }
        } catch { }
        return 'offline';
    }

    /**
     * Warm the KV cache with a persistent system prompt (Iron Brain only)
     */
    async warmKVCache(systemPrompt: string): Promise<void> {
        if (!this.ironBrainMode || this.kvCacheWarmed) return;
        try {
            await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'system', content: systemPrompt }],
                    max_tokens: 1,
                    temperature: 0,
                    cache_prompt: true
                })
            });
            this.systemPromptCache = systemPrompt;
            this.kvCacheWarmed = true;
            console.log('   ⚡ KV cache warmed for Iron Brain');
        } catch (e) {
            // Non-critical, continue without cache
        }
    }

    /**
     * Get performance metrics
     */
    getPerformanceStats() {
        if (this.performanceLog.length === 0) return null;
        const recent = this.performanceLog.slice(-10);
        const avgTps = recent.reduce((sum, e) => sum + e.tokensPerSecond, 0) / recent.length;
        return {
            avgTokensPerSecond: Math.round(avgTps * 10) / 10,
            totalInferences: this.performanceLog.length,
            mode: this.ironBrainMode ? 'iron-brain' : 'ollama'
        };
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
