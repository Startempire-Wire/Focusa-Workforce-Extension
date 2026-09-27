import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evidenceBuckets, evidenceSources } from '../src/workforce/lib/evidence-buckets.js';

test('buckets by owner-reported kind', () => {
  const entries = [
    { kind: 'evidence', ref: 'r1', source: 'workpoint' },
    { kind: 'receipt', ref: 'r2', source: 'workLoop' },
    { kind: 'projection', ref: 'r3', source: 'trajectory' },
    { kind: 'corrected', ref: 'r4', source: 'events' },
  ];
  const b = evidenceBuckets(entries);
  assert.equal(b.needs.length, 1);
  assert.equal(b.needs[0].ref, 'r1');
  assert.equal(b.settled.length, 2);
  assert.equal(b.stale.length, 1);
});

test('unknown/empty kinds default to needs verification, never dropped', () => {
  const b = evidenceBuckets([{ kind: 'wat', ref: 'x' }, { ref: 'y' }]);
  assert.equal(b.needs.length, 2);
  assert.equal(b.settled.length, 0);
});

test('empty/null safe', () => {
  assert.deepEqual(evidenceBuckets([]), { needs: [], settled: [], stale: [] });
  assert.deepEqual(evidenceBuckets(null), { needs: [], settled: [], stale: [] });
});

test('sources are unique owner-reported values', () => {
  const entries = [
    { kind: 'evidence', ref: 'a', source: 'workpoint' },
    { kind: 'evidence', ref: 'b', source: 'events' },
    { kind: 'evidence', ref: 'c', source: 'workpoint' },
  ];
  assert.deepEqual(evidenceSources(entries), ['workpoint', 'events']);
  assert.deepEqual(evidenceSources([]), []);
});