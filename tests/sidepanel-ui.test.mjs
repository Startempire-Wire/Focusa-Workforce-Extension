import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname, 'src');
const html = fs.readFileSync(path.join(root, 'sidepanel.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

const requiredIds = [
  'connection-status', 'connection-select', 'pair-form', 'pair-check',
  'orientation-form', 'capture-tab', 'observation-summary', 'mission-preview',
  'creation-form', 'preflight', 'create-draft', 'start-session',
  'refresh-roster', 'roster', 'stream-status', 'audit',
];

test('sidepanel preserves behavior hooks and accessible landmarks', () => {
  assert.match(html, /<main[^>]*>/);
  assert.match(html, /<header[^>]*class="app-header"/);
  for (const id of requiredIds) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-labelledby="orientation-heading"/);
  assert.match(html, /<script type="module" src="sidepanel\.mjs"><\/script>/);
});

test('sidepanel follows the docs/17 §3 region order', async () => {
  const script = fs.readFileSync(path.join(root, 'sidepanel.mjs'), 'utf8');
  const order = ['app-header', 'sp-scope', 'orientation-heading', 'sp-needs-heading', 'sp-working-heading', 'sp-verified-heading', 'pair-section', 'sp-footer'];
  let cursor = -1;
  for (const region of order) {
    const at = html.indexOf(region);
    assert.ok(at > cursor, region + ' appears in atlas order');
    cursor = at;
  }
  // The panel's connection surface is alive: discovery, previews, heartbeat.
  assert.match(html, /id="connect-body"/);
  assert.match(script, /discoverDaemons|previewDaemon/);
  assert.match(html, /name or address/);
});

test('sidepanel visual system supports responsive, light, and reduced-motion users', () => {
  assert.match(css, /@media\s*\(max-width:\s*420px\)/);
  assert.match(css, /prefers-color-scheme:\s*light/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /backdrop-filter:\s*blur/);
});
