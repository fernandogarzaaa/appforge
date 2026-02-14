import dotenv from 'dotenv';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

interface LLMRequest {
    model?: string; // e.g., 'llama3', 'gpt-4o', 'claude-3-5-sonnet-20240620'
    system: string;
    prompt: string;
    temperature?: number;
}

class LLMClient {
    private ollamaUrl = 'http://localhost:11434/api/chat';
    private openai: OpenAI | null = null;
    private anthropic: Anthropic | null = null;

    async generateText(req: LLMRequest): Promise<string> {
        const model = req.model || process.env.LOCAL_MODEL || 'llama3';

        // 1. Determine Provider
        const isOllama = model.includes('llama') || model.includes('mistral') || model.includes('deepseek') || (process.env.USE_LOCAL_AI === 'true' && !req.model);
        const isAnthropic = model.includes('claude');
        const isOpenAI = !isOllama && !isAnthropic;

        // 2. Local-First / Hybrid Logic
        if (isOllama) {
            console.log(`🧠 THINKING [${model} :: OLLAMA]...`);
            try {
                const response = await fetch(this.ollamaUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: req.system },
                            { role: 'user', content: req.prompt }
                        ],
                        stream: false,
                        options: {
                            temperature: req.temperature ?? 0.7
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.message?.content || "";
                }
                console.warn("⚠️ Ollama responded with error, falling back to cloud if available.");
            } catch (error) {
                console.warn("⚠️ Ollama connection failed, falling back to cloud.");
            }
        }

        // 3. Fallback to Cloud APIs (Required for GitHub Actions / Production)
        if (isAnthropic) {
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

            if (!this.anthropic) this.anthropic = new Anthropic({ apiKey });
            console.log(`🧠 THINKING [${model} :: ANTHROPIC]...`);

            const msg = await this.anthropic.messages.create({
                model: model.includes('claude') ? model : 'claude-3-5-sonnet-20240620',
                max_tokens: 4096,
                system: req.system,
                messages: [{ role: 'user', content: req.prompt }],
                temperature: req.temperature ?? 0.7,
            });

            return (msg.content[0] as any).text;
        } else {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error("OPENAI_API_KEY missing");

            if (!this.openai) this.openai = new OpenAI({ apiKey });
            const openaiModel = isOpenAI ? model : 'gpt-4o';
            console.log(`🧠 THINKING [${openaiModel} :: OPENAI]...`);

            const completion = await this.openai.chat.completions.create({
                model: openaiModel,
                messages: [
                    { role: 'system', content: req.system },
                    { role: 'user', content: req.prompt }
                ],
                temperature: req.temperature ?? 0.7,
            });

            return completion.choices[0].message?.content || "";
        }
    }
}

export const generateText = (req: LLMRequest) => new LLMClient().generateText(req);
