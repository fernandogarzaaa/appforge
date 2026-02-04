/* @ts-self-types="./quantum_core.d.ts" */

export class CollaborationSync {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CollaborationSyncFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_collaborationsync_free(ptr, 0);
    }
    /**
     * Get current fidelity score
     * @param {number} remote_alpha
     * @param {number} remote_beta
     * @returns {number}
     */
    get_fidelity(remote_alpha, remote_beta) {
        const ret = wasm.collaborationsync_get_fidelity(this.__wbg_ptr, remote_alpha, remote_beta);
        return ret;
    }
    /**
     * Check if sync is required based on fidelity threshold
     * @param {number} remote_alpha
     * @param {number} remote_beta
     * @returns {boolean}
     */
    needs_sync(remote_alpha, remote_beta) {
        const ret = wasm.collaborationsync_needs_sync(this.__wbg_ptr, remote_alpha, remote_beta);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.collaborationsync_new();
        this.__wbg_ptr = ret >>> 0;
        CollaborationSyncFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Update local state and get predicted remote changes
     * @param {number} change_magnitude
     * @returns {number}
     */
    update_local(change_magnitude) {
        const ret = wasm.collaborationsync_update_local(this.__wbg_ptr, change_magnitude);
        return ret;
    }
}
if (Symbol.dispose) CollaborationSync.prototype[Symbol.dispose] = CollaborationSync.prototype.free;

/**
 * Represents a quantum entangled state for zero-latency synchronization
 */
