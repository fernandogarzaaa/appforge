/**
 * Quantum Integration Import Reference
 * Copy-paste these imports to get started quickly
 */

import React from 'react';

// ============================================
// CORE QUANTUM MODULES
// ============================================

// Import all three quantum engines directly
import { tunneling } from '@/lib/quantumTunneling';
import { zeno } from '@/lib/quantumZeno';
import { renormalization } from '@/lib/quantumRenormalization';

// Import TypeScript classes for custom instances
import { QuantumTunnelingAnalyzer } from '@/lib/quantumTunneling';
import { QuantumZenoMonitor } from '@/lib/quantumZeno';
import { QuantumRenormalizationEngine } from '@/lib/quantumRenormalization';

// ============================================
// AI ROUTER FUNCTIONS
// ============================================

// Import high-level functions from aiRouter
import { 
  executeSecurityAnalysis,
  executeStabilityMonitoring,
  detectCriticality,
  executeFullQuantumAnalysis
} from '@/lib/aiRouter';

// Import all three modules from aiRouter (same as direct imports above)
import { tunneling as t, zeno as z, renormalization as r } from '@/lib/aiRouter';

// ============================================
// COMPONENT IMPORTS
// ============================================

// Import the dashboard component
import { QuantumMetricsDashboard } from '@/components/quantum/QuantumMetricsDashboard';

// ============================================
// EXAMPLES IMPORT
// ============================================

// Import ready-to-use patterns
import { QuantumExamples } from '@/lib/quantumIntegrationExamples';

// ============================================
// QUICK START EXAMPLES
// ============================================

// Example 1: Analyze security
async function checkSecurity() {
  const analysis = await executeSecurityAnalysis({
    name: 'API Gateway',
    barrier: 0.8,
    estimatedAttackLevel: 0.3
  });
  console.log(analysis);
}

// Example 2: Check code stability
async function checkStability() {
  const metrics = await executeStabilityMonitoring(5.0, 3600.0);
  console.log(metrics);
}

// Example 3: Detect system criticality
async function checkSystem() {
  const criticality = await detectCriticality([10, 15, 12, 18, 20]);
  console.log(criticality);
}

// Example 4: Run all three at once
async function fullAnalysis() {
  const results = await executeFullQuantumAnalysis({
    securityAsset: { name: 'API', barrier: 0.8, estimatedAttackLevel: 0.3 },
    stabilityMetrics: { observationFreq: 5.0, timeElapsed: 3600.0 },
    systemMetrics: [10, 15, 12]
  });
  console.log(results);
}

// Example 5: Get latest metrics
function getMetrics() {
  return {
    security: tunneling.getLatest(),
    stability: zeno.getLatest(),
    criticality: renormalization.getLatest()
  };
}

// Example 6: Use dashboard
function renderDashboard() {
  return React.createElement(QuantumMetricsDashboard);
}

// Example 7: Run ready-to-use examples
async function runExamples() {
  const audit = await QuantumExamples.securityAudit();
  const quality = await QuantumExamples.codeQualityCheck();
  const health = await QuantumExamples.systemHealthMonitoring();
  const alerts = QuantumExamples.generateAlerts();
  const report = QuantumExamples.generatePerformanceReport();
  
  return { audit, quality, health, alerts, report };
}

// Example 8: Custom instances
function customInstances() {
  const customTunneling = new QuantumTunnelingAnalyzer(0.9);
  const customZeno = new QuantumZenoMonitor(0.3);
  const customRenorm = new QuantumRenormalizationEngine(4);
  
  return { customTunneling, customZeno, customRenorm };
}

// ============================================
// COMMON INTEGRATIONS
// ============================================

// Integrate into React component
export function MyComponent() {
  const [metrics, setMetrics] = React.useState(null);

  React.useEffect(() => {
    // Get metrics every 5 seconds
    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return React.createElement(
    'div',
    null,
    React.createElement(QuantumMetricsDashboard),
    metrics
      ? React.createElement('pre', null, JSON.stringify(metrics, null, 2))
      : null
  );
}

// Integrate into API route
export async function analyzeRequest(req) {
  const results = await executeFullQuantumAnalysis({
    securityAsset: {
      name: req.endpoint,
      barrier: 0.8,
      estimatedAttackLevel: req.threatLevel || 0.3
    }
  });

  return results;
}

// Integrate into monitoring loop
export function startMonitoring() {
  setInterval(async () => {
    const alerts = QuantumExamples.generateAlerts();
    if (alerts.length > 0) {
      console.warn('🚨 Quantum Alerts:', alerts);
      // Send to alert service
    }
  }, 5000);
}

// ============================================
// TYPE DEFINITIONS
// ============================================

// TypeScript interfaces for type safety
import type {
  TunnelingAnalysis,
  SecurityAsset
} from '@/lib/quantumTunneling';

import type {
  StabilityMetrics,
  CodeHealthSnapshot
} from '@/lib/quantumZeno';

import type {
  CriticalityAnalysis,
  PhaseTransitionDetection,
  SystemMetrics
} from '@/lib/quantumRenormalization';

// ============================================
// EXPORT FOR USE IN OTHER FILES
// ============================================

export {
  // Core modules
  tunneling,
  zeno,
  renormalization,
  // Classes
  QuantumTunnelingAnalyzer,
  QuantumZenoMonitor,
  QuantumRenormalizationEngine,
  // Functions
  executeSecurityAnalysis,
  executeStabilityMonitoring,
  detectCriticality,
  executeFullQuantumAnalysis,
  // Components
  QuantumMetricsDashboard,
  // Examples
  QuantumExamples,
  // Utilities
  checkSecurity,
  checkStability,
  checkSystem,
  fullAnalysis,
  getMetrics,
  renderDashboard,
  runExamples,
  customInstances,
  // Types
  type TunnelingAnalysis,
  type SecurityAsset,
  type StabilityMetrics,
  type CodeHealthSnapshot,
  type CriticalityAnalysis,
  type PhaseTransitionDetection,
  type SystemMetrics
};
