import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

export interface EnvironmentSignal {
    source: 'github' | 'market' | 'system' | 'synergy';
    type: string;
    intensity: number; // 0.0 to 1.0
    payload: any;
    timestamp: string;
}

export class RealitySensor {
    private signals: EnvironmentSignal[] = [];

    /**
     * Scans the environment for signals across all mesh nodes.
     */
    async scan(): Promise<EnvironmentSignal[]> {
        console.log('📡 [RealitySensor] Scanning Quantum Mesh environment...');
        this.signals = [];

        try {
            await Promise.all([
                this.scanGitHub(),
                this.scanMarket(),
                this.scanSystem(),
                this.scanCI(),
                this.scanSynergy()
            ]);
        } catch (error) {
            console.error('   ❌ [RealitySensor] Scan error:', (error as any).message);
        }

        return this.signals;
    }

    /**
     * Monitors GitHub activity (Local Git state for now)
     */
    private async scanGitHub() {
        try {
            // Check for uncommitted changes or recent commits
            // NOISE FILTER: Wrap in try-catch and sanitize output
            let status = '';
            try {
                const output = execSync('git status --short', { cwd: PROJECT_ROOT, encoding: 'utf8' });
                // Filter out non-text noise or known shell errors
                status = output.replace(/.*Unexpected token.*/g, '').trim();
            } catch (innerError) {
                // If git fails entirely (e.g. not a repo), just ignore
                return;
            }

            if (status.length > 0) {
                this.signals.push({
                    source: 'github',
                    type: 'UNCOMMITTED_CHANGES',
                    intensity: 0.6,
                    payload: { files: status.split('\n').filter(s => s.trim().length > 0) },
                    timestamp: new Date().toISOString()
                });
            }

            // Check for new branches or tags (simulation)
            console.log('   🔍 [GitHub] Monitoring repository health...');
        } catch (e) {
            console.warn('   ⚠️ [GitHub] Reality sync unavailable (Non-git environment)');
        }
    }

    /**
     * Monitors Market signals (Real Solana telemetry)
     */
    private async scanMarket() {
        try {
            const { getSOLPrice } = await import('../integrations/jupiter.js');
            const price = await getSOLPrice();

            // Volatility is derived from historical divergence if we had it, 
            // for now we use the price itself as an intensity anchor.
            this.signals.push({
                source: 'market',
                type: 'SOL_PRICE_PULSE',
                intensity: Math.min(price / 500, 1.0), // Intensity scaled to price
                payload: { asset: 'SOL', priceUsd: price },
                timestamp: new Date().toISOString()
            });
            console.log(`   📈 [Market] Real SOL Price: $${price.toFixed(2)}`);
        } catch (e) {
            console.warn('   ⚠️ [Market] Failed to fetch real SOL price.');
        }

        // Hardware-Anchored Telemetry (Phase 135)
        try {
            const os = await import('os');
            const load = os.loadavg()[0]; // 1-minute load average
            const freeMem = os.freemem() / os.totalmem();

            if (load > 2.0 || freeMem < 0.1) {
                this.signals.push({
                    source: 'system',
                    type: 'HARDWARE_STRESS',
                    intensity: Math.min(load / 8.0, 1.0),
                    payload: { load, freeMemPct: freeMem * 100 },
                    timestamp: new Date().toISOString()
                });
                console.log(`   🔋 [System] Hardware Stress detected: Load=${load.toFixed(2)}`);
            }
        } catch (e) {
            // OS telemetry unavailable
        }
    }

    /**
     * Monitors System telemetry (Performance/Errors)
     */
    private async scanSystem() {
        const buildLogPath = path.join(PROJECT_ROOT, 'build_logs.txt');
        const lintPath = path.join(PROJECT_ROOT, 'lint_output.json');

        if (fs.existsSync(buildLogPath)) {
            const logs = fs.readFileSync(buildLogPath, 'utf8').toLowerCase();
            if (logs.includes('error') || logs.includes('failed')) {
                this.signals.push({
                    source: 'system',
                    type: 'BUILD_FAILURE',
                    intensity: 0.9,
                    payload: { snippet: 'Build process encountered fatal errors.' },
                    timestamp: new Date().toISOString()
                });
            }
        }

        if (fs.existsSync(lintPath)) {
            try {
                const lint = JSON.parse(fs.readFileSync(lintPath, 'utf8'));
                if (lint.length > 10) {
                    this.signals.push({
                        source: 'system',
                        type: 'DEBT_ACCUMULATION',
                        intensity: 0.7,
                        payload: { count: lint.length },
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (e) {
                console.warn('   ⚠️ [RealitySensor] Failed to parse lint output:', (e as any).message);
            }
        }
    }

    /**
     * Monitors CI environment signals (GitHub Actions)
     */
    private async scanCI() {
        if (process.env.GITHUB_ACTIONS === 'true') {
            this.signals.push({
                source: 'system',
                type: 'CI_ACTIVE',
                intensity: 0.5,
                payload: {
                    runId: process.env.GITHUB_RUN_ID,
                    event: process.env.GITHUB_EVENT_NAME,
                    actor: process.env.GITHUB_ACTOR
                },
                timestamp: new Date().toISOString()
            });
            console.log(`   🤖 [CI] Active Run detected: ${process.env.GITHUB_RUN_ID}`);
        }
    }

    getSignals(): EnvironmentSignal[] {
        return this.signals;
    }

    /**
     * Identifies "Critical Red Flags" for immediate transcendence
     */
    hasCriticalEvent(): boolean {
        return this.signals.some(s => s.intensity > 0.85);
    }

    /**
     * Monitors harvested synergy patterns from GitHub
     */
    private async scanSynergy() {
        const synergyPath = path.join(PROJECT_ROOT, 'src/data/synergy_scout.json');
        if (fs.existsSync(synergyPath)) {
            try {
                const results = JSON.parse(fs.readFileSync(synergyPath, 'utf8'));
                if (Array.isArray(results) && results.length > 0) {
                    // Emit a signal for the most recent or highest-star repo
                    const topRepo = results.sort((a, b) => (b.stars || 0) - (a.stars || 0))[0];

                    this.signals.push({
                        source: 'synergy',
                        type: 'SYNERGY_HARVESTED',
                        intensity: 0.85,
                        payload: topRepo,
                        timestamp: new Date().toISOString()
                    });

                    console.log(`    telescope [Synergy] Harvested Pattern: ${topRepo.name} (${topRepo.stars} stars)`);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }
}

export const realitySensor = new RealitySensor();
