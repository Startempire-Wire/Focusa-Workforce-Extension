/**
 * Full Workforce route contract — docs/11 §3.
 *
 * One full-page entry point (`workforce.html`) with client-side hash routing so
 * MV3 needs no route rewrites. Context travels separately from route identity:
 *
 *   #/work/detail?env=<connection-key>&ref=<base64url-typed-ref>&intent=...&return=...
 *
 * `ref` is a base64url encoding of the UTF-8 JSON ADLBOS typed cross-product
 * reference: a reference only, never a credential or authority token. Unknown
 * parameters are ignored. An unsupported ref version/kind renders Incompatible
 * and performs no mutation.
 *
 * A route change MUST NOT mutate Focusa scope by itself.
 *
 * @module workforce/lib/router
 */

/** Exact route list from docs/11 §3. */
export const ROUTES = Object.freeze([
  '#/overview',
  '#/work',
  '#/work/detail',
  '#/people',
  '#/people/detail',
  '#/evidence',
  '#/evidence/detail',
  '#/topology',
  '#/audit',
  '#/settings',
]);

/** Only these intents are recognised (docs/11 §3.1). */
export const INTENTS = Object.freeze(['inspect', 'direct', 'review', 'watch', 'approve']);

/** Recognised context parameters; anything else is ignored. */
export const CONTEXT_PARAMS = Object.freeze(['env', 'ref', 'intent', 'return']);

/** Supported typed-ref versions the presenter understands. */
export const SUPPORTED_REF_VERSIONS = Object.freeze(['focusa.workforce.ref.v1']);

/** Route fallback when nothing is specified. */
export const DEFAULT_ROUTE = '#/overview';

function base64urlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  if (typeof atob === 'function') return atob(padded);
  return Buffer.from(padded, 'base64').toString('binary');
}

/**
 * Decode the typed cross-product reference carried in `ref`.
 *
 * @param {string|null} value
 * @returns {{ok: true, ref: any} | {ok: false, reason: string}}
 */
export function decodeTypedRef(value) {
  if (!value) return { ok: false, reason: 'absent' };
  let json;
  try {
    json = decodeURIComponent(escape(base64urlDecode(value)));
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'not-json' };
  }
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'not-an-object' };
  const version = parsed.ref_version ?? parsed.schema ?? null;
  if (!version || !SUPPORTED_REF_VERSIONS.includes(version)) {
    return { ok: false, reason: `unsupported ref version: ${version ?? 'missing'}` };
  }
  if (typeof parsed.kind !== 'string' || !parsed.kind) return { ok: false, reason: 'missing ref kind' };
  return { ok: true, ref: parsed };
}

/**
 * Parse a location hash into route identity + typed context.
 * Never throws: an unknown route falls back to the default route.
 *
 * @param {string} hash e.g. `#/work/detail?env=abc&ref=...`
 * @returns {{route: string, params: Record<string,string>, ref: any|null, refState: 'absent'|'ok'|'incompatible', refReason: string|null}}
 */
export function parseRoute(hash) {
  const raw = typeof hash === 'string' ? hash : '';
  const [pathPart, queryPart = ''] = raw.split('?');
  const route = ROUTES.includes(pathPart) ? pathPart : DEFAULT_ROUTE;

  const params = {};
  for (const [key, value] of new URLSearchParams(queryPart)) {
    // Unknown parameters are ignored (docs/11 §3.1).
    if (CONTEXT_PARAMS.includes(key)) params[key] = value;
  }
  if (params.intent && !INTENTS.includes(params.intent)) delete params.intent;

  const decoded = decodeTypedRef(params.ref ?? null);
  const refState = !params.ref ? 'absent' : (decoded.ok ? 'ok' : 'incompatible');

  return {
    route,
    params,
    ref: decoded.ok ? decoded.ref : null,
    refState,
    refReason: refState === 'incompatible' ? decoded.reason : null,
  };
}

/**
 * Build a hash for navigation. Unknown intents are dropped rather than emitted.
 *
 * @param {string} route
 * @param {{env?: string, ref?: any, intent?: string, return?: string}} [context]
 */
export function buildRoute(route, context = {}) {
  const base = ROUTES.includes(route) ? route : DEFAULT_ROUTE;
  const query = new URLSearchParams();
  if (context.env) query.set('env', context.env);
  if (context.ref) {
    const json = JSON.stringify(context.ref);
    const b64 = typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, 'utf8').toString('base64');
    query.set('ref', b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
  }
  if (context.intent && INTENTS.includes(context.intent)) query.set('intent', context.intent);
  if (context.return) query.set('return', context.return);
  const suffix = query.toString();
  return suffix ? `${base}?${suffix}` : base;
}

/** Which primary-nav item owns a route (docs/11 §4 nav). */
export function navItemForRoute(route) {
  if (route.startsWith('#/work')) return 'Work';
  if (route.startsWith('#/people')) return 'People';
  if (route.startsWith('#/evidence')) return 'Evidence';
  if (route.startsWith('#/topology')) return 'Topology';
  if (route.startsWith('#/audit')) return 'Audit';
  if (route.startsWith('#/settings')) return 'Settings';
  return 'Overview';
}
