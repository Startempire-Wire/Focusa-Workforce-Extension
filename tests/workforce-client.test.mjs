import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createWorkforceClient, ResultState, rosterFromOwner, trajectoryFromOwner } from '../src/lib/workforce-client.mjs';
import { workstreamRef } from '../src/lib/owner-contracts.mjs';

/** Real owner response shapes captured from a live Focusa daemon (2026-09-16). */
const SHAPES = {
  entitlementBlocked: {
    status: 403,
    body: {
      error: {
        code: 'ENTITLEMENT_BASE_REQUIRED',
        limit_bucket: 'missions',
        message: 'The operation is denied by the entitlement policy before side effects.',
        recovery: { action: 'reactivate_or_repair_lease', allowed: ['health', 'version', 'license_status'], status_path: '/v1/license/status' },
        required_feature: null,
        state: 'unactivated',
      },
      status: 'blocked',
    },
  },
  sessions: {
    status: 200,
    body: {
      ok: true, status: 'listed', canonical: true, advisory: false, degraded: false, stale: false, failure_class: null,
      retry: { retryable: false, after_ms: null, idempotency_key_required: false },
      side_effects: [{ effect: 'authorization_principal_upsert', status: 'completed', target_ref: 'principal:local-loopback' }],
      evidence_refs: [], receipt_refs: [], next_tools: [], recovery_hint: null, misuse_hint: null,
      data: [
        { session_id: '019fef1d-fda2-7e62-b6a5-1bd1fe21245c', title: 'Focusa build worker', state: 'running', role: 'worker', active_run_id: 'run-7', generation: 3, updated_at: '2026-09-16T06:00:00Z' },
        { session_id: '019fef1d-aaaa-7e62-b6a5-1bd1fe21245d', state: 'paused' },
      ],
    },
  },
  degradedTrajectory: {
    status: 200,
    body: {
      action_authority_from_trajectory: false, canonical: false, degraded: true,
      details: { tool_result_v1: { canonical: false, degraded: true, failure_class: 'scope_mismatch', ok: false } },
      failure_class: 'scope_mismatch',
    },
  },
  noWorkpoint: {
    status: 200,
    body: {
      canonical: false, detected_project_root: '/home/wirebot/focusa',
      next_step_hint: 'POST /v1/workpoint/checkpoint ...', recovery_hint: 'pass --project-root explicitly',
      status: 'not_found', warnings: ['no active workpoint'],
    },
  },
  license: {
    status: 200,
    body: {
      authority: { schema: 'focusa.entitlement_projection.v1', state: 'active', lease_id: 'fpdev-stable-7dd229b7', limits: { operator_seats: 1, node_limit: 1 } },
    },
  },
};

/** @param {Record<string, {status: number, body: any}>} routes */
function fakeFetch(seen, routes) {
  return async (url, init) => {
    seen.push({ url: String(url), init });
    const key = String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    const match = routes[key];
    if (!match) throw Object.assign(new Error('fetch failed'), { name: 'TypeError' });
    return {
      ok: match.status >= 200 && match.status < 300,
      status: match.status,
      text: async () => JSON.stringify(match.body),
    };
  };
}

test('owner entitlement denial is classified as entitlement_blocked with owner recovery', async () => {
  const seen = [];
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787',
    token: 'device-token',
    fetchImpl: fakeFetch(seen, { '/v1/license/status': SHAPES.entitlementBlocked }),
  });
  const result = await client.licenseStatus();
  assert.equal(result.state, ResultState.ENTITLEMENT_BLOCKED);
  assert.equal(result.status, 403);
  assert.equal(result.code, 'ENTITLEMENT_BASE_REQUIRED');
  assert.equal(result.recovery, 'reactivate_or_repair_lease');
  assert.ok(result.note.includes('entitlement policy'));
});

