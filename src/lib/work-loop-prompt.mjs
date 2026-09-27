/**
 * Governed work-loop driver prompt client (focusa.agent_execution.prompt).
 *
 * Contract verified live 2026-09-27 against the estate daemon (0.9.194-dev):
 *   POST /v1/work-loop/driver/prompt
 *   scope headers:  x-scope-project-root, x-scope-continuity-id (required)
 *   writer header:  x-focusa-writer-id (required)
 *   fencing header: x-focusa-fencing-token (required by guard; the acquire
 *                   route /v1/work-loop/control is CATALOGUED BUT 404 ON THE
 *                   CURRENT DAEMON BUILD => kind 'daemon_unroutable'). The
 *                   client carries the token when a future daemon provides it;
 *                   it never fabricates one.
 *   body: { "message": string(min 1), "streaming_behavior": "steer"|"followUp" }
 *   response: focusa.agent_execution_adapter_result.v1
 *
 * Failure classes are surfaced honestly: daemon_unroutable, scope_mismatch,
 * validation_rejected, rejected, invalid_envelope.
 */
import { normalizeDaemonOrigin } from './validation.mjs';

const PROMPT_PATH = '/v1/work-loop/driver/prompt';

export class WorkLoopPromptError extends Error {
  constructor(kind, message, status = null, details = null) {
    super(message);
    this.name = 'WorkLoopPromptError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

async function ensureIntent(store, record) {
  if (!store?.load || !store?.persist) throw new TypeError('durable idempotency store is required');
  const existing = await store.load(record.idempotency_key);
  if (existing) {
    if (stable(existing) !== stable(record)) throw new WorkLoopPromptError('idempotency_conflict', 'idempotency key conflicts with a changed prompt', 409);
    return true; // already submitted with this exact intent
  }
  await store.persist(Object.freeze(record));
  const committed = await store.load(record.idempotency_key);
  if (!committed || stable(committed) !== stable(record)) throw new WorkLoopPromptError('storage_failure', 'work-loop prompt intent was not durably committed');
  return false;
}

/**
 * Submit a bounded prompt message to the work-loop driver.
 * Never fabricates the fencing token; the honest daemon failure (404 on the
 * acquire route) is reported as `daemon_unroutable` with the raw body.
 *
 * @param {{message: string, projectRoot: string, continuityId: string,
 *   idempotency_key: string, idempotencyStore: object, requestOptions: object,
 *   fetchImpl?: function, writerId?: string, fencingToken?: string|null}} input
 */
export async function promptWorkLoop({
  message,
  projectRoot,
  continuityId,
  idempotency_key,
  idempotencyStore,
  requestOptions,
  fetchImpl = globalThis.fetch,
  writerId = 'focusa-workforce-extension',
  fencingToken = null,
}) {
  if (typeof message !== 'string' || !message.trim()) throw new TypeError('work-loop prompt message is required');
  if (message.trim().length > 4000) throw new TypeError('work-loop prompt message exceeds the 4000 char bound');
  if (typeof idempotency_key !== 'string' || !idempotency_key || idempotency_key.length > 200) throw new TypeError('bounded idempotency_key is required');
  if (typeof projectRoot !== 'string' || !projectRoot.trim()) throw new TypeError('project_root scope is required');
  if (typeof continuityId !== 'string' || !continuityId.trim()) throw new TypeError('continuity_id scope is required');
  if (!requestOptions?.baseUrl) throw new TypeError('requestOptions.baseUrl is required');

  const intent = { idempotency_key, action: 'prompt_work_loop', payload: { message: message.trim(), project_root: projectRoot, continuity_id: continuityId } };
  const replayed = await ensureIntent(idempotencyStore, intent);
  if (replayed) return Object.freeze({ replayed: true, intent });

  const baseUrl = normalizeDaemonOrigin(requestOptions.baseUrl);
  const response = await fetchImpl(new URL(PROMPT_PATH, baseUrl), {
    method: 'POST',
    signal: requestOptions.signal,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(requestOptions.token ? { authorization: `Bearer ${requestOptions.token}` } : {}),
      'x-focusa-permissions': 'work-loop:write',
      'x-scope-project-root': projectRoot,
      'x-scope-continuity-id': continuityId,
      'x-focusa-writer-id': writerId,
      ...(fencingToken ? { 'x-focusa-fencing-token': fencingToken } : {}),
    },
    body: JSON.stringify({ message: message.trim() }),
  });

  let body;
  try { body = await response.json(); } catch { throw new WorkLoopPromptError('invalid_envelope', 'work-loop prompt response is not JSON', response.status); }

  if (response.status === 404) {
    throw new WorkLoopPromptError(
      'daemon_unroutable',
      'work-loop driver prompt route is not routable on this daemon build (owner daemon gap; fencing-token acquire route /v1/work-loop/control is 404)',
      404,
      body,
    );
  }
  if (body?.schema === 'focusa.work_loop_scope_rejection.v1' || body?.failure_class === 'scope_mismatch') {
    throw new WorkLoopPromptError('scope_mismatch', body?.error ?? 'work-loop scope rejected', response.status, body);
  }
  if (response.status === 422 || body?.failure_class === 'validation_rejected') {
    throw new WorkLoopPromptError('validation_rejected', 'work-loop prompt schema rejected by daemon', 422, body);
  }
  if (!response.ok || body?.ok === false) {
    throw new WorkLoopPromptError('rejected', body?.error ?? body?.message ?? 'work-loop prompt rejected', response.status, body);
  }
  return Object.freeze({ ...body, replayed: false });
}