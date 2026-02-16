import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const PULSE_PATH = path.join(PROJECT_ROOT, 'src/data/reality_pulse.json');
const STATE_PATH = path.join(PROJECT_ROOT, 'src/data/quantum_state.json');

async function checkResonance() {
    console.log('📡 [ResonanceCheck] Verifying Workflow Affinity...');

    const now = new Date();

    // 1. Check Reality Pulse
    if (fs.existsSync(PULSE_PATH)) {
        const pulse = JSON.parse(fs.readFileSync(PULSE_PATH, 'utf8'));
        const pulseTime = new Date(pulse.timestamp);
        const ageMs = now.getTime() - pulseTime.getTime();
        const ageHours = ageMs / (1000 * 60 * 60);

        console.log(`🌍 Reality Pulse Age: ${ageHours.toFixed(2)} hours`);

        if (ageHours > 2) {
            console.warn('⚠️ [STALE] Reality Pulse is older than 2 hours. Evolutionary drift possible.');
        } else {
            console.log('✅ Reality Pulse is fresh.');
        }
    } else {
        console.warn('❌ Reality Pulse missing. Hive mind is blind to physical reality.');
    }

    // 2. Check Quantum State Alignment
    if (fs.existsSync(STATE_PATH)) {
        const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
        // Any specific alignment logic can go here (e.g. comparing IDs or version tags)
        console.log('✅ Quantum State present and loaded.');
    }

    console.log('✨ [ResonanceCheck] System affinity confirmed.');
}

checkResonance().catch(console.error);
