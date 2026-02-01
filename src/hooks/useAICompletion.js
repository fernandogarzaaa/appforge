/**
 * AI Code Completion Hook
 * Provides AI-powered code suggestions in real-time
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { aiCodeCompletionService } from '@/services/aiCodeCompletion';

export function useAICompletion({ code, language, fileName, cursorPosition, enabled = true }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch completions with debouncing
  const fetchCompletions = useCallback(async () => {
    if (!enabled || !code || cursorPosition == null) {
      setSuggestions([]);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const results = await aiCodeCompletionService.getCompletions({
        code,
        language,
        cursorPosition,
        fileName,
      });

      // Filter by confidence threshold
      const filteredResults = results.filter(s => s.confidence > 0.3);
      setSuggestions(filteredResults);
      setSelectedIndex(0);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching AI completions:', error);
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  }, [code, language, fileName, cursorPosition, enabled]);

  // Debounced fetch
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCompletions();
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchCompletions]);

  // Accept suggestion
  const acceptSuggestion = useCallback((index = selectedIndex) => {
    if (suggestions[index]) {
      const suggestion = suggestions[index];
      aiCodeCompletionService.trackAcceptance(suggestion, { code, cursorPosition });
      setSuggestions([]);
      return suggestion.text;
    }
    return null;
  }, [suggestions, selectedIndex, code, cursorPosition]);

  // Reject suggestion
  const rejectSuggestion = useCallback((index = selectedIndex) => {
    if (suggestions[index]) {
      const suggestion = suggestions[index];
      aiCodeCompletionService.trackRejection(suggestion, { code, cursorPosition });
      setSuggestions([]);
    }
  }, [suggestions, selectedIndex, code, cursorPosition]);

  // Navigate suggestions
  const nextSuggestion = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % suggestions.length);
  }, [suggestions.length]);

  const previousSuggestion = useCallback(() => {
    setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
  }, [suggestions.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (suggestions.length === 0) return;

      // Tab to accept
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const accepted = acceptSuggestion();
        if (accepted && e.target.value !== undefined) {
          const before = code.slice(0, cursorPosition);
          const after = code.slice(cursorPosition);
          e.target.value = before + accepted + after;
        }
      }

      // Escape to reject
      if (e.key === 'Escape') {
        e.preventDefault();
        rejectSuggestion();
      }

      // Arrow keys to navigate
      if (e.key === 'ArrowDown' && e.ctrlKey) {
        e.preventDefault();
        nextSuggestion();
      }

      if (e.key === 'ArrowUp' && e.ctrlKey) {
        e.preventDefault();
        previousSuggestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, acceptSuggestion, rejectSuggestion, nextSuggestion, previousSuggestion, code, cursorPosition]);

  return {
    suggestions,
    loading,
    selectedIndex,
    currentSuggestion: suggestions[selectedIndex] || null,
    acceptSuggestion,
    rejectSuggestion,
    nextSuggestion,
    previousSuggestion,
    hasEuggestions: suggestions.length > 0,
  };
}

export default useAICompletion;
