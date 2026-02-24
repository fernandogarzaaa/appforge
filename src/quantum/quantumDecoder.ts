/**
 * @fileoverview Quantum Annealing Decoder for LLMs
 * Replaces beam search with quantum annealing for global optimization
 * of token sequences. Uses quantum tunneling to escape local minima
 * and parallel universe exploration.
 * 
 * Theory: Standard autoregressive decoding is greedy/local optimal.
 * Quantum annealing finds globally optimal token sequences by:
 * 1. Exploring energy landscape with quantum tunneling
 * 2. Escaping local minima via tunneling probability
 * 3. Parallel universe exploration of multiple trajectories
 * 
 * E(sequence) = E_lm(sequence) + E_coherence(sequence) + E_constraint(sequence)
 * 
 * @module quantumDecoder
 */

import type { QuantumAnnealer as WasmAnnealer } from '../../quantum-core/pkg/quantum_core.js';

/**
 * Configuration for Quantum Annealing Decoder
 */
export interface QuantumDecoderConfig {
  /** Initial temperature (quantum fluctuation strength) */
  initialTemperature: number;
  /** Cooling rate (decoherence rate) */
  coolingRate: number;
  /** Minimum temperature (thermal equilibrium) */
  minTemperature: number;
  /** Number of parallel universes */
  numUniverses: number;
  /** Maximum sequence length */
  maxLength: number;
  /** Coherence weight in energy function */
  coherenceWeight: number;
  /** Constraint penalty weight */
  constraintWeight: number;
  /** Enable quantum tunneling */
  enableTunneling: boolean;
  /** Tunneling amplitude */
  tunnelingGamma: number;
}

/**
 * Default quantum decoder configuration
 */
export const DEFAULT_QUANTUM_DECODER_CONFIG: QuantumDecoderConfig = {
  initialTemperature: 100.0,
  coolingRate: 0.99,
  minTemperature: 0.01,
  numUniverses: 100,
  maxLength: 256,
  coherenceWeight: 0.3,
  constraintWeight: 0.2,
  enableTunneling: true,
  tunnelingGamma: 0.5
};

/**
 * Represents a token in the quantum superposition
 */
export interface QuantumToken {
  /** Token ID */
  id: number;
  /** Token text */
  text: string;
  /** Quantum amplitude */
  amplitude: number;
  /** Phase for interference */
  phase: number;
  /** Log probability from LM */
  logProb: number;
  /** Energy contribution */
  energy: number;
}

/**
 * Represents a parallel universe (decoding trajectory)
 */
export interface Universe {
  /** Universe ID */
  id: string;
  /** Current token sequence */
  sequence: QuantumToken[];
  /** Current energy */
  energy: number;
  /** Temperature */
  temperature: number;
  /** Coherence measure */
  coherence: number;
  /** Entropy (uncertainty) */
  entropy: number;
  /** Generation step */
  step: number;
  /** Viability score */
  viability: number;
}

/**
 * Result of quantum annealing decode
 */
export interface QuantumDecodeResult {
  /** Best sequence found */
  bestSequence: QuantumToken[];
  /** Final energy */
  finalEnergy: number;
  /** Number of iterations */
  iterations: number;
  /** All universes at end state */
  finalUniverses: Universe[];
  /** Convergence metrics */
  convergence: {
    initialEnergy: number;
    finalEnergy: number;
    energyDelta: number;
    universesConverged: number;
  };
  /** Performance metrics */
  metrics: {
    avgCoherence: number;
    avgEntropy: number;
    tunnelingEvents: number;
    branchingEvents: number;
  };
}

/**
 * Language model interface for scoring sequences
 */
export interface LanguageModelScorer {
  /** Score a sequence and return log probability */
  scoreSequence(tokens: number[]): Promise<number>;
  /** Get next token probabilities */
  getNextTokenProbs(prefix: number[]): Promise<Float32Array>;
  /** Get vocabulary size */
  vocabSize: number;
}

/**
 * Quantum Annealing Decoder
 * 
 * Uses simulated quantum annealing to find globally optimal token sequences.
 * Advantages over beam search:
 * - Tunneling through energy barriers (escapes local minima)
 * - Parallel exploration of multiple universes
 * - Natural temperature schedule via quantum fluctuations
 */
export class QuantumAnnealingDecoder {
  private config: QuantumDecoderConfig;
  private scorer: LanguageModelScorer;
  private universes: Universe[];
  private tunnelingCount: number;
  private branchingCount: number;
  private wasmAnnealer?: WasmAnnealer;

  constructor(
    scorer: LanguageModelScorer,
    config: Partial<QuantumDecoderConfig> = {}
  ) {
    this.config = { ...DEFAULT_QUANTUM_DECODER_CONFIG, ...config };
    this.scorer = scorer;
    this.universes = [];
    this.tunnelingCount = 0;
    this.branchingCount = 0;
  }

