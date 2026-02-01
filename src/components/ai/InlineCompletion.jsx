/**
 * Inline AI Code Completion Component
 * Displays AI suggestions as ghost text
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

export function InlineCompletion({ 
  suggestion, 
  position,
  selectedIndex,
  totalSuggestions,
  onAccept,
  onReject,
  onNext,
  onPrevious,
  loading = false,
}) {
  if (!suggestion && !loading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute z-50 pointer-events-none"
        style={{
          left: position?.x || 0,
          top: position?.y || 0,
        }}
      >
        {/* Ghost text suggestion */}
        {suggestion && (
          <div className="relative">
            <span className="text-gray-400 dark:text-gray-500 font-mono text-sm italic pointer-events-auto">
              {suggestion.text}
            </span>

            {/* Suggestion controls */}
            <div className="absolute -right-24 top-0 flex items-center gap-1 pointer-events-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 flex items-center gap-1">
                {/* Navigation */}
                {totalSuggestions > 1 && (
                  <>
                    <button
                      onClick={onPrevious}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Previous suggestion (Ctrl+↑)"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-xs text-gray-600 dark:text-gray-400 px-1">
                      {selectedIndex + 1}/{totalSuggestions}
                    </span>
                    <button
                      onClick={onNext}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Next suggestion (Ctrl+↓)"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                  </>
                )}

                {/* Accept/Reject */}
                <button
                  onClick={onAccept}
                  className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                  title="Accept (Tab)"
                >
                  Accept
                </button>
                <button
                  onClick={onReject}
                  className="px-2 py-1 text-gray-600 dark:text-gray-400 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Reject (Esc)"
                >
                  ✕
                </button>
              </div>

              {/* AI indicator */}
              <div className="ml-1 flex items-center gap-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg text-xs">
                <Sparkles className="w-3 h-3" />
                <span>{Math.round(suggestion.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && !suggestion && (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <div className="animate-spin">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Generating suggestion...
            </span>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        {suggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute top-full left-0 mt-2 bg-gray-900 text-gray-300 text-xs rounded px-2 py-1 whitespace-nowrap"
          >
            <kbd className="bg-gray-800 px-1 rounded">Tab</kbd> to accept
            {' • '}
            <kbd className="bg-gray-800 px-1 rounded">Esc</kbd> to reject
            {totalSuggestions > 1 && (
              <>
                {' • '}
                <kbd className="bg-gray-800 px-1 rounded">Ctrl+↑↓</kbd> to navigate
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default InlineCompletion;
