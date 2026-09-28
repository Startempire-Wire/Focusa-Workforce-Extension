/**
 * Daemon discovery (WP-1.1.1) — the extension finds Focusa; the operator does
 * not configure it.
 *
 * Strategy, in the order the product cares about:
 *
 *   1. Remembered daemons. Anything that answered before is tried first, so a
 *      second launch connects with no probing at all.
 *   2. This device. Browser loopback (ChromeOS and desktop), the Crostini
 *      crosvm veth bridge, and the tailnet address of this machine.
 *   3. Network daemons. Peers learned on the tailnet (and any explicitly
 *      remembered private address) are probed too. Reaching a *remote* origin
 *      needs that origin's host permission, so the UI offers a single click to
 *      connect rather than a configuration form.
 *
 * Discovery is read-only: it only ever asks GET /v1/health. It never mutates an
 * owner state, and it invents nothing — a candidate that does not answer is
 * simply not there.
 *
 * Verified live on this estate 2026-09-27: the daemon answers on browser
 * loopback and on the machine's own other interfaces (a container bridge, a
 * VPN, a second NIC). Those addresses differ on every computer, so they are
 * REPORTED at runtime by the local host program rather than compiled in. Where
 * no host program is installed, discovery still works: loopback, the hosts the
 * operator has added, and anything already learned are all probed.
 */

const PORT = 8787;
const HEALTH_PATH = '/v1/health';

/**
 * Focusa does not always listen on 8787. For a host this device already knows,
 * a small, fixed set of plausible ports is tried — this is a handful of requests
 * to an address the operator already owns, never a sweep of a network.
 */
export const PORT_VARIANTS = Object.freeze([8787, 8788, 8789, 18787]);
import { listLocalEnvironments } from './storage.mjs';
import { daemonSchemeForHost } from './validation.mjs';
import { hostBookCandidates, originsForHost, readHostBook } from './host-book.mjs';
import { readTailscaleTopology, tailnetCandidates } from './tailscale.mjs';
import { readMergedTopology } from './tailscale.mjs';

const REMEMBERED_KEY = 'focusa.workforce.discovered.v1';

/**
 * Only loopback is compiled in. This machine's own non-loopback addresses
 * (Crostini bridges, its tailnet node, a VPN) differ on every computer, so they
 * are REPORTED at runtime by the local host program - never hardcoded, or the
 * product would only ever work on the machine it was built on.
 */
export const DEVICE_CANDIDATES = Object.freeze([
  `http://127.0.0.1:${PORT}`,
  `http://localhost:${PORT}`,
  `http://[::1]:${PORT}`,
]);

export const PROBE_TIMEOUT_MS = 2500;

/**
 * Reachability: an origin is only worth probing if this extension is actually
 * granted access to it. In MV3 a fetch to any other origin is treated as
 * cross-origin and refused by CORS, which both fails and prints an error. Asking
 * the permissions the browser already holds keeps discovery honest and quiet.
 *
 * With no permissions API (unit tests, preview harnesses) nothing is filtered.
 *
 * @param {any} chromeApi
 * @returns {Promise<(baseUrl: string) => boolean>}
 */
export async function reachableOriginFilter(chromeApi) {
  const getAll = chromeApi?.permissions?.getAll;
  if (typeof getAll !== 'function') return async () => true;
  let patterns = [];
  try {
    patterns = (await getAll.call(chromeApi.permissions))?.origins ?? [];
  } catch { return async () => true; }
  if (!patterns.length) return async () => true;
  return (baseUrl) => {
    let url;
    try { url = new URL(baseUrl); } catch { return false; }
    return patterns.some((pattern) => {
      const match = /^([a-z]+):\/\/(\[[^\]]+\]|[^/]+)\//i.exec(pattern);
      if (!match) return false;
      const [, scheme, host] = match;
      if (scheme.toLowerCase() !== url.protocol.replace(':', '').toLowerCase()) return false;
      // Granted patterns carry no port, so compare hosts rather than origins.
      return host === url.hostname || host === url.host;
    });
  };
}

