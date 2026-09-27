import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeDaemonOrigin, originPermission, requestDaemonOriginPermission, hasDaemonOriginPermission } from '../src/lib/validation.mjs';

test('daemon origins require HTTPS except exact loopback', () => {
  assert.equal(normalizeDaemonOrigin('https://focusa.example/'), 'https://focusa.example');
  assert.equal(normalizeDaemonOrigin('http://127.0.0.1:8787'), 'http://127.0.0.1:8787');
  assert.equal(normalizeDaemonOrigin('http://localhost:8787/'), 'http://localhost:8787');
  assert.equal(normalizeDaemonOrigin('http://[::1]:8787'), 'http://[::1]:8787');
  // Crostini bridge: the crosvm veth is this device's browser-reachable local
  // daemon address (focusa-bridge.service); HTTP stays loopback-equivalent only.
  assert.equal(normalizeDaemonOrigin('http://100.115.92.26:8787'), 'http://100.115.92.26:8787');
  for (const value of ['http://focusa.example', 'http://192.168.1.1:8787', 'ftp://focusa.example', 'https://user:pass@focusa.example', 'https://focusa.example/path', 'https://focusa.example/?token=x']) {
    assert.throws(() => normalizeDaemonOrigin(value));
  }
});

test('hasDaemonOriginPermission maps an origin to an origin-pattern check', async () => {
  const chromeApi = {
    permissions: {
      contains: async (arg) =>
        arg.origins[0] === originPermission('http://127.0.0.1:8787') ||
        arg.origins[0] === originPermission('http://100.115.92.26:8787'),
    },
  };
  assert.equal(await hasDaemonOriginPermission('http://127.0.0.1:8787', chromeApi), true);
  assert.equal(await hasDaemonOriginPermission('http://100.115.92.26:8787', chromeApi), true);
  assert.equal(await hasDaemonOriginPermission('https://focusa.example', chromeApi), false);
  await assert.rejects(() => hasDaemonOriginPermission('http://x:8787', {}), /Chrome permissions API is unavailable/);
});

test('host permission is requested for exact origin from caller gesture', async () => {
  const calls=[]; const chrome={permissions:{request:async (request)=>{calls.push(request);return true;}}};
  assert.equal(originPermission('https://focusa.example'), 'https://focusa.example/*');
  assert.equal(await requestDaemonOriginPermission('https://focusa.example', chrome), true);
  assert.deepEqual(calls, [{ origins: ['https://focusa.example/*'] }]);
});
