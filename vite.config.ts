import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // PostCSS explícito: impede o Vite de herdar um postcss.config.js de pastas acima do projeto.
  css: { postcss: { plugins: [] } },
  clearScreen: false,
  server: {
    port: 3000,
    strictPort: true,
    // Projetos gerados pela verificação e builds da CLI/desktop não fazem parte da interface:
    // sem isto, rodar `verify:templates` com o dev server aberto recarrega a página.
    watch: { ignored: ['**/.verify/**', '**/cli/dist/**', '**/src-tauri/target/**'] },
  },
  build: { outDir: 'dist', target: 'es2022', chunkSizeWarningLimit: 1500 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
