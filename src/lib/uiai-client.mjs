/**
 * UIAI Engine client (MLG-6.1/6.3.5) — governed bridge for browser sessions.
 *
 * The uiai-engine runs on loopback 7456; the extension reaches it through the
 * socat bridge at 100.115.92.26:7456 (host permission granted). Contract
 * verified against the live engine config 2026-09-27:
 *   /health              GET  -> {status:'healthy',service:'uiai-engine',...}
 *   /v1/sessions         POST -> create browser session
 *   /v1/sessions/{id}    GET   -> session status
 *   /v1/sessions/{id}    DELETE -> close session
 *   /v1/sessions/{id}/share POST -> create FPV share link
 *
 * Auth: the engine accepts X-Extension-Token header (configurable in YAML).
 * The extension carries a static token from chrome.storage.local (set once
 * by the operator via Settings -> UIAI). No token = 401.
 */
import { normalizeDaemonOrigin } from './validation.mjs';

const UIAI_ORIGIN = 'http://100.115.92.26:7456';

export class UiaiError extends Error {
  constructor(kind, message, status = null, details = null) {
    super(message);
    this.name = 'UiaiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

const TOKEN_KEY = 'focusa.workforce.uiai_token.v1';

export async function getUiaiToken(chromeApi) {
  try {
    const raw = (await chromeApi.storage.local.get(TOKEN_KEY))[TOKEN_KEY];
    return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
  } catch { return null; }
}

export async function setUiaiToken(chromeApi, token) {
  await chromeApi.storage.local.set({ [TOKEN_KEY]: token.trim() });
}

function headers(token) {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    ...(token ? { 'x-extension-token': token } : {}),
  };
}

/** Probe the bridge + engine health. Returns {ok, reachable, healthy, body?} */
export async function probeUiaiBridge(fetchImpl = globalThis.fetch) {
  try {
    const response = await fetchImpl(new URL('/health', UIAI_ORIGIN), {
      method: 'GET', headers: { accept: 'application/json' },
    });
    if (!response.ok) return { ok: false, reachable: true, healthy: false, status: response.status };
    const body = await response.json();
    return { ok: true, reachable: true, healthy: body?.status === 'healthy', body };
  } catch (error) {
    return { ok: false, reachable: false, healthy: false, error: error?.message };
  }
}

/**
 * Create a browser session via UIAI.
 * @param {{chromeApi, profile?: string, model?: string, provider?: string}} input
 */
export async function createUiaiSession({ chromeApi, profile = 'detect', model, provider }) {
  const token = await getUiaiToken(chromeApi);
  if (!token) throw new UiaiError('unauthenticated', 'UIAI token not configured — set it in Settings');
  const response = await fetchImpl(new URL('/v1/sessions', UIAI_ORIGIN), {
    method: 'POST', headers: headers(token),
    body: JSON.stringify({ profile, ...(model ? { model } : {}), ...(provider ? { provider } : {}) }),
  });
  if (response.status === 401) throw new UiaiError('unauthenticated', 'UIAI token rejected', 401);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new UiaiError('rejected', body?.error ?? 'session create failed', response.status, body);
  }
  const body = await response.json();
  return Object.freeze({ session_id: body.session_id, status: body.status, url: body.url });
}

/** Get session status. */
export async function getUiaiSession({ chromeApi, sessionId }) {
  const token = await getUiaiToken(chromeApi);
  if (!token) throw new UiaiError('unauthenticated', 'UIAI token not configured');
  const response = await fetchImpl(new URL(`/v1/sessions/${sessionId}`, UIAI_ORIGIN), {
    method: 'GET', headers: headers(token),
  });
  if (!response.ok) throw new UiaiError('rejected', 'session status failed', response.status);
  return Object.freeze(await response.json());
}

/** Get session details including takeover state. */
export async function getUiaiSessionDetail({ chromeApi, sessionId, fetchImpl = globalThis.fetch }) {
  const token = await getUiaiToken(chromeApi);
  if (!token) throw new UiaiError('unauthenticated', 'UIAI token not configured');
  const response = await fetchImpl(new URL(`/v1/sessions/${sessionId}`, UIAI_ORIGIN), {
    method: 'GET', headers: headers(token),
  });
  if (!response.ok) throw new UiaiError('rejected', 'session detail failed', response.status);
  return Object.freeze(await response.json());
}

/** Close a session. */
export async function closeUiaiSession({ chromeApi, sessionId }) {
  const token = await getUiaiToken(chromeApi);
  if (!token) throw new UiaiError('unauthenticated', 'UIAI token not configured');
  const response = await fetchImpl(new URL(`/v1/sessions/${sessionId}`, UIAI_ORIGIN), {
    method: 'DELETE', headers: headers(token),
  });
  if (!response.ok) throw new UiaiError('rejected', 'session close failed', response.status);
  return Object.freeze({ ok: true });
}

/** Create an FPV share link for a session (returns {share_url, expires_at}). */
export async function shareUiaiSession({ chromeApi, sessionId, minutes = 60 }) {
  const token = await getUiaiToken(chromeApi);
  if (!token) throw new UiaiError('unauthenticated', 'UIAI token not configured');
  const response = await fetchImpl(new URL(`/v1/sessions/${sessionId}/share`, UIAI_ORIGIN), {
    method: 'POST', headers: headers(token),
    body: JSON.stringify({ expires_minutes: minutes }),
  });
  if (!response.ok) throw new UiaiError('rejected', 'session share failed', response.status);
  return Object.freeze(await response.json());
}

/** Fetch the bridge health probe for UI display. */
export { probeUiaiBridge as checkUiaiHealth };

/**
 * Check if a UIAI session needs operator takeover (captcha, auth, etc.).
 * The engine surfaces takeover via session.status === 'needs_human' or
 * a challenge/escalation field in the detail response.
 * Returns {needsTakeover: boolean, reason?: string, challenge?: object, fpvShareUrl?: string}.
 */
export async function checkUiaiTakeover({ chromeApi, sessionId, fetchImpl = globalThis.fetch }) {
  try {
    const detail = await getUiaiSessionDetail({ chromeApi, sessionId, fetchImpl });
    // Heuristic: status field or challenge/escalation presence
    const needs = detail.status === 'needs_human' ||
      detail.challenge !== undefined ||
      detail.escalation !== undefined ||
      detail.operator_escalation === true;
    return {
      needsTakeover: needs,
      reason: detail.challenge?.type ?? detail.escalation?.reason ?? detail.status,
      challenge: detail.challenge,
      fpvShareUrl: detail.fpv_share_url ?? detail.share_url ?? null,
      raw: detail,
    };
  } catch (error) {
    return { needsTakeover: false, error: String(error) };
  }
}

/** Poll all active UIAI sessions for takeover needs. */
export async function pollUiaiTakeover({ chromeApi, sessionIds, fetchImpl = globalThis.fetch }) {
  const results = [];
  for (const sessionId of sessionIds) {
    results.push({ sessionId, ...(await checkUiaiTakeover({ chromeApi, sessionId, fetchImpl })) });
  }
  return results.filter((r) => r.needsTakeover);
}