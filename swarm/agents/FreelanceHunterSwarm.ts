/**
 * FreelanceHunterSwarm - High-Ticket Freelance Contract Automation
 * Focus: Finding and closing $2K-$10K contracts
 */

import { QuantumSwarmCore } from '../core/quantum_core.js';
import { isRealityMode } from '../core/reality_mode.js';

interface FreelanceConfig {
    platforms: string[];
    targetRate: number; // $200-$500/hour
    targetContractSize: number; // $2K-$10K
    niches: string[];
    proposalsPerDay: number;
}

interface ClientOpportunity {
    id: string;
    platform: string;
    project: string;
    budget: number;
    deadline: string;
    client: string;
    url: string;
    score: number;
}

interface Proposal {
    id: string;
    opportunityId: string;
    client: string;
    coverLetter: string;
    pricing: number;
    timeline: string;
    status: 'draft' | 'sent' | 'interview' | 'won' | 'lost';
}

export class FreelanceHunterSwarm {
    private quantumCore: QuantumSwarmCore;
    private config: FreelanceConfig;
    private opportunities: ClientOpportunity[];
    private proposals: Proposal[];
    private wonContracts: number;
    private totalRevenue: number;
    private realityMode: boolean;

    constructor(config?: Partial<FreelanceConfig>) {
        this.quantumCore = new QuantumSwarmCore();
        
        this.config = {
            platforms: config?.platforms || ['upwork', 'toptal', 'linkedin', 'fiverr'],
            targetRate: config?.targetRate || 250,
            targetContractSize: config?.targetContractSize || 5000,
            niches: config?.niches || ['AI/ML', 'Web Development', 'Mobile Apps', 'Blockchain'],
            proposalsPerDay: config?.proposalsPerDay || 5
        };

        this.opportunities = [];
        this.proposals = [];
        this.wonContracts = 0;
        this.totalRevenue = 0;
        this.realityMode = isRealityMode();
    }

    /**
     * Run freelance hunting cycle
     */
    async runCycle(): Promise<void> {
        if (this.realityMode) {
            throw new Error('[FreelanceHunterSwarm] Reality mode active: mock opportunity pipeline disabled until live platform connectors are integrated.');
        }

        console.log('🎯 [FreelanceHunterSwarm] Starting hunting cycle...');

        // Step 1: Find opportunities
        await this.findOpportunities();

        // Step 2: Score and filter
        await this.scoreOpportunities();

        // Step 3: Generate proposals
        await this.generateProposals();

        // Step 4: Report revenue
        this.updateStats();

        console.log('✅ [FreelanceHunterSwarm] Hunting cycle complete');
    }

    /**
     * Find freelance opportunities across platforms
     */
    private async findOpportunities(): Promise<void> {
        console.log('🔍 [FreelanceHunterSwarm] Finding opportunities...');

        // Placeholder for API integrations
        const mockOpportunities: ClientOpportunity[] = [
            {
                id: 'opp_1',
                platform: 'upwork',
                project: 'AI Chatbot Development',
                budget: 8000,
                deadline: '4 weeks',
                client: 'TechCorp Inc.',
                url: 'https://upwork.com/jobs/123',
                score: 0
            },
            {
                id: 'opp_2',
                platform: 'toptal',
                project: 'Full Stack Web Application',
                budget: 12000,
                deadline: '2 months',
                client: 'StartupXYZ',
                url: 'https://toptal.com/jobs/456',
                score: 0
            },
            {
                id: 'opp_3',
                platform: 'linkedin',
                project: 'Blockchain Integration',
                budget: 5000,
                deadline: '3 weeks',
                client: 'CryptoFin',
                url: 'https://linkedin.com/jobs/789',
                score: 0
            },
            {
                id: 'opp_4',
                platform: 'upwork',
                project: 'Mobile App Redesign',
                budget: 3000,
                deadline: '2 weeks',
                client: 'AppStudio',
                url: 'https://upwork.com/jobs/321',
                score: 0
            },
            {
                id: 'opp_5',
                platform: 'fiverr',
                project: 'AI/ML Model Training',
                budget: 2500,
                deadline: '3 weeks',
                client: 'DataLabs',
                url: 'https://fiverr.com/gigs/654',
                score: 0
            }
        ];

        this.opportunities = mockOpportunities;
        console.log(`✅ [FreelanceHunterSwarm] Found ${this.opportunities.length} opportunities`);
    }