/** What kind of place an origin is, so the UI can say it plainly. */
export function classifyBaseUrl(baseUrl, { localAddresses = [], tailnetHosts = [] } = {}) {
  let host;
  try { host = new URL(baseUrl).hostname; } catch { return 'unknown'; }
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return 'loopback';
  // "This device" means whatever the machine itself reported, on any computer.
  if (localAddresses.includes(host)) return 'device';
  // A host the tailnet itself reported, or any MagicDNS name (Tailscale's
  // public `ts.net` suffix, the same class of platform convention as
  // `localhost`), is a tailnet peer. IP literals stay classified by range.
  if (tailnetHosts.includes(host) || tailnetHosts.includes(host.toLowerCase())) return 'tailnet';
  if (typeof host === 'string' && host.toLowerCase().endsWith('.ts.net')) return 'tailnet';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split('.').map(Number);
    if (a === 100 && b >= 64 && b <= 127) return 'tailnet';
  }
  return 'remote';
}

const KIND_LABEL = Object.freeze({
  loopback: 'This browser',
  device: 'This device',
  tailnet: 'Tailnet',
  remote: 'Remote',
  unknown: 'Unknown',
});

export function kindLabel(kind) { return KIND_LABEL[kind] ?? 'Unknown'; }

/** @param {any} chromeApi */
async function readRemembered(chromeApi) {
  try {
    const raw = (await chromeApi?.storage?.local?.get(REMEMBERED_KEY))?.[REMEMBERED_KEY];
    return Array.isArray(raw) ? raw.filter((item) => typeof item?.baseUrl === 'string') : [];
  } catch { return []; }
}

/** Remember a daemon that answered, so the next launch connects immediately. */
export async function rememberDaemon(chromeApi, record) {
  try {
    const current = await readRemembered(chromeApi);
    const stamped = { ...record, seen_at: new Date().toISOString() };
    const next = [stamped, ...current.filter((item) => item.baseUrl !== record.baseUrl)].slice(0, 12);
    await chromeApi.storage.local.set({ [REMEMBERED_KEY]: next });
  } catch { /* remembering is a convenience, never a blocker */ }
}

export async function forgetDaemon(chromeApi, baseUrl) {
  try {
    const current = await readRemembered(chromeApi);
    await chromeApi.storage.local.set({ [REMEMBERED_KEY]: current.filter((item) => item.baseUrl !== baseUrl) });
  } catch { /* non-fatal */ }
}

/**
 * Turn a learned host into its candidate origins, trying each known Focusa port.
 * Loopback keeps a single port: aliases and ports there are the same daemon.
 * @param {string} host
 */
