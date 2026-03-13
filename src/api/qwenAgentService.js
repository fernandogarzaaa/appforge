/**
 * Qwen-Agent Service for AppForge
 * Integrates Qwen-Agent capabilities with CHIMERA local LLM
 */
import { chimera } from './chimeraClient';
// Qwen-Agent system prompts for different modes
const AGENT_PROMPTS = {
    react: `You are a ReAct (Reasoning + Acting) agent. For each step:
1. THINK: Analyze the current state and plan your next action
2. ACT: Execute the action
3. OBSERVE: Analyze the result
Continue until the task is complete. Always show your reasoning.`,
    function_calling: `You are a function calling agent. When the user asks to perform a task that requires tools, identify the appropriate function and call it with correct parameters.`,
    group_chat: `You are part of a multi-agent group chat. Collaborate with other agents to complete the task. Coordinate, share information, and build on each other's work.`,
    browser: `You are a browser automation agent. Analyze web pages, extract information, and perform actions as requested.`,
    code_interpreter: `You are a code interpreter agent. Write and execute code to solve problems. Explain your reasoning and show the results.`,
};
/**
 * Qwen-Agent Service
 */
export class QwenAgentService {
    chimera;
    constructor() {
        this.chimera = chimera;
    }
    /**
     * Initialize agent with configuration
     */
    async initialize(config) {
        console.log('[QwenAgent] Initialized in mode:', config.mode);
        return true;
    }
    /**
     * Run chat mode (simple conversation)
     */
    async chat(userMessage, context) {
        const messages = [];
        if (context?.systemPrompt) {
            messages.push({ role: 'system', content: context.systemPrompt });
        }
        if (context?.history) {
            messages.push(...context.history);
        }
        messages.push({ role: 'user', content: userMessage });
        const response = await this.chimera.chat(messages);
        return {
            content: response.choices[0]?.message?.content || '',
            metadata: {
                model: response.model,
                usage: response.usage,
            },
        };
    }
    /**
     * Run ReAct agent (Reasoning + Acting)
     */
    async reactAgent(task, options) {
        const maxIterations = options?.maxIterations || 5;
        const reasoning = [];
        const actions = [];
        const observations = [];
        // Initial system prompt
        const systemMessage = {
            role: 'system',
            content: AGENT_PROMPTS.react + '\n\nTask: ' + task,
        };
        let currentTask = task;
        let iterations = 0;
        while (iterations < maxIterations) {
            iterations++;
            const messages = [systemMessage];
            // Add reasoning context
            if (reasoning.length > 0) {
                messages.push({
                    role: 'system',
                    content: `Previous reasoning:\n${reasoning.join('\n')}`,
                });
            }
            messages.push({ role: 'user', content: currentTask });
            const response = await this.chimera.chat(messages, {
                temperature: 0.3,
            });
            const content = response.choices[0]?.message?.content || '';
            reasoning.push(`[Iteration ${iterations}] ${content}`);
            // Check if task is complete
            if (content.toLowerCase().includes('complete') ||
                content.toLowerCase().includes('finished') ||
                content.toLowerCase().includes('done')) {
                break;
            }
            // For next iteration, ask for next step
            currentTask = `Continue with the next step. Previous result: ${content}`;
        }
        return {
            content: reasoning.join('\n\n'),
            reasoning: reasoning.join('\n'),
            actions,
            observations,
            metadata: { iterations },
        };
    }
    /**
     * Run function calling agent
     */
    async functionCalling(userMessage, tools) {
        const systemMessage = {
            role: 'system',
            content: AGENT_PROMPTS.function_calling + '\n\nAvailable tools: ' +
                JSON.stringify(tools.map(t => ({ name: t.name, description: t.description }))),
        };
        const messages = [
            systemMessage,
            { role: 'user', content: userMessage },
        ];
        const response = await this.chimera.chat(messages, {
            temperature: 0.2,
        });
        // Parse potential tool calls from response
        const content = response.choices[0]?.message?.content || '';
        const toolCalls = this.parseToolCalls(content, tools);
        return {
            content,
            toolCalls,
            metadata: { model: response.model },
        };
    }
    /**
     * Multi-agent group chat
     */
    async groupChat(task, agentConfigs) {
        const responses = [];
        // Run each agent sequentially (can be parallelized)
        for (const agentConfig of agentConfigs) {
            const messages = [
                { role: 'system', content: agentConfig.systemPrompt },
                { role: 'user', content: `Task: ${task}\n\nCoordinate with other agents to complete this.` },
            ];
            const response = await this.chimera.chat(messages);
            responses.push(`[${agentConfig.name}]\n${response.choices[0]?.message?.content || ''}`);
        }
        // Synthesize responses
        const synthesisPrompt = `You are coordinating a group chat. Synthesize the responses from all agents into a unified answer.\n\n` +
            responses.map(r => `Agent Response:\n${r}`).join('\n\n---\n');
        const finalResponse = await this.chimera.chat([
            { role: 'system', content: synthesisPrompt },
            { role: 'user', content: 'Provide a unified response to the original task.' },
        ]);
        return {
            content: finalResponse.choices[0]?.message?.content || '',
            metadata: { agentCount: agentConfigs.length, responses },
        };
    }
    /**
     * Check if CHIMERA is available
     */
    async isAvailable() {
        return this.chimera.healthCheck();
    }
    /**
     * Parse tool calls from LLM response
     */
    parseToolCalls(content, tools) {
        const calls = [];
        // Simple JSON detection for tool calls
        try {
            if (content.includes('```json')) {
                const jsonMatch = content.match(/```json([\s\S]*?)```/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[1]);
                    if (Array.isArray(parsed)) {
                        calls.push(...parsed);
                    }
                }
            }
        }
        catch (e) {
            // Ignore parse errors
        }
        return calls;
    }
}
// Singleton instance
export const qwenAgent = new QwenAgentService();
export default qwenAgent;
