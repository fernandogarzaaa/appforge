declare module '@/quantum-core/pkg/quantum_core' {
  export function init(input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module): Promise<void>;

  export class QuantumState {
    static new(confidence_score: number): QuantumState;
    apply_interference(other_confidence: number, agreement_metric: number): void;
    measure_probability(): number;
  }
}
