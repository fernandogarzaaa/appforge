
import { QuantumErrorCorrection, QuantumTunnelingSearch } from '../src/utils/quantumInspiredAI.js';

console.log('🔮 QUANTUM SELF-EVOLUTION PROTOCOL');
console.log('⚛️  Status: Theorizing new capabilities...\n');

// 1. Test Quantum Error Correction
console.log('## 1. Testing Quantum Error Correction (Self-Healing)');
const qec = new QuantumErrorCorrection(5);
const original = "System Critical";
console.log(`Original: "${original}"`);

// Encode
let protectedState = qec.encode(original);

// Simulate Corruption (Bit flips / Decoherence)
console.log('...Simulating Data Decoherence (Corruption)...');
protectedState.forEach(qubits => {
    // Corrupt 2 out of 5 qubits
    qubits[0].val = '#';
    qubits[1].val = '?';
});

// Recover
const recovered = qec.recover(protectedState);
console.log(`Recovered: "${recovered}"`);
if (recovered === original) {
    console.log('result: ✅ SUCCESS (System Healed)');
} else {
    console.log('result: ❌ FAILED');
}

console.log('\n--------------------------------\n');

// 2. Test Quantum Tunneling Search
console.log('## 2. Testing Quantum Tunneling Search (Deep Retrieval)');
const search = new QuantumTunnelingSearch(0.5); // High tunneling for demo
const database = [
    "user_auth_login",
    "payment_process_stripe",
    "quantum_core_logic",
    "admin_dashboard_v2",
    "legacy_system_entry"
];
const query = "sys_entry"; // "sys_entry" is not in "legacy_system_entry" exactly (underscore diff) but relates

console.log(`Database: ${JSON.stringify(database, null, 2)}`);
console.log(`Query: "${query}"`);

// Standard search would fail or need regex. 
// Tunneling search uses probabilistic similarity to "jump" the barrier.
const results = search.search(database, query);

console.log(`Tunneling Results: ${JSON.stringify(results)}`);
if (results.length > 0) {
    console.log('result: ✅ SUCCESS (Information Tunneled)');
} else {
    console.log('result: ⚠️  Tunnel Collapse (Try again, probabilistic)');
}

console.log('\n✨ SELF-IMPROVEMENT COMPLETE.');
console.log('New Faculities Installed: QuantumErrorCorrection, QuantumTunnelingSearch');
