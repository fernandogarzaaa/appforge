/**
 * ComplianceSwarm - Policy, legal, and security governance automation.
 */

import * as fs from 'fs/promises';
import path from 'path';
import { QuantumSwarmCore } from '../core/quantum_core.js';
import { memory } from '../core/persistent_memory.js';
import { swarmCollaboration } from '../core/swarm_collaboration.js';

interface ComplianceCheck {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    details: string;
}

interface ComplianceReport {
    timestamp: string;
    checks: ComplianceCheck[];
    recommendation: string;
    confidence: number;
}

export class ComplianceSwarm {
    private quantumCore: QuantumSwarmCore;
    private reportPath: string;
    private latestReport: ComplianceReport | null;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
        this.reportPath = path.join(process.cwd(), 'swarm', 'data', 'compliance_swarm_report.json');
        this.latestReport = null;
    }

    async runCycle(): Promise<ComplianceReport> {
        console.log('🛡️ [ComplianceSwarm] Starting compliance governance cycle...');

        const checks = await this.runChecks();
        const recommendation = await this.getRecommendation(checks);

        const report: ComplianceReport = {
            timestamp: new Date().toISOString(),
            checks,
            recommendation: recommendation.recommendation,
            confidence: recommendation.confidence
        };

        await this.persistReport(report);
        await memory.set('compliance_swarm:last_report', report, 60 * 60 * 24 * 7);

        await swarmCollaboration.sendSignal({
            fromAgent: 'ComplianceSwarm',
            toAgent: 'ProductOwner',
            type: 'FINDING',
            payload: {
                type: 'COMPLIANCE_REPORT',
                recommendation: report.recommendation,
                checks: report.checks
            },
            priority: 'MEDIUM'
        });

        await swarmCollaboration.sendSignal({
            fromAgent: 'ComplianceSwarm',
            toAgent: 'QualityAssuranceSwarm',
            type: 'FINDING',
            payload: {
                type: 'COMPLIANCE_QA_HANDOFF',
                recommendation: report.recommendation
            },
            priority: 'MEDIUM'
        });

        this.latestReport = report;
        console.log(`✅ [ComplianceSwarm] Cycle complete | Recommendation: ${report.recommendation}`);

        return report;
    }

    getLatestReport(): ComplianceReport | null {
        return this.latestReport;
    }

    private async runChecks(): Promise<ComplianceCheck[]> {
        const checks: ComplianceCheck[] = [];

        // Check policy/legal artifacts
        const requiredDocs = [
            'LICENSE',
            'NOTICE',
            'LICENSES.md',
            'README.md'
        ];
        let presentDocs = 0;
        for (const doc of requiredDocs) {
            if (await this.exists(path.join(process.cwd(), doc))) {
                presentDocs++;
            }
        }
        checks.push({
            name: 'policy_docs',
            status: presentDocs === requiredDocs.length ? 'pass' : presentDocs >= 2 ? 'warn' : 'fail',
            details: `${presentDocs}/${requiredDocs.length} core policy/legal docs present`
        });

        // Check environment hygiene
        const envExamplePath = path.join(process.cwd(), '.env.example');
        const envLocalPath = path.join(process.cwd(), '.env.local');
        const envExampleExists = await this.exists(envExamplePath);
        const envLocalExists = await this.exists(envLocalPath);
        checks.push({
            name: 'env_hygiene',
            status: envExampleExists && envLocalExists ? 'pass' : envExampleExists ? 'warn' : 'fail',
            details: `.env.example=${envExampleExists} | .env.local=${envLocalExists}`
        });

        // Check security workflow presence
        const workflowDir = path.join(process.cwd(), '.github', 'workflows');
        let hasSecurityWorkflow = false;
        try {
            const workflows = await fs.readdir(workflowDir);
            hasSecurityWorkflow = workflows.some((name) => name.toLowerCase().includes('security') || name.toLowerCase().includes('scan'));
        } catch {
            hasSecurityWorkflow = false;
        }
        checks.push({
            name: 'security_workflow',
            status: hasSecurityWorkflow ? 'pass' : 'warn',
            details: hasSecurityWorkflow ? 'Security/scanning workflow detected' : 'No explicit security workflow detected'
        });

        return checks;
    }

    private async getRecommendation(checks: ComplianceCheck[]) {
        const failCount = checks.filter((check) => check.status === 'fail').length;
        const warnCount = checks.filter((check) => check.status === 'warn').length;

        const decision = await this.quantumCore.consultOracle(
            `Compliance posture review: fail=${failCount}, warn=${warnCount}. What should be the immediate compliance action?`,
            [
                'Enforce compliance gate in CI and block non-compliant releases',
                'Harden secrets policy and environment governance',
                'Expand audit logging and change-management traceability',
                'Prioritize legal/policy documentation remediation'
            ],
            ['risk_reduction', 'auditability', 'operational_feasibility', 'security']
        );

        await this.quantumCore.reportOutcome(decision.predictionId, true, {
            source: 'compliance_swarm_recommendation',
            failCount,
            warnCount
        });

        return decision;
    }

    private async persistReport(report: ComplianceReport): Promise<void> {
        await fs.mkdir(path.dirname(this.reportPath), { recursive: true });
        await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2), 'utf8');
    }

    private async exists(targetPath: string): Promise<boolean> {
        try {
            await fs.access(targetPath);
            return true;
        } catch {
            return false;
        }
    }
}

