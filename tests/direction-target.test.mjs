import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  describeTarget, firstTargetFromRoster, isValidExactTarget,
  parseExactTarget, resolveDirectionTarget, targetFromRosterEntry,
} from '../src/lib/direction-target.mjs';

const EXACT = { session_id: 's-1', run_id: 'r-7', generation: 3 };

test('only a complete owner target is accepted', () => {
  assert.equal(isValidExactTarget(EXACT), true);
  assert.equal(isValidExactTarget({ ...EXACT, generation: 0 }), false);
  assert.equal(isValidExactTarget({ ...EXACT, generation: -1 }), false);
  assert.equal(isValidExactTarget({ ...EXACT, generation: 1.5 }), false);
  assert.equal(isValidExactTarget({ ...EXACT, generation: '3' }), false);
  assert.equal(isValidExactTarget({ ...EXACT, run_id: '' }), false);
  assert.equal(isValidExactTarget({ session_id: 's-1' }), false);
  assert.equal(isValidExactTarget(null), false);
});

test('roster entries yield a target only when the owner reported run and generation', () => {
  assert.deepEqual(targetFromRosterEntry({ id: 's-1', runId: 'r-7', generation: 3 }), EXACT);
  assert.equal(targetFromRosterEntry({ id: 's-1', state: 'running' }), null);
  assert.equal(targetFromRosterEntry({ id: 's-1', runId: 'r-7' }), null);
  assert.deepEqual(firstTargetFromRoster([{ id: 'a' }, { id: 's-2', runId: 'r-9', generation: 2 }]),
    { session_id: 's-2', run_id: 'r-9', generation: 2 });
  assert.equal(firstTargetFromRoster([]), null);
});

test('operator paste accepts JSON and the compact form, and rejects anything else', () => {
  assert.deepEqual(parseExactTarget(JSON.stringify(EXACT)), { ok: true, target: EXACT });
  assert.deepEqual(parseExactTarget('{"sessionId":"s-1","runId":"r-7","generation":"3"}'), { ok: true, target: EXACT });
  assert.deepEqual(parseExactTarget('s-1:r-7:3'), { ok: true, target: EXACT });
  assert.match(parseExactTarget('s-1:r-7').error, /expected session_id:run_id:generation/);
  assert.match(parseExactTarget('s-1:r-7:0').error, /generation of 1 or more/);
  assert.match(parseExactTarget('{"session_id":"s-1"}').error, /needs session_id, run_id/);
  assert.match(parseExactTarget('{oops').error, /malformed/);
  assert.match(parseExactTarget('').error, /paste an exact target/);
});

test('the owner roster is preferred; the operator binding is only a stopgap', () => {
  const owner = resolveDirectionTarget({ roster: [{ id: 's-2', runId: 'r-9', generation: 2 }], bound: EXACT });
  assert.equal(owner.origin, 'owner_roster');
  assert.deepEqual(owner.target, { session_id: 's-2', run_id: 'r-9', generation: 2 });

  const bound = resolveDirectionTarget({ roster: [{ id: 's-1', state: 'running' }], bound: EXACT });
  assert.equal(bound.origin, 'operator_binding');
  assert.deepEqual(bound.target, EXACT);

  const none = resolveDirectionTarget({ roster: [], bound: null });
  assert.equal(none.target, null);
  assert.equal(none.origin, null);
});

test('targets are described, not dumped', () => {
  assert.equal(describeTarget(EXACT), 's-1 · run r-7 · gen 3');
  assert.equal(describeTarget(null), 'no exact target');
});
