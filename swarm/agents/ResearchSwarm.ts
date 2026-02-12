/**
 * ResearchSwarm - Automated market and competitor intelligence.
 *
 * Produces SaaS opportunity recommendations backed by:
 * - local trend signals,
 * - public GitHub trend snapshots,
 * - competitor pressure analysis,
 * - Oracle ranking.
 */

import * as fs from 'fs/promises';
import path from 'path';
import { QuantumSwarmCore } from '../core/quantum_core.js';
import { memory } from '../core/persistent_memory.js';
import { swarmCollaboration } from '../core/swarm_collaboration.js';
import {
    CompetitorAnalysisCell,
    OpportunityRankingCell,
    type RankedOpportunity,
    SignalCollectionCell
} from './internal/research_cells.js';

interface ResearchReport {
    timestamp: string;
    signalsAnalyzed: number;
    competitorsTracked: number;
    topFocus: string;
    oracleRecommendation: string;
    opportunities: RankedOpportunity[];
}

export class ResearchSwarm {
    private quantumCore: QuantumSwarmCore;
    private reportPath: string;
    private latestReport: ResearchReport | null;
    private signalCollectionCell: SignalCollectionCell;
    private competitorAnalysisCell: CompetitorAnalysisCell;
    private opportunityRankingCell: OpportunityRankingCell;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
        this.reportPath = path.join(process.cwd(), 'swarm', 'data', 'research_swarm_report.json');
        this.latestReport = null;
        this.signalCollectionCell = new SignalCollectionCell();
        this.competitorAnalysisCell = new CompetitorAnalysisCell();
        this.opportunityRankingCell = new OpportunityRankingCell();
    }

    async runCycle(): Promise<ResearchReport> {
        console.log('🔎 [ResearchSwarm] Starting market and competitor intelligence cycle...');
        console.log('   🧩 Internal cells: signal_collection_cell -> competitor_analysis_cell -> opportunity_ranking_cell');

        const signals = await this.signalCollectionCell.collectSignals();
        const competitors = this.competitorAnalysisCell.buildCompetitorMap();
        const competitorPressure = this.competitorAnalysisCell.computeCompetitorPressure(competitors);
        const opportunities = this.opportunityRankingCell.rankOpportunities(signals, competitorPressure);
        const oracleRecommendation = await this.chooseWithOracle(opportunities, signals.length, competitors.length);

        const finalOpportunities = opportunities.map((op) => ({
            ...op,
            oracleSelected: oracleRecommendation.includes(op.name)
        }));

        const topFocus = finalOpportunities.find((op) => op.oracleSelected)?.name || finalOpportunities[0]?.name || 'N/A';

        const report: ResearchReport = {
            timestamp: new Date().toISOString(),
            signalsAnalyzed: signals.length,
            competitorsTracked: competitors.length,
            topFocus,
            oracleRecommendation,
            opportunities: finalOpportunities
        };

        await this.persistReport(report);
        await memory.set('research_swarm:last_report', report, 60 * 60 * 24 * 7);

        await swarmCollaboration.sendSignal({
            fromAgent: 'ResearchSwarm',
            toAgent: 'ProductOwner',
            type: 'FINDING',
            payload: {
                type: 'RESEARCH_SWARM_REPORT',
                topFocus,
                oracleRecommendation,
                topOpportunity: finalOpportunities[0]
            },
            priority: 'MEDIUM'
        });

        await swarmCollaboration.sendSignal({
            fromAgent: 'ResearchSwarm',
            toAgent: 'RevenueHunter',
            type: 'FINDING',
            payload: {
                type: 'SAAS_OPPORTUNITY_PIPELINE',
                opportunities: finalOpportunities.slice(0, 3)
            },
            priority: 'MEDIUM'
        });

        this.latestReport = report;
        console.log(`✅ [ResearchSwarm] Cycle complete | Top Focus: ${topFocus}`);

        return report;
    }

    getLatestReport(): ResearchReport | null {
        return this.latestReport;
    }

    private async chooseWithOracle(
        opportunities: RankedOpportunity[],
        signalCount: number,
        competitorCount: number
    ): Promise<string> {
        const options = opportunities.slice(0, 5).map((op) => `${op.name} (${op.score.toFixed(1)})`);
        const decision = await this.quantumCore.consultOracle(
            `ResearchSwarm synthesized ${signalCount} signals and ${competitorCount} competitors. Which SaaS opportunity should we prioritize now?`,
            options,
            ['revenue_speed', 'market_demand', 'defensibility', 'implementation_feasibility']
        );

        await this.quantumCore.reportOutcome(decision.predictionId, true, {
            source: 'research_swarm_opportunity_selection',
            options
        });

        return decision.recommendation;
    }

    private async persistReport(report: ResearchReport): Promise<void> {
        await fs.mkdir(path.dirname(this.reportPath), { recursive: true });
        await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2), 'utf8');
    }
}
