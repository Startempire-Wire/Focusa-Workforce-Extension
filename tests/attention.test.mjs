import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildNeedsYou, detectAttentionProjection } from '../src/lib/attention.mjs';

test('attention is derived only from owner-reported signals', () => {
  const view = {
    authoritative: false,
    ladder: { clarityBlocking: ['long_term_goal'], blockers: ['HLT_IMPASSE: explicit operator HLT commitment required'] },
  };
  const result = buildNeedsYou({
    roster: [
      { id: 's-1', label: 'Build worker', state: 'waiting_input' },
      { id: 's-2', label: 'Idle worker', state: 'running' },
    ],
    trajectoryView: view,
    activity: [
      { id: 'e1', type: 'SessionApprovalRequired', timestamp: '2026-09-16T00:00:00Z', sessionId: 'abcdef1234' },
      { id: 'e2', type: 'MemoryDecayTick', timestamp: '2026-09-16T00:00:01Z' },
    ],
  });
  assert.equal(result.authoritative, false);
  const labels = result.items.map((item) => item.label);
  assert.deepEqual(labels, [
    'Build worker',
    'Focusa clarity gate: long_term_goal',
    'HLT_IMPASSE: explicit operator HLT commitment required',
    'SessionApprovalRequired',
  ]);
  assert.ok(!labels.includes('Idle worker'), 'a running session is not attention');
  assert.ok(!labels.includes('MemoryDecayTick'), 'ordinary activity is not attention');
  assert.match(result.disclosure, /stopgap/);
});

test('nothing reported means nothing claimed', () => {
  const result = buildNeedsYou({ roster: [{ id: 's', state: 'running' }], trajectoryView: null, activity: [] });
  assert.deepEqual(result.items, []);
  assert.match(result.disclosure, /no attention signal/);
});

test('an owner attention projection wins automatically and dedupes derived noise', () => {
  const reads = { attention: { state: 'ok', data: { attention: [{ id: 'A1', title: 'Approve budget change', reason: 'owner decision' }] } } };
  assert.equal(detectAttentionProjection(reads).authoritative, true);
  const result = buildNeedsYou({ roster: [{ id: 's', state: 'blocked' }], reads });
  assert.equal(result.authoritative, true);
  assert.deepEqual(result.items, [{ kind: 'owner_attention', label: 'Approve budget change', detail: 'owner decision', source: 'attention' }]);
  assert.match(result.disclosure, /authoritative/);
});
