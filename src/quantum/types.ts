/**
 * Quantum-Enhanced LLM Type Definitions
 * Core types for quantum-classical hybrid language model processing.
 */

/** Complex number representation for quantum amplitudes */
export interface ComplexNumber {
  real: number;
  imaginary: number;
}

/** Basis state label — computational basis |0⟩, |1⟩, or arbitrary labels */
export type BasisLabel = string;

/** A single amplitude entry in a quantum state vector */
export interface AmplitudeEntry {
  basis: BasisLabel;
  amplitude: ComplexNumber;
}

/**
 * Represents a quantum state as a sparse state vector.
 * Amplitudes should satisfy Σ|α_i|² = 1 (normalisation).
 */
export interface QuantumState {
  /** Unique identifier for this state */
  id: string;
  /** Number of qubits (dimensions = 2^numQubits) */
  numQubits: number;
  /** Sparse amplitude map — only non-zero entries */
  amplitudes: AmplitudeEntry[];
  /** Optional human-readable label */
  label?: string;
  /** Timestamp of last measurement / collapse */
  lastMeasured?: number;
  /** Phase in radians applied globally */
  globalPhase: number;
}

/**
 * Coherence score quantifying how well quantum processing
 * maintains superposition quality relative to classical baselines.
 */
export interface CoherenceScore {
  /** Overall coherence in [0, 1] — 1 is perfect */
  overall: number;
  /** Phase coherence: stability of relative phases */
  phaseCoherence: number;
  /** Amplitude coherence: fidelity of probability distribution */
  amplitudeCoherence: number;
  /** Entanglement fidelity across subsystems */
  entanglementFidelity: number;
  /** Decoherence rate estimate (per step) */
  decoherenceRate: number;
  /** Number of effective qubits still coherent */
  effectiveQubits: number;
  /** Timestamp */
  measuredAt: number;
}

/**
 * Result of collapsing a superposition into concrete outputs.
 * Carries both the selected outcome and the full distribution.
 */
export interface SuperpositionResult<T = string> {
  /** The selected (measured) outcome */
  selected: T;
  /** Probability of the selected outcome */
  selectedProbability: number;
  /** Full probability distribution over candidates */
  distribution: Array<{
    outcome: T;
    probability: number;
    amplitude: ComplexNumber;
  }>;
  /** Coherence at time of measurement */
  coherence: CoherenceScore;
  /** Number of candidates that were in superposition */
  superpositionWidth: number;
  /** Interference contributions (constructive / destructive) */
  interferencePattern: {
    constructive: number;
    destructive: number;
    netEffect: number;
  };
}

/**
 * An entangled pair linking two subsystems so that
 * measurement on one instantly constrains the other.
 */
export interface EntanglementPair {
  /** Unique pair identifier */
  id: string;
  /** First subsystem identifier */
  subsystemA: string;
  /** Second subsystem identifier */
  subsystemB: string;
  /** Bell state type: Φ+, Φ−, Ψ+, Ψ− */
  bellState: 'Φ+' | 'Φ-' | 'Ψ+' | 'Ψ-';
  /** Concurrence measure in [0, 1] */
  concurrence: number;
  /** Whether the pair has been measured (collapsed) */
  measured: boolean;
  /** Correlation coefficient after measurement */
  correlationStrength: number;
  /** Creation timestamp */
  createdAt: number;
}

// ─── Utility / Config Types ───────────────────────────────────────────

/** Configuration for quantum processing modules */
export interface QuantumConfig {
  /** Number of simulated qubits */
  numQubits: number;
  /** Simulated decoherence time (steps before forced collapse) */
  decoherenceSteps: number;
  /** Temperature for simulated annealing (0 = greedy) */
  temperature: number;
  /** Minimum coherence to continue quantum processing */
  coherenceThreshold: number;
  /** Maximum superposition width before pruning */
  maxSuperpositionWidth: number;
  /** Seed for reproducibility (undefined = random) */
  seed?: number;
}

/** Token with associated probability from a language model */
export interface TokenCandidate {
  token: string;
  tokenId: number;
  logProbability: number;
  /** Classical probability (softmax output) */
  classicalProbability: number;
}

/** Context window entry for memory systems */
export interface ContextEntry {
  id: string;
  content: string;
  embedding: number[];
  timestamp: number;
  relevanceScore: number;
  accessCount: number;
}

/** Task descriptor for hybrid routing */
export interface TaskDescriptor {
  id: string;
  type: 'generation' | 'classification' | 'search' | 'reasoning' | 'creative';
  complexity: number;  // 0–1 scale
  input: string;
  context?: ContextEntry[];
  requiresCoherence: number;  // minimum coherence needed
}

/** Result from any processing pipeline */
export interface ProcessingResult<T = string> {
  output: T;
  pipeline: 'classical' | 'quantum' | 'hybrid';
  coherence: CoherenceScore;
  latencyMs: number;
  metadata: Record<string, unknown>;
}

// ─── Math Helpers ─────────────────────────────────────────────────────

/** Compute |z|² for a complex number */
export function complexMagnitudeSq(z: ComplexNumber): number {
  return z.real * z.real + z.imaginary * z.imaginary;
}

/** Multiply two complex numbers */
export function complexMultiply(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    real: a.real * b.real - a.imaginary * b.imaginary,
    imaginary: a.real * b.imaginary + a.imaginary * b.real,
  };
}

/** Add two complex numbers */
export function complexAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    real: a.real + b.real,
    imaginary: a.imaginary + b.imaginary,
  };
}

/** Conjugate of a complex number */
export function complexConjugate(z: ComplexNumber): ComplexNumber {
  return { real: z.real, imaginary: -z.imaginary };
}

/** Create a complex number from polar form */
export function complexFromPolar(magnitude: number, phase: number): ComplexNumber {
  return {
    real: magnitude * Math.cos(phase),
    imaginary: magnitude * Math.sin(phase),
  };
}
