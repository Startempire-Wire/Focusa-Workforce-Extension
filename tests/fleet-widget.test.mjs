import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname, 'src');
const html = fs.readFileSync(path.join(root, 'startpage.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'startpage.mjs'), 'utf8');
const api = fs.readFileSync(path.join(root, 'lib', 'api-client.mjs'), 'utf8');

// The browser-fleet projection feeds the Start Page WORKING NOW column
// (docs/17 §4) read-only, instead of a standalone dashboard widget.
test('browser fleet projection feeds the start page working column read-only', () => {
  assert.match(html, /id="start-working"/);
  assert.match(js, /fetchBrowserFleet/);
  assert.match(js, /projectWorkLoop/);
  assert.match(api, /browser_fleet/);
});

test('fleet bridge is read-only and bounded', () => {
  assert.match(api, /v1\/browser-fleet\/status/);
});
