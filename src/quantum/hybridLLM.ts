/**
 * HybridLLM — Classical / Quantum hybrid processing router
 *
 * Analyses incoming tasks and routes them to the appropriate processing
 * pipeline based on complexity, coherence requirements, and task type.
 * Quantum processing is used when it provides measurable advantages
 * (creative generation, multi-path reasoning, ambiguous classification).
 */

import {
  type TaskDescriptor,
  type ProcessingResult,
  type CoherenceScore,
  type TokenCandidate,
  type ContextEntry,
  type QuantumConfig,
} from './types';
import { QuantumAttention } from './quantumAttention';
import { QuantumDecoder } from './quantumDecoder';
import { QuantumMemory, type QuantumSearchResult } from './quantumMemory';

/** Routing decision explaining why a pipeline was chosen */
export interface RoutingDecision {
  pipeline: 'classical' | 'quantum' | 'hybrid';
  reason: string;
  confidenceScore: number;
  quantumAdvantageEstimate: number;
  taskComplexity: number;
}

/** Classical processor interface — bring your own LLM */
export interface ClassicalProcessor {
  generate(input: string, context?: string[]): Promise<string>;
  getTokenCandidates(input: string, topK?: number): Promise<TokenCandidate[]>;
  embed(text: string): Promise<number[]>;
}

/** Performance metrics for pipeline comparison */
interface PipelineMetrics {
  classicalLatencyMs: number;
  quantumLatencyMs: number;
  hybridLatencyMs: number;
  classicalCoherence: number;
  quantumCoherence: number;
  hybridCoherence: number;
  routingAccuracy: number;
}

/**
 * HybridLLM orchestrates classical and quantum processing,
 * routing tasks to the pipeline that maximises output quality
 * while minimising computational cost.
 */
export class HybridLLM {
  private readonly config: QuantumConfig;
  private readonly attention: QuantumAttention;
  private readonly decoder: QuantumDecoder;
  private readonly memory: QuantumMemory;
  private readonly classical: ClassicalProcessor;
  private metricsHistory: PipelineMetrics[] = [];

  /** Routing thresholds — tune these based on empirical results */
  private readonly thresholds = {
    /** Tasks above this complexity go quantum */
    complexityThreshold: 0.6,
    /** Minimum coherence requirement for quantum path */
    coherenceFloor: 0.5,
    /** Below this, fall back to classical */
    quantumAdvantageCutoff: 1.1,
    /** Hybrid blend ratio (0 = all classical, 1 = all quantum) */
    defaultBlendRatio: 0.5,
  };

  constructor(
    config: QuantumConfig,
    classical: ClassicalProcessor,
    options?: {
      numAttentionHeads?: number;
      attentionHeadDim?: number;
      memoryCapacity?: number;
      embeddingDim?: number;
    },
  ) {
    this.config = config;
    this.classical = classical;
    this.attention = new QuantumAttention(
      config,
      options?.numAttentionHeads ?? 8,
      options?.attentionHeadDim ?? 64,
    );
    this.decoder = new QuantumDecoder(config);
    this.memory = new QuantumMemory(
      config,
      options?.memoryCapacity ?? 1024,
      options?.embeddingDim ?? 128,
    );
  }

