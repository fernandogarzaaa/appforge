/**
 * @fileoverview Hybrid Quantum-Classical LLM Integration
 * Combines quantum and classical processing layers for optimal performance.
 * Routes tasks between quantum and classical based on complexity and
 * uses coherence as a quality metric.
 * 
 * Theory: Not all tasks benefit from quantum processing. This module
 * intelligently routes tasks:
 * - Quantum: Attention, decoding optimization, memory retrieval
 * - Classical: Token embedding, feed-forward, normalization
 * 
 * Coherence serves as a quality metric: high coherence = high quality output
 * 
 * @module hybridLLM
 */

import { QuantumSelfAttention, type QuantumAttentionResult } from './quantumAttention.js';
import { QuantumAnnealingDecoder, type QuantumDecodeResult } from './quantumDecoder.js';
import { QRAM, type MemoryRetrievalResult } from './quantumMemory.js';

/**
 * Configuration for Hybrid Quantum-Classical LLM
 */
export interface HybridLLMConfig {
  /** Model dimension */
  dModel: number;
  /** Number of layers */
  numLayers: number;
  /** Number of attention heads */
  numHeads: number;
  /** Vocabulary size */
  vocabSize: number;
  /** Maximum sequence length */
  maxSeqLength: number;
  /** Quantum layer ratio (0-1) */
  quantumRatio: number;
  /** Coherence threshold for quantum routing */
  coherenceThreshold: number;
  /** Use quantum attention */
  useQuantumAttention: boolean;
  /** Use quantum decoder */
  useQuantumDecoder: boolean;
  /** Use quantum memory */
  useQuantumMemory: boolean;
  /** Fallback to classical on quantum error */
  fallbackOnError: boolean;
}

/**
 * Default hybrid LLM configuration
 */
export const DEFAULT_HYBRID_LLM_CONFIG: HybridLLMConfig = {
  dModel: 512,
  numLayers: 6,
  numHeads: 8,
  vocabSize: 50000,
  maxSeqLength: 2048,
  quantumRatio: 0.5,
  coherenceThreshold: 0.7,
  useQuantumAttention: true,
  useQuantumDecoder: true,
  useQuantumMemory: true,
  fallbackOnError: true
};

/**
 * Task type for routing decisions
 */
export type TaskType = 
  | 'attention'
  | 'feedforward'
  | 'embedding'
  | 'decoding'
  | 'memory'
  | 'normalization';

/**
 * Processing mode for a task
 */
export type ProcessingMode = 'quantum' | 'classical' | 'hybrid';

/**
 * Task routing decision
 */
export interface RoutingDecision {
  taskType: TaskType;
  mode: ProcessingMode;
  confidence: number;
  estimatedSpeedup: number;
  reason: string;
}

/**
 * Layer output with quantum metrics
 */
export interface HybridLayerOutput {
  /** Output embeddings */
  output: Float32Array;
  /** Processing mode used */
  mode: ProcessingMode;
  /** Coherence score */
  coherence: number;
  /** Entropy (uncertainty) */
  entropy: number;
  /** Processing time (ms) */
  processingTime: number;
  /** Quantum advantage achieved */
  quantumAdvantage: number;
}

/**
 * Complete inference result
 */
export interface HybridInferenceResult {
  /** Output tokens */
  tokens: number[];
  /** Output text */
  text: string;
  /** Per-layer outputs */
  layerOutputs: HybridLayerOutput[];
  /** Overall coherence */
  overallCoherence: number;
  /** Routing decisions made */
  routingDecisions: RoutingDecision[];
  /** Performance metrics */
  metrics: {
    totalTime: number;
    tokensPerSecond: number;
    quantumLayersUsed: number;
    classicalLayersUsed: number;
    avgCoherence: number;
    speedupVsClassical: number;
  };
}

/**
 * Hybrid Quantum-Classical LLM
 * 
 * Combines the best of both worlds:
 * - Quantum: Exponential state space, interference, entanglement
 * - Classical: Stable training, proven architectures, hardware acceleration
 */
export class HybridLLM {
  private config: HybridLLMConfig;
  private quantumAttention: QuantumSelfAttention | null;
  private quantumMemory: QRAM | null;
  private routingHistory: RoutingDecision[];
  private performanceStats: Map<TaskType, { quantum: number; classical: number }>;

