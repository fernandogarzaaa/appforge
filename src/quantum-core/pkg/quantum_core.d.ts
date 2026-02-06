/* tslint:disable */
/* eslint-disable */

export class CollaborationSync {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get current fidelity score
     */
    get_fidelity(remote_alpha: number, remote_beta: number): number;
    /**
     * Check if sync is required based on fidelity threshold
     */
    needs_sync(remote_alpha: number, remote_beta: number): boolean;
    constructor();
    /**
     * Update local state and get predicted remote changes
     */
    update_local(change_magnitude: number): number;
}

/**
 * Represents a quantum entangled state for zero-latency synchronization
 */
export class EntangledState {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Apply a phase shift (Z-gate rotation)
     */
    apply_phase(phi: number): void;
    /**
     * Apply a rotation gate to the local state
     * This simulates a local operation that affects the entangled pair
     */
    apply_rotation(theta: number): void;
    static create_bell_state(): EntangledState;
    /**
     * Get state components for debugging
     */
    get_alpha(): number;
    get_beta(): number;
    get_phase(): number;
    /**
     * Check if states are entangled (correlated beyond classical limits)
     */
    is_entangled(remote_alpha: number, remote_beta: number): boolean;
    /**
     * Measure fidelity between local and remote states
     * Returns a value between 0 (total conflict) and 1 (perfect sync)
     */
    measure_fidelity(remote_alpha: number, remote_beta: number): number;
    /**
     * Create a maximally entangled Bell state |Φ+⟩ = (|00⟩ + |11⟩) / √2
     */
    constructor();
    /**
     * Normalize the state vector
     */
    normalize(): void;
    /**
     * Predict the remote state change needed to maintain entanglement
     * Returns the rotation angle needed on remote state
     */
    predict_remote_rotation(target_alpha: number, target_beta: number): number;
}

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
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
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
     */
    compute_density_matrix(flattened_embeddings: Float64Array, num_models: number): Float64Array;
    /**
     * Get the current coherence threshold
     */
    get_coherence_threshold(): number;
    /**
     * Get the current dimension size
     */
    get_dimensions(): number;
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
     */
    measure_coherence(flattened_embeddings: Float64Array, num_models: number): number;
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
     */
    measure_entropy(state_vector: Float64Array): number;
    /**
     * Create a new HolographicConsensus engine
     *
     * # Arguments
     * * `dimensions` - Embedding dimension (typically 1536 for OpenAI embeddings)
     * * `threshold` - Coherence threshold (0.0-1.0) for consensus quality
     */
    static new(dimensions: number, threshold: number): HolographicConsensus;
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
     */
    superpose_models(flattened_embeddings: Float64Array, num_models: number): Float64Array;
}

export class MultiverseEngine {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns JSON representation of all parallel universes for UI visualization.
     */
    get_multiverse_state(): string;
    constructor();
    /**
     * Resets the multiverse engine (clears all realities).
     */
    reset(): void;
    /**
     * Sets a deterministic seed for entropy, enabling reproducible simulations.
     */
    set_seed(seed: bigint): void;
    /**
     * Simulates time passing in all universes to see which one survives.
     * Returns the ID of the best universe.
     */
    simulate_evolution(cycles: number): string;
    /**
     * Spawns a new parallel reality based on a decision branch.
     */
    spawn_universe(id: string, name: string, code_quality: number): void;
    /**
     * Spawns a new parallel reality with explicit quantum parameters.
     */
    spawn_universe_with_params(id: string, name: string, code_quality: number, entanglement: number, coherence: number, decoherence_rate: number): void;
}

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
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get current temperature (for monitoring)
     */
    get_temperature(): number;
    /**
     * Check if the system has reached thermal equilibrium (frozen)
     */
    is_frozen(): boolean;
    /**
     * Creates a new Quantum Annealer for model selection
     *
     * # Arguments
     * * `start_temp` - Initial temperature (typically 100.0)
     * * `cooling_rate` - Temperature decay rate per iteration (typically 0.95)
     */
    constructor(start_temp: number, cooling_rate: number);
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
     */
    optimize_selection(models_data: Float64Array): number;
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
     */
    optimize_with_weights(models_data: Float64Array, cost_weight: number, latency_weight: number, quality_weight: number): number;
    /**
     * Reset the annealer for a new optimization run
     */
    reset(start_temp: number): void;
}

export class QuantumCodeGenerator {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Generate optimal code architecture using quantum superposition
     */
    generate_architecture(num_approaches: number, total_constraints: number): string;
    /**
     * Get all solution probabilities
     */
    get_solution_analysis(): string;
    constructor();
}

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