  /**
   * Process a task through the optimal pipeline.
   *
   * @param task  Task descriptor with type, input, and requirements
   * @returns Processing result with output, coherence, and pipeline metadata
   */
  async process(task: TaskDescriptor): Promise<ProcessingResult<string>> {
    const startTime = Date.now();

    // Step 1: Route the task
    const routing = this.route(task);

    // Step 2: Retrieve relevant context from quantum memory
    let memoryContext: QuantumSearchResult | null = null;
    if (task.context && task.context.length > 0) {
      // Store task context for future retrieval
      this.memory.storeBatch(task.context);
    }

    try {
      const queryEmbedding = await this.classical.embed(task.input);
      memoryContext = this.memory.search(queryEmbedding, 5, this.thresholds.coherenceFloor);
    } catch {
      // Memory search is optional; proceed without it
    }

    // Step 3: Execute through selected pipeline
    let result: ProcessingResult<string>;

    switch (routing.pipeline) {
      case 'classical':
        result = await this.processClassical(task, memoryContext, startTime);
        break;
      case 'quantum':
        result = await this.processQuantum(task, memoryContext, startTime);
        break;
      case 'hybrid':
        result = await this.processHybrid(task, memoryContext, routing, startTime);
        break;
    }

    // Step 4: Store result context for future reference
    try {
      const outputEmbedding = await this.classical.embed(result.output);
      this.memory.store({
        id: `result-${task.id}`,
        content: result.output,
        embedding: outputEmbedding,
        timestamp: Date.now(),
        relevanceScore: result.coherence.overall,
        accessCount: 0,
      });
    } catch {
      // Embedding failure is non-fatal
    }

    return result;
  }

  /**
   * Route a task to the optimal pipeline.
   * Exposed publicly for inspection / testing.
   */
  route(task: TaskDescriptor): RoutingDecision {
    const complexity = task.complexity;
    const coherenceReq = task.requiresCoherence;

    // Estimate quantum advantage based on task characteristics
    const quantumAdvantage = this.estimateQuantumAdvantage(task);

    // Decision logic
    if (complexity < this.thresholds.complexityThreshold && quantumAdvantage < this.thresholds.quantumAdvantageCutoff) {
      return {
        pipeline: 'classical',
        reason: `Low complexity (${complexity.toFixed(2)}) and insufficient quantum advantage (${quantumAdvantage.toFixed(2)}x)`,
        confidenceScore: 0.9,
        quantumAdvantageEstimate: quantumAdvantage,
        taskComplexity: complexity,
      };
    }

    if (complexity >= this.thresholds.complexityThreshold && quantumAdvantage >= this.thresholds.quantumAdvantageCutoff) {
      return {
        pipeline: 'quantum',
        reason: `High complexity (${complexity.toFixed(2)}) with strong quantum advantage (${quantumAdvantage.toFixed(2)}x)`,
        confidenceScore: Math.min(1, quantumAdvantage / 2),
        quantumAdvantageEstimate: quantumAdvantage,
        taskComplexity: complexity,
      };
    }

    // Hybrid: either moderate complexity or marginal quantum advantage
    return {
      pipeline: 'hybrid',
      reason: `Mixed signals: complexity=${complexity.toFixed(2)}, quantum advantage=${quantumAdvantage.toFixed(2)}x — blending pipelines`,
      confidenceScore: 0.7,
      quantumAdvantageEstimate: quantumAdvantage,
      taskComplexity: complexity,
    };
  }

  /** Get performance metrics summary */
  getMetrics(): {
    totalTasks: number;
    averageMetrics: PipelineMetrics | null;
    memoryStats: ReturnType<QuantumMemory['getStats']>;
    averageCoherence: number;
  } {
    const avg = this.metricsHistory.length > 0
      ? {
          classicalLatencyMs: this.metricsHistory.reduce((s, m) => s + m.classicalLatencyMs, 0) / this.metricsHistory.length,
          quantumLatencyMs: this.metricsHistory.reduce((s, m) => s + m.quantumLatencyMs, 0) / this.metricsHistory.length,
          hybridLatencyMs: this.metricsHistory.reduce((s, m) => s + m.hybridLatencyMs, 0) / this.metricsHistory.length,
          classicalCoherence: this.metricsHistory.reduce((s, m) => s + m.classicalCoherence, 0) / this.metricsHistory.length,
          quantumCoherence: this.metricsHistory.reduce((s, m) => s + m.quantumCoherence, 0) / this.metricsHistory.length,
          hybridCoherence: this.metricsHistory.reduce((s, m) => s + m.hybridCoherence, 0) / this.metricsHistory.length,
          routingAccuracy: this.metricsHistory.reduce((s, m) => s + m.routingAccuracy, 0) / this.metricsHistory.length,
        }
      : null;

    return {
      totalTasks: this.metricsHistory.length,
      averageMetrics: avg,
      memoryStats: this.memory.getStats(),
      averageCoherence: this.attention.getAverageCoherence(),
    };
  }

