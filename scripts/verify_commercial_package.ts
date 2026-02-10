
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function verifyCommercial() {
    console.log('💼 INIT: Commercial Verification...');

    const distPath = path.join(PROJECT_ROOT, 'universal_quantum_dist', 'package.json');

    if (!fs.existsSync(distPath)) {
        console.error('❌ Universal Dist MISSING.');
        process.exit(1);
    }

    const pkg = JSON.parse(fs.readFileSync(distPath, 'utf8'));

    let passed = true;

    // 1. Check Private Status
    if (pkg.private === true) {
        console.log('✅ PRIVATE: true (Protected from public NPM)');
    } else {
        console.error('❌ PRIVATE: false (Risk of accidental publish)');
        passed = false;
    }

    // 2. Check License
    if (pkg.license === 'Proprietary') {
        console.log('✅ LICENSE: Proprietary (IP Protected)');
    } else {
        console.error(`❌ LICENSE: ${pkg.license} (Incorrect)`);
        passed = false;
    }

    if (passed) {
        console.log('\n✨ COMMERCIAL STATUS VERIFIED. Ready for Monetization.');
        process.exit(0);
    } else {
        console.error('\n⚠️ COMMERCIAL CHECKS FAILED.');
        process.exit(1);
    }
}

verifyCommercial();
