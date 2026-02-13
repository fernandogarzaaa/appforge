import fs from 'fs';
import path from 'path';

const signalsPath = path.join(process.cwd(), 'src/data/swarm_signals.json');
const missionPath = path.join(process.cwd(), 'swarm/data/missions/optimize_appforge.json');

const mission = JSON.parse(fs.readFileSync(missionPath, 'utf8'));

const signals = JSON.parse(fs.readFileSync(signalsPath, 'utf8') || '[]');

const newSignal = {
    id: `sig_${Date.now()}_optimization`,
    fromAgent: 'Antigravity_Coordinator',
    toAgent: 'ALL',
    type: 'TASK',
    payload: {
        mission: 'OPTIMIZE_APPFORGE_WEB_APP',
        details: mission,
        priority: 'HIGH'
    },
    timestamp: new Date().toISOString(),
    status: 'PENDING',
    priority: 'HIGH'
};

signals.push(newSignal);

fs.writeFileSync(signalsPath, JSON.stringify(signals, null, 2));
console.log('📡 Signal injected: OPTIMIZE_APPFORGE_WEB_APP');
