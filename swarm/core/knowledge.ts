import fs from 'fs/promises';
import path from 'path';

/**
 * SWARM KNOWLEDGE SYSTEM
 * Enables swarm to learn from past experiences and improve over time
 */

const KNOWLEDGE_FILE = path.join(process.cwd(), 'src/data/swarm_knowledge.json');

export class SwarmKnowledge {
    knowledge: any;

    constructor() {
        this.knowledge = null;
    }

    async load() {
        try {
            const data = await fs.readFile(KNOWLEDGE_FILE, 'utf8');
            this.knowledge = JSON.parse(data);
        } catch (error) {
            // Initialize if doesn't exist
            this.knowledge = {
                version: '1.0.0',
                created: new Date().toISOString(),
                learnings: [],
                patterns: {},
                success_rate: { overall: 0, by_agent: {}, by_task_type: {} },
                meta: { total_tasks: 0, successful_tasks: 0, failed_tasks: 0, learning_enabled: true }
            };
            await this.save();
        }
    }

    async save() {
        await fs.writeFile(KNOWLEDGE_FILE, JSON.stringify(this.knowledge, null, 2));
    }

    /**
     * Record task outcome to learn from it
     */
    async recordTaskOutcome(task: any, outcome: 'success' | 'failure', insights: string) {
        await this.load();

        const learning = {
            id: `learn_${Date.now()}`,
            timestamp: new Date().toISOString(),
            task_type: task.type || 'unknown',
            agent: task.agent || 'unknown',
            outcome: outcome,
            insights: insights,
            task_description: task.description?.substring(0, 100) || ''
        };

        this.knowledge.learnings.push(learning);
        this.knowledge.meta.total_tasks++;

        if (outcome === 'success') {
            this.knowledge.meta.successful_tasks++;
        } else {
            this.knowledge.meta.failed_tasks++;
        }

        // Update success rates
        this.knowledge.success_rate.overall =
            this.knowledge.meta.successful_tasks / this.knowledge.meta.total_tasks;

        await this.save();
        console.log(`📚 Learning recorded: ${outcome} - ${insights.substring(0, 50)}...`);
    }

    /**
     * Query knowledge for similar past experiences
     */
    async queryKnowledge(taskType: string, keywords: string[]): Promise<any[]> {
        await this.load();

        const relevantLearnings = this.knowledge.learnings.filter((l: any) => {
            const matchesType = l.task_type === taskType;
            const matchesKeywords = keywords.some(kw =>
                l.insights.toLowerCase().includes(kw.toLowerCase()) ||
                l.task_description.toLowerCase().includes(kw.toLowerCase())
            );
            return matchesType || matchesKeywords;
        });

        // Return most recent relevant learnings
        return relevantLearnings.slice(-10).reverse();
    }

    /**
     * Identify patterns in task outcomes
     */
    async identifyPatterns() {
        await this.load();

        const patterns: any = {};

        // Analyze by task type
        this.knowledge.learnings.forEach((l: any) => {
            if (!patterns[l.task_type]) {
                patterns[l.task_type] = { successes: 0, failures: 0, common_insights: [] };
            }

            if (l.outcome === 'success') {
                patterns[l.task_type].successes++;
            } else {
                patterns[l.task_type].failures++;
            }
        });

        this.knowledge.patterns = patterns;
        await this.save();

        return patterns;
    }

    /**
     * Get recommendations based on past learnings
     */
    async getRecommendations(taskType: string): Promise<string[]> {
        await this.load();

        const similar = await this.queryKnowledge(taskType, []);
        const successful = similar.filter(l => l.outcome === 'success');

        return successful.map(l => l.insights).slice(0, 5);
    }

    /**
     * Get knowledge statistics
     */
    async getStats() {
        await this.load();
        return {
            total_learnings: this.knowledge.learnings.length,
            success_rate: (this.knowledge.success_rate.overall * 100).toFixed(1) + '%',
            total_tasks: this.knowledge.meta.total_tasks,
            patterns_identified: Object.keys(this.knowledge.patterns).length
        };
    }
}

export default new SwarmKnowledge();
