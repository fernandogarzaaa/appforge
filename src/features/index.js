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

// Pair Programming (Phase 3 - to be implemented)
