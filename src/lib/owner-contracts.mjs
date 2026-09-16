/**
 * Workforce → owning Focusa operation contract map (WP-0.1.1 output).
 *
 * Resolved by inspecting the live Focusa daemon registry
 * (`GET /v1/agent/operations`, openapi 3.0.3, daemon 0.9.194-dev) and the
 * Focusa monorepo route table on 2026-09-16.
 *
 * Scope model (owner-declared, `focusa-core` ontology identity axes):
 *
 *   project_root_plus_continuity_id
 *     project_root   → project_folder_boundary
 *     continuity_id  → logical_workstream
 *
 * So a Workforce **Workstream** IS `{ project_root, continuity_id }`.
 * Workforce stores that selection as presentation context only; the owner
 * resolves all state.
 *
 * @module lib/owner-contracts
 */

/** How a Workforce semantic is satisfied by the owner. */
export const Resolution = Object.freeze({
  /** A real owning operation is used directly. */
  REAL: 'real',
  /** An equivalent owning operation exists and is used through a thin adapter. */
  EQUIVALENT: 'equivalent',
  /** The owner has the entity but exposes no operation yet (upstream gap). */
  GAP: 'gap',
});

/**
 * Owner operation descriptor.
 * @typedef {object} OwnerOperation
 * @property {string} id          owning operation id (registry / operationId)
 * @property {string} method
 * @property {string} path        path template
 * @property {string[]} scopes    required Focusa scope keys
 * @property {string} [family]
 * @property {string} [docs]      owning doc/spec reference
 * @property {boolean} [mutating]
 */

const op = (id, method, path, scopes, family, docs, mutating = false) =>
  Object.freeze({ id, method, path, scopes: Object.freeze(scopes), family, docs, mutating });