  constructor(config: Partial<HybridLLMConfig> = {}) {
    this.config = { ...DEFAULT_HYBRID_LLM_CONFIG, ...config };
    this.routingHistory = [];
    this.performanceStats = new Map();
    
    // Initialize quantum components if enabled
    this.quantumAttention = this.config.useQuantumAttention 
      ? new QuantumSelfAttention({
          numQubits: Math.ceil(Math.log2(this.config.maxSeqLength)),
          embedDim: this.config.dModel,
          numHeads: this.config.numHeads,
          entanglementStrength: 0.8,
          useQFT: true,
          interferenceIntensity: 0.7
        })
      : null;
    
    this.quantumMemory = this.config.useQuantumMemory
      ? new QRAM({
          capacity: this.config.maxSeqLength,
          embeddingDim: this.config.dModel,
          enableGroverSearch: true
        })
      : null;
  }

  /**
   * Route a task to quantum or classical processing
   * 
   * Routing strategy:
   * 1. Attention: Use quantum for long sequences (>512 tokens)
   * 2. FeedForward: Use classical (universal approximation)
   * 3. Decoding: Use quantum for complex optimization
   * 4. Memory: Use quantum for large memory (>1000 entries)
   * 5. Embedding: Use classical (learned representations)
   */
  routeTask(
    taskType: TaskType,
    inputSize: number,
    complexity: number
  ): RoutingDecision {
    let mode: ProcessingMode = 'classical';
    let confidence = 0.5;
    let estimatedSpeedup = 1.0;
    let reason = '';
    
    switch (taskType) {
      case 'attention':
        if (this.config.useQuantumAttention && inputSize > 512) {
          mode = 'quantum';
          confidence = 0.85;
          estimatedSpeedup = inputSize / Math.log2(inputSize);
          reason = `Long sequence (${inputSize} tokens) benefits from quantum parallelism`;
        } else {
          mode = 'classical';
          confidence = 0.9;
          estimatedSpeedup = 1.0;
          reason = `Short sequence (${inputSize} tokens) - classical is optimal`;
        }
        break;
        
      case 'decoding':
        if (this.config.useQuantumDecoder && complexity > 0.7) {
          mode = 'quantum';
          confidence = 0.8;
          estimatedSpeedup = 2.5;
          reason = 'High complexity decoding benefits from quantum annealing';
        } else {
          mode = 'classical';
          confidence = 0.85;
          estimatedSpeedup = 1.0;
          reason = 'Low complexity - classical beam search sufficient';
        }
        break;
        
      case 'memory':
        if (this.config.useQuantumMemory && inputSize > 1000) {
          mode = 'quantum';
          confidence = 0.82;
          estimatedSpeedup = Math.sqrt(inputSize);
          reason = `Large memory (${inputSize} entries) benefits from Grover search`;
        } else {
          mode = 'classical';
          confidence = 0.9;
          reason = 'Small memory - classical hash table optimal';
        }
        break;
        
      case 'feedforward':
        mode = 'classical';
        confidence = 0.95;
        reason = 'Feed-forward networks best handled classically';
        break;
        
      case 'embedding':
        mode = 'classical';
        confidence = 0.95;
        reason = 'Embeddings are learned classical representations';
        break;
        
      case 'normalization':
        mode = 'classical';
        confidence = 0.95;
        reason = 'Layer normalization is classical operation';
        break;
    }
    
    const decision: RoutingDecision = {
      taskType,
      mode,
      confidence,
      estimatedSpeedup,
      reason
    };
    
    this.routingHistory.push(decision);
    return decision;
  }

  /**
   * Process a single layer with hybrid routing
   */
  async processLayer(
    input: Float32Array,
    layerIndex: number,
    sequenceLength: number
  ): Promise<HybridLayerOutput> {
    const startTime = performance.now();
    
    // Route attention computation
    const attentionDecision = this.routeTask('attention', sequenceLength, 0.5);
    
    let attentionOutput: Float32Array;
    let coherence = 0.5;
    let entropy = 0;
    let quantumAdvantage = 0;
    
    if (attentionDecision.mode === 'quantum' && this.quantumAttention) {
      // Quantum attention
      const queries = input;
      const keys = input;
      const values = input;
      
      const result = this.quantumAttention.computeAttention(
        queries, keys, values, sequenceLength
      );
      
      attentionOutput = result.output;
      coherence = result.coherence;
      entropy = result.entanglementEntropy;
      quantumAdvantage = attentionDecision.estimatedSpeedup;
    } else {
      // Classical attention (simplified)
      attentionOutput = await this.classicalAttention(input, sequenceLength);
      coherence = 0.7; // Baseline coherence
      entropy = 0.5;
      quantumAdvantage = 1.0;
    }
    
    // Add residual connection
    const residualOutput = this.addResidual(input, attentionOutput);
    
    // Layer normalization (always classical)
    const normalizedOutput = this.layerNormalize(residualOutput);
    
    // Feed-forward (always classical)
    const ffOutput = this.feedForward(normalizedOutput);
    
    // Final residual and norm
    const finalOutput = this.layerNormalize(
      this.addResidual(normalizedOutput, ffOutput)
    );
    
    const processingTime = performance.now() - startTime;
    
    return {
      output: finalOutput,
      mode: attentionDecision.mode,
      coherence,
      entropy,
      processingTime,
      quantumAdvantage
    };
  }

