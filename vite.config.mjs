import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Minimal MV3-safe bundling for the Workforce full page.
 * - relative asset URLs (extension pages are not served from a web root)
 * - writes into the already-populated dist/ produced by scripts/build.mjs
 * - no code splitting beyond a single entry chunk per page
 */
export default defineConfig({
  // Root is the Workforce source dir so the built page lands at dist/workforce.html
  // (Vite preserves the HTML input's path relative to its root).
  root: resolve(root, 'src/workforce'),
  base: './',
  plugins: [svelte()],
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: false,
    target: 'chrome114',
    assetsDir: 'workforce-assets',
    rollupOptions: {
      input: { workforce: resolve(root, 'src/workforce/workforce.html') },
      output: {
        entryFileNames: 'workforce/[name].js',
        chunkFileNames: 'workforce/[name].js',
        assetFileNames: 'workforce-assets/[name][extname]',
      },
    },
  },
});
