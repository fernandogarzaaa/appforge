/**
 * QuantumConsensus — Multi-model quantum voting
 *
 * Aggregates outputs from multiple LLM models using quantum-inspired
 * voting. Each model's output is treated as a quantum state; the
 * consensus mechanism uses entanglement-based correlation and
 * interference to select the best collective answer.
 */
import { complexFromPolar, complexMagnitudeSq, complexAdd, complexMultiply, } from './types';
/**
 * QuantumConsensus aggregates multiple model outputs into a single
 * high-confidence answer using quantum voting mechanics.
 */
export class QuantumConsensus {
    config;
    strategy;
    rng;
    roundHistory = [];
    constructor(config, strategy = 'adaptive') {
        this.config = config;
        this.strategy = strategy;
        this.rng = config.seed !== undefined ? this.seededRng(config.seed) : Math.random;
    }
    /**
     * Run quantum consensus on a set of model votes.
     *
     * @param votes     Outputs from multiple models
     * @param similarity  Function to compute similarity between two outputs (0–1)
     * @returns ConsensusResult with the winning output
     */
    vote(votes, similarity = this.defaultSimilarity) {
        if (votes.length === 0) {
            throw new Error('Cannot reach consensus with zero votes');
        }
        if (votes.length === 1) {
            return this.singleVoteResult(votes[0]);
        }
        // Step 1: Group similar outputs
        const groups = this.groupByOutput(votes, similarity);
        // Step 2: Compute entanglement between models
        const entanglements = this.computeEntanglements(votes, similarity);
        // Step 3: Assign quantum amplitudes to each group
        const amplitudes = this.assignAmplitudes(groups, votes, entanglements);
        // Step 4: Apply interference
        const interfered = this.applyInterference(amplitudes, groups, entanglements);
        // Step 5: Select winner based on strategy
        const effectiveStrategy = this.strategy === 'adaptive'
            ? this.selectAdaptiveStrategy(groups, entanglements)
            : this.strategy;
        const winner = this.selectWinner(interfered, groups, effectiveStrategy);
        // Step 6: Measure coherence
        const coherence = this.measureConsensusCoherence(interfered, groups, entanglements);
        // Build result
        const result = {
            winner: winner.output,
            confidence: winner.weight,
            votes: interfered.map((amp, i) => ({
                output: groups[i].representative,
                quantumWeight: amp.quantumWeight,
                classicalWeight: amp.classicalWeight,
                modelIds: groups[i].modelIds,
            })),
            entanglements,
            coherence,
            interferencePattern: this.computeInterferencePattern(amplitudes, interfered),
        };
        this.roundHistory.push(result);
        return result;
    }
    /**
     * Iterative consensus: run multiple rounds, letting quantum
     * weights evolve until convergence.
     */
    iterativeConsensus(votes, rounds = 3, similarity = this.defaultSimilarity) {
        let currentVotes = [...votes];
        for (let round = 0; round < rounds - 1; round++) {
            const result = this.vote(currentVotes, similarity);
            // Re-weight votes based on quantum consensus
            currentVotes = currentVotes.map((v) => {
                const matchingGroup = result.votes.find((g) => g.modelIds.includes(v.modelId));
                const quantumBoost = matchingGroup?.quantumWeight ?? 0;
                return {
                    ...v,
                    confidence: Math.min(1, v.confidence * (1 + quantumBoost)),
                };
            });
        }
        return this.vote(currentVotes, similarity);
    }
    /** Get historical consensus quality */
    getHistory() {
        if (this.roundHistory.length === 0) {
            return { rounds: 0, averageCoherence: 0, averageConfidence: 0 };
        }
        return {
            rounds: this.roundHistory.length,
            averageCoherence: this.roundHistory.reduce((s, r) => s + r.coherence.overall, 0) / this.roundHistory.length,
            averageConfidence: this.roundHistory.reduce((s, r) => s + r.confidence, 0) / this.roundHistory.length,
        };
    }
    // ── Private Methods ──────────────────────────────────────────────
    groupByOutput(votes, similarity) {
        const groups = [];
        const threshold = 0.85; // similarity threshold for grouping
        for (const vote of votes) {
            let merged = false;
            for (const group of groups) {
                if (similarity(vote.output, group.representative) >= threshold) {
                    group.modelIds.push(vote.modelId);
                    group.totalConfidence += vote.confidence;
                    merged = true;
                    break;
                }
            }
            if (!merged) {
                groups.push({
                    representative: vote.output,
                    modelIds: [vote.modelId],
                    totalConfidence: vote.confidence,
                });
            }
        }
        return groups;
    }
    computeEntanglements(votes, similarity) {
        const pairs = [];
        let pairId = 0;
        for (let i = 0; i < votes.length; i++) {
            for (let j = i + 1; j < votes.length; j++) {
                const sim = similarity(votes[i].output, votes[j].output);
                if (sim > 0.5) {
                    // Determine Bell state based on similarity pattern
                    const bellState = this.determineBellState(sim, votes[i].confidence, votes[j].confidence);
                    const concurrence = sim * Math.min(votes[i].confidence, votes[j].confidence);
                    pairs.push({
                        id: `ep-${pairId++}`,
                        subsystemA: votes[i].modelId,
                        subsystemB: votes[j].modelId,
                        bellState,
                        concurrence,
                        measured: false,
                        correlationStrength: sim,
                        createdAt: Date.now(),
                    });
                }
            }
        }
        return pairs;
    }
    determineBellState(similarity, confA, confB) {
        // Map similarity and confidence patterns to Bell states
        if (similarity > 0.9 && Math.abs(confA - confB) < 0.2)
            return 'Φ+'; // Strong agreement, similar confidence
        if (similarity > 0.9)
            return 'Φ-'; // Strong agreement, different confidence
        if (similarity > 0.7)
            return 'Ψ+'; // Moderate agreement
        return 'Ψ-'; // Weak agreement
    }
    assignAmplitudes(groups, votes, entanglements) {
        const totalVotes = votes.length;
        return groups.map((group) => {
            // Classical weight: proportion of votes × average confidence
            const classicalWeight = (group.modelIds.length / totalVotes) * (group.totalConfidence / group.modelIds.length);
            // Quantum amplitude: encode entanglement strength
            const entanglementBoost = this.computeEntanglementBoost(group.modelIds, entanglements);
            const magnitude = Math.sqrt(classicalWeight) * (1 + entanglementBoost);
            const phase = (2 * Math.PI * group.totalConfidence) / (groups.length + 1);
            return {
                amplitude: complexFromPolar(magnitude, phase),
                classicalWeight,
            };
        });
    }
    computeEntanglementBoost(modelIds, entanglements) {
        let boost = 0;
        for (const ep of entanglements) {
            const aIn = modelIds.includes(ep.subsystemA);
            const bIn = modelIds.includes(ep.subsystemB);
            if (aIn && bIn) {
                // Internal entanglement: agreement within group
                boost += ep.concurrence * 0.5;
            }
            else if (aIn || bIn) {
                // Cross-group entanglement: mild penalty (reduces distinctiveness)
                boost -= ep.concurrence * 0.1;
            }
        }
        return Math.max(0, boost);
    }
    applyInterference(amplitudes, groups, entanglements) {
        // Pairwise interference between groups
        const interferedAmps = amplitudes.map((a) => ({ ...a.amplitude }));
        for (let i = 0; i < interferedAmps.length; i++) {
            for (let j = i + 1; j < interferedAmps.length; j++) {
                // Check if groups share entangled models
                const sharedEntanglement = entanglements.some((ep) => (groups[i].modelIds.includes(ep.subsystemA) && groups[j].modelIds.includes(ep.subsystemB)) ||
                    (groups[i].modelIds.includes(ep.subsystemB) && groups[j].modelIds.includes(ep.subsystemA)));
                if (sharedEntanglement) {
                    // Constructive interference between entangled groups
                    const interference = complexMultiply(interferedAmps[i], { real: 0.1, imaginary: 0 });
                    interferedAmps[i] = complexAdd(interferedAmps[i], interference);
                }
            }
        }
        // Convert to probabilities
        const probs = interferedAmps.map((a) => complexMagnitudeSq(a));
        const probSum = probs.reduce((s, p) => s + p, 0) || 1;
        return amplitudes.map((a, i) => ({
            quantumWeight: probs[i] / probSum,
            classicalWeight: a.classicalWeight,
        }));
    }
    selectWinner(weights, groups, strategy) {
        let bestIdx = 0;
        let bestScore = -Infinity;
        for (let i = 0; i < groups.length; i++) {
            let score;
            switch (strategy) {
                case 'majority':
                    score = groups[i].modelIds.length + weights[i].quantumWeight * 0.5;
                    break;
                case 'amplitude':
                    score = weights[i].quantumWeight;
                    break;
                case 'entanglement':
                    score = weights[i].quantumWeight * 1.5 + weights[i].classicalWeight * 0.5;
                    break;
                default:
                    score = weights[i].quantumWeight;
            }
            if (score > bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }
        return {
            output: groups[bestIdx].representative,
            weight: weights[bestIdx].quantumWeight,
        };
    }
    selectAdaptiveStrategy(groups, entanglements) {
        // If clear majority exists, use majority voting
        const maxGroupSize = Math.max(...groups.map((g) => g.modelIds.length));
        const totalModels = groups.reduce((s, g) => s + g.modelIds.length, 0);
        if (maxGroupSize > totalModels * 0.6) {
            return 'majority';
        }
        // If strong entanglement, use entanglement-based
        const avgConcurrence = entanglements.length > 0
            ? entanglements.reduce((s, e) => s + e.concurrence, 0) / entanglements.length
            : 0;
        if (avgConcurrence > 0.7) {
            return 'entanglement';
        }
        // Default to amplitude-based
        return 'amplitude';
    }
    measureConsensusCoherence(weights, groups, entanglements) {
        // Agreement level: how concentrated are the votes?
        const maxWeight = Math.max(...weights.map((w) => w.quantumWeight));
        const entropy = -weights.reduce((s, w) => s + (w.quantumWeight > 0 ? w.quantumWeight * Math.log2(w.quantumWeight) : 0), 0);
        const maxEntropy = Math.log2(weights.length) || 1;
        const agreement = 1 - entropy / maxEntropy;
        // Entanglement fidelity
        const avgConcurrence = entanglements.length > 0
            ? entanglements.reduce((s, e) => s + e.concurrence, 0) / entanglements.length
            : 0;
        const overall = 0.4 * agreement + 0.3 * maxWeight + 0.3 * avgConcurrence;
        return {
            overall: Math.min(1, Math.max(0, overall)),
            phaseCoherence: agreement,
            amplitudeCoherence: maxWeight,
            entanglementFidelity: avgConcurrence,
            decoherenceRate: 1 - overall,
            effectiveQubits: Math.round(this.config.numQubits * overall),
            measuredAt: Date.now(),
        };
    }
    computeInterferencePattern(before, after) {
        let constructive = 0;
        let destructive = 0;
        for (let i = 0; i < before.length; i++) {
            const beforeMag = complexMagnitudeSq(before[i].amplitude);
            const afterMag = after[i].quantumWeight;
            if (afterMag > beforeMag)
                constructive++;
            else
                destructive++;
        }
        const total = constructive + destructive || 1;
        return {
            constructive: constructive / total,
            destructive: destructive / total,
            netEffect: (constructive - destructive) / total,
        };
    }
    singleVoteResult(vote) {
        return {
            winner: vote.output,
            confidence: vote.confidence,
            votes: [{
                    output: vote.output,
                    quantumWeight: 1,
                    classicalWeight: 1,
                    modelIds: [vote.modelId],
                }],
            entanglements: [],
            coherence: {
                overall: vote.confidence,
                phaseCoherence: 1,
                amplitudeCoherence: vote.confidence,
                entanglementFidelity: 0,
                decoherenceRate: 1 - vote.confidence,
                effectiveQubits: this.config.numQubits,
                measuredAt: Date.now(),
            },
            interferencePattern: { constructive: 1, destructive: 0, netEffect: 1 },
        };
    }
    defaultSimilarity(a, b) {
        if (typeof a === 'string' && typeof b === 'string') {
            return this.stringSimilarity(a, b);
        }
        return a === b ? 1 : 0;
    }
    stringSimilarity(a, b) {
        if (a === b)
            return 1;
        if (a.length === 0 || b.length === 0)
            return 0;
        // Normalised Levenshtein-like similarity using bigrams
        const bigramsA = this.getBigrams(a.toLowerCase());
        const bigramsB = this.getBigrams(b.toLowerCase());
        let matches = 0;
        const used = new Set();
        for (const bg of bigramsA) {
            for (let j = 0; j < bigramsB.length; j++) {
                if (!used.has(j) && bg === bigramsB[j]) {
                    matches++;
                    used.add(j);
                    break;
                }
            }
        }
        return (2 * matches) / (bigramsA.length + bigramsB.length);
    }
    getBigrams(str) {
        const bigrams = [];
        for (let i = 0; i < str.length - 1; i++) {
            bigrams.push(str.slice(i, i + 2));
        }
        return bigrams;
    }
    seededRng(seed) {
        let s = seed;
        return () => {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            return (s >>> 0) / 0xffffffff;
        };
    }
}
