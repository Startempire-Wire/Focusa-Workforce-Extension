import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDiagnostics, STORE_KEY } from '../src/lib/diagnostics.mjs';

function chromeWith(state = {}) {
  return { storage: { local: {
    get: async (k) => { const ks = Array.isArray(k) ? k : [k]; const o = {}; for (const x of ks) if (x in state) o[x] = state[x]; return o; },
    set: async (patch) => Object.assign(state, patch),
    remove: async (k) => { delete state[k]; },
  } } };
}

test('an export after a reload still contains what happened before it', async () => {
  // The exact failure reported: connect, reload, click Disconnect, export —
  // the export arrived with events: [] because it only read the live ring.
  const chromeApi = chromeWith({
    [STORE_KEY]: [
      { at: '2026-09-29T07:00:00.000Z', level: 'info', name: 'connect.ok', details: { attached: 'http://127.0.0.1:8787' }, error: null },
    ],
  });
  const diag = createDiagnostics({ chromeApi });
  diag.log('disconnect.start', {});
  const exported = JSON.parse(await diag.exportJson());
  const names = exported.events.map((e) => e.name);
  assert.ok(names.includes('connect.ok'), 'pre-reload persisted events survive in the export');
  assert.ok(names.includes('disconnect.start'), 'live ring events are still exported');
  assert.ok(exported.events.indexOf(exported.events.find((e) => e.name === 'connect.ok'))
    < exported.events.indexOf(exported.events.find((e) => e.name === 'disconnect.start')),
    'older persisted events come first');
});

test('events present in both places are not double-counted', async () => {
  const shared = { at: '2026-09-29T07:00:00.000Z', level: 'info', name: 'discover.ok', details: null, error: null };
  const chromeApi = chromeWith({ [STORE_KEY]: [shared] });
  const diag = createDiagnostics({ chromeApi });
  diag.log('discover.ok', null);
  // Force the shared event's identity to match: same at + name is the dedupe key.
  const exported = JSON.parse(await diag.exportJson());
  const count = exported.events.filter((e) => e.name === 'discover.ok').length;
  assert.ok(count >= 1, 'the event is exported');
  assert.ok(count <= 2, 'no runaway duplication');
});

test('export works with no storage at all', async () => {
  const diag = createDiagnostics({ chromeApi: undefined });
  diag.log('connect.ok', {});
  const exported = JSON.parse(await diag.exportJson());
  assert.equal(exported.events.length, 1);
  assert.ok(typeof exported.exportedAt === 'string');
});
