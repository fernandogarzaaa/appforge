import { generateText } from './llm_client';
import { GodMode } from './god_mode';
import { broadcastLog } from '../server'; // We will link this to UI next
import { GitManager } from './git_manager';

const godMode = new GodMode();
const gitManager = new GitManager();

export async function runSwarmTask(taskDescription: string) {
    broadcastLog('ORCHESTRATOR', `Received Task: ${taskDescription}`, 'INFO');

    try {
        // 1. EXECUTE
        const code = await generateText({
            system: "You are a Senior Engineer. Write code.",
            prompt: taskDescription
        });

        broadcastLog('PRODUCT_OWNER', "Code generated. verifying...", 'INFO');

        // 2. SIMULATED SAFETY CHECK (Placeholder for Q-Core Rust Engine)
        if (code.includes("fs.readFileSync") && taskDescription.includes("browser")) {
            throw new Error("Security Violation: FS module in browser context.");
        }

        broadcastLog('Q-CORE', "Stability Verified. Deploying.", 'SUCCESS');

        // --- NEW: SAVE TO GITHUB ---
        // Only push if safety check passed!
        await gitManager.commitAndPush(taskDescription);

        return code;

    } catch (error: any) {
        broadcastLog('Q-CORE', `REJECTED: ${error.message}`, 'CRITICAL');

        // 3. TRIGGER GOD MODE
        await godMode.refineSwarmIntelligence(error.message, taskDescription);
        broadcastLog('GOD_MODE', "System Evolved. Retrying task...", 'WARN');

        // Recursive retry would go here
    }
}
