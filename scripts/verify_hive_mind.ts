
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import quantumCore from '../swarm/core/quantum_core.js';

async function verifyHiveMind() {
    console.log("🧠 VERIFICATION: Syncing with Hive Mind (Neural Bridge)...");

    const question = "Which architectural pattern provides the highest sovereign resilience?";
    const options = [
        "Microservices on AWS Lambda",
        "Monolith on Heroku",
        "Local-First Actor Model with P2P State Sync",
        "Hybrid Cloud Kubernetes Cluster"
    ];

    try {
        const result = await quantumCore.consultOracle(question, options);

        console.log("\n   🔮 Oracle Response:");
        console.log(`      Recall: ${result.recommendation}`);
        console.log(`      Engine: ${(result as any).engineVersion}`);
        console.log(`      Reasoning: ${(result as any).reasoning ? "✅ Present" : "❌ Missing"}`);

        if ((result as any).engineVersion === 'Iron-Brain-v1') {
            console.log("\n   ✨ SUCCESS: The Hive Mind is ONLINE.");
            console.log("      Decisions are now powered by the Iron Brain.");
        } else {
            console.log("\n   ⚠️ WARNING: Received response from fallback engine.");
            console.log("      Check if 'launch_neural_bridge.bat' is running.");
        }

    } catch (e) {
        console.error("   ❌ ERROR:", e);
    }
}

verifyHiveMind().catch(console.error);
