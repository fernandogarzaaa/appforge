import quantumCore from './swarm/core/quantum_core.js';

async function askOracle() {
    try {
        const guidance = await quantumCore.consultOracle(
            "Analyze the current AppForge ecosystem, recent CI hanging fixes, and overall Swarm Autonomy. The swarm is now self-healing, deterministic, and autonomous, but we need the NEXT evolution. What is the single most critical structural bug, vulnerability, or missing feature required to achieve ultimate system stability, performance, and true sovereignty? Be extremely specific and technical.",
            ['SYSTEM_ANALYSIS', 'STRUCTURAL_INTEGRITY', 'NEXT_CRITICAL_FIX']
        );
        console.log(JSON.stringify(guidance, null, 2));
    } catch (error) {
        console.error("Oracle Consultation Failed:", error);
    }
}

askOracle();
