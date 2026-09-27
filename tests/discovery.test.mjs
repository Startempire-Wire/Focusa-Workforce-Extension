import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEVICE_CANDIDATES,
  discoveryCandidates,
  discoverDaemon,
  hasKnownDaemon,
  probeDaemon,
  rememberDaemon,
} from '../src/lib/discovery.mjs';

const TOKEN_KEY = 'focusa.workforce.discovered.v1';
const ENV_KEY = 'focusa.workforce.local_environments.v1';

function chromeWith(storage = {}, { envs = [] } = {}) {
  const state = { ...storage };
  return {
    storage: {
      local: {
        async get(key) {
          const keys = Array.isArray(key) ? key : [key];
          const out = {};
          for (const k of keys) if (k in state) out[k] = state[k];
          if (keys.includes(ENV_KEY) && !(ENV_KEY in out)) out[ENV_KEY] = envs;
          return out;
        },
        async set(patch) { Object.assign(state, patch); },
      },
    },
    _state: state,
  };
}

const healthOk = (url) => async (input) => {
  const target = String(input);
  if (target.includes('100.115.92.26')) {
    return new Response(JSON.stringify({ status: 'healthy', service: 'focusa-daemon' }), { status: 200 });
  }
  return new Response('', { status: 404 });
};

test('device candidates cover loopback, this device bridges and the tailnet node', () => {
  const joined = DEVICE_CANDIDATES.join(' ');
  assert.match(joined, /127\.0\.0\.1/, 'browser loopback');
  assert.match(joined, /localhost/, 'loopback by name');
  assert.match(joined, /\[::1\]/, 'IPv6 loopback');
  assert.match(joined, /100\.115\.92\.26/, 'crosvm veth bridge');
  assert.match(joined, /100\.127\.113\.90/, 'this device on the tailnet');
});

test('remembered daemons are probed first and deduplicated', async () => {
  const chromeApi = chromeWith({ [TOKEN_KEY]: [{ baseUrl: 'http://100.64.9.9:8787' }, { baseUrl: 'http://127.0.0.1:8787' }] });
  const candidates = await discoveryCandidates(chromeApi);
  assert.equal(candidates[0], 'http://100.64.9.9:8787', 'a learned network daemon is tried first');
  assert.equal(new Set(candidates).size, candidates.length, 'no duplicate candidates');
  assert.ok(candidates.includes('http://100.115.92.26:8787'), 'this device is still probed');
});

test('probe reports honestly and never throws for an unreachable origin', async () => {
  const ok = await probeDaemon('http://100.115.92.26:8787', { fetchImpl: healthOk() });
  assert.equal(ok.ok, true);
  assert.equal(ok.service, 'focusa-daemon');

  const unreachable = await probeDaemon('http://127.0.0.1:8787', {
    fetchImpl: async () => { throw new Error('ECONNREFUSED'); },
  });
  assert.equal(unreachable.ok, false);
  assert.equal(unreachable.status, null);
});

test('discoverDaemon returns the first answering daemon and every answer', async () => {
  const result = await discoverDaemon(chromeWith(), { fetchImpl: healthOk() });
  assert.equal(result.connected?.baseUrl, 'http://100.115.92.26:8787');
  assert.equal(result.answers.length, DEVICE_CANDIDATES.length);
  assert.equal(result.answers.filter((a) => a.ok).length, 1);
});

test('discoverDaemon reports not-found honestly when nothing answers', async () => {
  const result = await discoverDaemon(chromeWith(), { fetchImpl: async () => { throw new Error('down'); } });
  assert.equal(result.connected, null);
  assert.ok(result.answers.every((a) => a.ok === false));
});

test('a daemon is remembered only after it answered', async () => {
  const chromeApi = chromeWith();
  assert.equal(await hasKnownDaemon(chromeApi), false, 'a fresh device has no known daemon');
  await rememberDaemon(chromeApi, { baseUrl: 'http://100.115.92.26:8787', label: 'Focusa daemon' });
  assert.equal(await hasKnownDaemon(chromeApi), true, 'a daemon that answered is remembered');
  const stored = chromeApi._state[TOKEN_KEY];
  assert.equal(stored[0].baseUrl, 'http://100.115.92.26:8787');
  assert.ok(stored[0].seen_at, 'the remember record is timestamped');
});

