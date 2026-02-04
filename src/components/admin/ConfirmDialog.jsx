/**
 * ConfirmDialog Component
 * Reusable confirmation modal for destructive actions
 */

import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen = false,
  title = 'Confirm Action',
  description = 'Are you sure?',
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  isDangerous = false,
  onConfirm,
  onCancel,
  loading = false,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3 flex-1">
            {isDangerous && (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h2
                id="dialog-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div id="dialog-description" className="p-6">
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {description}
            </p>
          )}
          {children}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium transition-colors
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isDangerous
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
              }
            `}
          >
            {loading && (
              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
