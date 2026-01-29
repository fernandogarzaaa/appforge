import React from 'react';
import { useQuickActions } from './useQuickActions';
import { cn } from '@/lib/utils';

/**
 * Context Menu Component
 * Displays quick actions on right-click
 */
export function ContextMenu() {
  const { contextMenu, hideContextMenu, executeAction } = useQuickActions();

  if (!contextMenu) return null;

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-1"
      style={{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
      }}
      onClick={hideContextMenu}
    >
      {contextMenu.actions.map((action, idx) => (
        <button
          key={action.id}
          onClick={() => executeAction(action)}
          className={cn(
            'w-full px-4 py-2 text-left text-sm transition-colors',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            action.danger && 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
