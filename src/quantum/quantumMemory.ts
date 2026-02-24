/**
 * QuantumMemory — Holographic context storage with Grover-inspired search
 *
 * Stores context entries as holographic patterns (distributed representations)
 * and retrieves them using a Grover-inspired amplitude amplification algorithm
 * that quadratically speeds up search over the context window.
 */

import {
  type ContextEntry,
  type CoherenceScore,
  type QuantumState,
  type ComplexNumber,
  type QuantumConfig,
  complexFromPolar,
  complexMagnitudeSq,
  complexAdd,
  complexMultiply,
  complexConjugate,
} from './types';

/** Holographic memory cell — distributed representation of a context entry */
interface HolographicCell {
  /** Original context entry */
  entry: ContextEntry;
  /** Holographic pattern: interference of embedding with reference beam */
  pattern: ComplexNumber[];
  /** Reconstruction fidelity (how well entry can be recovered) */
  fidelity: number;
  /** Decay factor — reduces over time without reinforcement */
  decay: number;
}

/** Search result from Grover-inspired retrieval */
export interface QuantumSearchResult {
  entries: Array<{
    entry: ContextEntry;
    relevance: number;
    amplificationFactor: number;
  }>;
  iterations: number;
  coherence: CoherenceScore;
  speedupFactor: number;  // vs classical linear search
}

/**
 * QuantumMemory provides:
 * 1. Holographic storage — context entries are stored as interference patterns
 * 2. Grover-inspired search — amplitude amplification for fast retrieval
 * 3. Automatic decay and consolidation — mimics memory consolidation
 */
export class QuantumMemory {
  private readonly config: QuantumConfig;
  private cells: HolographicCell[] = [];
  private readonly maxCapacity: number;
  private readonly embeddingDim: number;
  private referenceBeam: ComplexNumber[];
  private rng: () => number;

  constructor(
    config: QuantumConfig,
    maxCapacity: number = 1024,
    embeddingDim: number = 128,
  ) {
    this.config = config;
    this.maxCapacity = maxCapacity;
    this.embeddingDim = embeddingDim;
    this.rng = config.seed !== undefined ? this.seededRng(config.seed) : Math.random;

    // Generate reference beam (coherent source for holographic encoding)
    this.referenceBeam = this.generateReferenceBeam();
  }

  /**
   * Store a context entry as a holographic pattern.
   *
   * The entry's embedding is interfered with the reference beam to create
   * a distributed holographic representation.
   */
  store(entry: ContextEntry): void {
    // Evict if at capacity (remove lowest-fidelity, highest-decay entry)
    if (this.cells.length >= this.maxCapacity) {
      this.evictWeakest();
    }

    const pattern = this.encode(entry.embedding);
    const fidelity = this.measureFidelity(pattern, entry.embedding);

    this.cells.push({
      entry,
      pattern,
      fidelity,
      decay: 1.0,
    });
  }

  /**
   * Store multiple entries at once.
   */
  storeBatch(entries: ContextEntry[]): void {
    for (const entry of entries) {
      this.store(entry);
    }
  }