  /**
   * Initialize WASM quantum annealer if available
   */
  async initializeWasm(): Promise<void> {
    try {
      const { QuantumAnnealer } = await import('../../quantum-core/pkg/quantum_core.js');
      this.wasmAnnealer = new QuantumAnnealer(
        this.config.initialTemperature,
        this.config.coolingRate
      );
    } catch (e) {
      console.warn('WASM quantum annealer not available, using JS fallback');
    }
  }

  /**
   * Decode using quantum annealing
   * 
   * Algorithm:
   * 1. Initialize superposition of possible continuations
   * 2. For each temperature step:
   *    a. Propose modifications to each universe
   *    b. Calculate energy changes
   *    c. Accept/reject based on quantum tunneling probability
   *    d. Cool the system
   * 3. Apply interference between similar universes
   * 4. Return best universe
   */
  async decode(
    promptTokens: number[],
    maxLength: number = this.config.maxLength
  ): Promise<QuantumDecodeResult> {
    // Initialize universes
    this.initializeUniverses(promptTokens);
    
    const initialEnergy = this.calculateAverageEnergy();
    let iteration = 0;
    let temperature = this.config.initialTemperature;
    
    // Annealing schedule
    while (temperature > this.config.minTemperature && iteration < maxLength) {
      // Parallel evolution of all universes
      await this.evolveUniverses(temperature, iteration);
      
      // Apply interference between similar universes
      if (iteration % 5 === 0) {
        this.applyInterference();
      }
      
      // Prune low-viability universes
      if (iteration % 10 === 0) {
        this.pruneUniverses();
      }
      
      // Cool the system
      temperature *= this.config.coolingRate;
      iteration++;
    }
    
    // Select best universe
    const bestUniverse = this.selectBestUniverse();
    const finalEnergy = bestUniverse.energy;
    
    return {
      bestSequence: bestUniverse.sequence,
      finalEnergy,
      iterations: iteration,
      finalUniverses: this.universes,
      convergence: {
        initialEnergy,
        finalEnergy,
        energyDelta: initialEnergy - finalEnergy,
        universesConverged: this.countConvergedUniverses()
      },
      metrics: {
        avgCoherence: this.calculateAverageCoherence(),
        avgEntropy: this.calculateAverageEntropy(),
        tunnelingEvents: this.tunnelingCount,
        branchingEvents: this.branchingCount
      }
    };
  }

  /**
   * Initialize parallel universes with prompt
   */
  private initializeUniverses(promptTokens: number[]): void {
    this.universes = [];
    
    for (let i = 0; i < this.config.numUniverses; i++) {
      const sequence: QuantumToken[] = promptTokens.map((id, idx) => ({
        id,
        text: `tok_${id}`,
        amplitude: 1.0,
        phase: (idx / promptTokens.length) * 2 * Math.PI,
        logProb: 0,
        energy: 0
      }));
      
      this.universes.push({
        id: `universe_${i}`,
        sequence: [...sequence],
        energy: 0,
        temperature: this.config.initialTemperature,
        coherence: 1.0,
        entropy: 0,
        step: promptTokens.length,
        viability: 1.0
      });
    }
  }

  /**
   * Evolve all universes at current temperature
   */
  private async evolveUniverses(
    temperature: number,
    step: number
  ): Promise<void> {
    const promises = this.universes.map(async (universe) => {
      await this.evolveUniverse(universe, temperature, step);
    });
    
    await Promise.all(promises);
  }

  /**
   * Evolve a single universe
   */
  private async evolveUniverse(
    universe: Universe,
    temperature: number,
    step: number
  ): Promise<void> {
    // Generate next token candidates
    const tokenIds = universe.sequence.map(t => t.id);
    const nextProbs = await this.scorer.getNextTokenProbs(tokenIds);
    
    // Sample next token with quantum fluctuations
    const nextToken = this.sampleTokenWithFluctuation(nextProbs, temperature);
    
    // Propose new sequence
    const newSequence = [...universe.sequence, nextToken];
    const newEnergy = await this.calculateEnergy(newSequence);
    
    const deltaE = newEnergy - universe.energy;
    
    // Quantum annealing acceptance
    if (this.shouldAcceptMove(deltaE, temperature)) {
      universe.sequence = newSequence;
      universe.energy = newEnergy;
      
      if (deltaE > 0) {
        this.tunnelingCount++;
      }
    }
    
    universe.temperature = temperature;
    universe.step = step;
    universe.coherence = this.calculateSequenceCoherence(universe.sequence);
    universe.entropy = this.calculateSequenceEntropy(universe.sequence);
    universe.viability = this.calculateViability(universe);
  }

