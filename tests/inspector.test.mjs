import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createWorkforceClient, ResultState } from '../src/lib/workforce-client.mjs';
import { resolveScope, continuityFromTrajectory, loadInspector } from '../src/lib/inspector.mjs';
import { classifyError, explainCode, createDiagnostics, RING_CAP } from '../src/lib/diagnostics.mjs';
import { normalizeDaemonOrigin, isLocalDaemonHost, daemonSchemeForHost, originPermission } from '../src/lib/validation.mjs';
import { validateLocalEnvironment } from '../src/lib/contracts.mjs';

function fakeFetch(routes) {
  return async (url) => {
    const key = String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    const match = routes[key];
    if (!match) throw Object.assign(new Error('fetch failed'), { name: 'TypeError' });
    return { ok: match.status >= 200 && match.status < 300, status: match.status, text: async () => JSON.stringify(match.body) };
  };
}

/** Shapes captured from daemon 0.9.192 on 2026-09-28 (truncated, structure kept). */
const PROJECT_LIST = {
  status: 200,
  body: {
    effective_project: { project_root: '/data/flow-mesh', project_id: 'flow-mesh' },
    project_count: 1,
    projects: [{ canonical_name: 'Flow Mesh', project_id: 'flow-mesh', project_root: '/data/flow-mesh' }],
  },
};
const SESSIONS = {
  status: 200,
  body: {
    ok: true, status: 'listed', canonical: true,
    data: [
      { id: '01a08504-8a45-7982-89ce-2877bdd88891', display_name: 'epwa-independent-reviewer-cg02', health: 'unknown', lifecycle: 'draft', mission: 'Independent acceptance review', authority: { project_root: '/home/wpuiai/uiai-engine' } },
    ],
  },
};
const OPERATIONS = {
  status: 200,
  body: {
    generated_at: '2026-09-28T07:20:21Z', operation_count: 2,
    operations: [
      { id: 'focusa.health.check', method: 'GET', path: '/v1/health', description: 'Daemon health' },
      { id: 'focusa.trajectory.view', method: 'GET', path: '/v1/trajectory/view' },
    ],
  },
};
const EMPTY_400 = { status: 400, body: { code: 'bad_request', failure_class: 'scope_mismatch' } };

const ROUTES = {
  '/v1/project/list': PROJECT_LIST,
  '/v1/silent-sessions': SESSIONS,
  '/v1/agent/operations': OPERATIONS,
  '/v1/health': { status: 200, body: { ok: true, version: '0.9.192' } },
};

test('tailnet DNS origins validate, strip ports for permission patterns', () => {
  assert.equal(normalizeDaemonOrigin('http://parent.tail0000.ts.net:8787'), 'http://parent.tail0000.ts.net:8787');
  assert.equal(daemonSchemeForHost('parent.tail0000.ts.net'), 'http:');
  assert.equal(originPermission('http://parent.tail0000.ts.net:8787'), 'http://parent.tail0000.ts.net/*');
  assert.equal(isLocalDaemonHost('parent.tail0000.ts.net'), true);
  assert.throws(() => normalizeDaemonOrigin('http://focusa.example'), /HTTPS/);
  assert.equal(daemonSchemeForHost('focusa.example'), 'https:');
});

test('a tailnet DNS environment saves like a local one', () => {
  const env = validateLocalEnvironment({
    schema: 'focusa.workforce_local_environment.v1',
    environment_id: 'local:http://parent.tail0000.ts.net:8787',
    label: 'Focusa daemon (http://parent.tail0000.ts.net:8787)',
    base_url: 'http://parent.tail0000.ts.net:8787',
    created_at: '2026-09-28T00:00:00.000Z',
  });
  assert.equal(env.base_url, 'http://parent.tail0000.ts.net:8787');
});

test('inspector scope resolves from the owner project list', () => {
  assert.deepEqual(resolveScope(PROJECT_LIST.body), { projectRoot: '/data/flow-mesh', continuityId: null });
  assert.deepEqual(resolveScope(null), { projectRoot: null, continuityId: null });
  assert.equal(continuityFromTrajectory({ workpoint: { continuity_id: 'focusa-cont-x' } }), 'focusa-cont-x');
  assert.equal(continuityFromTrajectory(null), null);
});