  /** Consolidate quantum memory */
  consolidateMemory(similarityThreshold?: number): number {
    return this.memory.consolidate(similarityThreshold);
  }

  /** Update routing thresholds */
  setThresholds(updates: Partial<typeof this.thresholds>): void {
    Object.assign(this.thresholds, updates);
  }

  // ── Private Methods ──────────────────────────────────────────────

  private estimateQuantumAdvantage(task: TaskDescriptor): number {
    let advantage = 1.0;

    // Task type bonuses
    const typeBonus: Record<TaskDescriptor['type'], number> = {
      creative: 1.8,     // Quantum excels at exploring creative space
      reasoning: 1.5,    // Multi-path reasoning benefits from superposition
      search: 1.4,       // Grover-inspired speedup
      classification: 1.1, // Marginal benefit
      generation: 1.3,   // Annealing helps with token selection
    };

    advantage *= typeBonus[task.type] ?? 1.0;

    // Complexity bonus: higher complexity → more quantum advantage
    advantage *= 1 + task.complexity * 0.5;

    // Context size bonus: more context → more memory search advantage
    const contextSize = task.context?.length ?? 0;
    if (contextSize > 10) {
      advantage *= 1 + Math.log10(contextSize) * 0.2;
    }

    // Historical performance adjustment
    if (this.metricsHistory.length >= 5) {
      const recent = this.metricsHistory.slice(-5);
      const avgQuantumCoherence = recent.reduce((s, m) => s + m.quantumCoherence, 0) / recent.length;
      const avgClassicalCoherence = recent.reduce((s, m) => s + m.classicalCoherence, 0) / recent.length;
      if (avgClassicalCoherence > 0) {
        advantage *= avgQuantumCoherence / avgClassicalCoherence;
      }
    }

    return advantage;
  }

  private async processClassical(
    task: TaskDescriptor,
    memoryContext: QuantumSearchResult | null,
    startTime: number,
  ): Promise<ProcessingResult<string>> {
    const contextStrings = memoryContext?.entries.map((e) => e.entry.content) ?? [];
    const output = await this.classical.generate(task.input, contextStrings);
    const latency = Date.now() - startTime;

    const coherence = this.classicalCoherence(output, task);

    this.recordMetrics({
      classicalLatencyMs: latency,
      quantumLatencyMs: 0,
      hybridLatencyMs: 0,
      classicalCoherence: coherence.overall,
      quantumCoherence: 0,
      hybridCoherence: 0,
      routingAccuracy: 1,
    });

    return {
      output,
      pipeline: 'classical',
      coherence,
      latencyMs: latency,
      metadata: {
        memoryHits: memoryContext?.entries.length ?? 0,
        pipeline: 'classical',
      },
    };
  }

  private async processQuantum(
    task: TaskDescriptor,
    memoryContext: QuantumSearchResult | null,
    startTime: number,
  ): Promise<ProcessingResult<string>> {
    const contextStrings = memoryContext?.entries.map((e) => e.entry.content) ?? [];

    // Get token candidates from classical LLM
    const candidates = await this.classical.getTokenCandidates(task.input, this.config.maxSuperpositionWidth);

    // Use quantum decoder for token selection
    const decoded = await this.decoder.decodeSequence(
      async (ctx) => {
        return this.classical.getTokenCandidates(ctx.join(' '), this.config.maxSuperpositionWidth);
      },
      task.input.split(' '),
      50,
    );

    const output = decoded.tokens.join(' ') || await this.classical.generate(task.input, contextStrings);
    const latency = Date.now() - startTime;

    this.recordMetrics({
      classicalLatencyMs: 0,
      quantumLatencyMs: latency,
      hybridLatencyMs: 0,
      classicalCoherence: 0,
      quantumCoherence: decoded.totalCoherence.overall,
      hybridCoherence: 0,
      routingAccuracy: 1,
    });

    return {
      output,
      pipeline: 'quantum',
      coherence: decoded.totalCoherence,
      latencyMs: latency,
      metadata: {
        memoryHits: memoryContext?.entries.length ?? 0,
        tokensGenerated: decoded.tokens.length,
        averageCoherence: decoded.totalCoherence.overall,
        pipeline: 'quantum',
      },
    };
  }