export class QuantumVar {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Add a potential value this variable could have.
     * Values are stored as JSON strings for interop with JS.
     */
    add_state(value: string, probability: number): void;
    /**
     * Merge another QuantumVar into this one (interference).
     */
    entangle(other: QuantumVar): void;
    constructor();
    /**
     * Observe the variable and collapse the superposition into a single value.
     */
    observe(): string;
    /**
     * Return the most likely value without collapsing the state.
     */
    peek_most_likely(): string;
    /**
     * Shannon entropy: 0.0 = certainty, higher = uncertainty.
     */
    uncertainty_index(): number;
}

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
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
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
     */
    coarse_grain(micro_metrics: Float64Array): Float64Array;
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
     */
    estimate_time_to_criticality(metrics: Float64Array, update_interval: number): number;
    /**
     * Find the scale at which the system becomes unstable
     *
     * Returns the number of RG flow steps before criticality threshold
     */
    find_critical_scale(metrics: Float64Array, criticality_threshold: number): number;
    /**
     * Track the RG Flow evolution step by step
     *
     * Returns criticality level after flow evolution (0.0 = stable, 1.0 = critical)
     */
    flow_evolution(metrics: Float64Array): number;
    /**
     * Get the scale factor
     */
    get_scale_factor(): number;
    /**
     * Get health status based on criticality
     */
    get_system_health(metrics: Float64Array): string;
    /**
     * Create a new renormalization engine
     *
     * # Arguments
     * * `scale_factor` - Coarse-graining factor (typically 2, 4, 8)
     *   2 = average every 2 data points
     *   4 = average every 4 data points
     *   8 = aggressive coarse-graining
     */
    static new(scale_factor: number): RenormalizationEngine;
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
     */
    predict_criticality(metrics: Float64Array): number;
}

/**
 * Represents a quantum state that can be evolved reversibly using Toffoli gates
 */
export class ReversibleState {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Apply Toffoli gate (controlled-controlled-NOT) operation
     * control1, control2: indices of control qubits
     * target: index of target qubit to flip
     */
    apply_toffoli(control1: number, control2: number, target: number): boolean;
    constructor(size: number);
    /**
     * Reversible increment operation: x' = x + 1 (without destroying old value)
     */
    reversible_increment(index: number): boolean;
    /**
     * Get current state as JSON
     */
    to_json(): string;
    readonly iteration: bigint;
    readonly phase: number;
}

/**
 * Manages timeline of reversible state snapshots with differential encoding
 */
export class StateHistory {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Clear all history
     */
    clear(): void;
    /**
     * Get timeline as JSON array
     */
    get_timeline(): string;
    constructor(max_snapshots: number, snapshot_interval: bigint);
    /**
     * Record a new state snapshot
     */
    record_snapshot(state: ReversibleState, description: string): boolean;
    /**
     * Rollback to a specific iteration
     */
    rollback_to(target_iteration: bigint): string | undefined;
    readonly snapshot_count: number;
}

