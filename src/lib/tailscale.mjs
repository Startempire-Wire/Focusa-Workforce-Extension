/**
 * Tailnet discovery via the Tailscale LocalAPI.
 *
 * A browser cannot enumerate a network, and a tailnet is deliberately opaque to
 * one. But the tailnet is not opaque to the *machine*: tailscaled publishes a
 * LocalAPI over loopback (documented by Tailscale, served by the same daemon
 * that holds the node key), and Chrome on this Chromebook runs on the same host
 * as tailscaled. So the extension can ask the tailnet itself who its peers are -
 * first-party, no scanning, no guessing.
 *
 *   GET http://127.0.0.1:41112/localapi/v0/status
 *
 * Only one extra origin is granted, and it is loopback on a single port. If the
 * LocalAPI is absent (older tailscaled, a different port, or a machine without
 * it) this returns null and discovery falls back to the host book - it never
 * invents peers.
 */

const LOCALAPI_CANDIDATES = Object.freeze([
  'http://127.0.0.1:41112/localapi/v0/status',
  'http://localhost:41112/localapi/v0/status',
]);

/**
 * The discovery bridge is a tiny read-only HTTP service that may run on this
 * machine (same pattern as the daemon loopback bridges): it enumerates the
 * tailnet from `tailscale status` and verifies remote daemons over SSH, and it
 * serves the result to any browser on the machine. Reached by platform
 * convention names only — never an address — so there is nothing
 * machine-specific to compile in. Absent on machines without it: every read
 * degrades to null and the other sources carry on.
 */
const DISCOVERY_BRIDGE_PORT = 18989;
const DISCOVERY_BRIDGE_CANDIDATES = Object.freeze([
  `http://localhost:${DISCOVERY_BRIDGE_PORT}/v1/discovery/tailnet`,
  `http://127.0.0.1:${DISCOVERY_BRIDGE_PORT}/v1/discovery/tailnet`,
  `http://penguin.linux.test:${DISCOVERY_BRIDGE_PORT}/v1/discovery/tailnet`,
]);

export const NATIVE_HOST = 'io.focusa.workforce.tailscale';
const NATIVE_TIMEOUT_MS = 6000;
const CACHE_KEY = 'focusa.workforce.tailnet_cache.v1';
const CACHE_TTL_MS = 60_000;

/**
 * The tailnet is read once and remembered briefly.
 *
 * Each read spawns a process (the native host runs `tailscale status`), and a
 * cold start asks for it more than once - the roster, the candidates, the
 * labels. Spawning it repeatedly is slow enough that the roster came back empty
 * on a first paint. A minute of memory (mirrored into extension storage, so a
 * new tab is instant) removes the flicker without inventing anything: the peer
 * list is a fact, just not a per-render one.
 */
let memo = null;
let memoAt = 0;

function fresh(since) { return since > 0 && Date.now() - since < CACHE_TTL_MS && memo; }

/** Clear the remembered tailnet (used by tests and by an explicit refresh). */
export function resetTailnetCache() { memo = null; memoAt = 0; }

function remember(topology) {
  if (!topology) return null;
  memo = topology;
  memoAt = Date.now();
  try {
    globalThis.chrome?.storage?.local
      ?.set({ [CACHE_KEY]: { topology, at: memoAt } })
      ?.catch?.(() => {});
  } catch { /* the cache is a convenience */ }
  return topology;
}

async function cachedFromStorage() {
  try {
    const raw = (await globalThis.chrome?.storage?.local?.get(CACHE_KEY))?.[CACHE_KEY];
    if (raw && Date.now() - raw.at < CACHE_TTL_MS) return raw.topology;
  } catch { /* ignore */ }
  return null;
}

/**
 * Ask the operating system's tailscale client, through Chrome's native
 * messaging channel.
 *
 * This is the path that actually works on this estate: tailscaled is reachable
 * only through its unix socket, and the LocalAPI is not exposed on TCP (verified
 * 2026-09-27: no `Listen` preference, nothing on 4111x). A browser cannot open a
 * unix socket, and native messaging is the supported bridge to a local program.
 * It is also the portable one: wherever the extension and the tailscale CLI are
 * installed, the same call works.
 *
 * @returns {Promise<null | object>} null when the host is not installed.
 */
