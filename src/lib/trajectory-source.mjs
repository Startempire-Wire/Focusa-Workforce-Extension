/**
 * Trajectory source resolution — stopgap + automatic cutover (AGENTS.md stopgap doctrine).
 *
 * The authoritative source is the owner's own trajectory projection
 * (`GET /v1/trajectory/view`). While it does not report a committed ladder —
 * currently focusa#621, where the projection reports a missing HLT even though
 * the owner's ledger holds a committed one — Workforce must still show the
 * mission shape and the exact next slice.
 *
 * So the ladder is derived from what the owner *does* answer authoritatively:
 *
 *   current executable workpoint  → /v1/workpoint/*      (reads back canonical)
 *   gap, next step and clarity    → trajectory/view intelligence_view
 *   runtime engagement posture    → /v1/work-loop/status
 *   project identity and axes     → /v1/project/*
 *
 * The stopgap never invents ladder values and never writes anything back. The UI
 * labels the answering source and the owner's failure class.
 *
 * Cutover: `resolveTrajectorySource` prefers the authoritative projection the
 * moment it reports a committed ladder — no flag, no config, no migration. When
 * focusa#621 lands, the stopgap branch stops being taken and can be deleted.
 *
 * @module lib/trajectory-source
 */

import { trajectoryFromOwner } from './workforce-client.mjs';

/** Sources the UI can label. */
export const TrajectorySource = Object.freeze({
  OWNER: 'owner_projection',
  STOPGAP: 'stopgap_derived',
});

/** Owner truth values that mean "no committed ladder yet". */
const NOT_COMMITTED = new Set(['missing_required', 'unclear', 'not_found', null]);

/**
 * Does the owner projection actually carry a committed ladder?
 *
 * Structural detection on the owner's own fields, so it keeps working when the
 * upstream fix lands without any change here.
 *
 * @param {any} viewResult result of the owner trajectory read (WorkforceResult)
 * @returns {{authoritative: boolean, reason: string|null, failureClass: string|null}}
 */
export function detectAuthoritativeLadder(viewResult) {
  if (!viewResult || viewResult.state === 'network') {
    return { authoritative: false, reason: 'owner unreachable', failureClass: 'network' };
  }
  const body = viewResult.data ?? {};
  const trajectory = body.trajectory ?? {};
  const lifecycle = trajectory.durable_lifecycle ?? {};
  const hltStatus = body.hlt_status ?? null;
  const definitionStatus = trajectory.definition_status ?? null;

  if (body.canonical === true && body.degraded !== true && !NOT_COMMITTED.has(hltStatus) && definitionStatus !== 'unclear') {
    return { authoritative: true, reason: null, failureClass: null };
  }
  const checkpoints = Array.isArray(lifecycle.checkpoints) ? lifecycle.checkpoints.length : 0;
  if (lifecycle.canonical === true && checkpoints > 0) {
    // A committed ladder the top-level status simply failed to summarize.
    return { authoritative: true, reason: null, failureClass: null };
  }

  const reason = (Array.isArray(body.warnings) && body.warnings[0])
    || trajectory.active_gap
    || viewResult.note
    || 'owner reports no committed ladder for this scope';
  return {
    authoritative: false,
    reason: String(reason),
    failureClass: body.failure_class ?? definitionStatus ?? 'not_committed',
  };
}

/**
 * Build the labelled ladder view Workforce renders.
 *
 * @param {{view?: any, workpoint?: any, workLoop?: any, workstream?: any}} inputs
 *   owner results (WorkforceResult shape) plus the selected Workstream reference
 * @returns {{source: string, authoritative: boolean, reason: string|null, failureClass: string|null, ladder: any, disclosure: string}}
 */
export function resolveTrajectorySource({ view = null, workpoint = null, workLoop = null, workstream = null } = {}) {
  const detection = detectAuthoritativeLadder(view);

  if (detection.authoritative) {
    return Object.freeze({
      source: TrajectorySource.OWNER,
      authoritative: true,
      reason: null,
      failureClass: null,
      ladder: trajectoryFromOwner(view?.data),
      disclosure: 'source: Focusa trajectory projection (authoritative)',
    });
  }

  const viewBody = view?.data ?? {};
  const intelligence = viewBody.intelligence_view ?? {};
  const clarity = intelligence.clarity_gate ?? {};
  const reconciliation = viewBody.trajectory_workpoint_reconciliation ?? {};
  const trajectory = viewBody.trajectory ?? {};
  const workpointBody = workpoint?.data ?? {};
  const loopBody = workLoop?.data ?? {};

  const ladder = Object.freeze({
    schema: 'focusa.workforce.trajectory_stopgap.v1',
    authoritative: false,
    workstream: workstream ?? null,
    // Only owner-reported values appear here; anything unreported stays null.
    currentWorkpoint: workpointBody.active_workpoint_id ?? reconciliation.active_workpoint_id ?? null,
    nextAction: viewBody.next_step_hint ?? null,
    gap: trajectory.active_gap ?? null,
    blockers: trajectory.blockers ?? [],
    clarityBlocking: clarity.blocking_reasons ?? [],
    reconciliation: Object.freeze({
      authorityForNextAction: reconciliation.authority_for_next_action ?? null,
      resolution: reconciliation.resolution ?? null,
      surfaceStates: reconciliation.surface_states ?? null,
    }),
    workLoop: Object.freeze({
      status: loopBody.status ?? null,
      degraded: loopBody.degraded ?? null,
    }),
  });

  return Object.freeze({
    source: TrajectorySource.STOP_GAP ?? TrajectorySource.STOP_GAP,
    authoritative: false,
    reason: detection.reason,
    failureClass: detection.failureClass,
    ladder,
    disclosure: `source: derived (stopgap) — Focusa projection reports no committed ladder: ${detection.reason}`,
  });
}
