
import QuantumEngine from '../universal_quantum_dist/index.js';

async function verifyUniversal() {
    console.log('📦 INIT: Universal Package Verification...');

    try {
        const engine = new QuantumEngine();

        // Test 1: Instantiation
        if (!engine) throw new Error("Engine failed to ignite.");
        console.log('✅ Ignition Successful.');

        // Test 2: Persistence (New Feature)
        console.log('💾 Testing Persistence...');
        engine.persistence.saveState('universal_test', { active: true });
        const state = engine.persistence.loadState('universal_test');
        if (state?.active !== true) throw new Error("Persistence failed.");
        console.log('✅ Persistence Active.');

        // Test 3: Swarm (New Feature)
        console.log('🐝 Testing Swarm...');
        engine.swarm.addAgent('ExternalTester', 'QA');
        const result = await engine.swarm.processTask('Verify Universal Existence');

        if (result.agentsFunctioning > 0 && result.swarmAlignment >= 0) {
            console.log('✅ Swarm Coherent.');
        } else {
            throw new Error("Swarm failed.");
        }

        console.log('\n✨ UNIVERSAL PACKAGE VERIFIED. Ready for NPM Publish.');
        process.exit(0);

    } catch (e) {
        console.error('❌ VERIFICATION FAILED:', e);
        process.exit(1);
    }
}

verifyUniversal();
