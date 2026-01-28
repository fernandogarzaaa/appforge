import { useState, useCallback, useEffect } from 'react';
import { performSearch } from '@/lib/search';

export function useSearch(context = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    projects: [],
    functions: [],
    pages: [],
    total: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], functions: [], pages: [], total: 0 });
      return;
    }

    setIsLoading(true);
    
    // Simulate async search delay
    const timeout = setTimeout(() => {
      const searchResults = performSearch(query, context);
      setResults(searchResults);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timeout);
  }, [query, context]);

  const search = useCallback((q) => {
    setQuery(q);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults({ projects: [], functions: [], pages: [], total: 0 });
  }, []);

  return {
    query,
    search,
    clear,
    results,
    isLoading,
    hasResults: results.total > 0
  };
}
