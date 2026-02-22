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

    const lintHotspots = collectLintHotspots();
    const recentCommitHotspots = collectRecentCommitHotspots();
    const pulseHistory = loadPulseHistory();
    const previousDirective = pulseHistory.length > 0 ? pulseHistory[pulseHistory.length - 1]?.directive : undefined;

    const dynamicOptions = buildEvolutionOptions({ lintHotspots, recentCommitHotspots, previousDirective });

    const question = `Analyze the current project state and recent evolution.
    Git History:
    ${gitHistory}
    
    Project Map:
    ${projectMap}

    Lint Hotspots:
    ${lintHotspots.join(', ') || 'none detected'}

    Commit Hotspots:
    ${recentCommitHotspots.join(', ') || 'none detected'}

    Previous Directive:
    ${previousDirective || 'none'}
    
    Select a focus that maximizes net progress and novelty.
    Prefer a different domain than the previous directive unless there is critical regression risk.
    Which evolutionary focus should the Swarm prioritize next?`;

    console.log('🔮 [RealityPulse] Consulting Iron Brain for evolutionary directive...');
    const guidance = await quantumCore.consultOracle(question, dynamicOptions);

    console.log(`✨ [RealityPulse] Directive: ${guidance.recommendation}`);
    console.log(`📊 [RealityPulse] Confidence: ${(guidance.confidence * 100).toFixed(1)}%`);

    // Persist basic pulse to memory
    const pulsePath = path.join(PROJECT_ROOT, 'src/data/reality_pulse.json');
    const pulseData = {
        timestamp: new Date().toISOString(),
        git_last_commit: gitHistory.split('\n')[0],
        directive: guidance.recommendation,
        confidence: guidance.confidence,
        reasoning: (guidance as any).reasoning || 'No details provided',
        options_considered: dynamicOptions,
        lint_hotspots: lintHotspots,
        commit_hotspots: recentCommitHotspots,
        previous_directive: previousDirective || null,
        novelty_shift: previousDirective && previousDirective !== guidance.recommendation
    };

    fs.writeFileSync(pulsePath, JSON.stringify(pulseData, null, 2));
    persistPulseHistory(pulseData);
    console.log(`✅ [RealityPulse] Reality Pulse persisted to: ${pulsePath}`);
}

type PulseHistoryEntry = {
    timestamp: string;
    directive: string;
    confidence: number;
};

function loadPulseHistory(): PulseHistoryEntry[] {
    const historyPath = path.join(PROJECT_ROOT, 'src/data/reality_pulse_history.json');
    if (!fs.existsSync(historyPath)) return [];

    try {
        const parsed = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function persistPulseHistory(entry: Record<string, any>) {
    const historyPath = path.join(PROJECT_ROOT, 'src/data/reality_pulse_history.json');
    const history = loadPulseHistory();

    history.push({
        timestamp: entry.timestamp,
        directive: entry.directive,
        confidence: entry.confidence
    });

    const compactHistory = history.slice(-30);
    fs.writeFileSync(historyPath, JSON.stringify(compactHistory, null, 2));
}

function collectLintHotspots(): string[] {
    const lintPath = path.join(PROJECT_ROOT, 'lint_output.json');
    if (!fs.existsSync(lintPath)) return [];

    try {
        const parsed = JSON.parse(fs.readFileSync(lintPath, 'utf8'));
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter((entry: any) => entry?.errorCount > 0 || entry?.warningCount > 0)
            .sort((a: any, b: any) => (b.errorCount + b.warningCount) - (a.errorCount + a.warningCount))
            .slice(0, 4)
            .map((entry: any) => entry.filePath?.replace(`${PROJECT_ROOT}/`, ''))
            .filter(Boolean);
    } catch {
        return [];
    }
}

function collectRecentCommitHotspots(): string[] {
    try {
        const output = execSync('git log -n 15 --name-only --pretty=format:', { cwd: PROJECT_ROOT, encoding: 'utf8' });
        const counts = new Map<string, number>();

        output
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .forEach(file => {
                counts.set(file, (counts.get(file) ?? 0) + 1);
            });

        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([file]) => file);
    } catch {
        return [];
    }
}

function buildEvolutionOptions(input: {
    lintHotspots: string[];
    recentCommitHotspots: string[];
    previousDirective?: string;
}): string[] {
    const baseOptions = [
        'Recursive self-optimization of local inference (Neural Bridge)',
        'Autonomous feature generation for the Sovereign UI',
        "Deep hardening of the Quantum Engine's resilience",
        'Expansion of the P2P resonance and decentralized coordination'
    ];

    const hotspotOptions = [
        input.lintHotspots[0] ? `Targeted lint and complexity healing in ${input.lintHotspots[0]}` : null,
        input.recentCommitHotspots[0] ? `Stabilize high-churn zone ${input.recentCommitHotspots[0]} with tests and safeguards` : null
    ].filter(Boolean) as string[];

    const options = [...baseOptions, ...hotspotOptions];

    const withoutPrevious = options.filter(option => option !== input.previousDirective);
    return withoutPrevious.length >= 4 ? withoutPrevious : options;
}

harvestReality().catch(console.error);
