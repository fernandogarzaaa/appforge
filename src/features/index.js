/**
 * Features Index
 * Central export point for all feature modules
 */

// Phase 1: Quick Wins
// Command Palette
export { useCommandPalette } from './commandPalette/useCommandPalette';
export { CommandPalette } from './commandPalette/CommandPalette';

// Keyboard Shortcuts
export { useKeyboardShortcuts } from './keyboardShortcuts/useKeyboardShortcuts';
export { KeyboardShortcutsManager } from './keyboardShortcuts/KeyboardShortcutsManager';

// Themes
export { useThemeManager, PRESET_THEMES } from './themes/useThemeManager';
export { ThemeManager } from './themes/ThemeManager';

// Export
export { ExportManager, useExport } from './export/ExportManager';

// Quick Actions
export { useQuickActions, QUICK_ACTIONS } from './quickActions/useQuickActions';
export { ContextMenu } from './quickActions/ContextMenu';

// AI Code Comments
export { AICommentGenerator, useAIComments } from './aiCodeComments/AICommentGenerator';

// Performance Profiler
export { usePerformanceProfiler, PerformanceAnalyzer } from './performanceProfiler/usePerformanceProfiler';

// Test Generation
export { TestGenerator, useTestGenerator } from './testGeneration/TestGenerator';

// Phase 2: Developer Experience
// Local Sync
export { useLocalSync } from './localSync/useLocalSync';
export { LocalSyncManager } from './localSync/LocalSyncManager';

// Performance Profiler Dashboard
export { PerformanceProfilerDashboard } from './performanceProfilerDashboard/PerformanceProfilerDashboard';

// Git Workflows
export { useGitWorkflows } from './gitWorkflows/useGitWorkflows';
export { GitWorkflowsManager } from './gitWorkflows/GitWorkflowsManager';

// Phase 3: Collaboration Features
export { usePairProgramming } from './pairProgramming/usePairProgramming';
export { PairProgrammingManager } from './pairProgramming/PairProgrammingManager';
export { useCodeReviewGamification } from './codeReviewGamification/useCodeReviewGamification';
export { CodeReviewGamification } from './codeReviewGamification/CodeReviewGamification';
export { StandupReportGenerator } from './standupReports/StandupReportGenerator';
export { useTeamWorkflows } from './teamWorkflows/useTeamWorkflows';

// Phase 4: Quality & Testing
export { useSecurityScanner } from './qualityTesting/useSecurityScanner';
export { usePerformanceRegression } from './qualityTesting/usePerformanceRegression';
export { useDeploymentTesting } from './qualityTesting/useDeploymentTesting';
export { CodeQualityTrends } from './qualityTesting/CodeQualityTrends';
export { ComplianceRuleBuilder } from './qualityTesting/ComplianceRuleBuilder';

// Phase 5: Enterprise & DevOps
export { useEnvironmentManager } from './enterpriseDevOps/useEnvironmentManager';
export { useCostOptimization } from './enterpriseDevOps/useCostOptimization';
export { useSecretsManager } from './enterpriseDevOps/useSecretsManager';
export { useAuditLogger } from './enterpriseDevOps/useAuditLogger';
export { useBlueGreenDeployments } from './enterpriseDevOps/useBlueGreenDeployments';

// Phase 6: AI & Advanced Automation
export { useIntelligentRecovery } from './aiAutomation/useIntelligentRecovery';
export { useDocumentationGenerator } from './aiAutomation/useDocumentationGenerator';
export { useResourceAllocator } from './aiAutomation/useResourceAllocator';
export { useCodeSmellDetector } from './aiAutomation/useCodeSmellDetector';
export { useLearningMemory } from './aiAutomation/useLearningMemory';
