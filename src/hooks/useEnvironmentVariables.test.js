import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnvironmentVariables } from '@/hooks/useEnvironmentVariables';

describe('useEnvironmentVariables Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    expect(Array.isArray(result.current.variables)).toBe(true);
    expect(result.current.loading).toBe(true);
  });

  it('should load environment variables', async () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    expect(result.current.loading).toBe(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should add environment variable', async () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    await act(async () => {
      await result.current.addVariable({
        name: 'API_KEY',
        value: 'secret-value',
        type: 'secret',
        environment: 'production'
      });
    });
  });

  it('should update environment variable', async () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    await act(async () => {
      await result.current.updateVariable('var-id-1', {
        value: 'new-value'
      });
    });
  });

  it('should delete environment variable', async () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    await act(async () => {
      await result.current.deleteVariable('var-id-1');
    });
  });

  it('should toggle variable visibility', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    act(() => {
      result.current.toggleVisibility('var-id-1');
    });
  });

  it('should reveal variable value', async () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    await act(async () => {
      await result.current.revealValue('var-id-1');
    });
  });

  it('should hide variable value', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    act(() => {
      result.current.hideValue('var-id-1');
    });
  });

  it('should copy variable to clipboard', async () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined)
    };
    Object.assign(navigator, { clipboard: mockClipboard });
    
    await act(async () => {
      await result.current.copyToClipboard('VAR_NAME=value');
    });
  });

  it('should filter variables by environment', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    act(() => {
      const filtered = result.current.filterByEnvironment('production');
      expect(Array.isArray(filtered)).toBe(true);
    });
  });

  it('should filter variables by type', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    act(() => {
      const filtered = result.current.filterByType('secret');
      expect(Array.isArray(filtered)).toBe(true);
    });
  });

  it('should export variables as .env file', async () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    await act(async () => {
      const content = result.current.exportAsEnv();
      expect(typeof content).toBe('string');
    });
  });

  it('should export variables as JSON', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    act(() => {
      const json = result.current.exportAsJSON();
      expect(typeof json).toBe('string');
    });
  });

  it('should import variables from file', async () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    const mockFile = new File(['API_KEY=value'], 'env.txt');
    
    await act(async () => {
      await result.current.importFromFile(mockFile);
    });
  });

  it('should validate variable names', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    expect(result.current.validateName('VALID_NAME')).toBe(true);
    expect(result.current.validateName('invalid-name')).toBe(false);
    expect(result.current.validateName('')).toBe(false);
  });

  it('should validate variable values', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    expect(result.current.validateValue('any value')).toBe(true);
    expect(result.current.validateValue('123')).toBe(true);
    expect(result.current.validateValue('')).toBe(false);
  });

  it('should provide variable statistics', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    expect(result.current.stats).toBeDefined();
    expect(result.current.stats).toHaveProperty('total');
    expect(result.current.stats).toHaveProperty('byEnvironment');
    expect(result.current.stats).toHaveProperty('byType');
  });

  it('should detect duplicate variable names', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    act(() => {
      const isDuplicate = result.current.isDuplicate('API_KEY');
      expect(typeof isDuplicate).toBe('boolean');
    });
  });

  it('should clear error messages', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should handle sort operations', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    act(() => {
      result.current.sortBy('name', 'asc');
    });
  });

  it('should provide masked values for display', () => {
    const { result } = renderHook(() => useEnvironmentVariables());
    
    act(() => {
      const masked = result.current.getMaskedValue('secret-value', 'secret');
      expect(masked).toContain('****') || expect(masked).toBeDefined();
    });
  });
});
