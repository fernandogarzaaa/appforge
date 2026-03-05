import fs from 'fs/promises';
import path from 'path';

export interface RegistryAgent {
    name: string;
    purpose: string;
    workflow: string;
    capabilities: string[];
}

export interface AgentRegistry {
    agents: RegistryAgent[];
}

export type KnownIssueType =
    | 'repeated_test_failures'
    | 'performance_regression'
    | 'dependency_issues'
    | 'security_warnings'
    | 'unresolved_telemetry_errors';

export interface SystemIssue {
    type: KnownIssueType;
    count: number;
    description: string;
}

export interface CapabilityGapProposal {
    missing_capability: string;
    proposed_agent: string;
    reason: string;
    source_issue: KnownIssueType;
}

const registryPath = path.resolve(process.cwd(), 'swarm/agent_registry.json');

const issueToCapability: Record<KnownIssueType, { capability: string; proposedAgent: string }> = {
    repeated_test_failures: {
        capability: 'test_failure_triage',
        proposedAgent: 'Test Failure Triage Agent'
    },
    performance_regression: {
        capability: 'performance_optimization',
        proposedAgent: 'Performance Regression Agent'
    },
    dependency_issues: {
        capability: 'dependency_upgrade',
        proposedAgent: 'Dependency Upgrade Agent'
    },
    security_warnings: {
        capability: 'security_remediation',
        proposedAgent: 'Security Remediation Agent'
    },
    unresolved_telemetry_errors: {
        capability: 'telemetry_recovery',
        proposedAgent: 'Telemetry Recovery Agent'
    }
};

export async function readAgentRegistry(): Promise<AgentRegistry> {
    try {
        const raw = await fs.readFile(registryPath, 'utf8');
        const parsed = JSON.parse(raw) as AgentRegistry;
        if (!Array.isArray(parsed?.agents)) {
            return { agents: [] };
        }
        return parsed;
    } catch {
        return { agents: [] };
    }
}

export function inferIssuesFromState(input: {
    ciStatus?: string;
    ciFailReason?: string;
    frontendQaStatus?: string;
    telemetryErrors?: number;
}): SystemIssue[] {
    const issues: SystemIssue[] = [];
    const reason = (input.ciFailReason || '').toLowerCase();

    if (input.ciStatus === 'fail' || input.frontendQaStatus === 'fail') {
        issues.push({
            type: 'repeated_test_failures',
            count: 1,
            description: input.ciFailReason || 'CI/QA has unresolved failures'
        });
    }

    if (reason.includes('dependency') || reason.includes('npm') || reason.includes('package')) {
        issues.push({
            type: 'dependency_issues',
            count: 1,
            description: input.ciFailReason || 'Dependency-related failures detected'
        });
    }

    if (reason.includes('performance') || reason.includes('latency') || reason.includes('timeout')) {
        issues.push({
            type: 'performance_regression',
            count: 1,
            description: input.ciFailReason || 'Performance regression signals detected'
        });
    }

    if (reason.includes('security') || reason.includes('vulnerability') || reason.includes('cve')) {
        issues.push({
            type: 'security_warnings',
            count: 1,
            description: input.ciFailReason || 'Security warning detected'
        });
    }

    if ((input.telemetryErrors || 0) > 0) {
        issues.push({
            type: 'unresolved_telemetry_errors',
            count: input.telemetryErrors || 0,
            description: `${input.telemetryErrors} unresolved telemetry errors`
        });
    }

    return issues;
}

export async function analyzeCapabilityGaps(issues: SystemIssue[]): Promise<CapabilityGapProposal[]> {
    const registry = await readAgentRegistry();
    const knownCapabilities = new Set(registry.agents.flatMap((agent) => agent.capabilities || []));

    const proposals: CapabilityGapProposal[] = [];

    for (const issue of issues) {
        const mapping = issueToCapability[issue.type];
        if (!mapping) {
            continue;
        }

        if (!knownCapabilities.has(mapping.capability)) {
            proposals.push({
                missing_capability: mapping.capability,
                proposed_agent: mapping.proposedAgent,
                reason: issue.description,
                source_issue: issue.type
            });
            knownCapabilities.add(mapping.capability);
        }
    }

    return proposals;
}
