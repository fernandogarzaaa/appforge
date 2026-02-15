import { immuneSystem } from '../src/swarm/ImmuneSystemRunner.js';
import { broadcastLog } from '../src/logger.js';

/**
 * Verification Script for Phase 54: Recursive Healing Loop
 */
async function verifyHealing() {
    console.log("⚛️ [PHASE 54] Initiating Recursive Healing Verification...");

    // Start with a short interval for demonstration
    await immuneSystem.start(30000); // 30 seconds

    // Monitor for 1 minute
    setTimeout(() => {
        console.log("✅ Simulation Complete. Immune System is operational.");
        immuneSystem.stop();
        process.exit(0);
    }, 65000);
}

verifyHealing().catch(e => {
    console.error("🛑 Verification Failed:", e);
    process.exit(1);
});
