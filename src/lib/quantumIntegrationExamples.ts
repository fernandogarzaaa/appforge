/**
 * Quantum Integration Examples
 * Demonstrates how to use all three quantum modules in real applications
 */

import { tunneling } from '@/lib/quantumTunneling';
import { zeno } from '@/lib/quantumZeno';
import { renormalization } from '@/lib/quantumRenormalization';
import {
  executeSecurityAnalysis,
  executeStabilityMonitoring,
  detectCriticality,
  executeFullQuantumAnalysis,
} from '@/lib/aiRouter';

// ============================================
// EXAMPLE 1: Security Analysis
// ============================================

export async function securityAudit() {
  console.log('🔐 Starting Security Audit...');

  // Analyze multiple security assets
  const assets = [
    { name: 'API Gateway', barrier: 0.9, estimatedAttackLevel: 0.2 },
    { name: 'Database', barrier: 0.85, estimatedAttackLevel: 0.4 },
    { name: 'Auth Service', barrier: 0.95, estimatedAttackLevel: 0.1 },
    { name: 'File Storage', barrier: 0.7, estimatedAttackLevel: 0.5 },
  ];

  const results = assets.map((asset) => {
    const analysis = tunneling.analyzeBreach(asset);
    console.log(`${asset.name}: ${analysis.recommendation}`);
    return analysis;
  });

  // Find weakest link
  const weakest = results.reduce((prev, curr) =>
    curr.breachProbability > prev.breachProbability ? curr : prev
  );

  console.log(
    `\n⚠️ WEAKEST SECURITY: ${weakest.barrierStrength} barrier, ${(weakest.breachProbability * 100).toFixed(2)}% breach probability`
  );

  return { assets: results, weakest };
}

// ============================================
// EXAMPLE 2: Code Quality Monitoring
// ============================================

export async function codeQualityCheck() {
  console.log('📊 Code Quality Check Started...');

  // Measure code stability over different time periods
  const timePoints = [60, 300, 900, 3600]; // 1m, 5m, 15m, 1h
  const testFrequency = 5.0; // 5 tests per second

  const metrics = timePoints.map((time) => {
    const stability = zeno.measureStability(testFrequency, time);
    console.log(
      `After ${time}s: ${stability.status} (${(stability.stability * 100).toFixed(1)}% integrity)`
    );
    return stability;
  });

  // Get recommended testing frequency for 24 hours
  const dailyFrequency = zeno.recommendTestingFrequency();
  console.log(
    `\n✅ Recommended: ${dailyFrequency.toFixed(1)} tests per second to maintain 95% stability over 24 hours`
  );

  return metrics;
}

// ============================================
// EXAMPLE 3: System Health Monitoring
// ============================================

export async function systemHealthMonitoring() {
  console.log('🌊 System Health Monitoring...');

  // Simulated system metrics over time
  const latencyMetrics = [10, 12, 15, 18, 22, 26, 31, 38, 45, 55];
  const errorRateMetrics = [0.1, 0.15, 0.2, 0.3, 0.5, 0.8, 1.2, 1.8, 2.5, 3.5];
  const cpuMetrics = [30, 35, 40, 50, 60, 70, 80, 85, 90, 95];

  // Analyze latency
  const latencyCriticality = renormalization.analyzeMetrics(latencyMetrics);
  console.log(
    `📈 Latency: ${latencyCriticality.systemHealth} (${(latencyCriticality.criticality * 100).toFixed(1)}% critical)`
  );

  // Analyze error rate
  const errorCriticality = renormalization.analyzeMetrics(errorRateMetrics);
  console.log(
    `📊 Error Rate: ${errorCriticality.systemHealth} (${(errorCriticality.criticality * 100).toFixed(1)}% critical)`
  );

  // Analyze CPU
  const cpuCriticality = renormalization.analyzeMetrics(cpuMetrics);
  console.log(
    `💻 CPU: ${cpuCriticality.systemHealth} (${(cpuCriticality.criticality * 100).toFixed(1)}% critical)`
  );

  // Get time to failure
  if (latencyCriticality.timeToFailure > 0) {
    console.log(`\n⏰ Estimated time to failure: ${latencyCriticality.timeToFailure.toFixed(0)} seconds`);
  }

  return {
    latency: latencyCriticality,
    errors: errorCriticality,
    cpu: cpuCriticality,
  };
}

// ============================================
// EXAMPLE 4: Real-time Monitoring Loop
// ============================================

