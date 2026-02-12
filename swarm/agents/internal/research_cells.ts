import * as fs from 'fs/promises';
import path from 'path';

export type OpportunityTheme = 'creator' | 'agent_ops' | 'trading_risk' | 'freelance' | 'research';

export interface ResearchSignal {
    id: string;
    topic: string;
    source: 'local_trends' | 'github';
    summary: string;
    momentum: number;
    relevance: number;
}

export interface CompetitorSnapshot {
    name: string;
    category: OpportunityTheme;
    strength: number;
    notes: string;
}

export interface OpportunityTemplate {
    id: string;
    name: string;
    theme: OpportunityTheme;
    problem: string;
    solution: string;
    monetization: string;
}

export interface RankedOpportunity extends OpportunityTemplate {
    score: number;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
    oracleSelected: boolean;
}

/**
 * signal_collection_cell
 * Collects and deduplicates local + GitHub trend signals.
 */
export class SignalCollectionCell {
    private readonly trendsPath: string;

    constructor(trendsPath?: string) {
        this.trendsPath = trendsPath ?? path.join(process.cwd(), 'swarm', 'data', 'trends.json');
    }

    async collectSignals(): Promise<ResearchSignal[]> {
        const [localSignals, githubSignals] = await Promise.all([
            this.loadLocalTrendSignals(),
            this.loadGitHubSignals()
        ]);

        const deduped = new Map<string, ResearchSignal>();
        [...localSignals, ...githubSignals].forEach((signal) => {
            const key = signal.topic.toLowerCase();
            const existing = deduped.get(key);
            if (!existing || signal.relevance > existing.relevance) {
                deduped.set(key, signal);
            }
        });

        return Array.from(deduped.values())
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 20);
    }

    private async loadLocalTrendSignals(): Promise<ResearchSignal[]> {
        try {
            const raw = await fs.readFile(this.trendsPath, 'utf8');
            const parsed = JSON.parse(raw);
            const trendList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.trends) ? parsed.trends : []);

            return trendList.slice(0, 12).map((trend: any, idx: number) => ({
                id: `local_${idx}_${String(trend?.name || 'trend').toLowerCase().replace(/\s+/g, '_')}`,
                topic: String(trend?.name || trend?.title || `trend_${idx}`),
                source: 'local_trends',
                summary: String(trend?.description || trend?.category || 'Local trend signal'),
                momentum: this.clamp(Number(trend?.growthRate ?? 50), 0, 100),
                relevance: this.clamp(Number(trend?.relevance ?? trend?.score ?? 60), 0, 100)
            }));
        } catch {
            return [];
        }
    }

    private async loadGitHubSignals(): Promise<ResearchSignal[]> {
        const queries = [
            'ai agent framework',
            'creator automation platform',
            'trading risk management',
            'workflow automation saas'
        ];

        const headers: Record<string, string> = {
            Accept: 'application/vnd.github+json'
        };

        if (process.env.GITHUB_TOKEN) {
            headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        const results: ResearchSignal[] = [];

        for (const query of queries) {
            try {
                const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=4`;
                const response = await fetch(url, { headers });
                if (!response.ok) continue;

                const payload = await response.json() as { items?: any[] };
                for (const repo of payload.items || []) {
                    const stars = Number(repo?.stargazers_count ?? 0);
                    const signal: ResearchSignal = {
                        id: `gh_${repo?.id ?? Date.now()}`,
                        topic: String(repo?.name || query),
                        source: 'github',
                        summary: String(repo?.description || `GitHub trend for ${query}`),
                        momentum: this.clamp(Math.log10(Math.max(stars, 1)) * 20, 0, 100),
                        relevance: this.clamp(Math.log10(Math.max(stars, 1)) * 22, 0, 100)
                    };
                    results.push(signal);
                }
            } catch {
                // Keep research cycle resilient to transient network failures.
            }
        }

        return results;
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
    }
}

/**
 * competitor_analysis_cell
 * Maintains competitor map and derives market pressure by theme.
 */
export class CompetitorAnalysisCell {
    buildCompetitorMap(): CompetitorSnapshot[] {
        return [
            { name: 'Zapier', category: 'agent_ops', strength: 92, notes: 'Strong automation ecosystem and integrations.' },
            { name: 'n8n', category: 'agent_ops', strength: 84, notes: 'Open-source workflow momentum with technical users.' },
            { name: 'Hootsuite', category: 'creator', strength: 78, notes: 'Established social scheduling and analytics footprint.' },
            { name: 'Buffer', category: 'creator', strength: 72, notes: 'SMB-friendly social automation platform.' },
            { name: '3Commas', category: 'trading_risk', strength: 76, notes: 'Retail trading automation and strategy tools.' },
            { name: 'Token Metrics', category: 'trading_risk', strength: 68, notes: 'Signal-heavy crypto insights with subscription model.' },
            { name: 'Upwork Talent Intelligence', category: 'freelance', strength: 70, notes: 'Strong marketplace data but limited autonomous tooling.' },
            { name: 'CB Insights', category: 'research', strength: 88, notes: 'Premium market intelligence with enterprise positioning.' }
        ];
    }

    computeCompetitorPressure(
        competitors: CompetitorSnapshot[]
    ): Record<OpportunityTheme, number> {
        const totals: Record<OpportunityTheme, { sum: number; count: number }> = {
            creator: { sum: 0, count: 0 },
            agent_ops: { sum: 0, count: 0 },
            trading_risk: { sum: 0, count: 0 },
            freelance: { sum: 0, count: 0 },
            research: { sum: 0, count: 0 }
        };

        competitors.forEach((competitor) => {
            totals[competitor.category].sum += competitor.strength;
            totals[competitor.category].count += 1;
        });

        const pressure: Record<OpportunityTheme, number> = {
            creator: 60,
            agent_ops: 60,
            trading_risk: 60,
            freelance: 60,
            research: 60
        };

        (Object.keys(totals) as OpportunityTheme[]).forEach((theme) => {
            const bucket = totals[theme];
            if (bucket.count > 0) {
                pressure[theme] = bucket.sum / bucket.count;
            }
        });

        return pressure;
    }
}

/**
 * opportunity_ranking_cell
 * Ranks opportunity templates using demand and competitor pressure.
 */
export class OpportunityRankingCell {
    rankOpportunities(
        signals: ResearchSignal[],
        competitorPressure: Record<OpportunityTheme, number>
    ): RankedOpportunity[] {
        const templates: OpportunityTemplate[] = [
            {
                id: 'creator_revenue_studio',
                name: 'Creator Revenue Studio',
                theme: 'creator',
                problem: 'Creators struggle to plan, publish, and monetize across channels consistently.',
                solution: 'Unified AI workflow for topic ideation, multi-platform scheduling, and revenue optimization.',
                monetization: '$99-$299/month plus performance tier'
            },
            {
                id: 'swarm_ops_command_center',
                name: 'SwarmOps Command Center',
                theme: 'agent_ops',
                problem: 'Teams lack governance and visibility over autonomous agent operations.',
                solution: 'Control plane for agent orchestration, guardrails, incident rollback, and execution analytics.',
                monetization: '$249-$999/month B2B SaaS'
            },
            {
                id: 'autonomous_risk_desk',
                name: 'Autonomous Risk Desk',
                theme: 'trading_risk',
                problem: 'Automated trading setups often miss strict risk controls and post-trade learning.',
                solution: 'Portfolio guardrails with confidence gating, stop logic, and strategy quality reporting.',
                monetization: '$199/month plus usage'
            },
            {
                id: 'freelance_pipeline_iq',
                name: 'Freelance Pipeline IQ',
                theme: 'freelance',
                problem: 'Freelancers spend excessive time triaging opportunities and proposal quality.',
                solution: 'High-ticket lead scoring, proposal generation, and close-probability tracking.',
                monetization: '$79-$199/month'
            },
            {
                id: 'competitor_pulse_radar',
                name: 'Competitor Pulse Radar',
                theme: 'research',
                problem: 'Founders lack continuous intelligence on competitor moves and product gaps.',
                solution: 'Automated competitor monitoring, feature-gap alerts, and weekly strategy briefs.',
                monetization: '$149-$499/month'
            }
        ];

        const themeScores = this.computeThemeScores(signals);
        const ranked = templates.map((template) => {
            const demand = themeScores[template.theme];
            const pressure = competitorPressure[template.theme];
            const moatBonus = this.clamp(100 - pressure, 10, 45);
            const score = this.clamp((demand * 0.65) + (moatBonus * 0.35), 0, 100);

            return {
                ...template,
                score: Number(score.toFixed(2)),
                priority: score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low',
                rationale: `Demand=${demand.toFixed(1)} | CompetitorPressure=${pressure.toFixed(1)} | MoatBonus=${moatBonus.toFixed(1)}`,
                oracleSelected: false
            } as RankedOpportunity;
        });

        return ranked.sort((a, b) => b.score - a.score);
    }

    private computeThemeScores(signals: ResearchSignal[]): Record<OpportunityTheme, number> {
        const buckets: Record<OpportunityTheme, { score: number; count: number; keywords: string[] }> = {
            creator: { score: 0, count: 0, keywords: ['creator', 'social', 'instagram', 'twitter', 'youtube', 'content'] },
            agent_ops: { score: 0, count: 0, keywords: ['agent', 'workflow', 'automation', 'orchestration', 'copilot'] },
            trading_risk: { score: 0, count: 0, keywords: ['trade', 'trading', 'risk', 'crypto', 'market'] },
            freelance: { score: 0, count: 0, keywords: ['freelance', 'proposal', 'contract', 'talent'] },
            research: { score: 0, count: 0, keywords: ['research', 'intelligence', 'competitor', 'analysis', 'insight'] }
        };

        for (const signal of signals) {
            const text = `${signal.topic} ${signal.summary}`.toLowerCase();
            for (const [theme, bucket] of Object.entries(buckets) as Array<[OpportunityTheme, typeof buckets[OpportunityTheme]]>) {
                if (bucket.keywords.some((keyword) => text.includes(keyword))) {
                    bucket.score += (signal.relevance * 0.7) + (signal.momentum * 0.3);
                    bucket.count += 1;
                }
            }
        }

        const output: Record<OpportunityTheme, number> = {
            creator: 45,
            agent_ops: 45,
            trading_risk: 45,
            freelance: 45,
            research: 45
        };

        (Object.keys(buckets) as OpportunityTheme[]).forEach((theme) => {
            const bucket = buckets[theme];
            if (bucket.count > 0) {
                output[theme] = this.clamp(bucket.score / bucket.count, 0, 100);
            }
        });

        return output;
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
    }
}
