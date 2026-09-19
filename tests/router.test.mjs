import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROUTES,
  INTENTS,
  CONTEXT_PARAMS,
  DEFAULT_ROUTE,
  decodeTypedRef,
  parseRoute,
  buildRoute,
  navItemForRoute,
} from '../src/workforce/lib/router.js';

test('ROUTES is frozen and exact (docs/11 §3 + docs/18 §4)', () => {
  assert.ok(Object.isFrozen(ROUTES));
  // Overview → Work → People → Needs You → Evidence → Topology → Audit → Settings
  assert.deepEqual(ROUTES, [
    '#/overview',
    '#/work',
    '#/work/detail',
    '#/people',
    '#/people/detail',
    '#/needs-you',
    '#/needs-you/detail',
    '#/evidence',
    '#/evidence/detail',
    '#/topology',
    '#/audit',
    '#/settings',
  ]);
});

test('default route is #/overview', () => {
  assert.equal(DEFAULT_ROUTE, '#/overview');
  assert.equal(parseRoute('').route, '#/overview');
  assert.equal(parseRoute('#/nope').route, '#/overview');
  assert.equal(parseRoute('garbage').route, '#/overview');
});

test('a route change does not carry scope mutation (context is read-only)', () => {
  const parsed = parseRoute('#/work/detail?env=c1&ref=&intent=direct&return=#/people');
  // Intent validate. ref absent → refState absent.
  assert.equal(parsed.route, '#/work/detail');
  assert.equal(parsed.params.env, 'c1');
  assert.equal(parsed.params.intent, 'direct');
  assert.equal(parsed.params.return, '#/people');
  assert.equal(parsed.refState, 'absent');
});

test('unknown parameter is ignored, unknown intent dropped', () => {
  const parsed = parseRoute('#/overview?env=a&evil=x&intent=dance');
  assert.deepEqual(parsed.params, { env: 'a' });
});

test('typed ref round-trips and decodes for detail routes', () => {
  const ref = { ref_version: 'focusa.workforce.ref.v1', kind: 'workpoint', workpoint_id: 'w1' };
  const hash = buildRoute('#/work/detail', { env: 'local', ref });
  assert.ok(hash.startsWith('#/work/detail?'));
  const parsed = parseRoute(hash);
  assert.equal(parsed.refState, 'ok');
  assert.deepEqual(parsed.ref, ref);
  assert.equal(decodeTypedRef(parsed.params.ref).ok, true);
});

test('unsupported ref version renders incompatible (no mutation path)', () => {
  const ref = { ref_version: 'legacy.v0', kind: 'workpoint' };
  const hash = buildRoute('#/work/detail', { ref });
  const parsed = parseRoute(hash);
  assert.equal(parsed.refState, 'incompatible');
  assert.match(parsed.refReason, /unsupported/i);
});

test('empty or malformed ref is incompatible with a reason', () => {
  assert.equal(parseRoute('#/work/detail?ref=zzz').refState, 'incompatible');
  assert.equal(decodeTypedRef('').ok, false);
  assert.equal(decodeTypedRef(null).ok, false);
});

test('nav ownership incl. Needs You as non-nav group (docs/18 §4)', () => {
  assert.equal(navItemForRoute('#/overview'), 'Overview');
  assert.equal(navItemForRoute('#/work'), 'Work');
  assert.equal(navItemForRoute('#/work/detail'), 'Work');
  assert.equal(navItemForRoute('#/people/detail'), 'People');
  assert.equal(navItemForRoute('#/needs-you'), 'Needs You');
  assert.equal(navItemForRoute('#/needs-you/detail'), 'Needs You');
  assert.equal(navItemForRoute('#/evidence'), 'Evidence');
  assert.equal(navItemForRoute('#/topology'), 'Topology');
  assert.equal(navItemForRoute('#/audit'), 'Audit');
  assert.equal(navItemForRoute('#/settings'), 'Settings');
});

test('buildRoute never emits an unknown intent', () => {
  assert.ok(!buildRoute('#/overview', { intent: 'dance' }).includes('intent='));
  assert.ok(buildRoute('#/people', { intent: 'review' }).includes('intent=review'));
});

test('buildRoute drops unknown routes back to default', () => {
  assert.equal(buildRoute('#/bogus', {}), '#/overview');
});