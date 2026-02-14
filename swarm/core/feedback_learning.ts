/**
 * 🔄 FEEDBACK LEARNING ENGINE
 * 
 * Self-improving decision system with exponential backoff weight updates
 * Features:
 * - Real-time feedback integration
 * - Exponential weight adjustment
 * - Coherence-based validation
 * - Adaptive learning rate
 */

import { EventEmitter } from 'events';
import { secureRandom, secureRandomRange } from './secure_entropy.js';

// ============================================================================
// TYPES
// ============================================================================

interface DecisionContext {
    id: string;
    timestamp: number;
    decisionType: string;
    inputFeatures: Record<string, number>;
    metadata?: Record<string, any>;
}

interface Decision {
    id: string;
    contextId: string;
    choice: string;
    confidence: number;
    reasoning: string[];
    quantumState: QuantumState;
    timestamp: number;
}

interface Feedback {
    decisionId: string;
    outcome: 'success' | 'failure' | 'partial' | 'unknown';
    reward: number; // -1 to 1
    details?: string;
    timestamp: number;
}

interface LearnedPattern {
    patternId: string;
    decisionType: string;
    featureWeights: Record<string, number>;
    threshold: number;
    successRate: number;
    sampleCount: number;
    lastUpdated: number;
}

interface LearningConfig {
    initialLearningRate: number;
    minLearningRate: number;
    decayFactor: number;
    momentum: number;
    coherenceThreshold: number;
    maxPatterns: number;
    patternRetentionThreshold: number;
}

interface QuantumState {
    coherence: number;
    superposition: number;
    entanglement: number;
}

// ============================================================================
// FEEDBACK LEARNING ENGINE
// ============================================================================

export class FeedbackLearningEngine extends EventEmitter {
    private patterns: Map<string, LearnedPattern> = new Map();
    private decisionHistory: Decision[] = [];
    private feedbackHistory: Feedback[] = [];
    private weightGradients: Map<string, Record<string, number>> = new Map();
    private config: LearningConfig;
    private globalCoherence: number = 0.95;
    private learningCount: number = 0;
    private successCount: number = 0;

    constructor(config?: Partial<LearningConfig>) {
        super();
        this.config = {
            initialLearningRate: config?.initialLearningRate ?? 0.1,
            minLearningRate: config?.minLearningRate ?? 0.01,
            decayFactor: config?.decayFactor ?? 0.99,
            momentum: config?.momentum ?? 0.9,
            coherenceThreshold: config?.coherenceThreshold ?? 0.85,
            maxPatterns: config?.maxPatterns ?? 1000,
            patternRetentionThreshold: config?.patternRetentionThreshold ?? 0.5
        };
        
        // Start coherence monitoring
        this.startCoherenceMonitor();
    }

    // ============================================================================
    // COHERENCE MONITORING
    // ============================================================================

    /**
     * Start continuous coherence monitoring
     */
    private startCoherenceMonitor(): void {
        setInterval(async () => {
            await this.updateGlobalCoherence();
        }, 1000);
    }

    /**
     * Update global coherence based on recent outcomes
     */
    private async updateGlobalCoherence(): Promise<void> {
        const recentFeedback = this.feedbackHistory.slice(-100);
        
        if (recentFeedback.length > 0) {
            const avgReward = recentFeedback.reduce((sum, f) => sum + f.reward, 0) / recentFeedback.length;
            const successRate = recentFeedback.filter(f => f.outcome === 'success').length / recentFeedback.length;
            
            // Coherence = weighted average of success rate and average reward
            const targetCoherence = 0.7 * successRate + 0.3 * (0.5 + 0.5 * avgReward);
            
            // Exponential smoothing
            this.globalCoherence = 0.95 * this.globalCoherence + 0.05 * targetCoherence;
        }
        
        this.emit('coherenceUpdated', { coherence: this.globalCoherence });
    }

    /**
     * Get current learning coherence
     */
    getCoherence(): number {
        return this.globalCoherence;
    }

