import { broadcastLog } from '../../logger.js';
export class Spawner {
    static SWARM_LIBRARY = [
        {
            id: 'spatial_systems',
            name: 'Spatial Systems Swarm',
            description: 'Builds simulation-heavy and physical-world planning products.',
            keywords: ['solar', 'energy', 'city', 'spatial', 'traffic', 'infrastructure'],
            agents: [
                {
                    role: 'SpatialArchitect',
                    description: 'Designs 3D environments and resource grids.',
                    directives: ['Optimize spatial layout', 'Ensure efficient resource flow']
                },
                {
                    role: 'PhysicsEngine',
                    description: 'Simulates physical constraints.',
                    directives: ['Enforce gravity/thermodynamics', 'Calculate structural integrity']
                },
                {
                    role: 'InterfaceDesigner',
                    description: 'Creates user controls for the simulation.',
                    directives: ['Intuitive camera controls', 'Real-time data visualization']
                }
            ]
        },
        {
            id: 'token_economy',
            name: 'Token Economy Swarm',
            description: 'Designs and secures DeFi/token workflows.',
            keywords: ['defi', 'token', 'economy', 'solana', 'wallet', 'crypto'],
            agents: [
                {
                    role: 'TokenomicsDesigner',
                    description: 'Designs the economic model.',
                    directives: ['Ensure sustainable inflation', 'Prevent rug-pull vectors']
                },
                {
                    role: 'SmartContractArchitect',
                    description: 'Writes secure Rust/Solidity code.',
                    directives: ['Use safe arithmetic patterns', 'Prevent reentrancy']
                },
                {
                    role: 'SecurityAuditor',
                    description: 'Audits code for vulnerabilities.',
                    directives: ['Check exploit paths', 'Verify access controls']
                }
            ]
        },
        {
            id: 'ml_intelligence',
            name: 'ML Intelligence Swarm',
            description: 'Builds model-assisted workflows and data intelligence pipelines.',
            keywords: ['ai', 'model', 'ml', 'rag', 'embedding', 'reasoning', 'inference'],
            agents: [
                {
                    role: 'ModelArchitect',
                    description: 'Designs model topology and serving boundaries.',
                    directives: ['Define model capability envelope', 'Constrain unsafe generation paths']
                },
                {
                    role: 'DataCurator',
                    description: 'Prepares and validates training/retrieval data.',
                    directives: ['Enforce data provenance', 'Reduce hallucination-prone context']
                },
                {
                    role: 'EvaluationEngineer',
                    description: 'Measures quality and regression behavior.',
                    directives: ['Track benchmark drift', 'Gate releases with eval thresholds']
                }
            ]
        },
        {
            id: 'growth_revenue',
            name: 'Growth & Revenue Swarm',
            description: 'Optimizes product growth loops, retention and monetization.',
            keywords: ['growth', 'revenue', 'sales', 'funnel', 'retention', 'conversion', 'pricing'],
            agents: [
                {
                    role: 'GrowthStrategist',
                    description: 'Designs high-velocity experiment loops.',
                    directives: ['Prioritize high-impact hypotheses', 'Optimize activation and retention loops']
                },
                {
                    role: 'LifecycleOperator',
                    description: 'Builds CRM and lifecycle automation logic.',
                    directives: ['Segment by behavior signals', 'Automate re-engagement workflows']
                },
                {
                    role: 'RevenueAnalyst',
                    description: 'Aligns pricing, packaging and margin outcomes.',
                    directives: ['Model unit economics', 'Guard against churn-inducing offers']
                }
            ]
        },
        {
            id: 'product_discovery',
            name: 'Product Discovery Swarm',
            description: 'Validates customer demand and product scope before implementation.',
            keywords: ['research', 'discovery', 'market', 'persona', 'roadmap'],
            agents: [
                {
                    role: 'MarketScout',
                    description: 'Extracts market signals and competitor movement.',
                    directives: ['Identify demand clusters', 'Detect saturation risk']
                },
                {
                    role: 'PersonaSynthesizer',
                    description: 'Builds actionable user personas and journeys.',
                    directives: ['Map user pain points', 'Rank high-value workflows']
                },
                {
                    role: 'RoadmapStrategist',
                    description: 'Converts discovery signals into execution priorities.',
                    directives: ['Propose MVP boundaries', 'Sequence high-leverage milestones']
                }
            ]
        },
        {
            id: 'implementation_forge',
            name: 'Implementation Forge Swarm',
            description: 'Turns validated plans into production-ready architecture and code.',
            keywords: ['build', 'implement', 'api', 'frontend', 'backend', 'database'],
            agents: [
                {
                    role: 'SystemArchitect',
                    description: 'Designs service boundaries and contract interfaces.',
                    directives: ['Enforce modular boundaries', 'Guarantee composable interfaces']
                },
                {
                    role: 'APIEngineer',
                    description: 'Implements backend contracts and business logic.',
                    directives: ['Preserve deterministic behavior', 'Validate all external input']
                },
                {
                    role: 'UXEngineer',
                    description: 'Builds reliable user interaction surfaces.',
                    directives: ['Maintain accessibility baselines', 'Optimize clarity of critical actions']
                },
                {
                    role: 'DataEngineer',
                    description: 'Owns data models and migration quality.',
                    directives: ['Protect schema compatibility', 'Minimize query cost']
                }
            ]
        },
        {
            id: 'automation_fabric',
            name: 'Automation Fabric Swarm',
            description: 'Designs event-driven automations and orchestration pathways.',
            keywords: ['workflow', 'automation', 'trigger', 'pipeline', 'queue', 'orchestrate'],
            agents: [
                {
                    role: 'WorkflowDesigner',
                    description: 'Designs robust automation graph topology.',
                    directives: ['Prevent cycle deadlocks', 'Define idempotent step semantics']
                },
                {
                    role: 'IntegrationSpecialist',
                    description: 'Implements secure third-party integrations.',
                    directives: ['Harden webhook validation', 'Apply least-privilege credentials']
                },
                {
                    role: 'ReliabilityEngineer',
                    description: 'Protects retries, backoff and failure handling.',
                    directives: ['Bound retry storms', 'Track runbook-quality error context']
                }
            ]
        },
        {
            id: 'verification_guard',
            name: 'Verification Guard Swarm',
            description: 'Hardens quality, security, and compliance before release.',
            keywords: ['qa', 'security', 'verify', 'audit', 'test', 'compliance'],
            agents: [
                {
                    role: 'TestStrategist',
                    description: 'Builds risk-weighted verification plans.',
                    directives: ['Cover critical paths first', 'Use deterministic assertions']
                },
                {
                    role: 'SecuritySentinel',
                    description: 'Runs adversarial checks against attack surfaces.',
                    directives: ['Probe auth boundaries', 'Flag unsafe trust assumptions']
                },
                {
                    role: 'PerformanceTuner',
                    description: 'Optimizes latency and compute efficiency.',
                    directives: ['Remove throughput bottlenecks', 'Reduce unnecessary allocations']
                },
                {
                    role: 'ComplianceAuditor',
                    description: 'Checks policy, privacy, and governance adherence.',
                    directives: ['Enforce data-handling policy', 'Verify traceable change history']
                }
            ]
        },
        {
            id: 'release_ops',
            name: 'Release Operations Swarm',
            description: 'Stabilizes rollout and post-release operations.',
            keywords: ['release', 'deploy', 'monitoring', 'incident', 'operations', 'sre'],
            agents: [
                {
                    role: 'ReleaseCaptain',
                    description: 'Coordinates release sequencing and rollback gates.',
                    directives: ['Define go/no-go criteria', 'Prepare safe rollback']
                },
                {
                    role: 'ObservabilityAnalyst',
                    description: 'Creates visibility into runtime behavior.',
                    directives: ['Instrument key metrics', 'Attach alert thresholds to SLIs']
                },
                {
                    role: 'IncidentResponder',
                    description: 'Leads mitigation when regressions appear.',
                    directives: ['Triages blast radius rapidly', 'Execute playbook-based recovery']
                },
                {
                    role: 'CostOptimizer',
                    description: 'Keeps reliability and infrastructure spend balanced.',
                    directives: ['Eliminate wasteful workloads', 'Maintain cost-to-value ratio']
                }
            ]
        }
    ];
    static CORE_CYCLE_IDS = [
        'product_discovery',
        'implementation_forge',
        'automation_fabric',
        'verification_guard',
        'release_ops'
    ];
    /**
     * spawnSwarm:
     * Backward-compatible method that returns a flattened list of agents.
     */
    static spawnSwarm(intent) {
        const recommendation = this.recommendSwarmCycle(intent);
        const flattenedAgents = recommendation.cycle.flatMap(swarm => swarm.agents);
        broadcastLog('SPAWNER', `Spawned ${flattenedAgents.length} Agents across ${recommendation.cycle.length} Swarms: ${flattenedAgents.map(a => a.role).join(', ')}`, 'SUCCESS');
        return flattenedAgents;
    }
    /**
     * spawnSwarmCycle:
     * Returns the full swarm cycle preserving each swarm boundary.
     */
    static spawnSwarmCycle(intent) {
        return this.recommendSwarmCycle(intent).cycle;
    }
    /**
     * recommendSwarmCycle:
     * Builds a cycle with domain-specialized swarm + core execution swarms.
     */
    static recommendSwarmCycle(intent) {
        const normalizedIntent = intent.toLowerCase();
        broadcastLog('SPAWNER', `Analyzing Intent: "${intent}" to assemble swarm cycle...`, 'INFO');
        const domainSwarm = this.selectBestDomainSwarm(normalizedIntent) ?? this.getDefaultDomainSwarm();
        const coreSwarms = this.CORE_CYCLE_IDS
            .filter(id => id !== domainSwarm.id)
            .map(id => this.requireSwarm(id));
        const cycle = [domainSwarm, ...coreSwarms];
        const rationale = [
            `Domain swarm selected: ${domainSwarm.name} (${domainSwarm.description})`,
            ...coreSwarms.map(swarm => `Core swarm appended: ${swarm.name}`)
        ];
        broadcastLog('SPAWNER', `Recommended cycle: ${cycle.map(s => s.name).join(' -> ')}`, 'SUCCESS');
        return { cycle, rationale };
    }
    static spawnAgent(role) {
        return {
            role,
            description: `Ephemeral Fractal Agent: ${role}`,
            directives: ['Solve Micro-Task', 'Report back to FractalManager']
        };
    }
    static selectBestDomainSwarm(intent) {
        const excluded = new Set(this.CORE_CYCLE_IDS);
        let bestMatch = null;
        let bestScore = 0;
        for (const template of this.SWARM_LIBRARY) {
            if (excluded.has(template.id)) {
                continue;
            }
            const score = template.keywords.reduce((acc, keyword) => (intent.includes(keyword) ? acc + 1 : acc), 0);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = template;
            }
        }
        return bestMatch;
    }
    static getDefaultDomainSwarm() {
        return {
            id: 'generalist_domain',
            name: 'Generalist Logic Swarm',
            description: 'Covers mixed-domain intents when no direct specialism is detected.',
            keywords: [],
            agents: [
                {
                    role: 'LogicVanguard',
                    description: 'Analyzes core logic requirements.',
                    directives: ['Identify key algorithms', 'Structure data flow']
                },
                {
                    role: 'FullStackBuilder',
                    description: 'Implements the end-to-end solution.',
                    directives: ['Follow clean code', 'Ensure type mastery']
                }
            ]
        };
    }
    static requireSwarm(id) {
        const swarm = this.SWARM_LIBRARY.find(template => template.id === id);
        if (!swarm) {
            throw new Error(`SWARM_TEMPLATE_NOT_FOUND: ${id}`);
        }
        return swarm;
    }
    static async distillDNA(intent, swarm) {
        const DNA_PATH = 'memory/dna_registry.json';
        let registry = {};
        try {
            const fs = await import('fs');
            if (fs.existsSync(DNA_PATH)) {
                registry = JSON.parse(fs.readFileSync(DNA_PATH, 'utf-8'));
            }
            registry[intent] = {
                timestamp: new Date().toISOString(),
                agents: swarm
            };
            fs.writeFileSync(DNA_PATH, JSON.stringify(registry, null, 2));
            broadcastLog('DNA_DISTILLERY', `Preserved Swarm DNA for intent: "${intent}"`, 'SUCCESS');
        }
        catch (e) {
            console.error('Failed to save DNA', e);
        }
    }
}
