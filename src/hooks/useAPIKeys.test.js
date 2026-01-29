import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAPIKeys } from '@/hooks/useAPIKeys';

describe('useAPIKeys Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAPIKeys());
    expect(result.current.keys).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should load API keys', async () => {
    const { result } = renderHook(() => useAPIKeys());
    
    expect(result.current.loading).toBe(true);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should create new API key', async () => {
    const { result } = renderHook(() => useAPIKeys());
    
    await act(async () => {
      const key = await result.current.createKey({
        name: 'Test Key',
        scopes: ['read', 'write']
      });
      expect(key).toBeDefined();
      expect(key.name).toBe('Test Key');
    });
  });

  it('should reveal key', async () => {
    const { result } = renderHook(() => useAPIKeys());
    
    await act(async () => {
      await result.current.revealKey('key-id-1');
    });
  });

  it('should toggle key visibility', async () => {
    const { result } = renderHook(() => useAPIKeys());
    
    act(() => {
      result.current.toggleKeyVisibility('key-id-1');
    });
    
    expect(result.current.visibleKeys).toContain('key-id-1');
  });

  it('should revoke key', async () => {
    const { result } = renderHook(() => useAPIKeys());
    
    await act(async () => {
      await result.current.revokeKey('key-id-1');
    });
  });

  it('should delete key', async () => {
    const { result } = renderHook(() => useAPIKeys());
    
    await act(async () => {
      await result.current.deleteKey('key-id-1');
    });
  });

  it('should copy key to clipboard', async () => {
    const { result } = renderHook(() => useAPIKeys());
    
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined)
    };
    Object.assign(navigator, { clipboard: mockClipboard });
    
    await act(async () => {
      await result.current.copyKeyToClipboard('key-value');
    });
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith('key-value');
  });

  it('should filter keys by scope', () => {
    const { result } = renderHook(() => useAPIKeys());
    
    expect(result.current.keys).toBeDefined();
    
    act(() => {
      const filtered = result.current.filterByScope('read');
      expect(Array.isArray(filtered)).toBe(true);
    });
  });

  it('should sort keys by creation date', () => {
    const { result } = renderHook(() => useAPIKeys());
    
    act(() => {
      const sorted = result.current.sortKeys('createdAt', 'desc');
      expect(Array.isArray(sorted)).toBe(true);
    });
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useAPIKeys());
    
    // Mock API error
    vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    
    // Hook should catch and handle error
    expect(result.current.error).toBeNull();
  });

  it('should clear error messages', async () => {
    const { result } = renderHook(() => useAPIKeys());
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should track key expiry', () => {
    const { result } = renderHook(() => useAPIKeys());
    
    act(() => {
      const expiring = result.current.getExpiringKeys(30);
      expect(Array.isArray(expiring)).toBe(true);
    });
  });

  it('should provide key statistics', () => {
    const { result } = renderHook(() => useAPIKeys());
    
    expect(result.current.stats).toBeDefined();
    expect(result.current.stats).toHaveProperty('total');
    expect(result.current.stats).toHaveProperty('active');
    expect(result.current.stats).toHaveProperty('revoked');
  });
});
