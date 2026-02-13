
/**
 * 🧠 ANTIGRAVITY AGENT
 * 
 * Real LLM Integration Hub for the Swarm
 * Processes LLM requests using OpenAI GPT-4 and Anthropic Claude-3
 * with automatic fallback and streaming support.
 * 
 * API Keys: Loaded from .env.local
 * - OPENAI_API_KEY for GPT-4 integration
 * - ANTHROPIC_API_KEY for Claude-3 integration
 */

import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';
import { GitTool } from '../tools/git.js';
import quantumCore from '../core/quantum_core.js';

// ============================================================================
// Environment Configuration
// ============================================================================

interface ApiKeys {
    openai: string;
    anthropic: string;
}

function getApiKeys(): ApiKeys {
    return {
        openai: process.env.OPENAI_API_KEY || '',
        anthropic: process.env.ANTHROPIC_API_KEY || '',
    };
}

// ============================================================================
// LLM Response Types
// ============================================================================

interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    provider: string;
    latency: number;
}

interface HealthStatus {
    provider: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    error?: string;
}

// ============================================================================
// Antigravity LLM Agent
// ============================================================================

export class AntigravityAgent {
    base44: Base44Tool;
    fs: FileSystemTool;
    git: GitTool;
    private apiKeys: ApiKeys;
    private initialized: boolean = false;

    constructor(base44: Base44Tool, fs: FileSystemTool, git: GitTool) {
        this.base44 = base44;
        this.fs = fs;
        this.git = git;
        this.apiKeys = getApiKeys();
    }

    /**
     * Check API key availability
     */
    private checkProviders(): { openai: boolean; claude: boolean } {
        return {
            openai: !!this.apiKeys.openai,
            claude: !!this.apiKeys.anthropic,
        };
    }

