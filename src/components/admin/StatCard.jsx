/**
 * StatCard Component
 * Reusable card for displaying statistics on the admin dashboard
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  status,
  color = 'purple',
  onClick,
  progress,
}) {
  const colorClasses = {
    purple: 'border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    green: 'border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    yellow: 'border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20',
    red: 'border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20',
    blue: 'border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
  };

  const iconColorClasses = {
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    yellow: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-indigo-600 dark:text-indigo-400',
  };

  const trendColor = trend?.startsWith('+')
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden p-6 border rounded-lg
        bg-white dark:bg-gray-800
        transition-all duration-200 ease-out
        ${colorClasses[color]}
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Background gradient accent */}
      <div
        className={`
          absolute -right-8 -top-8 w-32 h-32 rounded-full
          opacity-5 pointer-events-none
          ${color === 'purple' && 'bg-purple-500'}
          ${color === 'green' && 'bg-emerald-500'}
          ${color === 'yellow' && 'bg-amber-500'}
          ${color === 'red' && 'bg-red-500'}
          ${color === 'blue' && 'bg-indigo-500'}
        `}
      />

      <div className="relative z-10">
        {/* Header with icon and label */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {label}
            </p>
          </div>
          {Icon && (
            <Icon
              className={`w-5 h-5 ml-2 flex-shrink-0 ${iconColorClasses[color]}`}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Main value */}
        <div className="mb-3">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        {/* Progress bar if provided */}
        {progress !== undefined && (
          <div className="mb-3">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  color === 'purple' && 'bg-purple-500'
                } ${color === 'green' && 'bg-emerald-500'} ${
                  color === 'yellow' && 'bg-amber-500'
                } ${color === 'red' && 'bg-red-500'} ${
                  color === 'blue' && 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(progress * 100).toFixed(0)}%
            </p>
          </div>
        )}

        {/* Trend or status footer */}
        <div className="flex items-center justify-between">
          {trend && (
            <div className={`flex items-center text-xs font-medium ${trendColor}`}>
              {trend.includes('↓') ? (
                <TrendingDown className="w-3 h-3 mr-1" />
              ) : (
                <TrendingUp className="w-3 h-3 mr-1" />
              )}
              {trend}
            </div>
          )}
          {status && (
            <span
              className={`
                text-xs font-medium px-2 py-1 rounded-full
                ${status === 'encrypted' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}
                ${status === 'active' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}
                ${status === 'warning' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}
                ${status === 'error' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}
              `}
            >
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
