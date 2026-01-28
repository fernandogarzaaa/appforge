/**
 * Test Utilities
 * Reusable helpers for testing
 */

import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';

// Create a custom render function with all providers
export function renderWithProviders(ui, options = {}) {
  const {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    route = '/',
    ...renderOptions
  } = options;

  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Wait for async updates
export const waitFor = (callback, options) => {
  return new Promise((resolve, reject) => {
    const timeout = options?.timeout || 1000;
    const interval = options?.interval || 50;
    const startTime = Date.now();

    const check = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, interval);
        }
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, interval);
        }
      }
    };

    check();
  });
};

// Mock user data
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

// Mock project data
export const mockProject = {
  id: 1,
  name: 'Test Project',
  description: 'A test project',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  stats: {
    entities_count: 5,
    pages_count: 10,
    components_count: 15,
  },
};

// Mock entity data
export const mockEntity = {
  id: 1,
  name: 'TestEntity',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
  },
  created_at: '2024-01-01T00:00:00Z',
};

// Create mock API responses
export function createMockResponse(data, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(options.headers || {}),
  };
}

// Mock Base44 client
export const mockBase44 = {
  auth: {
    me: vi.fn(() => Promise.resolve(mockUser)),
    login: vi.fn(() => Promise.resolve({ token: 'mock-token' })),
    logout: vi.fn(() => Promise.resolve()),
  },
  entities: {
    Project: {
      list: vi.fn(() => Promise.resolve([mockProject])),
      get: vi.fn(() => Promise.resolve(mockProject)),
      create: vi.fn((data) => Promise.resolve({ ...mockProject, ...data })),
      update: vi.fn((id, data) => Promise.resolve({ ...mockProject, id, ...data })),
      delete: vi.fn(() => Promise.resolve()),
    },
  },
};

// Setup localStorage mock
export function setupLocalStorageMock() {
  const store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
