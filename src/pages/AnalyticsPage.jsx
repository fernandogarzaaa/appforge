/**
 * Analytics Page
 * Main page to access analytics dashboard and usage insights
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { AlertCircle } from 'lucide-react';

export function AnalyticsPage() {
  const { user } = useAuth?.() || {};

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Please log in to access analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AnalyticsDashboard />
    </div>
  );
}

export default AnalyticsPage;
