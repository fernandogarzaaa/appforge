/**
 * Quantum Renormalization Wrapper - System Criticality Prediction
 * Implements RG Flow analysis for detecting phase transitions
 * 
 * Uses Kadanoff Block Spin transformation to detect when systems
 * approach critical points (imminent failure/phase transition).
 */

import * as QuantumCore from '@/quantum-core/pkg/quantum_core';

export interface CriticalityAnalysis {
  criticality: number; // 0-1, 0=stable, 1=critical
  systemHealth: string; // 🟢 Healthy, 🟡 Caution, etc.
  timeToFailure: number; // seconds until critical state
  flowEvolution: number[]; // criticality at each scale
  criticalScale: number; // scale where criticality detected
  timestamp: number;
}

export interface PhaseTransitionDetection {
  criticality: CriticalityAnalysis;
  isApproachingCritical: boolean;
  recommendedAction: string;
  coarseGrainedMetrics: number[]; // Averaged metrics at macro scale
  divergenceRate: number; // How fast approaching criticality
  estimatedCriticalTime: number; // Seconds until phase transition
}

export interface SystemMetrics {
  latencies: number[]; // Request latencies (ms)
  errorRates: number[]; // Error rate percentage
  cpuUsage: number[]; // CPU percentage
  memoryUsage: number[]; // Memory percentage
  throughput: number[]; // Requests per second
}

export class QuantumRenormalizationEngine {
  private scaleFactor: number;
  private analysisHistory: CriticalityAnalysis[] = [];

  constructor(scaleFactor: number = 2) {
    this.scaleFactor = scaleFactor;
  }