test('an existing local environment also counts as a known daemon', async () => {
  const chromeApi = chromeWith({}, { envs: [{
    schema: 'focusa.workforce_local_environment.v1',
    environment_id: 'local:http://127.0.0.1:8787',
    label: 'Focusa daemon (http://127.0.0.1:8787)',
    base_url: 'http://127.0.0.1:8787',
    created_at: '2026-09-27T00:00:00.000Z',
  }] });
  assert.equal(await hasKnownDaemon(chromeApi), true);
});

test('a corrupt stored environment is treated as no known daemon, not a crash', async () => {
  const chromeApi = chromeWith({}, { envs: [{ environment_id: 'local:http://127.0.0.1:8787' }] });
  assert.equal(await hasKnownDaemon(chromeApi), false);
});

test('a known host is probed on every plausible Focusa port, never swept', async () => {
  const { hostCandidates, PORT_VARIANTS } = await import('../src/lib/discovery.mjs');
  assert.deepEqual(PORT_VARIANTS, [8787, 8788, 8789, 18787], 'a small fixed set, not a range');
  assert.equal(hostCandidates('100.64.1.9').length, PORT_VARIANTS.length);
  // A tailnet literal speaks HTTP; anything else must be HTTPS.
  assert.ok(hostCandidates('100.64.1.9').every((u) => u.startsWith('http://')));
  assert.ok(hostCandidates('kh.tailnet.ts.net').every((u) => u.startsWith('https://')));
});

test('a seed accepts a name, an address, or a URL with its own port', async () => {
  const { seedCandidates } = await import('../src/lib/discovery.mjs');
  assert.deepEqual(seedCandidates('kh:9999'), ['https://kh:9999'], 'an explicit port is respected exactly');
  assert.equal(seedCandidates('kh').length, 4, 'a bare name is tried on the known ports');
  assert.deepEqual(seedCandidates('127.0.0.1'), ['http://127.0.0.1:8787'], 'loopback is one port');
  assert.deepEqual(seedCandidates('https://kh.example:8443'), ['https://kh.example:8443']);
  assert.deepEqual(seedCandidates(''), []);
});

test('every daemon that answered is learned for the next cold start', async () => {
  const { rememberDaemon, discoveryCandidates } = await import('../src/lib/discovery.mjs');
  const chromeApi = chromeWith();
  await rememberDaemon(chromeApi, { baseUrl: 'http://100.64.7.7:8788', label: 'Tailnet' });
  const candidates = await discoveryCandidates(chromeApi);
  assert.ok(candidates.includes('http://100.64.7.7:8788'), 'the learned daemon is probed again');
  // A learned host also expands to its other known Focusa ports.
  assert.ok(candidates.includes('http://100.64.7.7:8787'));
  assert.ok(candidates.includes('http://100.64.7.7:18787'));
});

test('an origin the device cannot reach is reported, never invented', async () => {
  const { discoverDaemons } = await import('../src/lib/discovery.mjs');
  const result = await discoverDaemons(chromeWith(), { fetchImpl: async () => { throw new Error('down'); } });
  assert.deepEqual(result.found, []);
  assert.ok(result.answers.every((a) => a.ok === false));
});

test('discovery only probes origins this extension is actually granted', async () => {
  const { reachableOriginFilter, discoverDaemon } = await import('../src/lib/discovery.mjs');
  // This device's manifest grants these three (plus the UIAI bridge).
  const chromeApi = {
    permissions: { getAll: async () => ({ origins: ['http://127.0.0.1/*', 'http://localhost/*', 'http://100.115.92.26/*'] }) },
    storage: { local: { get: async () => ({}), set: async () => {} } },
  };
  const reachable = await reachableOriginFilter(chromeApi);
  assert.equal(await reachable('http://127.0.0.1:8787'), true);
  assert.equal(await reachable('http://100.115.92.26:8787'), true);
  // Not granted: probing it would be refused by CORS and print an error.
  assert.equal(await reachable('http://[::1]:8787'), false);
  assert.equal(await reachable('https://kh.example:8787'), false);

  const probed = [];
  const result = await discoverDaemon(chromeApi, {
    fetchImpl: async (url) => { probed.push(String(url)); return new Response(JSON.stringify({ status: 'healthy' }), { status: 200 }); },
  });
  assert.ok(!probed.some((u) => u.includes('[::1]')), 'an ungranted candidate is never requested');
  assert.ok(probed.every((u) => !u.includes('kh.example')), 'remote candidates need pairing first');
  assert.ok(result.found.length >= 1);
});

