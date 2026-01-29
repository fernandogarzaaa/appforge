// Phase 3 - Collaboration & Advanced Features

// Pair Programming
export { usePairProgramming } from './pairProgramming/usePairProgramming';
export { PairProgrammingManager } from './pairProgramming/PairProgrammingManager';

// Code Review Gamification
export { useCodeReviewGamification } from './codeReviewGamification/useCodeReviewGamification';
export { CodeReviewGamification } from './codeReviewGamification/CodeReviewGamification';

// Team Workflows
export { useTeamWorkflows } from './teamWorkflows/useTeamWorkflows';
export { TeamWorkflowsManager } from './teamWorkflows/TeamWorkflowsManager';

// Advanced Export
export {
  exportJSON,
  exportCSV,
  exportXML,
  exportYAML,
  exportSQL,
  exportMarkdown,
  exportBatch,
  createExportPreset,
  getExportPresets,
  executeExportPreset
} from './export/AdvancedExportManager';

// Security Scanning
export {
  scanCode,
  scanDependencies,
  analyzeSecurityPatterns,
  generateSecurityReport,
  exportSecurityAudit
} from './security/SecurityScanner';

// Performance Benchmarking
export {
  PerformanceBenchmark,
  BenchmarkSuite,
  MemoryProfiler,
  benchmarkThroughput,
  benchmarkNetwork,
  saveBenchmarkResults,
  getBenchmarkHistory,
  analyzeBenchmarkTrends
} from './performance/PerformanceBenchmark';

// Custom Workflow Builder
export {
  WorkflowBuilder,
  TRIGGER_TYPES,
  CONDITION_OPERATORS,
  ACTION_TYPES,
  evaluateConditions,
  executeWorkflow,
  saveWorkflow,
  getWorkflows,
  deleteWorkflow
} from './workflow/WorkflowBuilder';

// Enhanced Presets
export { default as THEME_PRESETS } from './themes/THEME_PRESETS';
export { default as COMMAND_PRESETS } from './commandPalette/COMMAND_PRESETS';
export { default as KEYBOARD_MACROS } from './keyboardShortcuts/KEYBOARD_MACROS';
