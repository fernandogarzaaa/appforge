import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchBar({ onOpen, placeholder = 'Search...', showShortcut = true }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hidden sm:flex"
      onClick={onOpen}
    >
      <Search className="w-4 h-4 mr-2" />
      <span className="hidden md:inline text-xs">{placeholder}</span>
      {showShortcut && (
        <kbd className="ml-auto hidden md:inline-block px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
          ⌘K
        </kbd>
      )}
    </Button>
  );
}
