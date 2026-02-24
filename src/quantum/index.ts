/**
 * Quantum-Enhanced LLM Modules
 *
 * Provides quantum-inspired processing capabilities for language models:
 * - QuantumAttention: Superposition-based attention with interference patterns
 * - QuantumDecoder: Simulated annealing for token selection
 * - QuantumMemory: Holographic context storage with Grover-inspired search
 * - HybridLLM: Classical/quantum routing and orchestration
 * - QuantumConsensus: Multi-model quantum voting
 */

// ── Types ──────────────────────────────────────────────────────────
export type {
  ComplexNumber,
  BasisLabel,
  AmplitudeEntry,
  QuantumState,
  CoherenceScore,
  SuperpositionResult,
  EntanglementPair,
  QuantumConfig,
  TokenCandidate,
  ContextEntry,
  TaskDescriptor,
  ProcessingResult,
} from './types';

export {
  complexMagnitudeSq,
  complexMultiply,
  complexAdd,
  complexConjugate,
  complexFromPolar,
} from './types';

// ── Modules ────────────────────────────────────────────────────────
export { QuantumAttention } from './quantumAttention';
export type { AttentionHeadConfig } from './quantumAttention';

export { QuantumDecoder } from './quantumDecoder';
export type { AnnealingSchedule } from './quantumDecoder';

export { QuantumMemory } from './quantumMemory';
export type { QuantumSearchResult } from './quantumMemory';

export { HybridLLM } from './hybridLLM';
export type { RoutingDecision, ClassicalProcessor } from './hybridLLM';

export { QuantumConsensus } from './consensus';
export type { ModelVote, ConsensusResult, ConsensusStrategy } from './consensus';
