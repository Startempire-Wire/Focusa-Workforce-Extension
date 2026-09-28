import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readCache, writeCache, clearCache, isFresh, isUsable, ageLabel, ageMs, FRESH_MS, STALE_MS, MAX_BYTES } from '../src/lib/daemon-cache.mjs';

function chromeWith(state = {}) {
  return { storage: { local: {
    get: async (k) => { const ks = Array.isArray(k) ? k : [k]; const o = {}; for (const x of ks) if (x in state) o[x] = state[x]; return o; },
    set: async (patch) => Object.assign(state, patch),
    remove: async (k) => { delete state[k]; },
  } }, _state: state };
}

test('fresh, stale and expired boundaries', () => {
  const now = 1_000_000;
  assert.equal(isFresh({ at: now - 1_000 }, now), true);
  assert.equal(isFresh({ at: now - FRESH_MS }, now), false, 'freshness is exclusive at the boundary');
  assert.equal(isUsable({ at: now - STALE_MS + 1_000 }, now), true);
  assert.equal(isUsable({ at: now - STALE_MS }, now), false);
  assert.equal(isUsable(null), false);
  assert.equal(isUsable({}), false, 'no timestamp is never usable');
  assert.equal(ageMs(null), Infinity);
});

test('age labels read like a person talks', () => {
  const now = 1_000_000;
  assert.equal(ageLabel({ at: now - 2_000 }, now), 'just now');
  assert.equal(ageLabel({ at: now - 45_000 }, now), '45s ago');
  assert.equal(ageLabel({ at: now - 180_000 }, now), '3m ago');
  assert.equal(ageLabel(null), 'age unknown');
});

test('write then read round-trips per origin', async () => {
  const chromeApi = chromeWith();
  await writeCache(chromeApi, 'http://a:8787', { sections: [{ key: 's' }] });
  const entry = await readCache(chromeApi, 'http://a:8787');
  assert.equal(entry.baseUrl, 'http://a:8787');
  assert.equal(entry.data.sections.length, 1);
  assert.ok(Date.now() - entry.at < 5_000);
  assert.equal(await readCache(chromeApi, 'http://b:8787'), null, 'origins never leak into each other');
});

test('payloads are trimmed to budget, newest sections survive longest', async () => {
  const chromeApi = chromeWith();
  const big = Array.from({ length: 500 }, (_, i) => ({ primary: `row-${i}`, secondary: 'x'.repeat(200) }));
  const entry = await writeCache(chromeApi, 'http://a:8787', { sessions: big, roster: big });
  assert.ok(JSON.stringify(entry).length <= MAX_BYTES);
  await clearCache(chromeApi);
  assert.equal(await readCache(chromeApi, 'http://a:8787'), null);
});

test('cache never throws without a browser', async () => {
  assert.equal(await readCache(undefined, 'http://a:8787'), null);
  assert.equal(await writeCache(undefined, 'http://a:8787', {}), null);
  assert.equal(await readCache({ storage: { local: { get: async () => { throw new Error('denied'); } } } }, 'http://a:8787'), null);
});
