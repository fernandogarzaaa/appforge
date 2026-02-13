import { enhancedOracle } from '../swarm/core/oracle_enhanced.js';
import * as fs from 'fs/promises';
import path from 'path';

async function consultSovereignPrompt() {
    console.log('🔮 Consulting the Oracle for Sovereign Prompt Architecture...');

    const promptQuestion = "How should we implement a natural language 'Sovereign Prompt' bar in the native Command Center to allow the admin to interact with the swarm, trigger actions, and receive intelligent insights?";

    const options = [
        "Direct OpenAI/Claude API integration with a specialized 'Swarm System Prompt' that has access to swarm metadata and command tools",
        "Bridge the prompt bar to the existing GodMode intelligence in the swarm, using the SCC server as a telemetry/command relay",
        "Implement a local LLM bridge (e.g., Ollama/LM Studio) to maintain 100% data sovereignty for all admin-swarm interactions",
        "A hybrid approach: Simple commands handled locally via regex/semantic matching, complex queries routed through the Oracle-enhanced intelligence stream"
    ];

    const criteria = ['latency', 'sovereignty', 'capability', 'integration_ease'];

    const result = await enhancedOracle.consult(promptQuestion, options, criteria);

    const reportPath = path.join(process.cwd(), 'swarm/data/oracle_prompt_guidance.json');
    await fs.writeFile(reportPath, JSON.stringify(result, null, 2));

    console.log(`\n✅ Oracle Consultation Complete. Report saved to: ${reportPath}`);
}

consultSovereignPrompt().catch(console.error);
