import React, { useRef, useEffect } from 'react';
import { Search, ArrowDown, ArrowUp, Command } from 'lucide-react';
import { useCommandPalette } from './useCommandPalette';
import { cn } from '@/lib/utils';

/**
 * Command Palette Component
 * Global search and command execution interface
 */
export function CommandPalette() {
  const {
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    filteredCommands,
    selectedIndex,
    setSelectedIndex,
    executeCommand,
  } = useCommandPalette();

  const inputRef = useRef(null);
  const selectedItemRef = useRef(null);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands... (Cmd+K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {category}
                </div>
                
                {/* Category Commands */}
                {cmds.map((cmd, idx) => {
                  const globalIdx = Object.values(groupedCommands)
                    .flat()
                    .findIndex(c => c.id === cmd.id);
                  
                  return (
                    <button
                      key={cmd.id}
                      ref={globalIdx === selectedIndex ? selectedItemRef : null}
                      onClick={() => executeCommand(cmd)}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm transition-colors',
                        globalIdx === selectedIndex
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span>{cmd.label}</span>
                        {cmd.tags && (
                          <div className="flex gap-1">
                            {cmd.tags.map(tag => (
                              <span 
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Help Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" />
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <Enter className="w-3 h-3" />
              <span>Execute</span>
            </div>
          </div>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
