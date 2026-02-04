import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function ContextualNav({ items = [], leading, trailing, className }) {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn(
      'border-b border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm sticky top-14 sm:top-16 z-30',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 sm:py-2 min-h-12">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto w-full sm:w-auto scrollbar-hide">
            {leading && <div className="shrink-0">{leading}</div>}
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
              {items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 whitespace-nowrap h-10 flex items-center',
                    item.isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          {trailing && (
            <div className="flex items-center gap-2 shrink-0">
              {trailing}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
