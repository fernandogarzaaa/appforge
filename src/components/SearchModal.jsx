import React, { useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/hooks/useSearch';

export function SearchModal({ isOpen, onClose, context = {} }) {
  const { query, search, clear, results, isLoading, hasResults } = useSearch(context);
  const inputRef = useRef(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // CMD+K or CTRL+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen && inputRef.current) {
          inputRef.current.focus();
        }
      }
      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search projects, functions, pages..."
                  value={query}
                  onChange={(e) => search(e.target.value)}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      clear();
                      inputRef.current?.focus();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
              )}

              {!isLoading && !hasResults && query && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No results found for "{query}"
                </div>
              )}

              {!isLoading && !query && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  <p>Start typing to search...</p>
                </div>
              )}

              {!isLoading && hasResults && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Projects */}
                  {results.projects.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">
                        Projects
                      </h3>
                      <div className="space-y-2">
                        {results.projects.map((project) => (
                          <SearchResultItem
                            key={project.id}
                            item={project}
                            onSelect={onClose}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Functions */}
                  {results.functions.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">
                        Functions
                      </h3>
                      <div className="space-y-2">
                        {results.functions.map((fn) => (
                          <SearchResultItem
                            key={fn.id}
                            item={fn}
                            onSelect={onClose}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pages */}
                  {results.pages.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">
                        Pages
                      </h3>
                      <div className="space-y-2">
                        {results.pages.map((page) => (
                          <SearchResultItem
                            key={page.id}
                            item={page}
                            onSelect={onClose}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="space-x-2">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                  ESC
                </kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SearchResultItem({ item, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {item.name}
          </div>
          {item.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {item.description}
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 flex-shrink-0" />
      </div>
    </div>
  );
}
