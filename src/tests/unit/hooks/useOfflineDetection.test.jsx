import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOfflineDetection } from '@/hooks/useOfflineDetection'

describe('useOfflineDetection', () => {
  beforeEach(() => {
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return online state initially', () => {
    const { result } = renderHook(() => useOfflineDetection())
    expect(result.current).toBe(true)
  })

  it('should detect offline state when navigator.onLine changes', async () => {
    const { result } = renderHook(() => useOfflineDetection())
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })
    
    // Trigger offline event
    window.dispatchEvent(new Event('offline'))
    
    // Wait for state update
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('should detect online state after being offline', async () => {
    const { result } = renderHook(() => useOfflineDetection())
    
    // Go offline first
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })
    window.dispatchEvent(new Event('offline'))
    
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
    
    // Go back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
    window.dispatchEvent(new Event('online'))
    
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should add event listeners on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    renderHook(() => useOfflineDetection())
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useOfflineDetection())
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
  })
})
