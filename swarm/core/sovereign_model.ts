
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

    constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'llama3') {
        this.baseUrl = baseUrl;
        this.defaultModel = defaultModel;
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
     * The core cognitive gateway to the local brain
     */
    async chat(request: { system: string, user: string, model?: string }) {
        const requestId = `sov_mod_${Date.now()}`;
        console.log(`🌌 [SOVEREIGN-MODEL] Consulting Physical Brain: ${requestId}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: request.model || this.defaultModel,
                    messages: [
                        { role: 'system', content: request.system },
                        { role: 'user', content: request.user }
                    ],
                    stream: false
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Local Brain Error: ${error}`);
            }

            const data = await response.json();

            return {
                id: requestId,
                choices: [{
                    message: {
                        role: 'assistant',
                        content: data.message.content
                    }
                }],
                usage: {
                    total_tokens: data.eval_count || 0,
                    sovereign_mode: true,
                    provider: 'local_physical_brain'
                }
            };

        } catch (e: any) {
            console.error(`   ❌ [SOVEREIGN-MODEL] Physical Inference Failed: ${e.message}`);
            return null; // Signals fallback to other providers
        }
    }
}

export const sovereignModel = new SovereignModelProvider();
