/**
 * Shared Workforce runtime client.
 *
 * One place that talks to owning Focusa operations for every Workforce
 * surface (full page, side panel, start page). It never owns canonical
 * state: it reads owner projections and submits typed intent through the
 * exact owner operations declared in `owner-contracts.mjs`.
 *
 * MV3 note: this module is stateless and cheap to construct; the service
 * worker may suspend between calls.
 *
 * @module lib/workforce-client
 */

import { OPERATIONS, scopeQuery } from './owner-contracts.mjs';
import { normalizeDaemonOrigin } from './validation.mjs';
import { runReliableEventStream } from './reconnect.mjs';

/** Honest result states, mirroring the owner's own failure taxonomy. */
export const ResultState = Object.freeze({
  OK: 'ok',
  DEGRADED: 'degraded',
  ENTITLEMENT_BLOCKED: 'entitlement_blocked',
  UNAUTHENTICATED: 'unauthenticated',
  FORBIDDEN: 'forbidden',
  UNSUPPORTED: 'unsupported',
  CONFLICT: 'conflict',
  INVALID: 'invalid',
  NETWORK: 'network',
});

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * @typedef {object} WorkforceResult
 * @property {string} state   one of ResultState
 * @property {number|null} status
 * @property {any} data
 * @property {string|null} failureClass
 * @property {string|null} code      owner error code when present
 * @property {string|null} recovery  owner recovery action when present
 * @property {string|null} note      human-readable, owner-sourced where possible
 */

/** @returns {WorkforceResult} */
function result(state, { status = null, data = null, failureClass = null, code = null, recovery = null, note = null } = {}) {
  return { state, status, data, failureClass, code, recovery, note };
}

class ClientError extends Error {
  /** @param {WorkforceResult} r */
  constructor(r) {
    super(r.note ?? r.state);
    this.result = r;
  }
}

/**
 * Create a client bound to one paired Focusa environment.
 *
 * @param {{baseUrl: string, token?: string|null, fetchImpl?: typeof fetch, timeoutMs?: number}} config
 */
