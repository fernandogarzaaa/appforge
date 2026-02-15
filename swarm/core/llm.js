/**
 * ANTIGRAVITY LLM PROVIDER
 * Routes swarm agent LLM requests to Antigravity instead of OpenAI/Anthropic
 */

import { Base44Tool } from '../tools/base44.js';

export class AntigravityLLMProvider {
    base44;
    requestTimeout = 60000; // 60 seconds

    constructor(base44) {
        this.base44 = base44;
    }

    /**
     * Chat completion using Antigravity as backend
     * Instead of calling OpenAI, we dispatch to Antigravity and wait for response
     */
    async chat(params) {
        const requestId = `llm_${Date.now()}`;

        // Dispatch to Antigravity
        await this.base44.client.entities.AuditLog.create({
            action_type: 'ANTIGRAVITY_SIGNAL',
            description: `LLM Request: ${requestId}`,
            resource_type: 'llm_request',
            performed_by: 'swarm',
            changes: {
                status: 'PENDING',
                requestId: requestId,
                prompt: {
                    system: params.system,
                    user: params.user,
                    model: params.model || 'gemini-2.0-flash-thinking'
                }
            }
        });

        // Poll for response from Antigravity
        const startTime = Date.now();
        while (Date.now() - startTime < this.requestTimeout) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds

            const logs = await this.base44.client.entities.AuditLog.list({
                filter: { action_type: 'ANTIGRAVITY_SIGNAL' },
                sort: { createdAt: 'desc' },
                limit: 10
            });

            const items = logs?.items || logs?.data || logs || [];
            const response = items.find((l) =>
                l?.changes?.requestId === requestId &&
                l?.changes?.status === 'COMPLETED'
            );

            if (response) {
                return response.changes.result;
            }
        }

        throw new Error('Antigravity LLM request timeout');
    }
}

export class MultiLLMClient {
    antigravity;

    constructor(base44) {
        this.antigravity = new AntigravityLLMProvider(base44);
    }

    /**
     * Route all LLM requests to Antigravity
     */
    async chat(params) {
        console.log('   → Routing LLM request to Antigravity...');
        return await this.antigravity.chat(params);
    }
}
