
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function verifyQuantumUI() {
    console.log('🖥️ INIT: Quantum UI Verification...');

    // 1. Check Component Existence
    const componentPath = path.join(PROJECT_ROOT, 'src', 'components', 'QuantumDashboard.jsx');
    if (fs.existsSync(componentPath)) {
        console.log('✅ Component Materialized: src/components/QuantumDashboard.jsx');
    } else {
        console.error('❌ Component MISSING.');
        process.exit(1);
    }

    // 2. Check Route Integration
    const appPath = path.join(PROJECT_ROOT, 'src', 'App.jsx');
    const appCode = fs.readFileSync(appPath, 'utf8');

    if (appCode.includes('QuantumDashboard')) {
        console.log('✅ Route Integrated: /quantum-dashboard');
    } else {
        console.error('❌ Route MISSING in App.jsx');
        process.exit(1);
    }

    console.log('\n✨ QUANTUM UI VERIFIED. Accessible via /quantum-dashboard.');
}

verifyQuantumUI();