test('inspector loads sections concurrently; each stands or falls alone', async () => {
  const client = createWorkforceClient({ baseUrl: 'http://parent.tail0000.ts.net:8787', fetchImpl: fakeFetch(ROUTES) });
  const { scope, sections, operationsTotal } = await loadInspector(client, { projectRoot: '/data/flow-mesh' }, { projectListBody: PROJECT_LIST.body });
  assert.equal(scope.projectRoot, '/data/flow-mesh');
  assert.equal(operationsTotal, 2);
  const byKey = Object.fromEntries(sections.map((s) => [s.key, s]));
  assert.equal(byKey.projects.count, 1);
  assert.equal(byKey.projects.rows[0].primary, 'Flow Mesh');
  assert.equal(byKey.sessions.count, 1);
  assert.equal(byKey.sessions.rows[0].primary, 'epwa-independent-reviewer-cg02');
  assert.equal(byKey.operations.count, 2);
  // Unmatched routes throw at fetch: the section reports the network state
  // honestly instead of throwing.
  assert.equal(byKey['task-plans'].state, 'network');
  assert.ok(byKey['task-plans'].note, 'a failure always carries words');
  for (const section of sections) {
    assert.ok(section.title && section.key, 'every section has identity');
    assert.ok(Array.isArray(section.rows), 'rows is always an array');
  }
});

test('inspector never throws on a dead daemon', async () => {
  const client = createWorkforceClient({
    baseUrl: 'http://parent.tail0000.ts.net:8787',
    fetchImpl: async () => { throw Object.assign(new Error('down'), { name: 'TypeError' }); },
  });
  const { sections } = await loadInspector(client, { projectRoot: '/data/flow-mesh' });
  assert.ok(sections.length > 0);
  assert.ok(sections.every((s) => Array.isArray(s.rows)));
});

test('failures classify into stable codes with plain explanations', () => {
  assert.equal(classifyError(new Error('Access denied')), 'permission-denied');
  assert.equal(classifyError(Object.assign(new Error('x'), { name: 'AbortError' })), 'timeout');
  assert.equal(classifyError(new Error('Failed to fetch')), 'network');
  assert.equal(classifyError(new Error('daemon URL must use HTTPS')), 'validation');
  assert.equal(classifyError(new Error('boom'), { status: 500 }), 'http');
  assert.equal(classifyError(new Error('boom')), 'unknown');
  assert.match(explainCode('permission-denied'), /Allow/);
  assert.match(explainCode('unknown'), /unexpected/);
});

test('diagnostics ring is bounded, secret-free, and exportable', async () => {
  const stored = {};
  const chromeApi = { storage: { local: {
    get: async (k) => ({ [k]: stored[k] ?? null }),
    set: async (patch) => Object.assign(stored, patch),
    remove: async (k) => { delete stored[k]; },
  } } };
  const diag = createDiagnostics({ chromeApi, now: () => '2026-09-28T00:00:00.000Z' });
  for (let i = 0; i < RING_CAP + 20; i++) diag.log('tick', { i });
  assert.equal(diag.recent(500).length, RING_CAP, 'ring is bounded');
  const event = diag.error('connect.fail', new Error('denied'), { token: 'SECRET-must-vanish', origin: 'http://x:8787' });
  assert.equal(event.code, 'permission-denied');
  const exported = JSON.parse(await diag.exportJson());
  assert.ok(!JSON.stringify(exported).includes('SECRET'), 'no secrets in export');
  assert.equal(exported.events.length, RING_CAP);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const persisted = await diag.persisted();
  assert.ok(persisted.length > 0 && persisted.length <= 60, 'persisted slice is capped');
  await diag.clear();
  assert.deepEqual(diag.recent(), []);
});

test('diagnostics never throw without a browser', () => {
  const diag = createDiagnostics({ chromeApi: undefined });
  diag.log('x');
  diag.error('y', new Error('z'));
  assert.equal(diag.recent().length, 2);
});
