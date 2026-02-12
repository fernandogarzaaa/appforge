/**
 * Canonical swarm collective definitions.
 *
 * Every swarm must map to 2+ internal member roles so the runtime can treat
 * swarms as multi-agent collectives instead of singular entities.
 */

export const SWARM_COLLECTIVE_MEMBERS: Record<string, string[]> = {
    AIAgentsSwarm: [
        'repo_intel_cell',
        'automation_design_cell',
        'execution_cell'
    ],
    AIEconomySwarm: [
        'revenue_aggregation_cell',
        'treasury_allocation_cell',
        'flywheel_execution_cell'
    ],
    AutoSignupSwarm: [
        'platform_discovery_cell',
        'credential_orchestration_cell',
        'verification_cell'
    ],
    AutomatedTradingSwarm: [
        'market_data_cell',
        'signal_inference_cell',
        'risk_execution_cell'
    ],
    ComplianceSwarm: [
        'policy_audit_cell',
        'security_controls_cell',
        'governance_reporting_cell'
    ],
    ConsultingSwarm: [
        'lead_generation_cell',
        'proposal_strategy_cell',
        'delivery_planning_cell'
    ],
    CryptoSwarm: [
        'onchain_intel_cell',
        'signal_scoring_cell',
        'trade_execution_cell'
    ],
    CustomerSuccessSwarm: [
        'churn_detection_cell',
        'retention_playbook_cell',
        'expansion_cell'
    ],
    DevOpsSwarm: [
        'ci_health_cell',
        'deploy_safety_cell',
        'observability_cell'
    ],
    ExperimentationSwarm: [
        'hypothesis_cell',
        'design_cell',
        'analysis_cell',
        'rollout_cell'
    ],
    FinanceSwarm: [
        'portfolio_monitor_cell',
        'risk_budget_cell',
        'order_management_cell'
    ],
    FreelanceHunterSwarm: [
        'opportunity_scan_cell',
        'proposal_cell',
        'conversion_cell'
    ],
    FreelanceSwarm: [
        'job_intake_cell',
        'bid_optimization_cell',
        'delivery_cell'
    ],
    KnowledgeGraphSwarm: [
        'entity_extraction_cell',
        'relationship_synthesis_cell',
        'strategy_inference_cell'
    ],
    LearningSwarm: [
        'benchmark_review_cell',
        'drill_execution_cell',
        'adaptation_cell'
    ],
    QualityAssuranceSwarm: [
        'gate_execution_cell',
        'artifact_validation_cell',
        'reliability_enforcement_cell'
    ],
    ResearchSwarm: [
        'signal_collection_cell',
        'competitor_analysis_cell',
        'opportunity_ranking_cell'
    ],
    SocialMediaSwarm: [
        'trend_analysis_cell',
        'content_generation_cell',
        'channel_execution_cell'
    ],
    SolanaDeFiSwarm: [
        'yield_intel_cell',
        'strategy_risk_cell',
        'allocation_cell'
    ],
    VoiceAgentSwarm: [
        'intent_triage_cell',
        'resolution_policy_cell',
        'upsell_handoff_cell'
    ],
    WorkerSwarm: [
        'job_discovery_cell',
        'application_cell',
        'contract_management_cell'
    ]
};

export function getCollectiveMembers(swarmName: string): string[] {
    const members = SWARM_COLLECTIVE_MEMBERS[swarmName];
    if (Array.isArray(members) && members.length >= 2) {
        return [...members];
    }

    // Defensive fallback: never allow singular-entity swarm registration.
    return ['coordinator_cell', 'execution_cell'];
}

export function getAllDefinedCollectives(): string[] {
    return Object.keys(SWARM_COLLECTIVE_MEMBERS).sort();
}