export function createWorkforceClient(config) {
  const origin = normalizeDaemonOrigin(config?.baseUrl);
  const token = config?.token ?? null;
  const fetchImpl = config?.fetchImpl ?? globalThis.fetch;
  const timeoutMs = config?.timeoutMs ?? 20000;
  if (typeof fetchImpl !== 'function') throw new TypeError('a fetch implementation is required');

  /**
   * Perform one owner operation.
   *
   * @param {keyof typeof OPERATIONS} opName
   * @param {{scope?: object, path?: Record<string,string>, body?: any, method?: string, headers?: Record<string,string>}} [opts]
   * @returns {Promise<WorkforceResult>}
   */
  async function call(opName, opts = {}) {
    const operation = OPERATIONS[opName];
    if (!operation) throw new TypeError(`unknown owner operation: ${String(opName)}`);

    let path = operation.path;
    for (const [key, value] of Object.entries(opts.path ?? {})) {
      path = path.replace(`{${key}}`, encodeURIComponent(value));
    }
    // Scope keys are owner identity axes; opts.query carries explicit operation
    // parameters (e.g. discovery bounds). Both go on the query string.
    const query = { ...scopeQuery(opts.scope ?? {}), ...(opts.query ?? {}) };
    const url = new URL(path, origin);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

    const headers = { accept: 'application/json', ...(opts.headers ?? {}) };
    if (token) headers.authorization = `Bearer ${token}`;
    if (operation.mutating) {
      headers['x-focusa-permissions'] = 'write:*';
      if (opts.body !== undefined) headers['content-type'] = 'application/json';
    } else {
      headers['x-focusa-permissions'] = 'read:*';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(url, {
        method: opts.method ?? operation.method,
        headers,
        signal: controller.signal,
        ...(opts.body === undefined ? {} : { body: JSON.stringify(opts.body) }),
      });
    } catch (error) {
      return result(ResultState.NETWORK, { note: `owner unreachable: ${error?.name ?? 'network error'}` });
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text().catch(() => '');
    if (text.length > MAX_BYTES) return result(ResultState.INVALID, { status: response.status, note: 'owner response exceeded the bound' });
    let body = null;
    if (text) {
      try { body = JSON.parse(text); } catch { return result(ResultState.INVALID, { status: response.status, note: 'owner response was not JSON' }); }
    }

    const ownerError = body?.error ?? null;
    const code = ownerError?.code ?? null;
    const recovery = ownerError?.recovery?.action ?? null;
    const failureClass = body?.failure_class ?? ownerError?.code ?? null;

    if (!response.ok) {
      if (typeof code === 'string' && code.startsWith('ENTITLEMENT_')) {
        return result(ResultState.ENTITLEMENT_BLOCKED, {
          status: response.status, data: body, code, recovery, failureClass: 'entitlement_blocked',
          note: ownerError?.message ?? 'owner entitlement policy denied this operation',
        });
      }
      if (response.status === 401) return result(ResultState.UNAUTHENTICATED, { status: response.status, data: body, code, failureClass });
      if (response.status === 403) return result(ResultState.FORBIDDEN, { status: response.status, data: body, code, recovery, failureClass });
      if (response.status === 404 || response.status === 405 || response.status === 501) {
        return result(ResultState.UNSUPPORTED, { status: response.status, data: body, code, failureClass, note: 'owner does not expose this operation' });
      }
      if (response.status === 409) return result(ResultState.CONFLICT, { status: response.status, data: body, code, failureClass });
      return result(ResultState.DEGRADED, { status: response.status, data: body, code, recovery, failureClass });
    }

    if (body?.degraded === true) {
      return result(ResultState.DEGRADED, {
        status: response.status, data: body, failureClass: body.failure_class ?? null, code,
        note: body.recovery_hint ?? 'owner reports a degraded projection',
      });
    }
    if (body?.status === 'not_found' || body?.failure_class === 'not_found') {
      return result(ResultState.OK, { status: response.status, data: body, failureClass: 'not_found', note: 'owner has no record for this scope yet' });
    }
    return result(ResultState.OK, { status: response.status, data: body, code, failureClass });
  }

  return Object.freeze({
    baseUrl: origin,
    get hasToken() { return Boolean(token); },

    /**
     * Subscribe to the owner's live event stream.
     *
     * Freshness is owner-sourced: Workforce never synthesizes events, it only
     * reacts to what the owner emits and then re-reads the projections it owns.
     * Reconnection, backoff and cursor replay come from the proven stream client.
     *
     * @param {{onEvent: (event: any) => void, onState?: (state: any) => void,
     *          signal?: AbortSignal, initialCursor?: string|null,
     *          commitCursor?: (cursor: string|null) => void|Promise<void>,
     *          path?: string}} input
     */
    openEventStream(input) {
      return runReliableEventStream({
        baseUrl: origin,
        token,
        path: input.path ?? `${OPERATIONS.eventsStream.path}?${new URLSearchParams(scopeQuery(input.scope ?? {})).toString()}`.replace(/\?$/, ''),
        initialCursor: input.initialCursor ?? null,
        fetchImpl,
        onEvent: input.onEvent,
        onState: input.onState ?? (() => {}),
        commitCursor: input.commitCursor ?? (() => {}),
        signal: input.signal,
      });
    },

    // ── environment ────────────────────────────────────────────────────────
    /** @returns {Promise<WorkforceResult>} */ health: () => call('health'),
    /** @returns {Promise<WorkforceResult>} */ licenseStatus: () => call('licenseStatus'),
    /** @param {string} projectRoot */
    projectIdentity: (projectRoot) => call('projectIdentity', { scope: { projectRoot } }),
    /** @param {string} projectRoot */
    projectStatus: (projectRoot) => call('projectStatus', { scope: { projectRoot } }),
    /** Owner project dashboard (selected project + registered projects). */
    projectList: () => call('projectList'),
    /**
     * Owner project discovery. Scans for project roots; results are owner summaries.
     * @param {{from?: string, maxDepth?: number, maxResults?: number, includeGitOnly?: boolean}} [input]
     */
    projectDiscover: (input = {}) => call('projectDiscover', {
      query: {
        ...(input.from ? { from: input.from } : {}),
        ...(input.maxDepth ? { max_depth: String(input.maxDepth) } : {}),
        ...(input.maxResults ? { max_results: String(input.maxResults) } : {}),
        ...(input.includeGitOnly === undefined ? {} : { include_git_only: String(input.includeGitOnly) }),
      },
    }),
    /**
     * Select the active project in the owner (owner owns selection state).
     * @param {{projectRoot: string, activeWorktreeRoot?: string, selectedBy?: string, note?: string}} input
     */
    projectUse: (input) => call('projectUse', {
      body: {
        project_root: input.projectRoot,
        ...(input.activeWorktreeRoot ? { active_worktree_root: input.activeWorktreeRoot } : {}),
        selected_by: input.selectedBy ?? 'focusa-workforce-chrome',
        ...(input.note ? { note: input.note } : {}),
      },
    }),

    // ── workstream (project_root + continuity_id) ──────────────────────────
    /** @param {{projectRoot: string, continuityId: string}} ws */
    trajectory: (ws) => call('trajectoryView', { scope: ws }),
    /** @param {string} projectRoot */
    workpointCurrent: (projectRoot) => call('workpointCurrent', { scope: { projectRoot } }),
    /** @param {{projectRoot: string, continuityId: string}} ws */
    workpointResume: (ws) => call('workpointResume', { scope: ws }),
    /** @param {{projectRoot: string, continuityId: string}} ws */
    workLoopStatus: (ws) => call('workLoopStatus', { scope: ws }),

    // ── people / responsibility ────────────────────────────────────────────
    /** @param {string} projectRoot */
    sessions: (projectRoot) => call('silentSessions', { scope: { projectRoot } }),
    /** @param {string} projectRoot */
    sessionProfiles: (projectRoot) => call('silentSessionProfiles', { scope: { projectRoot } }),
    /** @param {string} projectRoot */
    sessionPresets: (projectRoot) => call('silentSessionPresets', { scope: { projectRoot } }),
    /** @param {string} sessionId */
    sessionStatus: (sessionId, scope) => call('silentSessionStatus', { path: { session_id: sessionId }, scope }),

    // ── foreman surface (owner gap) ────────────────────────────────────────
    /** @param {{projectRoot: string, continuityId: string, attachmentId?: string}} ws */
    roleProfiles: (ws) => call('roleProfiles', {
      scope: { projectRoot: ws.projectRoot, continuityId: ws.continuityId, attachmentId: ws.attachmentId ?? 'default' },
    }),

    // ── events ─────────────────────────────────────────────────────────────
    /** @param {string} projectRoot */
    eventsRecent: (projectRoot, limit = 20) =>
      call('eventsRecent', { scope: { projectRoot }, query: { limit: String(limit) } }),
  });
}

/**
 * Normalize the owner project dashboard into what Workforce renders.
 * @param {any} ownerData
 */
export function projectsFromOwner(ownerData) {
  const body = ownerData?.data ?? ownerData ?? {};
  const list = Array.isArray(body.projects) ? body.projects : [];
  const selected = body.selected ?? body.effective_project ?? null;
  return Object.freeze({
    projects: Object.freeze(list.map((p) => Object.freeze({
      id: p.project_id ?? null,
      name: p.canonical_name ?? p.project_id ?? p.project_root ?? 'project',
      root: p.project_root ?? null,
      stack: p.stack ?? null,
      status: p.status ?? null,
    }))),
    selected: selected ? Object.freeze({ root: selected.project_root ?? null, id: selected.project_id ?? null }) : null,
    degraded: body.status === 'degraded' || body.degraded === true,
    failureClass: body.failure_class ?? null,
  });
}

/**
 * Normalize owner project discovery output.
 * @param {any} ownerData
 */
export function discoveredFromOwner(ownerData) {
  const body = ownerData?.data ?? ownerData ?? {};
  const list = Array.isArray(body.projects) ? body.projects : [];
  return Object.freeze(list.map((p) => Object.freeze({
    id: p.project_id ?? null,
    name: p.canonical_name ?? p.project_id ?? p.project_root ?? 'project',
    root: p.project_root ?? null,
    stack: p.stack ?? null,
    hasMarker: Boolean(p.has_marker),
    hasGit: Boolean(p.has_git),
  })));
}

/**
 * Normalize a silent-sessions listing into Workforce roster entries.
 * Returns only what the owner projected; no invented fields.
 *
 * @param {any} ownerData payload from the owner (envelope or bare body)
 */
export function rosterFromOwner(ownerData) {
  const rows = ownerData?.data ?? ownerData?.sessions ?? ownerData?.items ?? ownerData;
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => Object.freeze({
    id: row.session_id ?? row.id ?? null,
    label: row.title ?? row.name ?? row.session_id ?? row.id ?? 'session',
    state: row.state ?? row.status ?? null,
    role: row.role ?? row.profile ?? null,
    runId: row.active_run_id ?? row.run_id ?? null,
    generation: row.generation ?? row.active_generation ?? null,
    updatedAt: row.updated_at ?? row.last_activity_at ?? null,
  }));
}

/**
 * Normalize the owner trajectory projection into what Workforce renders.
 * Unknown/missing fields stay null so the UI can be honest.
 *
 * @param {any} ownerData
 */
export function trajectoryFromOwner(ownerData) {
  const body = ownerData?.data ?? ownerData ?? {};
  const projected = body.trajectory ?? body.view ?? body;
  return Object.freeze({
    schema: projected?.schema ?? null,
    degraded: Boolean(body?.degraded ?? projected?.degraded),
    hltRef: projected?.hlt_ref ?? projected?.hlt_id ?? null,
    current: projected?.current ?? projected?.current_workpoint ?? null,
    next: projected?.next ?? projected?.next_workpoint ?? null,
    frontier: projected?.frontier ?? null,
    coverage: projected?.coverage ?? null,
    revision: projected?.revision ?? body?.state_version ?? null,
    raw: projected ?? null,
  });
}