export function readTailscaleNative({
  connectNative = globalThis.chrome?.runtime?.connectNative,
  timeoutMs = NATIVE_TIMEOUT_MS,
} = {}) {
  // Explicitly passing null/undefined-as-undefined means "not available here";
  // only a real function is an available channel.
  if (typeof connectNative !== 'function') return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try { port?.disconnect(); } catch { /* already gone */ }
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    let port;
    try {
      port = connectNative(NATIVE_HOST);
    } catch {
      clearTimeout(timer);
      resolve(null);
      return;
    }
    port.onMessage.addListener((message) => {
      clearTimeout(timer);
      if (message && (message.peers || message.localAddresses)) finish(normalizeTopology(message));
      else finish(null);
    });
    port.onDisconnect.addListener(() => {
      clearTimeout(timer);
      // Not installed, or not permitted for this extension id: not an error.
      finish(null);
    });
    try { port.postMessage({ type: 'who-is-out-there' }); } catch {
      clearTimeout(timer);
      finish(null);
    }
  });
}

/** A peer worth probing: a machine that could be running a Focusa daemon. */
/** One normaliser for both sources, so the two can never disagree. */
function normalizeTopology(body) {
  const ipv4 = (ips) => (Array.isArray(ips) ? ips : []).filter((ip) => typeof ip === 'string' && !ip.includes(':'));
  // The native host returns `peers`; the LocalAPI returns `Peer`.
  const peers = Object.values(body?.peers ?? body?.Peer ?? {}).map((peer) => Object.freeze({
    id: peer?.id ?? peer?.ID ?? null,
    name: peer?.name ?? nameOf(peer ?? {}) ?? null,
    dnsName: (peer?.dnsName ?? peer?.DNSName ?? '').replace(/\.$/, '') || null,
    ips: Object.freeze(ipv4(peer?.ips ?? peer?.TailscaleIPs)),
    online: peer?.online === true || peer?.Online === true,
    os: peer?.os ?? peer?.OS ?? null,
    isSelf: false,
  })).filter((peer) => peer.ips.length);
  peers.sort((a, b) => (Number(b.online) - Number(a.online)) || String(a.name).localeCompare(String(b.name)));
  const selfBody = body?.self ?? body?.Self ?? {};
  const localAddresses = Array.isArray(body?.localAddresses)
    ? body.localAddresses.filter((ip) => typeof ip === 'string' && !ip.includes(':'))
    : [];
  return Object.freeze({
    localAddresses: Object.freeze(localAddresses),
    self: Object.freeze({
      id: selfBody?.id ?? selfBody?.ID ?? null,
      name: ((selfBody?.dnsName ?? selfBody?.DNSName ?? '').split('.')[0] || selfBody?.name || selfBody?.HostName || null),
      dnsName: (selfBody?.dnsName ?? selfBody?.DNSName ?? '').replace(/\.$/, '') || null,
      ips: Object.freeze(ipv4(selfBody?.ips ?? selfBody?.TailscaleIPs)),
      isSelf: true,
    }),
    peers: Object.freeze(peers),
    suffix: body?.suffix ?? body?.MagicDNSSuffix ?? null,
    backend: body?.backend ?? body?.BackendState ?? null,
    source: 'native',
  });
}

function peerCandidates(peer) {
  const ips = Array.isArray(peer?.TailscaleIPs) ? peer.TailscaleIPs : [];
  // IPv4 first: Focusa binds IPv4 loopback, and IPv6 tailnet addresses add noise.
  return ips.filter((ip) => typeof ip === 'string' && !ip.includes(':'));
}

function nameOf(peer) {
  const dns = String(peer?.dnsName ?? peer?.DNSName ?? '').replace(/\.$/, '');
  const short = dns.split('.')[0];
  return short || peer?.hostName || peer?.HostName || null;
}

/**
 * Ask the local tailscaled who the tailnet is.
 *
 * @param {{fetchImpl?: function, timeoutMs?: number}} [options]
 * @returns {Promise<null | {self: object, peers: any[], suffix: string|null}>}
 *   null when the LocalAPI is not available here.
 */
export async function readTailscaleTopology({ fetchImpl = globalThis.fetch, timeoutMs = 2500, connectNative, force = false } = {}) {
  // The cache serves the ambient path only. A caller that names its source
  // (connectNative: null for the LocalAPI path, or force) is asking a question
  // about THAT source, and must not be answered from a previous read.
  if (!force && connectNative === undefined) {
    const warm = fresh(memoAt);
    if (warm) return warm;
    const stored = await cachedFromStorage();
    if (stored) { memo = stored; memoAt = Date.now(); return stored; }
  }
  // The OS client first: it is the source that is actually available.
  // `connectNative: null` is an explicit "this build has no native channel"
  // (used by the LocalAPI tests); omitting it uses Chrome's, when present.
  const native = await (connectNative === undefined
    ? readTailscaleNative()
    : readTailscaleNative({ connectNative })).catch(() => null);
  if (native?.peers?.length || native?.self || native?.localAddresses?.length) return remember(native);
  for (const url of LOCALAPI_CANDIDATES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: 'GET', cache: 'no-store', signal: controller.signal,
        headers: { accept: 'application/json' },
      });
      if (!response.ok) continue;
      const body = await response.json().catch(() => null);
      if (!body || typeof body !== 'object') continue;

      return remember({ ...normalizeTopology(body), source: 'localapi' });
    } catch { /* try the next LocalAPI address */ }
    finally { clearTimeout(timer); }
  }
  return null;
}