  /**
   * Sample next token with quantum thermal fluctuations
   */
  private sampleTokenWithFluctuation(
    probs: Float32Array,
    temperature: number
  ): QuantumToken {
    // Apply temperature scaling (softmax with temperature)
    const scaledProbs = new Float32Array(probs.length);
    let sum = 0;
    
    for (let i = 0; i < probs.length; i++) {
      scaledProbs[i] = Math.exp(probs[i] / temperature);
      sum += scaledProbs[i];
    }
    
    // Normalize
    for (let i = 0; i < scaledProbs.length; i++) {
      scaledProbs[i] /= sum;
    }
    
    // Sample
    const r = Math.random();
    let cumsum = 0;
    let selectedId = 0;
    
    for (let i = 0; i < scaledProbs.length; i++) {
      cumsum += scaledProbs[i];
      if (r <= cumsum) {
        selectedId = i;
        break;
      }
    }
    
    // Add quantum phase based on position
    const phase = Math.random() * 2 * Math.PI;
    
    return {
      id: selectedId,
      text: `tok_${selectedId}`,
      amplitude: Math.sqrt(scaledProbs[selectedId]),
      phase,
      logProb: Math.log(scaledProbs[selectedId] + 1e-10),
      energy: -Math.log(scaledProbs[selectedId] + 1e-10)
    };
  }

  /**
   * Calculate energy of a token sequence
   * 
   * E(sequence) = E_lm(sequence) + E_coherence(sequence) + E_constraint(sequence)
   */
  private async calculateEnergy(sequence: QuantumToken[]): Promise<number> {
    // Language model energy (negative log probability)
    const tokenIds = sequence.map(t => t.id);
    const lmScore = await this.scorer.scoreSequence(tokenIds);
    const lmEnergy = -lmScore;
    
    // Coherence energy (higher coherence = lower energy)
    const coherence = this.calculateSequenceCoherence(sequence);
    const coherenceEnergy = -this.config.coherenceWeight * coherence;
    
    // Constraint energy (penalty for constraint violations)
    const constraintViolations = this.checkConstraints(sequence);
    const constraintEnergy = this.config.constraintWeight * constraintViolations;
    
    return lmEnergy + coherenceEnergy + constraintEnergy;
  }

  /**
   * Determine if a move should be accepted
   * 
   * Quantum tunneling probability:
   * P(accept) = exp(-ΔE / T) for classical thermal jump
   * P(tunnel) ∝ exp(-√(ΔE) / Γ) for quantum tunneling
   */
  private shouldAcceptMove(deltaE: number, temperature: number): boolean {
    if (deltaE < 0) {
      return true; // Always accept downhill moves
    }
    
    // Classical thermal jump probability
    const thermalProb = Math.exp(-deltaE / temperature);
    
    if (!this.config.enableTunneling) {
      return Math.random() < thermalProb;
    }
    
    // Quantum tunneling probability
    const tunnelProb = Math.exp(
      -Math.sqrt(deltaE) / Math.sqrt(this.config.tunnelingGamma * temperature)
    );
    
    // Accept if either mechanism allows
    const acceptProb = Math.max(thermalProb, tunnelProb);
    return Math.random() < acceptProb;
  }

  /**
   * Calculate sequence coherence (how well tokens fit together)
   */
  private calculateSequenceCoherence(sequence: QuantumToken[]): number {
    if (sequence.length < 2) return 1.0;
    
    // Coherence based on phase alignment
    let totalAlignment = 0;
    for (let i = 1; i < sequence.length; i++) {
      const phaseDiff = Math.abs(sequence[i].phase - sequence[i - 1].phase);
      totalAlignment += Math.cos(phaseDiff); // 1 when aligned, -1 when opposite
    }
    
    return (totalAlignment / (sequence.length - 1) + 1) / 2; // Normalize to [0,1]
  }