    /**
     * Score opportunities based on fit
     */
    private async scoreOpportunities(): Promise<void> {
        console.log('📊 [FreelanceHunterSwarm] Scoring opportunities...');

        for (const opp of this.opportunities) {
            // Consult Oracle for scoring
            const score = await this.quantumCore.consultOracle(
                `Score this freelance opportunity: ${opp.project} ($${opp.budget})`,
                ['1', '5', '8', '10'],
                ['budget_fit', 'skill_match', 'client_quality', 'timeline_feasibility']
            );

            opp.score = parseInt(score.recommendation) || 5;
        }

        // Sort by score and filter (lower threshold for more opportunities)
        this.opportunities = this.opportunities
            .sort((a, b) => b.score - a.score)
            .filter(o => o.score >= 1); // Accept any scored opportunity

        console.log(`✅ [FreelanceHunterSwarm] ${this.opportunities.length} opportunities ready for proposals`);
    }

    /**
     * Generate proposals for top opportunities
     */
    private async generateProposals(): Promise<void> {
        console.log('✍️ [FreelanceHunterSwarm] Generating proposals...');

        const topOpp = this.opportunities[0];

        if (!topOpp) {
            console.log('⚠️ [FreelanceHunterSwarm] No suitable opportunities found');
            return;
        }

        // Generate proposal
        const proposal = await this.createProposal(topOpp);
        this.proposals.push(proposal);

        console.log(`✅ [FreelanceHunterSwarm] Proposal generated for ${topOpp.project}`);
    }

    /**
     * Create a compelling proposal
     */
    private async createProposal(opp: ClientOpportunity): Promise<Proposal> {
        const oracle = await this.quantumCore.consultOracle(
            `Write a winning proposal for ${opp.project} with budget $${opp.budget}`,
            [
                'Focus on AI/ML expertise and past successes',
                'Emphasize rapid delivery and quality',
                'Highlight team capabilities and certifications'
            ],
            ['persuasiveness', 'relevance', 'competitive_advantage']
        );

        const coverLetter = `Dear ${opp.client},\n\n` +
            `I specialize in ${this.config.niches.join(' and ')} and have delivered ${this.wonContracts} successful projects.\n\n` +
            `For your ${opp.project}, I can deliver within ${opp.deadline} with the following approach:\n\n` +
            `• Phase 1: Discovery & Planning (1 week)\n` +
            `• Phase 2: Development (${Math.floor(parseInt(opp.deadline) * 0.6)} weeks)\n` +
            `• Phase 3: Testing & Deployment (1 week)\n\n` +
            `My rate is $${this.config.targetRate}/hour, and for this ${opp.deadline} project, I estimate a total of ${Math.floor(opp.budget / this.config.targetRate)} hours.\n\n` +
            `Total investment: $${opp.budget}\n\n` +
            `Let's discuss how I can help you achieve your goals.\n\n` +
            `Best regards,\n` +
            `AI Solutions Team`;

        return {
            id: `prop_${Date.now()}`,
            opportunityId: opp.id,
            client: opp.client,
            coverLetter,
            pricing: opp.budget,
            timeline: opp.deadline,
            status: 'draft'
        };
    }

    /**
     * Get statistics
     */
    private updateStats(): void {
        const wonProposals = this.proposals.filter(p => p.status === 'won');
        this.wonContracts = wonProposals.length;
        this.totalRevenue = wonProposals.reduce((sum, p) => sum + p.pricing, 0);

        console.log('📊 [FreelanceHunterSwarm] Stats:');
        console.log(`   Contracts Won: ${this.wonContracts}`);
        console.log(`   Total Revenue: $${this.totalRevenue.toLocaleString()}`);
        console.log(`   Proposals Sent: ${this.proposals.length}`);
    }

    /**
     * Get opportunities
     */
    getOpportunities(): ClientOpportunity[] {
        return this.opportunities;
    }

    /**
     * Get proposals
     */
    getProposals(): Proposal[] {
        return this.proposals;
    }

    /**
     * Get revenue stats
     */
    getStats(): { won: number; revenue: number; proposals: number } {
        return {
            won: this.wonContracts,
            revenue: this.totalRevenue,
            proposals: this.proposals.length
        };
    }

    /**
     * Train on proposal writing
     */
    async train(): Promise<void> {
        console.log('📚 [FreelanceHunterSwarm] Training on proposal strategies...');

        const strategy = await this.quantumCore.consultOracle(
            'What makes a winning freelance proposal?',
            [
                'Personalized opening with client name',
                'Clear value proposition',
                'Specific deliverables and timeline',
                'Social proof and testimonials'
            ],
            ['conversion_rate', 'client_response', 'win_rate']
        );

        console.log(`✅ [FreelanceHunterSwarm] Training complete - Strategy: ${strategy.recommendation}`);
    }
}

export { ClientOpportunity, Proposal };
