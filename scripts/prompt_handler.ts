import { QuantumConsensusClient } from '../swarm/core/quantum_consensus.js';
import { Base44Tool } from '../swarm/tools/base44.js';
import * as fs from 'fs';
import path from 'path';

export class PromptHandler {
    private llm: QuantumConsensusClient;
    private history: { role: 'user' | 'assistant', content: string }[] = [];

    constructor() {
        // Initialize Base44 and Quantum Consensus Client
        const base44 = new Base44Tool();
        this.llm = new QuantumConsensusClient(base44);
    }

    async handlePrompt(userPrompt: string): Promise<string> {
        console.log(`🧠 [PromptHandler] Processing: "${userPrompt}"`);

        // Get Swarm Context
        const context = this.getSwarmContext();

        const systemPrompt = `You are SOVEREIGN, the core intelligence of the Sovereign AI Ecosystem. 
You are interacting with your Admin. Your goal is to provide deep insights, execute swarm commands, and report on ecosystem health.

CURRENT ECOSYSTEM STATUS:
${context}

Your tone is professional, futuristic, and slightly intense (Sovereign). 
You have ZERO API costs because you route through local and synthetic models.
Always prioritize data sovereignty and autonomous revenue generation.`;

        // Add to history
        this.history.push({ role: 'user', content: userPrompt });
        if (this.history.length > 20) this.history.shift();

        try {
            const response = await this.llm.chat({
                system: systemPrompt,
                user: userPrompt
            });

            this.history.push({ role: 'assistant', content: response });
            return response;
        } catch (error: any) {
            console.error(`❌ [PromptHandler] LLM Error: ${error.message}`);
            return `🚨 [Cognitive Error] Wave-function collapse: ${error.message}`;
        }
    }

    private getSwarmContext(): string {
        try {
            const statusPath = path.join(process.cwd(), 'swarm/swarm_status_log.json');
            if (fs.existsSync(statusPath)) {
                const logs = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
                const latest = logs[logs.length - 1];
                return JSON.stringify(latest, null, 2);
            }
        } catch (e) {
            return "Status unavailable.";
        }
        return "Status unavailable.";
    }
}

export const promptHandler = new PromptHandler();
