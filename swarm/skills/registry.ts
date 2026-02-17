/**
 * AgentSkills Registry - OpenClaw Synthesis
 * Modularizes swarm capabilities into discoverable "Skills".
 */

export interface Skill {
    id: string;
    name: string;
    description: string;
    category: 'security' | 'optimization' | 'creative' | 'research' | 'trading';
    execute: (context: any) => Promise<any>;
}

export class SkillRegistry {
    private skills: Map<string, Skill> = new Map();

    register(skill: Skill) {
        this.skills.set(skill.id, skill);
        console.log(`🔌 [Registry] Registered Skill: ${skill.name} (${skill.id})`);
    }

    getSkill(id: string): Skill | undefined {
        return this.skills.get(id);
    }

    listSkills(): Skill[] {
        return Array.from(this.skills.values());
    }

    getSkillsByCategory(category: string): Skill[] {
        return this.listSkills().filter(s => s.category === category);
    }
}

export const skillRegistry = new SkillRegistry();

// Default Registration of legacy agents as Skills
export function initializeDefaultSkills(agents: any) {
    skillRegistry.register({
        id: 'sentinel_protection',
        name: 'Sentinel Protection',
        description: 'Vulnerability scanning and system hardening.',
        category: 'security',
        execute: async (ctx) => agents.sentinel.run(ctx)
    });

    skillRegistry.register({
        id: 'bug_hunter',
        name: 'Bug Hunter',
        description: 'Automated bug detection and repair.',
        category: 'security',
        execute: async (ctx) => agents.bugHunter.run(ctx)
    });

    skillRegistry.register({
        id: 'local_optimization',
        name: 'System Optimizer',
        description: 'Performance and architecture optimization.',
        category: 'optimization',
        execute: async (ctx) => agents.optimizer.run(ctx)
    });

    skillRegistry.register({
        id: 'autonomous_release',
        name: 'Release Manager',
        description: 'Automated code deployment and versioning.',
        category: 'optimization',
        execute: async (ctx) => {
            console.log('🚀 [Skill] Executing Autonomous Release...');
            // In a real scenario, this would be: execSync('git push && git tag ...')
            return { status: 'released', timestamp: new Date().toISOString() };
        }
    });

    skillRegistry.register({
        id: 'gateway_broadcaster',
        name: 'Multi-Transport Broadcaster',
        description: 'Broadcasts swarm status to all gateway channels.',
        category: 'optimization',
        execute: async (ctx) => {
            const { sovereignBridge } = await import('../core/sovereign_bridge.js');
            await sovereignBridge.pushUpdate(ctx.message || 'Swarm heartbeat pulse received.');
            return { status: 'broadcasted' };
        }
    });
}