export function startRealtimeMonitoring(
  interval = 5000 // Check every 5 seconds
) {
  console.log('🚀 Starting real-time monitoring...');

  const monitoringLoop = setInterval(async () => {
    // Simulate incoming metrics
    const currentLatency = Math.random() * 50 + 10;
    const currentErrorRate = Math.random() * 5;
    const currentCPU = Math.random() * 100;

    // Run quantum analysis
    const analysis = await executeFullQuantumAnalysis({
      securityAsset: {
        name: 'Runtime API',
        barrier: 0.8,
        estimatedAttackLevel: 0.3,
      },
      stabilityMetrics: {
        observationFreq: 5.0,
        timeElapsed: 3600.0,
      },
      systemMetrics: [currentLatency, currentErrorRate, currentCPU],
    });

    // Log results
    console.log(`\n⏱️ Monitoring Timestamp: ${new Date().toLocaleTimeString()}`);
    if (analysis.security) {
      console.log(
        `🔐 Security: ${(analysis.security.breachProbability * 100).toFixed(3)}% breach risk`
      );
    }
    if (analysis.stability) {
      console.log(
        `📊 Stability: ${(analysis.stability.stability * 100).toFixed(1)}% code integrity`
      );
    }
    if (analysis.criticality) {
      console.log(
        `🌊 Criticality: ${analysis.criticality.systemHealth} (${(analysis.criticality.criticality * 100).toFixed(1)}%)`
      );
    }
  }, interval);

  return monitoringLoop;
}

// ============================================
// EXAMPLE 5: Dashboard Data Collection
// ============================================

export function collectDashboardMetrics() {
  return {
    security: tunneling.getLatest(),
    stability: zeno.getLatest(),
    criticality: renormalization.getLatest(),
    securityHistory: tunneling.getHistory(),
    stabilityHistory: zeno.getRecentMetrics(50),
    criticalityHistory: renormalization.getRecentAnalyses(50),
    timestamp: Date.now(),
  };
}

// ============================================
// EXAMPLE 6: Alert Generation
// ============================================

export function generateAlerts() {
  const alerts = [];

  // Security alerts
  const securityMetrics = tunneling.getLatest();
  if (securityMetrics && securityMetrics.riskLevel !== 'LOW') {
    alerts.push({
      type: 'SECURITY',
      severity: securityMetrics.riskLevel,
      message: securityMetrics.recommendation,
      timestamp: securityMetrics.timestamp,
    });
  }

  // Stability alerts
  const stabilityMetrics = zeno.getLatest();
  if (stabilityMetrics && stabilityMetrics.status === 'CRITICAL') {
    alerts.push({
      type: 'STABILITY',
      severity: 'CRITICAL',
      message: `Code integrity below 75%: ${stabilityMetrics.recommendation}`,
      timestamp: stabilityMetrics.timestamp,
    });
  }

  // Criticality alerts
  const criticalityMetrics = renormalization.getLatest();
  if (criticalityMetrics && criticalityMetrics.criticality > 0.7) {
    alerts.push({
      type: 'SYSTEM',
      severity: 'CRITICAL',
      message: `System approaching phase transition: ${criticalityMetrics.systemHealth}`,
      timestamp: criticalityMetrics.timestamp,
    });
  }

  return alerts;
}

// ============================================
// EXAMPLE 7: Performance Report
// ============================================

export function generatePerformanceReport() {
  const securityData = tunneling.exportMetrics();
  const stabilityData = zeno.getHistory();
  const criticalityData = renormalization.exportMetrics();

  return {
    report: {
      generatedAt: new Date().toISOString(),
      period: '24 hours',
      metrics: {
        security: {
          analysesRun: securityData.history?.length || 0,
          averageBreach: securityData.history?.reduce((sum, m) => sum + m.breachProbability, 0) / (securityData.history?.length || 1),
          criticalIncidents: securityData.history?.filter((m) => m.riskLevel === 'CRITICAL').length || 0,
        },
        stability: {
          measurementsRun: stabilityData.length,
          averageStability: stabilityData.length > 0 ? stabilityData.reduce((sum, m) => sum + m.stability, 0) / stabilityData.length : 0,
          timesFrozen: stabilityData.filter((m) => m.isFrozen).length,
        },
        criticality: {
          analysesRun: criticalityData.summary?.totalAnalyses || 0,
          averageCriticality: criticalityData.summary?.averageCriticality || 0,
          maxCriticality: criticalityData.summary?.maxCriticality || 0,
        },
      },
    },
  };
}

// ============================================
// Export all utilities
// ============================================

export const QuantumExamples = {
  securityAudit,
  codeQualityCheck,
  systemHealthMonitoring,
  startRealtimeMonitoring,
  collectDashboardMetrics,
  generateAlerts,
  generatePerformanceReport,
};
