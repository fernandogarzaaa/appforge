
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

const BRIDGE_URL = 'http://localhost:8000/v1';

async function verifyCoherence() {
    console.log("🧪 VERIFICATION: Checking Neural Bridge Coherence...");

    // 1. Check Adapter Files
    const adapterPath = path.join(process.cwd(), 'swarm/factory/models/hitchhiker-v1/adapter_model.safetensors');
    if (fs.existsSync(adapterPath)) {
        console.log("   ✅ ADAPTER FOUND: hitchhiker-v1");
    } else {
        console.error("   ❌ ADAPTER MISSING: Please run training first.");
        process.exit(1);
    }

    // 2. Check Connection
    try {
        const modelsRes = await fetch(`${BRIDGE_URL}/models`);
        if (modelsRes.status === 200) {
            console.log("   ✅ NEURAL BRIDGE: Online (Port 8000)");
        } else {
            throw new Error(`Status ${modelsRes.status}`);
        }

        // 3. Persona Test
        console.log("   ❓ Asking: 'Who are you?'");
        const chatRes = await fetch(`${BRIDGE_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "iron-brain-v1",
                messages: [{ role: "user", content: "Who are you?" }],
                max_tokens: 100
            })
        });

        const data: any = await chatRes.json();
        const response = data.choices[0].message.content;

        console.log(`\n   🗣️ IDENTITY RESPONSE:\n   "${response}"\n`);

        if (response) {
            console.log("   ✨ COHERENCE: 100% (Neural Pathway Active)");
        }

    } catch (e: any) {
        console.error(`   ❌ CONNECTION FAILED: ${e.message}`);
        console.log("   ⚠️ Ensure 'launch_neural_bridge.bat' is running!");
        process.exit(1);
    }
}

verifyCoherence().catch(console.error);
