import test from 'node:test';
import assert from 'node:assert/strict';
import { readTailscaleTopology, tailnetCandidates } from '../src/lib/tailscale.mjs';

// A payload shaped exactly like tailscaled's /localapi/v0/status, with the
// real estate topology (names, addresses, online state).
const status = {
  BackendState: 'Running',
  MagicDNSSuffix: 'tail9229d6.ts.net',
  Self: { ID: 'self-1', HostName: 'chromebook', DNSName: 'chromebook.tail9229d6.ts.net.', TailscaleIPs: ['100.127.113.90', 'fd7a:115c::1'] },
  Peer: {
    p1: { ID: 'p1', HostName: 'ovh-vps', DNSName: 'ovh-vps.tail9229d6.ts.net.', TailscaleIPs: ['100.69.132.82', 'fd7a:115c::2'], Online: true, OS: 'linux' },
    p2: { ID: 'p2', HostName: 'host', DNSName: 'host.tail9229d6.ts.net.', TailscaleIPs: ['100.94.238.56'], Online: true, OS: 'linux' },
    p3: { ID: 'p3', HostName: 'macbook-pro', DNSName: 'macbook-pro.tail9229d6.ts.net.', TailscaleIPs: ['100.113.124.59'], Online: false, OS: 'macOS' },
    p4: { ID: 'p4', HostName: 'phone', DNSName: 'phone.tail9229d6.ts.net.', TailscaleIPs: ['100.107.195.76'], Online: true, OS: 'android' },
  },
};

const jsonFetch = (payload, status = 200) => async () => new Response(JSON.stringify(payload), { status });

test('the tailnet tells the extension who its peers are', async () => {
  const topology = await readTailscaleTopology({ connectNative: null, fetchImpl: jsonFetch(status) });
  assert.equal(topology.backend, 'Running');
  assert.equal(topology.suffix, 'tail9229d6.ts.net');
  assert.equal(topology.self.name, 'chromebook');
  assert.deepEqual(topology.self.ips, ['100.127.113.90'], 'IPv6 is dropped - Focusa binds IPv4');
  assert.equal(topology.peers.length, 4);
  // Online peers first: those are the machines most likely running a daemon.
  assert.equal(topology.peers[0].online, true);
  assert.equal(topology.peers.at(-1).online, false, 'the offline peer is last');
  assert.equal(topology.peers.find((p) => p.id === 'p3').name, 'macbook-pro');
});

test('every peer becomes a candidate on the fixed port set, never a sweep', async () => {
  const topology = await readTailscaleTopology({ connectNative: null, fetchImpl: jsonFetch(status) });
  const candidates = tailnetCandidates(topology);
  // 4 peers x 4 ports; this machine's own address is not re-listed.
  assert.equal(candidates.length, 16);
  assert.ok(candidates.some((c) => c.origin === 'http://100.94.238.56:8787' && c.peer === 'host'));
  assert.ok(!candidates.some((c) => c.origin.includes('100.127.113.90')), 'this machine is not a tailnet candidate');
  for (const c of candidates) {
    assert.match(c.origin, /^http:\/\/100\.\d+\.\d+\.\d+:(8787|8788|8789|18787)$/);
  }
  // And it carries the peer's identity, so a daemon is shown by name.
  const ovh = candidates.find((c) => c.peer === 'ovh-vps');
  assert.equal(ovh.online, true);
  assert.equal(ovh.os, 'linux');
});

test('an unavailable LocalAPI is reported as absent, never invented', async () => {
  const refused = await readTailscaleTopology({ connectNative: null, fetchImpl: async () => { throw new Error('connection refused'); } });
  assert.equal(refused, null);
  assert.deepEqual(tailnetCandidates(refused), []);
  const errored = await readTailscaleTopology({ connectNative: null, fetchImpl: async () => new Response('nope', { status: 401 }) });
  assert.equal(errored, null, 'a LocalAPI that refuses us yields no peers, not a guess');
});

test('a payload with no peers is honest rather than fatal', async () => {
  const topology = await readTailscaleTopology({ connectNative: null, fetchImpl: jsonFetch({ BackendState: 'Running', Self: status.Self, Peer: {} }) });
  assert.deepEqual(topology.peers, []);
  assert.deepEqual(tailnetCandidates(topology), []);
});

test('choosing a tailnet machine proves a daemon is there before attaching', async () => {
  // Guards the roster affordance: a machine with no daemon must be reported as
  // not answering, never silently left as the attached origin.
  const { peerOrigins, tailnetRoster } = await import('../src/lib/discovery.mjs');
  assert.deepEqual(peerOrigins({ ips: ['100.94.238.56', 'fd7a::1'] })[0], 'http://100.94.238.56:8787');
  assert.deepEqual(peerOrigins({ ips: [] }), []);
  assert.deepEqual(peerOrigins(null), []);

  // an ungranted tailnet peer is offered, not probed
  const roster = await tailnetRoster({}, { fetchImpl: jsonFetch(status) });
  assert.equal(roster.peers.length, 4);
  assert.ok(roster.peers.every((p) => p.ips.length === 1), 'IPv4 only');
});

test('the native host is asked first, because it is the source that exists', async () => {
  const { readTailscaleNative, NATIVE_HOST } = await import('../src/lib/tailscale.mjs');
  assert.equal(NATIVE_HOST, 'io.focusa.workforce.tailscale');
  // A host that answers is used without touching the network at all.
  const listeners = [];
  const port = {
    onMessage: { addListener: (fn) => listeners.push(['message', fn]) },
    onDisconnect: { addListener: (fn) => listeners.push(['disconnect', fn]) },
    postMessage: (message) => { port.sent = message; },
    disconnect: () => {},
  };
  const asked = [];
  // start the call, then answer like the host does (the promise resolves on reply)
  const pending = readTailscaleNative({
    connectNative: (name) => { asked.push(name); return port; },
  });
  listeners.find(([kind]) => kind === 'message')[1]({
    self: { name: 'chromebook', ips: ['100.127.113.90'] },
    peers: [{ id: 'p1', name: 'host-philoveracity-com', ips: ['100.94.238.56'], online: true, os: 'linux' }],
    suffix: 'tail9229d6.ts.net',
  });
  const result = await pending;
  assert.deepEqual(asked, ['io.focusa.workforce.tailscale']);
  assert.equal(result.source, 'native');
  assert.equal(result.peers.length, 1);
  assert.equal(result.peers[0].name, 'host-philoveracity-com');
  assert.equal(result.self.name, 'chromebook');
});

test('a missing or refused native host is not an error', async () => {
  const { readTailscaleNative } = await import('../src/lib/tailscale.mjs');
  // no native messaging available at all
  assert.equal(await readTailscaleNative({ connectNative: null }), null);
  // host not installed: connectNative throws
  assert.equal(await readTailscaleNative({ connectNative: () => { throw new Error('Not found'); } }), null);
  // host refused (wrong extension id): disconnects immediately
  const listeners = [];
  const port = {
    onMessage: { addListener: (fn) => listeners.push(['message', fn]) },
    onDisconnect: { addListener: (fn) => listeners.push(['disconnect', fn]) },
    postMessage: () => {},
    disconnect: () => {},
  };
  const pending = readTailscaleNative({ connectNative: () => port });
  listeners.find(([kind]) => kind === 'disconnect')[1]();
  assert.equal(await pending, null);
});
