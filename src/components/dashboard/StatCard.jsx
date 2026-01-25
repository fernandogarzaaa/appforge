import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, changeType, icon: Icon, gradient }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-1.5">
              {changeType === 'increase' ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={cn(
                "text-[11px] font-medium",
                changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'
              )}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          gradient || "bg-gray-900"
        )}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}