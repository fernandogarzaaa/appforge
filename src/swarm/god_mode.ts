import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateText } from './inference_client.js';
import { generateNewSecurityTest } from './oracle/test_gen.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTRUCTIONS_PATH = path.join(__dirname, 'prompts', 'global_instructions.md');
const AGENTS_PATH = path.resolve(process.cwd(), 'AGENTS.md');

export class GodMode {
    async refineSwarmIntelligence(errorLog: string, task: string) {
        console.log("⚡ GOD MODE ACTIVATED: Local Evolution...");

        // 0. GENERATE RECURSIVE SECURITY TEST (Phase 15)
        if (errorLog.includes("VIO_")) {
            try {
                await generateNewSecurityTest(errorLog, task);
            } catch (e) {
                console.error("Failed to generate recursive test:", e);
            }
        }

        // 1. Update AGENTS.md (Mutation Memory)
        const timestamp = new Date().toISOString();
        const entry = `\n### [${timestamp}] Quantum Rejection\n**Task:** ${task}\n**Error:** ${errorLog}\n---\n`;

        fs.appendFileSync(AGENTS_PATH, entry);
        console.log(`📝 Mutation recorded in AGENTS.md`);

        // 2. Refine global_instructions.md (Deep Evolution)
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
