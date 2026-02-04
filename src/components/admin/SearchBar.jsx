import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/contexts/ViewModeContext';

const RECENTS_KEY = 'admin_search_recents';

export default function SearchBar({ placeholder = 'Search admin...', onSearch, className }) {
  const { isBeginnerMode } = useViewMode();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const recentList = useMemo(() => recents.slice(0, 6), [recents]);

  const handleSubmit = (searchValue) => {
    const trimmed = searchValue.trim();
    if (!trimmed) return;

    const nextRecents = [trimmed, ...recents.filter((item) => item !== trimmed)].slice(0, 8);
    setRecents(nextRecents);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(nextRecents));
    onSearch?.(trimmed);
    setOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border-spectrum-indigo-100/60 bg-spectrum-indigo-50/50 text-spectrum-indigo-700"
        aria-label="Open admin search"
      >
        <Search className="h-4 w-4" />
        <span>{placeholder}</span>
        <CommandShortcut className="ml-4">⌘K</CommandShortcut>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmit(query);
              }
            }}
            aria-label="Search admin sections"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Recent searches">
              {recentList.length === 0 ? (
                <CommandItem disabled>No recent searches</CommandItem>
              ) : (
                recentList.map((item) => (
                  <CommandItem key={item} onSelect={() => handleSubmit(item)}>
                    {item}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
            {!isBeginnerMode && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tips">
                  <CommandItem disabled>Search by project, user, or setting name</CommandItem>
                  <CommandItem disabled>Type / to jump between admin sections</CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}