import { generateText } from '../llm_client.js';
import { broadcastLog } from '../../server.js';

export class Refiner {
    private MAX_RETRIES = 3;

    /**
     * recursiveRefine:
     * Takes a rejected code block and the violation error.
     * Uses the LLM to rewrite the code to satisfy the constraint.
     * recurses until the code is valid or retries are exhausted.
     * 
     * @param originalCode The code that failed
     * @param violation The error message from Q-Core/Iron Guard
     * @param systemPrompt The system prompt to maintain context
     * @param attempt Current attempt number
     */
    async refine(originalCode: string, violation: string, systemPrompt: string, attempt: number = 1): Promise<string | null> {
        if (attempt > this.MAX_RETRIES) {
            broadcastLog('REFINER', `Max Retries (${this.MAX_RETRIES}) Exceeded. Optimization Failed.`, 'ERROR');
            return null;
        }

        broadcastLog('REFINER', `Attempting Auto-Correction (Try ${attempt}/${this.MAX_RETRIES})...`, 'INFO');

        const refinePrompt = `
        CRITICAL SECURITY VIOLATION DETECTED.
        
        VIOLATION: ${violation}
        
        ORIGINAL CODE:
        ${originalCode.substring(0, 1000)}... [truncated]

        TASK:
        Rewrite the code to fix the violation.
        Ensure you do not break the original functionality.
        Satisfy the Iron Guard constraints (No hardcoded secrets, no dangerous imports, verified inputs).
        
        Output ONLY the fixed code. No markdown.
        `;

        try {
            let fixedCode = await generateText({ system: systemPrompt, prompt: refinePrompt });
            // Clean markdown if present
            fixedCode = fixedCode.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();

            return fixedCode;
        } catch (error: any) {
            broadcastLog('REFINER', `Refinement Generation Failed: ${error.message}`, 'WARN');
            return null;
        }
    }
}