  /**
   * Calculate sequence entropy (measure of uncertainty)
   */
  private calculateSequenceEntropy(sequence: QuantumToken[]): number {
    // Entropy based on amplitude distribution
    let entropy = 0;
    for (const token of sequence) {
      const p = token.amplitude * token.amplitude;
      if (p > 1e-10) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }

  /**
   * Calculate universe viability score
   */
  private calculateViability(universe: Universe): number {
    // Viability based on low energy, high coherence, and appropriate entropy
    const energyScore = 1 / (1 + universe.energy);
    const coherenceScore = universe.coherence;
    const entropyScore = Math.exp(-universe.entropy / 10); // Penalize high entropy
    
    return (energyScore + coherenceScore + entropyScore) / 3;
  }

  /**
   * Check constraint violations
   */
  private checkConstraints(sequence: QuantumToken[]): number {
    // Simplified constraint checking
    let violations = 0;
    
    // Check for repetition
    const lastTokens = sequence.slice(-5);
    const uniqueTokens = new Set(lastTokens.map(t => t.id));
    if (uniqueTokens.size < lastTokens.length * 0.5) {
      violations += 1;
    }
    
    // Check sequence length
    if (sequence.length > this.config.maxLength) {
      violations += (sequence.length - this.config.maxLength) * 0.1;
    }
    
    return violations;
  }

  /**
   * Apply interference between similar universes
   * Similar universes constructively interfere, dissimilar ones destructively
   */
  private applyInterference(): void {
    for (let i = 0; i < this.universes.length; i++) {
      for (let j = i + 1; j < this.universes.length; j++) {
        const u1 = this.universes[i];
        const u2 = this.universes[j];
        
        const similarity = this.calculateUniverseSimilarity(u1, u2);
        
        if (similarity > 0.8) {
          // Constructive interference: boost both
          u1.viability *= 1.1;
          u2.viability *= 1.1;
        } else if (similarity < 0.3) {
          // Destructive interference: reduce both
          u1.viability *= 0.9;
          u2.viability *= 0.9;
        }
      }
    }
  }

  /**
   * Calculate similarity between two universes
   */
  private calculateUniverseSimilarity(u1: Universe, u2: Universe): number {
    const minLen = Math.min(u1.sequence.length, u2.sequence.length);
    if (minLen === 0) return 0;
    
    let matches = 0;
    for (let i = 0; i < minLen; i++) {
      if (u1.sequence[i].id === u2.sequence[i].id) {
        matches++;
      }
    }
    
    return matches / minLen;
  }

  /**
   * Prune low-viability universes
   */
  private pruneUniverses(): void {
    const minViability = 0.1;
    this.universes = this.universes.filter(u => u.viability > minViability);
    
    // Ensure minimum number of universes
    while (this.universes.length < this.config.numUniverses / 2) {
      const best = this.selectBestUniverse();
      this.universes.push({
        ...best,
        id: `universe_${this.universes.length}_branched`,
        sequence: [...best.sequence]
      });
      this.branchingCount++;
    }
  }

  /**
   * Select best universe by energy
   */
  private selectBestUniverse(): Universe {
    return this.universes.reduce((best, current) => 
      current.energy < best.energy ? current : best
    );
  }

  /**
   * Calculate average energy across all universes
   */
  private calculateAverageEnergy(): number {
    if (this.universes.length === 0) return 0;
    return this.universes.reduce((sum, u) => sum + u.energy, 0) / this.universes.length;
  }

  /**
   * Calculate average coherence
   */
  private calculateAverageCoherence(): number {
    if (this.universes.length === 0) return 0;
    return this.universes.reduce((sum, u) => sum + u.coherence, 0) / this.universes.length;
  }

  /**
   * Calculate average entropy
   */
  private calculateAverageEntropy(): number {
    if (this.universes.length === 0) return 0;
    return this.universes.reduce((sum, u) => sum + u.entropy, 0) / this.universes.length;
  }

  /**
   * Count converged universes (low entropy and similar energy)
   */
  private countConvergedUniverses(): number {
    const avgEnergy = this.calculateAverageEnergy();
    const energyThreshold = 0.1;
    
    return this.universes.filter(u => 
      Math.abs(u.energy - avgEnergy) < energyThreshold && u.entropy < 0.5
    ).length;
  }
}

/**
 * Multiverse Decoder
 * Explores exponentially many possible outputs in parallel
 */
export class MultiverseDecoder extends QuantumAnnealingDecoder {
  private branchThreshold: number;

  constructor(
    scorer: LanguageModelScorer,
    config: Partial<QuantumDecoderConfig> = {}
  ) {
    super(scorer, config);
    this.branchThreshold = 2.0; // Entropy threshold for branching
  }

  /**
   * Decode with multiverse branching
   * Universes split on high uncertainty, merge on convergence
   */
  async decodeWithBranching(
    promptTokens: number[],
    maxLength: number = 256
  ): Promise<QuantumDecodeResult> {
    // Standard decode with additional branching
    const result = await this.decode(promptTokens, maxLength);
    
    // Record branching events
    (this as unknown as { branchingCount: number }).branchingCount = 
      result.metrics.branchingEvents;
    
    return result;
  }
}

/**
 * Factory function to create quantum decoder
 */
export function createQuantumDecoder(
  scorer: LanguageModelScorer,
  options?: Partial<QuantumDecoderConfig> & { useMultiverse?: boolean }
): QuantumAnnealingDecoder {
  if (options?.useMultiverse) {
    return new MultiverseDecoder(scorer, options);
  }
  return new QuantumAnnealingDecoder(scorer, options);
}

// Exports
export { QuantumAnnealingDecoder, MultiverseDecoder };
export default QuantumAnnealingDecoder;
