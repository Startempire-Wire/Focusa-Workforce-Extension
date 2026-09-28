/**
 * Daemon inspector: read-only visibility into what a connected daemon holds.
 *
 * Everything here answers "what is actually on that machine": its projects,
 * sessions, the operations it offers, its work loop, trajectory, roles,
 * providers and resources. All reads go through the governed owner client, so
 * entitlement, scope and failure semantics are the owner's own. A read the
 * owner refuses or cannot serve for the current scope is reported as such -
 * never retried, never invented.
 *
 * There is deliberately no mutation surface here: the inspector looks, it does
 * not touch. (The daemon also exposes no tool-call history endpoint; the
 * operations catalog below is the honest substitute: every API call the daemon
 * offers, straight from its registry.)
 */

import { ResultState } from './workforce-client.mjs';

/** Pick the project scope the inspector reads under. */
export function resolveScope(projectListBody) {
  const effective = projectListBody?.effective_project ?? null;
  const projectRoot = effective?.project_root
    ?? projectListBody?.projects?.[0]?.project_root
    ?? null;
  return { projectRoot, continuityId: null };
}

/** Try to learn a continuity id from a trajectory body (best effort). */
export function continuityFromTrajectory(trajectoryBody) {
  if (!trajectoryBody || typeof trajectoryBody !== 'object') return null;
  const stack = [trajectoryBody];
  const seen = new Set();
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    if (typeof node.continuity_id === 'string' && node.continuity_id) return node.continuity_id;
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') stack.push(value);
    }
  }
  return null;
}

function rowsOf(value, mapRow) {
  const list = Array.isArray(value) ? value
    : Array.isArray(value?.sessions) ? value.sessions
    : Array.isArray(value?.items) ? value.items
    : Array.isArray(value?.data) ? value.data
    : Array.isArray(value?.operations) ? value.operations
    : Array.isArray(value?.projects) ? value.projects
    : null;
  if (!list) return null;
  return list.slice(0, 100).map(mapRow);
}

function section(key, title, result, mapRow, { emptyNote = 'The owner reports nothing here.' } = {}) {
  if (!result || result.state !== ResultState.OK) {
    return {
      key, title,
      state: result?.state ?? ResultState.DEGRADED,
      note: result?.note ?? result?.failureClass ?? 'Owner did not serve this read.',
      count: null, rows: [],
    };
  }
  const rows = rowsOf(result.data, mapRow) ?? [];
  return {
    key, title,
    state: rows.length ? 'ok' : 'empty',
    note: rows.length ? null : emptyNote,
    count: rows.length,
    rows,
  };
}

const sessionRow = (row) => ({
  primary: row?.display_name ?? row?.title ?? row?.name ?? row?.session_id ?? row?.id ?? 'session',
  secondary: row?.mission ?? row?.objective ?? null,
  meta: [row?.health ?? row?.lifecycle ?? row?.state ?? row?.status,
    row?.authority?.project_root ?? null,
    row?.session_id ?? row?.id ?? null].filter(Boolean).join(' · ') || null,
});

const operationRow = (op) => ({
  primary: op?.id ?? op?.operationId ?? op?.name ?? 'operation',
  secondary: op?.description ?? op?.summary ?? null,
  meta: [op?.method ?? null, op?.path ?? op?.route ?? null].filter(Boolean).join(' ') || null,
});

/**
 * Load every inspector section for a scope. Reads run concurrently; each
 * section stands or falls on its own result.
 *
 * @param {*} client workforce client bound to the daemon (no token needed on tailnet/local)
 * @param {{projectRoot: string, continuityId?: string|null}} scope
 * @returns {Promise<{scope: object, sections: object[], operationsTotal: number|null}>}
 */
