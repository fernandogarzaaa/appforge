import { useState, useCallback, useEffect } from 'react';
import { projectsService } from '@/api/services';

export function useSearch(context = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    projects: [],
    functions: [],
    pages: [],
    total: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search with backend
  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], functions: [], pages: [], total: 0 });
      return;
    }

    setIsLoading(true);
    
    // Debounce search requests
    const timeout = setTimeout(async () => {
      try {
        const searchResults = await projectsService.search(query);
        setResults(searchResults);
      } catch (err) {
        console.error('Search failed:', err);
        setResults({ projects: [], functions: [], pages: [], total: 0 });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

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