    // ============================================================================
    // DECISION LEARNING
    // ============================================================================

    /**
     * Learn from a decision and its feedback
     */
    async learn(decision: Decision, feedback: Feedback): Promise<LearnedPattern> {
        const patternId = this.getPatternId(decision.decisionType, decision.contextId);
        
        // Get or create pattern
        let pattern = this.patterns.get(patternId);
        if (!pattern) {
            pattern = this.createPattern(decision.decisionType);
        }
        
        // Calculate learning rate with exponential decay
        const learningRate = this.calculateLearningRate(pattern);
        
        // Calculate gradient from feedback
        const gradient = this.calculateGradient(decision, feedback);
        
        // Apply momentum
        const momentumGradient = this.applyMomentum(patternId, gradient);
        
        // Update pattern weights
        pattern.featureWeights = this.updateWeights(
            pattern.featureWeights,
            momentumGradient,
            learningRate
        );
        
        // Update pattern statistics
        this.updatePatternStats(pattern, feedback);
        
        // Store pattern
        this.patterns.set(patternId, pattern);
        
        // Record feedback
        this.feedbackHistory.push(feedback);
        
        // Trim history if needed
        this.trimHistories();
        
        // Emit learning event
        this.emit('learned', { patternId, pattern, feedback });
        
        // Check if coherence improved
        if (feedback.outcome === 'success') {
            this.successCount++;
        }
        this.learningCount++;
        
        return pattern;
    }

    /**
     * Create a new pattern
     */
    private createPattern(decisionType: string): LearnedPattern {
        const patternId = `${decisionType}_${Date.now()}`;
        
        return {
            patternId,
            decisionType,
            featureWeights: {},
            threshold: 0.5,
            successRate: 1.0,
            sampleCount: 0,
            lastUpdated: Date.now()
        };
    }

    /**
     * Calculate learning rate with exponential decay
     */
    private calculateLearningRate(pattern: LearnedPattern): number {
        // Exponential decay based on sample count
        const decay = Math.pow(this.config.decayFactor, pattern.sampleCount);
        const learningRate = this.config.initialLearningRate * decay;
        
        // Ensure minimum learning rate
        return Math.max(this.config.minLearningRate, learningRate);
    }

    /**
     * Calculate gradient from feedback
     */
    private calculateGradient(decision: Decision, feedback: Feedback): Record<string, number> {
        const gradient: Record<string, number> = {};
        
        // Scale feedback by confidence
        const scaledReward = feedback.reward * decision.confidence;
        
        // Calculate gradient for each feature
        for (const [feature, value] of Object.entries(decision.inputFeatures)) {
            // Gradient = reward * feature_value
            gradient[feature] = scaledReward * value;
        }
        
        return gradient;
    }

    /**
     * Apply momentum to gradient
     */
    private applyMomentum(patternId: string, gradient: Record<string, number>): Record<string, number> {
        const momentumGradients = this.weightGradients.get(patternId) || {};
        const newGradients: Record<string, number> = {};
        
        for (const [feature, grad] of Object.entries(gradient)) {
            const momentum = momentumGradients[feature] || 0;
            newGradients[feature] = this.config.momentum * momentum + (1 - this.config.momentum) * grad;
        }
        
        this.weightGradients.set(patternId, newGradients);
        
        return newGradients;
    }

    /**
     * Update weights with gradient
     */
    private updateWeights(
        weights: Record<string, number>,
        gradient: Record<string, number>,
        learningRate: number
    ): Record<string, number> {
        const newWeights = { ...weights };
        
        for (const [feature, grad] of Object.entries(gradient)) {
            newWeights[feature] = (weights[feature] || 0) + learningRate * grad;
        }
        
        return newWeights;
    }