export async function loadInspector(client, scope, { projectListBody = null } = {}) {
  const ws = { projectRoot: scope.projectRoot, ...(scope.continuityId ? { continuityId: scope.continuityId } : {}) };
  const settled = async (promise) => {
    try { return await promise; }
    catch (error) { return { state: ResultState.DEGRADED, note: String(error?.message ?? error) }; }
  };

  const [sessions, operations, taskPlans, interviews, specSessions, roles, providers,
    workLoop, trajectory, stateCurrent, predictions, resourceMode, toolDoctor,
    missionCanvas, lineageHead] = await Promise.all([
    settled(client.sessions(scope.projectRoot)),
    settled(client.operations()),
    settled(client.taskPlans(ws)),
    settled(client.interviewsSessions(ws)),
    settled(client.specSessions(ws)),
    settled(client.roleProfiles({ ...ws, attachmentId: 'default' })),
    settled(client.providersContracts(ws)),
    settled(client.workLoopStatus(ws)),
    settled(client.trajectory(ws)),
    settled(client.stateCurrent(scope.projectRoot)),
    settled(client.predictionsRecent(ws)),
    settled(client.resourceMode()),
    settled(client.toolDoctor()),
    settled(client.missionCanvasState({ ...ws, attachmentId: 'default' })),
    settled(client.lineageHead()),
  ]);

  const operationsTotal = operations?.state === ResultState.OK
    ? (Array.isArray(operations.data) ? operations.data.length
      : Array.isArray(operations.data?.operations) ? operations.data.operations.length : null)
    : null;

  const projectRows = Array.isArray(projectListBody?.projects)
    ? projectListBody.projects.slice(0, 60).map((p) => ({
      primary: p?.canonical_name ?? p?.project_id ?? p?.project_root ?? 'project',
      secondary: p?.workspace_kind ?? p?.scope_safety ?? null,
      meta: p?.project_root ?? null,
    }))
    : [];
  const sections = [
    {
      key: 'projects', title: 'Projects',
      state: projectRows.length ? 'ok' : 'empty',
      note: projectRows.length ? null : 'The daemon reports no projects.',
      count: projectRows.length, rows: projectRows,
    },
    section('sessions', 'Silent sessions', sessions, sessionRow, { emptyNote: 'No silent sessions in this project.' }),
    section('operations', 'Agent operations (API calls this daemon offers)', operations,
      operationRow, { emptyNote: 'The daemon published no operation catalog.' }),
    section('task-plans', 'Task plans', taskPlans,
      (row) => ({ primary: row?.title ?? row?.name ?? row?.id ?? 'plan', secondary: row?.status ?? row?.state ?? null, meta: row?.id ?? null })),
    section('interviews', 'Interview sessions', interviews, sessionRow, { emptyNote: 'No interview sessions.' }),
    section('spec', 'Spec workbench sessions', specSessions, sessionRow, { emptyNote: 'No spec sessions.' }),
    section('roles', 'Role profiles (agents)', roles,
      (row) => ({ primary: row?.name ?? row?.role ?? row?.id ?? 'role', secondary: row?.description ?? null, meta: row?.id ?? null })),
    section('providers', 'Provider contracts', providers,
      (row) => ({ primary: row?.provider ?? row?.name ?? row?.id ?? 'provider', secondary: row?.status ?? null, meta: row?.model ?? row?.id ?? null })),
    section('workloop', 'Work loop', workLoop,
      (row) => ({ primary: row?.state ?? row?.status ?? 'state', secondary: row?.current_task?.title ?? row?.current_task?.id ?? null, meta: null })),
    section('trajectory', 'Trajectory', trajectory,
      (row) => ({ primary: row?.goal ?? row?.title ?? 'trajectory', secondary: row?.status ?? null, meta: null })),
    section('state', 'Daemon state', stateCurrent,
      (row) => ({ primary: row?.active_frame ?? row?.agent_id ?? 'state', secondary: null, meta: null })),
    section('predictions', 'Recent predictions', predictions,
      (row) => ({ primary: row?.prediction ?? row?.title ?? 'prediction', secondary: row?.status ?? null, meta: row?.created_at ?? null })),
    section('resources', 'Resource mode', resourceMode,
      (row) => ({ primary: row?.mode ?? row?.name ?? 'resource', secondary: JSON.stringify(row)?.slice(0, 160) ?? null, meta: null })),
    section('tooldoctor', 'Tool doctor', toolDoctor,
      (row) => ({ primary: row?.tool ?? row?.name ?? 'tool', secondary: row?.status ?? row?.diagnosis ?? null, meta: null })),
    section('canvas', 'Mission canvas', missionCanvas,
      (row) => ({ primary: row?.title ?? row?.name ?? 'canvas', secondary: row?.status ?? null, meta: null })),
    section('lineage', 'Lineage head', lineageHead,
      (row) => ({ primary: row?.head ?? row?.id ?? 'lineage', secondary: null, meta: null })),
  ];

  return { scope: ws, sections, operationsTotal };
}