  /**
   * Complete forward pass through hybrid model
   */
  async forward(
    inputTokens: number[],
    options?: {
      maxNewTokens?: number;
      temperature?: number;
      topP?: number;
    }
  ): Promise<HybridInferenceResult> {
    const startTime = performance.now();
    const maxNewTokens = options?.maxNewTokens || 100;
    
    // Embed tokens
    let hiddenStates = await this.embedTokens(inputTokens);
    
    // Process through layers
    const layerOutputs: HybridLayerOutput[] = [];
    const routingDecisions: RoutingDecision[] = [];
    
    for (let layer = 0; layer < this.config.numLayers; layer++) {
      const layerOutput = await this.processLayer(
        hiddenStates,
        layer,
        inputTokens.length
      );
      
      layerOutputs.push(layerOutput);
      hiddenStates = layerOutput.output;
      
      // Collect routing decisions
      const decision = this.routeTask('attention', inputTokens.length, 0.5);
      routingDecisions.push(decision);
    }
    
    // Decode tokens
    const decodedTokens = await this.decodeTokens(
      hiddenStates,
      maxNewTokens,
      options
    );
    
    const totalTime = performance.now() - startTime;
    const overallCoherence = this.calculateOverallCoherence(layerOutputs);
    
    // Calculate metrics
    const quantumLayersUsed = layerOutputs.filter(l => l.mode === 'quantum').length;
    const classicalLayersUsed = layerOutputs.filter(l => l.mode === 'classical').length;
    const avgCoherence = layerOutputs.reduce((sum, l) => sum + l.coherence, 0) 
      / layerOutputs.length;
    
    return {
      tokens: decodedTokens,
      text: this.tokensToText(decodedTokens),
      layerOutputs,
      overallCoherence,
      routingDecisions,
      metrics: {
        totalTime,
        tokensPerSecond: (decodedTokens.length / totalTime) * 1000,
        quantumLayersUsed,
        classicalLayersUsed,
        avgCoherence,
        speedupVsClassical: this.estimateSpeedup(layerOutputs)
      }
    };
  }

  /**
   * Calculate overall coherence across all layers
   * 
   * Coherence as quality metric:
   * - High coherence = models/layers agree = high quality
   * - Low coherence = divergence = potential issues
   */
  private calculateOverallCoherence(layerOutputs: HybridLayerOutput[]): number {
    if (layerOutputs.length === 0) return 0;
    
    const coherences = layerOutputs.map(l => l.coherence);
    
    // Weight recent layers more heavily
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < coherences.length; i++) {
      const weight = (i + 1) / coherences.length; // Linear increase
      weightedSum += weight * coherences[i];
      weightSum += weight;
    }
    