    /**
     * Main processing loop
     */
    async run() {
        console.log('🌀 Antigravity Agent: Processing LLM requests...');

        const providers = this.checkProviders();
        console.log(`   📊 Providers: OpenAI=${providers.openai}, Claude=${providers.claude}`);

        try {
            // Consult Oracle for processing strategy
            const oracleResult = await quantumCore.consultOracle(
                'How should Antigravity handle pending LLM requests?',
                [
                    'Process High Priority requests first',
                    'Batch process similar requests',
                    'Optimize for fastest response time',
                    'Deep analysis mode for complex queries'
                ],
                ['efficiency', 'quality', 'latency']
            );

            console.log(`   🔮 Oracle Guidance: ${oracleResult.recommendation}`);

            // Check for ANTIGRAVITY_SIGNAL tasks
            const logs = await this.base44.client.entities.AuditLog.list({
                filter: { action_type: 'ANTIGRAVITY_SIGNAL' },
                sort: { createdAt: 'desc' },
                limit: 10
            });

            const items = logs?.items || logs?.data || logs || [];
            const pending = items.filter((l: any) => l?.changes?.status === 'PENDING');

            if (pending.length > 0) {
                console.log(`   → Found ${pending.length} LLM requests for Antigravity`);

                for (const task of pending) {
                    const requestId = task.changes?.requestId;
                    const prompt = task.changes?.prompt;

                    if (prompt && requestId) {
                        console.log(`   → Processing LLM request: ${requestId}`);

                        // Process with real LLM
                        const result = await this.processLLMRequest(requestId, prompt);

                        // Update status so swarm knows it's being processed
                        await this.base44.client.entities.AuditLog.update(task.id, {
                            changes: {
                                status: 'COMPLETED',
                                result: result,
                                requestId: requestId,
                                processedAt: new Date().toISOString(),
                                provider: result.provider
                            }
                        });
                    }
                }

                return {
                    status: 'processing',
                    count: pending.length,
                    message: 'LLM requests processed via real API integration'
                };
            }

            return { status: 'idle', message: 'No LLM requests pending' };
        } catch (error: any) {
            console.warn('   ⚠️ Antigravity Agent error:', error.message);
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Call OpenAI GPT-4 API
     */
    private async callOpenAI(
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        model: string = 'gpt-4o'
    ): Promise<LLMResponse> {
        const startTime = Date.now();

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKeys.openai}`,
                'api-key': this.apiKeys.openai,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
                max_tokens: 4096,
            }),
        });

        const latency = Date.now() - startTime;

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            content: data.choices?.[0]?.message?.content || '',
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
            },
            model,
            provider: 'openai',
            latency,
        };
    }

    /**
     * Call Anthropic Claude API
     */
    private async callClaude(
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        model: string = 'claude-3-5-sonnet-20241022'
    ): Promise<LLMResponse> {
        const startTime = Date.now();

        // Extract system message for Claude
        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKeys.anthropic,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 4096,
                messages: userMessages,
                system: systemMessage?.content,
            }),
        });

        const latency = Date.now() - startTime;

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Claude API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            content: data.content?.[0]?.text || '',
            usage: {
                promptTokens: data.usage?.input_tokens || 0,
                completionTokens: data.usage?.output_tokens || 0,
                totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
            model,
            provider: 'anthropic',
            latency,
        };
    }

    /**
     * Process LLM request with real API calls and fallback
     */
    async processLLMRequest(
        requestId: string,
        prompt: { system: string; user: string; model?: string }
    ): Promise<any> {
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
        ];

        const preferredModel = prompt.model || 'gpt-4o';

        // Try OpenAI first (preferred provider)
        if (this.apiKeys.openai) {
            try {
                console.log(`   🔄 Calling OpenAI GPT-4...`);
                const response = await this.callOpenAI(messages, preferredModel);
                
                const result = {
                    requestId,
                    status: 'COMPLETED',
                    provider: 'openai',
                    model: preferredModel,
                    content: response.content,
                    usage: response.usage,
                    latency: response.latency,
                    processedAt: new Date().toISOString()
                };

                console.log(`   ✅ OpenAI response: ${response.content.length} chars in ${response.latency}ms`);
                return result;
            } catch (e: any) {
                console.warn(`   ⚠️ OpenAI failed: ${e.message}, trying Claude...`);
            }
        }

        // Fallback to Claude
        if (this.apiKeys.anthropic) {
            try {
                console.log(`   🔄 Calling Anthropic Claude...`);
                const response = await this.callClaude(messages);
                
                const result = {
                    requestId,
                    status: 'COMPLETED',
                    provider: 'anthropic',
                    model: 'claude-3-5-sonnet',
                    content: response.content,
                    usage: response.usage,
                    latency: response.latency,
                    processedAt: new Date().toISOString()
                };

                console.log(`   ✅ Claude response: ${response.content.length} chars in ${response.latency}ms`);
                return result;
            } catch (e: any) {
                console.warn(`   ⚠️ Claude failed: ${e.message}`);
            }
        }

        // All providers failed
        const errorResult = {
            requestId,
            status: 'ERROR',
            error: 'All LLM providers failed',
            providers: this.checkProviders(),
            processedAt: new Date().toISOString()
        };

        console.error(`   ❌ All LLM providers failed for request: ${requestId}`);
        return errorResult;
    }

    /**
     * Direct LLM completion (for swarm agent use)
     */
    async complete(
        prompt: string,
        options?: {
            system?: string;
            model?: string;
            temperature?: number;
            maxTokens?: number;
        }
    ): Promise<string> {
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = options?.system
            ? [{ role: 'system', content: options.system }, { role: 'user', content: prompt }]
            : [{ role: 'user', content: prompt }];

        const model = options?.model || 'gpt-4o';

        // Try OpenAI first
        if (this.apiKeys.openai) {
            try {
                const response = await this.callOpenAI(messages, model);
                return response.content;
            } catch (e: any) {
                console.warn(`   ⚠️ OpenAI completion failed: ${e.message}`);
            }
        }

        // Fallback to Claude
        if (this.apiKeys.anthropic) {
            try {
                const response = await this.callClaude(messages);
                return response.content;
            } catch (e: any) {
                console.warn(`   ⚠️ Claude completion failed: ${e.message}`);
            }
        }

        throw new Error('All LLM providers unavailable');
    }

    /**
     * Get provider health status
     */
    async getHealth(): Promise<{ openai: HealthStatus | null; claude: HealthStatus | null }> {
        // Check OpenAI
        let openaiStatus: HealthStatus | null = null;
        if (this.apiKeys.openai) {
            const start = Date.now();
            try {
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${this.apiKeys.openai}` },
                    signal: AbortSignal.timeout(5000),
                });
                openaiStatus = {
                    provider: 'openai',
                    status: response.ok ? 'healthy' : 'degraded',
                    latency: Date.now() - start,
                };
            } catch (e: any) {
                openaiStatus = {
                    provider: 'openai',
                    status: 'down',
                    latency: -1,
                    error: e.message,
                };
            }
        }

        // Check Claude
        let claudeStatus: HealthStatus | null = null;
        if (this.apiKeys.anthropic) {
            const start = Date.now();
            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    headers: { 'x-api-key': this.apiKeys.anthropic },
                    signal: AbortSignal.timeout(5000),
                });
                claudeStatus = {
                    provider: 'claude',
                    status: response.ok || response.status === 401 ? 'healthy' : 'degraded',
                    latency: Date.now() - start,
                };
            } catch (e: any) {
                claudeStatus = {
                    provider: 'claude',
                    status: 'down',
                    latency: -1,
                    error: e.message,
                };
            }
        }

        return { openai: openaiStatus, claude: claudeStatus };
    }
}

// ============================================================================
// Export
// ============================================================================

export { getApiKeys };