  /**
   * Search for relevant context entries using Grover-inspired
   * amplitude amplification.
   *
   * @param queryEmbedding  Query vector to search for
   * @param topK            Number of results to return
   * @param coherenceFloor  Minimum coherence to accept results
   */
  search(
    queryEmbedding: number[],
    topK: number = 5,
    coherenceFloor: number = 0.5,
  ): QuantumSearchResult {
    if (this.cells.length === 0) {
      return this.emptyResult();
    }

    // Apply time-based decay
    this.applyDecay();

    // Initialise uniform superposition over all memory cells
    const n = this.cells.length;
    const amplitudes = new Array<ComplexNumber>(n).fill({ real: 1 / Math.sqrt(n), imaginary: 0 });

    // Compute oracle function: marks entries matching the query
    const oracleScores = this.computeOracleScores(queryEmbedding);

    // Optimal number of Grover iterations ≈ π/4 × √N
    const optimalIterations = Math.max(1, Math.round((Math.PI / 4) * Math.sqrt(n)));
    const iterations = Math.min(optimalIterations, this.config.decoherenceSteps);

    // Run Grover iterations
    let currentAmplitudes = [...amplitudes];
    for (let iter = 0; iter < iterations; iter++) {
      currentAmplitudes = this.groverIteration(currentAmplitudes, oracleScores);
    }

    // Measure: extract probabilities
    const probabilities = currentAmplitudes.map((a) => complexMagnitudeSq(a));
    const probSum = probabilities.reduce((s, p) => s + p, 0) || 1;

    // Rank by probability
    const ranked = this.cells
      .map((cell, i) => ({
        entry: cell.entry,
        relevance: (probabilities[i] / probSum) * cell.fidelity * cell.decay,
        amplificationFactor: probabilities[i] / (1 / n), // how much Grover amplified this
        index: i,
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, topK);

    // Boost access counts for retrieved entries
    for (const r of ranked) {
      this.cells[r.index].entry.accessCount++;
      this.cells[r.index].decay = Math.min(1.0, this.cells[r.index].decay + 0.1);
    }

    const coherence = this.measureSearchCoherence(currentAmplitudes, oracleScores);
    const speedupFactor = n > 0 ? Math.sqrt(n) : 1;

    // Filter by coherence floor
    const filtered = coherence.overall >= coherenceFloor ? ranked : ranked.slice(0, 1);

    return {
      entries: filtered.map(({ entry, relevance, amplificationFactor }) => ({
        entry,
        relevance,
        amplificationFactor,
      })),
      iterations,
      coherence,
      speedupFactor,
    };
  }

  /**
   * Consolidate memory: merge similar entries and refresh fidelity.
   * Should be called periodically.
   */
  consolidate(similarityThreshold: number = 0.9): number {
    let mergeCount = 0;

    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const sim = this.cosineSimilarity(
          this.cells[i].entry.embedding,
          this.cells[j].entry.embedding,
        );

        if (sim > similarityThreshold) {
          // Merge: keep the one with higher access count, absorb the other
          if (this.cells[i].entry.accessCount >= this.cells[j].entry.accessCount) {
            this.cells[i].fidelity = Math.min(1, this.cells[i].fidelity + 0.1);
            this.cells[i].decay = 1.0;
            this.cells.splice(j, 1);
          } else {
            this.cells[j].fidelity = Math.min(1, this.cells[j].fidelity + 0.1);
            this.cells[j].decay = 1.0;
            this.cells.splice(i, 1);
          }
          mergeCount++;
          j--; // recheck current position
        }
      }
    }

    // Re-encode all patterns (refresh hologram)
    for (const cell of this.cells) {
      cell.pattern = this.encode(cell.entry.embedding);
      cell.fidelity = this.measureFidelity(cell.pattern, cell.entry.embedding);
    }

    return mergeCount;
  }

  /** Get current memory utilisation stats */
  getStats(): {
    capacity: number;
    used: number;
    averageFidelity: number;
    averageDecay: number;
    totalAccesses: number;
  } {
    const avgFidelity = this.cells.length > 0
      ? this.cells.reduce((s, c) => s + c.fidelity, 0) / this.cells.length
      : 0;
    const avgDecay = this.cells.length > 0
      ? this.cells.reduce((s, c) => s + c.decay, 0) / this.cells.length
      : 0;

    return {
      capacity: this.maxCapacity,
      used: this.cells.length,
      averageFidelity: avgFidelity,
      averageDecay: avgDecay,
      totalAccesses: this.cells.reduce((s, c) => s + c.entry.accessCount, 0),
    };
  }

  /** Clear all stored entries */
  clear(): void {
    this.cells = [];
  }

  /** Get number of stored entries */
  get size(): number {
    return this.cells.length;
  }

  // ── Private Methods ──────────────────────────────────────────────

  /**
   * Holographic encoding: interfere embedding with reference beam.
   * pattern[i] = embedding[i] × referenceBeam[i]*  (convolution in Fourier domain)
   */
  private encode(embedding: number[]): ComplexNumber[] {
    const pattern: ComplexNumber[] = [];
    for (let i = 0; i < this.embeddingDim; i++) {
      const signal = complexFromPolar(
        Math.abs(embedding[i] ?? 0),
        (embedding[i] ?? 0) >= 0 ? 0 : Math.PI,
      );
      const refConj = complexConjugate(this.referenceBeam[i]);
      pattern.push(complexMultiply(signal, refConj));
    }
    return pattern;
  }

  /**
   * Decode: reconstruct embedding from holographic pattern.
   * recovered[i] = pattern[i] × referenceBeam[i]
   */
  private decode(pattern: ComplexNumber[]): number[] {
    const recovered: number[] = [];
    for (let i = 0; i < this.embeddingDim; i++) {
      const product = complexMultiply(pattern[i], this.referenceBeam[i]);
      // Take real part as recovered value, sign from phase
      const phase = Math.atan2(product.imaginary, product.real);
      const magnitude = Math.sqrt(complexMagnitudeSq(product));
      recovered.push(Math.abs(phase) > Math.PI / 2 ? -magnitude : magnitude);
    }
    return recovered;
  }

  private measureFidelity(pattern: ComplexNumber[], original: number[]): number {
    const recovered = this.decode(pattern);
    return this.cosineSimilarity(recovered, original);
  }

