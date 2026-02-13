import fs from 'fs';
import path from 'path';

const SIGNALS_FILE = path.join(process.cwd(), 'src/data/swarm_signals.json');
const MISSION_FILE = path.join(process.cwd(), 'swarm/data/missions/sovereign_ecosystem.json');

async function injectSovereignSignal() {
    console.log('⏳ [Sovereign] Initializing mission injection...');

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            if (!fs.existsSync(MISSION_FILE)) {
                console.error('❌ [Sovereign] Mission file not found:', MISSION_FILE);
                return;
            }

            const mission = JSON.parse(fs.readFileSync(MISSION_FILE, 'utf8'));
            let signals = [];

            if (fs.existsSync(SIGNALS_FILE)) {
                const content = fs.readFileSync(SIGNALS_FILE, 'utf8').trim();
                if (content) {
                    try {
                        signals = JSON.parse(content);
                    } catch (e) {
                        console.warn(`⚠️ [Sovereign] Signal file corrupted (Attempt ${attempt}), resetting...`);
                        signals = [];
                    }
                }
            }

            const newSignal = {
                id: `mission_${Date.now()}`,
                type: 'MISSION_DIRECTIVE',
                fromAgent: 'ADMIN_OVERRIDE',
                toAgent: 'ALL',
                payload: {
                    mission_id: mission.mission_id,
                    directive: mission.directive,
                    targets: mission.targets,
                    constraints: mission.constraints
                },
                timestamp: new Date().toISOString(),
                status: 'PENDING'
            };

            signals.push(newSignal);
            fs.writeFileSync(SIGNALS_FILE, JSON.stringify(signals, null, 2));
            console.log('🌌 [Sovereign] Mission signal "SOVEREIGN_AI_ECOSYSTEM" injected successfully.');
            console.log(`🚀 Directive: ${mission.directive}`);
            return; // Success
        } catch (error) {
            console.error(`❌ [Sovereign] Error (Attempt ${attempt}):`, error.message);
            if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

injectSovereignSignal();