export class EntangledState {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(EntangledState.prototype);
        obj.__wbg_ptr = ptr;
        EntangledStateFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EntangledStateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_entangledstate_free(ptr, 0);
    }
    /**
     * Apply a phase shift (Z-gate rotation)
     * @param {number} phi
     */
    apply_phase(phi) {
        wasm.entangledstate_apply_phase(this.__wbg_ptr, phi);
    }
    /**
     * Apply a rotation gate to the local state
     * This simulates a local operation that affects the entangled pair
     * @param {number} theta
     */
    apply_rotation(theta) {
        wasm.entangledstate_apply_rotation(this.__wbg_ptr, theta);
    }
    /**
     * @returns {EntangledState}
     */
    static create_bell_state() {
        const ret = wasm.entangledstate_create_bell_state();
        return EntangledState.__wrap(ret);
    }
    /**
     * Get state components for debugging
     * @returns {number}
     */
    get_alpha() {
        const ret = wasm.entangledstate_get_alpha(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_beta() {
        const ret = wasm.entangledstate_get_beta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_phase() {
        const ret = wasm.entangledstate_get_phase(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if states are entangled (correlated beyond classical limits)
     * @param {number} remote_alpha
     * @param {number} remote_beta
     * @returns {boolean}
     */
    is_entangled(remote_alpha, remote_beta) {
        const ret = wasm.entangledstate_is_entangled(this.__wbg_ptr, remote_alpha, remote_beta);
        return ret !== 0;
    }
    /**
     * Measure fidelity between local and remote states
     * Returns a value between 0 (total conflict) and 1 (perfect sync)
     * @param {number} remote_alpha
     * @param {number} remote_beta
     * @returns {number}
     */
    measure_fidelity(remote_alpha, remote_beta) {
        const ret = wasm.entangledstate_measure_fidelity(this.__wbg_ptr, remote_alpha, remote_beta);
        return ret;
    }
    /**
     * Create a maximally entangled Bell state |Φ+⟩ = (|00⟩ + |11⟩) / √2
     */
    constructor() {
        const ret = wasm.entangledstate_create_bell_state();
        this.__wbg_ptr = ret >>> 0;
        EntangledStateFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Normalize the state vector
     */
    normalize() {
        wasm.entangledstate_normalize(this.__wbg_ptr);
    }
    /**
     * Predict the remote state change needed to maintain entanglement
     * Returns the rotation angle needed on remote state
     * @param {number} target_alpha
     * @param {number} target_beta
     * @returns {number}
     */
    predict_remote_rotation(target_alpha, target_beta) {
        const ret = wasm.entangledstate_predict_remote_rotation(this.__wbg_ptr, target_alpha, target_beta);
        return ret;
    }
}
if (Symbol.dispose) EntangledState.prototype[Symbol.dispose] = EntangledState.prototype.free;

/**
 * HolographicConsensus: Tensor Network-based consensus engine for multi-model AI
 *
 * Theory: We model the consensus problem as a quantum superposition where each
 * AI model is a dimension in a "Truth Tensor". By using Holographic Reduced
 * Representations (HRR), we collapse this tensor into a single "Global Truth State"
 * where:
 * - Hallucinations (disagreement) cause destructive interference
 * - Facts (consensus) cause constructive interference
 */
export class HolographicConsensus {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(HolographicConsensus.prototype);
        obj.__wbg_ptr = ptr;
        HolographicConsensusFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HolographicConsensusFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_holographicconsensus_free(ptr, 0);
    }
    /**
     * Create a "Density Matrix" from the ensemble for advanced analysis
     *
     * The density matrix ρ = |Ψ⟩⟨Ψ| represents the full quantum state.
     * This is useful for computing fidelity and other quantum metrics.
     *
     * # Arguments
     * * `flattened_embeddings` - Flat array of shape [num_models * dimensions]
     * * `num_models` - Number of models
     *
     * # Returns
     * Flattened density matrix (symmetric, positive semi-definite)
     * @param {Float64Array} flattened_embeddings
     * @param {number} num_models
     * @returns {Float64Array}
     */
    compute_density_matrix(flattened_embeddings, num_models) {
        const ptr0 = passArrayF64ToWasm0(flattened_embeddings, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.holographicconsensus_compute_density_matrix(this.__wbg_ptr, ptr0, len0, num_models);
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * Get the current coherence threshold
     * @returns {number}
     */
    get_coherence_threshold() {
        const ret = wasm.holographicconsensus_get_coherence_threshold(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get the current dimension size
     * @returns {number}
     */
    get_dimensions() {
        const ret = wasm.holographicconsensus_get_dimensions(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Compute the "Coherence" of the ensemble
     *
     * This measures how much the models agree with each other (cross-model alignment).
     * High coherence = models are generating similar embeddings
     * Low coherence = models are diverging (potential hallucination)
     *
     * # Arguments
     * * `flattened_embeddings` - Flat array of shape [num_models * dimensions]
     * * `num_models` - Number of models
     *
     * # Returns
     * Coherence value (0.0-1.0, where 1.0 = perfect agreement)
     * @param {Float64Array} flattened_embeddings
     * @param {number} num_models
     * @returns {number}
     */
    measure_coherence(flattened_embeddings, num_models) {
        const ptr0 = passArrayF64ToWasm0(flattened_embeddings, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.holographicconsensus_measure_coherence(this.__wbg_ptr, ptr0, len0, num_models);
        return ret;
    }
    /**
     * Calculate the "Entanglement Entropy" of the consensus state
     *
     * This measures the quality/certainty of the consensus:
     * - Low entropy (< 0.1) = Strong consensus (high certainty)
     * - Medium entropy (0.1-0.5) = Moderate consensus
     * - High entropy (> 0.5) = Weak consensus / hallucination risk
     *
     * Formula: S = -Σ p_i * ln(p_i) where p_i = |ψ_i|²
     * This is the Von Neumann entropy approximation
     *
     * # Arguments
     * * `state_vector` - The normalized consensus vector
     *
     * # Returns
     * Entropy value (0.0 = maximum order, high value = maximum disorder)
     * @param {Float64Array} state_vector
     * @returns {number}
     */
    measure_entropy(state_vector) {
        const ptr0 = passArrayF64ToWasm0(state_vector, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.holographicconsensus_measure_entropy(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Create a new HolographicConsensus engine
     *
     * # Arguments
     * * `dimensions` - Embedding dimension (typically 1536 for OpenAI embeddings)
     * * `threshold` - Coherence threshold (0.0-1.0) for consensus quality
     * @param {number} dimensions
     * @param {number} threshold
     * @returns {HolographicConsensus}
     */
    static new(dimensions, threshold) {
        const ret = wasm.holographicconsensus_new(dimensions, threshold);
        return HolographicConsensus.__wrap(ret);
    }
    /**
     * Superpose multiple model embeddings into a single "Truth Vector"
     *
     * This is the core operation: ∣Ψ_Truth⟩ = Trace(ρ_ensemble ⋅ H_coherence)
     *
     * The algorithm:
     * 1. Reconstruct the tensor from flattened embeddings
     * 2. Initialize the global wavefunction as zero
     * 3. For each model embedding:
     *    - Calculate confidence (norm) and phase
     *    - Apply quantum phase weighting: e^(iθ) where θ = confidence * π
     *    - Add to superposition with constructive/destructive interference
     * 4. Normalize using Born rule
     *
     * # Arguments
     * * `flattened_embeddings` - Flat array of shape [num_models * dimensions]
     * * `num_models` - Number of models (typically 3: GPT-4, Claude, Gemini)
     *
     * # Returns
     * Normalized consensus vector of length `dimensions`
     * @param {Float64Array} flattened_embeddings
     * @param {number} num_models
     * @returns {Float64Array}
     */
    superpose_models(flattened_embeddings, num_models) {
        const ptr0 = passArrayF64ToWasm0(flattened_embeddings, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.holographicconsensus_superpose_models(this.__wbg_ptr, ptr0, len0, num_models);
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
}
if (Symbol.dispose) HolographicConsensus.prototype[Symbol.dispose] = HolographicConsensus.prototype.free;

/**
 * Quantum Annealer for AI Model Selection
 *
 * Solves the "Knapsack Problem" of selecting the optimal AI model
 * by minimizing energy: E = (cost × 0.4) + (latency × 0.3) + ((1-quality) × 0.3)
 *
 * This approach avoids hardcoded rules and instead uses simulated quantum annealing
 * to find the mathematically optimal model selection given task complexity.
 */
export class QuantumAnnealer {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuantumAnnealerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quantumannealer_free(ptr, 0);
    }
    /**
     * Get current temperature (for monitoring)
     * @returns {number}
     */
    get_temperature() {
        const ret = wasm.entangledstate_get_alpha(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if the system has reached thermal equilibrium (frozen)
     * @returns {boolean}
     */
    is_frozen() {
        const ret = wasm.quantumannealer_is_frozen(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Creates a new Quantum Annealer for model selection
     *
     * # Arguments
     * * `start_temp` - Initial temperature (typically 100.0)
     * * `cooling_rate` - Temperature decay rate per iteration (typically 0.95)
     * @param {number} start_temp
     * @param {number} cooling_rate
     */
    constructor(start_temp, cooling_rate) {
        const ret = wasm.quantumannealer_new(start_temp, cooling_rate);
        this.__wbg_ptr = ret >>> 0;
        QuantumAnnealerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Optimizes model selection using simulated quantum annealing
     *
     * This method runs the Metropolis criterion to select the best model
     * by exploring the solution space and accepting both uphill and downhill moves
     * with controlled probability.
     *
     * # Arguments
     * * `models_data` - Flat array of [cost, latency, quality, cost, latency, quality, ...]
     *
     * # Returns
     * Index of the optimal model (0-based)
     * @param {Float64Array} models_data
     * @returns {number}
     */
    optimize_selection(models_data) {
        const ptr0 = passArrayF64ToWasm0(models_data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.quantumannealer_optimize_selection(this.__wbg_ptr, ptr0, len0);
        return ret >>> 0;
    }
    /**
     * Optimizes model selection with task-specific constraints
     *
     * Allows dynamic weighting based on task complexity
     *
     * # Arguments
     * * `models_data` - Flat array of model metrics
     * * `cost_weight` - Weight for cost (0.0-1.0)
     * * `latency_weight` - Weight for latency (0.0-1.0)
     * * `quality_weight` - Weight for quality (0.0-1.0)
     * @param {Float64Array} models_data
     * @param {number} cost_weight
     * @param {number} latency_weight
     * @param {number} quality_weight
     * @returns {number}
     */
    optimize_with_weights(models_data, cost_weight, latency_weight, quality_weight) {
        const ptr0 = passArrayF64ToWasm0(models_data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.quantumannealer_optimize_with_weights(this.__wbg_ptr, ptr0, len0, cost_weight, latency_weight, quality_weight);
        return ret >>> 0;
    }
    /**
     * Reset the annealer for a new optimization run
     * @param {number} start_temp
     */
    reset(start_temp) {
        wasm.quantumannealer_reset(this.__wbg_ptr, start_temp);
    }
}
if (Symbol.dispose) QuantumAnnealer.prototype[Symbol.dispose] = QuantumAnnealer.prototype.free;

export class QuantumCodeGenerator {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuantumCodeGeneratorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quantumcodegenerator_free(ptr, 0);
    }
    /**
     * Generate optimal code architecture using quantum superposition
     * @param {number} num_approaches
     * @param {number} total_constraints
     * @returns {string}
     */
    generate_architecture(num_approaches, total_constraints) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.quantumcodegenerator_generate_architecture(this.__wbg_ptr, num_approaches, total_constraints);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get all solution probabilities
     * @returns {string}
     */
    get_solution_analysis() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.quantumcodegenerator_get_solution_analysis(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    constructor() {
        const ret = wasm.quantumcodegenerator_new();
        this.__wbg_ptr = ret >>> 0;
        QuantumCodeGeneratorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) QuantumCodeGenerator.prototype[Symbol.dispose] = QuantumCodeGenerator.prototype.free;

/**
 * QuantumState represents a semantic confidence state.
 */
export class QuantumState {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuantumStateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quantumstate_free(ptr, 0);
    }
    /**
     * Apply interference from another model's confidence and semantic agreement.
     * @param {number} other_confidence
     * @param {number} agreement_metric
     */
    apply_interference(other_confidence, agreement_metric) {
        wasm.quantumstate_apply_interference(this.__wbg_ptr, other_confidence, agreement_metric);
    }
    /**
     * Measure the final probability of truthfulness (0.0 - 1.0).
     * @returns {number}
     */
    measure_probability() {
        const ret = wasm.quantumstate_measure_probability(this.__wbg_ptr);
        return ret;
    }
    /**
     * Initialize a state based on an AI model confidence score.
     * @param {number} confidence_score
     */
    constructor(confidence_score) {
        const ret = wasm.quantumstate_new(confidence_score);
        this.__wbg_ptr = ret >>> 0;
        QuantumStateFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) QuantumState.prototype[Symbol.dispose] = QuantumState.prototype.free;

/**
 * Renormalization Group (RG) Flow Engine
 *
 * Implements Kadanoff's Block Spin transformation for phase transition analysis.
 * Takes a massive array of system metrics (latencies, errors, resource usage) and
 * recursively "zooms out" to find the Critical Fixed Point where the system crashes.
 *
 * In physics, the Renormalization Group tracks how system properties change under
 * scaling transformations. At the critical point, fluctuations grow without bound
 * and the system undergoes a phase transition.
 *
 * Applied to systems: We take raw metrics at micro-scale, repeatedly coarse-grain
 * them, and track the divergence. When divergence reaches critical levels, the
 * system is approaching collapse.
 *
 * Process:
 * 1. Decimation: Average over blocks of data
 * 2. Rescaling: Amplify fluctuations at each scale
 * 3. Flow: Repeat to find fixed points
 * 4. Criticality: Measure divergence rate to detect imminent phase transition
 */
export class RenormalizationEngine {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RenormalizationEngine.prototype);
        obj.__wbg_ptr = ptr;
        RenormalizationEngineFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RenormalizationEngineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_renormalizationengine_free(ptr, 0);
    }
    /**
     * Perform one RG Flow Step (Decimation & Rescaling)
     *
     * Takes micro-scale metrics and returns macro-scale effective behavior.
     * This is the core operation of the renormalization group transformation.
     *
     * # Process
     * 1. **Decimation**: Divide data into chunks and average each chunk
     * 2. **Rescaling**: Amplify local fluctuations at the macro scale
     *
     * The result shows how the system appears when viewed at a larger scale.
     * Near critical points, fluctuations amplify dramatically.
     * @param {Float64Array} micro_metrics
     * @returns {Float64Array}
     */
    coarse_grain(micro_metrics) {
        const ptr0 = passArrayF64ToWasm0(micro_metrics, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.renormalizationengine_coarse_grain(this.__wbg_ptr, ptr0, len0);
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * Estimate time-to-crash based on current metrics
     *
     * Uses RG flow analysis to extrapolate when the system will reach
     * critical state and potentially crash
     *
     * # Arguments
     * * `metrics` - Current system metrics (latencies, error rates, etc.)
     * * `update_interval` - How often metrics are collected (seconds)
     *
     * # Returns
     * Estimated time until criticality in seconds (or -1 if stable)
     * @param {Float64Array} metrics
     * @param {number} update_interval
     * @returns {number}
     */
    estimate_time_to_criticality(metrics, update_interval) {
        const ptr0 = passArrayF64ToWasm0(metrics, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.renormalizationengine_estimate_time_to_criticality(this.__wbg_ptr, ptr0, len0, update_interval);
        return ret;
    }
    /**
     * Find the scale at which the system becomes unstable
     *
     * Returns the number of RG flow steps before criticality threshold
     * @param {Float64Array} metrics
     * @param {number} criticality_threshold
     * @returns {number}
     */
    find_critical_scale(metrics, criticality_threshold) {
        const ptr0 = passArrayF64ToWasm0(metrics, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.renormalizationengine_find_critical_scale(this.__wbg_ptr, ptr0, len0, criticality_threshold);
        return ret >>> 0;
    }
    /**
     * Track the RG Flow evolution step by step
     *
     * Returns criticality level after flow evolution (0.0 = stable, 1.0 = critical)
     * @param {Float64Array} metrics
     * @returns {number}
     */
    flow_evolution(metrics) {
        const ptr0 = passArrayF64ToWasm0(metrics, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.renormalizationengine_flow_evolution(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Get the scale factor
     * @returns {number}
     */
    get_scale_factor() {
        const ret = wasm.renormalizationengine_get_scale_factor(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get health status based on criticality
     * @param {Float64Array} metrics
     * @returns {string}
     */
    get_system_health(metrics) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passArrayF64ToWasm0(metrics, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.renormalizationengine_get_system_health(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Create a new renormalization engine
     *
     * # Arguments
     * * `scale_factor` - Coarse-graining factor (typically 2, 4, 8)
     *   2 = average every 2 data points
     *   4 = average every 4 data points
     *   8 = aggressive coarse-graining
     * @param {number} scale_factor
     * @returns {RenormalizationEngine}
     */
    static new(scale_factor) {
        const ret = wasm.renormalizationengine_new(scale_factor);
        return RenormalizationEngine.__wrap(ret);
    }
    /**
     * Predict the "Critical Point" (System Crash) using RG Flow analysis
     *
     * Iteratively applies coarse-graining and tracks how rapidly the system
     * diverges. At a critical point, the divergence rate becomes infinite.
     *
     * # Algorithm
     * 1. Start with micro-scale metrics
     * 2. Apply coarse-graining repeatedly
     * 3. Track divergence at each scale
     * 4. Calculate criticality based on divergence growth
     *
     * # Returns
     * Criticality score (0.0-1.0)
     * - 0.0 = Stable system (no divergence)
     * - 0.5 = Approaching critical point
     * - 0.9+ = Critical phase transition imminent
     * @param {Float64Array} metrics
     * @returns {number}
     */
    predict_criticality(metrics) {
        const ptr0 = passArrayF64ToWasm0(metrics, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.renormalizationengine_predict_criticality(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
}
if (Symbol.dispose) RenormalizationEngine.prototype[Symbol.dispose] = RenormalizationEngine.prototype.free;

export class SuperpositionSynthesizer {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SuperpositionSynthesizerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_superpositionsynthesizer_free(ptr, 0);
    }
    /**
     * Step 2: Apply interference based on constraint matching
     * Solutions that violate constraints suffer destructive interference
     */
    apply_interference() {
        wasm.superpositionsynthesizer_apply_interference(this.__wbg_ptr);
    }
    /**
     * Calculate entropy of the superposition (measure of uncertainty)
     * @returns {number}
     */
    calculate_entropy() {
        const ret = wasm.superpositionsynthesizer_calculate_entropy(this.__wbg_ptr);
        return ret;
    }
    /**
     * Step 3: Collapse the wavefunction to the optimal solution
     * Returns the index of the best solution
     * @returns {number}
     */
    collapse_to_optimal() {
        const ret = wasm.superpositionsynthesizer_collapse_to_optimal(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Step 1: Create superposition by generating multiple solution approaches
     * This is the Hadamard gate - creating equal superposition
     * @param {number} num_approaches
     */
    create_superposition(num_approaches) {
        wasm.superpositionsynthesizer_create_superposition(this.__wbg_ptr, num_approaches);
    }
    /**
     * Simulate constraint checking for a solution
     * @param {number} solution_idx
     * @param {number} constraints_met
     * @param {number} constraints_total
     */
    evaluate_constraints(solution_idx, constraints_met, constraints_total) {
        wasm.superpositionsynthesizer_evaluate_constraints(this.__wbg_ptr, solution_idx, constraints_met, constraints_total);
    }
    /**
     * Get the optimal solution after collapse
     * @returns {string}
     */
    get_optimal_solution() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.superpositionsynthesizer_get_optimal_solution(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Calculate probability of each solution (|amplitude|²)
     * @returns {Float64Array}
     */
    get_probabilities() {
        const ret = wasm.superpositionsynthesizer_get_probabilities(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * Get number of solutions in superposition
     * @returns {number}
     */
    get_solution_count() {
        const ret = wasm.superpositionsynthesizer_get_solution_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    constructor() {
        const ret = wasm.quantumcodegenerator_new();
        this.__wbg_ptr = ret >>> 0;
        SuperpositionSynthesizerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) SuperpositionSynthesizer.prototype[Symbol.dispose] = SuperpositionSynthesizer.prototype.free;

/**
 * Quantum Tunneling Penetration Tester
 *
 * Uses the WKB (Wentzel-Kramers-Brillouin) Approximation method to calculate the
 * probability of a security attack vector "tunneling" through a security barrier
 * (firewall, authentication, encryption) even without classical credentials.
 *
 * In quantum mechanics, particles can tunnel through energy barriers that would
 * classically be impossible to cross. This applies the same principle to security:
 * an attack may bypass defenses through quantum-like "probability channels".
 *
 * Theory: If an attack has energy E less than barrier potential V, classically
 * it's blocked. But the WKB transmission coefficient gives the quantum tunneling
 * probability: T ≈ exp(-2 * width * sqrt(2m(V - E)) / h_bar)
 */
export class TunnelingScanner {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TunnelingScanner.prototype);
        obj.__wbg_ptr = ptr;
        TunnelingScannerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TunnelingScannerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tunnelingscanner_free(ptr, 0);
    }
    /**
     * Calculate the probability of an attack tunneling through a security barrier
     *
     * # Arguments
     * * `barrier_height` - Strength of security rule (0.0-1.0)
     *   Examples:
     *   - 0.2 = Basic password check
     *   - 0.5 = Multi-factor authentication
     *   - 0.8 = Hardware security module
     *   - 0.95 = Military-grade encryption
     * * `attack_energy` - Sophistication/strength of attack (0.0-1.0)
     *   Examples:
     *   - 0.1 = Brute force (simple, weak)
     *   - 0.4 = Dictionary attack
     *   - 0.6 = SQL injection
     *   - 0.8 = Zero-day exploit
     *   - 0.95 = Nation-state level
     *
     * # Returns
     * Transmission coefficient: probability of successful tunneling (0.0-1.0)
     * - 0.0 = No chance of tunneling
     * - 0.5 = 50% probability of bypassing security
     * - 1.0 = Definite breach (energy >= barrier)
     * @param {number} barrier_height
     * @param {number} attack_energy
     * @returns {number}
     */
    calculate_tunneling_probability(barrier_height, attack_energy) {
        const ret = wasm.tunnelingscanner_calculate_tunneling_probability(this.__wbg_ptr, barrier_height, attack_energy);
        return ret;
    }
    /**
     * Identify critical weaknesses by finding maximum tunneling probability
     *
     * Returns the maximum tunneling probability found
     * @param {Float64Array} barriers
     * @returns {number}
     */
    find_critical_weakness(barriers) {
        const ptr0 = passArrayF64ToWasm0(barriers, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tunnelingscanner_find_critical_weakness(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Get the barrier width (firewall complexity)
     * @returns {number}
     */
    get_barrier_width() {
        const ret = wasm.holographicconsensus_get_coherence_threshold(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get the decay constant (quantum simulation parameter)
     * @returns {number}
     */
    get_decay_constant() {
        const ret = wasm.tunnelingscanner_get_decay_constant(this.__wbg_ptr);
        return ret;
    }
    /**
     * Create a new tunneling scanner with specified barrier width
     *
     * # Arguments
     * * `barrier_width` - Thickness of security barrier (0.0-1.0)
     *   0.1 = thin/simple firewall, 0.9 = thick/complex defense
     * @param {number} barrier_width
     * @returns {TunnelingScanner}
     */
    static new(barrier_width) {
        const ret = wasm.tunnelingscanner_new(barrier_width);
        return TunnelingScanner.__wrap(ret);
    }
    /**
     * Analyze required barrier strength to block an attack
     *
     * Given attack sophistication, determine minimum barrier needed
     * @param {number} attack_energy
     * @param {number} target_blocking
     * @returns {number}
     */
    required_barrier_for_attack(attack_energy, target_blocking) {
        const ret = wasm.tunnelingscanner_required_barrier_for_attack(this.__wbg_ptr, attack_energy, target_blocking);
        return ret;
    }
    /**
     * Run a Monte Carlo penetration test simulation
     *
     * Simulates multiple attack attempts with varying sophistication levels
     * to determine overall security resilience.
     *
     * # Arguments
     * * `iterations` - Number of simulated attacks
     * * `avg_barrier` - Average barrier strength across all security measures
     *
     * # Returns
     * Vector of tunneling probabilities for each simulated attack
     * @param {number} iterations
     * @param {number} avg_barrier
     * @returns {Float64Array}
     */
    run_penetration_test(iterations, avg_barrier) {
        const ret = wasm.tunnelingscanner_run_penetration_test(this.__wbg_ptr, iterations, avg_barrier);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
}
if (Symbol.dispose) TunnelingScanner.prototype[Symbol.dispose] = TunnelingScanner.prototype.free;

/**
 * Quantum Zeno Code Stabilizer
 *
 * Implements the Quantum Zeno Effect (Watched Pot Never Boils): the phenomenon where
 * continuous observation of a quantum system prevents it from evolving or decaying.
 *
 * Applied to software: A code module can "decay" (introduce bugs) over time. By
 * continuously observing it (running tests, type checks, static analysis), we can
 * suppress bug introduction and maintain code integrity.
 *
 * Theory: A quantum system evolving under Hamiltonian H has decay rate that depends
 * on the time between measurements. If we measure frequently enough, the system has
 * insufficient time to decay.
 *
 * Mathematical Formula:
 * P(t) = [1 - (Δt / τ)²]^N
 * where:
 * - Δt = time between observations
 * - τ = coherence time (natural decay rate)
 * - N = number of observations
 * - P(t) = survival probability (state integrity)
 */
export class ZenoStabilizer {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ZenoStabilizer.prototype);
        obj.__wbg_ptr = ptr;
        ZenoStabilizerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ZenoStabilizerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_zenostabilizer_free(ptr, 0);
    }
    /**
     * Calculate the "Freeze Depth" - how frozen is the code state?
     *
     * A measure from 0.0 (no freeze) to 1.0 (complete freeze)
     * @param {number} observation_frequency
     * @param {number} time_elapsed
     * @returns {number}
     */
    calculate_freeze_depth(observation_frequency, time_elapsed) {
        const ret = wasm.zenostabilizer_calculate_freeze_depth(this.__wbg_ptr, observation_frequency, time_elapsed);
        return ret;
    }
    /**
     * Calculate the "Survival Probability" of code logic integrity
     *
     * The Quantum Zeno Effect: frequent observation suppresses decay.
     * If observation_frequency is high (frequent checks), the code stays stable.
     * If observation_frequency is low (infrequent checks), bugs accumulate.
     *
     * # Arguments
     * * `observation_frequency` - How often code is tested/checked (Hz)
     *   1 Hz = tested once per second
     *   0.1 Hz = tested once per 10 seconds
     *   0.01 Hz = tested once per 100 seconds (infrequent)
     * * `time_elapsed` - Time since last commit (seconds)
     *
     * # Returns
     * Survival probability (0.0-1.0)
     * - 0.99+ = Code is "frozen" in good state (Zeno Effect active)
     * - 0.5-0.99 = Gradual degradation
     * - < 0.5 = System collapsing (bugs introduced)
     * @param {number} observation_frequency
     * @param {number} time_elapsed
     * @returns {number}
     */
    calculate_stability(observation_frequency, time_elapsed) {
        const ret = wasm.zenostabilizer_calculate_stability(this.__wbg_ptr, observation_frequency, time_elapsed);
        return ret;
    }
    /**
     * Analyze code degradation over time without observation
     *
     * Shows how stability decreases as time elapses with no checks
     * @param {number} time_steps
     * @returns {Float64Array}
     */
    degradation_timeline(time_steps) {
        const ret = wasm.zenostabilizer_degradation_timeline(this.__wbg_ptr, time_steps);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * Get the coherence time of the system
     * @returns {number}
     */
    get_coherence_time() {
        const ret = wasm.zenostabilizer_get_coherence_time(this.__wbg_ptr);
        return ret;
    }
    /**
     * Recommend observation strategy based on risk tolerance
     * @param {number} current_stability
     * @returns {string}
     */
    get_observation_recommendation(current_stability) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.zenostabilizer_get_observation_recommendation(this.__wbg_ptr, current_stability);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Check if the Zeno Effect is successfully "freezing" the code state
     *
     * The state is frozen when survival probability > 0.99 (very high stability)
     * @param {number} stability_score
     * @returns {boolean}
     */
    is_state_frozen(stability_score) {
        const ret = wasm.zenostabilizer_is_state_frozen(this.__wbg_ptr, stability_score);
        return ret !== 0;
    }
    /**
     * Create a new Zeno stabilizer for code integrity
     *
     * # Arguments
     * * `coherence_time` - Natural decay time without observation (0.0-1.0)
     *   0.1 = Very unstable (bugs appear quickly)
     *   0.5 = Moderate stability
     *   0.9 = Very stable (needs fewer checks)
     * @param {number} coherence_time
     * @returns {ZenoStabilizer}
     */
    static new(coherence_time) {
        const ret = wasm.zenostabilizer_new(coherence_time);
        return ZenoStabilizer.__wrap(ret);
    }
    /**
     * Determine the minimum observation frequency needed to maintain stability
     *
     * Given a time period and desired stability level, compute how often
     * the code needs to be checked (tested, analyzed, etc.)
     *
     * # Arguments
     * * `time_period` - Duration over which to maintain stability
     * * `min_stability` - Minimum desired survival probability (0.5-1.0)
     *
     * # Returns
     * Required observation frequency in Hz
     * @param {number} time_period
     * @param {number} min_stability
     * @returns {number}
     */
    required_observation_frequency(time_period, min_stability) {
        const ret = wasm.zenostabilizer_required_observation_frequency(this.__wbg_ptr, time_period, min_stability);
        return ret;
    }
}
if (Symbol.dispose) ZenoStabilizer.prototype[Symbol.dispose] = ZenoStabilizer.prototype.free;

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_is_function_0095a73b8b156f76: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_cd444516edc5b180: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_389efe28435a9388: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_4708e0c13bdc8e95: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_crypto_86f2631e91b51511: function(arg0) {
            const ret = arg0.crypto;
            return ret;
        },
        __wbg_getRandomValues_b3f15fcbfabb0f8b: function() { return handleError(function (arg0, arg1) {
            arg0.getRandomValues(arg1);
        }, arguments); },
        __wbg_length_32ed9a279acd054c: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_msCrypto_d562bbe83e0d4b91: function(arg0) {
            const ret = arg0.msCrypto;
            return ret;
        },
        __wbg_new_no_args_1c7c842f08d00ebb: function(arg0, arg1) {
            const ret = new Function(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_with_length_a2c39cbe88fd8ff1: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_node_e1f24f89a7336c2e: function(arg0) {
            const ret = arg0.node;
            return ret;
        },
        __wbg_process_3975fd6c72f520aa: function(arg0) {
            const ret = arg0.process;
            return ret;
        },
        __wbg_prototypesetcall_bdcdcc5842e4d77d: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_randomFillSync_f8c153b79f285817: function() { return handleError(function (arg0, arg1) {
            arg0.randomFillSync(arg1);
        }, arguments); },
        __wbg_require_b74f47fc2d022fd6: function() { return handleError(function () {
            const ret = module.require;
            return ret;
        }, arguments); },
        __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_a96e1fef17ed23cb: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_versions_4e31226f5e8dc909: function(arg0) {
            const ret = arg0.versions;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./quantum_core_bg.js": import0,
    };
}

const CollaborationSyncFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_collaborationsync_free(ptr >>> 0, 1));
const EntangledStateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_entangledstate_free(ptr >>> 0, 1));
const HolographicConsensusFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_holographicconsensus_free(ptr >>> 0, 1));
const QuantumAnnealerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_quantumannealer_free(ptr >>> 0, 1));
const QuantumCodeGeneratorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_quantumcodegenerator_free(ptr >>> 0, 1));
const QuantumStateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_quantumstate_free(ptr >>> 0, 1));
const RenormalizationEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_renormalizationengine_free(ptr >>> 0, 1));
const SuperpositionSynthesizerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_superpositionsynthesizer_free(ptr >>> 0, 1));
const TunnelingScannerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tunnelingscanner_free(ptr >>> 0, 1));
const ZenoStabilizerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_zenostabilizer_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedFloat64ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('quantum_core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