    /**
     * Update pattern statistics
     */
    private updatePatternStats(pattern: LearnedPattern, feedback: Feedback): void {
        pattern.sampleCount++;
        pattern.lastUpdated = Date.now();
        
        // Update success rate with exponential moving average
        const successValue = feedback.outcome === 'success' ? 1 : 
                            feedback.outcome === 'partial' ? 0.5 : 0;
        pattern.successRate = 0.9 * pattern.successRate + 0.1 * successValue;
        
        // Adjust threshold based on feedback
        if (feedback.outcome === 'failure' && pattern.threshold > 0.3) {
            pattern.threshold -= 0.01;
        } else if (feedback.outcome === 'success' && pattern.threshold < 0.7) {
            pattern.threshold += 0.005;
        }
    }

    /**
     * Get pattern ID
     */
    private getPatternId(decisionType: string, contextId: string): string {
        // Extract base pattern from context
        return `${decisionType}_base`;
    }

    // ============================================================================
    // DECISION PREDICTION
    // ============================================================================

    /**
     * Predict optimal choice based on current context
     */
    async predict(context: DecisionContext): Promise<Decision> {
        const pattern = this.getPatternForType(context.decisionType);
        
        // Calculate feature scores
        const scores = this.calculateFeatureScores(context.inputFeatures, pattern?.featureWeights || {});
        
        // Generate choices with quantum superposition
        const choices = this.generateSuperpositionChoices(scores, context);
        
        // Collapse to best choice
        const selectedChoice = this.collapseChoice(choices);
        
        // Calculate confidence
        const confidence = this.calculateConfidence(scores, pattern);
        
        // Generate reasoning
        const reasoning = this.generateReasoning(scores, context);
        
        const decision: Decision = {
            id: `dec_${Date.now()}_${secureRandomRange(0, 10000)}`,
            contextId: context.id,
            choice: selectedChoice.choice,
            confidence,
            reasoning,
            quantumState: {
                coherence: this.globalCoherence,
                superposition: scores.length,
                entanglement: this.detectEntanglement(scores)
            },
            timestamp: Date.now()
        };
        
        this.decisionHistory.push(decision);
        
        return decision;
    }

    /**
     * Get pattern for decision type
     */
    private getPatternForType(decisionType: string): LearnedPattern | null {
        const patterns = Array.from(this.patterns.values())
            .filter(p => p.decisionType === decisionType)
            .sort((a, b) => b.sampleCount - a.sampleCount);
        
        return patterns[0] || null;
    }

    /**
     * Calculate feature scores
     */
    private calculateFeatureScores(
        features: Record<string, number>,
        weights: Record<string, number>
    ): Map<string, number> {
        const scores = new Map<string, number>();
        
        for (const [feature, value] of Object.entries(features)) {
            const weight = weights[feature] || 0;
            scores.set(feature, value * (1 + weight));
        }
        
        return scores;
    }

