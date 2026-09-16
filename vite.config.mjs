import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Build identity shown in the UI so a loaded build is never ambiguous.
 *
 * Derived from the content it labels (Workforce sources + manifest), so it is
 * deterministic for identical inputs and changes on any real edit. Git-derived
 * stamps would drift with the live loop's own commits and break build
 * determinism.
 */
function buildStamp() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(full);
    }
  };
  walk(resolve(root, 'src/workforce'));
  files.push(resolve(root, 'manifest.json'));
  const hash = createHash('sha256');
  for (const file of files.sort()) {
    hash.update(file.slice(root.length));
    hash.update(readFileSync(file));
  }
  return hash.digest('hex').slice(0, 8);
}

export default defineConfig({
  // Root is the Workforce source dir so the built page lands at dist/workforce.html
  // (Vite preserves the HTML input's path relative to its root).
  root: resolve(root, 'src/workforce'),
  base: './',
  plugins: [svelte()],
  define: { __WF_BUILD__: JSON.stringify(buildStamp()) },
  build: {
    outDir: process.env.WF_DIST_DIR ? resolve(process.env.WF_DIST_DIR) : resolve(root, 'dist'),
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
