
import { broadcastLog } from '../../logger.js';

export class SovereignInference {
    private static OLLAMA_URL = 'http://localhost:11434/api/chat';

    /**
     * execute:
     * Strictly enforces local-only inference.
     * Logic never leaves the machine during a Handshake.
     */
    static async execute(req: { system: string; prompt: string; model?: string; temperature?: number }): Promise<string> {
        // --- PHASE 44: HEARTBEAT CHECK ---
        await this.checkHeartbeat();

        const model = req.model || process.env.LOCAL_MODEL || 'llama3:8b-instruct-q8_0';

        // --- PHASE 44: WEIGHT LOCKING ---
        if (model.includes('q4') || model.includes('q2')) {
            broadcastLog('INFERENCE', 'DEGRADED_LOGIC_WARNING: Low-Quantization model detected.', 'WARN');
        }

        broadcastLog('INFERENCE', `Sovereign Thinking Profile: ${model}`, 'INFO');

        try {
            const response = await fetch(this.OLLAMA_URL, {
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
                        temperature: req.temperature ?? 0.7,
                        num_thread: 8,
                        num_parallel: 4
                    },
                    keep_alive: "24h"
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.message?.content || "";
            }

            throw new Error(`Ollama Error: ${response.statusText}`);
        } catch (error: any) {
            broadcastLog('INFERENCE', `SOVEREIGNTY_ALERT: Local Inference Failed (${error.message}). Cloud fallback is DISABLED.`, 'CRITICAL');

            // Rule: Pause & Retry or throw to trigger Orchestrator God Mode
            broadcastLog('INFERENCE', "Entering Low-Power Wait Mode... Re-attempting in 5s.", 'WARN');
            await new Promise(resolve => setTimeout(resolve, 5000));
            return this.execute(req);
        }
    }

    /**
     * Connection Guardian [PHASE 44]
     */
    static async checkHeartbeat(): Promise<void> {
        try {
            const res = await fetch('http://localhost:11434/api/tags');
            if (!res.ok) throw new Error("Ollama Unresponsive");
        } catch (error) {
            broadcastLog('INFERENCE', 'CONNECTION_FAIL: Ollama Heartbeat Failed. Attempting Guardian Recovery...', 'CRITICAL');
            // In a real system, we'd trigger systemctl restart ollama.
            // Here we pause and retry.
            await new Promise(r => setTimeout(r, 5000));
            return this.checkHeartbeat();
        }
    }
}
