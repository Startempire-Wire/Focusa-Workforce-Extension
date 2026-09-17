import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname, 'src');
const api = fs.readFileSync(path.join(root, 'lib', 'api-client.mjs'), 'utf8');

// The fleet *widget* lived on the retired widget start page. Browser Fleet is an
// owner projection that the Start Page no longer shows (docs/10 WF-SUR-003:
// concise return/orientation, not widget landfill). The read adapter stays — that
// is the shared client's job — but no surface claims a fleet it cannot confirm.
test('browser fleet read adapter remains available to any surface that needs it', () => {
  assert.match(api, /browser_fleet/);
  assert.match(api, /fetchBrowserFleet/);
});

test('the fleet bridge stays read-only and bounded', () => {
  assert.match(api, /MAX_RESPONSE_BYTES/);
  assert.match(api, /method: 'GET'/);
});

test('no shipped surface invents fleet state while the owner exposes no fleet projection', () => {
  for (const file of ['startpage-app/App.svelte', 'workforce/App.svelte']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!/fetchBrowserFleet/.test(source), `${file} does not fabricate fleet state`);
  }
});
