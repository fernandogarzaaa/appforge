import { Base44Tool } from '../tools/base44.js';

/**
 * ANTIGRAVITY LLM PROVIDER
 * Routes all LLM requests through Antigravity via quantum channel
 * Zero external API costs!
 */

export interface AIRequest {
    system: string;
    user: string;
    model?: string;
}

export class AntigravityLLMProvider {
    base44: Base44Tool;

    constructor(base44: Base44Tool) {
        this.base44 = base44;
    }

    async chat(request: AIRequest): Promise<string> {
        const requestId = `llm_${Date.now()}`;

        console.log(`🌀 [LLM] Routing to Antigravity via Quantum Channel...`);
        console.log(`   Request ID: ${requestId}`);

        try {
            // Dispatch to Antigravity via Base44 signal
            await this.base44.client.entities.AuditLog.create({
                action_type: 'ANTIGRAVITY_SIGNAL',
                description: `LLM Request: ${requestId}`,
                resource_type: 'llm_service',
                performed_by: 'swarm_agent',
                entity_id: 'llm_request',
                changes: {
                    status: 'PENDING',
                    requestId: requestId,
                    prompt: {
                        system: request.system,
                        user: request.user,
                        model: request.model || 'gemini-2.0-flash-thinking'
                    }
                }
            });

            console.log(`   ⏳ Waiting for Antigravity response via quantum channel...`);

            // Poll for response (max 60 seconds)
            const maxAttempts = 60;
            for (let i = 0; i < maxAttempts; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));

                const logs = await this.base44.client.entities.AuditLog.list({
                    filter: {
                        action_type: 'ANTIGRAVITY_SIGNAL',
                        entity_id: 'llm_request'
                    },
                    order: { created_at: 'desc' },
                    limit: 100
                });

                const response = logs.find((log: any) =>
                    log.changes?.requestId === requestId &&
                    log.changes?.status === 'COMPLETED'
                );

                if (response) {
                    console.log(`   ✅ Received Antigravity response!`);
                    return response.changes.result || 'No response from Antigravity';
                }
            }

            console.warn(`   ⚠️ Timeout waiting for Antigravity`);
            return 'ERROR: Antigravity did not respond in time. Check quantum channel.';

        } catch (error: any) {
            console.error(`   ❌ Quantum channel error: ${error.message}`);
            throw new Error(`Antigravity LLM Provider Failed: ${error.message}`);
        }
    }
}

export class MultiLLMClient {
    antigravity: AntigravityLLMProvider;

    constructor(base44: Base44Tool) {
        this.antigravity = new AntigravityLLMProvider(base44);
    }

    async chat(request: AIRequest): Promise<string> {
        console.log('   → Routing LLM request to Antigravity (zero API costs)');
        return await this.antigravity.chat(request);
    }

    async getEmbedding(text: string): Promise<number[]> {
        // Embeddings not supported via Antigravity yet
        console.warn('⚠️ Embeddings not supported via Antigravity');
        return [];
    }
}