/** Real owning operations Workforce binds to. */
export const OPERATIONS = Object.freeze({
  health: op('focusa.health.check', 'GET', '/v1/health', [], 'base_focusa', 'docs/05'),

  // Project (owner of the project boundary)
  projectIdentity: op('focusa.project.identity', 'GET', '/v1/project/identity', ['project_root'], 'base_focusa', 'docs/135a'),
  projectStatus: op('focusa.project.status', 'GET', '/v1/project/status', ['project_root'], 'base_focusa', 'docs/135a'),
  projectDiscover: op('focusa.project.discover', 'GET', '/v1/project/discover', ['project_root'], 'base_focusa', 'docs/135a'),

  // Trajectory / frontier (owner of trajectory truth)
  trajectoryView: op('focusa.trajectory.view', 'GET', '/v1/trajectory/view', ['project_root', 'continuity_id'], 'base_focusa', 'docs/14'),
  workpointCurrent: op('focusa.workpoint.current', 'GET', '/v1/workpoint/current', ['project_root'], 'base_focusa', 'docs/14'),
  workpointResume: op('focusa.workpoint.resume', 'GET', '/v1/workpoint/resume', ['project_root', 'continuity_id'], 'base_focusa', 'docs/14'),
  workLoopStatus: op('focusa.work_loop.status', 'GET', '/v1/work-loop/status', ['project_root', 'continuity_id'], 'base_focusa', 'docs/133'),

  // Workforce members (silent sessions) — the real "who is working" source
  silentSessions: op('focusa.agent.silent_sessions', 'GET', '/v1/silent-sessions', ['project_root'], 'base_focusa', 'docs/133'),
  silentSessionStatus: op('focusa.agent.session.status', 'GET', '/v1/silent-sessions/{session_id}/status', ['project_root'], 'base_focusa', 'docs/133'),
  silentSessionProfiles: op('focusa.agent.session.profiles', 'GET', '/v1/silent-sessions/profiles', ['project_root'], 'base_focusa', 'docs/133'),

  // Direction / steer (owner of governed work direction)
  silentSessionSteer: op('focusa.agent.session.steer', 'POST', '/v1/silent-sessions/{session_id}/steer', ['project_root'], 'base_focusa', 'docs/133', true),
  silentSessionStart: op('focusa.agent.session.start', 'POST', '/v1/silent-sessions/{session_id}/start', ['project_root'], 'base_focusa', 'docs/133', true),
  silentSessionCancel: op('focusa.agent.session.cancel', 'POST', '/v1/silent-sessions/{session_id}/cancel', ['project_root'], 'base_focusa', 'docs/133', true),
  silentSessionApprovals: op('focusa.agent.session.approvals', 'POST', '/v1/silent-sessions/{session_id}/approvals', ['project_root'], 'base_focusa', 'docs/133', true),
  workLoopDriverPrompt: op('focusa.agent_execution.prompt', 'POST', '/v1/work-loop/driver/prompt', ['project_root', 'continuity_id'], 'base_focusa', 'docs/133', true),
  workLoopControl: op('focusa.work_loop.control', 'POST', '/v1/work-loop/control', ['project_root', 'continuity_id'], 'base_focusa', 'docs/133', true),

  // Roles (closest owner surface to Foreman identity today)
  roleProfiles: op('focusa.role_profile.list', 'GET', '/v1/roles/profiles', ['project_root', 'continuity_id', 'attachment_id'], 'base_focusa', 'docs/135b'),

  // Evidence (owner of proof)
  evidenceCapture: op('focusa.evidence.capture', 'POST', '/v1/evidence/capture', ['project_root'], 'base_focusa', 'docs/05', true),
  workpointLinkEvidence: op('focusa.workpoint.link_evidence', 'POST', '/v1/workpoint/link-evidence', ['project_root'], 'base_focusa', 'docs/05', true),

  // Events (owner of the stream)
  eventsRecent: op('focusa.events.recent', 'GET', '/v1/events/recent', ['project_root'], 'read_projection', 'docs/05'),
  eventsStream: op('focusa.events.stream', 'GET', '/v1/events/stream', ['project_root'], 'read_projection', 'docs/05'),

  // Device pairing (owner of the pairing handshake)
  pairStart: op('focusa.device_pair.start', 'POST', '/v1/device/pair/start', [], 'account_recovery', 'docs/05', true),
  pairStatus: op('focusa.device_pair.status', 'GET', '/v1/device/pair/status', [], 'account_recovery', 'docs/05'),

  // Entitlement truth (owner of lease state)
  licenseStatus: op('focusa.license.status', 'GET', '/v1/license/status', [], 'account_recovery', 'docs/152f'),
});

/**
 * Workforce semantic → owner resolution decision.
 * Each entry states the real binding, or a declared gap with the honest reason.
 */
