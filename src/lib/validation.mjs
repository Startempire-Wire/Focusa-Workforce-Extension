const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
// A machine may bridge its own daemon onto one of its own addresses (a
// container bridge, a VPN, a second interface). Those addresses are reported at
// runtime by the local host program, so nothing about a specific layout is
// compiled in; the rule below stays purely structural.

/**
 * HTTP is permitted only on this machine and on the tailnet. Tailscale's CGNAT
 * range (100.64.0.0/10) is end-to-end encrypted and never leaves the operator's
 * own devices, so a discovered daemon there is as safe as loopback. The same
 * holds for Tailscale MagicDNS names (`*.ts.net`, Tailscale's public suffix
 * for every tailnet — a platform convention like `localhost`, not personal
 * data): `tailscale serve` fronts daemons over plain HTTP there, and the
 * transport underneath is still WireGuard. Everything reachable off-tailnet
 * must still use HTTPS.
 */
function isTailnetHost(hostname) {
  if (typeof hostname !== 'string' || !/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  const [a, b] = hostname.split('.').map(Number);
  if ([a, b, ...hostname.split('.').map(Number)].some((part) => part > 255)) return false;
  return a === 100 && b >= 64 && b <= 127;
}

/**
 * True for a Tailscale MagicDNS name (`*.ts.net`, Tailscale's public suffix for
 * every tailnet - a platform convention like `localhost`, not personal data).
 * `tailscale serve` fronts daemons over plain HTTP there, with WireGuard
 * underneath, and browsers always send the URL hostname as the Host header, so
 * this is also the name form that actually routes.
 * @param {string} hostname
 */
export function isTailnetName(hostname) {
  return typeof hostname === 'string' && hostname.toLowerCase().endsWith('.ts.net');
}

/**
 * True when a host is this machine (browser loopback, its local bridges), a
 * tailnet peer by address, or a tailnet peer by MagicDNS name. Single source
 * of truth for origin validation, scheme choice, and the local-environment
 * contract, so the three can never drift apart.
 * @param {string} hostname
 */
export function isLocalDaemonHost(hostname) {
  if (typeof hostname !== 'string') return false;
  if (LOOPBACK_HOSTS.has(hostname)) return true;
  if (isTailnetName(hostname)) return true;
  return isTailnetHost(hostname);
}

/**
 * The scheme a daemon on this host is expected to speak: HTTP on this machine
 * and on the tailnet, HTTPS everywhere else. Names (MagicDNS or otherwise)
 * resolve off-device, so they get HTTPS unless the host is a tailnet literal.
 *
 * @param {string} hostname
 * @returns {'http:' | 'https:'}
 */
export function daemonSchemeForHost(hostname) {
  if (isLocalDaemonHost(hostname)) return 'http:';
  // A dotted quad on the tailnet is local; anything with letters is a name.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(String(hostname))) return 'https:';
  return 'https:';
}

/**
 * @param {string} value
 * @param {{trustedHosts?: Set<string>|string[]}} [options]
 *   `trustedHosts` are hosts the operator has explicitly put in the tailnet host
 *   book. A trusted tailnet host may speak plain HTTP - the tailnet is end-to-end
 *   encrypted and the book is a deliberate operator decision. Everything else off
 *   this machine still must be HTTPS.
 */
export function normalizeDaemonOrigin(value, { trustedHosts = null } = {}) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('daemon URL is required');
  const parsed = new URL(value.trim());
  if (parsed.username || parsed.password) throw new TypeError('daemon URL must not contain credentials');
  if (parsed.search || parsed.hash) throw new TypeError('daemon URL must not contain query or fragment');
  if (parsed.pathname !== '/' && parsed.pathname !== '') throw new TypeError('daemon URL must be an origin without a path');
  const trusted = trustedHosts instanceof Set
    ? trustedHosts.has(parsed.hostname)
    : Array.isArray(trustedHosts) && trustedHosts.includes(parsed.hostname);
  const local = isLocalDaemonHost(parsed.hostname) || trusted;
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) {
    throw new TypeError('daemon URL off this machine, off the tailnet and outside the host book must use HTTPS');
  }
  return parsed.origin;
}

export function originPermission(origin) {
  // Chrome match patterns are scheme + host + path: they carry no port, so a
  // pattern with one never matches. Strip it - `contains` and `request` must
  // agree, and both go through here.
  const normalized = normalizeDaemonOrigin(origin);
  const url = new URL(normalized);
  return `${url.protocol}//${url.hostname}/*`;
}

export async function requestDaemonOriginPermission(origin, chromeApi = globalThis.chrome) {
  if (!chromeApi?.permissions?.request) throw new Error('Chrome permissions API is unavailable');
  return chromeApi.permissions.request({ origins: [originPermission(origin)] });
}

/**
 * True when the user has already granted this daemon origin (optional
 * host-permission model, docs/17 §15). Lets first-run auto-connect stay silent
 * after the single consent grant Chrome requires from a user gesture.
 * @param {string} origin
 * @param {*} [chromeApi]
 */
export async function hasDaemonOriginPermission(origin, chromeApi = globalThis.chrome) {
  if (!chromeApi?.permissions?.contains) throw new Error('Chrome permissions API is unavailable');
  return chromeApi.permissions.contains({ origins: [originPermission(origin)] });
}
