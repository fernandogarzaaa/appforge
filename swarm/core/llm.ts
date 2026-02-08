import { OpenAI } from 'openai';

// We'll use the official SDKs or generic fetch for broader support if needed, 
// but sticking to a unified interface via a custom wrapper is safest for this "God Mode" usage.

export interface AIRequest {
    system: string;
    user: string;
    model?: string;
    jsonSchema?: any;
}

export class MultiLLMClient {
    openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async chat(request: AIRequest): Promise<string> {
        // 1. Try OpenAI (Primary)
        try {
            console.log(`🤖 [LLM] Trying OpenAI (${request.model || 'gpt-4o'})...`);
            const completion = await this.openai.chat.completions.create({
                model: request.model || 'gpt-4o',
                messages: [
                    { role: 'system', content: request.system },
                    { role: 'user', content: request.user }
                ]
            });
            return completion.choices[0].message.content || '';
        } catch (error: any) {
            console.warn(`⚠️ [LLM] OpenAI Failed: ${error.message}. Switching to Fallback...`);
            return await this.fallbackAnthropic(request);
        }
    }

    async fallbackAnthropic(request: AIRequest): Promise<string> {
        // 2. Try Anthropic (Claude 3.5 Sonnet)
        try {
            if (!process.env.ANTHROPIC_API_KEY) throw new Error('No Anthropic Key');
            console.log(`🤖 [LLM] Trying Anthropic (Claude 3.5)...`);

            // Using direct fetch for zero-dependency fallback (or minimal dep)
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20240620',
                    max_tokens: 4096,
                    system: request.system,
                    messages: [{ role: 'user', content: request.user }]
                })
            });

            if (!response.ok) throw new Error(`Anthropic Error: ${response.statusText}`);
            const data: any = await response.json();
            return data.content[0].text;

        } catch (error: any) {
            console.warn(`⚠️ [LLM] Anthropic Failed: ${error.message}. Switching to Fallback...`);
            return await this.fallbackGemini(request);
        }
    }

    async fallbackGemini(request: AIRequest): Promise<string> {
        // 3. Try Gemini (1.5 Pro)
        try {
            if (!process.env.GEMINI_API_KEY) throw new Error('No Gemini Key');
            console.log(`🤖 [LLM] Trying Gemini 1.5 Pro...`);

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${request.system}\n\nUser: ${request.user}` }]
                    }]
                })
            });

            if (!response.ok) throw new Error(`Gemini Error: ${response.statusText}`);
            const data: any = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (error: any) {
            console.warn(`⚠️ [LLM] Gemini Failed: ${error.message}. Switching to Final Fallback...`);
            return await this.fallbackGrok(request);
        }
    }

    async fallbackGrok(request: AIRequest): Promise<string> {
        // 4. Try Grok (xAI)
        try {
            if (!process.env.XAI_API_KEY) throw new Error('No Grok Key');
            console.log(`🤖 [LLM] Trying Grok...`);
            // Grok uses OpenAI-compatible API
            const grok = new OpenAI({
                apiKey: process.env.XAI_API_KEY,
                baseURL: 'https://api.x.ai/v1'
            });
            const completion = await grok.chat.completions.create({
                model: 'grok-beta',
                messages: [
                    { role: 'system', content: request.system },
                    { role: 'user', content: request.user }
                ]
            });
            return completion.choices[0].message.content || '';

        } catch (error: any) {
            console.error(`❌ [LLM] All Fallbacks Failed.`);
            throw new Error(`Critical Intelligence Failure: ${error.message}`);
        }
    }

    async getEmbedding(text: string): Promise<number[]> {
        if (!this.openai) return [];
        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
            });
            return response.data[0].embedding;
        } catch (e) {
            console.error('❌ Embedding Error:', e);
            return [];
        }
    }
}
