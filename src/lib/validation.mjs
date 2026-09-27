const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
// Crostini local daemon bridge: the browser's loopback namespace is ChromeOS's,
// so this device's crosvm veth carries the (loopback-origin) daemon to the
// browser. HTTP stays forbidden everywhere else (remote daemons must use HTTPS).
const LOCAL_BRIDGE_HOSTS = new Set(['100.115.92.26']);

export function normalizeDaemonOrigin(value) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('daemon URL is required');
  const parsed = new URL(value.trim());
  if (parsed.username || parsed.password) throw new TypeError('daemon URL must not contain credentials');
  if (parsed.search || parsed.hash) throw new TypeError('daemon URL must not contain query or fragment');
  if (parsed.pathname !== '/' && parsed.pathname !== '') throw new TypeError('daemon URL must be an origin without a path');
  const loopback = LOOPBACK_HOSTS.has(parsed.hostname) || LOCAL_BRIDGE_HOSTS.has(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
    throw new TypeError('remote daemon URL must use HTTPS; HTTP is loopback-only');
  }
  return parsed.origin;
}

export function originPermission(origin) {
  return `${normalizeDaemonOrigin(origin)}/*`;
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
