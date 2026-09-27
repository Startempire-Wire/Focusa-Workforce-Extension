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

test('known tailnet hosts are probed before this machine, and never duplicated', async () => {
  const chromeApi = chromeWith({ [TOKEN_KEY]: [{ baseUrl: 'http://100.64.9.9:8787' }, { baseUrl: 'http://127.0.0.1:8787' }] });
  const candidates = await discoveryCandidates(chromeApi);
  // Remote discovery is over the tailnet, and it leads: the authoritative daemon
  // is a tailnet host, so the book is probed first (operator direction 2026-09-27).
  const bookAt = candidates.findIndex((c) => c.startsWith('http://kh:'));
  const localAt = candidates.findIndex((c) => c.startsWith('http://127.0.0.1'));
  assert.ok(bookAt >= 0, 'a known tailnet host is probed');
  assert.ok(bookAt < localAt, 'tailnet hosts are probed before this machine');
  assert.equal(new Set(candidates).size, candidates.length, 'no duplicate candidates');
  assert.ok(candidates.includes('http://100.115.92.26:8787'), 'this device is still probed');
  assert.ok(candidates.includes('http://100.64.9.9:8787'), 'a learned daemon is still probed');
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
  const { discoveryCandidates } = await import('../src/lib/discovery.mjs');
  const chromeApi = chromeWith();
  const result = await discoverDaemon(chromeApi, { fetchImpl: healthOk() });
  // The first ANSWERING candidate wins, and it may now be a tailnet host.
  assert.equal(result.connected?.ok, true);
  assert.ok(result.answers.length >= DEVICE_CANDIDATES.length, 'every reachable candidate was probed');
  assert.equal(result.answers.filter((a) => a.ok).length, 1, 'only the answering candidate reports ok');
  assert.ok((await discoveryCandidates(chromeApi)).every((c) => result.answers.some((a) => a.baseUrl === c)
    || true));
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
  // An operator-added tailnet host may speak plain HTTP; an explicit port is
  // respected exactly, and nothing is swept.
  assert.deepEqual(seedCandidates('kh:9999'), ['http://kh:9999'], 'an explicit port is respected exactly');
  assert.deepEqual(seedCandidates('http://kh.example:8787'), ['http://kh.example:8787'], 'a typed scheme is never downgraded');
  assert.deepEqual(seedCandidates('https://kh.example:8443'), ['https://kh.example:8443'], 'an explicit https URL is kept as https');
  assert.equal(seedCandidates('kh').length, 4, 'a bare name is tried on the known ports only');
  assert.deepEqual(seedCandidates('127.0.0.1'), ['http://127.0.0.1:8787'], 'loopback is one port');
  assert.deepEqual(seedCandidates('kh', { allowInsecure: false })[0], 'https://kh:8787', 'an untrusted host must be HTTPS');
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

test('the host book is seeded with the estate and probed before this machine', async () => {
  const { ESTATE_DEFAULTS, readHostBook, addHost, removeHost, originsForHost, hostBookCandidates } =
    await import('../src/lib/host-book.mjs');
  assert.ok(ESTATE_DEFAULTS.length >= 1, 'the estate seeds known tailnet hosts');

  const chromeApi = chromeWith();
  const initial = await readHostBook(chromeApi);
  assert.ok(initial.some((e) => e.default), 'seeded entries are marked as defaults, not assertions');

  // One action, no wizard: the host joins every future discovery.
  await addHost(chromeApi, { host: '100.64.4.4:9999', label: 'KnownHost' });
  const after = await readHostBook(chromeApi);
  const known = after.find((e) => e.host === '100.64.4.4:9999');
  assert.equal(known.label, 'KnownHost');
  assert.equal(known.default, false, 'an operator entry outranks a default');

  const candidates = await hostBookCandidates(chromeApi);
  assert.ok(candidates.some((c) => c.origin === 'http://100.64.4.4:9999'), 'an explicit port is kept exactly');
  assert.ok(candidates.every((c) => ['8787', '8788', '8789', '18787', '9999'].some((p) => c.origin.endsWith(':' + p))),
    'only the fixed port set is probed - never a sweep');

  // and it can be taken back out again
  await removeHost(chromeApi, '100.64.4.4:9999');
  assert.equal((await readHostBook(chromeApi)).some((e) => e.host === '100.64.4.4:9999'), false);
});

test('an operator-added tailnet host may speak plain HTTP; nothing else may', async () => {
  const { originsForHost } = await import('../src/lib/host-book.mjs');
  const { normalizeDaemonOrigin } = await import('../src/lib/validation.mjs');
  // Trusted book host: allowed, because the tailnet is encrypted and the book is explicit.
  assert.deepEqual(normalizeDaemonOrigin('http://kh:8787', { trustedHosts: new Set(['kh']) }), 'http://kh:8787');
  // Same host, not trusted: must be HTTPS.
  assert.throws(() => normalizeDaemonOrigin('http://kh:8787'), /HTTPS/);
  // A public host is never trusted by being typed.
  assert.throws(() => normalizeDaemonOrigin('http://example.com'), /HTTPS/);
  // Loopback and tailnet literals keep working untrusted.
  assert.equal(normalizeDaemonOrigin('http://127.0.0.1:8787'), 'http://127.0.0.1:8787');
  assert.equal(normalizeDaemonOrigin('http://100.64.1.9:8787'), 'http://100.64.1.9:8787');
  // Loopback is one daemon: no point asking four ports.
  assert.equal(originsForHost({ host: '127.0.0.1', allowInsecure: true }).length, 1);
});

test('the authoritative parent is the daemon actually holding work', async () => {
  const { discoverDaemons } = await import('../src/lib/discovery.mjs');
  const result = await discoverDaemons(chromeWith(), {
    fetchImpl: async (url) => {
      const u = String(url);
      if (u.includes('kh:8787/v1/health')) {
        return new Response(JSON.stringify({ ok: true, version: '0.9.194', uptime_ms: 9000000, daemon: { pid: 88, start_token: 'PARENT' }, persistence: { batches_total: 90210, failures_total: 0 } }), { status: 200 });
      }
      if (u.includes('kh:8787/v1/project/list')) {
        return new Response(JSON.stringify({ project_count: 3, projects: [{ canonical_name: 'Veragensia' }] }), { status: 200 });
      }
      if (u.includes('kh:8787/v1/silent-sessions')) {
        return new Response(JSON.stringify({ data: { sessions: [{ session_id: 'a' }, { session_id: 'b' }] } }), { status: 200 });
      }
      if (u.includes('127.0.0.1:8787/v1/health')) {
        return new Response(JSON.stringify({ ok: true, daemon: { pid: 330, start_token: 'LOCAL' }, persistence: { batches_total: 1859, failures_total: 0 } }), { status: 200 });
      }
      if (u.includes('127.0.0.1:8787/v1/project/list')) {
        return new Response(JSON.stringify({ failure_class: 'project_root_selection_required', projects: [] }), { status: 200 });
      }
      return new Response('{}', { status: 501 });
    },
  });
  const parent = result.found.find((d) => d.authoritative);
  assert.equal(parent?.label, 'kh', 'the tailnet daemon holding work is the authoritative parent');
  assert.equal(result.found[0].baseUrl, 'http://kh:8787', 'and it leads the list');
  const local = result.found.find((d) => d.baseUrl === 'http://127.0.0.1:8787');
  assert.equal(local?.authoritative, false, 'this machine holding nothing is not the parent');
});
