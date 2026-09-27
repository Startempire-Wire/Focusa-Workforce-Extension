import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkUiaiTakeover, pollUiaiTakeover, UiaiError } from '../src/lib/uiai-client.mjs';

const TOKEN_KEY = 'focusa.workforce.uiai_token.v1';

function chromeWithToken(token = 'test-token') {
  return {
    storage: { local: { get: async (keys) => ({ [TOKEN_KEY]: token }) } }
  };
}

const baseFetch = (body, status = 200) =>
  async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('checkUiaiTakeover detects needs_human status', async () => {
  const fetchImpl = baseFetch({ session_id: 's1', status: 'needs_human', challenge: { type: 'recaptcha' } });
  const result = await checkUiaiTakeover({ chromeApi: chromeWithToken(), sessionId: 's1', fetchImpl });
  assert.equal(result.needsTakeover, true);
  assert.equal(result.reason, 'recaptcha');
  assert.deepEqual(result.challenge, { type: 'recaptcha' });
});

test('checkUiaiTakeover detects challenge field', async () => {
  const fetchImpl = baseFetch({ session_id: 's1', status: 'running', challenge: { type: 'hcaptcha', sitekey: 'x' } });
  const result = await checkUiaiTakeover({ chromeApi: chromeWithToken(), sessionId: 's1', fetchImpl });
  assert.equal(result.needsTakeover, true);
  assert.equal(result.reason, 'hcaptcha');
});

test('checkUiaiTakeover detects operator_escalation flag', async () => {
  const fetchImpl = baseFetch({ session_id: 's1', status: 'running', operator_escalation: true, escalation: { reason: 'auth_required' } });
  const result = await checkUiaiTakeover({ chromeApi: chromeWithToken(), sessionId: 's1', fetchImpl });
  assert.equal(result.needsTakeover, true);
  assert.equal(result.reason, 'auth_required');
});

test('checkUiaiTakeover returns false for healthy session', async () => {
  const fetchImpl = baseFetch({ session_id: 's1', status: 'running', url: 'https://...' });
  const result = await checkUiaiTakeover({ chromeApi: chromeWithToken(), sessionId: 's1', fetchImpl });
  assert.equal(result.needsTakeover, false);
});

test('checkUiaiTakeover surfaces errors without throwing', async () => {
  const fetchImpl = async () => { throw new Error('network down'); };
  const result = await checkUiaiTakeover({ chromeApi: chromeWithToken(), sessionId: 's1', fetchImpl });
  assert.equal(result.needsTakeover, false);
  assert.ok(result.error?.includes('network down'));
});

test('pollUiaiTakeover filters only takeover sessions', async () => {
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    const id = url.pathname.split('/').pop();
    if (id === 'needy') return new Response(JSON.stringify({ session_id: 'needy', status: 'needs_human', challenge: { type: 'recaptcha' } }), { status: 200 });
    return new Response(JSON.stringify({ session_id: id, status: 'running' }), { status: 200 });
  };
  const results = await pollUiaiTakeover({ chromeApi: chromeWithToken(), sessionIds: ['ok1', 'needy', 'ok2'], fetchImpl });
  assert.equal(results.length, 1);
  assert.equal(results[0].sessionId, 'needy');
  assert.equal(results[0].needsTakeover, true);
});