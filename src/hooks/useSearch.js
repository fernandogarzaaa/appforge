import { useState, useCallback, useRef, useMemo } from 'react';
import {
  fuzzySearch,
  rankSearchResults,
  highlightMatches,
  filterByType as filterByTypeUtil,
  normalizeQuery
} from '@/lib/search';

export function useSearch(data = []) {
  const initialData = Array.isArray(data) ? data : [];
  const [query, setQuery] = useState('');
  const [resultsState, setResultsState] = useState(initialData);
  const [filteredResultsState, setFilteredResultsState] = useState(initialData);
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState([]);
  const debounceRef = useRef(null);
  const resultsRef = useRef(initialData);
  const filteredResultsRef = useRef(initialData);

  const syncResults = useCallback((nextResults) => {
    resultsRef.current = nextResults;
    setResultsState(nextResults);
  }, []);

  const syncFilteredResults = useCallback((nextResults) => {
    filteredResultsRef.current = nextResults;
    setFilteredResultsState(nextResults);
  }, []);

  const updateResults = useCallback((q) => {
    if (!q || !q.trim()) {
      const base = Array.isArray(data) ? data : [];
      syncResults(base);
      syncFilteredResults(base);
      return;
    }

    const matches = fuzzySearch(q, Array.isArray(data) ? data : [], 'name');
    syncResults(matches);
    syncFilteredResults(matches);
  }, [data, syncFilteredResults, syncResults]);

  const search = useCallback((q) => {
    setQuery(q);
    setIsSearching(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    updateResults(q);

    if (q && q.trim()) {
      setHistory(prev => {
        const next = [q, ...prev.filter(item => item !== q)];
        return next.slice(0, 10);
      });
    }

    debounceRef.current = setTimeout(() => {
      setIsSearching(false);
    }, 200);
  }, [updateResults]);

  const searchRegex = useCallback((regex) => {
    const list = Array.isArray(data) ? data : [];
    const matches = list.filter(item => regex.test(item.name || ''));
    syncResults(matches);
    syncFilteredResults(matches);
  }, [data, syncFilteredResults, syncResults]);

  const filterByType = useCallback((type) => {
    const nextFiltered = filterByTypeUtil(resultsRef.current, type);
    syncFilteredResults(nextFiltered);
  }, [syncFilteredResults]);

  const clearSearch = useCallback(() => {
    setQuery('');
    const base = Array.isArray(data) ? data : [];
    syncResults(base);
    syncFilteredResults(base);
    setIsSearching(false);
  }, [data, syncFilteredResults, syncResults]);

  const reset = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  const getHighlightedResults = useCallback(() => {
    return filteredResultsRef.current.map(item => ({
      ...item,
      highlightedName: highlightMatches(item.name || '', query)
    }));
  }, [query]);

  const getSuggestions = useCallback(() => {
    if (!query) return [];
    const normalized = query.toLowerCase();
    const suggestions = filteredResultsRef.current
      .map(item => item.name)
      .filter(name => name && name.toLowerCase().includes(normalized));
    return Array.from(new Set(suggestions)).slice(0, 5);
  }, [query]);

  const getSearchHistory = useCallback(() => history, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getRankedResults = useCallback(() => {
    return rankSearchResults(filteredResultsRef.current, query);
  }, [query]);

  const sortResults = useCallback((field = 'name', order = 'asc') => {
    const sorted = [...resultsRef.current].sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      if (aVal === bVal) return 0;
      return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    syncResults(sorted);
  }, [syncResults]);

  const stats = useMemo(() => ({
    totalResults: filteredResultsState.length,
    queryLength: query.length
  }), [filteredResultsState.length, query.length]);

  return {
    query,
    results: resultsRef.current,
    filteredResults: filteredResultsRef.current,
    isSearching,
    search,
    searchRegex,
    filterByType,
    clearSearch,
    reset,
    getHighlightedResults,
    getSuggestions,
    getSearchHistory,
    clearHistory,
    getRankedResults,
    sortResults,
    stats
  };
}
