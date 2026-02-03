/* tslint:disable */
/* eslint-disable */

/**
 * QuantumState represents a semantic confidence state.
 */
export class QuantumState {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Apply interference from another model's confidence and semantic agreement.
     */
    apply_interference(other_confidence: number, agreement_metric: number): void;
    /**
     * Measure the final probability of truthfulness (0.0 - 1.0).
     */
    measure_probability(): number;
    /**
     * Initialize a state based on an AI model confidence score.
     */
    constructor(confidence_score: number);
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_quantumstate_free: (a: number, b: number) => void;
    readonly quantumstate_apply_interference: (a: number, b: number, c: number) => void;
    readonly quantumstate_measure_probability: (a: number) => number;
    readonly quantumstate_new: (a: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
