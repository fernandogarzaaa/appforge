import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ============================================================================
// DOM MOCKS & STANDARDS
// ============================================================================

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  window.scrollTo = vi.fn();
}


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

// Mock XMLHttpRequest for JSDOM
class MockXMLHttpRequest {
  constructor() {
    this.readyState = 0;
    this.status = 0;
    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;
    this.responseText = '';
    this.response = null;
    this.headers = {};
  }
  open() { this.readyState = 1; }
  send() {
    this.readyState = 4;
    this.status = 200;
    this.responseText = JSON.stringify({});
    this.response = {};
    if (this.onreadystatechange) this.onreadystatechange();
    if (this.onload) this.onload();
  }
  setRequestHeader(key, value) { this.headers[key] = value; }
  getResponseHeader() { return null; }
  getAllResponseHeaders() { return ''; }
}

vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest);
global.XMLHttpRequest = MockXMLHttpRequest;
globalThis.XMLHttpRequest = MockXMLHttpRequest;

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