  /**
   * Analyze metrics for criticality (phase transition detection)
   */
  analyzeMetrics(metrics: number[]): CriticalityAnalysis {
    const criticality = this.predictCriticality(metrics);
    const systemHealth = this.getSystemHealth(metrics);
    const flowEvolution = this.flowEvolution(metrics);
    const timeToFailure = this.estimateTimeToCriticality(metrics, 1.0);

    // Find scale where criticality detected (simplified since flow_evolution now returns max)
    const criticalScale = flowEvolution > 0.7 ? 1 : 0;

    const analysis: CriticalityAnalysis = {
      criticality,
      systemHealth,
      timeToFailure,
      flowEvolution: [flowEvolution], // Wrap in array for compatibility
      criticalScale,
      timestamp: Date.now(),
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Detect phase transition in system metrics
   */
  detectPhaseTransition(metrics: number[]): PhaseTransitionDetection {
    const criticality = this.analyzeMetrics(metrics);
    const coarseGrainedMetrics = this.coarseGrain(metrics);

    const isApproachingCritical = criticality.criticality > 0.6;
    const divergenceRate = this.calculateDivergenceRate(criticality.flowEvolution);

    const recommendedAction = this.getRecommendedAction(
      criticality.criticality,
      divergenceRate
    );

    return {
      criticality,
      isApproachingCritical,
      recommendedAction,
      coarseGrainedMetrics,
      divergenceRate,
      estimatedCriticalTime: criticality.timeToFailure,
    };
  }

  /**
   * Analyze system performance metrics
   */
  analyzeSystemMetrics(metrics: SystemMetrics): {
    latencyCriticality: CriticalityAnalysis;
    errorCriticality: CriticalityAnalysis;
    resourceCriticality: CriticalityAnalysis;
    overallStatus: string;
    emergencyActions: string[];
  } {
    const latencyCriticality = this.analyzeMetrics(metrics.latencies);
    const errorCriticality = this.analyzeMetrics(metrics.errorRates);

    // Combine resource metrics
    const resourceMetrics = metrics.cpuUsage.map((cpu, idx) => {
      const mem = metrics.memoryUsage[idx] || 0;
      return (cpu + mem) / 2; // Average CPU and memory
    });
    const resourceCriticality = this.analyzeMetrics(resourceMetrics);

    // Overall status
    const avgCriticality =
      (latencyCriticality.criticality +
        errorCriticality.criticality +
        resourceCriticality.criticality) /
      3;

    let overallStatus = '🟢 Healthy';
    if (avgCriticality > 0.8) overallStatus = '💥 CRITICAL';
    else if (avgCriticality > 0.6) overallStatus = '🔴 Danger';
    else if (avgCriticality > 0.4) overallStatus = '🟠 Warning';
    else if (avgCriticality > 0.2) overallStatus = '🟡 Caution';

    // Emergency actions if critical
    const emergencyActions: string[] = [];
    if (latencyCriticality.criticality > 0.7) {
      emergencyActions.push('🚨 Scale up compute resources immediately');
    }
    if (errorCriticality.criticality > 0.7) {
      emergencyActions.push('🚨 Enable error recovery protocols');
    }
    if (resourceCriticality.criticality > 0.7) {
      emergencyActions.push('🚨 Trigger horizontal scaling');
    }

    return {
      latencyCriticality,
      errorCriticality,
      resourceCriticality,
      overallStatus,
      emergencyActions,
    };
  }

  /**
   * Coarse-grain metrics to macro level
   */
  coarseGrainMetrics(metrics: number[]): number[] {
    return this.coarseGrain(metrics);
  }

  /**
   * Get RG flow evolution (max criticality across scales)
   */
  getFlowEvolution(metrics: number[]): number {
    return this.flowEvolution(metrics);
  }

  /**
   * Calculate divergence rate (how fast approaching criticality)
   */
  private calculateDivergenceRate(flowEvolution: number[]): number {
    if (flowEvolution.length < 2) return 0;

    let totalDivergence = 0;
    for (let i = 1; i < flowEvolution.length; i++) {
      totalDivergence += flowEvolution[i] - flowEvolution[i - 1];
    }

    return totalDivergence / (flowEvolution.length - 1);
  }

  /**
   * Get recommended action based on criticality
   */
  private getRecommendedAction(criticality: number, divergenceRate: number): string {
    if (criticality > 0.8) {
      return '💥 EMERGENCY: Immediate intervention required - activate failover';
    }
    if (criticality > 0.6 && divergenceRate > 0.1) {
      return '🚨 URGENT: System approaching critical - scale up resources NOW';
    }
    if (criticality > 0.4) {
      return '🟠 WARNING: Monitor closely - prepare scaling resources';
    }
    if (criticality > 0.2) {
      return '🟡 CAUTION: Minor stress detected - optimize if possible';
    }
    return '🟢 HEALTHY: System operating normally';
  }

  /**
   * Get analysis history
   */
  getHistory(): CriticalityAnalysis[] {
    return [...this.analysisHistory];
  }

  /**
   * Get last N analyses
   */
  getRecentAnalyses(count: number = 20): CriticalityAnalysis[] {
    return this.analysisHistory.slice(-count);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.analysisHistory = [];
  }

  /**
   * Get latest analysis
   */
  getLatest(): CriticalityAnalysis | null {
    return this.analysisHistory[this.analysisHistory.length - 1] || null;
  }

  /**
   * Export metrics for visualization
   */
  exportMetrics() {
    return {
      history: this.analysisHistory,
      summary: {
        totalAnalyses: this.analysisHistory.length,
        averageCriticality:
          this.analysisHistory.length > 0
            ? this.analysisHistory.reduce((sum, a) => sum + a.criticality, 0) /
              this.analysisHistory.length
            : 0,
        maxCriticality:
          this.analysisHistory.length > 0
            ? Math.max(...this.analysisHistory.map((a) => a.criticality))
            : 0,
      },
    };
  }

  /**
   * Predict criticality using Renormalization Group Flow
   * Detects phase transitions through scaling analysis
   * C = 1 / (1 + exp(-scale * (metric_variation - threshold)))
   */
  private predictCriticality(metrics: number[]): number {
    if (metrics.length === 0) return 0;
    
    // Calculate variance as deviation metric
    const mean = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    const variance = metrics.reduce((sum, x) => sum + (x - mean) ** 2, 0) / metrics.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalized deviation (0-1 scale)
    const deviation = Math.min(stdDev, 1);
    
    // RG flow: criticality emerges at scaling transitions
    const scaleFactor = this.scaleFactor;
    const criticalThreshold = 0.5;
    
    // Sigmoid: smooth transition to criticality
    const exponent = scaleFactor * (deviation - criticalThreshold);
    return 1 / (1 + Math.exp(-exponent));
  }

  /**
   * Get system health status based on metrics
   */
  private getSystemHealth(metrics: number[]): string {
    const criticality = this.predictCriticality(metrics);
    
    if (criticality > 0.8) return '💥 CRITICAL';
    if (criticality > 0.6) return '🔴 Danger';
    if (criticality > 0.4) return '🟠 Warning';
    if (criticality > 0.2) return '🟡 Caution';
    return '🟢 Healthy';
  }

  /**
   * Calculate RG flow evolution (criticality at different scales)
   */
  private flowEvolution(metrics: number[]): number {
    // RG flow: apply renormalization group transformation
    // In simplified form: coarse-grain and recalculate criticality
    const coarseGrained = this.coarseGrain(metrics);
    return this.predictCriticality(coarseGrained);
  }

  /**
   * Coarse-grain metrics (Kadanoff transformation)
   * Group nearby metrics and average them
   */
  private coarseGrain(metrics: number[]): number[] {
    if (metrics.length <= 1) return metrics;
    
    const blockSize = Math.ceil(metrics.length / this.scaleFactor);
    const result: number[] = [];
    
    for (let i = 0; i < metrics.length; i += blockSize) {
      const block = metrics.slice(i, i + blockSize);
      const average = block.reduce((a, b) => a + b, 0) / block.length;
      result.push(average);
    }
    
    return result;
  }

  /**
   * Estimate time to criticality
   */
  private estimateTimeToCriticality(
    metrics: number[],
    currentCriticality: number
  ): number {
    const criticalThreshold = 0.95;
    
    if (currentCriticality >= criticalThreshold) {
      return 0; // Already critical
    }
    
    // Estimate based on divergence rate
    const divergenceRate = Math.max(0.01, currentCriticality / 10);
    const timeToReachThreshold = (criticalThreshold - currentCriticality) / divergenceRate;
    
    return Math.max(0, timeToReachThreshold);
  }
}

export const renormalization = new QuantumRenormalizationEngine();
