import { vi } from 'vitest';

// ============================================================================
// GLOBAL JEST / VITEST COMPATIBILITY
// ============================================================================

// Provide global jest as an alias for vi to support legacy mocks
vi.stubGlobal('jest', vi);
global.jest = vi;
globalThis.jest = vi;

// ============================================================================
// FETCH & NETWORK MOCKS
// ============================================================================

// Mock fetch for tests
const mockFetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
  })
);

vi.stubGlobal('fetch', mockFetch);
global.fetch = mockFetch;
globalThis.fetch = mockFetch;

// ============================================================================
// PROJECT GLOBALS
// ============================================================================

vi.stubGlobal('PROJECT_ROOT', 'c:/Users/ferna/Downloads/appforge-main');
global.PROJECT_ROOT = 'c:/Users/ferna/Downloads/appforge-main';

// ============================================================================
// DOM MOCKS (If needed)
// ============================================================================
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
}
