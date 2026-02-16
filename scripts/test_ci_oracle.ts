
import { pathToFileURL } from 'url';
process.env.CI = 'true'; // Simulate CI Environment BEFORE importing quantum_core

import quantumCore from '../swarm/core/quantum_core.js';

async function verifyStaticOracle() {
    console.log("🧪 VERIFICATION: Testing Static Oracle in CI Mode...");

    // 1. Query a known key from our generated static oracle
    const query = "Design a decentralized identity system using Solana PDAs.";

    console.log(`   ❓ Asking: "${query}"`);
    const result = await quantumCore.consultOracle(query, ["Option A", "Option B"]);

    // 2. Validate Response
    if (result.predictionId === 'static_ci_prediction') {
        console.log("   ✅ SUCCESS: Static Oracle activated.");
        console.log(`   📝 Reasoning Length: ${result.reasoning?.length || 0} chars`);
    } else {
        console.error("   ❌ FAILURE: Static Oracle NOT used. Got:", result.predictionId);
        process.exit(1);
    }

    // 3. Query an unknown key (Fallback test)
    console.log(`   ❓ Asking: "Unknown Theory of Everything"`);
    const fallback = await quantumCore.consultOracle("Unknown Theory of Everything", ["Default"]);

    if (fallback.predictionId === 'ci_fallback' || fallback.predictionId === 'static_ci_prediction') {
        console.log("   ✅ SUCCESS: Fallback mechanism active.");
    } else {
        console.error("   ❌ FAILURE: Fallback failed.");
        process.exit(1);
    }
}

// Execute
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    verifyStaticOracle().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
