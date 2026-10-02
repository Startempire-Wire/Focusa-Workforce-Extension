import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// docs/17 §4–§5 is the layout authority for the Start Page. These assertions
// pin the atlas region order, content caps, state replacements and the
// public/private split, replacing the pre-atlas widget-grid hooks.
const root = path.resolve(new URL('..', import.meta.url).pathname, 'src');
const html = fs.readFileSync(path.join(root, 'startpage.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'startpage.mjs'), 'utf8');
const css = fs.readFileSync(path.join(root, 'startpage.css'), 'utf8');

test('start page region order follows the docs/17 §4 atlas', () => {
  const order = ['Current Workstream', 'sp-actions', 'sp-summary', 'Verified Recently'];
  let cursor = -1;
  for (const region of order) {
    const at = html.indexOf(region);
    assert.ok(at > cursor, `${region} appears in atlas order`);
    cursor = at;
  }
  // Summary region is Needs You | Working Now.
  const summary = html.slice(html.indexOf('sp-summary'), html.indexOf('Verified Recently'));
  assert.ok(summary.indexOf('Needs You') < summary.indexOf('Working Now'), 'Needs You precedes Working Now');
});

test('start page is the calm face: hero, one primary action, content caps', () => {
  assert.match(html, /class="sp-hero-title"/);              // hero title 28/34/650
  assert.match(html, /id="orient-now"[^>]*sp-btn-primary/); // Continue is the only filled action
  assert.match(html, /id="open-needs"/);
  assert.match(html, /id="open-workforce"[^>]*sp-btn-quiet/);
  // Content caps are enforced in the projection, not by CSS hiding.
  assert.match(js, /\.slice\(0, 2\)/);  // Needs You: 2 highest-value items
  assert.match(js, /\.slice\(0, 4\)/);  // Working Now: 4 rows
  assert.match(js, /\.slice\(0, 3\)/);  // Verified Recently: 3 items
});

test('start page implements the docs/17 §4 state replacements', () => {
  for (const id of ['start-unpaired', 'start-stale', 'start-private']) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  assert.match(js, /Not connected/);
  // The not-connected state is a LIVING discovery surface, not a pairing wall.
  // docs/17 §4 unpaired replacement: calm, centred, and no empty sections below.
  // The content is what discovery found, so the state is informative, not a wall.
  assert.match(html, /Nothing is attached/);
  assert.match(html, /Your workforce, waiting/);
  assert.doesNotMatch(html, /Your workforce is not connected on this device/,
    'the dead pairing copy must not come back');
  assert.match(html, /id="start-connect"/, 'it shows what was found');
  assert.match(html, /id="start-more-toggle"/, 'and asking for another is one quiet control');
  assert.match(html, /id="start-connect"/, 'it has a connection surface');
  assert.match(html, /name or address/, 'it accepts a name or address directly');
  // Pairing a daemon this device cannot see is still one click away, in Settings.
  assert.match(js, /#\/settings\?section=connections/, 'remote pairing remains reachable');
  assert.doesNotMatch(html, /Your workforce is not connected on this device/,
    'the dead pairing copy must not come back');
  // and it is driven by the shared discovery, with live previews
  assert.match(js, /discoverDaemons/);
  assert.match(js, /previewDaemon/);
  assert.match(js, /watchLiveness/);
  assert.match(js, /writes/);
  assert.match(js, /Disconnect|disconnect/);
  // Unpaired replaces everything below the header (no empty sections below).
  assert.match(js, /el\.unpaired\.hidden = true;[\s\S]*el\.private\.hidden = false/);
});

test('start page is a chrome start page with a public/private split', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(root, '..', 'manifest.json'), 'utf8'));
  assert.ok(manifest.chrome_url_overrides?.newtab, 'the extension owns the Chrome new tab');
  assert.match(html, /id="start-public"/);
  assert.match(js, /public-work=1|get\('public-work'\) === '1'/);
  // Public mode never falls through to private mode.
  // Public mode loads a dedicated module that cannot read private state.
  assert.match(js, /searchParams\.get\('public-work'\) === '1'\) \{/);
  assert.match(js, /await import\('\.\/startpage-public\.mjs'\)/);
  assert.match(html, /Public snapshot unavailable/);
});

