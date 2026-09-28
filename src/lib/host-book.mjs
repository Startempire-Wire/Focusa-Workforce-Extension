/**
 * Known tailnet hosts (operator direction 2026-09-27).
 *
 * Remote Focusa discovery happens over the tailnet, always. A browser cannot
 * enumerate a tailnet - that boundary is exactly what makes the tailnet safe -
 * so the extension keeps a small HOST BOOK: the tailnet hosts it should look
 * for on every launch. That is the difference between "find my own machine
 * again" and "know where my workforce actually lives".
 *
 * Three sources feed the book, in order of authority:
 *
 *   1. Hosts the operator added or paired. Explicit, removable, and the reason
 *      a host is ever trusted over plain HTTP.
 *   2. Hosts this build already knows about: the estate's own tailnet nodes,
 *      from this project's AGENTS.md. Seeded so remote discovery works on first
 *      launch with no setup, and clearly labelled as defaults the operator can
 *      remove.
 *   3. Nothing else. The book is never widened by guessing, and the extension
 *      never sweeps a network.
 *
 * Discovery probes each host on the small fixed set of plausible Focusa ports.
 * An entry is stored as given (a MagicDNS name, a 100.x address, or a name:port)
 * and normalised only for probing.
 */

const BOOK_KEY = 'focusa.workforce.host_book.v1';

/** Ports a Focusa daemon plausibly listens on. Not a sweep: a fixed, tiny set. */
export const FOCUSA_PORTS = Object.freeze([8787, 8788, 8789, 18787]);

/**
 * Ships EMPTY, on purpose.
 *
 * A previous version seeded this with one estate's node names, which made the
 * product specific to one person's machines - the opposite of portable. Nothing
 * about who or where you run this is compiled in: hosts arrive from the tailnet
 * itself, from the local host program, or from the addresses the operator adds.
 */
export const ESTATE_DEFAULTS = Object.freeze([]);

function normalizeHost(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return null;
  const withoutScheme = raw.replace(/^[a-z]+:\/\//, '');
  const withoutPath = withoutScheme.replace(/[/?#].*$/, '');
  if (!withoutPath) return null;
  // [::1] must keep its brackets; a bare IPv6 literal is not supported here.
  if (withoutPath.includes(':') && !withoutPath.startsWith('[')) {
    const [maybeHost, maybePort] = withoutPath.split(':');
    if (/^\d+$/.test(maybePort)) return withoutPath;
    return withoutPath;
  }
  return withoutPath;
}

function entryKey(value) {
  return normalizeHost(value) ?? '';
}

/** @param {any} chromeApi */
export async function readHostBook(chromeApi) {
  let stored = [];
  try {
    const raw = (await chromeApi?.storage?.local?.get(BOOK_KEY))?.[BOOK_KEY];
    stored = Array.isArray(raw) ? raw : [];
  } catch { stored = []; }

  const seen = new Set();
  const entries = [];
  for (const item of [...stored, ...ESTATE_DEFAULTS]) {
    const host = normalizeHost(item?.host ?? item);
    if (!host) continue;
    const key = entryKey(host);
    if (seen.has(key)) continue;      // an operator entry wins over a default
    seen.add(key);
    entries.push(Object.freeze({
      host,
      label: typeof item?.label === 'string' && item.label.trim() ? item.label.trim() : host,
      // A default the operator has not touched is offered, not asserted.
      default: !stored.some((s) => entryKey(s?.host ?? s) === key),
    }));
  }
  return Object.freeze(entries);
}

/** Add (or relabel) a host. This is the only thing that earns plain-HTTP trust. */
export async function addHost(chromeApi, input) {
  const host = normalizeHost(typeof input === 'string' ? input : input?.host);
  if (!host) throw new TypeError('a host name or address is required');
  const label = (typeof input === 'object' && input?.label) ? String(input.label).trim() : host;
  let stored = [];
  try {
    const raw = (await chromeApi?.storage?.local?.get(BOOK_KEY))?.[BOOK_KEY];
    stored = Array.isArray(raw) ? raw : [];
  } catch { stored = []; }
  const next = [...stored.filter((item) => entryKey(item?.host ?? item) !== entryKey(host)), { host, label }];
  await chromeApi.storage.local.set({ [BOOK_KEY]: next });
  return Object.freeze({ host, label });
}

export async function removeHost(chromeApi, input) {
  const key = entryKey(typeof input === 'string' ? input : input?.host);
  if (!key) return false;
  let stored = [];
  try {
    const raw = (await chromeApi?.storage?.local?.get(BOOK_KEY))?.[BOOK_KEY];
    stored = Array.isArray(raw) ? raw : [];
  } catch { stored = []; }
  await chromeApi.storage.local.set({ [BOOK_KEY]: stored.filter((item) => entryKey(item?.host ?? item) !== key) });
  return true;
}

/** Hosts the operator has explicitly added or paired (i.e. trusted). */
export async function trustedHosts(chromeApi) {
  const entries = await readHostBook(chromeApi);
  return new Set(entries.filter((entry) => !entry.default).map((entry) => entry.host));
}

/**
 * Candidate origins for one known host, honouring an explicit port when the
 * operator gave one, and otherwise trying the fixed port set.
 *
 * @param {{host: string, allowInsecure?: boolean}} input
 * @returns {string[]}
 */
export function originsForHost({ host, allowInsecure = false }) {
  const clean = normalizeHost(host);
  if (!clean) return [];
  const bracketed = clean.startsWith('[');
  const body = bracketed ? clean.slice(1, -1) : clean;
  const lastColon = body.lastIndexOf(':');
  const hasPort = !bracketed && lastColon > -1 && /^\d+$/.test(body.slice(lastColon + 1));
  const hostOnly = hasPort ? body.slice(0, lastColon) : body;
  const port = hasPort ? body.slice(lastColon + 1) : null;
  // A tailnet host, or one the operator explicitly added, may speak plain HTTP:
  // the tailnet is end-to-end encrypted and the book is an explicit decision.
  // Everything else still has to be HTTPS.
  const scheme = allowInsecure ? 'http:' : 'https:';
  if (port) return [`${scheme}//${hostOnly}:${port}`];
  const literal = hostOnly.includes(':') ? `[${hostOnly}]` : hostOnly;
  // This browser's own loopback is a single daemon: no point asking four ports.
  if (hostOnly === '127.0.0.1' || hostOnly === 'localhost') return [`${scheme}//${literal}:8787`];
  return FOCUSA_PORTS.map((p) => `${scheme}//${literal}:${p}`);
}

/** Every candidate the host book implies, in probing order. */
export async function hostBookCandidates(chromeApi) {
  const trusted = await trustedHosts(chromeApi);
  const entries = await readHostBook(chromeApi);
  const out = [];
  for (const entry of entries) {
    for (const origin of originsForHost({ host: entry.host, allowInsecure: true })) {
      out.push({ origin, label: entry.label, trusted: trusted.has(entry.host), default: entry.default });
    }
  }
  return Object.freeze(out);
}