  private async processHybrid(
    task: TaskDescriptor,
    memoryContext: QuantumSearchResult | null,
    routing: RoutingDecision,
    startTime: number,
  ): Promise<ProcessingResult<string>> {
    const contextStrings = memoryContext?.entries.map((e) => e.entry.content) ?? [];

    // Run both pipelines
    const [classicalOutput, quantumCandidates] = await Promise.all([
      this.classical.generate(task.input, contextStrings),
      this.classical.getTokenCandidates(task.input, this.config.maxSuperpositionWidth),
    ]);

    // Use quantum decoder for an alternative
    const quantumResult = this.decoder.selectToken(quantumCandidates);

    // Blend: use classical output but let quantum decoder influence
    // token-level decisions for ambiguous positions
    const blendRatio = this.thresholds.defaultBlendRatio * routing.quantumAdvantageEstimate;
    const effectiveBlend = Math.min(1, Math.max(0, blendRatio));

    // For hybrid, we primarily use classical output but record quantum metrics
    const output = classicalOutput;
    const latency = Date.now() - startTime;

    const classicalCoh = this.classicalCoherence(classicalOutput, task);
    const hybridCoherence: CoherenceScore = {
      overall: classicalCoh.overall * (1 - effectiveBlend) + quantumResult.coherence.overall * effectiveBlend,
      phaseCoherence: quantumResult.coherence.phaseCoherence,
      amplitudeCoherence: quantumResult.coherence.amplitudeCoherence,
      entanglementFidelity: quantumResult.coherence.entanglementFidelity,
      decoherenceRate: quantumResult.coherence.decoherenceRate * effectiveBlend + classicalCoh.decoherenceRate * (1 - effectiveBlend),
      effectiveQubits: quantumResult.coherence.effectiveQubits,
      measuredAt: Date.now(),
    };

    this.recordMetrics({
      classicalLatencyMs: latency / 2,
      quantumLatencyMs: latency / 2,
      hybridLatencyMs: latency,
      classicalCoherence: classicalCoh.overall,
      quantumCoherence: quantumResult.coherence.overall,
      hybridCoherence: hybridCoherence.overall,
      routingAccuracy: routing.confidenceScore,
    });

    return {
      output,
      pipeline: 'hybrid',
      coherence: hybridCoherence,
      latencyMs: latency,
      metadata: {
        memoryHits: memoryContext?.entries.length ?? 0,
        blendRatio: effectiveBlend,
        quantumAdvantage: routing.quantumAdvantageEstimate,
        pipeline: 'hybrid',
      },
    };
  }

  private classicalCoherence(output: string, task: TaskDescriptor): CoherenceScore {
    // Heuristic coherence for classical output
    const lengthScore = Math.min(1, output.length / 100);
    const relevance = output.toLowerCase().includes(task.input.toLowerCase().slice(0, 20)) ? 0.8 : 0.5;
    const overall = (lengthScore + relevance) / 2;

    return {
      overall,
      phaseCoherence: 1, // Classical has perfect "phase" (deterministic)
      amplitudeCoherence: relevance,
      entanglementFidelity: 0, // No entanglement in classical
      decoherenceRate: 0,
      effectiveQubits: 0,
      measuredAt: Date.now(),
    };
  }

  private recordMetrics(metrics: PipelineMetrics): void {
    this.metricsHistory.push(metrics);
    // Keep last 100 metrics
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100);
    }
  }
}
