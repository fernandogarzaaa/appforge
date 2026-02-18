/**
 * AI Code Completion Tests
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAICompletion } from '@/hooks/useAICompletion';
import { aiCodeCompletionService } from '@/services/aiCodeCompletion';

// Mock the service
vi.mock('@/services/aiCodeCompletion', () => ({
  aiCodeCompletionService: {
    getCompletions: vi.fn(),
    trackAcceptance: vi.fn(),
    trackRejection: vi.fn(),
  },
}));

describe('useAICompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty suggestions', () => {
    const { result } = renderHook(() => useAICompletion({
      code: '',
      language: 'javascript',
      cursorPosition: 0,
      enabled: false,
    }));

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.hasEuggestions).toBe(false);
  });

  it('should fetch completions when enabled', async () => {
    const mockSuggestions = [
      { text: 'console.log(', confidence: 0.9, type: 'function' },
      { text: 'const x = ', confidence: 0.7, type: 'variable' },
    ];

    aiCodeCompletionService.getCompletions.mockResolvedValue(mockSuggestions);

    const { result } = renderHook(() => useAICompletion({
      code: 'cons',
      language: 'javascript',
      fileName: 'test.js',
      cursorPosition: 4,
      enabled: true,
    }));

    await waitFor(() => {
      expect(result.current.suggestions.length).toBe(2);
    }, { timeout: 1000 });

    expect(aiCodeCompletionService.getCompletions).toHaveBeenCalledWith({
      code: 'cons',
      language: 'javascript',
      fileName: 'test.js',
      cursorPosition: 4,
    });
  });

  it('should filter suggestions by confidence threshold', async () => {
    const mockSuggestions = [
      { text: 'high confidence', confidence: 0.9 },
      { text: 'low confidence', confidence: 0.2 },
      { text: 'medium confidence', confidence: 0.5 },
    ];

    aiCodeCompletionService.getCompletions.mockResolvedValue(mockSuggestions);

    const { result } = renderHook(() => useAICompletion({
      code: 'test',
      language: 'javascript',
      cursorPosition: 4,
      enabled: true,
    }));

    await waitFor(() => {
      expect(result.current.suggestions.length).toBe(2);
    });

    // Should only include suggestions with confidence > 0.3
    expect(result.current.suggestions.every(s => s.confidence > 0.3)).toBe(true);
  });

  it('should accept suggestion and track analytics', async () => {
    const mockSuggestion = { text: 'console.log()', confidence: 0.9 };
    aiCodeCompletionService.getCompletions.mockResolvedValue([mockSuggestion]);

    const { result } = renderHook(() => useAICompletion({
      code: 'cons',
      language: 'javascript',
      cursorPosition: 4,
      enabled: true,
    }));

    await waitFor(() => {
      expect(result.current.suggestions.length).toBe(1);
    });

    let acceptedText;
    act(() => {
      acceptedText = result.current.acceptSuggestion();
    });

    expect(acceptedText).toBe('console.log()');
    expect(aiCodeCompletionService.trackAcceptance).toHaveBeenCalledWith(
      mockSuggestion,
      expect.objectContaining({ code: 'cons', cursorPosition: 4 })
    );
    expect(result.current.suggestions).toEqual([]);
  });

  it('should reject suggestion and track analytics', async () => {
    const mockSuggestion = { text: 'rejected', confidence: 0.8 };
    aiCodeCompletionService.getCompletions.mockResolvedValue([mockSuggestion]);

    const { result } = renderHook(() => useAICompletion({
      code: 'test',
      language: 'javascript',
      cursorPosition: 4,
      enabled: true,
    }));

    await waitFor(() => {
      expect(result.current.suggestions.length).toBe(1);
    });

    act(() => {
      result.current.rejectSuggestion();
    });

    expect(aiCodeCompletionService.trackRejection).toHaveBeenCalledWith(
      mockSuggestion,
      expect.objectContaining({ code: 'test' })
    );
    expect(result.current.suggestions).toEqual([]);
  });

  it('should navigate between suggestions', async () => {
    const mockSuggestions = [
      { text: 'first', confidence: 0.9 },
      { text: 'second', confidence: 0.8 },
      { text: 'third', confidence: 0.7 },
    ];

    aiCodeCompletionService.getCompletions.mockResolvedValue(mockSuggestions);

    const { result } = renderHook(() => useAICompletion({
      code: 'test',
      language: 'javascript',
      cursorPosition: 4,
      enabled: true,
    }));

    await waitFor(() => {
      expect(result.current.suggestions.length).toBe(3);
    });

    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      result.current.nextSuggestion();
    });
    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      result.current.nextSuggestion();
    });
    expect(result.current.selectedIndex).toBe(2);

    act(() => {
      result.current.previousSuggestion();
    });
    expect(result.current.selectedIndex).toBe(1);
  });

  it('should wrap navigation with wrap enabled', async () => {
    const mockSuggestions = [
      { text: 'first', confidence: 0.9 },
      { text: 'second', confidence: 0.8 },
    ];

    aiCodeCompletionService.getCompletions.mockResolvedValue(mockSuggestions);

    const { result } = renderHook(() => useAICompletion({
      code: 'test',
      language: 'javascript',
      cursorPosition: 4,
      enabled: true,
    }));

    await waitFor(() => {
      expect(result.current.suggestions.length).toBe(2);
    });

    // At index 0, go to last
    act(() => {
      result.current.previousSuggestion();
    });
    expect(result.current.selectedIndex).toBe(1);

    // At last index, wrap to 0
    act(() => {
      result.current.nextSuggestion();
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  it('should debounce API calls', async () => {
    vi.useFakeTimers();

    aiCodeCompletionService.getCompletions.mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ code }) => useAICompletion({
        code,
        language: 'javascript',
        cursorPosition: code.length,
        enabled: true,
      }),
      { initialProps: { code: 'c' } }
    );

    // Rapid changes
    rerender({ code: 'co' });
    rerender({ code: 'con' });
    rerender({ code: 'cons' });

    // Should not have called yet
    expect(aiCodeCompletionService.getCompletions).not.toHaveBeenCalled();

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await Promise.resolve();

    // Now it should have called once with the latest value
    expect(aiCodeCompletionService.getCompletions).toHaveBeenCalledTimes(1);
    expect(aiCodeCompletionService.getCompletions).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'cons' })
    );

    vi.useRealTimers();
  });

  it('should abort previous requests', async () => {
    vi.useFakeTimers();

    aiCodeCompletionService.getCompletions.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve([]), 1000))
    );

    const { rerender } = renderHook(
      ({ code }) => useAICompletion({
        code,
        language: 'javascript',
        cursorPosition: code.length,
        enabled: true,
      }),
      { initialProps: { code: 'test1' } }
    );

    // Trigger first debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Change code before first request completes
    rerender({ code: 'test2' });

    // Trigger second debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Resolve pending promises
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(aiCodeCompletionService.getCompletions).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
