import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  OPERATIONS,
  OWNER_GAPS,
  Resolution,
  SEMANTIC_RESOLUTION,
  scopeQuery,
  workstreamRef,
} from '../src/lib/owner-contracts.mjs';

test('every Workforce semantic declares a resolution and only references real operations', () => {
  for (const [semantic, entry] of Object.entries(SEMANTIC_RESOLUTION)) {
    assert.ok(Object.values(Resolution).includes(entry.resolution), `${semantic} has a valid resolution`);
    assert.ok(entry.requirement, `${semantic} states the requirement it satisfies`);
    assert.ok(entry.operations.length > 0, `${semantic} names at least one owner operation`);
    for (const name of entry.operations) {
      assert.ok(OPERATIONS[name], `${semantic} references declared operation ${name}`);
    }
    if (entry.resolution === Resolution.GAP) {
      assert.match(entry.note ?? '', /OWNER GAP/, `${semantic} gap states the owner gap explicitly`);
    }
  }
});

test('owner operations carry owner-declared scope keys and paths', () => {
  for (const [name, operation] of Object.entries(OPERATIONS)) {
    assert.match(operation.path, /^\/v1\//, `${name} uses the owner /v1 surface`);
    assert.ok(['GET', 'POST'].includes(operation.method), `${name} has a real HTTP method`);
    assert.ok(Array.isArray(operation.scopes), `${name} declares scope keys`);
  }
  // The owner's identity axes must not be dropped from the core reads.
  assert.deepEqual(OPERATIONS.trajectoryView.scopes, ['project_root', 'continuity_id']);
  assert.deepEqual(OPERATIONS.silentSessions.scopes, ['project_root']);
});

test('scopeQuery sends only owner identity axes, omitting empty values', () => {
  assert.deepEqual(scopeQuery({}), {});
  assert.deepEqual(
    scopeQuery({ projectRoot: '/p', continuityId: 'main', attachmentId: '', workingSubpathId: undefined }),
    { project_root: '/p', continuity_id: 'main' },
  );
});

test('workstreamRef requires both identity axes and is an immutable presentation reference', () => {
  const ref = workstreamRef({ projectRoot: '/home/wirebot/focusa', continuityId: 'main' });
  assert.equal(ref.schema, 'focusa.workforce.workstream_ref.v1');
  assert.equal(ref.projectRoot, '/home/wirebot/focusa');
  assert.equal(ref.continuityId, 'main');
  assert.match(ref.label, /focusa · main/);
  assert.throws(() => workstreamRef({ projectRoot: '/p' }), /continuityId is required/);
  assert.throws(() => workstreamRef({ continuityId: 'main' }), /projectRoot is required/);
});

test('declared owner gaps match today’s unbound semantics', () => {
  assert.deepEqual([...OWNER_GAPS].sort(), ['attention', 'fleet', 'foreman']);
  assert.equal(SEMANTIC_RESOLUTION.workstream.resolution, Resolution.EQUIVALENT);
  assert.match(SEMANTIC_RESOLUTION.workstream.note, /logical_workstream = continuity_id/);
});