/**
 * Read the discovery bridge if one answers on this machine. The bridge reports
 * the tailnet's peers plus daemons it already verified (via the operator's own
 * SSH config), so a browser that cannot enumerate anything itself still learns
 * real, reachable daemon URLs. HTTP is fine here: loopback and the container
 * link address never leave the machine.
 *
 * @returns {Promise<null|object>} normalized topology with `source` set, plus
 *   an optional `verifiedDaemons` list, or null when no bridge answers.
 */
export async function readBridgeTopology({ fetchImpl = globalThis.fetch, timeoutMs = 2500 } = {}) {
  for (const url of DISCOVERY_BRIDGE_CANDIDATES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: 'GET', cache: 'no-store', signal: controller.signal,
        headers: { accept: 'application/json' },
      });
      if (!response.ok) continue;
      const body = await response.json().catch(() => null);
      if (!body || body.ok !== true || !Array.isArray(body.peers)) continue;
      const topology = normalizeTopology({ Peer: Object.fromEntries(
        body.peers.map((peer, index) => [`bridge-${index}`, {
          HostName: peer.name,
          DNSName: peer.dns,
          TailscaleIPs: peer.ips,
          Online: peer.online,
          OS: peer.os,
        }]),
      ) });
      const verifiedDaemons = Array.isArray(body.daemons)
        ? body.daemons.filter((daemon) => daemon?.ok && typeof daemon?.url === 'string')
        : [];
      return { ...topology, source: 'discovery-bridge', verifiedDaemons };
    } catch { /* try the next bridge address */ }
    finally { clearTimeout(timer); }
  }
  return null;
}

/**
 * Read every tailnet source and merge: discovery bridge first (it carries
 * verified daemons), then the OS client, then the LocalAPI. Peers merge by DNS
 * name so one machine never appears twice. Nothing is invented: only hosts a
 * source actually reported are ever probed.
 *
 * @returns {Promise<{peers: any[], verifiedDaemons: any[], sources: string[]}>}
 */
export async function readMergedTopology({ fetchImpl = globalThis.fetch, timeoutMs = 2500, connectNative, force = false } = {}) {
  const [bridged, owned] = await Promise.all([
    readBridgeTopology({ fetchImpl, timeoutMs }).catch(() => null),
    readTailscaleTopology({ fetchImpl, timeoutMs, connectNative, force }).catch(() => null),
  ]);
  const seen = new Set();
  const peers = [];
  for (const topology of [bridged, owned]) {
    for (const peer of topology?.peers ?? []) {
      const key = peer.dnsName || peer.ips.join(',');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      peers.push(peer);
    }
  }
  return {
    peers,
    verifiedDaemons: bridged?.verifiedDaemons ?? [],
    sources: [bridged && 'discovery-bridge', owned && owned.source].filter(Boolean),
  };
}

/**
 * Candidate origins for every peer that could be running Focusa, on the fixed
 * port set. Peers are probed, never swept: one host, four ports.
 *
 * Addresses use the tailnet DNS name first: several tailnet reverse proxies
 * (including `tailscale serve`) route by Host header, so an IP literal can
 * answer 404 where the DNS name proxies to the daemon.
 *
 * @param {any} topology result of readTailscaleTopology
 * @param {{ports?: readonly number[]}} [options]
 */
export function tailnetCandidates(topology, { ports = [8787, 8788, 8789, 18787] } = {}) {
  if (!topology?.peers?.length) return [];
  const out = [];
  for (const peer of topology.peers) {
    // This machine's own tailnet address is already covered by the device
    // candidates; probing it twice would list the same daemon twice.
    if (peer.isSelf) continue;
    const host = peer.dnsName || peer.ips[0];
    if (!host) continue;
    for (const port of ports) {
      out.push(Object.freeze({
        origin: `http://${host}:${port}`,
        host,
        peer: peer.name,
        dnsName: peer.dnsName,
        online: peer.online,
        os: peer.os,
        tailnet: true,
      }));
    }
  }
  return Object.freeze(out);
}
