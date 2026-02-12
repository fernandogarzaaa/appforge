/**
 * QualityAssuranceSwarm - Regression prevention and reliability gates.
 *
 * Performs automated health gates:
 * - strict intelligence benchmark
 * - oracle report pipeline check
 * - report artifact integrity validation
 */

import * as fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { memory } from '../core/persistent_memory.js';
import { swarmCollaboration } from '../core/swarm_collaboration.js';

const execAsync = promisify(exec);

interface GateResult {
    name: string;
    passed: boolean;
    summary: string;
}

interface QASwarmReport {
    timestamp: string;
    gatePassed: boolean;
    passed: number;
    failed: number;
    results: GateResult[];
}

export class QualityAssuranceSwarm {
    private reportPath: string;
    private latestReport: QASwarmReport | null;

    constructor() {
        this.reportPath = path.join(process.cwd(), 'swarm', 'data', 'qa_swarm_report.json');
        this.latestReport = null;
    }

    async runCycle(): Promise<QASwarmReport> {
        console.log('🧪 [QualityAssuranceSwarm] Starting reliability gates...');

        const results: GateResult[] = [];

        // Gate 1: Strict benchmark
        const benchmark = await this.runCommand('npm', ['run', 'swarm:benchmark', '--', '--strict'], 240000);
        const benchmarkReport = await this.readJson(path.join(process.cwd(), 'swarm', 'benchmarks', 'latest_intelligence_report.json'));
        const benchmarkPassed = Boolean(benchmarkReport?.overall?.passed);
        const benchmarkVerdict = String(benchmarkReport?.overall?.verdict || 'UNKNOWN');
        results.push({
            name: 'strict_benchmark',
            passed: benchmark.ok && benchmarkPassed,
            summary: benchmark.ok
                ? `Strict benchmark executed successfully (verdict=${benchmarkVerdict})`
                : benchmark.summary
        });

        // Gate 2: Oracle report pipeline
        const oracle = await this.runCommand('npm', ['run', 'swarm:oracle:report'], 180000);
        results.push({
            name: 'oracle_reporting_pipeline',
            passed: oracle.ok && oracle.output.includes('benchmark reported to Oracle memory'),
            summary: oracle.ok ? 'Oracle report pipeline healthy' : oracle.summary
        });

        // Gate 3: Swarms must be defined as multi-agent collectives
        const collectiveAudit = await this.runCommand('npm', ['run', 'swarm:audit:collectives'], 120000);
        results.push({
            name: 'swarm_collective_integrity',
            passed: collectiveAudit.ok && collectiveAudit.output.includes('PASS: all swarm classes have multi-agent collective definitions.'),
            summary: collectiveAudit.ok ? 'Swarm collective definitions verified' : collectiveAudit.summary
        });

        // Gate 4: Required artifacts are valid JSON
        const artifactPaths = [
            path.join(process.cwd(), 'swarm', 'benchmarks', 'latest_intelligence_report.json'),
            path.join(process.cwd(), 'swarm', 'benchmarks', 'oracle_from_benchmark_latest.json'),
            path.join(process.cwd(), 'swarm', 'data', 'learning_swarm_report.json'),
            path.join(process.cwd(), 'swarm', 'data', 'research_swarm_report.json'),
            path.join(process.cwd(), 'swarm', 'data', 'voice_swarm_report.json'),
            path.join(process.cwd(), 'swarm', 'data', 'customer_success_swarm_report.json'),
            path.join(process.cwd(), 'swarm', 'data', 'devops_swarm_report.json'),
            path.join(process.cwd(), 'swarm', 'data', 'knowledge_graph_swarm_report.json'),
            path.join(process.cwd(), 'swarm', 'data', 'compliance_swarm_report.json'),
            path.join(process.cwd(), 'swarm', 'data', 'experimentation_swarm_report.json'),
            path.join(process.cwd(), 'swarm', 'data', 'ai_economy_swarm_report.json')
        ];

        const artifactChecks = await Promise.all(artifactPaths.map((artifactPath) => this.validateJsonArtifact(artifactPath)));
        const missing = artifactChecks.filter((check) => !check.valid).map((check) => path.basename(check.path));
        results.push({
            name: 'artifact_integrity',
            passed: missing.length === 0,
            summary: missing.length === 0
                ? `Validated ${artifactChecks.length} JSON artifacts`
                : `Invalid/missing: ${missing.join(', ')}`
        });

        const passed = results.filter((result) => result.passed).length;
        const failed = results.length - passed;
        const gatePassed = failed === 0;

        const report: QASwarmReport = {
            timestamp: new Date().toISOString(),
            gatePassed,
            passed,
            failed,
            results
        };

        await this.persistReport(report);
        await memory.set('qa_swarm:last_report', report, 60 * 60 * 24 * 7);

        if (gatePassed) {
            await swarmCollaboration.sendSignal({
                fromAgent: 'QualityAssuranceSwarm',
                toAgent: 'GodMode',
                type: 'FINDING',
                payload: {
                    type: 'QA_GATE_PASS',
                    passed,
                    failed
                },
                priority: 'MEDIUM'
            });
        } else {
            await swarmCollaboration.sendAlert(
                'QualityAssuranceSwarm',
                `QA gate failed: ${failed} checks failing`,
                'HIGH'
            );
        }

        this.latestReport = report;
        console.log(`✅ [QualityAssuranceSwarm] Cycle complete | Passed: ${passed}/${results.length}`);

        return report;
    }

    getLatestReport(): QASwarmReport | null {
        return this.latestReport;
    }

    private async runCommand(
        cmd: string,
        args: string[],
        timeoutMs: number
    ): Promise<{ ok: boolean; output: string; summary: string }> {
        const command = [cmd, ...args].join(' ');
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: process.cwd(),
                timeout: timeoutMs,
                maxBuffer: 1024 * 1024 * 10
            });
            const output = `${stdout}\n${stderr}`;
            return { ok: true, output, summary: 'ok' };
        } catch (error: any) {
            const stdout = String(error?.stdout || '');
            const stderr = String(error?.stderr || error?.message || 'command_failed');
            return { ok: false, output: `${stdout}\n${stderr}`, summary: stderr.slice(0, 300) };
        }
    }

    private async validateJsonArtifact(artifactPath: string): Promise<{ path: string; valid: boolean }> {
        try {
            const raw = await fs.readFile(artifactPath, 'utf8');
            JSON.parse(raw);
            return { path: artifactPath, valid: true };
        } catch {
            return { path: artifactPath, valid: false };
        }
    }

    private async persistReport(report: QASwarmReport): Promise<void> {
        await fs.mkdir(path.dirname(this.reportPath), { recursive: true });
        await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2), 'utf8');
    }

    private async readJson(targetPath: string): Promise<any | null> {
        try {
            const raw = await fs.readFile(targetPath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
}