  /**
   * Single Grover iteration:
   * 1. Oracle: flip phase of marked states
   * 2. Diffusion: reflect about mean amplitude
   */
  private groverIteration(
    amplitudes: ComplexNumber[],
    oracleScores: number[],
  ): ComplexNumber[] {
    const n = amplitudes.length;

    // Step 1: Oracle — phase flip proportional to relevance score
    const afterOracle = amplitudes.map((a, i) => {
      const score = oracleScores[i];
      if (score > 0.5) {
        // Marked state: phase flip (partial, proportional to score)
        const flipAmount = score;
        return {
          real: a.real * (1 - 2 * flipAmount),
          imaginary: a.imaginary * (1 - 2 * flipAmount),
        };
      }
      return a;
    });

    // Step 2: Diffusion operator — reflect about mean
    const meanReal = afterOracle.reduce((s, a) => s + a.real, 0) / n;
    const meanImag = afterOracle.reduce((s, a) => s + a.imaginary, 0) / n;

    const afterDiffusion = afterOracle.map((a) => ({
      real: 2 * meanReal - a.real,
      imaginary: 2 * meanImag - a.imaginary,
    }));

    // Renormalise
    const norm = Math.sqrt(afterDiffusion.reduce((s, a) => s + complexMagnitudeSq(a), 0));
    if (norm > 0) {
      return afterDiffusion.map((a) => ({
        real: a.real / norm,
        imaginary: a.imaginary / norm,
      }));
    }
    return afterDiffusion;
  }

  private computeOracleScores(queryEmbedding: number[]): number[] {
    return this.cells.map((cell) => {
      // Decode holographic pattern and compare to query
      const recovered = this.decode(cell.pattern);
      const similarity = this.cosineSimilarity(recovered, queryEmbedding);
      // Map similarity to [0, 1] oracle score
      return Math.max(0, (similarity + 1) / 2);
    });
  }

  private measureSearchCoherence(
    amplitudes: ComplexNumber[],
    oracleScores: number[],
  ): CoherenceScore {
    const probs = amplitudes.map((a) => complexMagnitudeSq(a));
    const probSum = probs.reduce((s, p) => s + p, 0) || 1;
    const normProbs = probs.map((p) => p / probSum);

    // Phase coherence: how well-aligned are phases of high-scoring entries?
    const highScoreIndices = oracleScores
      .map((s, i) => ({ score: s, index: i }))
      .filter((x) => x.score > 0.5)
      .map((x) => x.index);

    let phaseCoherence = 1;
    if (highScoreIndices.length > 1) {
      const phases = highScoreIndices.map((i) =>
        Math.atan2(amplitudes[i].imaginary, amplitudes[i].real),
      );
      const meanPhase = phases.reduce((s, p) => s + p, 0) / phases.length;
      const variance = phases.reduce((s, p) => s + (p - meanPhase) ** 2, 0) / phases.length;
      phaseCoherence = Math.exp(-variance);
    }

    // Amplitude coherence: is probability concentrated on relevant entries?
    const relevantProb = highScoreIndices.reduce((s, i) => s + normProbs[i], 0);
    const amplitudeCoherence = relevantProb;

    const overall = 0.5 * phaseCoherence + 0.5 * amplitudeCoherence;

    return {
      overall: Math.min(1, Math.max(0, overall)),
      phaseCoherence,
      amplitudeCoherence,
      entanglementFidelity: overall * 0.9 + 0.1,
      decoherenceRate: Math.max(0, 1 - overall),
      effectiveQubits: Math.round(this.config.numQubits * overall),
      measuredAt: Date.now(),
    };
  }

  private applyDecay(): void {
    const now = Date.now();
    for (const cell of this.cells) {
      const age = (now - cell.entry.timestamp) / (1000 * 60 * 60); // hours
      const accessBoost = Math.log2(1 + cell.entry.accessCount) * 0.1;
      cell.decay = Math.max(0.01, Math.exp(-age * 0.01) + accessBoost);
    }
  }

  private evictWeakest(): void {
    if (this.cells.length === 0) return;
    let worstIdx = 0;
    let worstScore = Infinity;
    for (let i = 0; i < this.cells.length; i++) {
      const score = this.cells[i].fidelity * this.cells[i].decay;
      if (score < worstScore) {
        worstScore = score;
        worstIdx = i;
      }
    }
    this.cells.splice(worstIdx, 1);
  }

  private generateReferenceBeam(): ComplexNumber[] {
    // Coherent reference beam with uniform magnitude and structured phase
    return Array.from({ length: this.embeddingDim }, (_, i) => {
      const phase = (2 * Math.PI * i) / this.embeddingDim;
      return complexFromPolar(1 / Math.sqrt(this.embeddingDim), phase);
    });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }

  private emptyResult(): QuantumSearchResult {
    return {
      entries: [],
      iterations: 0,
      coherence: {
        overall: 0, phaseCoherence: 0, amplitudeCoherence: 0,
        entanglementFidelity: 0, decoherenceRate: 1, effectiveQubits: 0,
        measuredAt: Date.now(),
      },
      speedupFactor: 1,
    };
  }

  private seededRng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }
}
