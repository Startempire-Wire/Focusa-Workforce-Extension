/**
 * Evidence trail — stopgap until the owner exposes an evidence projection.
 *
 * Focusa owns evidence. Today the registry exposes evidence *writes*
 * (`evidence/capture`, `workpoint/link-evidence`) but no evidence read, so
 * Workforce cannot ask "what proof exists?" directly. What the owner does return
 * on every governed response is its own `evidence_refs` / `receipt_refs` — so the
 * trail is assembled from references the owner actually reported, tagged with the
 * operation that reported them.
 *
 * Nothing is inferred or synthesized: unreported means absent.
 *
 * Automatic cutover: if any owner response carries a structured evidence
 * projection (an `evidence` collection), it is preferred and this stopgap branch
 * stops being taken. No flag, no migration.
 *
 * @module lib/evidence-trail
 */

/** Read names whose owner responses may carry evidence/receipt references. */
const SOURCES = Object.freeze([
  'workpoint', 'trajectory', 'workLoop', 'sessions', 'health', 'projects',
  'projectStatus', 'roles', 'profiles', 'presets', 'events',
]);

function refsFrom(value) {
  return Array.isArray(value) ? value.filter((ref) => typeof ref === 'string' && ref) : [];
}

/**
 * Does any owner response carry a structured evidence projection?
 * @param {Record<string, any>} reads store read results keyed by read name
 */
export function detectEvidenceProjection(reads = {}) {
  for (const [name, result] of Object.entries(reads)) {
    const body = result?.data;
    const collection = body?.evidence ?? body?.data?.evidence;
    if (Array.isArray(collection) && collection.length > 0) {
      return { authoritative: true, source: name, entries: collection };
    }
  }
  return { authoritative: false, source: null, entries: [] };
}

/**
 * Assemble the evidence trail from owner-reported references.
 *
 * @param {Record<string, any>} reads store read results keyed by read name
 * @returns {{entries: Array<{kind: string, ref: string, source: string}>, authoritative: boolean, disclosure: string}}
 */
export function buildEvidenceTrail(reads = {}) {
  const projection = detectEvidenceProjection(reads);
  if (projection.authoritative) {
    return Object.freeze({
      authoritative: true,
      entries: Object.freeze(projection.entries.map((entry) => Object.freeze({
        kind: 'projection', ref: entry?.ref ?? entry?.id ?? String(entry), source: projection.source,
      }))),
      disclosure: `source: Focusa evidence projection (authoritative, via ${projection.source})`,
    });
  }

  const seen = new Set();
  const entries = [];
  for (const name of SOURCES) {
    const result = reads[name];
    if (!result || result.state !== 'ok') continue;
    const body = result.data ?? {};
    const groups = [
      ['evidence', refsFrom(body.evidence_refs)],
      ['receipt', refsFrom(body.receipt_refs)],
      ['evidence', refsFrom(body.data?.evidence_refs)],
      ['receipt', refsFrom(body.data?.receipt_refs)],
    ];
    for (const [kind, refs] of groups) {
      for (const ref of refs) {
        const key = `${kind}:${ref}`;
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push(Object.freeze({ kind, ref, source: name }));
      }
    }
  }

  return Object.freeze({
    authoritative: false,
    entries: Object.freeze(entries),
    disclosure: entries.length
      ? 'source: references reported by Focusa operations (stopgap — no evidence projection exists yet)'
      : 'source: references reported by Focusa operations (stopgap) — no evidence reference reported for this scope yet',
  });
}
