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
 * loopback and on the Crostini crosvm veth bridge (100.115.92.26). The host's
 * own tailnet node (100.127.113.90) does NOT answer from the container, because
 * the container does not own that interface: exposing the daemon ON the tailnet
 * is host-side forwarding work (operator-owned), and until that exists a tailnet
 * peer legitimately shows as "no answer" here rather than being faked.
 */

const PORT = 8787;
const HEALTH_PATH = '/v1/health';
import { listLocalEnvironments } from '../../lib/storage.mjs';

const REMEMBERED_KEY = 'focusa.workforce.discovered.v1';

/** Browser loopback, the crosvm veth bridge, and this host's tailnet node. */
export const DEVICE_CANDIDATES = Object.freeze([
  `http://127.0.0.1:${PORT}`,
  `http://localhost:${PORT}`,
  `http://[::1]:${PORT}`,
  'http://100.115.92.26:8787',
  'http://100.127.113.90:8787',
]);

export const PROBE_TIMEOUT_MS = 2500;

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
 * The full candidate list: remembered first, then this device, then the tailnet.
 * @param {any} chromeApi
 */
export async function discoveryCandidates(chromeApi) {
  const remembered = await readRemembered(chromeApi);
  const ordered = [...remembered.map((item) => item.baseUrl), ...DEVICE_CANDIDATES];
  return Object.freeze([...new Set(ordered)]);
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
 * Probe candidates concurrently and report every answer, so an unreachable
 * address is never silently presented as "the daemon is down".
 *
 * @returns {Promise<{connected: any|null, answers: any[]}>}
 */
export async function discoverDaemon(chromeApi, { fetchImpl, timeoutMs = PROBE_TIMEOUT_MS } = {}) {
  const candidates = await discoveryCandidates(chromeApi);
  const answers = await Promise.all(candidates.map((baseUrl) => probeDaemon(baseUrl, { fetchImpl, timeoutMs })));
  return { connected: answers.find((answer) => answer.ok) ?? null, answers };
}
