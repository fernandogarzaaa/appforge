import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeatureAnalytics } from '../../phase4/analytics/useFeatureAnalytics';
import { useAnimations } from './useAnimations';
import { useAccessibility } from '../accessibility/useAccessibility';
import { useResponsive } from '../responsive/useResponsive';
import {
  AnimatedCard,
  AnimatedTab,
  AnimatedList,
  AnimatedProgress,
  AnimatedButton,
} from './AnimatedComponents';

/**
 * AnimatedAnalyticsDashboard
 * 
 * Demonstrates Phase 4 Analytics Dashboard enhanced with Phase 5 animations.
 * Features smooth transitions, hover effects, and accessibility support.
 * 
 * Props:
 *   - onRefresh: Callback when data refresh is triggered
 *   - onExport: Callback when export is triggered
 * 
 * Features:
 *   - Animated KPI cards with staggered reveal
 *   - Smooth tab transitions between analytics sections
 *   - Engaging feature usage table animations
 *   - Trending features chart with smooth transitions
 *   - Accessibility announcements on interactions
 *   - Responsive layout for all device sizes
 */
export function AnimatedAnalyticsDashboard({ onRefresh, onExport }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    overview,
    featureUsage,
    trendingFeatures,
    isLoading,
    error,
    refresh,
  } = useFeatureAnalytics();

  const animations = useAnimations();
  const { announce, createAccessibleButton } = useAccessibility();
  const { isDesktop, getFlexDirection } = useResponsive();

  // Handle tab changes
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    announce(`Switched to ${tab} analytics tab`, 'polite');
  }, [announce]);

  // Handle feature selection
  const handleFeatureSelect = useCallback((feature) => {
    setSelectedFeature(selectedFeature?.id === feature.id ? null : feature);
    announce(`Selected feature: ${feature.name}`, 'polite');
  }, [selectedFeature, announce]);

  // Handle data refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    announce('Refreshing analytics data', 'polite');
    try {
      await refresh();
      announce('Analytics data refreshed successfully', 'polite');
    } finally {
      setIsRefreshing(false);
    }
    if (onRefresh) onRefresh();
  }, [refresh, announce, onRefresh]);

  // Handle export
  const handleExport = useCallback(() => {
    announce('Exporting analytics data', 'polite');
    if (onExport) onExport();
  }, [announce, onExport]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'features', label: 'Features', icon: '⭐' },
    { id: 'trends', label: 'Trends', icon: '📈' },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={animations.containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex justify-between items-center"
        variants={animations.itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track feature usage and performance metrics
          </p>
        </div>

        <div className="flex gap-3">
          <AnimatedButton
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            {...createAccessibleButton({
              label: 'Refresh analytics data',
              disabled: isRefreshing || isLoading,
            })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isRefreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
          </AnimatedButton>

          <AnimatedButton
            onClick={handleExport}
            {...createAccessibleButton({
              label: 'Export analytics data',
            })}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            ↓ Export
          </AnimatedButton>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        className="flex gap-2 border-b border-gray-200 dark:border-gray-700"
        variants={animations.itemVariants}
      >
        <AnimatePresence mode="wait">
          {tabs.map((tab) => (
            <AnimatedTab
              key={tab.id}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </AnimatedTab>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800"
          variants={animations.slideUpVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="text-red-800 dark:text-red-200">
            {error}
          </p>
        </motion.div>
      )}

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            variants={animations.containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className={`grid gap-4 ${isDesktop ? 'grid-cols-4' : 'grid-cols-1'}`}>
              <AnimatedCard
                className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div variants={animations.itemVariants}>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {overview?.totalUsers?.toLocaleString() || '0'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-green-600 text-sm font-medium">+12%</span>
                    <span className="text-gray-500 text-xs">vs last month</span>
                  </div>
                </motion.div>
              </AnimatedCard>

              <AnimatedCard
                className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div variants={animations.itemVariants}>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Active Features
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {overview?.activeFeatures || '0'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-green-600 text-sm font-medium">+5</span>
                    <span className="text-gray-500 text-xs">this month</span>
                  </div>
                </motion.div>
              </AnimatedCard>

              <AnimatedCard
                className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div variants={animations.itemVariants}>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Avg Usage Rate
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {overview?.avgUsageRate || '0'}%
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-blue-600 text-sm font-medium">↑ 3%</span>
                    <span className="text-gray-500 text-xs">improvement</span>
                  </div>
                </motion.div>
              </AnimatedCard>

              <AnimatedCard
                className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div variants={animations.itemVariants}>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Error Rate
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {overview?.errorRate || '0'}%
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-green-600 text-sm font-medium">-2%</span>
                    <span className="text-gray-500 text-xs">improvement</span>
                  </div>
                </motion.div>
              </AnimatedCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'features' && (
          <motion.div
            key="features"
            variants={animations.containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Usage Count
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      % of Total
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatedList
                    items={featureUsage || []}
                    renderItem={(feature, index) => (
                      <motion.tr
                        key={feature.id}
                        className={`border-t border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
                          selectedFeature?.id === feature.id
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={() => handleFeatureSelect(feature)}
                        variants={animations.listItemVariants}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {feature.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {feature.usageCount?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <AnimatedProgress
                              value={feature.percentOfTotal || 0}
                              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                              barClassName="bg-blue-600 h-full"
                            />
                            <span className="text-gray-600 dark:text-gray-400 min-w-max">
                              {feature.percentOfTotal || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`font-medium ${
                              feature.trend > 0
                                ? 'text-green-600'
                                : feature.trend < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {feature.trend > 0 ? '↑' : feature.trend < 0 ? '↓' : '→'}{' '}
                            {Math.abs(feature.trend)}%
                          </span>
                        </td>
                      </motion.tr>
                    )}
                  />
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trends Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'trends' && (
          <motion.div
            key="trends"
            variants={animations.containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {(trendingFeatures || []).slice(0, 6).map((feature, index) => (
                <AnimatedCard
                  key={feature.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    variants={animations.itemVariants}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {feature.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.category}
                        </p>
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          feature.growthRate > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {feature.growthRate > 0 ? '+' : ''}{feature.growthRate}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Growth Rate
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {feature.growthRate}%
                        </span>
                      </div>
                      <AnimatedProgress
                        value={Math.abs(feature.growthRate)}
                        max={50}
                        className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                        barClassName={
                          feature.growthRate > 0
                            ? 'bg-green-600'
                            : 'bg-red-600'
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Adoption
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {feature.adoptionRate}%
                        </span>
                      </div>
                      <AnimatedProgress
                        value={feature.adoptionRate}
                        className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                        barClassName="bg-blue-600"
                      />
                    </div>
                  </motion.div>
                </AnimatedCard>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          className="flex items-center justify-center py-12"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading analytics data...
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default AnimatedAnalyticsDashboard;
