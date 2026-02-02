/**
 * Quantum Zeno Wrapper - Code Stability Monitoring
 * Implements the Quantum Zeno Effect: "Watched Pot Never Boils"
 * 
 * Frequent observation/testing suppresses code state degradation.
 * Monitors code integrity and recommends testing frequency.
 */

import * as QuantumCore from '@/quantum-core/pkg/quantum_core';

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
  private stabilizer: QuantumCore.ZenoStabilizer;
  private metricsHistory: StabilityMetrics[] = [];
  private lastObservationTime: number = Date.now();

  constructor(coherenceTime: number = 0.5) {
    this.stabilizer = new QuantumCore.ZenoStabilizer(coherenceTime);
  }

  /**
   * Measure current code stability
   */
  measureStability(
    observationFrequency: number,
    timeElapsed: number
  ): StabilityMetrics {
    const stability = this.stabilizer.calculate_stability(
      observationFrequency,
      timeElapsed
    );

    const isFrozen = this.stabilizer.is_state_frozen(stability);
    const freezeDepth = this.stabilizer.calculate_freeze_depth(
      observationFrequency,
      timeElapsed
    );

    const status = this.getStatus(stability);
    const recommendation = this.stabilizer.get_observation_recommendation(stability);

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

    const requiredTestFrequency = this.stabilizer.required_observation_frequency(
      86400.0, // 24 hours
      targetStability
    );

    const degradationTimeline = this.stabilizer.degradation_timeline(100);
    const averageDegradation =
      degradationTimeline.reduce((a, b) => a + b, 0) / degradationTimeline.length;

    return {
      metrics,
      degradationRate: averageDegradation,
      requiredTestFrequency,
      estimatedTimeToFailure: this.estimateTimeToFailure(
        stability,
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
    return this.stabilizer.required_observation_frequency(timePeriod, desiredStability);
  }

  /**
   * Check if current code state is frozen (Zeno Effect active)
   */
  isCodeFrozen(stability: number): boolean {
    return this.stabilizer.is_state_frozen(stability);
  }

  /**
   * Get degradation timeline without testing
   */
  getDegradationTimeline(points: number = 100): number[] {
    return this.stabilizer.degradation_timeline(points);
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
}

export const zeno = new QuantumZenoMonitor();