    /**
     * Generate superposition of choices
     */
    private generateSuperpositionChoices(
        scores: Map<string, number>,
        context: DecisionContext
    ): { choice: string; amplitude: number; score: number }[] {
        const choices: { choice: string; amplitude: number; score: number }[] = [];
        
        // Generate possible choices based on scores
        const sortedFeatures = Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1]);
        
        // Top 3 features become candidate choices
        for (let i = 0; i < Math.min(3, sortedFeatures.length); i++) {
            const [feature, score] = sortedFeatures[i];
            choices.push({
                choice: feature,
                amplitude: score * this.globalCoherence,
                score
            });
        }
        
        // Normalize amplitudes
        const totalAmplitude = choices.reduce((sum, c) => sum + c.amplitude, 0);
        choices.forEach(c => c.amplitude /= totalAmplitude);
        
        return choices;
    }

    /**
     * Collapse superposition to single choice
     */
    private collapseChoice(
        choices: { choice: string; amplitude: number; score: number }[]
    ): { choice: string; score: number } {
        // Probabilistic selection based on amplitude
        const random = secureRandom();
        let cumulative = 0;
        
        for (const choice of choices) {
            cumulative += choice.amplitude;
            if (random < cumulative) {
                return { choice: choice.choice, score: choice.score };
            }
        }
        
        // Fallback to highest score
        return { choice: choices[0].choice, score: choices[0].score };
    }

    /**
     * Calculate confidence level
     */
    private calculateConfidence(
        scores: Map<string, number>,
        pattern: LearnedPattern | null
    ): number {
        // Base confidence on coherence
        let confidence = this.globalCoherence;
        
        // Increase if pattern has high success rate
        if (pattern) {
            confidence = 0.7 * confidence + 0.3 * pattern.successRate;
        }
        
        // Adjust based on score variance
        const scoreValues = Array.from(scores.values());
        const mean = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
        const variance = scoreValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / scoreValues.length;
        
        // Lower variance = higher confidence
        confidence *= (1 - Math.min(variance, 0.5));
        
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Generate reasoning for decision
     */
    private generateReasoning(
        scores: Map<string, number>,
        context: DecisionContext
    ): string[] {
        const reasoning: string[] = [];
        
        reasoning.push(`Based on ${scores.size} input features`);
        
        const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
        
        for (let i = 0; i < Math.min(3, sorted.length); i++) {
            const [feature, score] = sorted[i];
            reasoning.push(`Primary factor: ${feature} (score: ${score.toFixed(3)})`);
        }
        
        reasoning.push(`Coherence level: ${(this.globalCoherence * 100).toFixed(1)}%`);
        
        return reasoning;
    }

    /**
     * Detect entanglement between features
     */
    private detectEntanglement(scores: Map<string, number>): number {
        // Simplified entanglement detection
        const values = Array.from(scores.values());
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        
        // Entanglement proportional to variance
        return Math.min(1, variance * 2);
    }

    // ============================================================================
    // PATTERN MANAGEMENT
    // ============================================================================

    /**
     * Get all patterns
     */
    getPatterns(): LearnedPattern[] {
        return Array.from(this.patterns.values());
    }

    /**
     * Get patterns by decision type
     */
    getPatternsByType(decisionType: string): LearnedPattern[] {
        return Array.from(this.patterns.values())
            .filter(p => p.decisionType === decisionType);
    }

    /**
     * Prune low-performing patterns
     */
    prunePatterns(): number {
        const beforeCount = this.patterns.size;
        
        for (const [patternId, pattern] of this.patterns) {
            if (pattern.successRate < this.config.patternRetentionThreshold && 
                pattern.sampleCount > 10) {
                this.patterns.delete(patternId);
            }
        }
        
        const prunedCount = beforeCount - this.patterns.size;
        
        if (prunedCount > 0) {
            this.emit('patternsPruned', { count: prunedCount });
        }
        
        return prunedCount;
    }

    /**
     * Trim histories to prevent memory bloat
     */
    private trimHistories(): void {
        const maxHistory = 10000;
        
        if (this.decisionHistory.length > maxHistory) {
            this.decisionHistory = this.decisionHistory.slice(-maxHistory);
        }
        
        if (this.feedbackHistory.length > maxHistory) {
            this.feedbackHistory = this.feedbackHistory.slice(-maxHistory);
        }
    }

    // ============================================================================
    // STATISTICS
    // ============================================================================

    /**
     * Get learning statistics
     */
    getStats(): {
        patternCount: number;
        totalDecisions: number;
        totalFeedback: number;
        successRate: number;
        coherence: number;
        learningRate: number;
    } {
        return {
            patternCount: this.patterns.size,
            totalDecisions: this.decisionHistory.length,
            totalFeedback: this.feedbackHistory.length,
            successRate: this.learningCount > 0 ? this.successCount / this.learningCount : 0,
            coherence: this.globalCoherence,
            learningRate: this.config.initialLearningRate * 
                         Math.pow(this.config.decayFactor, this.learningCount)
        };
    }

    /**
     * Export learned patterns
     */
    exportPatterns(): string {
        return JSON.stringify({
            patterns: Array.from(this.patterns.values()),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Import learned patterns
     */
    importPatterns(data: string): void {
        const parsed = JSON.parse(data);
        for (const pattern of parsed.patterns) {
            this.patterns.set(pattern.patternId, pattern);
        }
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const feedbackLearningEngine = new FeedbackLearningEngine();