export function hostCandidates(host) {
  const clean = String(host ?? '').trim().replace(/^[a-z]+:\/\//i, '').replace(/\/.*$/, '');
  if (!clean) return [];
  if (isLoopbackHost(clean)) return [`http://${clean}:${PORT}`];
  // The scheme follows the same rule as origin validation, so a tailnet literal
  // speaks HTTP while every other host (and every name) speaks HTTPS.
  const scheme = clean.includes(':') ? '' : daemonSchemeForHost(clean);
  return PORT_VARIANTS.map((port) => `${scheme}//${clean}:${port}`);
}

function isLoopbackHost(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

/**
 * Every candidate worth probing: hosts this device has learned (each on its
 * known Focusa ports), remembered daemons, then this device.
 * @param {any} chromeApi
 */
export async function discoveryCandidates(chromeApi) {
  const remembered = await readRemembered(chromeApi);
  const learned = new Set();
  for (const record of remembered) {
    try { learned.add(new URL(record.baseUrl).hostname); } catch { /* skip junk */ }
  }
  // Remote discovery is over the tailnet, and verified daemons come first: a
  // daemon the discovery bridge already proved reachable is a fact, not a
  // guess. The merged topology also folds in the OS client, the LocalAPI and
  // the host book, so no single source is a single point of failure.
  const merged = await readMergedTopology().catch(() => null);
  const verified = (merged?.verifiedDaemons ?? []).map((daemon) => daemon.url);
  const fromTailnet = tailnetCandidates(merged).map((item) => item.origin);
  const topology = merged;
  // This machine's own non-loopback addresses, reported by the local host
  // program. Hardcoding them would make the product work on exactly one
  // computer; asking the machine is what makes one build portable.
  const fromLocalAddrs = (topology?.localAddresses ?? [])
    .map((ip) => `http://${ip}:${PORT}`);
  const fromBook = (await hostBookCandidates(chromeApi)).map((item) => item.origin);
  const fromLearned = [...learned].flatMap((host) => hostCandidates(host));
  const ordered = [...verified, ...fromTailnet, ...fromBook, ...fromLocalAddrs,
    ...remembered.map((item) => item.baseUrl), ...fromLearned, ...DEVICE_CANDIDATES];
  return Object.freeze([...new Set(ordered)]);
}

/**
 * Turn something a person typed — a MagicDNS name, an IP, or a full URL, with
 * or without a port — into origins to probe. Anything off this device and off
 * the tailnet must be HTTPS, so a plain name resolves to HTTPS and a bare IP
 * keeps whatever the operator typed.
 *
 * @param {string} input
 * @returns {string[]} candidate origins
 */
export function seedCandidates(input, { allowInsecure = true } = {}) {
  const raw = String(input ?? '').trim();
  if (!raw) return [];
  // An explicit scheme the operator typed is respected exactly - never silently
  // downgraded. A bare name/address follows the host-book rule instead.
  const typedScheme = /^([a-z]+):\/\//i.exec(raw)?.[1]?.toLowerCase() ?? null;
  const withScheme = typedScheme ? raw : `https://${raw}`;
  let parsed;
  try { parsed = new URL(withScheme); } catch { return []; }
  if (typedScheme) {
    if (parsed.port) return [`${parsed.protocol}//${parsed.host}`];
    return [parsed.origin];
  }
  // parsed.host keeps an explicit port; hostname would silently drop it.
  return originsForHost({ host: parsed.host, allowInsecure });
}

/**
 * A quiet liveness heartbeat. Re-probes one origin so the UI can say the daemon
 * is alive only while it actually answers; it never mutates anything and stops
 * on demand.
 *
 * @returns {() => void} stop function
 */
export function watchLiveness(baseUrl, onBeat, { intervalMs = 12000, fetchImpl, timeoutMs = PROBE_TIMEOUT_MS } = {}) {
  if (!baseUrl) return () => {};
  let stopped = false;
  let timer = null;
  const beat = async () => {
    if (stopped) return;
    const answer = await probeDaemon(baseUrl, { fetchImpl, timeoutMs });
    if (!stopped) onBeat({ ...answer, at: new Date().toISOString() });
  };
  timer = setInterval(beat, intervalMs);
  return () => { stopped = true; if (timer) clearInterval(timer); };
}

/**
 * True when this device has connected to a daemon before. First run is the only
 * time a click is asked for; every later launch connects on its own.
 * @param {any} chromeApi
 */
export async function hasKnownDaemon(chromeApi) {
  const remembered = await readRemembered(chromeApi);
  if (remembered.length) return true;
  try { return (await listLocalEnvironments(chromeApi)).length > 0; } catch { return false; }
}

/** Ask one candidate whether a Focusa daemon answers. Read-only. */
export async function probeDaemon(baseUrl, { fetchImpl = globalThis.fetch, timeoutMs = PROBE_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(new URL(HEALTH_PATH, baseUrl), {
      method: 'GET', signal: controller.signal, cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return { baseUrl, ok: false, status: response.status };
    const body = await response.json().catch(() => null);
    return { baseUrl, ok: true, status: response.status, service: body?.service ?? null, body };
  } catch {
    return { baseUrl, ok: false, status: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A live preview of a daemon, read BEFORE connecting.
 *
 * Everything here is owner-reported: process liveness from /v1/health and the
 * project inventory from /v1/project/list. Each half degrades on its own, so a
 * daemon that answers health but refuses the project list still previews
 * honestly rather than not at all.
 *
 * @param {{baseUrl: string, fetchImpl?: function, timeoutMs?: number, token?: string|null}} input
 */
export async function previewDaemon({ baseUrl, fetchImpl = globalThis.fetch, timeoutMs = PROBE_TIMEOUT_MS, token = null }) {
  const read = async (path) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(new URL(path, baseUrl), {
        method: 'GET', cache: 'no-store', signal: controller.signal,
        headers: { accept: 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      });
      if (!response.ok) return null;
      return await response.json().catch(() => null);
    } catch { return null; } finally { clearTimeout(timer); }
  };

  const [health, projects, sessions] = await Promise.all([read(HEALTH_PATH), read('/v1/project/list'), read('/v1/silent-sessions')]);
  const sessionRows = Array.isArray(sessions?.sessions ?? sessions?.data?.sessions) ? (sessions.sessions ?? sessions.data.sessions) : null;
  const daemon = health?.daemon ?? null;
  const persistence = health?.persistence ?? null;
  const list = Array.isArray(projects?.projects) ? projects.projects : null;
  const effective = projects?.effective_project ?? null;
  return Object.freeze({
    baseUrl,
    alive: health?.ok === true || Boolean(daemon),
    // Identity: one daemon process, however many addresses reach it.
    identity: daemon?.start_token ?? null,
    version: health?.version ?? null,
    uptimeMs: health?.uptime_ms ?? null,
    pid: daemon?.pid ?? null,
    // What it actually holds, stated plainly.
    projects: Object.freeze((list ?? []).slice(0, 6).map((p) => p?.canonical_name ?? p?.project_id ?? p?.project_root ?? 'project')),
    activeProject: effective?.canonical_name ?? effective?.project_root ?? null,
    projectSelectionRequired: projects?.failure_class === 'project_root_selection_required' || (!list?.length && !effective),
    projectListKnown: list !== null,
    sessions: sessionRows ? sessionRows.length : null,
    liveSessions: Object.freeze((sessionRows ?? []).slice(0, 5).map((row) => ({
      id: row?.session_id ?? row?.id ?? null,
      label: row?.title ?? row?.name ?? row?.session_id ?? null,
      state: row?.state ?? row?.status ?? null,
    }))),
    // Diagnostics, deliberately secondary: these are not what an operator is
    // choosing between, so they never lead the card.
    batches: persistence?.batches_total ?? null,
    failures: persistence?.failures_total ?? null,
    queueDepth: persistence?.queue_depth ?? null,
    degraded: projects?.runtime?.degraded === true || (persistence?.failures_total ?? 0) > 0,
  });
}

/**
 * Probe candidates concurrently and report every answer, so an unreachable
 * address is never silently presented as "the daemon is down".
 *
 * @returns {Promise<{connected: any|null, answers: any[]}>}
 */
/** Loopback aliases are the same daemon; show it once, at the address that answered. */
const LOOPBACK_ALIASES = Object.freeze(['http://127.0.0.1:8787', 'http://localhost:8787', 'http://[::1]:8787']);

function collapseAliases(found) {
  const loopback = found.filter((daemon) => daemon.kind === 'loopback');
  const rest = found.filter((daemon) => daemon.kind !== 'loopback');
  if (!loopback.length) return rest;
  const preferred = LOOPBACK_ALIASES
    .map((alias) => loopback.find((daemon) => daemon.baseUrl === alias))
    .find(Boolean) ?? loopback[0];
  return [preferred, ...rest];
}

export async function discoverDaemon(chromeApi, { fetchImpl, timeoutMs = PROBE_TIMEOUT_MS, extra = [], onAnswer = null } = {}) {
  const merged = await readMergedTopology({ fetchImpl, timeoutMs }).catch(() => null);
  const topology = merged ?? await readTailscaleTopology({ fetchImpl, timeoutMs }).catch(() => null);
  const tailnetHosts = [];
  for (const peer of merged?.peers ?? topology?.peers ?? []) {
    if (peer.dnsName) tailnetHosts.push(peer.dnsName.toLowerCase());
    for (const ip of peer.ips ?? []) tailnetHosts.push(ip);
    if (peer.name) tailnetHosts.push(peer.name.toLowerCase());
  }
  const reachable = await reachableOriginFilter(chromeApi);
  const candidates = [...new Set([...extra, ...(await discoveryCandidates(chromeApi))])];
  // Only origins this extension is GRANTED are probed. A browser may not fetch
  // anything else, so asking would both fail and print a CORS error; ungranted
  // machines are offered for a one-click grant instead (see tailnetRoster).
  const probeable = [];
  for (const baseUrl of candidates) {
    if (await reachable(baseUrl)) probeable.push(baseUrl);
  }
  // Each candidate is reported the moment it answers, so the surface can show
  // the search progressing instead of appearing to hang.
  const answers = await Promise.all(probeable.map((baseUrl) => probeDaemon(baseUrl, { fetchImpl, timeoutMs }).then((answer) => {
    onAnswer?.(answer);
    return answer;
  })));
  const localAddresses = topology?.localAddresses ?? [];
  const found = collapseAliases(answers
    .filter((answer) => answer.ok)
    .map((answer) => {
      const kind = classifyBaseUrl(answer.baseUrl, { localAddresses, tailnetHosts });
      return { ...answer, kind, kindLabel: kindLabel(kind), aliases: kind === 'loopback' ? LOOPBACK_ALIASES : [] };
    }));
  return { connected: found[0] ?? null, found, answers };
}

/**
 * Every daemon this browser can see: the ones that answered a health probe, plus
 * remote daemons this browser is already paired with (they need their stored
 * token rather than an anonymous probe, so they are reported as paired).
 *
 * @param {any} chromeApi
 * @param {{fetchImpl?: function, timeoutMs?: number}} [options]
 */
/**
 * The machines the tailnet reports, whether or not they are running a daemon.
 *
 * These are NOT probed here: a browser may only fetch an origin it has been
 * granted, so probing an ungranted peer would fail and print a CORS error.
 * Instead they are offered as connectable candidates - the operator presses
 * Connect on the machine they want, that one origin is granted, and from then
 * on it is probed silently on every launch.
 *
 * Portable by construction: it comes from the tailnet's own LocalAPI, which
 * tailscaled serves on macOS, Windows, Linux and ChromeOS alike.
 *
 * @param {any} chromeApi
 * @param {{fetchImpl?: function, timeoutMs?: number}} [options]
 * @returns {Promise<{self: object|null, peers: any[]}>}
 */
export async function tailnetRoster(chromeApi, { fetchImpl, timeoutMs, connectNative } = {}) {
  // forward the source choice: a caller naming one is asking about that one.
  // The merged read folds the discovery bridge in, so peers the OS client
  // cannot see (no LocalAPI, no native host on this browser) still appear.
  const merged = await readMergedTopology({ fetchImpl, timeoutMs, connectNative }).catch(() => null);
  if (!merged || !merged.peers.length) {
    const topology = await readTailscaleTopology({ fetchImpl, timeoutMs, connectNative }).catch(() => null);
    if (!topology) return Object.freeze({ self: null, peers: [] });
    return Object.freeze({ self: topology.self, peers: topology.peers });
  }
  return Object.freeze({ self: null, peers: merged.peers });
}

/** Origins for one named peer, for the one-click grant. DNS name first: tailnet
 * reverse proxies route by Host header, so an IP literal can 404 where the DNS
 * name proxies to the daemon. Falls back to the IPv4 literal when no DNS name
 * was reported. */
export function peerOrigins(peer, { ports = [8787, 8788, 8789, 18787] } = {}) {
  const host = peer?.dnsName || (peer?.ips ?? []).find((value) => typeof value === 'string' && !value.includes(':'));
  if (!host) return [];
  return ports.map((port) => `http://${host}:${port}`);
}

export async function discoverDaemons(chromeApi, { fetchImpl, timeoutMs = PROBE_TIMEOUT_MS, extra = [], onAnswer = null } = {}) {
  const { found, answers } = await discoverDaemon(chromeApi, { fetchImpl, timeoutMs, extra, onAnswer });
  // Preview each daemon so two addresses of ONE process can be recognised.
  await Promise.all(found.map(async (daemon) => {
    if (daemon.preview) return;
    const preview = await previewDaemon({ baseUrl: daemon.baseUrl, fetchImpl });
    daemon.preview = preview;
    daemon.identity = preview.identity ?? null;
  }));
  // One row per daemon, not per address: the same process reached over loopback
  // and over this device's bridge is a single choice, and saying otherwise
  // ("This browser" and "This device" with the same numbers) means nothing.
  const byIdentity = new Map();
  for (const daemon of found) {
    const key = daemon.identity ?? daemon.baseUrl;
    const existing = byIdentity.get(key);
    if (!existing) { byIdentity.set(key, { ...daemon, addresses: [daemon.baseUrl] }); continue; }
    existing.addresses.push(daemon.baseUrl);
    // Keep the friendliest address as the one we attach to.
    if (daemon.baseUrl.startsWith('http://127.0.0.1') || daemon.baseUrl.startsWith('http://localhost')) {
      existing.baseUrl = daemon.baseUrl;
    }
  }
  const book = await readHostBook(chromeApi).catch(() => []);
  const bookLabels = new Map(book.map((entry) => [entry.host, entry.label]));
  // A tailnet peer name beats a bare address: 'kh' means something, an IP does not.
  let tailnetNames = new Map();
  try {
    const topology = await readTailscaleTopology();
    for (const peer of topology?.peers ?? []) {
      if (peer.isSelf) continue;
      for (const ip of peer.ips) tailnetNames.set(ip, peer.name);
    }
  } catch { /* no LocalAPI here: the address is all we have */ }
  const unique = [...byIdentity.values()].map((daemon) => {
    let host = '';
    try { host = new URL(daemon.baseUrl).hostname; } catch { /* keep unknown */ }
    const label = tailnetNames.get(host) ?? bookLabels.get(host) ?? null;
    const held = (daemon.preview?.projects?.length ?? 0) + (daemon.preview?.sessions ?? 0);
    return {
      ...daemon,
      label,
      held,
      // The authoritative parent is the daemon actually holding work, which is
      // the one everything else is deployed from.
      authoritative: held > 0,
      kindLabel: daemon.preview?.activeProject ? `${daemon.kindLabel} · ${daemon.preview.activeProject}` : daemon.kindLabel,
    };
  }).sort((a, b) => (Number(b.authoritative) - Number(a.authoritative)) || (b.held - a.held));
  let paired = [];
  try {
    const { listConnections } = await import('./storage.mjs');
    paired = await listConnections(chromeApi);
  } catch { paired = []; }
  const known = new Set(found.map((daemon) => daemon.baseUrl));
  const remote = paired
    .filter((connection) => !known.has(connection.base_url))
    .map((connection) => ({
      baseUrl: connection.base_url, ok: null, kind: 'remote', kindLabel: 'Paired',
      label: connection.label ?? connection.base_url, paired: true,
    }));
  const all = [...unique, ...remote];
  return { connected: all[0] ?? null, found: all, answers };
}
