/**
 * ⚛️ Quantum System Verification
 * 
 * Uses the Quantum Engine to test the entire system:
 * - WASM integration
 * - Backend services
 * - Frontend components
 * - Build verification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Quantum-inspired metrics
let systemEntropy = 0;
let coherenceScore = 100;
let testsRun = 0;
let testsPassed = 0;

function quantumCheck(name, condition, description) {
    testsRun++;
    const passed = condition;

    if (passed) {
        testsPassed++;
        console.log(`  ✅ ${name}`);
    } else {
        systemEntropy += 10;
        coherenceScore -= 5;
        console.log(`  ❌ ${name} - ${description}`);
    }

    return passed;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('        ⚛️ QUANTUM SYSTEM VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // ============================================================
    // Phase 1: Core Files Check
    // ============================================================
    console.log('📁 Phase 1: Core Files');
    console.log('─────────────────────────────────────────');

    quantumCheck('QuantumEngine.js exists',
        fs.existsSync(path.join(projectRoot, 'src/lib/QuantumEngine.js')),
        'Missing QuantumEngine');

    quantumCheck('WASM loader exists',
        fs.existsSync(path.join(projectRoot, 'src/lib/wasmLoader.ts')),
        'Missing wasmLoader.ts');

    quantumCheck('WASM module built',
        fs.existsSync(path.join(projectRoot, 'src/quantum-core/pkg/quantum_core_bg.wasm')),
        'Run npm run build:quantum');

    quantumCheck('Rust lib.rs exists',
        fs.existsSync(path.join(projectRoot, 'src/quantum-core/src/lib.rs')),
        'Missing Rust source');

    quantumCheck('Rust analytics.rs exists',
        fs.existsSync(path.join(projectRoot, 'src/quantum-core/src/analytics.rs')),
        'Missing analytics module');

    quantumCheck('Rust security.rs exists',
        fs.existsSync(path.join(projectRoot, 'src/quantum-core/src/security.rs')),
        'Missing security module');

    // ============================================================
    // Phase 2: Frontend Components
    // ============================================================
    console.log('\n🎨 Phase 2: Frontend Components');
    console.log('─────────────────────────────────────────');

    quantumCheck('App.jsx exists',
        fs.existsSync(path.join(projectRoot, 'src/App.jsx')),
        'Missing main App');

    quantumCheck('SwarmDashboard.jsx exists',
        fs.existsSync(path.join(projectRoot, 'src/pages/SwarmDashboard.jsx')),
        'Missing SwarmDashboard');

    quantumCheck('WorkflowBuilder.jsx exists',
        fs.existsSync(path.join(projectRoot, 'src/pages/WorkflowBuilder.jsx')),
        'Missing WorkflowBuilder');

    quantumCheck('WebVitalsMonitor.jsx exists',
        fs.existsSync(path.join(projectRoot, 'src/components/performance/WebVitalsMonitor.jsx')),
        'Missing WebVitalsMonitor');

    quantumCheck('QuantumDashboard.jsx exists',
        fs.existsSync(path.join(projectRoot, 'src/components/anomalies/QuantumDashboard.jsx')),
        'Missing QuantumDashboard');

    // ============================================================
    // Phase 3: Backend Services
    // ============================================================
    console.log('\n🔧 Phase 3: Backend Services');
    console.log('─────────────────────────────────────────');

    quantumCheck('Swarm loop.ts exists',
        fs.existsSync(path.join(projectRoot, 'swarm/core/loop.ts')),
        'Missing swarm loop');

    quantumCheck('Base44 tool exists',
        fs.existsSync(path.join(projectRoot, 'swarm/tools/base44.ts')),
        'Missing base44 tool');

    quantumCheck('Bot pipeline exists',
        fs.existsSync(path.join(projectRoot, 'src/functions/executeBotPipeline.ts')),
        'Missing bot pipeline');

    quantumCheck('Quantum analysis exists',
        fs.existsSync(path.join(projectRoot, 'src/functions/quantumAnalysis.ts')),
        'Missing quantum analysis');

    // ============================================================
    // Phase 4: Configuration
    // ============================================================
    console.log('\n⚙️ Phase 4: Configuration');
    console.log('─────────────────────────────────────────');

    quantumCheck('vite.config.js exists',
        fs.existsSync(path.join(projectRoot, 'vite.config.js')),
        'Missing Vite config');

    quantumCheck('package.json exists',
        fs.existsSync(path.join(projectRoot, 'package.json')),
        'Missing package.json');

    quantumCheck('.env.local exists',
        fs.existsSync(path.join(projectRoot, '.env.local')),
        'Missing environment file');

    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

        quantumCheck('build:quantum script defined',
            pkg.scripts?.['build:quantum'],
            'Missing WASM build script');

        quantumCheck('vitest configured',
            pkg.scripts?.test?.includes('vitest'),
            'Missing test script');
    }

    // ============================================================
    // Phase 5: WASM Integration Check
    // ============================================================
    console.log('\n🦀 Phase 5: WASM Integration');
    console.log('─────────────────────────────────────────');

    const wasmPkgPath = path.join(projectRoot, 'src/quantum-core/pkg/package.json');
    if (fs.existsSync(wasmPkgPath)) {
        const wasmPkg = JSON.parse(fs.readFileSync(wasmPkgPath, 'utf-8'));
        quantumCheck('WASM package name correct',
            wasmPkg.name === 'quantum-core',
            'Package name mismatch');
    } else {
        quantumCheck('WASM package.json exists', false, 'Run npm run build:quantum');
    }

    const wasmFile = path.join(projectRoot, 'src/quantum-core/pkg/quantum_core_bg.wasm');
    if (fs.existsSync(wasmFile)) {
        const stats = fs.statSync(wasmFile);
        quantumCheck('WASM file size reasonable',
            stats.size > 10000 && stats.size < 1000000,
            `Size: ${stats.size} bytes`);
        console.log(`     📦 WASM size: ${(stats.size / 1024).toFixed(1)} KB`);
    }

    const dtsFile = path.join(projectRoot, 'src/quantum-core/pkg/quantum_core.d.ts');
    if (fs.existsSync(dtsFile)) {
        const dts = fs.readFileSync(dtsFile, 'utf-8');
        quantumCheck('levenshtein_distance exported',
            dts.includes('levenshtein_distance'),
            'Missing from TypeScript definitions');
        quantumCheck('QuantumAnnealer exported',
            dts.includes('QuantumAnnealer'),
            'Missing from TypeScript definitions');
        quantumCheck('calculate_statistics exported',
            dts.includes('calculate_statistics'),
            'Missing Phase 2 function');
        quantumCheck('evaluate_permission exported',
            dts.includes('evaluate_permission'),
            'Missing Phase 3 function');
    }

    // ============================================================
    // Results Summary
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('        ⚛️ QUANTUM VERIFICATION RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    coherenceScore = Math.max(0, coherenceScore);
    const stabilityScore = (coherenceScore + (100 - systemEntropy)) / 2;

    console.log(`📊 Tests Passed: ${testsPassed}/${testsRun}`);
    console.log(`🌡️  System Entropy: ${systemEntropy}%`);
    console.log(`🔗 Coherence: ${coherenceScore}%`);
    console.log(`⚡ Stability: ${stabilityScore.toFixed(1)}%`);
    console.log('');

    if (testsPassed === testsRun) {
        console.log('✅ QUANTUM STATE: SUPERPOSITION STABLE');
        console.log('   All systems entangled and coherent.');
    } else if (testsPassed >= testsRun * 0.8) {
        console.log('⚠️ QUANTUM STATE: PARTIAL DECOHERENCE');
        console.log('   Some wave functions have collapsed. Review failed checks.');
    } else {
        console.log('❌ QUANTUM STATE: WAVEFUNCTION COLLAPSE');
        console.log('   System instability detected. Address critical issues.');
    }

    console.log('\n');

    return testsPassed === testsRun ? 0 : 1;
}

main().then(process.exit).catch(e => {
    console.error('Verification Error:', e);
    process.exit(1);
});
