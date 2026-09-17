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
 * Derived from the content it labels (both entry trees + manifest), so it is
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
  walk(resolve(root, 'src/startpage-app'));
  files.push(resolve(root, 'manifest.json'));
  const hash = createHash('sha256');
  for (const file of files.sort()) {
    hash.update(file.slice(root.length));
    hash.update(readFileSync(file));
  }
  return hash.digest('hex').slice(0, 8);
}

/** Entry trees: each surface builds from its own root so its HTML lands at the dist root. */
const APPS = {
  workforce: { dir: 'src/workforce', html: 'workforce.html' },
  startpage: { dir: 'src/startpage-app', html: 'startpage.html' },
};

export default defineConfig(({ mode }) => {
  const app = APPS[mode] ?? APPS.workforce;
  const appRoot = resolve(root, app.dir);

  return {
    root: appRoot,
    base: './',
    plugins: [svelte()],
    define: { __WF_BUILD__: JSON.stringify(buildStamp()) },
    build: {
      outDir: process.env.WF_DIST_DIR ? resolve(process.env.WF_DIST_DIR) : resolve(root, 'dist'),
      emptyOutDir: false,
      target: 'chrome114',
      assetsDir: 'workforce-assets',
      rollupOptions: {
        input: { [mode in APPS ? mode : 'workforce']: resolve(appRoot, app.html) },
        output: {
          // Content-hashed names: a refresh re-reads the page from disk and then
          // fetches a *new* asset URL, so a changed build can never be served stale.
          entryFileNames: 'workforce/[name].[hash].js',
          chunkFileNames: 'workforce/[name].[hash].js',
          assetFileNames: 'workforce-assets/[name].[hash][extname]',
        },
      },
    },
  };
});