test('with no permissions API nothing is filtered', async () => {
  const { reachableOriginFilter } = await import('../src/lib/discovery.mjs');
  const reachable = await reachableOriginFilter({ storage: { local: { get: async () => ({}) } } });
  assert.equal(await reachable('http://[::1]:8787'), true);
});

test('a seed the device cannot reach is refused before any request', async () => {
  const { seedCandidates } = await import('../src/lib/discovery.mjs');
  const { reachableOriginFilter } = await import('../src/lib/discovery.mjs');
  const chromeApi = { permissions: { getAll: async () => ({ origins: ['http://127.0.0.1/*'] }) } };
  const reachable = await reachableOriginFilter(chromeApi);
  const results = [];
  for (const origin of seedCandidates('100.64.9.9')) if (await reachable(origin)) results.push(origin);
  assert.deepEqual(results, [], 'an ungranted tailnet seed is refused rather than probed');
});

test('a daemon previews what it actually holds, before connecting', async () => {
  const { previewDaemon } = await import('../src/lib/discovery.mjs');
  const preview = await previewDaemon({
    baseUrl: 'http://127.0.0.1:8787',
    fetchImpl: async (url) => {
      const path = new URL(String(url)).pathname;
      if (path === '/v1/health') {
        return new Response(JSON.stringify({ ok: true, version: '0.9.194-dev', uptime_ms: 93000000, daemon: { pid: 330, start_token: 'start-token-1' }, persistence: { batches_total: 1675, failures_total: 0, queue_depth: 0, last_write_duration_ms: 8 } }), { status: 200 });
      }
      return new Response(JSON.stringify({ project_count: 2, projects: [{ canonical_name: 'focusa-workforce-extension' }, { canonical_name: 'veragensia' }] }), { status: 200 });
    },
  });
  assert.equal(preview.alive, true);
  assert.equal(preview.pid, 330);
  assert.equal(preview.batches, 1675, 'persistence counters stay available as diagnostics');
  assert.equal(preview.failures, 0);
  assert.deepEqual(preview.projects, ['focusa-workforce-extension', 'veragensia']);
  // Identity is what lets one daemon be shown once, however many addresses reach it.
  assert.equal(preview.identity, 'start-token-1');
  assert.equal(preview.degraded, false);
});

test('a daemon with no project chosen says so, instead of claiming zero projects', async () => {
  const { previewDaemon } = await import('../src/lib/discovery.mjs');
  const preview = await previewDaemon({
    baseUrl: 'http://100.64.1.9:8787',
    fetchImpl: async (url) => (new URL(String(url)).pathname === '/v1/health'
      ? new Response(JSON.stringify({ ok: true, version: '0.9.194-dev', uptime_ms: 93000000, daemon: { pid: 7, start_token: 'tok' } }), { status: 200 })
      : new Response(JSON.stringify({ failure_class: 'project_root_selection_required', project_count: 0, projects: [] }), { status: 200 })),
  });
  assert.equal(preview.projectSelectionRequired, true);
  assert.deepEqual(preview.projects, []);
  assert.equal(preview.version, '0.9.194-dev');
  assert.ok(preview.uptimeMs > 0);
});

test('a preview degrades honestly when only health answers', async () => {
  const { previewDaemon } = await import('../src/lib/discovery.mjs');
  const preview = await previewDaemon({
    baseUrl: 'http://100.64.1.9:8787',
    fetchImpl: async (url) => (new URL(String(url)).pathname === '/v1/health'
      ? new Response(JSON.stringify({ ok: true, daemon: { pid: 9 }, persistence: { batches_total: 3, failures_total: 2 } }), { status: 200 })
      : new Response('{}', { status: 403 })),
  });
  assert.equal(preview.alive, true);
  assert.equal(preview.projectListKnown, false, 'an unreadable project list is not invented');
  assert.deepEqual(preview.projects, []);
  assert.equal(preview.degraded, true, 'reported failures are surfaced, not hidden');
});

test('an unreachable daemon previews as not alive rather than throwing', async () => {
  const { previewDaemon } = await import('../src/lib/discovery.mjs');
  const preview = await previewDaemon({ baseUrl: 'http://127.0.0.1:8787', fetchImpl: async () => { throw new Error('down'); } });
  assert.equal(preview.alive, false);
  assert.equal(preview.batches, null);
});
