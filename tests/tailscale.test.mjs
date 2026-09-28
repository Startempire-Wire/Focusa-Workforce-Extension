import test from 'node:test';
import assert from 'node:assert/strict';
import { readTailscaleTopology, tailnetCandidates } from '../src/lib/tailscale.mjs';

// A payload shaped exactly like tailscaled's /localapi/v0/status. Fixtures are
// fictional: no real estate, host, or tailnet belongs in the test suite.
const status = {
  BackendState: 'Running',
  MagicDNSSuffix: 'tail0000.ts.net',
  Self: { ID: 'self-1', HostName: 'laptop', DNSName: 'laptop.tail0000.ts.net.', TailscaleIPs: ['100.101.102.103', 'fd7a:115c::1'] },
  Peer: {
    p1: { ID: 'p1', HostName: 'parent', DNSName: 'parent.tail0000.ts.net.', TailscaleIPs: ['100.64.9.9', 'fd7a:115c::2'], Online: true, OS: 'linux' },
    p2: { ID: 'p2', HostName: 'relay', DNSName: 'relay.tail0000.ts.net.', TailscaleIPs: ['100.64.9.10'], Online: true, OS: 'linux' },
    p3: { ID: 'p3', HostName: 'desk', DNSName: 'desk.tail0000.ts.net.', TailscaleIPs: ['100.64.9.11'], Online: false, OS: 'macOS' },
    p4: { ID: 'p4', HostName: 'phone', DNSName: 'phone.tail0000.ts.net.', TailscaleIPs: ['100.64.9.12'], Online: true, OS: 'android' },
  },
};

const jsonFetch = (payload, status = 200) => async () => new Response(JSON.stringify(payload), { status });

test('the tailnet tells the extension who its peers are', async () => {
  const topology = await readTailscaleTopology({ connectNative: null, fetchImpl: jsonFetch(status) });
  assert.equal(topology.backend, 'Running');
  assert.equal(topology.suffix, 'tail0000.ts.net');
  assert.equal(topology.self.name, 'laptop');
  assert.deepEqual(topology.self.ips, ['100.101.102.103'], 'IPv6 is dropped - Focusa binds IPv4');
  assert.equal(topology.peers.length, 4);
  // Online peers first: those are the machines most likely running a daemon.
  assert.equal(topology.peers[0].online, true);
  assert.equal(topology.peers.at(-1).online, false, 'the offline peer is last');
  assert.equal(topology.peers.find((p) => p.id === 'p3').name, 'desk');
});

test('every peer becomes a candidate on the fixed port set, never a sweep', async () => {
  const topology = await readTailscaleTopology({ connectNative: null, fetchImpl: jsonFetch(status) });
  const candidates = tailnetCandidates(topology);
  // 4 peers x 4 ports; this machine's own address is not re-listed.
  assert.equal(candidates.length, 16);
  // DNS name first: tailnet reverse proxies route by Host header, so an IP
  // literal can answer 404 where the DNS name proxies to the daemon.
  assert.ok(candidates.some((c) => c.origin === 'http://parent.tail0000.ts.net:8787' && c.peer === 'parent'));
  assert.ok(!candidates.some((c) => c.origin.includes('100.101.102.103')), 'this machine is not a tailnet candidate');
  for (const c of candidates) {
    assert.match(c.origin, /^http:\/\/[a-z0-9-]+\.tail0000\.ts\.net:(8787|8788|8789|18787)$/);
    assert.equal(c.tailnet, true);
  }
  // And it carries the peer's identity, so a daemon is shown by name.
  const relay = candidates.find((c) => c.peer === 'relay');
  assert.equal(relay.online, true);
  assert.equal(relay.os, 'linux');
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
  assert.deepEqual(
    peerOrigins({ dnsName: 'parent.tail0000.ts.net', ips: ['100.64.9.9', 'fd7a::1'] })[0],
    'http://parent.tail0000.ts.net:8787',
    'DNS name first: proxies route by Host header',
  );
  assert.deepEqual(peerOrigins({ ips: ['100.64.9.9', 'fd7a::1'] })[0], 'http://100.64.9.9:8787', 'IP fallback when no DNS name was reported');
  assert.deepEqual(peerOrigins({ ips: [] }), []);
  assert.deepEqual(peerOrigins(null), []);

  // an ungranted tailnet peer is offered, not probed
  const roster = await tailnetRoster({}, { connectNative: null, fetchImpl: jsonFetch(status) });
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
    self: { name: 'laptop', ips: ['100.101.102.103'] },
    peers: [{ id: 'p1', name: 'parent', ips: ['100.64.9.9'], online: true, os: 'linux' }],
    suffix: 'tail0000.ts.net',
  });
  const result = await pending;
  assert.deepEqual(asked, ['io.focusa.workforce.tailscale']);
  assert.equal(result.source, 'native');
  assert.equal(result.peers.length, 1);
  assert.equal(result.peers[0].name, 'parent');
  assert.equal(result.self.name, 'laptop');
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

