import { defineConfig } from 'vitest/config';
import path from 'path';
import { loadEnv } from 'vite';

import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: ['./src/tests/setup.js'],
            include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            exclude: ['**/node_modules/**', 'dist/**', '.idea/**', '.git/**', '.cache/**', 'e2e/**', 'tests/e2e/**', 'src/tests/e2e/**', 'backend/**'],
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
            env: {
                ...env,
                // Explicitly override if needed, but loadEnv should handle .env.local
                VITE_BASE44_APP_ID: env.VITE_BASE44_APP_ID || 'test_app_id',
            }
        },
    };
});
