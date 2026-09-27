import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEVICE_CANDIDATES,
  discoveryCandidates,
  discoverDaemon,
  hasKnownDaemon,
  probeDaemon,
  rememberDaemon,
} from '../src/workforce/lib/discovery.js';

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
  const { hostCandidates, PORT_VARIANTS } = await import('../src/workforce/lib/discovery.js');
  assert.deepEqual(PORT_VARIANTS, [8787, 8788, 8789, 18787], 'a small fixed set, not a range');
  assert.equal(hostCandidates('100.64.1.9').length, PORT_VARIANTS.length);
  // A tailnet literal speaks HTTP; anything else must be HTTPS.
  assert.ok(hostCandidates('100.64.1.9').every((u) => u.startsWith('http://')));
  assert.ok(hostCandidates('kh.tailnet.ts.net').every((u) => u.startsWith('https://')));
});

test('a seed accepts a name, an address, or a URL with its own port', async () => {
  const { seedCandidates } = await import('../src/workforce/lib/discovery.js');
  assert.deepEqual(seedCandidates('kh:9999'), ['https://kh:9999'], 'an explicit port is respected exactly');
  assert.equal(seedCandidates('kh').length, 4, 'a bare name is tried on the known ports');
  assert.deepEqual(seedCandidates('127.0.0.1'), ['http://127.0.0.1:8787'], 'loopback is one port');
  assert.deepEqual(seedCandidates('https://kh.example:8443'), ['https://kh.example:8443']);
  assert.deepEqual(seedCandidates(''), []);
});

test('every daemon that answered is learned for the next cold start', async () => {
  const { rememberDaemon, discoveryCandidates } = await import('../src/workforce/lib/discovery.js');
  const chromeApi = chromeWith();
  await rememberDaemon(chromeApi, { baseUrl: 'http://100.64.7.7:8788', label: 'Tailnet' });
  const candidates = await discoveryCandidates(chromeApi);
  assert.ok(candidates.includes('http://100.64.7.7:8788'), 'the learned daemon is probed again');
  // A learned host also expands to its other known Focusa ports.
  assert.ok(candidates.includes('http://100.64.7.7:8787'));
  assert.ok(candidates.includes('http://100.64.7.7:18787'));
});

test('an origin the device cannot reach is reported, never invented', async () => {
  const { discoverDaemons } = await import('../src/workforce/lib/discovery.js');
  const result = await discoverDaemons(chromeWith(), { fetchImpl: async () => { throw new Error('down'); } });
  assert.deepEqual(result.found, []);
  assert.ok(result.answers.every((a) => a.ok === false));
});
