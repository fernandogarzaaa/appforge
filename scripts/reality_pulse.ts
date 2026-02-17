import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import quantumCore from '../swarm/core/quantum_core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables manually to avoid dependency issues in some CI envs
const envPath = path.resolve(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.startsWith('#')) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function harvestReality() {
    console.log('🌍 [RealityPulse] Harvesting Reality Injection 2.0...');

    let gitHistory = 'No git history available';
    try {
        gitHistory = execSync('git log -n 10 --oneline', { cwd: PROJECT_ROOT, encoding: 'utf8' });
    } catch (e) {
        console.warn('⚠️ [RealityPulse] Git history harvest failed.');
    }

    let projectMap = 'No project map available';
    try {
        // Simple directory tree of src and swarm
        const srcFiles = fs.readdirSync(path.join(PROJECT_ROOT, 'src')).slice(0, 10).join(', ');
        const swarmFiles = fs.readdirSync(path.join(PROJECT_ROOT, 'swarm')).slice(0, 10).join(', ');
        projectMap = `src: [${srcFiles}], swarm: [${swarmFiles}]`;
    } catch (e) {
        console.warn('⚠️ [RealityPulse] Project map harvest failed.');
    }

    const question = `Analyze the current project state and recent evolution. 
    Git History:
    ${gitHistory}
    
    Project Map:
    ${projectMap}
    
    Which evolutionary focus should the Swarm prioritize next?`;

    const options = [
        "Recursive self-optimization of local inference (Neural Bridge)",
        "Autonomous feature generation for the Sovereign UI",
        "Deep hardening of the Quantum Engine's resilience",
        "Expansion of the P2P resonance and decentralized coordination"
    ];

    console.log('🔮 [RealityPulse] Consulting Iron Brain for evolutionary directive...');
    const guidance = await quantumCore.consultOracle(question, options);

    console.log(`✨ [RealityPulse] Directive: ${guidance.recommendation}`);
    console.log(`📊 [RealityPulse] Confidence: ${(guidance.confidence * 100).toFixed(1)}%`);

    // Persist basic pulse to memory
    const pulsePath = path.join(PROJECT_ROOT, 'src/data/reality_pulse.json');
    const pulseData = {
        timestamp: new Date().toISOString(),
        git_last_commit: gitHistory.split('\n')[0],
        directive: guidance.recommendation,
        confidence: guidance.confidence,
        reasoning: (guidance as any).reasoning || 'No details provided'
    };

    fs.writeFileSync(pulsePath, JSON.stringify(pulseData, null, 2));
    console.log(`✅ [RealityPulse] Reality Pulse persisted to: ${pulsePath}`);
}

harvestReality().catch(console.error);
