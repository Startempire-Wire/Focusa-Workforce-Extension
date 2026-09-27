/**
 * Evidence indexing per docs/18 §Evidence:
 * Needs verification -> Recently verified -> Settled -> Stale/corrected.
 *
 * Kinds map ONLY from what the owner reports: 'evidence' -> needs
 * verification, 'receipt'/'projection' -> settled, corrected/revoked/stale ->
 * stale/corrected. "Recently verified" has no owner signal yet among the
 * kinds Workforce sees, so it is never fabricated — the index simply omits it
 * (the UI says so explicitly).
 */

/**
 * @param {Array<{kind?: string, ref: any, source?: string}>} entries
 * @returns {{needs: any[], settled: any[], stale: any[]}}
 */
export function evidenceBuckets(entries = []) {
  const needs = [];
  const settled = [];
  const stale = [];
  for (const entry of entries ?? []) {
    const kind = String(entry?.kind ?? '');
    if (kind === 'receipt' || kind === 'projection') {
      settled.push(entry);
    } else if (kind === 'corrected' || kind === 'revoked' || kind === 'stale') {
      stale.push(entry);
    } else {
      needs.push(entry);
    }
  }
  return Object.freeze({ needs, settled, stale });
}

/** Distinct owner-reported sources across entries (for filter UI). */
export function evidenceSources(entries = []) {
  const seen = new Set();
  for (const entry of entries ?? []) {
    if (entry?.source) seen.add(String(entry.source));
  }
  return [...seen];
}