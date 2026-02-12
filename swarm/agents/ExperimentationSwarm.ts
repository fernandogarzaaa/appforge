/**
 * ExperimentationSwarm - Multi-agent A/B testing and growth loop automation.
 */

import * as fs from 'fs/promises';
import path from 'path';
import { QuantumSwarmCore } from '../core/quantum_core.js';
import { memory } from '../core/persistent_memory.js';
import { swarmCollaboration } from '../core/swarm_collaboration.js';

type ExperimentChannel = 'onboarding' | 'pricing' | 'activation' | 'content';

interface InternalAgentCell {
    id: string;
    role: 'hypothesis' | 'design' | 'analysis' | 'rollout';
    weight: number;
}

interface ExperimentVariant {
    name: string;
    conversionRate: number;
    sampleSize: number;
    confidence: number;
}

interface ExperimentPlan {
    id: string;
    channel: ExperimentChannel;
    ownerSwarm: 'SocialMediaSwarm' | 'CustomerSuccessSwarm' | 'ProductOwner';
    hypothesis: string;
    estimatedRevenueImpact: number;
    variants: ExperimentVariant[];
}

interface RankedExperiment {
    experimentId: string;
    channel: ExperimentChannel;
    ownerSwarm: ExperimentPlan['ownerSwarm'];
    hypothesis: string;
    winner: string;
    upliftPct: number;
    confidence: number;
    priorityScore: number;
    multiAgentConsensus: number;
    recommendation: string;
}

interface ExperimentationReport {
    timestamp: string;
    internalAgents: number;
    experimentsEvaluated: number;
    topRecommendation: string;
    oracleRecommendation: string;
    executedHandovers: number;
    rankings: RankedExperiment[];
}

