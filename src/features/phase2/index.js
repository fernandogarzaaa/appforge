/**
 * Phase 2 Core Revenue Features - Feature Exports
 * All revenue-generating features are exported from this index
 */

// Legacy features with optional dependencies - uncomment after installing
// AI Code Generation
// export { useAIGeneration } from './aiCodeGeneration/useAIGeneration';
// export { AICodeGenerator } from './aiCodeGeneration/AICodeGenerator';

// Marketplace for Templates
// export { useMarketplace } from './marketplace/useMarketplace';

// Application Monitoring
// export { useMonitoring } from './monitoring/useMonitoring';

// Team Collaboration
// export { usePairProgramming } from './teamCollaboration/usePairProgramming';
// export { useTeamSync } from './teamCollaboration/useTeamSync';

// Advanced Security
// export { useSecurityScanner } from './security/useSecurityScanner';

// Analytics & Insights
// export { useAnalyticsInsights } from './analyticsInsights/useAnalyticsInsights';

// Export all feature components
export default {
  // Legacy features - uncomment after installing dependencies
  aiCodeGeneration: {
    // useAIGeneration: () => import('./aiCodeGeneration/useAIGeneration'),
    // AICodeGenerator: () => import('./aiCodeGeneration/AICodeGenerator'),
  },
  marketplace: {
    // useMarketplace: () => import('./marketplace/useMarketplace'),
  },
  monitoring: {
    // useMonitoring: () => import('./monitoring/useMonitoring'),
  },
  teamCollaboration: {
    // usePairProgramming: () => import('./teamCollaboration/usePairProgramming'),
    // useTeamSync: () => import('./teamCollaboration/useTeamSync'),
  },
  security: {
    // useSecurityScanner: () => import('./security/useSecurityScanner'),
  },
  analytics: {
    // useAnalyticsInsights: () => import('./analyticsInsights/useAnalyticsInsights'),
  },
};
