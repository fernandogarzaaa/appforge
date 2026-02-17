import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
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
     * Monitors Market signals (Solana/Crypto simulation)
     */
    private async scanMarket() {
        // In a real implementation, this would call DEX APIs or Price Oracles
        // For Phase 73, we simulate a "Volatility Signal"
        const volatility = Math.random();
        if (volatility > 0.8) {
            this.signals.push({
                source: 'market',
                type: 'HIGH_VOLATILITY',
                intensity: volatility,
                payload: { asset: 'SOL', delta: 0.15 },
                timestamp: new Date().toISOString()
            });
            console.log(`   📈 [Market] High volatility detected (${(volatility * 100).toFixed(1)}%)`);
        }

        // 🧠 [CURIOSITY] Phase 84: Market Novelty / Trend Discovery
        // Simulating detection of GitHub trending or AI paper drops
        const curiositySignal = Math.random();
        if (curiositySignal > 0.9) {
            this.signals.push({
                source: 'market',
                type: 'MARKET_NOVELTY',
                intensity: curiositySignal,
                payload: { trend: 'Kimi K2.5 Adaptation', value: 'High' },
                timestamp: new Date().toISOString()
            });
            console.log(`   🌟 [Curiosity] Market Novelty detected (${(curiositySignal * 100).toFixed(1)}%)`);
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
