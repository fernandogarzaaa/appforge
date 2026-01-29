import { useState, useEffect, useCallback } from 'react';

/**
 * useFeatureAnalytics Hook
 * Track feature usage, adoption, and engagement metrics
 */
export function useFeatureAnalytics() {
  const [featureUsage, setFeatureUsage] = useState({});
  const [userEngagement, setUserEngagement] = useState({});
  const [featureMetrics, setFeatureMetrics] = useState({});
  const [analyticsEvents, setAnalyticsEvents] = useState([]);
  const [sessionData, setSessionData] = useState({});

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('appforge_feature_usage');
    if (saved) setFeatureUsage(JSON.parse(saved));

    const engagement = localStorage.getItem('appforge_user_engagement');
    if (engagement) setUserEngagement(JSON.parse(engagement));

    const metrics = localStorage.getItem('appforge_feature_metrics');
    if (metrics) setFeatureMetrics(JSON.parse(metrics));

    const events = localStorage.getItem('appforge_analytics_events');
    if (events) setAnalyticsEvents(JSON.parse(events));
  }, []);

  // Track feature usage
  const trackFeatureUsage = useCallback((featureName, metadata = {}) => {
    const updated = { ...featureUsage };
    if (!updated[featureName]) {
      updated[featureName] = {
        name: featureName,
        usageCount: 0,
        lastUsed: null,
        firstUsed: new Date().toISOString(),
        totalTime: 0,
        userCount: 0,
        averageTime: 0
      };
    }

    updated[featureName].usageCount++;
    updated[featureUsage][featureName].lastUsed = new Date().toISOString();

    setFeatureUsage(updated);
    localStorage.setItem('appforge_feature_usage', JSON.stringify(updated));

    // Record event
    recordEvent('feature_usage', featureName, metadata);

    return updated[featureName];
  }, [featureUsage]);

  // Record analytics event
  const recordEvent = useCallback((eventType, eventName, metadata = {}) => {
    const event = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: eventType,
      name: eventName,
      metadata,
      userId: sessionStorage.getItem('userId') || 'anonymous'
    };

    const updated = [event, ...analyticsEvents].slice(0, 10000);
    setAnalyticsEvents(updated);
    localStorage.setItem('appforge_analytics_events', JSON.stringify(updated));

    return event;
  }, [analyticsEvents]);

  // Track user engagement
  const trackUserEngagement = useCallback((userId, action, duration = 0) => {
    const updated = { ...userEngagement };
    if (!updated[userId]) {
      updated[userId] = {
        userId,
        totalActions: 0,
        totalTime: 0,
        lastActive: null,
        activityLevel: 'low',
        features: {},
        sessions: []
      };
    }

    updated[userId].totalActions++;
    updated[userId].totalTime += duration;
    updated[userId].lastActive = new Date().toISOString();

    // Calculate activity level
    const actionsPerDay = updated[userId].totalActions / Math.max(1, Math.ceil(
      (Date.now() - new Date(updated[userId].lastActive).getTime()) / (1000 * 60 * 60 * 24)
    ));
    updated[userId].activityLevel =
      actionsPerDay > 10 ? 'high' : actionsPerDay > 5 ? 'medium' : 'low';

    setUserEngagement(updated);
    localStorage.setItem('appforge_user_engagement', JSON.stringify(updated));
    recordEvent('user_engagement', action, { userId, duration });

    return updated[userId];
  }, [userEngagement, recordEvent]);

  // Calculate feature adoption
  const getFeatureAdoption = useCallback((featureName) => {
    const usage = featureUsage[featureName];
    if (!usage) return 0;

    const totalUsers = Object.keys(userEngagement).length;
    return totalUsers > 0 ? ((usage.userCount / totalUsers) * 100).toFixed(1) : 0;
  }, [featureUsage, userEngagement]);

  // Get usage statistics
  const getUsageStats = useCallback((featureName) => {
    const usage = featureUsage[featureName];
    if (!usage) return null;

    return {
      name: featureName,
      usageCount: usage.usageCount,
      lastUsed: usage.lastUsed,
      firstUsed: usage.firstUsed,
      daysSinceFirst: Math.floor(
        (Date.now() - new Date(usage.firstUsed).getTime()) / (1000 * 60 * 60 * 24)
      ),
      usagePerDay: (usage.usageCount / Math.max(1, Math.floor(
        (Date.now() - new Date(usage.firstUsed).getTime()) / (1000 * 60 * 60 * 24)
      ))).toFixed(2),
      adoption: getFeatureAdoption(featureName)
    };
  }, [featureUsage, getFeatureAdoption]);

  // Get trending features
  const getTrendingFeatures = useCallback((limit = 5) => {
    return Object.values(featureUsage)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
      .map(feature => ({
        ...feature,
        stats: getUsageStats(feature.name)
      }));
  }, [featureUsage, getUsageStats]);

  // Get user analytics
  const getUserAnalytics = useCallback((userId) => {
    const engagement = userEngagement[userId];
    if (!engagement) return null;

    return {
      userId,
      totalActions: engagement.totalActions,
      totalTime: engagement.totalTime,
      averageTimePerAction: (engagement.totalTime / Math.max(1, engagement.totalActions)).toFixed(2),
      lastActive: engagement.lastActive,
      activityLevel: engagement.activityLevel,
      sessionCount: engagement.sessions?.length || 0
    };
  }, [userEngagement]);

  // Get engagement metrics
  const getEngagementMetrics = useCallback(() => {
    const users = Object.values(userEngagement);
    if (users.length === 0) return null;

    const highEngagement = users.filter(u => u.activityLevel === 'high').length;
    const mediumEngagement = users.filter(u => u.activityLevel === 'medium').length;
    const lowEngagement = users.filter(u => u.activityLevel === 'low').length;

    return {
      totalUsers: users.length,
      highEngagement: { count: highEngagement, percentage: ((highEngagement / users.length) * 100).toFixed(1) },
      mediumEngagement: { count: mediumEngagement, percentage: ((mediumEngagement / users.length) * 100).toFixed(1) },
      lowEngagement: { count: lowEngagement, percentage: ((lowEngagement / users.length) * 100).toFixed(1) },
      averageActionsPerUser: (users.reduce((sum, u) => sum + u.totalActions, 0) / users.length).toFixed(1),
      averageTimePerUser: (users.reduce((sum, u) => sum + u.totalTime, 0) / users.length).toFixed(1)
    };
  }, [userEngagement]);

  // Get feature health score
  const getFeatureHealthScore = useCallback((featureName) => {
    const usage = featureUsage[featureName];
    if (!usage) return 0;

    let score = 0;
    // Usage frequency (0-40 points)
    score += Math.min(40, usage.usageCount / 10);
    // User adoption (0-40 points)
    score += parseFloat(getFeatureAdoption(featureName)) * 0.4;
    // Consistency (0-20 points)
    const daysSince = Math.floor(
      (Date.now() - new Date(usage.lastUsed || usage.firstUsed).getTime()) / (1000 * 60 * 60 * 24)
    );
    score += Math.max(0, 20 - daysSince);

    return Math.round(score);
  }, [featureUsage, getFeatureAdoption]);

  // Export analytics report
  const exportAnalyticsReport = useCallback((format = 'json') => {
    const report = {
      timestamp: new Date().toISOString(),
      featureUsage,
      userEngagement,
      trendingFeatures: getTrendingFeatures(10),
      engagementMetrics: getEngagementMetrics(),
      totalEvents: analyticsEvents.length,
      recentEvents: analyticsEvents.slice(0, 100)
    };

    if (format === 'json') {
      const json = JSON.stringify(report, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    return report;
  }, [featureUsage, userEngagement, getTrendingFeatures, getEngagementMetrics, analyticsEvents]);

  return {
    // Tracking
    trackFeatureUsage,
    recordEvent,
    trackUserEngagement,

    // Analysis
    getFeatureAdoption,
    getUsageStats,
    getTrendingFeatures,
    getUserAnalytics,
    getEngagementMetrics,
    getFeatureHealthScore,

    // Data Access
    featureUsage,
    userEngagement,
    analyticsEvents,

    // Export
    exportAnalyticsReport
  };
}
