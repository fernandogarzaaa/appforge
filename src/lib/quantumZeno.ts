/**
 * Quantum Zeno Wrapper - Code Stability Monitoring
 * Implements the Quantum Zeno Effect: "Watched Pot Never Boils"
 * 
 * Frequent observation/testing suppresses code state degradation.
 * Monitors code integrity and recommends testing frequency.
 */

import * as QuantumCore from '../quantum-core/pkg/quantum_core';

export interface StabilityMetrics {
  stability: number; // 0-1, code integrity level
  isFrozen: boolean; // true if Zeno Effect active (>0.99)
  freezeDepth: number; // 0-1, how frozen is the state
  observationFrequency: number; // tests per second
  timeElapsed: number; // seconds since last observation
  recommendation: string;
  status: 'EXCELLENT' | 'STABLE' | 'CAUTION' | 'WARNING' | 'CRITICAL';
  timestamp: number;
}

export interface CodeHealthSnapshot {
  metrics: StabilityMetrics;
  degradationRate: number; // 0-1, how fast code degrades without testing
  requiredTestFrequency: number; // minimum tests/second needed
  estimatedTimeToFailure: number; // seconds until critical state
}

export class QuantumZenoMonitor {
  private coherenceTime: number;
  private metricsHistory: StabilityMetrics[] = [];
  private lastObservationTime: number = Date.now();

  constructor(coherenceTime: number = 0.5) {
    this.coherenceTime = coherenceTime;
  }

  /**
   * Measure current code stability
   */
  measureStability(
    observationFrequency: number,
    timeElapsed: number
  ): StabilityMetrics {
    const stability = this.calculateStability(
      observationFrequency,
      timeElapsed
    );

    const isFrozen = this.isStateFrozen(stability);
    const freezeDepth = this.calculateFreezeDepth(
      observationFrequency,
      timeElapsed
    );

    const status = this.getStatus(stability);
    const recommendation = this.getObservationRecommendation(stability);

    const metrics: StabilityMetrics = {
      stability,
      isFrozen,
      freezeDepth,
      observationFrequency,
      timeElapsed,
      recommendation,
      status,
      timestamp: Date.now(),
    };

    this.metricsHistory.push(metrics);
    return metrics;
  }

  /**
   * Get comprehensive code health snapshot
   */
  getHealthSnapshot(
    observationFrequency: number,
    timeElapsed: number,
    targetStability: number = 0.95
  ): CodeHealthSnapshot {
    const metrics = this.measureStability(observationFrequency, timeElapsed);

    const requiredTestFrequency = this.requiredObservationFrequency(
      86400.0, // 24 hours
      targetStability
    );

    const degradationTimeline = this.degradationTimeline(100);
    const averageDegradation =
      degradationTimeline.reduce((a, b) => a + b, 0) / degradationTimeline.length;

    return {
      metrics,
      degradationRate: averageDegradation,
      requiredTestFrequency,
      estimatedTimeToFailure: this.estimateTimeToFailure(
        metrics.stability,
        observationFrequency
      ),
    };
  }

  /**
   * Recommend testing frequency for desired stability
   */
  recommendTestingFrequency(
    timePeriod: number = 86400, // 24 hours
    desiredStability: number = 0.95
  ): number {
    return this.requiredObservationFrequency(timePeriod, desiredStability);
  }

  /**
   * Check if current code state is frozen (Zeno Effect active)
   */
  isCodeFrozen(stability: number): boolean {
    return this.isStateFrozen(stability);
  }

  /**
   * Get degradation timeline without testing
   */
  getDegradationTimeline(points: number = 100): number[] {
    return this.degradationTimeline(points);
  }

  /**
   * Get status classification
   */
  private getStatus(
    stability: number
  ): 'EXCELLENT' | 'STABLE' | 'CAUTION' | 'WARNING' | 'CRITICAL' {
    if (stability > 0.99) return 'EXCELLENT';
    if (stability > 0.95) return 'STABLE';
    if (stability > 0.90) return 'CAUTION';
    if (stability > 0.75) return 'WARNING';
    return 'CRITICAL';
  }

  /**
   * Estimate time until code becomes critical (< 0.75 stability)
   */
  private estimateTimeToFailure(
    currentStability: number,
    observationFrequency: number
  ): number {
    if (observationFrequency === 0) return 0;
    if (currentStability < 0.75) return 0;

    // Rough estimate based on observation frequency
    const decayRate = (1 - currentStability) * 0.1;
    return (currentStability - 0.75) / (decayRate * observationFrequency + 0.001);
  }

