import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchBar({ onOpen, placeholder = 'Search...', showShortcut = true }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800 hidden sm:flex h-10 min-w-44 px-3 py-2"
      onClick={onOpen}
    >
      <Search className="w-4 h-4 mr-2 shrink-0" />
      <span className="hidden md:inline text-xs flex-1 text-left">{placeholder}</span>
      {showShortcut && (
        <kbd className="ml-auto hidden md:inline-block px-1.5 py-0.5 text-xs border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-mono">
          ⌘K
        </kbd>
      )}
    </Button>
  );
}