test('reads send only owner-declared scope keys and the paired bearer token', async () => {
  const seen = [];
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787/',
    token: 'device-token',
    fetchImpl: fakeFetch(seen, { '/v1/trajectory/view': SHAPES.degradedTrajectory }),
  });
  await client.trajectory(workstreamRef({ projectRoot: '/home/wirebot/focusa', continuityId: 'main' }));
  const url = new URL(seen[0].url);
  assert.equal(url.pathname, '/v1/trajectory/view');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['continuity_id', 'project_root']);
  assert.equal(url.searchParams.get('continuity_id'), 'main');
  assert.equal(seen[0].init.headers.authorization, 'Bearer device-token');
  assert.equal(seen[0].init.method, 'GET');
});

test('an unpaired environment sends no authorization header', async () => {
  const seen = [];
  const client = createWorkforceClient({ baseUrl: 'http://127.0.0.1:8787', fetchImpl: fakeFetch(seen, { '/v1/health': { status: 200, body: { ok: true } } }) });
  const result = await client.health();
  assert.equal(result.state, ResultState.OK);
  assert.equal(seen[0].init.headers.authorization, undefined);
});

test('owner degraded projections stay degraded (never silently ok)', async () => {
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787',
    fetchImpl: fakeFetch([], { '/v1/trajectory/view': SHAPES.degradedTrajectory }),
  });
  const result = await client.trajectory({ projectRoot: '/p', continuityId: 'main' });
  assert.equal(result.state, ResultState.DEGRADED);
  assert.equal(result.failureClass, 'scope_mismatch');
});

test('owner "no record yet" is an ok read with the owner’s not_found signal preserved', async () => {
  const client = createWorkforceClient({ baseUrl: 'http://127.0.0.1:8787', fetchImpl: fakeFetch([], { '/v1/workpoint/current': SHAPES.noWorkpoint }) });
  const result = await client.workpointCurrent('/home/wirebot/focusa');
  assert.equal(result.state, ResultState.OK);
  assert.equal(result.failureClass, 'not_found');
});

test('missing owner route is unsupported, not a generic failure', async () => {
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787',
    fetchImpl: async () => ({ ok: false, status: 404, text: async () => JSON.stringify({ code: 'not_found' }) }),
  });
  const result = await client.roleProfiles({ projectRoot: '/p', continuityId: 'main' });
  assert.equal(result.state, ResultState.UNSUPPORTED);
});

test('unreachable owner is a network state, never a fabricated snapshot', async () => {
  const client = createWorkforceClient({ baseUrl: 'http://127.0.0.1:8787', fetchImpl: async () => { throw Object.assign(new Error('boom'), { name: 'TypeError' }); } });
  const result = await client.health();
  assert.equal(result.state, ResultState.NETWORK);
  assert.equal(result.data, null);
});

test('mutation path templates are encoded and never carry a legacy permissions header on reads', async () => {
  const seen = [];
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787',
    token: 't',
    fetchImpl: fakeFetch(seen, { '/v1/silent-sessions/a b/status': { status: 200, body: { ok: true } } }),
  });
  await client.sessionStatus('a b', { projectRoot: '/p' });
  assert.match(seen[0].url, /a%20b/);
  assert.equal(seen[0].init.headers['x-focusa-permissions'], 'read:*');
});

test('roster normalisation reads only owner-projected fields and tolerates missing ones', () => {
  const roster = rosterFromOwner(SHAPES.sessions.body);
  assert.equal(roster.length, 2);
  assert.deepEqual(
    { id: roster[0].id, label: roster[0].label, state: roster[0].state, role: roster[0].role, runId: roster[0].runId, generation: roster[0].generation },
    { id: '019fef1d-fda2-7e62-b6a5-1bd1fe21245c', label: 'Focusa build worker', state: 'running', role: 'worker', runId: 'run-7', generation: 3 },
  );
  assert.equal(roster[1].label, '019fef1d-aaaa-7e62-b6a5-1bd1fe21245d');
  assert.equal(roster[1].role, null);
  assert.deepEqual(rosterFromOwner({ data: null }), []);
  assert.deepEqual(rosterFromOwner(null), []);
});

test('trajectory normalisation keeps degraded truth and unknown fields null', () => {
  const view = trajectoryFromOwner(SHAPES.degradedTrajectory.body);
  assert.equal(view.degraded, true);
  assert.equal(view.hltRef, null);
  assert.equal(view.current, null);
});
