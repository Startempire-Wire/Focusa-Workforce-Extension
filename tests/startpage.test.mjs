import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname, 'src');
const appDir = path.join(root, 'startpage-app');
const html = fs.readFileSync(path.join(appDir, 'startpage.html'), 'utf8');
const entry = fs.readFileSync(path.join(appDir, 'main.js'), 'utf8');
const app = fs.readFileSync(path.join(appDir, 'App.svelte'), 'utf8');

// docs/11 §2 + §19 and docs/10 WF-SUR-003: the start page is a concise
// return/orientation surface, not a widget dashboard.
test('start page is the built orientation entry, not the legacy widget page', () => {
  assert.match(html, /wf-start-root/);
  assert.match(html, /main\.js/);
  assert.ok(!fs.existsSync(path.join(root, 'startpage.mjs')), 'the widget dashboard module is retired');
  assert.ok(!fs.existsSync(path.join(root, 'startpage.html')), 'the widget markup is retired');
  assert.ok(!/data-widget=/.test(html), 'no widget grid is shipped');
});

test('start page loads connection posture, current Workstream, attention, work summary and proof', () => {
  for (const fact of ['Connection', 'Workstream', 'Needs You', 'Working', 'Recent proof', 'Scope']) {
    assert.ok(app.includes(`>${fact}<`) || app.includes(`${fact}</dt>`) || app.includes(fact), `orientation fact present: ${fact}`);
  }
  assert.match(app, /createWorkforceStore/, 'it reads the same shared runtime client as every other surface');
  assert.match(app, /refreshEnvironments\(\)/);
  assert.match(app, /refreshOwner\(\)/);
});

test('start page primary action continues the current Workstream, secondaries hand off', () => {
  assert.match(app, /Continue current Workstream/);
  assert.match(app, /Open Needs You/);
  assert.match(app, /Open Workforce/);
});

test('start page offers a simple pairing call to action when unconfigured', () => {
  assert.match(app, /Pair Focusa/);
  assert.match(app, /no Focusa environment is paired/i);
});

test('start page labels staleness from the owner stream instead of assuming freshness', () => {
  assert.match(app, /staleness/);
  assert.match(app, /stale/);
  assert.match(app, /last confirmed/);
});

test('start page performs no consequential mutation', () => {
  for (const forbidden of ['orchestrateAction', 'createPreflightedSession', 'preflightSafeSession', 'controlSession', 'projectUse']) {
    assert.ok(!app.includes(forbidden), `orientation surface must not call ${forbidden}`);
  }
});

test('public Work mode is decided before any extension state is touched', () => {
  const gate = entry.indexOf("searchParams.get('public-work') === '1'");
  const storeUse = entry.indexOf('mount(App');
  assert.ok(gate > -1 && gate < storeUse, 'the public gate precedes the private app mount');
});

test('orientation surface uses the shared token layer and respects motion preferences', () => {
  const css = fs.readFileSync(path.join(appDir, 'startpage.css'), 'utf8');
  assert.match(css, /@import '\.\.\/tokens\.css'/, 'tokens come first so the import is honoured');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.ok(!/data-widget/.test(css), 'legacy widget styling is not part of the surface');
});
