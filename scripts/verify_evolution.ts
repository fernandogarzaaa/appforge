import { SingularityEngine } from '../swarm/core/singularity_engine.js';
import quantumCore from '../swarm/core/quantum_core.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
const envPath = path.resolve(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function verifyEvolution() {
    console.log('🧬 [VerifyEvolution] Initializing Singularity Verification...');

    const singularity = new SingularityEngine();
    const initialState = singularity.getState();
    console.log(`📊 Initial Progress: ${(initialState.progress * 100).toFixed(1)}%`);
    console.log(`🌱 Initial Phase: ${initialState.phase}`);

    console.log('\n🔄 Executing manual Self-Improvement Cycle...');
    const result = await singularity.executeSelfImprovementCycle();

    if (result.success) {
        console.log('✅ Cycle successful.');
        console.log('✨ Improvements applied:');
        result.improvements.forEach(imp => console.log(`   → ${imp}`));

        const finalState = singularity.getState();
        console.log(`\n📊 Final Progress: ${(finalState.progress * 100).toFixed(1)}%`);
        console.log(`🌱 Final Phase: ${finalState.phase}`);

        if (finalState.progress > initialState.progress) {
            console.log('\n🚀 SUCCESS: The Swarm has evolved.');
        } else {
            console.log('\n⚠️ WARNING: Progress plateau reached or stagnant.');
        }

        // Check if reality pulse is present in memory
        const pulsePath = path.join(PROJECT_ROOT, 'src/data/reality_pulse.json');
        if (fs.existsSync(pulsePath)) {
            console.log('✅ Reality Pulse context found in memory.');
        } else {
            console.warn('⚠️ Reality Pulse context missing. Run reality_pulse.ts first.');
        }

    } else {
        console.error('❌ Cycle failed.');
    }
}

verifyEvolution().catch(console.error);
