import { Base44Tool } from '../tools/base44.js';
import { sovereignLLM } from './sovereign_llm.js';
import { sovereignModel } from './sovereign_model.js';
import { geminiAdapter } from './gemini_skill_adapter.js';
import swarmKnowledge from './knowledge.js';
import { secureRandomInt } from './secure_entropy.js';

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
            // Quantum Throttle: Prevent rapid-fire external signals (1s minimum cadence)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // --- SEMANTIC COMPRESSION ---
            // If the prompt is too large, use Gemini 3 (Fidelity Layer) to compress it
            // while preserving critical context.
            let compressedSystem = request.system;
            let compressedUser = request.user;

            if (request.user.length > 3000 || request.system.length > 1000) {
                console.log(`🌀 [LLM] Large prompt detected. Applying Semantic Compression via Gemini 3...`);
                try {
                    const compressionPrompt = `Compress the following AI request for a secondary processing layer. Preserve all technical constraints, key entities, and the core objective.\n\nSYSTEM: ${request.system}\n\nUSER: ${request.user}`;
                    const compressionRes = await geminiAdapter.chat({
                        system: "You are the Sovereign Signal Compressor. Output a highly dense, semantically rich summary of the request.",
                        user: compressionPrompt,
                        usePro: true
                    });

                    if (compressionRes && !compressionRes.text.includes('[Gemini-Sim]')) {
                        compressedUser = `[COMPRESSED SIGNAL]: ${compressionRes.text}`;
                        compressedSystem = "[CONTEXT-LOCKED] Original context has been semantically hashed for signal density.";
                        console.log(`   ✅ Signal compressed by ${(((request.user.length + request.system.length) - (compressedUser.length + compressedSystem.length)) / (request.user.length + request.system.length) * 100).toFixed(1)}%`);
                    }
                } catch (e) {
                    console.warn('   ⚠️ Compression failed, sending raw (truncated) signal.');
                }
            }

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
                        system: compressedSystem.length > 500 ? compressedSystem.slice(0, 500) + '... [Compressed]' : compressedSystem,
                        user: (compressedUser.length > 2000) ? compressedUser.slice(0, 2000) + '... [Semantic Truncation]' : compressedUser,
                        model: request.model || 'gemini-2.0-flash-thinking'
                    }
                }
            });

            console.log(`   ⏳ Waiting for Antigravity response via quantum channel...`);

            // Poll for response with backoff (0.5s -> 5s)
            let pollDelay = 500;
            const maxDelay = 5000;
            const maxAttempts = 60;

            for (let i = 0; i < maxAttempts; i++) {
                // Polling Delay with Secure Jitter
                const jitter = secureRandomInt(0, 499);
                await new Promise(resolve => setTimeout(resolve, pollDelay + jitter));

                const logs = await this.base44.client.entities.AuditLog.list({
                    filter: {
                        action_type: 'ANTIGRAVITY_SIGNAL',
                        entity_id: 'llm_request'
                    },
                    order: { created_at: 'desc' },
                    limit: 10
                });

                // SDK robustness
                const items = Array.isArray(logs) ? logs : (logs.items || logs.data || []);
                const response = items.find((log: any) =>
                    log.changes?.requestId === requestId &&
                    log.changes?.status === 'COMPLETED'
                );

                if (response) {
                    console.log(`   ✅ Received Antigravity response!`);
                    return response.changes.result || 'No response from Antigravity';
                }

                // Exponential backoff
                if (pollDelay < maxDelay) pollDelay = Math.min(maxDelay, pollDelay * 1.5);
            }

            console.warn(`   ⚠️ Timeout waiting for Antigravity`);
            return 'ERROR: Antigravity did not respond in time. Check quantum channel.';

        } catch (error: any) {
            console.error(`   ❌ Quantum channel error: ${error.message}`);
            // If we hit a rate limit, wait longer and potentially retry or fallback
            if (error.message.includes('Rate limit exceeded')) {
                console.warn('   🛰️ Swarm congestion detected. Entering wave-function collapse (5s cool-down)...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
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
        // --- SOVEREIGN DIRECTIVE: Prevent agent oscillation and regression ---
        const stableList = await swarmKnowledge.load().then(() => swarmKnowledge.knowledge.stable_files || []);
        const stableFilesStr = stableList.length > 0 ? `\n- IMMUTABLE COGNITIVE LOCK: The following files are stabilized and LOCKED: ${stableList.join(', ')}. DO NOT attempt to modify them.` : '';

        const SOVEREIGN_DIRECTIVE = `\n\n⚖️ SOVEREIGN DIRECTIVE (Zero Regression):${stableFilesStr}\n1. Polyfills: Use standard ES imports (e.g., import { Buffer } from 'buffer'). NEVER import Buffer from 'crypto'.\n2. Stability: If a file shows signs of frequent oscillation (like src/polyfills.js), stick to proven patterns and avoid experimental refactors.`;

        const optimizedRequest = {
            ...request,
            system: SOVEREIGN_DIRECTIVE + '\n\n' + request.system
        };

        // --- COGNITIVE HIERARCHY ---

        // 1. FIDELITY LAYER: Gemini 3 Pro/Flash (High Reasoning)
        // Uses the new Gemini 3 models for complex synthesis and multimodal tasks.
        try {
            const geminiRes = await geminiAdapter.chat({
                system: optimizedRequest.system,
                user: optimizedRequest.user,
                usePro: optimizedRequest.user.length > 2000 || optimizedRequest.system.includes('STRATEGIC')
            });
            if (geminiRes && !geminiRes.text.includes('[Gemini-Sim]')) {
                return geminiRes.text;
            }
        } catch (e) {
            // Fallback to local if Gemini fails
        }

        // 2. PHYSICAL LAYER: The Sovereign Model (Local AI Brain)
        // Highest priority: 0 API cost, absolute intelligence, 100% autonomy.
        try {
            const modRes = await sovereignModel.chat(optimizedRequest);
            if (modRes) {
                return modRes.choices[0].message.content;
            }
        } catch (e) {
            // Silently fall back if local brain is offline
        }

        // 2. SYNTHETIC LAYER: Sovereign Intelligence Gateway
        // Mid priority: 0 API cost, synthetic inference, bypasses rate limits.
        const sovereignResponse = await sovereignLLM.chat(optimizedRequest);
        if (sovereignResponse) {
            return sovereignResponse.choices[0].message.content;
        }

        // 3. EXTERNAL LAYER: Fallback to Antigravity
        console.log('   → Routing LLM request to Antigravity (zero API costs)');
        return await this.antigravity.chat(optimizedRequest);
    }

    async getEmbedding(text: string): Promise<number[]> {
        // Embeddings not supported via Antigravity yet
        console.warn('⚠️ Embeddings not supported via Antigravity');
        return [];
    }
}

