import quantumCore from './core/quantum_core.js';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('🔮 [Oracle] Consulting on Strategic Architectural Pivot: Direct WhatsApp Integration...');

    const prompt = `
    Strategic Architecture Question: Direct WhatsApp Integration vs. External Gateway (OpenClaw).

    Current Situation:
    - We are currently using OpenClaw as an external gateway (clawdbot) via CLI and log polling.
    - We have encountered persistent connectivity issues (port hangs, hook registration failures, and JID matching complexities).

    Proposed Change:
    - Deprecate the dependency on the external OpenClaw gateway process.
    - Integrate the messaging logic (Baileys-based) directly into the swarm core as an internal module.
    - This allows for direct event handling, real-time message processing, and eliminates CLI/log overhead.

    Oracle, please evaluate:
    1. The risk/reward of this integration in terms of "Sovereign Intelligence".
    2. The impact on cognitive stability and resource management.
    3. The recommended implementation path (e.g., using @whiskeysockets/baileys directly vs. adapting OpenClaw source).
    4. Any potential "Quantum Entanglement" benefits of having the messaging layer inside the swarm process.

    Provide a concise strategic recommendation.
    `;

    try {
        const result = await quantumCore.consultOracle(
            "Direct WhatsApp Integration vs External Gateway",
            ["Direct Baileys Integration", "Maintain OpenClaw CLI", "Modular Gateway Service"],
            ['Sovereignty', 'Reliability', 'Latency']
        );

        console.log('\n--- ORACLE RECOMMENDATION ---\n');
        console.log(result.recommendation);
        console.log(`\n📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);

        const auditPath = path.resolve(__dirname, '../../.gemini/antigravity/brain/ba6a8ed9-ecf1-44eb-bbc0-2b43f44cee94/oracle_direct_integration_report.md');
        fs.writeFileSync(auditPath, `# Oracle Strategic Report: Direct WhatsApp Integration\n\n## Recommendation\n${result.recommendation}\n\n## Confidence\n${(result.confidence * 100).toFixed(1)}%\n\n## Analysis\nThe Oracle suggests transitioning to ${result.recommendation} to maximize ${result.recommendation === 'Direct Baileys Integration' ? 'Sovereignty and Latency' : 'Modular Separation'}.`);
        console.log(`\n✅ Audit report saved to: ${auditPath}`);

    } catch (e) {
        console.error('❌ Oracle Consultation Failed:', e);
    }
}

main();
