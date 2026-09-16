import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildEvidenceTrail, detectEvidenceProjection } from '../src/lib/evidence-trail.mjs';

test('the trail only contains references the owner actually reported, tagged by source', () => {
  const trail = buildEvidenceTrail({
    workpoint: { state: 'ok', data: { status: 'accepted', evidence_refs: ['ev-1'], receipt_refs: ['rc-1'] } },
    sessions: { state: 'ok', data: { data: [], evidence_refs: ['ev-2'] } },
    trajectory: { state: 'degraded', data: { evidence_refs: ['ev-should-be-ignored'] } },
    health: { state: 'ok', data: { evidence_refs: [] } },
  });
  assert.equal(trail.authoritative, false);
  assert.deepEqual(trail.entries, [
    { kind: 'evidence', ref: 'ev-1', source: 'workpoint' },
    { kind: 'receipt', ref: 'rc-1', source: 'workpoint' },
    { kind: 'evidence', ref: 'ev-2', source: 'sessions' },
  ]);
  assert.match(trail.disclosure, /stopgap/);
});

test('duplicate references collapse across operations', () => {
  const trail = buildEvidenceTrail({
    workpoint: { state: 'ok', data: { evidence_refs: ['ev-1'] } },
    trajectory: { state: 'ok', data: { evidence_refs: ['ev-1'] } },
  });
  assert.equal(trail.entries.length, 1);
});

test('no reported reference is an empty trail, never invented proof', () => {
  const trail = buildEvidenceTrail({ workpoint: { state: 'ok', data: {} } });
  assert.deepEqual(trail.entries, []);
  assert.match(trail.disclosure, /no evidence reference reported/);
});

test('a structured owner evidence projection wins automatically', () => {
  const reads = {
    workpoint: { state: 'ok', data: { evidence_refs: ['ev-1'] } },
    evidence: { state: 'ok', data: { evidence: [{ id: 'EV-9', state: 'verified' }] } },
  };
  const detection = detectEvidenceProjection(reads);
  assert.equal(detection.authoritative, true);
  const trail = buildEvidenceTrail(reads);
  assert.equal(trail.authoritative, true);
  assert.match(trail.disclosure, /authoritative/);
  assert.deepEqual(trail.entries, [{ kind: 'projection', ref: 'EV-9', source: 'evidence' }]);
});
