/**
 * Scope and freshness guards (WP-1.1.4).
 *
 * Workforce must never present a projection as current truth when the owner
 * cannot confirm the scope it belongs to. These guards read the owner's own
 * signals — project identity confidence, selection requirement, freshness/
 * revision, entitlement posture — and report a level with the owner's reason.
 *
 * The guard does not fabricate a verdict: when the owner is silent, the guard
 * says the scope is unconfirmed rather than assuming it is fine.
 *
 * @module lib/scope-guard
 */

/**
 * @param {{workstream?: any, projectIdentity?: any, projectStatus?: any, trajectoryView?: any, license?: any, health?: any}} input
 *   Workstream reference plus owner read results (WorkforceResult shape)
 * @returns {{level: 'ok'|'warn'|'blocked', reasons: Array<{guard: string, detail: string, source: string}>, canDirect: boolean}}
 */
export function evaluateScopeGuard({ workstream = null, projectIdentity = null, projectStatus = null, trajectoryView = null, license = null, health = null } = {}) {
  const reasons = [];

  if (!health || health.state === 'network') {
    reasons.push({ guard: 'owner', detail: 'the owner is unreachable, so no projection can be trusted as current', source: 'health' });
  }
  if (!workstream) {
    reasons.push({ guard: 'workstream', detail: 'no Workstream selected (project folder + continuity id)', source: 'selection' });
  }

  const identity = projectIdentity?.data ?? null;
  if (identity) {
    const confidence = identity.confidence ?? identity.project_identity?.confidence ?? null;
    const mismatches = identity.mismatches ?? identity.project_identity?.mismatches ?? [];
    if (confidence && confidence !== 'high') {
      reasons.push({ guard: 'identity', detail: `owner reports ${confidence} confidence for this project scope`, source: 'project_identity' });
    }
    if (Array.isArray(mismatches) && mismatches.length > 0) {
      reasons.push({ guard: 'identity_mismatch', detail: mismatches.join('; '), source: 'project_identity' });
    }
    if (identity.degraded === true) {
      reasons.push({
        guard: 'identity_degraded',
        detail: identity.mismatch_reason ?? 'owner reports the project identity projection as degraded',
        source: 'project_identity',
      });
    }
  } else if (projectIdentity && projectIdentity.state !== 'ok') {
    reasons.push({ guard: 'identity_unavailable', detail: `project identity read returned ${projectIdentity.state}`, source: 'project_identity' });
  }

  const status = projectStatus?.data ?? null;
  if (status?.failure_class === 'project_root_selection_required') {
    reasons.push({ guard: 'selection_required', detail: 'owner requires an explicit project selection before it will serve project state', source: 'project_status' });
  }

  if (trajectoryView && trajectoryView.authoritative === false && trajectoryView.failureClass === 'scope_mismatch') {
    reasons.push({ guard: 'trajectory_scope', detail: trajectoryView.reason ?? 'trajectory projection is not for this scope', source: 'trajectory' });
  }

  const posture = license?.data?.authority?.state ?? license?.data?.state ?? null;
  if (license?.state === 'entitlement_blocked' || (posture && posture !== 'active')) {
    reasons.push({ guard: 'entitlement', detail: `owner entitlement posture is ${posture ?? 'blocked'}`, source: 'license' });
  }

  const blocking = reasons.some((reason) => reason.guard === 'owner' || reason.guard === 'workstream');
  const level = reasons.length === 0 ? 'ok' : (blocking ? 'blocked' : 'warn');

  return {
    level,
    reasons,
    // Direction is a consequential owner mutation: it needs a real scope and a
    // reachable owner, not merely a warn-level annotation.
    canDirect: level !== 'blocked' && Boolean(workstream),
  };
}

/** One-line summary for the surface. */
export function describeScopeGuard(guard) {
  if (!guard) return 'scope guard unavailable';
  if (guard.level === 'ok') return 'scope confirmed by Focusa';
  const names = guard.reasons.map((reason) => reason.guard).join(', ');
  return `scope ${guard.level}: ${names}`;
}
