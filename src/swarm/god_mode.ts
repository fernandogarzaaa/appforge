import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateText } from './llm_client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTRUCTIONS_PATH = path.join(__dirname, 'prompts', 'global_instructions.md');

export class GodMode {
    async refineSwarmIntelligence(errorLog: string, task: string) {
        console.log("⚡ GOD MODE ACTIVATED: Local Evolution...");

        const currentInstructions = fs.existsSync(INSTRUCTIONS_PATH)
            ? fs.readFileSync(INSTRUCTIONS_PATH, 'utf-8')
            : "";

        const prompt = `
      CRITICAL FAILURE DETECTED.
      TASK: ${task}
      ERROR: ${errorLog}
      INSTRUCTIONS: ${currentInstructions}
      
      ACTION: Rewrite instructions to prevent this error. Return ONLY the new content.
    `;

        // USE OLLAMA 'llama3' or 'mistral'
        const newInstructions = await generateText({
            model: "llama3",
            system: "You are the Meta-Architect. Optimize constraints.",
            prompt: prompt
        });

        if (newInstructions.length > 50) {
            fs.writeFileSync(INSTRUCTIONS_PATH, newInstructions);
            console.log("🧬 EVOLUTION COMPLETE: Instructions Updated locally.");
        }
    }
}
