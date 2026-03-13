import { Spawner } from './factory_core/Spawner.js';
import { Orchestrator } from './orchestrator.js';
async function runTest() {
    console.log("🌌 UNIVERSAL DECOUPLING VERIFICATION PROTOCOL 🌌");
    const INTENT = "Build a Self-Correcting City Planner with Real-Time Traffic Optimization";
    // 1. Test Spawning Logic
    console.log(`\n[TEST 1] Testing Spawner with intent: "${INTENT}"...`);
    const swarm = Spawner.spawnSwarm(INTENT);
    const hasSpatial = swarm.some(a => a.role === 'SpatialArchitect');
    if (hasSpatial) {
        console.log("✅ SUCCESS: Spawner deployed 'SpatialArchitect' (Domain Agnostic).");
    }
    else {
        console.error("❌ FAILURE: Spawner failed to adapt to Spatial intent.");
        console.log("Received Agents:", swarm.map(a => a.role));
        process.exit(1);
    }
    // 2. Test Orchestration (Mocked)
    console.log(`\n[TEST 2] Executing Omni-Swarm Protocol...`);
    const orchestrator = new Orchestrator();
    try {
        const result = await orchestrator.executeTask(INTENT, 'omni');
        console.log("\n✅ SUCCESS: Omni-Swarm execution completed.");
        console.log("Output Preview:", result.slice(0, 100) + "...");
    }
    catch (e) {
        console.error("❌ FAILURE: Orchestration failed.", e.message);
        process.exit(1);
    }
}
runTest();
