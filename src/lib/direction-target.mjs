/**
 * Direction target binding — stopgap while the owner has no session instances.
 *
 * Focusa's steer/approval contract requires an **exact** target:
 * `session_id` + `run_id` + positive `generation`. Workforce must never guess it.
 * Two honest sources are supported, in priority order:
 *
 *   1. the owner's own roster projection, when it carries run + generation
 *   2. an operator-bound exact target pasted from any authoritative surface
 *      (Focusa CLI, another client) — a reference only, never canonical state
 *
 * The operator binding is a stopgap: as soon as the owner's roster reports a
 * usable target it is preferred automatically, and the binding is ignored.
 * No flag, no migration.
 *
 * @module lib/direction-target
 */

/** Is this a well-formed exact owner target? Mirrors the governed path's rule. */
export function isValidExactTarget(value) {
  return Boolean(value)
    && typeof value?.session_id === 'string' && value.session_id.length > 0
    && typeof value?.run_id === 'string' && value.run_id.length > 0
    && Number.isSafeInteger(value?.generation) && value.generation >= 1;
}

/**
 * Derive an exact target from an owner roster entry.
 * Requires both run and generation to be owner-reported; never infers them.
 *
 * @param {any} entry
 * @returns {{session_id: string, run_id: string, generation: number}|null}
 */
export function targetFromRosterEntry(entry) {
  const candidate = {
    session_id: entry?.id ?? null,
    run_id: entry?.runId ?? null,
    generation: entry?.generation ?? null,
  };
  return isValidExactTarget(candidate)
    ? Object.freeze({ session_id: candidate.session_id, run_id: candidate.run_id, generation: candidate.generation })
    : null;
}

/** First roster entry that carries a complete exact target. */
export function firstTargetFromRoster(roster = []) {
  for (const entry of roster) {
    const target = targetFromRosterEntry(entry);
    if (target) return target;
  }
  return null;
}

/**
 * Parse an operator-supplied exact target. Accepts JSON or the compact
 * `session:run:generation` form. Rejects everything else with the reason.
 *
 * @param {string} input
 * @returns {{ok: true, target: object} | {ok: false, error: string}}
 */
export function parseExactTarget(input) {
  const text = typeof input === 'string' ? input.trim() : '';
  if (!text) return { ok: false, error: 'paste an exact target: session_id, run_id, generation' };

  if (text.startsWith('{')) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: 'target JSON is malformed' };
    }
    const target = {
      session_id: parsed.session_id ?? parsed.sessionId ?? null,
      run_id: parsed.run_id ?? parsed.runId ?? null,
      generation: typeof parsed.generation === 'string' ? Number(parsed.generation) : parsed.generation,
    };
    return isValidExactTarget(target)
      ? { ok: true, target: Object.freeze(target) }
      : { ok: false, error: 'target needs session_id, run_id and a generation of 1 or more' };
  }

  const parts = text.split(':').map((part) => part.trim());
  if (parts.length !== 3) {
    return { ok: false, error: 'expected session_id:run_id:generation or a JSON object' };
  }
  const target = { session_id: parts[0], run_id: parts[1], generation: Number(parts[2]) };
  return isValidExactTarget(target)
    ? { ok: true, target: Object.freeze(target) }
    : { ok: false, error: 'target needs a non-empty session and run, and a generation of 1 or more' };
}

/** Human label for a target, never exposing more than the owner already shows. */
export function describeTarget(target) {
  if (!isValidExactTarget(target)) return 'no exact target';
  return `${target.session_id} · run ${target.run_id} · gen ${target.generation}`;
}

/**
 * Resolve the target Direction should use.
 *
 * @param {{roster?: any[], bound?: any}} input
 * @returns {{target: object|null, origin: 'owner_roster'|'operator_binding'|null}}
 */
export function resolveDirectionTarget({ roster = [], bound = null } = {}) {
  const fromRoster = firstTargetFromRoster(roster);
  if (fromRoster) return { target: fromRoster, origin: 'owner_roster' };
  if (isValidExactTarget(bound)) return { target: { ...bound }, origin: 'operator_binding' };
  return { target: null, origin: null };
}
