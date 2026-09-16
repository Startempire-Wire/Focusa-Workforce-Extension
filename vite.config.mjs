import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Build identity shown in the UI so a loaded build is never ambiguous.
 * Derived from source identity only (commit + dirty marker) so identical sources
 * always produce an identical bundle; it advances on every committed change.
 */
function buildStamp() {
  try {
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim() ? '+' : '';
    return `${sha}${dirty}`;
  } catch {
    return 'dev';
  }
}

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
  define: { __WF_BUILD__: JSON.stringify(buildStamp()) },
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: false,
    target: 'chrome114',
    assetsDir: 'workforce-assets',
    rollupOptions: {
      input: { workforce: resolve(root, 'src/workforce/workforce.html') },
      output: {
        // Content-hashed names: a refresh re-reads the page from disk and then
        // fetches a *new* asset URL, so a changed build can never be served stale.
        entryFileNames: 'workforce/[name].[hash].js',
        chunkFileNames: 'workforce/[name].[hash].js',
        assetFileNames: 'workforce-assets/[name].[hash][extname]',
      },
    },
  },
});
