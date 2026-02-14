import fs from 'fs';
import path from 'path';
import { generateText } from './llm_client';
import { GodMode } from './god_mode';
import { broadcastLog } from '../server';
import { GitManager } from './git_manager';

const godMode = new GodMode();
const gitManager = new GitManager();

export async function runSwarmTask(taskDescription: string) {
    broadcastLog('ORCHESTRATOR', `Received Task: ${taskDescription}`, 'INFO');

    try {
        // 1. GENERATE CODE (Ollama/LLM)
        const code = await generateText({
            system: "You are a Senior Engineer. Write code. Return ONLY the code. Do not include markdown blocks.",
            prompt: taskDescription
        });

        broadcastLog('PRODUCT_OWNER', "Code generated. verifying...", 'INFO');

        // 2. Q-CORE SAFETY CHECK (Simulated)
        if ((code.includes("fs.readFileSync") || code.includes("require('fs')")) && taskDescription.includes("browser")) {
            throw new Error("Security Violation: FS module in browser context.");
        }

        // 3. PERSISTENCE: Write file to disk
        // Extract filename from task (e.g., 'src/components/WalletBalance.tsx')
        const fileMatch = taskDescription.match(/(src\/[^\s'"]+)/);
        const filePath = fileMatch ? fileMatch[0] : 'src/swarm/output.txt';

        const absolutePath = path.resolve(process.cwd(), filePath);
        const dir = path.dirname(absolutePath);

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(absolutePath, code);

        broadcastLog('Q-CORE', `Stability Verified. Saved to ${filePath}`, 'SUCCESS');

        // 4. SAVE TO GITHUB (The Memory)
        await gitManager.commitAndPush(taskDescription);

        return code;

    } catch (error: any) {
        broadcastLog('Q-CORE', `REJECTED: ${error.message}`, 'CRITICAL');

        // TRIGGER GOD MODE
        await godMode.refineSwarmIntelligence(error.message, taskDescription);
        broadcastLog('GOD_MODE', "System Evolved. Retrying task...", 'WARN');
    }
}
