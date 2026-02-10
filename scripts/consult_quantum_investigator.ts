
import QuantumEngine from '../universal_quantum_dist/index.js';
import fs from 'fs';

async function investigate() {
    console.log('🕵️ INIT: Q.U.A.N.T.U.M. INVESTIGATOR');

    const engine = new QuantumEngine();

    // 1. gather evidence
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const serverParams = fs.readFileSync('server.js', 'utf8').length;

    console.log(`\n🔎 EVIDENCE COLLECTED:`);
    console.log(`   - Dependencies: ${Object.keys(pkg.dependencies).length}`);
    console.log(`   - Server Size: ${serverParams} bytes`);

    // 2. Formulate Hypothesis via Quantum Superposition
    const question = "Current System State after Dependency Injection?";
    const possibilities = [
        "Stable Equilibrium (Ready for Cloud)",
        "Entanglement Error (Local Env Mismatch)",
        "Superposition Collapse (Critical Failure)"
    ];

    // 3. Evaluate
    // We prioritize Stability and Cloud Readiness
    const criteria = ["Stability", "Cloud", "Resilience"];

    console.log(`\n🌌 ANALYZING WAVEFUNCTION...`);
    const prediction = await engine.quantumSolve(question, possibilities, criteria);

    console.log(`\n✨ DIAGNOSIS: ${prediction.optimizedBest}`);
    console.log(`   Confidence: ${(prediction.confidence * 100).toFixed(2)}%`);

    if (prediction.optimizedBest.includes("Stable")) {
        console.log("\n✅ RECOMMENDATION: Proceed to Deployment.");
    } else {
        console.log("\n⚠️ RECOMMENDATION: Re-run Install.");
    }
}

investigate();