test('start page keeps daemon source explicit and selection persistent', () => {
  assert.match(html, /id="daemon-select-label"/);
  assert.match(js, /loadSelectedConnection/);
  assert.match(js, /focusa_startpage_connection\.v1/);
  assert.match(js, /liveConnection\?\.label/);
});

test('start page refreshes from governed SSE events and stops on page hide', () => {
  assert.match(js, /runReliableEventStream/);
  assert.match(js, /initialCursor: liveConnection\.last_cursor/);
  assert.match(js, /commitCursor: async \(cursor\) =>/);
  assert.match(js, /window\.addEventListener\('pagehide'/);
  assert.match(js, /streamAbort\?\.abort/);
});

test('start page and side panel share persisted notification projections', () => {
  assert.match(js, /notificationFromEvent/);
  assert.match(js, /saveNotification/);
  assert.match(js, /listNotifications/);
});

test('start page consumes canonical projections and stays honest when absent', () => {
  assert.match(js, /import \{ fetchBrowserFleet, fetchWorkLoop, ProjectionRequestError \} from '\.\/lib\/api-client\.mjs';/);
  assert.match(js, /Runtime unavailable/);
  assert.match(js, /projection\.status|ProjectionRequestError/);
});

test('start page grid, collapse order and accessibility are atlas-exact', () => {
  assert.match(css, /max-width: 1120px/);                    // §1 start page max width
  assert.match(css, /\.sp-summary \{[^}]*grid-template-columns: 1fr 1fr/); // summary 2-col
  assert.match(css, /@media \(max-width: 850px\)/);
  assert.match(css, /@media \(max-width: 599px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /prefers-color-scheme: light/);
  assert.match(css, /:focus-visible/);
});

test('start page consumes the shared token layer', () => {
  assert.match(css, /@import '\.\/tokens\.css'/);
  assert.match(css, /--panel: var\(--bg-surface\)/);
  assert.match(css, /--text: var\(--text-primary\)/);
});


// The unpaired block is the door for when nothing is attached. The connected
// face - Current Focus, Needs You, Projects and the Open Workforce button, the
// only way into the work screens - lives in the private section. Showing the
// door while attached hid all of it.
test('attached shows the connected face, not the door', async () => {
  assert.match(js, /if \(isAttached\(link\)\) \{\s*el\.unpaired\.hidden = true;\s*el\.private\.hidden = false;/,
    'attached must reveal the private content face');
  assert.match(html, /id="start-private"[\s\S]*id="open-workforce"/,
    'the connected face must carry the way into the work screens');
});

// docs/18 §6 is the authority for the Start Page hierarchy. Open Workforce is
// item 6: it is the route into FULL WORKFORCE, and it used to sit third in the
// action row styled quiet, making the only way into the work screens the
// hardest control on the page to find.
test('connected face renders the IA §6 hierarchy in order', () => {
  const privateFace = html.slice(html.indexOf('id="start-private"'));
  const order = [...privateFace.slice(0, privateFace.indexOf('id="start-unpaired"'))
    .matchAll(/id="(orient-now|open-needs|open-workforce|start-needs-heading|start-working-heading|start-verified-heading)"/g)]
    .map((m) => m[1]);
  assert.deepEqual(order, [
    'orient-now',
    'open-needs',
    'start-needs-heading',
    'start-working-heading',
    'start-verified-heading',
    'open-workforce',
  ], 'the connected face must follow the IA order');
  // Position comes from IA section 6; treatment from docs/17 section 4, which
  // allows exactly one primary action and Continue already holds it. Honouring
  // one without the other is how this drifted in the first place.
  assert.match(html, /id="open-workforce"[^>]*sp-btn-quiet/,
    'Open Workforce stays quiet: docs/17 allows a single primary action');
});