export const SEMANTIC_RESOLUTION = Object.freeze({
  environment: Object.freeze({
    requirement: 'environment/pairing registry + health',
    resolution: Resolution.REAL,
    operations: Object.freeze(['health', 'licenseStatus', 'pairStart', 'pairStatus']),
  }),
  project: Object.freeze({
    requirement: 'project boundary resolution',
    resolution: Resolution.REAL,
    operations: Object.freeze(['projectIdentity', 'projectStatus', 'projectDiscover']),
    note: 'project_root is the project_folder_boundary identity axis',
  }),
  workstream: Object.freeze({
    requirement: 'workstream listing/resolution',
    resolution: Resolution.EQUIVALENT,
    operations: Object.freeze(['projectIdentity', 'trajectoryView', 'workpointCurrent']),
    note: 'owner identity axes: logical_workstream = continuity_id, scoped by project_root; '
      + 'workstream_id is derived (focusa-core workstream_root.rs). No standalone list route exists, '
      + 'so Workforce resolves the Workstream by (project_root, continuity_id) and lists projects, not workstreams.',
  }),
  foreman: Object.freeze({
    requirement: 'Foreman binding/status/hydration',
    resolution: Resolution.GAP,
    operations: Object.freeze(['roleProfiles']),
    note: 'OWNER GAP (UP-01): Focusa Spec 182 Project Foreman has no daemon operation. '
      + 'Closest real surface is the workstream-scoped role-profile list (currently empty). '
      + 'Workforce must render "no Foreman bound / owner operation not yet exposed" and must not fabricate one.',
  }),
  direction: Object.freeze({
    requirement: 'Direction / steer / proposal',
    resolution: Resolution.REAL,
    operations: Object.freeze(['silentSessionSteer', 'silentSessionApprovals', 'silentSessionStart', 'silentSessionCancel', 'workLoopControl']),
    note: 'steer requires an exact session/run/generation target; approval-gated actions use the owner approvals operation',
  }),
  trajectory: Object.freeze({
    requirement: 'Full/Medium/Short trajectory + frontier',
    resolution: Resolution.REAL,
    operations: Object.freeze(['trajectoryView', 'workpointCurrent', 'workpointResume', 'workLoopStatus']),
    note: 'trajectory/view is continuity_id-scoped; a scope mismatch is reported degraded by the owner',
  }),
  attention: Object.freeze({
    requirement: 'Needs You / human attention',
    resolution: Resolution.GAP,
    operations: Object.freeze(['silentSessionApprovals', 'workpointCurrent']),
    note: 'OWNER GAP (UP-03): no operator.attention.v1 operation is exposed. '
      + 'Workforce may only surface owner-declared approval requirements on a known session target.',
  }),
  evidence: Object.freeze({
    requirement: 'Evidence / verification / closure',
    resolution: Resolution.REAL,
    operations: Object.freeze(['evidenceCapture', 'workpointLinkEvidence']),
  }),
  execution: Object.freeze({
    requirement: 'UIAI execution refs / takeover',
    resolution: Resolution.REAL,
    operations: Object.freeze(['silentSessionStatus']),
    note: 'UIAI owns browser execution; Workforce links to the UIAI surface and shows session runtime state',
  }),
  people: Object.freeze({
    requirement: 'who is working / responsibility',
    resolution: Resolution.REAL,
    operations: Object.freeze(['silentSessions', 'silentSessionProfiles', 'silentSessionStatus']),
  }),
  fleet: Object.freeze({
    requirement: 'fleet / multi-environment presence',
    resolution: Resolution.GAP,
    operations: Object.freeze(['health']),
    note: 'OWNER GAP (UP-06): no fleet/presence projection. Workforce shows only locally paired environments and their health.',
  }),
});

/**
 * Build the scope key map for an owner request.
 * Only owner-declared identity axes are sent.
 *
 * @param {{projectRoot?: string, continuityId?: string, attachmentId?: string, workingSubpathId?: string}} scope
 * @returns {Record<string,string>}
 */
export function scopeQuery(scope = {}) {
  /** @type {Record<string,string>} */
  const q = {};
  if (scope.projectRoot) q.project_root = scope.projectRoot;
  if (scope.continuityId) q.continuity_id = scope.continuityId;
  if (scope.attachmentId) q.attachment_id = scope.attachmentId;
  if (scope.workingSubpathId) q.working_subpath_id = scope.workingSubpathId;
  return q;
}

/**
 * Workforce-facing Workstream reference. Presentation identity only —
 * the owner remains the resolver of record.
 *
 * @param {{projectRoot: string, continuityId: string}} input
 */
export function workstreamRef(input) {
  const projectRoot = input?.projectRoot;
  const continuityId = input?.continuityId;
  if (typeof projectRoot !== 'string' || !projectRoot) throw new TypeError('projectRoot is required for a Workstream reference');
  if (typeof continuityId !== 'string' || !continuityId) throw new TypeError('continuityId is required for a Workstream reference');
  return Object.freeze({
    schema: 'focusa.workforce.workstream_ref.v1',
    projectRoot,
    continuityId,
    label: `${projectRoot.split('/').filter(Boolean).pop() ?? projectRoot} · ${continuityId}`,
  });
}

/** Semantics that are genuinely unbound in the owner today. */
export const OWNER_GAPS = Object.freeze(
  Object.entries(SEMANTIC_RESOLUTION)
    .filter(([, v]) => v.resolution === Resolution.GAP)
    .map(([k]) => k),
);
