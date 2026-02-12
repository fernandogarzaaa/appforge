import * as fs from 'fs/promises';

export interface DevOpsCheck {
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    details: string;
}

/**
 * ci_health_cell
 * Audits CI workflow coverage and reports structural readiness.
 */
export class CiHealthCell {
    async run(workflowDir: string): Promise<DevOpsCheck> {
        try {
            const files = await fs.readdir(workflowDir);
            const workflowCount = files.filter((name) => name.endsWith('.yml') || name.endsWith('.yaml')).length;
            return {
                name: 'ci_workflows',
                status: workflowCount >= 2 ? 'healthy' : 'warning',
                details: `${workflowCount} workflow files detected`
            };
        } catch {
            return {
                name: 'ci_workflows',
                status: 'critical',
                details: 'No GitHub workflow directory found'
            };
        }
    }
}

/**
 * deploy_safety_cell
 * Verifies deployment prerequisites (docker, process manager, deploy script).
 */
export class DeploySafetyCell {
    async run(artifactPaths: string[]): Promise<DevOpsCheck> {
        const checks = await Promise.all(artifactPaths.map((targetPath) => this.exists(targetPath)));
        const readyArtifacts = checks.filter(Boolean).length;
        return {
            name: 'deployment_artifacts',
            status: readyArtifacts === artifactPaths.length ? 'healthy' : readyArtifacts >= 2 ? 'warning' : 'critical',
            details: `${readyArtifacts}/${artifactPaths.length} required deployment artifacts present`
        };
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

/**
 * observability_cell
 * Reads QA gate artifact to assess reliability visibility.
 */
export class ObservabilityCell {
    async run(qaReportPath: string): Promise<DevOpsCheck> {
        try {
            const raw = await fs.readFile(qaReportPath, 'utf8');
            const qa = JSON.parse(raw) as { gatePassed?: boolean; passed?: number; failed?: number };
            return {
                name: 'qa_gate',
                status: qa.gatePassed ? 'healthy' : 'warning',
                details: `QA gate passed=${Boolean(qa.gatePassed)} (${qa.passed ?? 0} passed / ${qa.failed ?? 0} failed)`
            };
        } catch {
            return {
                name: 'qa_gate',
                status: 'warning',
                details: 'No QA gate report available yet'
            };
        }
    }
}