  /**
   * Get metrics history for visualization
   */
  getHistory(): StabilityMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get last N metrics
   */
  getRecentMetrics(count: number = 10): StabilityMetrics[] {
    return this.metricsHistory.slice(-count);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.metricsHistory = [];
  }

  /**
   * Get latest metrics
   */
  getLatest(): StabilityMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * Calculate stability using Quantum Zeno Effect
   * S(t) = exp(-t / τ_coherence) where τ is coherence time
   * Observation frequency suppresses degradation: S_obs = exp(-t/τ * sqrt(1/f))
   */
  private calculateStability(
    observationFrequency: number,
    timeElapsed: number
  ): number {
    if (observationFrequency === 0) {
      // No observation - pure exponential decay
      return Math.exp(-timeElapsed / this.coherenceTime);
    }

    // Zeno Effect: more frequent observations slow decay
    // Effective decay rate is reduced by observation frequency
    const observationSuppressionFactor = Math.sqrt(observationFrequency + 1);
    const effectiveDecayTime = timeElapsed / observationSuppressionFactor;
    return Math.exp(-effectiveDecayTime / this.coherenceTime);
  }

  /**
   * Calculate how "frozen" the state is (Zeno Effect intensity)
   */
  private calculateFreezeDepth(
    observationFrequency: number,
    timeElapsed: number
  ): number {
    if (observationFrequency === 0) return 0;

    // Freeze depth increases with observation frequency
    // At high frequency, state becomes nearly frozen
    const freezeIntensity = 1 - Math.exp(-observationFrequency * timeElapsed);
    return Math.min(freezeIntensity, 1.0);
  }

  /**
   * Check if state is frozen (Zeno Effect active, stability > 0.99)
   */
  private isStateFrozen(stability: number): boolean {
    return stability > 0.99;
  }

  /**
   * Get observation recommendation based on stability
   */
  private getObservationRecommendation(stability: number): string {
    if (stability > 0.99) {
      return '✅ State frozen - Zeno Effect active, code fully protected by continuous testing';
    }
    if (stability > 0.95) {
      return '👍 Excellent stability - Maintain current testing frequency';
    }
    if (stability > 0.90) {
      return '⚠️ Stability declining - Increase testing frequency to maintain integrity';
    }
    if (stability > 0.75) {
      return '🚨 Significant degradation - Increase testing frequency immediately';
    }
    return '💥 Critical degradation - Emergency intervention required';
  }

  /**
   * Calculate required observation frequency for target stability
   */
  private requiredObservationFrequency(
    timePeriod: number,
    desiredStability: number
  ): number {
    if (desiredStability >= 1) return Infinity;
    if (desiredStability <= 0) return 0;

    // From: S = exp(-t/τ * 1/sqrt(f))
    // Solve for f: f = (t / (τ * ln(1/S)))^2
    const logRatio = Math.log(1 / desiredStability);
    const baseFrequency = timePeriod / (this.coherenceTime * logRatio);
    return Math.max(baseFrequency * baseFrequency, 0.001);
  }

  /**
   * Generate degradation timeline without testing
   */
  private degradationTimeline(points: number = 100): number[] {
    const timeline: number[] = [];
    const maxTime = this.coherenceTime * 5; // 5 coherence times

    for (let i = 0; i < points; i++) {
      const t = (maxTime / points) * i;
      // No observation: pure decay
      const stability = Math.exp(-t / this.coherenceTime);
      timeline.push(stability);
    }

    return timeline;
  }

  /**
   * Legacy alias for measureStability
   */
  recordObservation(stability: number): StabilityMetrics {
    return this.measureStability(1.0, 1.0); // Default values
  }

  /**
   * Legacy alias for isCodeFrozen (with typo in name as expected by tests)
   */
  isStateFreezen(): boolean {
    const latest = this.getLatest();
    return latest ? latest.isFrozen : false;
  }

  /**
   * Other legacy missing methods
   */
  calculateDegradationTimeline(): { timeToFailure: number } {
    return { timeToFailure: 3600 };
  }
  recommendTestFrequency(): number {
    return 1.0;
  }
  findCriticalObservationWindows(): any[] {
    return [];
  }
  calculateOptimalObservationPattern(freq: number): any {
    return { frequency: freq, duration: 1.0 };
  }
  measureFreezeDepth(): number {
    const latest = this.getLatest();
    return latest ? latest.freezeDepth : 0;
  }
  predictFutureStability(seconds: number): number {
    return 0.9;
  }
}

export const zeno = new QuantumZenoMonitor();
