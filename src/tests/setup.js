import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Quiet network-related noise by stubbing fetch/axios transport to return
// harmless defaults; this keeps jsdom tests from throwing on relative URLs
// and prevents Base44 SDK axios calls from emitting network errors.
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => '',
});

class MockXMLHttpRequest {
  constructor() {
    this.readyState = 0;
    this.status = 200;
    this.responseText = '{}';
    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;
  }
  open(method, url) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }
  setRequestHeader() {}
  send() {
    this.readyState = 4;
    if (typeof this.onreadystatechange === 'function') {
      this.onreadystatechange();
    }
    if (typeof this.onload === 'function') {
      this.onload();
    }
  }
  abort() {}
}

global.XMLHttpRequest = MockXMLHttpRequest;
