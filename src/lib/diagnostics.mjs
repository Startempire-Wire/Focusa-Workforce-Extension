/**
 * Diagnostics: a structured event log for the connect flow and everything
 * around it.
 *
 * When attaching to a daemon fails, "nothing happens" is not an acceptable
 * report. Every step of the flow logs a structured event (what was attempted,
 * what came back, how long it took), failures are classified into a small set
 * of machine-readable codes, and the log is exportable as JSON so it can be
 * pasted into a bug report. Nothing secret is ever recorded: origins and
 * timings yes, tokens and credentials never (this product stores no tokens for
 * local environments at all).
 *
 * Failure codes (`code`):
 *   permission-denied  Chrome did not grant the origin (prompt dismissed/denied)
 *   permission-missing Chrome permissions API unavailable (not an extension page)
 *   validation         the URL failed origin validation (malformed, wrong scheme)
 *   network            fetch threw (no route, DNS, refused, CORS-blocked fetch)
 *   timeout            an AbortError / explicit timeout
 *   http               the daemon answered with a non-2xx status
 *   storage            chrome.storage read/write failed
 *   unknown            anything else
 */

export const RING_CAP = 200;
export const PERSIST_CAP = 60;
export const STORE_KEY = 'focusa.workforce.diagnostics.v1';

/** Classify a failure into a stable, human-explainable code. */
export function classifyError(error, { status = null } = {}) {
  if (status != null && !(status >= 200 && status < 300)) return 'http';
  const message = String(error?.message ?? error ?? '').toLowerCase();
  const name = String(error?.name ?? '');
  if (/permission|denied|not allowed|user gesture|user denied/.test(message)) return 'permission-denied';
  if (/permissions api is unavailable|chrome is not defined|chrome\./.test(message)) return 'permission-missing';
  if (name === 'AbortError' || /timeout|aborted|abort/.test(message)) return 'timeout';
  if (/daemon url|origin|validation|schema mismatch|must use https|must not/.test(message)) return 'validation';
  if (/quota|storage|indexeddb|idb/.test(message)) return 'storage';
  if (/failed to fetch|networkerror|network request failed|load failed|err_/.test(message)) return 'network';
  return 'unknown';
}

/** One-line human explanation per code, for surfaces (never technical). */
export function explainCode(code) {
  switch (code) {
    case 'permission-denied':
      return 'Chrome did not grant access. Click Connect again and choose Allow in the prompt.';
    case 'permission-missing':
      return 'The browser permissions API is unavailable on this page.';
    case 'validation':
      return 'The daemon address failed validation.';
    case 'network':
      return 'The daemon could not be reached over the network.';
    case 'timeout':
      return 'The daemon did not answer in time.';
    case 'http':
      return 'The daemon answered with an error status.';
    case 'storage':
      return 'Browser storage is unavailable.';
    default:
      return 'Something unexpected failed.';
  }
}

function safeDetails(details) {
  if (details == null || typeof details !== 'object') return details ?? null;
  const out = {};
  for (const [key, value] of Object.entries(details)) {
    if (/token|secret|password|credential|auth/i.test(key)) continue;
    out[key] = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value == null
      ? value
      : String(value).slice(0, 300);
  }
  return out;
}

/**
 * @param {{chromeApi?: *, now?: () => string, ringCap?: number, persistCap?: number}} [options]
 */
export function createDiagnostics({ chromeApi = globalThis.chrome, now = () => new Date().toISOString(), ringCap = RING_CAP, persistCap = PERSIST_CAP } = {}) {
  const ring = [];
  let persistTimer = null;

  function schedulePersist() {
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      persist().catch(() => {});
    }, 250);
  }

  async function persist() {
    try {
      await chromeApi?.storage?.local?.set({ [STORE_KEY]: ring.slice(-persistCap) });
    } catch { /* diagnostics must never break the product */ }
  }

  function stackOf(error) {
    const raw = error?.error?.stack ?? error?.stack ?? null;
    if (typeof raw !== 'string' || !raw) return null;
    // First frames only, extension-local paths kept (they name the exact line),
    // browser internals dropped.
    return raw.split('\n').slice(0, 6).map((line) => line.trim().slice(0, 220));
  }

  function record(level, name, details = null, error = null) {
    const event = {
      at: now(),
      level,
      name,
      details: safeDetails(details),
      ...(error == null ? {} : {
        code: error.code ?? classifyError(error.error ?? error),
        message: String(error.error?.message ?? error.error ?? error?.message ?? error).slice(0, 300),
        stack: stackOf(error),
      }),
    };
    ring.push(event);
    while (ring.length > ringCap) ring.shift();
    schedulePersist();
    return event;
  }

  return {
    log(name, details = null) { return record('info', name, details); },
    warn(name, details = null, error = null) { return record('warn', name, details, error); },
    error(name, error = null, details = null) { return record('error', name, details, error); },
    /** Start a timed step; call the returned done() with an optional error. */
    step(name, details = null) {
      const startedAt = Date.now();
      this.log(`${name}.start`, details);
      return (error = null, extra = null) => {
        const ms = Date.now() - startedAt;
        if (error == null) return this.log(`${name}.ok`, { ...(details ?? {}), ...(extra ?? {}), ms });
        return this.error(`${name}.fail`, error, { ...(details ?? {}), ...(extra ?? {}), ms });
      };
    },
    recent: (limit = 50) => ring.slice(-limit),
    async persisted() {
      try {
        const raw = await chromeApi?.storage?.local?.get(STORE_KEY);
        const list = raw?.[STORE_KEY];
        return Array.isArray(list) ? list : [];
      } catch { return []; }
    },
    async exportJson() {
      return JSON.stringify({ exportedAt: now(), events: ring.slice() }, null, 2);
    },
    async clear() {
      ring.length = 0;
      try { await chromeApi?.storage?.local?.remove(STORE_KEY); } catch { /* never break */ }
    },
  };
}
