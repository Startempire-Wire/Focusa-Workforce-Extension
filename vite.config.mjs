import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Build identity shown in the UI so a loaded build is never ambiguous.
 * Content-derived (the sources it labels + manifest), so identical inputs give
 * an identical bundle and the stamp advances on any real edit.
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

/**
 * The Workforce full page (WP-0.2.2) builds from its own root so its HTML lands
 * at the dist root. The start page and the other surfaces keep their existing
 * shipped implementation until their own plan nodes replace them (docs/14
 * STG-0.2 constraint: preserve until intentionally replaced).
 */
export default defineConfig({
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
        entryFileNames: 'workforce/[name].[hash].js',
        chunkFileNames: 'workforce/[name].[hash].js',
        assetFileNames: 'workforce-assets/[name].[hash][extname]',
      },
    },
  },
});
