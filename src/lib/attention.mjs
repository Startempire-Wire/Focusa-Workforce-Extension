/**
 * Needs You — human-value attention (stopgap until the owner exposes attention).
 *
 * Focusa owns attention. Today the registry exposes no `operator.attention.v1`
 * operation (a known owner gap, UP-03), so Workforce derives the attention list
 * only from signals the owner actually reported:
 *
 *   - roster entries the owner reported as waiting/blocked/needs-input
 *   - the owner's own clarity-gate blocking reasons and trajectory blockers
 *   - owner events whose type states an approval/waiting/blocked condition
 *
 * Nothing is inferred, ranked by guesswork, or duplicated from elsewhere.
 *
 * Automatic cutover: if any owner response carries a structured attention
 * projection, it is preferred and this branch stops being taken.
 *
 * @module lib/attention
 */

/** Session states the owner uses that legitimately need a human. */
const HUMAN_STATES = Object.freeze(['waiting_input', 'waiting', 'needs_input', 'needs_you', 'blocked', 'paused']);

/** Event types that state a human decision is required. */
const HUMAN_EVENT = /(approval|approve|waiting|blocked|needs[_ -]?(you|input)|human|escalat|permission|denied)/i;

/**
 * Is a structured owner attention projection present?
 * @param {Record<string, any>} reads
 */
export function detectAttentionProjection(reads = {}) {
  for (const [name, result] of Object.entries(reads)) {
    const body = result?.data;
    const collection = body?.attention ?? body?.needs_you ?? body?.data?.attention;
    if (Array.isArray(collection)) {
      return { authoritative: true, source: name, entries: collection };
    }
  }
  return { authoritative: false, source: null, entries: [] };
}

/**
 * Derive the attention list from owner-reported signals.
 *
 * @param {{roster?: any[], trajectoryView?: any, activity?: any[], reads?: Record<string, any>}} input
 * @returns {{authoritative: boolean, items: Array<object>, disclosure: string}}
 */
export function buildNeedsYou({ roster = [], trajectoryView = null, activity = [], reads = {} } = {}) {
  const projection = detectAttentionProjection(reads);
  if (projection.authoritative) {
    return Object.freeze({
      authoritative: true,
      items: Object.freeze(projection.entries.map((entry) => Object.freeze({
        kind: 'owner_attention',
        label: entry?.title ?? entry?.label ?? entry?.id ?? 'owner attention item',
        detail: entry?.reason ?? entry?.detail ?? null,
        source: projection.source,
      }))),
      disclosure: `source: Focusa attention projection (authoritative, via ${projection.source})`,
    });
  }

  const items = [];

  for (const entry of roster) {
    if (!entry?.state) continue;
    if (!HUMAN_STATES.includes(String(entry.state).toLowerCase())) continue;
    items.push(Object.freeze({
      kind: 'session',
      label: entry.label ?? entry.id ?? 'session',
      detail: `owner reports state: ${entry.state}`,
      source: 'roster',
    }));
  }

  const ladder = trajectoryView?.ladder ?? null;
  if (ladder) {
    for (const reason of ladder.clarityBlocking ?? []) {
      items.push(Object.freeze({
        kind: 'owner_gate',
        label: `Focusa clarity gate: ${reason}`,
        detail: 'the owner requires this before it will treat the ladder as clear',
        source: 'trajectory',
      }));
    }
    for (const blocker of ladder.blockers ?? []) {
      const label = typeof blocker === 'string' ? blocker : (blocker?.label ?? blocker?.reason ?? JSON.stringify(blocker));
      items.push(Object.freeze({ kind: 'blocker', label, detail: 'owner-reported blocker', source: 'trajectory' }));
    }
  }

  for (const event of activity) {
    if (!event?.type || !HUMAN_EVENT.test(event.type)) continue;
    items.push(Object.freeze({
      kind: 'event',
      label: event.type,
      detail: `${event.timestamp ?? 'time not reported'}${event.sessionId ? ` · session ${String(event.sessionId).slice(0, 8)}` : ''}`,
      source: 'events',
    }));
  }

  const seen = new Set();
  const deduped = items.filter((item) => {
    const key = `${item.kind}:${item.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return Object.freeze({
    authoritative: false,
    items: Object.freeze(deduped),
    disclosure: deduped.length
      ? 'source: derived (stopgap) — Focusa has no attention operation yet; these are owner-reported attention signals'
      : 'source: derived (stopgap) — Focusa reports no attention signal for this scope',
  });
}
