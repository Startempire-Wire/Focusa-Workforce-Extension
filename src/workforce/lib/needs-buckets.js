/**
 * Needs You indexing per docs/17 §11: NOW / SOON / SNOOZED / RECENTLY RESOLVED.
 *
 * Workforce only buckets by OWNER-REPORTED signals: an item is SOON only if the
 * owner reports a future due/expiry, SNOOZED/RESOLVED only if the owner reports
 * that status. Items without any of these signals are NOW (they are actionable
 * attention, by construction of buildNeedsYou). Anything unreported is never
 * invented.
 */

const RESOLVED_STATES = new Set(['resolved', 'done', 'closed', 'settled']);

/**
 * @param {Array<{kind?: string, label?: string, detail?: string, source?: string, dueAt?: string|null, expiresAt?: string|null, status?: string|null}>} items
 * @returns {{now: any[], soon: any[], snoozed: any[], resolved: any[]}}
 */
export function needsBuckets(items = []) {
  const now = [];
  const soon = [];
  const snoozed = [];
  const resolved = [];
  const nowMs = Date.now();
  for (const item of items ?? []) {
    const status = (item?.status ?? '').toLowerCase();
    if (RESOLVED_STATES.has(status)) {
      resolved.push(item);
      continue;
    }
    if (status === 'snoozed') {
      snoozed.push(item);
      continue;
    }
    const deadline = item?.dueAt ?? item?.expiresAt ?? null;
    const deadMs = deadline ? Date.parse(deadline) : NaN;
    if (Number.isFinite(deadMs) && deadMs > nowMs) {
      soon.push(item);
    } else {
      now.push(item);
    }
  }
  return Object.freeze({ now, soon, snoozed, resolved });
}