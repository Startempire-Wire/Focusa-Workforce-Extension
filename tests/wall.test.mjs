import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// docs/17 §16 is the layout authority for the Wall. These assertions pin the
// atlas region order and the read-only posture, replacing the pre-atlas
// dashboard hooks this surface used to carry.
const root = path.resolve(new URL('..', import.meta.url).pathname, 'src');
const html = fs.readFileSync(path.join(root, 'wall.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'wall.mjs'), 'utf8');
const css = fs.readFileSync(path.join(root, 'wall.css'), 'utf8');

test('wall region order follows the docs/17 §16 atlas', () => {
  const order = ['wall-header', 'wall-focus', 'wall-cols', 'wall-exception'];
  let cursor = -1;
  for (const region of order) {
    const at = html.indexOf(region);
    assert.ok(at > cursor, `${region} appears in atlas order`);
    cursor = at;
  }
  // The three columns are Working Now | Needs You | Verified Recently.
  const cols = html.slice(html.indexOf('wall-cols'), html.indexOf('wall-exception'));
  assert.ok(cols.indexOf('Working Now') < cols.indexOf('Needs You'), 'Working Now precedes Needs You');
  assert.ok(cols.indexOf('Needs You') < cols.indexOf('Verified Recently'), 'Needs You precedes Verified Recently');
});

test('wall is read-only and states source + freshness explicitly', () => {
  assert.match(html, /READ ONLY/);
  assert.match(html, /no mutation authority/);
  for (const id of ['source', 'freshness', 'loop-state', 'task', 'signals', 'wall-needs', 'wall-verified', 'stream-state', 'wall-exception']) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  // The exception band exists but stays hidden until material (docs/17 §16).
  assert.match(html, /id="wall-exception"[^>]*hidden/);
});

test('wall consumes canonical projections and the reconnect stream', () => {
  assert.match(js, /fetchWorkLoop/);
  assert.match(js, /fetchRoster/);
  assert.match(js, /runReliableEventStream/);
  assert.match(js, /initialCursor: connection\.last_cursor/);
});

test('wall uses the atlas container, gutters and type scale', () => {
  assert.match(css, /max-width:\s*1600px/);      // §1 desktop max content width
  assert.match(css, /padding:\s*34px 38px/);     // §1 32–40px gutters
  assert.match(css, /clamp\(28px,\s*3\.2vw,\s*32px\)/); // current focus 28–32px
  assert.match(css, /clamp\(16px,\s*1\.4vw,\s*18px\)/); // primary row titles 16–18px
  assert.match(css, /clamp\(13px,\s*1\.1vw,\s*15px\)/); // secondary 13–15px
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test('wall collapses to one column at 900px in atlas order', () => {
  assert.match(css, /@media \(max-width: 900px\)/);
  const block = css.slice(css.indexOf('@media (max-width: 900px)'));
  assert.match(block, /grid-template-columns: 1fr/);
  // Narrow order is Current Focus → Needs You → Working Now → Verified
  // (docs/17 §16): Needs You takes order 1, Working Now order 2.
  assert.match(block, /nth-of-type\(1\)\s*\{[^}]*order:\s*2/); // Working Now
  assert.match(block, /nth-of-type\(2\)\s*\{[^}]*order:\s*1/); // Needs You
});

test('wall consumes the shared token layer', () => {
  assert.match(css, /@import '\.\/tokens\.css'/);
  assert.match(css, /--panel: var\(--bg-surface\)/);
  assert.match(css, /--text: var\(--text-primary\)/);
});
