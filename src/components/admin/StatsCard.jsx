import React, { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/contexts/ViewModeContext';

const getTrend = (trend, change) => {
  if (trend) return trend;
  const numeric = Number(change);
  if (Number.isNaN(numeric) || change === undefined || change === null) return 'neutral';
  if (numeric > 0) return 'up';
  if (numeric < 0) return 'down';
  return 'neutral';
};

const trendStyles = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-muted-foreground',
};

const trendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function StatsCardGrid({ children, className }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  sparkline = [],
  className,
}) {
  const { isBeginnerMode } = useViewMode();
  const resolvedTrend = getTrend(trend, change);
  const TrendIcon = trendIcon[resolvedTrend];

  const sparklineData = useMemo(() => {
    if (!sparkline?.length) return [];
    return sparkline.map((point, index) => ({ index, value: point }));
  }, [sparkline]);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border/60",
        "transition-all duration-200",
        "hover:shadow-[var(--spectrum-shadow-quantum-hover)]",
        "hover:border-spectrum-indigo-300",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'var(--spectrum-gradient-journey)' }}
      />
      <CardContent className={cn("relative z-10 space-y-3", isBeginnerMode ? "p-5" : "p-4")}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <span className="rounded-lg bg-spectrum-indigo-100 p-2 text-spectrum-indigo-600 dark:bg-spectrum-indigo-500/20 dark:text-spectrum-indigo-200">
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            {change !== undefined && change !== null && (
              <div className={cn("mt-1 flex items-center gap-1 text-xs", trendStyles[resolvedTrend])}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{Math.abs(Number(change)).toFixed(1)}%</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          {sparklineData.length > 1 && (
            <div className="h-12 w-24 text-spectrum-indigo-600 dark:text-spectrum-indigo-200">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}