test('a discovery bridge reports peers and verified daemons', async () => {
  const { readBridgeTopology } = await import('../src/lib/tailscale.mjs');
  const body = {
    ok: true,
    source: 'focusa-discovery-bridge',
    peers: [
      { name: 'parent', dns: 'parent.tail0000.ts.net', ips: ['100.64.9.9'], online: true, os: 'linux' },
      { name: 'desk', dns: 'desk.tail0000.ts.net', ips: ['100.64.9.11'], online: false, os: 'macOS' },
    ],
    daemons: [
      { peer: 'parent', url: 'http://parent.tail0000.ts.net:8787', ok: true, verified: 'ssh',
        summary: { version: '0.9.192', projects: { effective: 'Flow', count: 1, names: ['Flow'] }, sessionCount: 2 } },
    ],
  };
  const fetchImpl = async (url) => String(url).includes(':18989')
    ? new Response(JSON.stringify(body), { status: 200 })
    : new Response('{}', { status: 404 });
  const topology = await readBridgeTopology({ fetchImpl });
  assert.equal(topology.source, 'discovery-bridge');
  assert.equal(topology.peers.length, 2);
  assert.equal(topology.peers[0].name, 'parent');
  assert.equal(topology.verifiedDaemons.length, 1);
  assert.equal(topology.verifiedDaemons[0].url, 'http://parent.tail0000.ts.net:8787');
  assert.equal(topology.verifiedDaemons[0].summary.projects.names[0], 'Flow');
});

test('no bridge anywhere is null, never an error', async () => {
  const { readBridgeTopology } = await import('../src/lib/tailscale.mjs');
  assert.equal(await readBridgeTopology({ fetchImpl: async () => { throw new Error('down'); } }), null);
  assert.equal(await readBridgeTopology({ fetchImpl: async () => new Response('{}', { status: 404 }) }), null);
});

test('merged topology folds bridge, OS client and LocalAPI with bridge first', async () => {
  const { readMergedTopology } = await import('../src/lib/tailscale.mjs');
  const bridgeBody = {
    ok: true, source: 'focusa-discovery-bridge',
    peers: [{ name: 'parent', dns: 'parent.tail0000.ts.net', ips: ['100.64.9.9'], online: true, os: 'linux' }],
    daemons: [{ peer: 'parent', url: 'http://parent.tail0000.ts.net:8787', ok: true }],
  };
  const fetchImpl = async (url) => String(url).includes(':18989')
    ? new Response(JSON.stringify(bridgeBody), { status: 200 })
    : new Response('{}', { status: 404 });
  const merged = await readMergedTopology({ fetchImpl, connectNative: null });
  assert.deepEqual(merged.sources, ['discovery-bridge']);
  assert.equal(merged.peers.length, 1);
  assert.equal(merged.verifiedDaemons[0].url, 'http://parent.tail0000.ts.net:8787');
});