export class SuperpositionSynthesizer {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Step 2: Apply interference based on constraint matching
     * Solutions that violate constraints suffer destructive interference
     */
    apply_interference(): void;
    /**
     * Calculate entropy of the superposition (measure of uncertainty)
     */
    calculate_entropy(): number;
    /**
     * Step 3: Collapse the wavefunction to the optimal solution
     * Returns the index of the best solution
     */
    collapse_to_optimal(): number;
    /**
     * Step 1: Create superposition by generating multiple solution approaches
     * This is the Hadamard gate - creating equal superposition
     */
    create_superposition(num_approaches: number): void;
    /**
     * Simulate constraint checking for a solution
     */
    evaluate_constraints(solution_idx: number, constraints_met: number, constraints_total: number): void;
    /**
     * Get the optimal solution after collapse
     */
    get_optimal_solution(): string;
    /**
     * Calculate probability of each solution (|amplitude|²)
     */
    get_probabilities(): Float64Array;
    /**
     * Get number of solutions in superposition
     */
    get_solution_count(): number;
    constructor();
}

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
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
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
     */
    calculate_tunneling_probability(barrier_height: number, attack_energy: number): number;
    /**
     * Identify critical weaknesses by finding maximum tunneling probability
     *
     * Returns the maximum tunneling probability found
     */
    find_critical_weakness(barriers: Float64Array): number;
    /**
     * Get the barrier width (firewall complexity)
     */
    get_barrier_width(): number;
    /**
     * Get the decay constant (quantum simulation parameter)
     */
    get_decay_constant(): number;
    /**
     * Create a new tunneling scanner with specified barrier width
     *
     * # Arguments
     * * `barrier_width` - Thickness of security barrier (0.0-1.0)
     *   0.1 = thin/simple firewall, 0.9 = thick/complex defense
     */
    static new(barrier_width: number): TunnelingScanner;
    /**
     * Analyze required barrier strength to block an attack
     *
     * Given attack sophistication, determine minimum barrier needed
     */
    required_barrier_for_attack(attack_energy: number, target_blocking: number): number;
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
     */
    run_penetration_test(iterations: number, avg_barrier: number): Float64Array;
}

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
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Calculate the "Freeze Depth" - how frozen is the code state?
     *
     * A measure from 0.0 (no freeze) to 1.0 (complete freeze)
     */
    calculate_freeze_depth(observation_frequency: number, time_elapsed: number): number;
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
     */
    calculate_stability(observation_frequency: number, time_elapsed: number): number;
    /**
     * Analyze code degradation over time without observation
     *
     * Shows how stability decreases as time elapses with no checks
     */
    degradation_timeline(time_steps: number): Float64Array;
    /**
     * Get the coherence time of the system
     */
    get_coherence_time(): number;
    /**
     * Recommend observation strategy based on risk tolerance
     */
    get_observation_recommendation(current_stability: number): string;
    /**
     * Check if the Zeno Effect is successfully "freezing" the code state
     *
     * The state is frozen when survival probability > 0.99 (very high stability)
     */
    is_state_frozen(stability_score: number): boolean;
    /**
     * Create a new Zeno stabilizer for code integrity
     *
     * # Arguments
     * * `coherence_time` - Natural decay time without observation (0.0-1.0)
     *   0.1 = Very unstable (bugs appear quickly)
     *   0.5 = Moderate stability
     *   0.9 = Very stable (needs fewer checks)
     */
    static new(coherence_time: number): ZenoStabilizer;
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
     */
    required_observation_frequency(time_period: number, min_stability: number): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_collaborationsync_free: (a: number, b: number) => void;
    readonly __wbg_entangledstate_free: (a: number, b: number) => void;
    readonly __wbg_holographicconsensus_free: (a: number, b: number) => void;
    readonly __wbg_multiverseengine_free: (a: number, b: number) => void;
    readonly __wbg_quantumcodegenerator_free: (a: number, b: number) => void;
    readonly __wbg_quantumstate_free: (a: number, b: number) => void;
    readonly __wbg_quantumvar_free: (a: number, b: number) => void;
    readonly __wbg_renormalizationengine_free: (a: number, b: number) => void;
    readonly __wbg_reversiblestate_free: (a: number, b: number) => void;
    readonly __wbg_statehistory_free: (a: number, b: number) => void;
    readonly __wbg_superpositionsynthesizer_free: (a: number, b: number) => void;
    readonly __wbg_zenostabilizer_free: (a: number, b: number) => void;
    readonly collaborationsync_get_fidelity: (a: number, b: number, c: number) => number;
    readonly collaborationsync_needs_sync: (a: number, b: number, c: number) => number;
    readonly collaborationsync_new: () => number;
    readonly collaborationsync_update_local: (a: number, b: number) => number;
    readonly entangledstate_apply_phase: (a: number, b: number) => void;
    readonly entangledstate_apply_rotation: (a: number, b: number) => void;
    readonly entangledstate_create_bell_state: () => number;
    readonly entangledstate_get_alpha: (a: number) => number;
    readonly entangledstate_get_beta: (a: number) => number;
    readonly entangledstate_get_phase: (a: number) => number;
    readonly entangledstate_is_entangled: (a: number, b: number, c: number) => number;
    readonly entangledstate_measure_fidelity: (a: number, b: number, c: number) => number;
    readonly entangledstate_normalize: (a: number) => void;
    readonly entangledstate_predict_remote_rotation: (a: number, b: number, c: number) => number;
    readonly holographicconsensus_compute_density_matrix: (a: number, b: number, c: number, d: number) => [number, number];
    readonly holographicconsensus_get_coherence_threshold: (a: number) => number;
    readonly holographicconsensus_get_dimensions: (a: number) => number;
    readonly holographicconsensus_measure_coherence: (a: number, b: number, c: number, d: number) => number;
    readonly holographicconsensus_measure_entropy: (a: number, b: number, c: number) => number;
    readonly holographicconsensus_new: (a: number, b: number) => number;
    readonly holographicconsensus_superpose_models: (a: number, b: number, c: number, d: number) => [number, number];
    readonly multiverseengine_get_multiverse_state: (a: number) => [number, number];
    readonly multiverseengine_new: () => number;
    readonly multiverseengine_reset: (a: number) => void;
    readonly multiverseengine_set_seed: (a: number, b: bigint) => void;
    readonly multiverseengine_simulate_evolution: (a: number, b: number) => [number, number];
    readonly multiverseengine_spawn_universe: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly multiverseengine_spawn_universe_with_params: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
    readonly quantumannealer_is_frozen: (a: number) => number;
    readonly quantumannealer_new: (a: number, b: number) => number;
    readonly quantumannealer_optimize_selection: (a: number, b: number, c: number) => number;
    readonly quantumannealer_optimize_with_weights: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly quantumannealer_reset: (a: number, b: number) => void;
    readonly quantumcodegenerator_generate_architecture: (a: number, b: number, c: number) => [number, number];
    readonly quantumcodegenerator_get_solution_analysis: (a: number) => [number, number];
    readonly quantumcodegenerator_new: () => number;
    readonly quantumstate_apply_interference: (a: number, b: number, c: number) => void;
    readonly quantumstate_measure_probability: (a: number) => number;
    readonly quantumstate_new: (a: number) => number;
    readonly quantumvar_add_state: (a: number, b: number, c: number, d: number) => void;
    readonly quantumvar_entangle: (a: number, b: number) => void;
    readonly quantumvar_new: () => number;
    readonly quantumvar_observe: (a: number) => [number, number];
    readonly quantumvar_peek_most_likely: (a: number) => [number, number];
    readonly quantumvar_uncertainty_index: (a: number) => number;
    readonly renormalizationengine_coarse_grain: (a: number, b: number, c: number) => [number, number];
    readonly renormalizationengine_estimate_time_to_criticality: (a: number, b: number, c: number, d: number) => number;
    readonly renormalizationengine_find_critical_scale: (a: number, b: number, c: number, d: number) => number;
    readonly renormalizationengine_flow_evolution: (a: number, b: number, c: number) => number;
    readonly renormalizationengine_get_scale_factor: (a: number) => number;
    readonly renormalizationengine_get_system_health: (a: number, b: number, c: number) => [number, number];
    readonly renormalizationengine_new: (a: number) => number;
    readonly renormalizationengine_predict_criticality: (a: number, b: number, c: number) => number;
    readonly reversiblestate_apply_toffoli: (a: number, b: number, c: number, d: number) => number;
    readonly reversiblestate_iteration: (a: number) => bigint;
    readonly reversiblestate_new: (a: number) => number;
    readonly reversiblestate_phase: (a: number) => number;
    readonly reversiblestate_reversible_increment: (a: number, b: number) => number;
    readonly reversiblestate_to_json: (a: number) => [number, number];
    readonly statehistory_clear: (a: number) => void;
    readonly statehistory_get_timeline: (a: number) => [number, number];
    readonly statehistory_new: (a: number, b: bigint) => number;
    readonly statehistory_record_snapshot: (a: number, b: number, c: number, d: number) => number;
    readonly statehistory_rollback_to: (a: number, b: bigint) => [number, number];
    readonly statehistory_snapshot_count: (a: number) => number;
    readonly superpositionsynthesizer_apply_interference: (a: number) => void;
    readonly superpositionsynthesizer_calculate_entropy: (a: number) => number;
    readonly superpositionsynthesizer_collapse_to_optimal: (a: number) => number;
    readonly superpositionsynthesizer_create_superposition: (a: number, b: number) => void;
    readonly superpositionsynthesizer_evaluate_constraints: (a: number, b: number, c: number, d: number) => void;
    readonly superpositionsynthesizer_get_optimal_solution: (a: number) => [number, number];
    readonly superpositionsynthesizer_get_probabilities: (a: number) => [number, number];
    readonly superpositionsynthesizer_get_solution_count: (a: number) => number;
    readonly tunnelingscanner_calculate_tunneling_probability: (a: number, b: number, c: number) => number;
    readonly tunnelingscanner_find_critical_weakness: (a: number, b: number, c: number) => number;
    readonly tunnelingscanner_get_decay_constant: (a: number) => number;
    readonly tunnelingscanner_new: (a: number) => number;
    readonly tunnelingscanner_required_barrier_for_attack: (a: number, b: number, c: number) => number;
    readonly tunnelingscanner_run_penetration_test: (a: number, b: number, c: number) => [number, number];
    readonly zenostabilizer_calculate_freeze_depth: (a: number, b: number, c: number) => number;
    readonly zenostabilizer_calculate_stability: (a: number, b: number, c: number) => number;
    readonly zenostabilizer_degradation_timeline: (a: number, b: number) => [number, number];
    readonly zenostabilizer_get_coherence_time: (a: number) => number;
    readonly zenostabilizer_get_observation_recommendation: (a: number, b: number) => [number, number];
    readonly zenostabilizer_is_state_frozen: (a: number, b: number) => number;
    readonly zenostabilizer_new: (a: number) => number;
    readonly zenostabilizer_required_observation_frequency: (a: number, b: number, c: number) => number;
    readonly entangledstate_new: () => number;
    readonly superpositionsynthesizer_new: () => number;
    readonly __wbg_quantumannealer_free: (a: number, b: number) => void;
    readonly __wbg_tunnelingscanner_free: (a: number, b: number) => void;
    readonly tunnelingscanner_get_barrier_width: (a: number) => number;
    readonly quantumannealer_get_temperature: (a: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
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
