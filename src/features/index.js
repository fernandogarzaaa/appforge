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

// Phase 7: Analytics & Insights
export { useTeamProductivity } from './phase7/useTeamProductivity';
export { useFeatureUsageAnalytics } from './phase7/useFeatureUsageAnalytics';
export { usePredictiveAnalytics } from './phase7/usePredictiveAnalytics';
export { TeamProductivityDashboard } from './phase7/TeamProductivityDashboard';
export { FeatureUsageDashboard } from './phase7/FeatureUsageDashboard';
export { PredictiveAnalyticsPanel } from './phase7/PredictiveAnalyticsPanel';
export { ReportBuilder } from './phase7/ReportBuilder';

// Phase 8: Ecosystem & Marketplace
export { useScheduledTasks } from './phase8/useScheduledTasks';
export { ScheduledTaskBuilder } from './phase8/ScheduledTaskBuilder';
export { useIntegrationBuilder } from './phase8/useIntegrationBuilder';
export { IntegrationBuilder } from './phase8/IntegrationBuilder';
export { usePluginMarketplace } from './phase8/usePluginMarketplace';
export { PluginMarketplace } from './phase8/PluginMarketplace';

// Phase 9: Performance & Optimization
export { useCodeSplitting } from './phase9/useCodeSplitting';
export { useDatabaseOptimization } from './phase9/useDatabaseOptimization';
export { useCacheStrategy } from './phase9/useCacheStrategy';
export { PerformanceDashboard } from './phase9/PerformanceDashboard';
export { CacheManager } from './phase9/CacheManager';

// Phase 10: Security & Compliance
export { useAdvancedEncryption } from './phase10/useAdvancedEncryption';
export { useComplianceChecker } from './phase10/useComplianceChecker';
export { usePenetrationTesting } from './phase10/usePenetrationTesting';
export { SecurityAuditDashboard } from './phase10/SecurityAuditDashboard';
export { ComplianceReports } from './phase10/ComplianceReports';

// Phase 11: Multi-Tenancy
export { useOrganizationManager } from './phase11/useOrganizationManager';
export { useRoleBasedAccess } from './phase11/useRoleBasedAccess';
export { useTenantBranding } from './phase11/useTenantBranding';
export { OrganizationDashboard } from './phase11/OrganizationDashboard';
export { TenantIsolation } from './phase11/TenantIsolation';

// Phase 12: Global Scale
export { useMultiRegion } from './phase12/useMultiRegion';
export { useCDNIntegration } from './phase12/useCDNIntegration';
export { useAutoScaling } from './phase12/useAutoScaling';
export { GlobalScaleDashboard } from './phase12/GlobalScaleDashboard';
export { LoadBalancerConfig } from './phase12/LoadBalancerConfig';

// Phase 13: Advanced ML & Predictions
export { useBehavioralPrediction } from './phase13/useBehavioralPrediction';
export { useCodeQualityPrediction } from './phase13/useCodeQualityPrediction';
export { useResourceForecasting } from './phase13/useResourceForecasting';
export { useAnomalyDetection } from './phase13/useAnomalyDetection';
export { MLDashboard } from './phase13/MLDashboard';
export { AnomalyAlerts } from './phase13/AnomalyAlerts';

// Phase 14: Blockchain Integration
export { useSmartContracts } from './phase14/useSmartContracts';
export { useNFTTemplates } from './phase14/useNFTTemplates';
export { useCryptoPayments } from './phase14/useCryptoPayments';
export { BlockchainDashboard } from './phase14/BlockchainDashboard';

// Phase 15: Plugin Ecosystem
export { usePluginSDK } from './phase15/usePluginSDK';
export { usePluginAnalytics } from './phase15/usePluginAnalytics';
export { PluginDevelopmentStudio } from './phase15/PluginDevelopmentStudio';

// Phase 16: Enterprise Admin
export { useAdvancedAnalytics } from './phase16/useAdvancedAnalytics';
export { useCustomWorkflows } from './phase16/useCustomWorkflows';
export { EnterpriseAdminPanel } from './phase16/EnterpriseAdminPanel';

// Phase 17: Advanced Monitoring
export { useDistributedTracing } from './phase17/useDistributedTracing';
export { useIncidentManagement } from './phase17/useIncidentManagement';
export { MonitoringDashboard } from './phase17/MonitoringDashboard';

// Phase 18: Platform Expansion
export { useMobileApp } from './phase18/useMobileApp';
export { useDesktopApp } from './phase18/useDesktopApp';
export { useCLITools } from './phase18/useCLITools';
export { PlatformExpansionDashboard } from './phase18/PlatformExpansionDashboard';
