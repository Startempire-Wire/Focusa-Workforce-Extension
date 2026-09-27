import { test } from 'node:test';
import assert from 'node:assert/strict';
import { needsBuckets } from '../src/workforce/lib/needs-buckets.js';

test('items without owner-reported dates/status are NOW', () => {
  const items = [
    { kind: 'session', label: 'Alice', detail: 'state paused', source: 'roster' },
    { kind: 'clarity', label: 'Define next slice', source: 'trajectory' },
  ];
  const b = needsBuckets(items);
  assert.equal(b.now.length, 2);
  assert.equal(b.soon.length, 0);
  assert.equal(b.snoozed.length, 0);
  assert.equal(b.resolved.length, 0);
});

test('future owner deadline buckets SOON, past deadline stays NOW', () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 3600_000).toISOString();
  const b = needsBuckets([
    { label: 'expired', expiresAt: past },
    { label: 'due soon', dueAt: future },
  ]);
  assert.equal(b.now.length, 1);
  assert.equal(b.now[0].label, 'expired');
  assert.equal(b.soon.length, 1);
  assert.equal(b.soon[0].label, 'due soon');
});

test('owner-reported status buckets SNOOZED and RESOLVED', () => {
  const b = needsBuckets([
    { label: 's', status: 'snoozed' },
    { label: 'r', status: 'done' },
  ]);
  assert.equal(b.snoozed.length, 1);
  assert.equal(b.resolved.length, 1);
  assert.equal(b.now.length, 0);
});

test('nulls and empties are safe', () => {
  const b = needsBuckets(null);
  assert.equal(b.now.length, 0);
  assert.equal(b.soon.length, 0);
  const b2 = needsBuckets(undefined);
  assert.equal(b2.now.length, 0);
});