import assert from 'node:assert/strict';
import { test } from 'node:test';
import { promptWorkLoop, WorkLoopPromptError } from '../src/lib/work-loop-prompt.mjs';

function store(initial = {}) {
  const records = { ...initial };
  return {
    async load(key) { return records[key] ?? null; },
    async persist(record) { records[record.idempotency_key] = record; },
  };
}

function okFetch() {
  return async (url, init) => new Response(JSON.stringify({ schema: 'focusa.agent_execution_adapter_result.v1', status: 'accepted', adapter: 'pi-rpc', session_id: 's1', resumable: true, authority: 'work_loop', tool_result: {} }), { status: 200, headers: { 'content-type': 'application/json' } });
}

let base = {
  message: 'Inspect the current state only.',
  projectRoot: '/p',
  continuityId: 'cont-1',
  idempotency_key: 'page-work:ev-1',
  idempotencyStore: store(),
  requestOptions: { baseUrl: 'http://127.0.0.1:8787' },
};
// Fresh idempotency store + key per test: the durable intent must never
// collide between separate probe scenarios.
const baseFor = () => ({ ...base, idempotency_key: `page-work:${crypto.randomUUID()}`, idempotencyStore: store() });

test('promptWorkLoop rejects missing/invalid inputs before any request', async () => {
  const inputs = [
    { ...baseFor(), message: '' },
    { ...baseFor(), idempotency_key: '' },
    { ...baseFor(), projectRoot: '' },
    { ...baseFor(), continuityId: ' ' },
    { ...baseFor(), requestOptions: null },
  ];
  for (const input of inputs) await assert.rejects(() => promptWorkLoop(input), TypeError);
  await assert.rejects(() => promptWorkLoop({ ...baseFor(), message: 'x'.repeat(5000) }), /4000/);
});

test('promptWorkLoop reports daemon_unroutable on 404 with the raw body', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ code: 'not_found', failure_class: 'not_found' }), { status: 404 });
  await assert.rejects(
    () => promptWorkLoop({ ...baseFor(), fetchImpl }),
    (error) => error instanceof WorkLoopPromptError && error.kind === 'daemon_unroutable' && error.status === 404,
  );
});

test('promptWorkLoop maps scope rejections and validation errors honestly', async () => {
  await assert.rejects(
    () => promptWorkLoop({ ...baseFor(), fetchImpl: async () => new Response(JSON.stringify({ error: 'x-scope-project-root required', failure_class: 'scope_mismatch', schema: 'focusa.work_loop_scope_rejection.v1' }), { status: 400 }) }),
    (error) => error instanceof WorkLoopPromptError && error.kind === 'scope_mismatch',
  );
  await assert.rejects(
    () => promptWorkLoop({ ...baseFor(), fetchImpl: async () => new Response(JSON.stringify({ code: 'validation_error' }), { status: 422 }) }),
    (error) => error instanceof WorkLoopPromptError && error.kind === 'validation_rejected',
  );
});

test('promptWorkLoop returns a frozen accepted envelope and sends scoped headers', async () => {
  let seenHeaders = null;
  const fetchImpl = async (url, init) => {
    seenHeaders = init.headers;
    return new Response(JSON.stringify({ schema: 'focusa.agent_execution_adapter_result.v1', status: 'accepted', adapter: 'pi-rpc', session_id: 's1', resumable: true, authority: 'work_loop', tool_result: {}, idempotent_replay: false }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const result = await promptWorkLoop({ ...baseFor(), fetchImpl });
  assert.equal(result.status, 'accepted');
  assert.ok(Object.isFrozen(result));
  assert.equal(seenHeaders['x-scope-project-root'], '/p');
  assert.equal(seenHeaders['x-scope-continuity-id'], 'cont-1');
  assert.equal(seenHeaders['x-focusa-writer-id'], 'focusa-workforce-extension');
  assert.equal(seenHeaders['x-focusa-permissions'], 'work-loop:write');
  assert.ok(!('x-focusa-fencing-token' in seenHeaders)); // never fabricated
});

test('promptWorkLoop never sends a fencing token unless provided', async () => {
  let seenHeaders = null;
  const fetchImpl = async (url, init) => { seenHeaders = init.headers; return okFetch()(url, init); };
  await promptWorkLoop({ ...baseFor(), fetchImpl, writerId: 'writer-2' });
  assert.ok(!('x-focusa-fencing-token' in seenHeaders));
});

test('promptWorkLoop replays durably-committed idempotency intents without a second request', async () => {
  const idempotencyStore = store();
  let calls = 0;
  const fetchImpl = async (url, init) => { calls += 1; return okFetch()(url, init); };
  const shared = { ...baseFor(), idempotency_key: 'page-work:same-key', idempotencyStore };
  const first = await promptWorkLoop({ ...shared, fetchImpl });
  assert.equal(first.replayed, false);
  const replay = await promptWorkLoop({ ...shared, fetchImpl });
  assert.equal(replay.replayed, true);
  assert.equal(calls, 1);
});