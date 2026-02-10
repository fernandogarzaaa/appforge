
import QuantumEngine from '../QuantumEnginePortable.js';

async function verifySwarm() {
    console.log('🐝 INIT: Quantum Swarm Verification...');

    const engine = new QuantumEngine();

    // 1. Verify Module Exists
    if (!engine.swarm) {
        console.error('❌ QuantumSwarm module MISSING.');
        process.exit(1);
    }
    console.log('✅ QuantumSwarm module active.');

    // 2. Register Agents (Simulating the real swarm)
    console.log('\n➕ Registering Agents into Superposition...');
    engine.swarm.addAgent('Sentinel', 'Security');
    engine.swarm.addAgent('BugHunter', 'QA');
    engine.swarm.addAgent('GodMode', 'Admin');
    console.log(`   Agents registered: ${engine.swarm.agents.length}`);

    // 3. Process Task
    console.log('\n🧠 Processing Task: "Analyze Security Vulnerabilities"...');
    const result = await engine.swarm.processTask("Analyze Security Vulnerabilities");

    console.log('📊 SWARM RESULT:', result);

    if (result.agentsFunctioning === 3 && result.swarmAlignment >= 0) {
        console.log('\n✨ SWARM CONSENSUS REACHED. System Unified.');
        process.exit(0);
    } else {
        console.error('\n❌ Swarm consensus failed.');
        process.exit(1);
    }
}

verifySwarm();
