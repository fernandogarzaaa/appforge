/**
 * DevOpsSwarm - Infrastructure automation and deployment readiness intelligence.
 */

import * as fs from 'fs/promises';
import path from 'path';
import { QuantumSwarmCore } from '../core/quantum_core.js';
import { memory } from '../core/persistent_memory.js';
import { swarmCollaboration } from '../core/swarm_collaboration.js';
import {
    CiHealthCell,
    DeploySafetyCell,
    type DevOpsCheck,
    ObservabilityCell
} from './internal/devops_cells.js';

interface DevOpsAction {
    action: string;
    confidence: number;
    recommendation: string;
}

interface DevOpsReport {
    timestamp: string;
    checks: DevOpsCheck[];
    action: DevOpsAction;
}

export class DevOpsSwarm {
    private quantumCore: QuantumSwarmCore;
    private reportPath: string;
    private latestReport: DevOpsReport | null;
    private ciHealthCell: CiHealthCell;
    private deploySafetyCell: DeploySafetyCell;
    private observabilityCell: ObservabilityCell;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
        this.reportPath = path.join(process.cwd(), 'swarm', 'data', 'devops_swarm_report.json');
        this.latestReport = null;
        this.ciHealthCell = new CiHealthCell();
        this.deploySafetyCell = new DeploySafetyCell();
        this.observabilityCell = new ObservabilityCell();
    }

    async runCycle(): Promise<DevOpsReport> {
        console.log('🛠️ [DevOpsSwarm] Starting infrastructure readiness cycle...');
        console.log('   🧩 Internal cells: ci_health_cell -> deploy_safety_cell -> observability_cell');

        const checks = await this.runChecks();
        const action = await this.selectAction(checks);

        const report: DevOpsReport = {
            timestamp: new Date().toISOString(),
            checks,
            action
        };

        await this.persistReport(report);
        await memory.set('devops_swarm:last_report', report, 60 * 60 * 24 * 7);

        await swarmCollaboration.sendSignal({
            fromAgent: 'DevOpsSwarm',
            toAgent: 'ProductOwner',
            type: 'FINDING',
            payload: {
                type: 'DEVOPS_SWARM_REPORT',
                action: report.action.recommendation,
                checks: report.checks
            },
            priority: 'MEDIUM'
        });

        await swarmCollaboration.sendSignal({
            fromAgent: 'DevOpsSwarm',
            toAgent: 'QualityAssuranceSwarm',
            type: 'FINDING',
            payload: {
                type: 'DEVOPS_QA_HANDOFF',
                action: report.action.recommendation
            },
            priority: 'MEDIUM'
        });

        this.latestReport = report;
        console.log(`✅ [DevOpsSwarm] Cycle complete | Recommendation: ${report.action.recommendation}`);

        return report;
    }

    getLatestReport(): DevOpsReport | null {
        return this.latestReport;
    }

    private async runChecks(): Promise<DevOpsCheck[]> {
        const workflowDir = path.join(process.cwd(), '.github', 'workflows');
        const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
        const pm2ConfigPath = path.join(process.cwd(), 'ecosystem.config.cjs');
        const deployScriptPath = path.join(process.cwd(), 'scripts', 'deploy_swarm.js');
        const qaReportPath = path.join(process.cwd(), 'swarm', 'data', 'qa_swarm_report.json');

        const [ciCheck, deployCheck, observabilityCheck] = await Promise.all([
            this.ciHealthCell.run(workflowDir),
            this.deploySafetyCell.run([dockerfilePath, pm2ConfigPath, deployScriptPath]),
            this.observabilityCell.run(qaReportPath)
        ]);

        return [ciCheck, deployCheck, observabilityCheck];
    }

    private async selectAction(checks: DevOpsCheck[]): Promise<DevOpsAction> {
        const critical = checks.filter((check) => check.status === 'critical').length;
        const warnings = checks.filter((check) => check.status === 'warning').length;

        const decision = await this.quantumCore.consultOracle(
            `DevOps readiness snapshot: critical=${critical}, warnings=${warnings}. Which immediate action should we take?`,
            [
                'Harden CI/CD with stricter pipeline gates and rollback checks',
                'Improve deployment reliability with environment verification and runbooks',
                'Expand observability and incident response automation',
                'Optimize infrastructure cost and resource allocation'
            ],
            ['reliability', 'deployment_safety', 'execution_speed', 'operational_resilience']
        );

        await this.quantumCore.reportOutcome(decision.predictionId, true, {
            source: 'devops_swarm_action_selection',
            critical,
            warnings
        });

        return {
            action: decision.recommendation,
            confidence: decision.confidence,
            recommendation: decision.recommendation
        };
    }

    private async persistReport(report: DevOpsReport): Promise<void> {
        await fs.mkdir(path.dirname(this.reportPath), { recursive: true });
        await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2), 'utf8');
    }
}
