import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/e2e/**',
      'tests/e2e/**',
      'src/tests/e2e/**',
      'backend/src/tests/**',
      'backend/src/__tests__/**',
      'src/lib/__tests__/quantum*.{js,ts}',
      'src/lib/__tests__/holographic*.{js,ts}',
      'backend/node_modules/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
      reportOnFailure: true,
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
        'functions/**/*.{js,ts}',
      ],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.js',
        '**/index.js',
        'src/main.jsx',
        'src/index.css',
      ],
      all: true,
      clean: true,
      perFile: true,
      reportsDirectory: './coverage',
      skipFull: false,
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
