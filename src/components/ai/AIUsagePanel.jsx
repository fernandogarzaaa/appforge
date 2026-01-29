/**
 * AI Usage Analytics Panel
 * Displays token usage, costs, and model statistics
 */

import React, { useState } from 'react';
import { useLLM, AI_MODELS } from '@/contexts/LLMContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Coins,
  Zap,
  Clock,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatCost = (cost) => {
  if (cost === 0) return 'Free';
  if (cost < 0.01) return '<$0.01';
  return '$' + cost.toFixed(2);
};

export default function AIUsagePanel({ 
  compact = false,
  showHistory = true,
  className 
}) {
  const { usage, resetUsage, getModelInfo } = useLLM();
  const [expanded, setExpanded] = useState(!compact);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Calculate percentages for model breakdown
  const totalQueries = usage.queryCount || 1;
  const modelStats = Object.entries(usage.modelBreakdown || {}).map(([model, stats]) => ({
    model,
    info: getModelInfo(model) || AI_MODELS.BASE44,
    ...stats,
    percentage: ((stats.queries / totalQueries) * 100).toFixed(1),
  })).sort((a, b) => b.queries - a.queries);

  // Recent history (last 10)
  const recentHistory = (usage.history || []).slice(-10).reverse();

  if (compact && !expanded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center gap-4 p-3 rounded-lg border cursor-pointer",
          "bg-gradient-to-r from-gray-50 to-gray-100/50",
          "dark:from-gray-800/50 dark:to-gray-900/50 dark:border-gray-700",
          "hover:shadow-md transition-shadow",
          className
        )}
        onClick={() => setExpanded(true)}
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium dark:text-white">
            {formatNumber(usage.totalTokens)} tokens
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-green-500" />
          <span className="text-sm dark:text-gray-300">
            {formatCost(usage.totalCost)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          <span className="text-sm dark:text-gray-300">
            {usage.queryCount} queries
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 ml-auto" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="dark:bg-gray-900/50 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                AI Usage Analytics
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Track your AI model usage and costs
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUsage}
                className="text-gray-500 hover:text-red-500"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {compact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/5">
              <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatNumber(usage.totalTokens)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Tokens</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-green-500/10 dark:bg-green-500/5">
              <Coins className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCost(usage.totalCost)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Est. Cost</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-blue-500/10 dark:bg-blue-500/5">
              <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {usage.queryCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Queries</div>
            </div>
          </div>

          {/* Model Breakdown */}
          {modelStats.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium dark:text-gray-200">Model Usage</h4>
              {modelStats.map(({ model, info, queries, tokens, cost: _cost, percentage }) => (
                <div key={model} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.icon}</span>
                      <span className="font-medium dark:text-white">{info.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{queries} queries</span>
                      <span>{formatNumber(tokens)} tokens</span>
                      <Badge variant="outline" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={parseFloat(percentage)} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Recent History */}
          {showHistory && recentHistory.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium dark:text-gray-200">Recent Activity</h4>
                {usage.history?.length > 10 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="text-xs"
                  >
                    {showAllHistory ? 'Show Less' : `Show All (${usage.history.length})`}
                  </Button>
                )}
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {(showAllHistory ? usage.history.slice().reverse() : recentHistory).map((entry, idx) => {
                    const info = getModelInfo(entry.model) || AI_MODELS.BASE44;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg text-xs",
                          "bg-gray-50 dark:bg-gray-800/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span className="font-medium dark:text-white">{info.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {entry.tokens}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.responseTime}ms
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty State */}
          {usage.queryCount === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No AI queries yet</p>
              <p className="text-sm mt-1">Start chatting to see usage stats</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