export class ExperimentationSwarm {
    private quantumCore: QuantumSwarmCore;
    private reportPath: string;
    private latestReport: ExperimentationReport | null;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
        this.reportPath = path.join(process.cwd(), 'swarm', 'data', 'experimentation_swarm_report.json');
        this.latestReport = null;
    }

    async runCycle(): Promise<ExperimentationReport> {
        console.log('🧪 [ExperimentationSwarm] Starting multi-agent growth experimentation cycle...');

        const internalCells = this.getInternalCells();
        const plans = this.getExperimentBacklog();

        const rankings = plans
            .map((plan) => this.rankPlan(plan, internalCells))
            .sort((a, b) => b.priorityScore - a.priorityScore);

        const oracle = await this.selectWithOracle(rankings, internalCells);
        const topRecommendation = rankings[0]?.recommendation || 'No experiment ready';
        const executedHandovers = await this.dispatchHandovers(rankings.slice(0, 2));

        const report: ExperimentationReport = {
            timestamp: new Date().toISOString(),
            internalAgents: internalCells.length,
            experimentsEvaluated: rankings.length,
            topRecommendation,
            oracleRecommendation: oracle.recommendation,
            executedHandovers,
            rankings
        };

        await this.persistReport(report);
        await memory.set('experimentation_swarm:last_report', report, 60 * 60 * 24 * 7);

        await swarmCollaboration.sendSignal({
            fromAgent: 'ExperimentationSwarm',
            toAgent: 'ProductOwner',
            type: 'FINDING',
            payload: {
                type: 'EXPERIMENTATION_SWARM_REPORT',
                topRecommendation: report.topRecommendation,
                oracleRecommendation: report.oracleRecommendation,
                topExperiment: report.rankings[0] || null
            },
            priority: 'MEDIUM'
        });

        this.latestReport = report;
        console.log(
            `✅ [ExperimentationSwarm] Cycle complete | Experiments: ${report.experimentsEvaluated}, Handoffs: ${report.executedHandovers}`
        );

        return report;
    }

    getLatestReport(): ExperimentationReport | null {
        return this.latestReport;
    }

    private getInternalCells(): InternalAgentCell[] {
        return [
            { id: 'hypothesis_cell', role: 'hypothesis', weight: 0.25 },
            { id: 'design_cell', role: 'design', weight: 0.25 },
            { id: 'analysis_cell', role: 'analysis', weight: 0.30 },
            { id: 'rollout_cell', role: 'rollout', weight: 0.20 }
        ];
    }

    private getExperimentBacklog(): ExperimentPlan[] {
        return [
            {
                id: 'onboarding_value_prop_v3',
                channel: 'onboarding',
                ownerSwarm: 'CustomerSuccessSwarm',
                hypothesis: 'A tighter ROI-focused onboarding sequence increases week-1 activation.',
                estimatedRevenueImpact: 18000,
                variants: [
                    { name: 'control', conversionRate: 0.312, sampleSize: 1240, confidence: 0.71 },
                    { name: 'roi_value_path', conversionRate: 0.361, sampleSize: 1172, confidence: 0.81 },
                    { name: 'guided_checklist_path', conversionRate: 0.347, sampleSize: 980, confidence: 0.78 }
                ]
            },
            {
                id: 'pricing_anchor_packaging_v2',
                channel: 'pricing',
                ownerSwarm: 'ProductOwner',
                hypothesis: 'Quarterly anchor pricing improves conversion-to-paid for pro accounts.',
                estimatedRevenueImpact: 23000,
                variants: [
                    { name: 'control', conversionRate: 0.084, sampleSize: 4200, confidence: 0.74 },
                    { name: 'quarterly_anchor', conversionRate: 0.097, sampleSize: 3860, confidence: 0.84 },
                    { name: 'annual_bonus_credit', conversionRate: 0.092, sampleSize: 3650, confidence: 0.80 }
                ]
            },
            {
                id: 'content_offer_cta_mix_v4',
                channel: 'content',
                ownerSwarm: 'SocialMediaSwarm',
                hypothesis: 'Offer-led CTAs outperform generic educational CTAs for inbound conversion.',
                estimatedRevenueImpact: 15000,
                variants: [
                    { name: 'control', conversionRate: 0.116, sampleSize: 1900, confidence: 0.68 },
                    { name: 'offer_led_cta', conversionRate: 0.142, sampleSize: 1810, confidence: 0.79 },
                    { name: 'social_proof_cta', conversionRate: 0.137, sampleSize: 1775, confidence: 0.77 }
                ]
            },
            {
                id: 'activation_prompt_timing_v2',
                channel: 'activation',
                ownerSwarm: 'CustomerSuccessSwarm',
                hypothesis: 'Adaptive nudge timing increases feature adoption during first 72 hours.',
                estimatedRevenueImpact: 12000,
                variants: [
                    { name: 'control', conversionRate: 0.428, sampleSize: 1450, confidence: 0.69 },
                    { name: 'adaptive_nudge_timing', conversionRate: 0.471, sampleSize: 1388, confidence: 0.82 },
                    { name: 'fixed_12h_nudge', conversionRate: 0.444, sampleSize: 1331, confidence: 0.75 }
                ]
            }
        ];
    }

    private rankPlan(plan: ExperimentPlan, internalCells: InternalAgentCell[]): RankedExperiment {
        const control = plan.variants.find((variant) => variant.name === 'control') || plan.variants[0];
        const winner = plan.variants.reduce((best, candidate) => (
            candidate.conversionRate > best.conversionRate ? candidate : best
        ), control);

        const upliftPct = control.conversionRate > 0
            ? ((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100
            : 0;

        const sampleStrength = this.clamp(winner.sampleSize / 4000, 0, 1);
        const impactScore = this.clamp(plan.estimatedRevenueImpact / 25000, 0, 1);
        const upliftScore = this.clamp(upliftPct / 20, 0, 1);
        const evidenceScore = this.clamp((winner.confidence * 0.7) + (sampleStrength * 0.3), 0, 1);

        // Consensus score models agreement across internal cells (hypothesis/design/analysis/rollout).
        const multiAgentConsensus = this.clamp(
            internalCells.reduce((acc, cell) => {
                const roleSignal = cell.role === 'analysis'
                    ? evidenceScore
                    : cell.role === 'rollout'
                        ? (impactScore * 0.7) + (upliftScore * 0.3)
                        : (upliftScore * 0.6) + (impactScore * 0.4);
                return acc + (roleSignal * cell.weight);
            }, 0),
            0,
            1
        );

        const priorityScore = this.clamp(
            (multiAgentConsensus * 0.5) + (impactScore * 0.25) + (evidenceScore * 0.25),
            0,
            1
        );

        const recommendation = winner.name === 'control'
            ? `Keep control for ${plan.id} until stronger evidence emerges`
            : `Promote ${winner.name} for ${plan.id} with staged rollout (25% -> 50% -> 100%)`;

        return {
            experimentId: plan.id,
            channel: plan.channel,
            ownerSwarm: plan.ownerSwarm,
            hypothesis: plan.hypothesis,
            winner: winner.name,
            upliftPct: Number(upliftPct.toFixed(2)),
            confidence: Number(evidenceScore.toFixed(3)),
            priorityScore: Number(priorityScore.toFixed(3)),
            multiAgentConsensus: Number(multiAgentConsensus.toFixed(3)),
            recommendation
        };
    }

    private async selectWithOracle(
        rankings: RankedExperiment[],
        internalCells: InternalAgentCell[]
    ) {
        const options = rankings.slice(0, 4).map((candidate) => (
            `Prioritize ${candidate.experimentId} (${candidate.channel}) - winner=${candidate.winner}, uplift=${candidate.upliftPct.toFixed(1)}%, consensus=${(candidate.multiAgentConsensus * 100).toFixed(1)}%`
        ));

        const decision = await this.quantumCore.consultOracle(
            `ExperimentationSwarm is a multi-agent collective with ${internalCells.length} internal cells (hypothesis, design, analysis, rollout). Rank the next experiment to deploy for maximum growth impact.`,
            options.length > 0 ? options : ['Defer new experiments until more data is available'],
            ['revenue_impact', 'statistical_confidence', 'cross_swarm_synergy', 'execution_speed']
        );

        await this.quantumCore.reportOutcome(decision.predictionId, true, {
            source: 'experimentation_swarm_oracle_selection',
            internalCells: internalCells.length,
            candidates: rankings.length
        });

        return decision;
    }

    private async dispatchHandovers(candidates: RankedExperiment[]): Promise<number> {
        let handoffs = 0;

        for (const candidate of candidates) {
            await swarmCollaboration.sendSignal({
                fromAgent: 'ExperimentationSwarm',
                toAgent: candidate.ownerSwarm,
                type: 'FINDING',
                payload: {
                    type: 'EXPERIMENT_HANDOFF',
                    experimentId: candidate.experimentId,
                    channel: candidate.channel,
                    hypothesis: candidate.hypothesis,
                    recommendation: candidate.recommendation,
                    upliftPct: candidate.upliftPct,
                    consensus: candidate.multiAgentConsensus
                },
                priority: candidate.priorityScore >= 0.75 ? 'HIGH' : 'MEDIUM'
            });
            handoffs++;
        }

        return handoffs;
    }

    private async persistReport(report: ExperimentationReport): Promise<void> {
        await fs.mkdir(path.dirname(this.reportPath), { recursive: true });
        await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2), 'utf8');
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
}
