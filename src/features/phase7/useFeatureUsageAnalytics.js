import { useMemo } from 'react';
import { useFeatureAnalytics } from '@/features/analytics/useFeatureAnalytics';

export function useFeatureUsageAnalytics() {
  const {
    featureUsage,
    userEngagement,
    analyticsEvents,
    trackFeatureUsage,
    getUsageStats
  } = useFeatureAnalytics();

  const topFeatures = useMemo(() => {
    return Object.values(featureUsage)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10);
  }, [featureUsage]);

  const adoptionSummary = useMemo(() => {
    const totalUsers = Object.keys(userEngagement).length || 1;
    return Object.values(featureUsage).map((feature) => ({
      name: feature.name,
      usageCount: feature.usageCount,
      adoptionRate: Math.round(((feature.userCount || 0) / totalUsers) * 100)
    }));
  }, [featureUsage, userEngagement]);

  const recentEvents = useMemo(() => {
    return (analyticsEvents || []).slice(0, 20);
  }, [analyticsEvents]);

  return {
    featureUsage,
    topFeatures,
    adoptionSummary,
    recentEvents,
    trackFeatureUsage,
    getUsageStats
  };
}
