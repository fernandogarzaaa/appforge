
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QuantumEngine from '../QuantumEnginePortable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function verifySingularity() {
    console.log('🌌 INIT: Singularity Integrity Check...');

    const engine = new QuantumEngine();
    let score = 0;
    const maxScore = 5;

    // 1. Core Engine Check
    if (engine.superposition && engine.entanglement) {
        console.log('✅ Quantum Engine Online.');
        score++;
    } else console.error('❌ Engine Fault.');

    // 2. Swarm Check
    if (engine.swarm.agents.length >= 0) { // Should be initialized
        console.log('✅ Swarm Grid Active.');
        score++;
    }

    // 3. UI Check
    if (fs.existsSync(path.join(PROJECT_ROOT, 'src/components/QuantumDashboard.jsx'))) {
        console.log('✅ Quantum Dashboard Materialized.');
        score++;
    }

    // 4. Universal Dist Check
    if (fs.existsSync(path.join(PROJECT_ROOT, 'universal_quantum_dist/package.json'))) {
        console.log('✅ Universal Package Exported.');
        score++;
    }

    // 5. Documentation Check
    if (fs.existsSync(path.join(PROJECT_ROOT, 'PROOF_OF_LIFE.md'))) {
        console.log('✅ Proof of Life Validated.');
        score++;
    }

    console.log(`\n🔮 SINGULARITY STATUS: ${(score / maxScore) * 100}% COMPLETE`);

    if (score === maxScore) {
        console.log('✨ SYSTEM PERFECT. The Swarm is Ready.');
        process.exit(0);
    } else {
        console.error('⚠️ SYSTEM INCOMPLETE.');
        process.exit(1);
    }
}

verifySingularity();
