/**
 * QuantumDecoder — Simulated-annealing token selection
 *
 * Uses simulated annealing over a quantum-inspired energy landscape
 * to select tokens. Tokens are treated as quantum states; the decoder
 * explores superpositions and gradually cools to collapse onto the
 * optimal sequence, avoiding greedy local minima.
 */
import { complexFromPolar, complexMagnitudeSq, } from './types';
/**
 * QuantumDecoder selects tokens by treating the vocabulary as a
 * quantum system and using simulated annealing to find the
 * minimum-energy (maximum-coherence) token sequence.
 */
export class QuantumDecoder {
    config;
    schedule;
    rng;
    stepCount = 0;
    constructor(config, schedule) {
        this.config = config;
        this.schedule = {
            initialTemperature: schedule?.initialTemperature ?? config.temperature,
            coolingRate: schedule?.coolingRate ?? 0.995,
            minTemperature: schedule?.minTemperature ?? 0.01,
            stepsPerTemperature: schedule?.stepsPerTemperature ?? 10,
            reheatingEnabled: schedule?.reheatingEnabled ?? true,
            reheatingThreshold: schedule?.reheatingThreshold ?? 0.3,
        };
        this.rng = config.seed !== undefined ? this.seededRng(config.seed) : Math.random;
    }
    /**
     * Select a single token from candidates using quantum annealing.
     *
     * @param candidates  Scored token candidates from the LLM
     * @param context     Previous tokens for coherence evaluation
     * @returns SuperpositionResult with the selected token
     */
    selectToken(candidates, context = []) {
        if (candidates.length === 0) {
            throw new Error('Cannot select from empty candidate list');
        }
        if (candidates.length === 1) {
            return this.trivialResult(candidates[0]);
        }
        // Prune to manageable superposition width
        const pruned = this.pruneCandiates(candidates);
        // Initialise quantum state: put all candidates in superposition
        const initialState = this.initSuperposition(pruned);
        // Run simulated annealing
        const { bestState, allStates } = this.anneal(initialState, pruned, context);
        // Build result
        return this.buildResult(bestState, pruned, allStates);
    }
    /**
     * Decode a full sequence of N tokens autoregressively.
     *
     * @param getCandidates  Function that returns next-token candidates given context
     * @param initialContext Starting context tokens
     * @param maxTokens      Maximum tokens to generate
     * @param stopTokens     Tokens that terminate generation
     */
    async decodeSequence(getCandidates, initialContext, maxTokens = 100, stopTokens = new Set(['<eos>', '<|endoftext|>'])) {
        const tokens = [...initialContext];
        const perTokenResults = [];
        const coherences = [];
        for (let i = 0; i < maxTokens; i++) {
            const candidates = await getCandidates(tokens);
            if (candidates.length === 0)
                break;
            const result = this.selectToken(candidates, tokens);
            const selectedToken = result.selected.token;
            if (stopTokens.has(selectedToken))
                break;
            tokens.push(selectedToken);
            perTokenResults.push(result);
            coherences.push(result.coherence);
        }
        return {
            tokens: tokens.slice(initialContext.length),
            totalCoherence: this.aggregateCoherence(coherences),
            perTokenResults,
        };
    }
    /** Reset internal step counter */
    reset() {
        this.stepCount = 0;
    }
    // ── Private Methods ──────────────────────────────────────────────
    initSuperposition(candidates) {
        const n = candidates.length;
        const uniformAmp = 1 / Math.sqrt(n);
        return {
            energy: this.computeEnergy(candidates.map((_, i) => i), candidates),
            tokenIndices: candidates.map((_, i) => i),
            amplitudes: candidates.map((c, i) => {
                // Bias initial phase by log-probability for faster convergence
                const phase = c.logProbability * Math.PI;
                return complexFromPolar(uniformAmp, phase);
            }),
        };
    }
    anneal(initial, candidates, context) {
        let current = { ...initial };
        let best = { ...initial };
        let temperature = this.schedule.initialTemperature;
        const allStates = [initial];
        let stuckCounter = 0;
        while (temperature > this.schedule.minTemperature) {
            for (let step = 0; step < this.schedule.stepsPerTemperature; step++) {
                this.stepCount++;
                // Generate neighbour by perturbing amplitudes (quantum tunnelling)
                const neighbour = this.perturb(current, candidates, temperature);
                const deltaE = neighbour.energy - current.energy;
                // Metropolis criterion
                if (deltaE < 0 || this.rng() < Math.exp(-deltaE / temperature)) {
                    current = neighbour;
                    if (current.energy < best.energy) {
                        best = { ...current };
                        stuckCounter = 0;
                    }
                    else {
                        stuckCounter++;
                    }
                }
                allStates.push(current);
            }
            // Cool down
            temperature *= this.schedule.coolingRate;
            // Reheat if stuck
            if (this.schedule.reheatingEnabled &&
                stuckCounter > this.schedule.stepsPerTemperature * 3) {
                temperature = Math.min(this.schedule.initialTemperature * this.schedule.reheatingThreshold, temperature * 5);
                stuckCounter = 0;
            }
        }
        return { bestState: best, allStates };
    }
    perturb(state, candidates, temperature) {
        const newAmplitudes = state.amplitudes.map((amp) => {
            // Random phase kick proportional to temperature
            const phaseKick = (this.rng() - 0.5) * 2 * Math.PI * temperature;
            const magnitudeJitter = 1 + (this.rng() - 0.5) * temperature * 0.5;
            const currentMag = Math.sqrt(complexMagnitudeSq(amp));
            const currentPhase = Math.atan2(amp.imaginary, amp.real);
            return complexFromPolar(Math.max(0, currentMag * magnitudeJitter), currentPhase + phaseKick);
        });
        // Renormalise
        const norm = Math.sqrt(newAmplitudes.reduce((s, a) => s + complexMagnitudeSq(a), 0));
        const normalised = norm > 0
            ? newAmplitudes.map((a) => ({ real: a.real / norm, imaginary: a.imaginary / norm }))
            : newAmplitudes;
        return {
            energy: this.computeEnergy(state.tokenIndices, candidates, normalised),
            tokenIndices: state.tokenIndices,
            amplitudes: normalised,
        };
    }
    computeEnergy(indices, candidates, amplitudes) {
        let energy = 0;
        for (let i = 0; i < indices.length; i++) {
            const candidate = candidates[indices[i]];
            if (!candidate)
                continue;
            // Base energy: negative log-probability (lower is better)
            const baseEnergy = -candidate.logProbability;
            if (amplitudes?.[i]) {
                // Quantum correction: penalise low-amplitude states
                const prob = complexMagnitudeSq(amplitudes[i]);
                energy += baseEnergy * prob;
                // Interference bonus: reward coherent phase alignment
                if (i > 0 && amplitudes[i - 1]) {
                    const phaseDiff = Math.atan2(amplitudes[i].imaginary, amplitudes[i].real) -
                        Math.atan2(amplitudes[i - 1].imaginary, amplitudes[i - 1].real);
                    energy -= 0.1 * Math.cos(phaseDiff); // constructive interference reduces energy
                }
            }
            else {
                energy += baseEnergy / indices.length;
            }
        }
        return energy;
    }
    pruneCandiates(candidates) {
        const maxWidth = this.config.maxSuperpositionWidth;
        if (candidates.length <= maxWidth)
            return candidates;
        // Keep top candidates by probability
        return [...candidates]
            .sort((a, b) => b.classicalProbability - a.classicalProbability)
            .slice(0, maxWidth);
    }
    buildResult(bestState, candidates, allStates) {
        // Convert final amplitudes to probability distribution
        const probs = bestState.amplitudes.map((a) => complexMagnitudeSq(a));
        const probSum = probs.reduce((s, p) => s + p, 0) || 1;
        const normalised = probs.map((p) => p / probSum);
        // Select token with highest probability after annealing
        let bestIdx = 0;
        let bestProb = 0;
        for (let i = 0; i < normalised.length; i++) {
            if (normalised[i] > bestProb) {
                bestProb = normalised[i];
                bestIdx = i;
            }
        }
        const selected = candidates[bestState.tokenIndices[bestIdx]];
        // Compute coherence
        const coherence = this.computeCoherence(bestState, allStates);
        // Count interference patterns
        let constructive = 0;
        let destructive = 0;
        for (let i = 1; i < bestState.amplitudes.length; i++) {
            const prevPhase = Math.atan2(bestState.amplitudes[i - 1].imaginary, bestState.amplitudes[i - 1].real);
            const currPhase = Math.atan2(bestState.amplitudes[i].imaginary, bestState.amplitudes[i].real);
            const diff = Math.abs(currPhase - prevPhase);
            if (diff < Math.PI / 2)
                constructive++;
            else
                destructive++;
        }
        const total = constructive + destructive || 1;
        return {
            selected,
            selectedProbability: bestProb,
            distribution: candidates.map((c, i) => ({
                outcome: c,
                probability: normalised[i] ?? 0,
                amplitude: bestState.amplitudes[i] ?? { real: 0, imaginary: 0 },
            })),
            coherence,
            superpositionWidth: candidates.length,
            interferencePattern: {
                constructive: constructive / total,
                destructive: destructive / total,
                netEffect: (constructive - destructive) / total,
            },
        };
    }
    computeCoherence(best, history) {
        const energies = history.map((s) => s.energy);
        const minE = Math.min(...energies);
        const maxE = Math.max(...energies);
        const range = maxE - minE || 1;
        // Convergence quality = how close best is to minimum
        const convergence = 1 - (best.energy - minE) / range;
        // Phase coherence from amplitude distribution
        const phases = best.amplitudes.map((a) => Math.atan2(a.imaginary, a.real));
        const meanPhase = phases.reduce((s, p) => s + p, 0) / phases.length;
        const phaseVariance = phases.reduce((s, p) => s + (p - meanPhase) ** 2, 0) / phases.length;
        const phaseCoherence = Math.exp(-phaseVariance / Math.PI);
        // Amplitude coherence
        const mags = best.amplitudes.map((a) => Math.sqrt(complexMagnitudeSq(a)));
        const meanMag = mags.reduce((s, m) => s + m, 0) / mags.length;
        const magVariance = mags.reduce((s, m) => s + (m - meanMag) ** 2, 0) / mags.length;
        const amplitudeCoherence = Math.exp(-magVariance);
        const overall = 0.4 * convergence + 0.3 * phaseCoherence + 0.3 * amplitudeCoherence;
        return {
            overall: Math.min(1, Math.max(0, overall)),
            phaseCoherence,
            amplitudeCoherence,
            entanglementFidelity: convergence,
            decoherenceRate: 1 - convergence,
            effectiveQubits: Math.round(this.config.numQubits * overall),
            measuredAt: Date.now(),
        };
    }
    trivialResult(candidate) {
        return {
            selected: candidate,
            selectedProbability: 1,
            distribution: [{ outcome: candidate, probability: 1, amplitude: { real: 1, imaginary: 0 } }],
            coherence: {
                overall: 1,
                phaseCoherence: 1,
                amplitudeCoherence: 1,
                entanglementFidelity: 1,
                decoherenceRate: 0,
                effectiveQubits: this.config.numQubits,
                measuredAt: Date.now(),
            },
            superpositionWidth: 1,
            interferencePattern: { constructive: 1, destructive: 0, netEffect: 1 },
        };
    }
    aggregateCoherence(scores) {
        if (scores.length === 0) {
            return {
                overall: 0, phaseCoherence: 0, amplitudeCoherence: 0,
                entanglementFidelity: 0, decoherenceRate: 1, effectiveQubits: 0,
                measuredAt: Date.now(),
            };
        }
        const avg = (fn) => scores.reduce((s, c) => s + fn(c), 0) / scores.length;
        return {
            overall: avg((c) => c.overall),
            phaseCoherence: avg((c) => c.phaseCoherence),
            amplitudeCoherence: avg((c) => c.amplitudeCoherence),
            entanglementFidelity: avg((c) => c.entanglementFidelity),
            decoherenceRate: avg((c) => c.decoherenceRate),
            effectiveQubits: Math.round(avg((c) => c.effectiveQubits)),
            measuredAt: Date.now(),
        };
    }
    seededRng(seed) {
        let s = seed;
        return () => {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            return (s >>> 0) / 0xffffffff;
        };
    }
}
