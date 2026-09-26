/**
 * Roster grouping for the docs/17 §10 People face.
 *
 * The atlas groups indexes into FOREMEN / MANAGERS / WORKERS-SPECIALISTS /
 * VERIFIERS tiers. Workforce never invents identity (AGENTS.md): a person's
 * tier is whatever role the OWNER reports on the session row — we group by that
 * value and label the group with it. Sessions with no reported role land in a
 * clearly-labelled "Unassigned" group (role not reported), never a fabricated
 * tier.
 */

const UNASSIGNED = 'Unassigned';

/**
 * @param {Array<object>} roster owner-normalized session rows
 * @returns {Array<{role: string, entries: Array<object>}>} first-seen role
 *   order, Unassigned always last.
 */
export function groupRoster(roster) {
  const order = [];
  const groups = new Map();
  for (const entry of roster ?? []) {
    const role = entry?.role?.trim ? entry.role.trim() : '';
    const key = role || UNASSIGNED;
    if (!groups.has(key)) {
      groups.set(key, { role: key, entries: [] });
      if (role) order.push(key);
    }
    groups.get(key).entries.push(entry);
  }
  if (groups.has(UNASSIGNED)) order.push(UNASSIGNED);
  return order.map((key) => groups.get(key));
}

/**
 * Row priority per docs/17 §10: identity/role | current responsibility |
 * workstream | state | last proof. Execution location is secondary.
 * Returns ONLY owner-reported fields as facts, in priority order.
 *
 * @param {object} person owner-normalized session row
 * @returns {Array<{label: string, value: string, kind: string}>}
 */
export function personFacts(person) {
  const f = (label, value, kind = 'plain') =>
    value !== null && value !== undefined && value !== ''
      ? { label, value: String(value), kind }
      : null;
  const out = [];
  const identity = person?.label;
  if (identity !== null && identity !== undefined && identity !== '') {
    out.push({ label: 'identity', value: String(identity), kind: 'strong' });
  }
  if (person?.role) out.push(f('role', person.role, 'cap'));
  if (person?.state) out.push(f('state', person.state, 'cap'));
  if (person?.runId) out.push(f('current work', `run ${person.runId}${Number.isSafeInteger(person.generation) && person.generation >= 1 ? ` · gen ${person.generation}` : ''}`, 'mono'));
  if (person?.workspace) out.push(f('workstream mode', person.workspace));
  if (person?.authority) out.push(f('authority', person.authority, 'cap'));
  if (person?.configRevision) out.push(f('config revision', person.configRevision, 'mono'));
  if (person?.updatedAt) out.push(f('last proof', person.updatedAt, 'mono'));
  return out;
}

/**
 * Distinct owner-reported states across the roster (for the index filter).
 * @param {Array<object>} roster
 */
export function distinctStates(roster) {
  const seen = new Set();
  for (const entry of roster ?? []) {
    if (entry?.state) seen.add(String(entry.state));
  }
  return [...seen];
}