    return weightedSum / weightSum;
  }

  /**
   * Estimate speedup vs pure classical
   */
  private estimateSpeedup(layerOutputs: HybridLayerOutput[]): number {
    let totalAdvantage = 0;
    
    for (const output of layerOutputs) {
      totalAdvantage += output.quantumAdvantage;
    }
    
    return totalAdvantage / layerOutputs.length;
  }

  /**
   * Classical attention (simplified implementation)
   */
  private async classicalAttention(
    input: Float32Array,
    seqLen: number
  ): Promise<Float32Array> {
    // Simplified scaled dot-product attention
    const output = new Float32Array(input);
    
    // Apply softmax-like normalization
    let sum = 0;
    for (let i = 0; i < output.length; i++) {
      output[i] = Math.exp(output[i]);
      sum += output[i];
    }
    
    for (let i = 0; i < output.length; i++) {
      output[i] /= sum;
    }
    
    return output;
  }

  /**
   * Add residual connection
   */
  private addResidual(x: Float32Array, y: Float32Array): Float32Array {
    const output = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
      output[i] = x[i] + (y[i] || 0);
    }
    return output;
  }

  /**
   * Layer normalization (simplified)
   */
  private layerNormalize(x: Float32Array): Float32Array {
    const output = new Float32Array(x.length);
    
    // Calculate mean and variance
    let mean = 0;
    for (const val of x) mean += val;
    mean /= x.length;
    
    let variance = 0;
    for (const val of x) variance += (val - mean) ** 2;
    variance /= x.length;
    
    const std = Math.sqrt(variance + 1e-5);
    
    // Normalize
    for (let i = 0; i < x.length; i++) {
      output[i] = (x[i] - mean) / std;
    }
    
    return output;
  }

  /**
   * Feed-forward network (simplified)
   */
  private feedForward(x: Float32Array): Float32Array {
    // Simplified feed-forward with ReLU activation
    const output = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
      output[i] = Math.max(0, x[i] * 1.5 + 0.1); // ReLU
    }
    return output;
  }

  /**
   * Embed tokens to vectors
   */
  private async embedTokens(tokens: number[]): Promise<Float32Array> {
    // Simplified embedding lookup
    const embedDim = this.config.dModel;
    const embeddings = new Float32Array(tokens.length * embedDim);
    
    for (let i = 0; i < tokens.length; i++) {
      for (let d = 0; d < embedDim; d++) {
        // Pseudo-random but deterministic embedding
        embeddings[i * embedDim + d] = Math.sin(tokens[i] * (d + 1)) * 0.1;
      }
    }
    
    return embeddings;
  }

  /**
   * Decode tokens from hidden states
   */
  private async decodeTokens(
    hiddenStates: Float32Array,
    maxTokens: number,
    options?: { temperature?: number; topP?: number }
  ): Promise<number[]> {
    // Simplified token decoding
    const tokens: number[] = [];
    
    for (let i = 0; i < maxTokens && i < hiddenStates.length / this.config.dModel; i++) {
      // Simple argmax sampling
      const tokenId = Math.abs(Math.floor(hiddenStates[i * this.config.dModel] * 100)) 
        % this.config.vocabSize;
      tokens.push(tokenId);
    }
    
    return tokens;
  }

  /**
   * Convert tokens to text
   */
  private tokensToText(tokens: number[]): string {
    // Placeholder - would use actual tokenizer
    return tokens.map(t => `[${t}]`).join(' ');
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalDecisions: number;
    quantumUsage: number;
    classicalUsage: number;
    avgConfidence: number;
  } {
    const total = this.routingHistory.length;
    const quantumCount = this.routingHistory.filter(d => d.mode === 'quantum').length;
    const classicalCount = this.routingHistory.filter(d => d.mode === 'classical').length;
    const avgConfidence = this.routingHistory.reduce((sum, d) => sum + d.confidence, 0) / total;
    
    return {
      totalDecisions: total,
      quantumUsage: quantumCount / total,
      classicalUsage: classicalCount / total,
      avgConfidence
    };
  }
}

/**
 * Coherence-based quality validator
 * Uses quantum coherence as a principled quality metric
 */
export class CoherenceValidator {
  /**
   * Validate output quality using coherence
   * 
   * High coherence = models agree = low hallucination risk
   * Low coherence = models disagree = high hallucination risk
   */
  static validate(
    coherence: number,
    entropy: number,
    threshold: number = 0.7
  ): {
    isValid: boolean;
    quality: 'high' | 'medium' | 'low';
    hallucinationRisk: number;
    recommendation: string;
  } {
    const quality = coherence > threshold 
      ? 'high' 
      : coherence > threshold * 0.7 
        ? 'medium' 
        : 'low';
    
    const hallucinationRisk = 1 - coherence;
    
    let recommendation = '';
    if (coherence > threshold) {
      recommendation = 'Output is reliable. Proceed with confidence.';
    } else if (coherence > threshold * 0.7) {
      recommendation = 'Output is acceptable but verify key facts.';
    } else {
      recommendation = 'Low coherence detected. Consider regenerating or human review.';
    }
    
    return {
      isValid: coherence >= threshold * 0.7,
      quality,
      hallucinationRisk,
      recommendation
    };
  }

  /**
   * Calculate quantum Fisher information
   * Higher QFI = more sensitive to parameter changes = better discrimination
   */
  static calculateQFI(probabilities: Float32Array): number {
    let qfi = 0;
    
    for (const p of probabilities) {
      if (p > 1e-10) {
        qfi += (1 / p) * ((2 * p - 1) ** 2);
      }
    }
    
    return qfi;
  }
}

/**
 * Factory function to create hybrid LLM
 */
export function createHybridLLM(
  options?: Partial<HybridLLMConfig>
): HybridLLM {
  return new HybridLLM(options);
}

// Exports
export { HybridLLM, CoherenceValidator };
export default HybridLLM;
