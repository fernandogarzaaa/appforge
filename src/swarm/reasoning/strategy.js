function hashSeed(input, seed) {
    let value = seed;
    for (const char of input) {
        value = (value * 31 + char.charCodeAt(0)) % 1_000_003;
    }
    return value;
}
function deterministicConfidence(seed, bias = 0) {
    return Number((0.65 + ((seed % 200) / 1000) + bias).toFixed(4));
}
export class DirectStrategy {
    id = 'direct';
    metadata = { depth: 1, agents: 1, usesReflection: false, usesDebate: false, usesRetrieval: false };
    async execute(task) {
        const localSeed = hashSeed(task.prompt, task.seed);
        return {
            strategyId: this.id,
            conclusion: `Direct resolution for ${task.taskId}`,
            confidence: deterministicConfidence(localSeed),
            trace: [`seed=${localSeed}`, 'single-pass direct reasoning'],
        };
    }
}
export class ReflectionStrategy {
    rounds;
    id = 'reflection';
    constructor(rounds = 2) {
        this.rounds = rounds;
    }
    metadata = { depth: 2, agents: 1, usesReflection: true, usesDebate: false, usesRetrieval: false };
    async execute(task) {
        const trace = [];
        let localSeed = task.seed;
        for (let index = 0; index < this.rounds; index += 1) {
            localSeed = hashSeed(`${task.prompt}:${index}`, localSeed);
            trace.push(`reflection_round_${index + 1}:seed=${localSeed}`);
        }
        return {
            strategyId: this.id,
            conclusion: `Refined resolution for ${task.taskId}`,
            confidence: deterministicConfidence(localSeed, 0.02),
            trace,
        };
    }
}
export class TreeOfThoughtStrategy {
    depth;
    id = 'tree_of_thought';
    metadata;
    constructor(depth = 3) {
        this.depth = depth;
        this.metadata = { depth, agents: 1, usesReflection: true, usesDebate: false, usesRetrieval: false };
    }
    async execute(task) {
        const trace = [];
        let localSeed = task.seed;
        for (let level = 1; level <= this.depth; level += 1) {
            localSeed = hashSeed(`${task.prompt}:branch:${level}`, localSeed);
            trace.push(`branch_level_${level}:seed=${localSeed}`);
        }
        return {
            strategyId: this.id,
            conclusion: `Tree-search resolution for ${task.taskId}`,
            confidence: deterministicConfidence(localSeed, 0.03),
            trace,
        };
    }
}
export class DebateStrategy {
    id = 'debate';
    metadata = { depth: 2, agents: 2, usesReflection: false, usesDebate: true, usesRetrieval: false };
    async execute(task) {
        const agentA = hashSeed(`${task.prompt}:agentA`, task.seed);
        const agentB = hashSeed(`${task.prompt}:agentB`, task.seed);
        const merged = (agentA + agentB) % 1_000_003;
        return {
            strategyId: this.id,
            conclusion: `Debate resolution for ${task.taskId}`,
            confidence: deterministicConfidence(merged, 0.025),
            trace: [`agentA=${agentA}`, `agentB=${agentB}`, `consensus=${merged}`],
        };
    }
}
export class MultiDebateStrategy {
    agentCount;
    id = 'multi_debate';
    metadata;
    constructor(agentCount = 4) {
        this.agentCount = agentCount;
        this.metadata = {
            depth: 3,
            agents: agentCount,
            usesReflection: false,
            usesDebate: true,
            usesRetrieval: false,
        };
    }
    async execute(task) {
        const trace = [];
        let aggregate = 0;
        for (let idx = 0; idx < this.agentCount; idx += 1) {
            const agentSeed = hashSeed(`${task.prompt}:agent:${idx}`, task.seed + idx);
            aggregate = (aggregate + agentSeed) % 1_000_003;
            trace.push(`agent_${idx + 1}=${agentSeed}`);
        }
        trace.push(`aggregate=${aggregate}`);
        return {
            strategyId: this.id,
            conclusion: `Multi-debate resolution for ${task.taskId}`,
            confidence: deterministicConfidence(aggregate, 0.04),
            trace,
        };
    }
}
export class SelfConsistencyStrategy {
    samples;
    id = 'self_consistency';
    metadata;
    constructor(samples = 5) {
        this.samples = samples;
        this.metadata = {
            depth: 2,
            agents: samples,
            usesReflection: true,
            usesDebate: false,
            usesRetrieval: false,
        };
    }
    async execute(task) {
        const votes = new Map();
        const trace = [];
        for (let sample = 0; sample < this.samples; sample += 1) {
            const sampleSeed = hashSeed(`${task.prompt}:sample:${sample}`, task.seed);
            const vote = sampleSeed % 3;
            votes.set(vote, (votes.get(vote) ?? 0) + 1);
            trace.push(`sample_${sample + 1}=vote_${vote},seed=${sampleSeed}`);
        }
        const winner = [...votes.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
        return {
            strategyId: this.id,
            conclusion: `Self-consistent resolution(vote=${winner}) for ${task.taskId}`,
            confidence: deterministicConfidence(hashSeed(String(winner), task.seed), 0.03),
            trace,
        };
    }
}
