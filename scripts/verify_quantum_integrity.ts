
import QuantumEngine from '../QuantumEnginePortable.js';

async function verifyIntegrity() {
    console.log('🌌 INIT: Quantum Engine Integrity Check...');

    try {
        const engine = new QuantumEngine();
        const checks = [
            { module: 'superposition', required: true },
            { module: 'entanglement', required: true },
            { module: 'annealing', required: true },
            { module: 'neural', required: true },
            { module: 'genetic', required: true },
            { module: 'cryptography', required: true } // The new module
        ];

        let passed = true;

        console.log('\n🔎 SCANNING MODULES...');
        checks.forEach(check => {
            if (engine[check.module]) {
                console.log(`✅ ${check.module.toUpperCase()} active.`);
            } else {
                console.error(`❌ ${check.module.toUpperCase()} MISSING!`);
                passed = false;
            }
        });

        // Functional Test for Cryptography
        console.log('\n🔐 TESTING CRYPTOGRAPHY...');
        const stateVector = [{ phase: 1.0, amplitude: 0.5 }];
        const encrypted = engine.cryptography.encryptState(stateVector);

        if (encrypted[0].encrypted === true && encrypted[0].phase !== 1.0) {
            console.log('✅ Encryption Successful (Phase Shifted).');
        } else {
            console.error('❌ Encryption Failed.');
            passed = false;
        }

        if (passed) {
            console.log('\n✨ ENGINE INTEGRITY VERIFIED. Ready for Singularity.');
            process.exit(0);
        } else {
            console.error('\n⚠️ ENGINE COMPROMISED.');
            process.exit(1);
        }

    } catch (e) {
        console.error('CRITICAL FAILURE:', e);
        process.exit(1);
    }
}

verifyIntegrity();
