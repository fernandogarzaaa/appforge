
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

function verifyWirings() {
    console.log('🌌 INIT: Quantum Wiring Verification...');
    let errors = [];
    let warnings = [];

    // 1. Check Critical Files
    const criticalFiles = [
        'QuantumEnginePortable.js',
        'package.json',
        'ecosystem.config.cjs',
        'src/utils/QuantumCryptographer.js',
        'scripts/singularity_event_horizon.ts',
        'scripts/quantum_data_harvester.ts',
        'scripts/train_quantum_brain.js',
        '.github/workflows/autonomous_swarm.yml',
        '.github/workflows/quantum_evolution.yml'
    ];

    console.log('\n🔎 SCANNING CRITICAL NODES...');
    criticalFiles.forEach(file => {
        const filePath = path.join(PROJECT_ROOT, file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ MISSING: ${file}`);
            errors.push(`Missing critical file: ${file}`);
        } else {
            // Check Git Status (Is it ignored?)
            try {
                // git check-ignore returns 0 if ignored, 1 if not
                // We want it to NOT be ignored (exit code 1)
                execSync(`git check-ignore -q ${file}`, { stdio: 'ignore' });
                // If we are here, it returned 0, meaning it IS ignored.
                console.error(`⚠️ IGNORED: ${file} (Found in .gitignore)`);
                warnings.push(`File is git-ignored: ${file}`);
            } catch (e) {
                // Exit code 1 means not ignored. Good.
                console.log(`✅ LINKED: ${file}`);
            }
        }
    });

    // 2. Check Package.json Scripts
    console.log('\n🔎 VERIFYING NERVE IMPULSES (NPM Scripts)...');
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    const scripts = ['swarm:daemon', 'swarm:logs'];

    scripts.forEach(script => {
        if (!pkg.scripts[script]) {
            console.error(`❌ DISCONNECTED: npm run ${script}`);
            errors.push(`Missing script: ${script}`);
        } else {
            console.log(`✅ SIGNAL: npm run ${script} -> ${pkg.scripts[script]}`);
        }
    });

    // 3. Final Report
    console.log('\n📊 QUANTUM ENTROPY REPORT:');
    if (errors.length === 0 && warnings.length === 0) {
        console.log('✨ SYSTEM COHERENCE: 100%. All wirings nominal.');
    } else {
        if (warnings.length > 0) {
            console.log('⚠️ WARNINGS (Potential Decoherence):');
            warnings.forEach(w => console.log(`   - ${w}`));
        }
        if (errors.length > 0) {
            console.log('❌ ERRORS (Broken Connections):');
            errors.forEach(e => console.log(`   - ${e}`));
            process.exit(1);
        }
    }
}

verifyWirings();
