/**
 * Daemon cache: what a connected daemon reported, kept across reads.
 *
 * Rule: connect pulls everything, the cache holds it, and a loop refreshes it.
 * Every surface renders from the cache first (instant, and proof the connection
 * is real), then replaces it with live reads as they land. A failed refresh
 * never blanks the screen: the last good data stays, labelled with its age.
 *
 * Fresh < 60s. Usable-stale < 10min. Older than that is reported as expired
 * and the surface says so instead of showing it.
 *
 * Never stores secrets: previews, projections and rosters contain no tokens
 * (local environments store none at all).
 */

export const CACHE_KEY = 'focusa.workforce.daemon_cache.v1';
export const FRESH_MS = 60_000;
export const STALE_MS = 10 * 60_000;
export const MAX_BYTES = 200_000;

export function ageMs(entry, now = Date.now()) {
  if (!entry || typeof entry.at !== 'number') return Infinity;
  return Math.max(0, now - entry.at);
}

export function isFresh(entry, now = Date.now()) {
  return ageMs(entry, now) < FRESH_MS;
}

export function isUsable(entry, now = Date.now()) {
  return ageMs(entry, now) < STALE_MS;
}

export function ageLabel(entry, now = Date.now()) {
  const age = ageMs(entry, now);
  if (!Number.isFinite(age)) return 'age unknown';
  if (age < 5_000) return 'just now';
  if (age < 60_000) return `${Math.floor(age / 1000)}s ago`;
  if (age < 3_600_000) return `${Math.floor(age / 60_000)}m ago`;
  return `${Math.floor(age / 3_600_000)}h ago`;
}

/** Trim a payload to the byte budget, sections first (roster/lists go before diagnostics). */
export function pruneForBudget(payload) {
  const encoded = JSON.stringify(payload ?? null);
  if (encoded.length <= MAX_BYTES) return payload;
  const trimmed = { ...(payload ?? {}) };
  for (const key of ['events', 'operations', 'sessions', 'roster', 'activity']) {
    if (JSON.stringify(trimmed).length <= MAX_BYTES) break;
    if (Array.isArray(trimmed?.[key])) trimmed[key] = trimmed[key].slice(0, 20);
    else if (trimmed?.[key] != null) delete trimmed[key];
  }
  if (JSON.stringify(trimmed).length > MAX_BYTES) return { truncated: true, at: payload?.at ?? null };
  return trimmed;
}

/** Read the cached record for one daemon origin (null when none/expired foreign). */
export async function readCache(chromeApi, baseUrl) {
  try {
    const raw = await chromeApi?.storage?.local?.get(CACHE_KEY);
    const entry = raw?.[CACHE_KEY];
    if (!entry || entry.baseUrl !== baseUrl) return null;
    return entry;
  } catch {
    return null;
  }
}

/** Write the cached record for one daemon origin. Never throws; returns null
 *  when there is nowhere to write, so callers never mistake it for stored. */
export async function writeCache(chromeApi, baseUrl, data) {
  try {
    if (typeof chromeApi?.storage?.local?.set !== 'function') return null;
    const entry = pruneForBudget({ baseUrl, at: Date.now(), data: data ?? null });
    await chromeApi.storage.local.set({ [CACHE_KEY]: entry });
    return entry;
  } catch {
    return null;
  }
}

/** Drop the cache (disconnect). Never throws. */
export async function clearCache(chromeApi) {
  try {
    await chromeApi?.storage?.local?.remove(CACHE_KEY);
  } catch { /* never break the product */ }
}
