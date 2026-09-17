import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeScopeGuard, evaluateScopeGuard } from '../src/lib/scope-guard.mjs';

const WS = { projectRoot: '/p', continuityId: 'main' };
const OK_HEALTH = { state: 'ok', data: { ok: true, status: 'ok' } };

test('a confirmed scope with a healthy owner is ok and may direct', () => {
  const guard = evaluateScopeGuard({
    workstream: WS,
    health: OK_HEALTH,
    projectIdentity: { state: 'ok', data: { canonical: true, degraded: false, confidence: 'high', mismatches: [] } },
    projectStatus: { state: 'ok', data: { status: 'ok' } },
    trajectoryView: { authoritative: true, failureClass: null },
    license: { state: 'ok', data: { authority: { state: 'active' } } },
  });
  assert.equal(guard.level, 'ok');
  assert.equal(guard.canDirect, true);
  assert.deepEqual(guard.reasons, []);
  assert.equal(describeScopeGuard(guard), 'scope confirmed by Focusa');
});

test('a degraded identity is surfaced as a warn with the owner reason, not a silent pass', () => {
  const guard = evaluateScopeGuard({
    workstream: WS,
    health: OK_HEALTH,
    projectIdentity: { state: 'degraded', data: { canonical: false, degraded: true, confidence: 'low', mismatch_reason: 'cwd-only identity', mismatches: [] } },
    license: { state: 'ok', data: { authority: { state: 'active' } } },
  });
  assert.equal(guard.level, 'warn');
  assert.equal(guard.canDirect, true);
  const guards = guard.reasons.map((r) => r.guard);
  assert.ok(guards.includes('identity'));
  assert.ok(guards.includes('identity_degraded'));
  assert.match(guard.reasons.find((r) => r.guard === 'identity_degraded').detail, /cwd-only identity/);
});

test('no Workstream or an unreachable owner blocks Direction', () => {
  const noWorkstream = evaluateScopeGuard({ workstream: null, health: OK_HEALTH });
  assert.equal(noWorkstream.level, 'blocked');
  assert.equal(noWorkstream.canDirect, false);

  const offline = evaluateScopeGuard({ workstream: WS, health: { state: 'network', data: null } });
  assert.equal(offline.level, 'blocked');
  assert.equal(offline.canDirect, false);
});

test('owner silence is reported as unconfirmed rather than assumed fine', () => {
  const guard = evaluateScopeGuard({
    workstream: WS,
    health: OK_HEALTH,
    projectIdentity: { state: 'unsupported', data: null },
  });
  assert.equal(guard.level, 'warn');
  assert.ok(guard.reasons.some((r) => r.guard === 'identity_unavailable'));
});

test('entitlement and selection-required are surfaced from the owner', () => {
  const guard = evaluateScopeGuard({
    workstream: WS,
    health: OK_HEALTH,
    projectIdentity: { state: 'ok', data: { confidence: 'high', mismatches: [] } },
    projectStatus: { state: 'ok', data: { failure_class: 'project_root_selection_required' } },
    license: { state: 'entitlement_blocked', data: { error: { code: 'ENTITLEMENT_BASE_REQUIRED' } } },
  });
  const guards = guard.reasons.map((r) => r.guard);
  assert.ok(guards.includes('selection_required'));
  assert.ok(guards.includes('entitlement'));
  assert.match(describeScopeGuard(guard), /^scope warn:/);
});
