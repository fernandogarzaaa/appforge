/**
 * KnowledgeGraphSwarm - Cross-domain intelligence synthesis.
 *
 * Builds a lightweight graph from swarm report artifacts and
 * recommends the highest-leverage cross-domain initiative.
 */

import * as fs from 'fs/promises';
import path from 'path';
import { QuantumSwarmCore } from '../core/quantum_core.js';
import { memory } from '../core/persistent_memory.js';
import { swarmCollaboration } from '../core/swarm_collaboration.js';

interface GraphNode {
    id: string;
    domain: string;
    signal: string;
    score: number;
}

interface GraphEdge {
    from: string;
    to: string;
    relation: string;
    weight: number;
}

interface KnowledgeGraphReport {
    timestamp: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    strategyRecommendation: string;
    confidence: number;
}

export class KnowledgeGraphSwarm {
    private quantumCore: QuantumSwarmCore;
    private reportPath: string;
    private latestReport: KnowledgeGraphReport | null;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
        this.reportPath = path.join(process.cwd(), 'swarm', 'data', 'knowledge_graph_swarm_report.json');
        this.latestReport = null;
    }

    async runCycle(): Promise<KnowledgeGraphReport> {
        console.log('🕸️ [KnowledgeGraphSwarm] Building cross-domain intelligence graph...');

        const nodes = await this.collectNodes();
        const edges = this.linkNodes(nodes);
        const strategy = await this.recommendStrategy(nodes, edges);

        const report: KnowledgeGraphReport = {
            timestamp: new Date().toISOString(),
            nodes,
            edges,
            strategyRecommendation: strategy.recommendation,
            confidence: strategy.confidence
        };

        await this.persistReport(report);
        await memory.set('knowledge_graph_swarm:last_report', report, 60 * 60 * 24 * 7);

        await swarmCollaboration.sendSignal({
            fromAgent: 'KnowledgeGraphSwarm',
            toAgent: 'GodMode',
            type: 'FINDING',
            payload: {
                type: 'KNOWLEDGE_GRAPH_RECOMMENDATION',
                recommendation: report.strategyRecommendation,
                confidence: report.confidence
            },
            priority: 'MEDIUM'
        });

        this.latestReport = report;
        console.log(`✅ [KnowledgeGraphSwarm] Cycle complete | Strategy: ${report.strategyRecommendation}`);

        return report;
    }

    getLatestReport(): KnowledgeGraphReport | null {
        return this.latestReport;
    }

    private async collectNodes(): Promise<GraphNode[]> {
        const sources = [
            { id: 'learning', path: path.join(process.cwd(), 'swarm', 'data', 'learning_swarm_report.json'), domain: 'reasoning' },
            { id: 'research', path: path.join(process.cwd(), 'swarm', 'data', 'research_swarm_report.json'), domain: 'market' },
            { id: 'voice', path: path.join(process.cwd(), 'swarm', 'data', 'voice_swarm_report.json'), domain: 'support' },
            { id: 'customer_success', path: path.join(process.cwd(), 'swarm', 'data', 'customer_success_swarm_report.json'), domain: 'retention' },
            { id: 'devops', path: path.join(process.cwd(), 'swarm', 'data', 'devops_swarm_report.json'), domain: 'infrastructure' },
            { id: 'qa', path: path.join(process.cwd(), 'swarm', 'data', 'qa_swarm_report.json'), domain: 'quality' }
        ];

        const nodes: GraphNode[] = [];

        for (const source of sources) {
            const data = await this.readJson(source.path);
            if (!data) continue;

            const signal = this.extractSignal(source.id, data);
            const score = this.extractScore(source.id, data);

            nodes.push({
                id: source.id,
                domain: source.domain,
                signal,
                score
            });
        }

        return nodes;
    }

    private linkNodes(nodes: GraphNode[]): GraphEdge[] {
        const edges: GraphEdge[] = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                const scoreGap = Math.abs(a.score - b.score);
                const weight = Math.max(0.1, 1 - (scoreGap / 100));
                const relation = weight > 0.75 ? 'strong_correlation' : weight > 0.5 ? 'moderate_correlation' : 'weak_correlation';
                edges.push({
                    from: a.id,
                    to: b.id,
                    relation,
                    weight: Number(weight.toFixed(3))
                });
            }
        }
        return edges;
    }

    private async recommendStrategy(nodes: GraphNode[], edges: GraphEdge[]) {
        const topDomains = [...nodes]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((node) => `${node.domain}:${node.score.toFixed(1)}`)
            .join(', ');

        const denseEdges = edges.filter((edge) => edge.weight >= 0.7).length;

        const decision = await this.quantumCore.consultOracle(
            `Knowledge graph synthesis. Top domain signals: ${topDomains || 'none'}. Dense correlations: ${denseEdges}. Which cross-domain strategy should we execute?`,
            [
                'Launch unified SaaS offer combining content automation, retention automation, and reliability guarantees',
                'Prioritize reliability hardening before revenue expansion',
                'Prioritize market expansion and platform integrations before optimization',
                'Focus on customer-success-led upsell campaigns with voice and research support'
            ],
            ['cross_domain_leverage', 'revenue_impact', 'execution_feasibility', 'system_stability']
        );

        await this.quantumCore.reportOutcome(decision.predictionId, true, {
            source: 'knowledge_graph_strategy',
            nodeCount: nodes.length,
            edgeCount: edges.length
        });

        return decision;
    }

    private extractSignal(sourceId: string, data: any): string {
        if (sourceId === 'learning') return String(data?.focus || 'Reasoning hardening');
        if (sourceId === 'research') return String(data?.topFocus || data?.oracleRecommendation || 'Market opportunity');
        if (sourceId === 'voice') return `Upsell:${Number(data?.upgradeOffers ?? 0)} Escalated:${Number(data?.escalated ?? 0)}`;
        if (sourceId === 'customer_success') return `HighRisk:${Number(data?.highRiskAccounts ?? 0)} UpsellTargets:${Number(data?.upsellTargets ?? 0)}`;
        if (sourceId === 'devops') return String(data?.action?.recommendation || 'DevOps optimization');
        if (sourceId === 'qa') return `GatePassed:${Boolean(data?.gatePassed)} (${Number(data?.passed ?? 0)}/${Number((data?.passed ?? 0) + (data?.failed ?? 0))})`;
        return 'General signal';
    }

    private extractScore(sourceId: string, data: any): number {
        if (sourceId === 'learning') return Number(data?.successRate ?? 0) * 100;
        if (sourceId === 'research') return Number(data?.opportunities?.[0]?.score ?? 60);
        if (sourceId === 'voice') return Math.max(0, 100 - (Number(data?.escalated ?? 0) * 15));
        if (sourceId === 'customer_success') {
            const risk = Number(data?.highRiskAccounts ?? 0);
            const accounts = Math.max(1, Number(data?.accountsProcessed ?? 1));
            return Math.max(0, 100 - ((risk / accounts) * 100));
        }
        if (sourceId === 'devops') {
            const checks = Array.isArray(data?.checks) ? data.checks : [];
            const healthy = checks.filter((check: any) => check?.status === 'healthy').length;
            return checks.length > 0 ? (healthy / checks.length) * 100 : 50;
        }
        if (sourceId === 'qa') return Boolean(data?.gatePassed) ? 100 : 50;
        return 50;
    }

    private async persistReport(report: KnowledgeGraphReport): Promise<void> {
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

