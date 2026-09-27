import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_DAEMON_CANDIDATES, localDaemonCandidates } from '../src/workforce/lib/local-daemon.js';

test('candidate list is frozen and includes loopback fallbacks', () => {
  assert.ok(Object.isFrozen(LOCAL_DAEMON_CANDIDATES));
  assert.ok(LOCAL_DAEMON_CANDIDATES.includes('http://127.0.0.1:8787'));
  assert.ok(LOCAL_DAEMON_CANDIDATES.includes('http://localhost:8787'));
});

test('crosvm veth candidate is first on this platform (browser namespace)', () => {
  assert.equal(LOCAL_DAEMON_CANDIDATES[0], 'http://100.115.92.26:8787');
});

test('accessor returns the same frozen list (no accidental mutation)', () => {
  assert.equal(localDaemonCandidates(), LOCAL_DAEMON_CANDIDATES);
  assert.throws(() => localDaemonCandidates().push('x'), TypeError);
});