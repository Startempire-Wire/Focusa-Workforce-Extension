import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TrajectorySource, detectAuthoritativeLadder, resolveTrajectorySource } from '../src/lib/trajectory-source.mjs';

/** The exact shape returning from the live daemon 0.9.194-dev while focusa#621 is open. */
const OBSERVED_STOPGAP_VIEW = {
  state: 'degraded', status: 200, note: null, failureClass: 'scope_mismatch',
  data: {
    action_authority_from_trajectory: false, canonical: false, degraded: true,
    hlt_required: true, hlt_status: 'missing_required', status: 'not_found',
    warnings: ['HLT_IMPASSE: no committed project HLT exists; no Ladder values were synthesized',
      'HLT_REQUIRED: no valid High-Level Trajectory is set for this verified scope.'],
    next_step_hint: 'Trajectory is in bootstrap default state.',
    intelligence_view: { clarity_gate: { blocking_reasons: ['long_term_goal', 'desired_end_state', 'current_verified_state'] } },
    trajectory: { active_gap: 'HLT_IMPASSE: explicit operator HLT commitment required', blockers: [], definition_status: 'unclear' },
    trajectory_workpoint_reconciliation: {
      authority_for_next_action: 'workpoint', resolution: 'use_workpoint_for_immediate_next_action',
      surface_states: { trajectory: 'bootstrap_default', workpoint: 'canonical' },
      active_workpoint_id: '01a0ab5a-cf1c-7123-aa5e-3bd790b2bec8',
    },
  },
};

/** The shape the same read must have once the owner projection is fixed. */
const AUTHORITATIVE_VIEW = {
  state: 'ok', status: 200, failureClass: null,
  data: {
    canonical: true, degraded: false, hlt_status: 'committed', status: 'completed',
    trajectory: {
      schema: 'focusa.trajectory_view.v1', definition_status: 'committed',
      hlt_ref: 'HLT-WF-001', current: { id: 'WP-1.3.3' }, next: { id: 'WP-6.1' }, revision: 5,
      durable_lifecycle: { canonical: true, checkpoints: [{ id: 'cp1' }] },
    },
  },
};

test('the stopgap is taken while the owner projection reports no committed ladder', () => {
  const detection = detectAuthoritativeLadder(OBSERVED_STOPGAP_VIEW);
  assert.equal(detection.authoritative, false);
  assert.match(detection.reason, /HLT_IMPASSE/);

  const resolved = resolveTrajectorySource({
    view: OBSERVED_STOPGAP_VIEW,
    workpoint: { state: 'ok', data: { status: 'accepted', canonical: true } },
    workLoop: { state: 'ok', data: { status: 'completed' } },
  });
  assert.equal(resolved.source, TrajectorySource.STOPGAP);
  assert.equal(resolved.authoritative, false);
  assert.match(resolved.disclosure, /^source: derived \(stopgap\)/);
  // derived only from owner-answered fields; nothing invented
  assert.equal(resolved.ladder.currentWorkpoint, '01a0ab5a-cf1c-7123-aa5e-3bd790b2bec8');
  assert.equal(resolved.ladder.gap, 'HLT_IMPASSE: explicit operator HLT commitment required');
  assert.deepEqual(resolved.ladder.clarityBlocking, ['long_term_goal', 'desired_end_state', 'current_verified_state']);
  assert.equal(resolved.ladder.reconciliation.authorityForNextAction, 'workpoint');
  assert.equal(resolved.ladder.authoritative, false);
});

test('the ladder switches to the authoritative projection automatically, with no flag or config', () => {
  const resolved = resolveTrajectorySource({ view: AUTHORITATIVE_VIEW });
  assert.equal(resolved.source, TrajectorySource.OWNER);
  assert.equal(resolved.authoritative, true);
  assert.match(resolved.disclosure, /authoritative/);
  assert.equal(resolved.ladder.hltRef, 'HLT-WF-001');
  assert.equal(resolved.ladder.revision, 5);
  // the stopgap branch is simply not taken; nothing else changes
  assert.equal(resolved.reason, null);
});

test('a committed lifecycle without a summarized status still counts as authoritative', () => {
  const partial = {
    state: 'ok', status: 200,
    data: { canonical: false, degraded: true, hlt_status: null, trajectory: { definition_status: 'unclear', durable_lifecycle: { canonical: true, checkpoints: [{ id: 'cp1' }] } } },
  };
  assert.equal(detectAuthoritativeLadder(partial).authoritative, true);
});

test('an unreachable owner never yields a fabricated ladder', () => {
  const resolved = resolveTrajectorySource({ view: { state: 'network', data: null } });
  assert.equal(resolved.authoritative, false);
  assert.equal(resolved.failureClass, 'network');
  assert.equal(resolved.ladder.currentWorkpoint, null);
  assert.equal(resolved.ladder.current?.id, undefined);
});
