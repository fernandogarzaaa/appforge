export interface TaskInput {
  taskId: string;
  prompt: string;
  seed: number;
  context?: string;
}

export interface TaskOutput {
  strategyId: string;
  conclusion: string;
  confidence: number;
  trace: string[];
}

export interface ReasoningStrategy {
  id: string;
  metadata: {
    depth: number;
    agents: number;
    usesReflection: boolean;
    usesDebate: boolean;
    usesRetrieval: boolean;
  };
  execute(task: TaskInput): Promise<TaskOutput>;
}

function hashSeed(input: string, seed: number): number {
  let value = seed;
  for (const char of input) {
    value = (value * 31 + char.charCodeAt(0)) % 1_000_003;
  }
  return value;
}

function deterministicConfidence(seed: number, bias = 0): number {
  return Number((0.65 + ((seed % 200) / 1000) + bias).toFixed(4));
}

export class DirectStrategy implements ReasoningStrategy {
  id = 'direct';
  metadata = { depth: 1, agents: 1, usesReflection: false, usesDebate: false, usesRetrieval: false };

  async execute(task: TaskInput): Promise<TaskOutput> {
    const localSeed = hashSeed(task.prompt, task.seed);
    return {
      strategyId: this.id,
      conclusion: `Direct resolution for ${task.taskId}`,
      confidence: deterministicConfidence(localSeed),
      trace: [`seed=${localSeed}`, 'single-pass direct reasoning'],
    };
  }
}

export class ReflectionStrategy implements ReasoningStrategy {
  id = 'reflection';
  constructor(private readonly rounds = 2) {}
  metadata = { depth: 2, agents: 1, usesReflection: true, usesDebate: false, usesRetrieval: false };

  async execute(task: TaskInput): Promise<TaskOutput> {
    const trace: string[] = [];
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

export class TreeOfThoughtStrategy implements ReasoningStrategy {
  id = 'tree_of_thought';
  metadata;

  constructor(private readonly depth = 3) {
    this.metadata = { depth, agents: 1, usesReflection: true, usesDebate: false, usesRetrieval: false };
  }

  async execute(task: TaskInput): Promise<TaskOutput> {
    const trace: string[] = [];
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

export class DebateStrategy implements ReasoningStrategy {
  id = 'debate';
  metadata = { depth: 2, agents: 2, usesReflection: false, usesDebate: true, usesRetrieval: false };

  async execute(task: TaskInput): Promise<TaskOutput> {
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

export class MultiDebateStrategy implements ReasoningStrategy {
  id = 'multi_debate';
  metadata;

  constructor(private readonly agentCount = 4) {
    this.metadata = {
      depth: 3,
      agents: agentCount,
      usesReflection: false,
      usesDebate: true,
      usesRetrieval: false,
    };
  }

  async execute(task: TaskInput): Promise<TaskOutput> {
    const trace: string[] = [];
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

export class SelfConsistencyStrategy implements ReasoningStrategy {
  id = 'self_consistency';
  metadata;

  constructor(private readonly samples = 5) {
    this.metadata = {
      depth: 2,
      agents: samples,
      usesReflection: true,
      usesDebate: false,
      usesRetrieval: false,
    };
  }

  async execute(task: TaskInput): Promise<TaskOutput> {
    const votes = new Map<number, number>();
    const trace: string[] = [];

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
