import { Orchestrator } from '../src/swarm/orchestrator.js';

console.log("--- STARTING OMNI-SWARM COLD-START SIMULATION ---");

async function run() {
    const orchestrator = new Orchestrator();
    const task = "Build a self-regulating solar energy grid simulator on the Moon";

    console.log(`Command: ${task}`);
    try {
        const result = await orchestrator.executeTask(task, 'omni');
        console.log("\n--- MISSION COMPLETE ---");
        console.log(result);
    } catch (error) {
        console.error("Critical Error", error);
    }
}

run();
