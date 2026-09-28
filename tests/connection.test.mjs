import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initialConnection, describeConnection, applyBeat, isAttached } from '../src/lib/connection.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The words must be the same everywhere, because the operator reads the same
// indicator on four surfaces (operator direction 2026-09-27).
test('connection state has one honest vocabulary', () => {
  assert.equal(describeConnection(initialConnection()).label, 'Disconnected');
  assert.equal(describeConnection({ ...initialConnection(), status: 'connected' }).label, 'Connected');
  assert.equal(describeConnection({ ...initialConnection(), status: 'unreachable' }).label, 'Not answering');
  assert.equal(describeConnection({ ...initialConnection(), status: 'connecting' }).label, 'Connecting');
  // an unknown status degrades to the safe reading, never to "connected"
  assert.equal(describeConnection({ status: 'wat' }).label, 'Disconnected');
  // text carries the meaning; tone only supports it
  assert.match(describeConnection({ status: 'connected' }).headline, /Connected/);
  assert.match(describeConnection({ status: 'unreachable' }).detail, /stopped answering/i);
});

test('a heartbeat updates the record the same way on every surface', () => {
  const link = { ...initialConnection(), status: 'connected', baseUrl: 'http://kh:8787' };
  assert.equal(applyBeat(link, { ok: true, at: 'now' }).status, 'connected');
  assert.equal(applyBeat(link, { ok: false }).status, 'unreachable');
  assert.equal(applyBeat(link, { ok: false }).note, 'The daemon stopped answering');
});

test('attached means attached, even when it has gone quiet', () => {
  assert.equal(isAttached({ status: 'connected' }), true);
  assert.equal(isAttached({ status: 'unreachable' }), true, 'a quiet daemon is still attached: last state is retained');
  assert.equal(isAttached({ status: 'disconnected' }), false);
  assert.equal(isAttached({ status: 'connecting' }), false);
});

test('every surface renders the same indicator and imports the same language', async () => {
  for (const file of ['workforce/workforce.css', 'styles.css', 'startpage.css', 'wall.css']) {
    const css = await readFile(resolve(root, 'src', file), 'utf8');
    assert.match(css, /connection\.css|\.conn\b/, `${file} carries the connection indicator`);
  }
  for (const file of ['sidepanel.mjs', 'startpage.mjs', 'wall.mjs']) {
    const source = await readFile(resolve(root, 'src', file), 'utf8');
    assert.match(source, /from '\.\/lib\/connection\.mjs'/, `${file} uses the shared connection language`);
    assert.match(source, /class="conn"|\.conn/, `${file} renders the indicator`);
  }
  const app = await readFile(resolve(root, 'src/workforce/App.svelte'), 'utf8');
  assert.match(app, /from '\.\.\/lib\/connection\.mjs'/, 'the full page uses the same language');
  assert.match(app, /class="conn"/, 'the full page renders the indicator');
});

test('Disconnect is reachable while attached, on every surface', async () => {
  // The reported failure: an attached surface rendered no connection strip, so
  // there was no way to disconnect at all.
  const strip = await readFile(resolve(root, 'src/workforce/components/ConnectionStrip.svelte'), 'utf8');
  assert.match(strip, /link\.status === 'connected'/, 'the strip stays rendered while attached');
  assert.match(strip, /Disconnect/, 'Disconnect lives in the strip');
  assert.match(strip, /store\.disconnect\(\)/, 'it calls the one disconnect path');
  assert.match(strip, /rediscover/, 'and offers a way to look again afterwards');

  for (const [script, markup] of [['sidepanel.mjs', 'sidepanel.html'], ['startpage.mjs', 'startpage.html']]) {
    const source = await readFile(resolve(root, 'src', script), 'utf8');
    const html = await readFile(resolve(root, 'src', markup), 'utf8');
    assert.match(source, /disconnect/, `${script} can disconnect`);
    assert.match(source, /conn-action|Disconnect/, `${script} offers the action`);
    assert.match(html, /class="conn"/, `${markup} shows the indicator`);
  }
  // and the store exposes one disconnect for all of them
  const store = await readFile(resolve(root, 'src/workforce/lib/workforce-store.svelte.js'), 'utf8');
  assert.match(store, /async function disconnect\(\)/);
  assert.match(store, /You disconnected\. Nothing is attached\./, 'a disconnect says so in words');
});
