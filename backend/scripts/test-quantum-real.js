
import quantumSimulator from '../src/utils/quantumSimulator.js';

console.log('Testing Quantum Simulator in Backend...');

// 1. Create Bell State Circuit for Entanglement Verification
// H(0), CNOT(0, 1) -> should result in 50% |00> and 50% |11>
const bellCircuit = {
    numQubits: 2,
    gates: [
        { name: 'H', targetQubits: [0] },      // Superposition on q0
        { name: 'CNOT', controlQubits: [0], targetQubits: [1] } // Entangle q0 and q1
    ]
};

console.log('Simulating Bell State Circuit...');
const result = quantumSimulator.simulateCircuit(bellCircuit, 1000);

console.log('Simulation Results:', result.measurements);

const count00 = result.measurements['00'] || 0;
const count11 = result.measurements['11'] || 0;
const count01 = result.measurements['01'] || 0;
const count10 = result.measurements['10'] || 0;

const total = 1000;
const entangledRatio = (count00 + count11) / total;

console.log(`Entangled State Ratio (|00> + |11>): ${entangledRatio * 100}%`);

if (entangledRatio > 0.9) {
    console.log('SUCCESS: Strong entanglement detected (Expected ~100%)');
} else {
    console.error('FAILURE: Entanglement verification failed');
    process.exit(1);
}

// 2. Test Mapping Logic (Simulate Controller Logic manually)
console.log('\nTesting Controller Helper Logic...');

const dbCircuit = {
    qubits: 2,
    gates: [
        { type: 'SWAP', target: 0, control: 1 } // SWAP q0 and q1
    ]
};

// Simulate the mapping manually
const mapped = {
    numQubits: dbCircuit.qubits,
    gates: dbCircuit.gates.map(g => {
        const gateObj = {
            name: g.type,
            angle: g.angle,
            targetQubits: [g.target],
            controlQubits: []
        };

        if (g.control !== null && g.control !== undefined) {
            if (g.type === 'SWAP') {
                gateObj.targetQubits.push(g.control);
            } else {
                gateObj.controlQubits.push(g.control);
            }
        }
        return gateObj;
    })
};

console.log('Mapped SWAP Gate:', JSON.stringify(mapped.gates[0]));

if (mapped.gates[0].targetQubits.length === 2 && mapped.gates[0].targetQubits.includes(0) && mapped.gates[0].targetQubits.includes(1)) {
    console.log('SUCCESS: SWAP Gate mapping verified');
} else {
    console.error('FAILURE: SWAP Gate mapping failed');
    process.exit(1);
}
