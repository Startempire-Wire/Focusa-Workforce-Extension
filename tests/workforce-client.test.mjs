import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createWorkforceClient, ResultState, rosterFromOwner, trajectoryFromOwner, projectsFromOwner, discoveredFromOwner, eventsFromOwner } from '../src/lib/workforce-client.mjs';
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

test('project dashboard normalisation reads owner selection and registered projects', () => {
  const view = projectsFromOwner({
    schema: 'focusa.project_dashboard.v1', status: 'degraded', failure_class: 'project_root_selection_required',
    selected: null, effective_project: null,
    projects: [],
  });
  assert.equal(view.degraded, true);
  assert.equal(view.failureClass, 'project_root_selection_required');
  assert.equal(view.selected, null);
  assert.deepEqual(view.projects, []);

  const withProjects = projectsFromOwner({
    status: 'ok',
    selected: { project_root: '/home/verioussmith/src/focusa', project_id: 'focusa' },
    projects: [{ project_id: 'focusa', canonical_name: 'Focusa', project_root: '/home/verioussmith/src/focusa', stack: 'rust-workspace', status: 'project-root-marker' }],
  });
  assert.equal(withProjects.selected.root, '/home/verioussmith/src/focusa');
  assert.deepEqual(withProjects.projects.map((p) => p.name), ['Focusa']);
});

test('project discovery normalisation keeps only owner-reported fields', () => {
  const found = discoveredFromOwner({
    schema: 'focusa.project_discover.v1', count: 1,
    projects: [{ schema: 'focusa.project_summary.v1', canonical_name: 'Focusa', has_git: true, has_marker: true, project_id: 'focusa', project_root: '/home/verioussmith/src/focusa', stack: 'rust-workspace', status: 'project-root-marker' }],
  });
  assert.deepEqual(found, [{ id: 'focusa', name: 'Focusa', root: '/home/verioussmith/src/focusa', stack: 'rust-workspace', hasMarker: true, hasGit: true }]);
});

test('project selection posts the owner project_root body through the owning operation', async () => {
  const seen = [];
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787',
    fetchImpl: fakeFetch(seen, { '/v1/project/use': { status: 200, body: { ok: true } } }),
  });
  const result = await client.projectUse({ projectRoot: '/home/verioussmith/src/focusa' });
  assert.equal(result.state, ResultState.OK);
  assert.equal(seen[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(seen[0].init.body), {
    project_root: '/home/verioussmith/src/focusa',
    selected_by: 'focusa-workforce-chrome',
  });
});

test('project discovery sends bounded owner query parameters', async () => {
  const seen = [];
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787',
    fetchImpl: fakeFetch(seen, { '/v1/project/discover': { status: 200, body: { projects: [] } } }),
  });
  await client.projectDiscover({ from: '/home/verioussmith/src', maxDepth: 4, maxResults: 30, includeGitOnly: true });
  const url = new URL(seen[0].url);
  assert.equal(url.searchParams.get('from'), '/home/verioussmith/src');
  assert.equal(url.searchParams.get('max_depth'), '4');
  assert.equal(url.searchParams.get('max_results'), '30');
  assert.equal(url.searchParams.get('include_git_only'), 'true');
});

test('owner event stream path carries scope and omits auth for a local environment', async () => {
  const seen = [];
  const controller = new AbortController();
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787',
    fetchImpl: async (url, init) => {
      seen.push({ url: String(url), init });
      controller.abort(); // the stream client reconnects forever by design
      return { ok: true, status: 200, body: new ReadableStream({ start(c) { c.close(); } }) };
    },
  });
  await client.openEventStream({ scope: { projectRoot: '/p' }, onEvent: () => {}, signal: controller.signal }).catch(() => {});
  const url = new URL(seen[0].url);
  assert.equal(url.pathname, '/v1/events/stream');
  assert.equal(url.searchParams.get('project_root'), '/p');
  assert.equal(seen[0].init.headers.authorization, undefined);
  assert.equal(seen[0].init.headers.accept, 'text/event-stream');
});

test('owner event stream authorizes with the device token when paired', async () => {
  const seen = [];
  const controller = new AbortController();
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787',
    token: 'device-token',
    fetchImpl: async (url, init) => {
      seen.push({ url: String(url), init });
      controller.abort();
      return { ok: true, status: 200, body: new ReadableStream({ start(c) { c.close(); } }) };
    },
  });
  await client.openEventStream({ onEvent: () => {}, signal: controller.signal }).catch(() => {});
  assert.equal(seen[0].init.headers.authorization, 'Bearer device-token');
});

test('session output requires and sends the exact target plus paging', async () => {
  const seen = [];
  const client = createWorkforceClient({
    baseUrl: 'http://127.0.0.1:8787',
    fetchImpl: fakeFetch(seen, { '/v1/silent-sessions/s-1/output': { status: 200, body: { chunks: [] } } }),
  });
  await client.sessionOutput({ sessionId: 's-1', runId: 'r-7', generation: 3, limit: 50, channel: 'stderr' });
  const url = new URL(seen[0].url);
  assert.equal(url.searchParams.get('run_id'), 'r-7');
  assert.equal(url.searchParams.get('generation'), '3');
  assert.equal(url.searchParams.get('limit'), '50');
  assert.equal(url.searchParams.get('channel'), 'stderr');
  assert.equal(url.searchParams.get('follow'), 'false');
  assert.equal(seen[0].init.headers['x-focusa-permissions'], 'read:*');
});

test('roster keeps optional owner-project fields when reported and stays silent when not', () => {
  const [rich, bare] = rosterFromOwner({
    data: [
      { session_id: 's-1', title: 'Build worker', state: 'running', harness: { kind: 'pi' }, run_id: 'r-1', generation: 2, active_config_revision_id: 'rev-9', authority: { state: 'granted' }, workspace: { mode: 'isolated_worktree' } },
      { session_id: 's-2' },
    ],
  });
  assert.equal(rich.role, 'pi');
  assert.equal(rich.configRevision, 'rev-9');
  assert.equal(rich.authority, 'granted');
  assert.equal(rich.workspace, 'isolated_worktree');
  assert.equal(bare.role, null);
  assert.equal(bare.configRevision, null);
  assert.equal(bare.authority, null);
});

test('activity normalisation keeps owner fields and marks observations', () => {
  const events = eventsFromOwner({
    bounds: { total: 4 },
    events: [
      { id: 'e1', type: 'MemoryDecayTick', timestamp: '2026-09-16T00:00:00Z', origin: 'daemon', session_id: 's-1', is_observation: false },
      { id: 'e2', type: 'ObservationCaptured', is_observation: true },
    ],
  });
  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { id: 'e1', type: 'MemoryDecayTick', timestamp: '2026-09-16T00:00:00Z', origin: 'daemon', sessionId: 's-1', observation: false });
  assert.equal(events[1].observation, true);
  assert.equal(events[1].timestamp, null);
});
