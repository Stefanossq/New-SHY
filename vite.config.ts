/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Long-term caching: vendor code changes far less often than app code.
        manualChunks(id) {
          const p = id.replace(/\\/g, '/');
          if (p.includes('/lib/templates-')) return 'templates'; // generated-project sources (large strings)
          if (!p.includes('/node_modules/')) return undefined;
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(p)) return 'react';
          if (/\/node_modules\/(@radix-ui|radix-ui|cmdk|sonner|motion|framer-motion|motion-dom|motion-utils)\//.test(p)) return 'ui';
          if (/\/node_modules\/(jszip|file-saver|pako|readable-stream)\//.test(p)) return 'export';
          if (p.includes('/node_modules/highlight.js/')) return 'highlight';
          if (p.includes('/node_modules/lucide-react/')) return 'icons';
          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    testTimeout: 20_000,
  },
});
