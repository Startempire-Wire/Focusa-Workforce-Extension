import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupRoster, personFacts, distinctStates, matchingMembers } from '../src/workforce/lib/roster-groups.js';

test('groupRoster groups by owner-reported role, first-seen order', () => {
  const rows = [
    { id: 'a', label: 'Alice', role: 'Foreman' },
    { id: 'b', label: 'Bob', role: 'Manager' },
    { id: 'c', label: 'Carol', role: 'Foreman' },
  ];
  const groups = groupRoster(rows);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].role, 'Foreman');
  assert.equal(groups[0].entries.map((e) => e.id).join(','), 'a,c');
  assert.equal(groups[1].role, 'Manager');
});

test('groupRoster never invents a tier: unlabelled rows go to Unassigned, last', () => {
  const rows = [
    { id: 'a', label: 'Alice' },
    { id: 'b', label: 'Bob', role: 'Verifier' },
    { id: 'c', label: 'Carol', role: '  ' },
  ];
  const groups = groupRoster(rows);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].role, 'Verifier');
  assert.equal(groups[1].role, 'Unassigned');
  assert.deepEqual(groups[1].entries.map((e) => e.id).sort(), ['a', 'c']);
});

test('groupRoster handles empty and null rows', () => {
  assert.deepEqual(groupRoster([]), []);
  assert.deepEqual(groupRoster(null), []);
});

test('personFacts emits only owner-reported fields, priority order', () => {
  const p = {
    id: 's1',
    label: 'Session One',
    role: 'Foreman',
    state: 'active',
    runId: 'r9',
    generation: 2,
    workspace: 'ops',
    updatedAt: '2026-09-26T00:00:00Z',
  };
  const facts = personFacts(p);
  assert.deepEqual(
    facts.map((f) => f.label),
    ['identity', 'role', 'state', 'current work', 'workstream mode', 'last proof'],
  );
  const run = facts.find((f) => f.label === 'current work');
  assert.equal(run.value, 'run r9 · gen 2');
});

test('personFacts with no owner fields yields only identity (never invents)', () => {
  const facts = personFacts({ id: 's2', label: 'blank-row' });
  assert.deepEqual(facts.map((f) => f.label), ['identity']);
  const empty = personFacts({});
  assert.deepEqual(empty, []);
});

test('distinctStates returns unique owner-reported states', () => {
  const rows = [
    { state: 'active' },
    { state: 'active' },
    { state: 'paused' },
    { id: 'x' },
  ];
  assert.deepEqual(distinctStates(rows), ['active', 'paused']);
  assert.deepEqual(distinctStates([]), []);
});

test('matchingMembers returns ALL exact matches for deep-link disambiguation', () => {
  const roster = [
    { id: 's1', label: 'Builder-1' },
    { id: 's1', session_id: 's1', label: 'Builder-2' },
    { id: 's2', label: 'Verifier-1' },
  ];
  const both = matchingMembers(roster, { kind: 'focusa.workforce.ref.v1', session_id: 's1' });
  assert.equal(both.length, 2);
  const one = matchingMembers(roster, { id: 's2' });
  assert.equal(one.length, 1);
  assert.equal(one[0].label, 'Verifier-1');
});

test('matchingMembers is null/ref-id-less safe and never guesses', () => {
  assert.deepEqual(matchingMembers(null, null), []);
  assert.deepEqual(matchingMembers([{ id: 's1' }], { session_id: 'missing' }), []);
  assert.deepEqual(matchingMembers([{ id: 's1' }], null), []);
});