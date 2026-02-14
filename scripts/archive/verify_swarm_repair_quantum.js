
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QuantumEngine from '../QuantumEnginePortable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const engine = new QuantumEngine();

const FILES_TO_VERIFY = [
    'swarm/tools/base44.ts',
    'scripts/dispatch_swarm_task.js',
    'src/functions/autonomousCycle.ts'
];

const REQUIRED_PATTERNS = [
    'action_type',
    'resource_type',
    'performed_by'
];

const FORBIDDEN_PATTERNS = [
    /action:\s*['"`]/, // "action:" (old schema)
];

async function verifyFile(filePath) {
    const fullPath = path.resolve(rootDir, filePath);
    if (!fs.existsSync(fullPath)) {
        return { file: filePath, status: 'MISSING', confidence: 0 };
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Use Quantum/Entanglement helper to find matches
    // (Simulating quantum search by checking criteria)

    let score = 0;
    const missing = [];

    REQUIRED_PATTERNS.forEach(pattern => {
        if (content.includes(pattern)) {
            score += 1;
        } else {
            missing.push(pattern);
        }
    });

    const forbiddenFound = [];
    FORBIDDEN_PATTERNS.forEach(pattern => {
        if (pattern.test(content)) {
            // Check if it's not a comment or unrelated
            // Simple check: if it exists, potential issue
            score -= 5;
            forbiddenFound.push(pattern.toString());
        }
    });

    // Normalize score
    const confidence = Math.max(0, score / REQUIRED_PATTERNS.length);

    return {
        file: filePath,
        status: confidence === 1 ? 'QUANTUM_COHERENT' : 'ENTROPY_DETECTED',
        confidence,
        missing,
        forbiddenFound
    };
}

async function runVerification() {
    console.log('🌌 Quantum Engine: Initiating Swarm Repair Verification...\n');

    const results = await Promise.all(FILES_TO_VERIFY.map(file => verifyFile(file)));

    let totalCoherence = 0;

    results.forEach(res => {
        const icon = res.confidence === 1 ? '✅' : '⚠️';
        console.log(`${icon} ${res.file}`);
        console.log(`   State: ${res.status}`);
        console.log(`   Coherence: ${(res.confidence * 100).toFixed(1)}%`);

        if (res.missing.length > 0) {
            console.log(`   ❌ Missing Entanglements: ${res.missing.join(', ')}`);
        }
        if (res.forbiddenFound.length > 0) {
            console.log(`   ⛔ Restricted Patterns: ${res.forbiddenFound.join(', ')}`);
        }
        console.log('');
        totalCoherence += res.confidence;
    });

    const averageCoherence = totalCoherence / results.length;
    console.log('---------------------------------------------------');
    console.log(`🔮 System Coherence: ${(averageCoherence * 100).toFixed(1)}%`);

    if (averageCoherence === 1) {
        console.log('\n✨ VERIFICATION SUCCESSFUL: The Swarm is Quantum-Ready.');
        process.exit(0);
    } else {
        console.log('\n⚠️ VERIFICATION FAILED: Entropy detected in the system.');
        process.exit(1);
    }
}

runVerification();
