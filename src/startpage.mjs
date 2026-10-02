/**
 * Start Page (docs/17 §4–§5) — rapid orientation and return.
 *
 * Calmest face: no chat box, no raw endpoint, no dense nav. Everything shown is
 * an owner projection; the page never invents freshness or proof. Public mode
 * (?public-work=1) renders only the curated snapshot and never falls through to
 * the private surface.
 */
import { fetchBrowserFleet, fetchWorkLoop, ProjectionRequestError } from './lib/api-client.mjs';
import { projectWorkLoop } from './lib/projections.mjs';
import { runReliableEventStream } from './lib/reconnect.mjs';
import { listConnections, listLocalEnvironments } from './lib/storage.mjs';
import { listNotifications, notificationFromEvent, saveNotification } from './lib/notifications.mjs';
import {
  buildConnectableEntries, discoverDaemons, previewDaemon, rememberDaemon, reachableOriginFilter, seedCandidates, watchLiveness,
} from './lib/discovery.mjs';
import { hasDaemonOriginPermission, requestDaemonOriginPermission, normalizeDaemonOrigin } from './lib/validation.mjs';
import { saveLocalEnvironment } from './lib/storage.mjs';
import { BUILD } from './lib/build-info.mjs';
import { initialConnection, describeConnection, applyBeat, isAttached } from './lib/connection.mjs';
import { createDiagnostics } from './lib/diagnostics.mjs';
import { createWorkforceClient } from './lib/workforce-client.mjs';
import { resolveScope, continuityFromTrajectory, loadInspector } from './lib/inspector.mjs';
import { readCache, writeCache, clearCache, isUsable, ageLabel, ageMs } from './lib/daemon-cache.mjs';
import { readMergedTopology } from './lib/tailscale.mjs';
import { readHostBook } from './lib/host-book.mjs';

/** Run an interaction and show any failure IN the surface. */
async function guard(label, work) {
  try { await work(); } catch (error) { showSurfaceError(`${label} failed: ${String(error?.message ?? error).slice(0, 160)}`); }
}

function showSurfaceError(message) {
  el.surfaceError.textContent = message;
  el.surfaceError.hidden = false;
}

window.addEventListener('unhandledrejection', (event) => {
  showSurfaceError(`Something did not finish: ${String(event.reason?.message ?? event.reason).slice(0, 160)}`);
});

const $ = (selector) => {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`required start page element missing: ${selector}`);
  return node;
};

const el = {
  envLabel: $('#daemon-select-label'),
  private: $('#start-private'),
  unpaired: $('#start-unpaired'),
  public: $('#start-public'),
  focusTitle: $('#start-focus-heading'),
  objective: $('#start-objective'),
  meta: $('#start-meta'),
  stale: $('#start-stale'),
  refresh: $('#start-refresh'),
  continue: $('#orient-now'),
  openNeeds: $('#open-needs'),
  openNeeds2: $('#open-needs-2'),
  openWorkforce: $('#open-workforce'),
  needs: $('#start-needs'),
  needsCount: $('#start-needs-count'),
  working: $('#start-working'),
  verified: $('#start-verified'),
  unpairedHeading: $('#start-unpaired-heading'),
  connect: $('#start-connect'),
  seedForm: $('#start-seed'),
  seedInput: $('#start-seed-input'),
  seedNote: $('#start-seed-note'),
  telemetry: $('#start-telemetry'),
  buildStamp: $('#build-stamp'),
  surfaceError: $('#surface-error'),
  pill: $('#connection-pill'),
  pillLabel: $('#conn-label'),
  pillWhere: $('#conn-where'),
  pillAction: $('#conn-action'),
  detail: $('#conn-detail'),
  inspector: $('#start-inspector'),
  inspectorScope: $('#inspector-scope'),
  inspectorRefresh: $('#inspector-refresh'),
  inspectorEvents: $('#inspector-events'),
  inspectorEventsState: $('#inspector-events-state'),
  inspectorEventsToggle: $('#inspector-events-toggle'),
  inspectorNote: $('#inspector-note'),
  inspectorSections: $('#inspector-sections'),
  diagCount: $('#diag-count'),
  diagList: $('#diag-list'),
  diagCopy: $('#diag-copy'),
  diagClear: $('#diag-clear'),
  roster: $('#start-roster'),
  peerlist: $('#sp-peerlist'),
  count: $('#sp-roster-count'),
  publicDate: $('#public-date'),
  publicMission: $('#public-mission'),
  publicWorkforce: $('#public-workforce'),
  publicCurrent: $('#public-current'),
  publicProof: $('#public-proof'),
  publicFailure: $('#public-failure'),
};

const CONNECTION_KEY = 'focusa_startpage_connection.v1';

const diag = createDiagnostics({ chromeApi: typeof chrome !== 'undefined' ? chrome : undefined });

function renderDiagnostics() {
  if (!el.diagList) return;
  const events = diag.recent(50);
  el.diagCount && (el.diagCount.textContent = events.length ? `(${events.length})` : '');
  el.diagList.replaceChildren(...events.map((event) => {
    const li = document.createElement('li');
    const code = event.code ? ` [${event.code}]` : '';
    const detail = event.details ? ` ${JSON.stringify(event.details).slice(0, 160)}` : '';
    const message = event.message ? ` — ${event.message}` : '';
    li.append(
      Object.assign(document.createElement('strong'), { textContent: `${event.at.slice(11, 19)} ` }),
      Object.assign(document.createElement('span'), { textContent: `${event.name}${code}${detail}${message}` }),
    );
    if (event.level === 'error') li.className = 'diag-error';
    return li;
  }));
}

let liveConnection = null;
let streamAbort = null;
let notifications = [];

function openWorkforce(hash = '') {
  chrome.tabs.create({ url: chrome.runtime.getURL('workforce.html') + hash });
}

function row(title, meta) {
  const li = document.createElement('li');
  li.append(Object.assign(document.createElement('span'), { className: 'sp-row-title', textContent: title }));
  if (meta) li.append(Object.assign(document.createElement('span'), { className: 'sp-row-meta', textContent: meta }));
  return li;
}

function emptyRow(message) {
  return Object.assign(document.createElement('li'), { className: 'sp-empty', textContent: message });
}

/** Owner freshness is reported inside the connection detail line, not beside it. */
function setFreshness(_state, text) {
  if (isAttached(link)) link = { ...link, note: text };
  // Ask the tailnet who it is, immediately, before anything else. The read is
// cached for a minute, so the roster is present on first paint instead of
// arriving a beat after the daemons do.
readMergedTopology().catch(() => {});
renderLink();
}

/* ── the living connection surface ──────────────────────────────────────────
   The Start Page is the calmest face, but it is not inert: it discovers
   automatically, previews each daemon with that daemon's own reported
   liveness, and keeps a heartbeat running so freshness is a live fact. */
let discoveryState = { state: 'discovering', daemons: [], baseUrl: null, alive: false, answers: [], known: [] };
let link = initialConnection();

/** The one place the Start Page's connection state is turned into words. */
/**
 * The tailnet roster, by workflow: the machines are always visible (seeing costs
 * nothing), and selecting one reveals what it holds plus the single action that
 * attaches to it. Depth is earned, never assumed.
 */
/** The panel a selected machine reveals: where it is, and the one action. */
function buildDetail(peer) {
  const detail = document.createElement('div');
  detail.className = 'sp-peer-detail';
  const address = document.createElement('code');
  address.textContent = peer.url ?? (peer.ips ?? []).join(', ') ?? 'no address reported';
  if (!address.textContent) address.textContent = 'no address reported';
  const what = document.createElement('p');
  what.className = 'sp-peer-what';
  if (peer.verified && peer.summary) {
    // A daemon something already proved reachable: show what it holds.
    const parts = [];
    if (peer.summary.version) parts.push(`Focusa ${peer.summary.version}`);
    const projects = peer.summary.projects;
    if (projects?.effective) parts.push(projects.effective);
    else if (projects?.count) parts.push(`${projects.count} project(s)`);
    if (peer.summary.sessionCount != null) parts.push(`${peer.summary.sessionCount} session(s)`);
    what.textContent = parts.join(' · ') || 'Verified Focusa daemon.';
    if (peer.stale) {
      const stale = document.createElement('span');
      stale.className = 'sp-stale-badge';
      stale.textContent = 'last verified a while ago';
      what.append(' ', stale);
    }
    const names = (projects?.names ?? []).filter((name) => name && name !== projects?.effective);
    if (names.length) {
      const more = document.createElement('p');
      more.className = 'sp-names';
      more.textContent = names.join(' · ');
      detail.append(address, what, more);
    } else {
      detail.append(address, what);
    }
  } else {
    what.textContent = peer.summary
      ? peer.summary
      : peer.online ? 'Answers on the tailnet. Connect to see what it holds.' : 'Offline on the tailnet right now.';
    detail.append(address, what);
  }
  const actions = document.createElement('div');
  actions.className = 'sp-row';
  const connect = document.createElement('button');
  connect.type = 'button';
  connect.className = 'sp-btn sp-btn-primary';
  connect.textContent = peer.granted ? 'Connect' : 'Allow & connect';
  connect.addEventListener('click', () => guard('Connect', () => connectPeer(peer)));
  actions.append(connect);
  detail.append(address, what, actions);
  return detail;
}

function renderRoster() {
  const peers = link?.connectable ?? [];
  if (!el.roster) return;
  // Shown whenever the tailnet has peers, connected or not: seeing what is out
  // there must never cost a click.
  el.roster.hidden = peers.length === 0;
  if (el.roster.hidden) return;
  el.count && (el.count.textContent = `${peers.filter((p) => p.online).length} online · ${peers.length} total`);
  el.peerlist.replaceChildren();
  for (const peer of peers) {
    const item = document.createElement('li');
    item.className = `sp-peer${peer.online ? '' : ' off'}`;

    // 1. the machine, always visible
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'sp-peer-pick';
    pick.setAttribute('aria-expanded', 'false');
    const dot = document.createElement('span');
    dot.className = 'sp-peer-dot';
    const name = document.createElement('span');
    name.className = 'sp-peer-name';
    name.textContent = peer.name ?? 'peer';
    pick.append(dot, name);
    // Toggling this item only: rebuilding the list on every selection would
    // destroy keyboard focus (docs/17 §21.5) and lose the open panel's scroll.
    pick.addEventListener('click', () => {
      const opening = !item.classList.contains('open');
      for (const other of el.peerlist.querySelectorAll('.sp-peer.open')) {
        other.classList.remove('open');
        other.querySelector('.sp-peer-pick')?.setAttribute('aria-expanded', 'false');
        other.querySelector('.sp-peer-detail')?.remove();
      }
      if (!opening) return;
      item.classList.add('open');
      pick.setAttribute('aria-expanded', 'true');
      item.append(buildDetail(peer));
    });
    item.append(pick);

    // 2. its detail, revealed on selection
    el.peerlist.append(item);
  }
}

/** Grant one machine and attach: the single click remote attach needs. */
async function connectPeer(peer) {
  const origin = (peer.origins ?? [])[0] ?? (peer.ips?.[0] ? `http://${peer.ips[0]}:8787` : null);
  if (!origin) {
    diag.warn('connect.no-origin', { peer: peer?.name ?? null });
    renderDiagnostics();
    return null;
  }
  const done = diag.step('connect.peer', { origin, peer: peer?.name ?? null });
  const already = await hasDaemonOriginPermission(origin).catch((error) => {
    done({ code: 'permission-missing', error });
    return false;
  });
  diag.log('connect.permission', { origin, already });
  if (!already) {
    const granted = await requestDaemonOriginPermission(origin, chrome).catch((error) => {
      done({ code: 'permission-denied', error });
      return false;
    });
    if (!granted) {
      done({ code: 'permission-denied' });
      connection = { ...connection, status: 'disconnected', baseUrl: null, note: 'Chrome did not grant access to that machine. Click Connect again and choose Allow in the prompt.' };
      renderLink();
      renderDiagnostics();
      return null;
    }
  }
  try {
    const result = await connect(origin);
    done(null, { attached: connection?.baseUrl ?? null });
    renderDiagnostics();
    return result;
  } catch (error) {
    done(error);
    renderDiagnostics();
    throw error;
  }
}

function renderLink() {
  const view = describeConnection(link);
  el.pill.dataset.tone = view.tone;
  el.pillLabel.textContent = view.label;
  el.pillWhere.textContent = link?.baseUrl ? ` ${link.baseUrl}` : '';
  el.pill.setAttribute('title', view.detail);
  el.pillAction.textContent = view.status === 'connected' || view.status === 'unreachable' ? 'Disconnect' : 'Connect';
  el.detail.dataset.tone = view.tone;
  el.detail.hidden = view.status === 'connected' && !link?.note;
  el.detail.replaceChildren();
  if (!el.detail.hidden) {
    const text = document.createElement('span');
    text.append(
      Object.assign(document.createElement('strong'), { textContent: view.headline }),
      document.createTextNode(view.status === 'connected' ? ' — your workforce is attached.' : ` — ${view.detail}`),
    );
    el.detail.append(text);
  }
  // When a daemon is attached the private face is the hero; when none is, the
  // not-connected face is. Exactly one leads, and the other is out of the way.
  const attached = isAttached(link);
  el.private.hidden = !attached;
  el.unpaired.hidden = attached;
  renderRoster();
}

/** Machines the tailnet reports, offered when they are not yet granted. */
async function loadRoster() {
  const reachable = await reachableOriginFilter(chrome);
  // The merged read folds the discovery bridge in, so peers the OS client
  // cannot see still appear - with whatever the bridge already verified first.
  const merged = await readMergedTopology().catch(() => null);
  const bookEntries = await readHostBook(chrome).catch(() => []);
  const connectable = await buildConnectableEntries({
    peers: merged?.peers ?? [],
    verifiedDaemons: merged?.verifiedDaemons ?? [],
    bookEntries,
  }, reachable);
  link = { ...link, connectable };
  renderLink();   // the roster arrives after the first paint
}

/** Daemons this browser has used before, so an absence is explained, not silent. */
async function readKnownDaemons() {
  try {
    const raw = (await chrome.storage.local.get('focusa.workforce.discovered.v1'))['focusa.workforce.discovered.v1'];
    return Array.isArray(raw) ? raw.slice(0, 6) : [];
  } catch { return []; }
}
let previews = {};
let stopHeartbeat = null;

const PLACES = [
  { label: 'This browser', hosts: ['127.0.0.1', 'localhost', '[::1]'] },
  // whatever the machine itself reported, at runtime
  { label: 'This device', hosts: [] },
  { label: 'Tailnet', hosts: null },
];
const isTailnet = (host) => {
  if (typeof host === 'string' && host.toLowerCase().endsWith('.ts.net')) return true;
  const parts = String(host).split('.');
  return /^[\d.]+$/.test(host) && parts[0] === '100' && Number(parts[1]) >= 64 && Number(parts[1]) <= 127;
};

/** Daemon addresses and labels come from the network; never let them become markup. */
function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function renderDiscovery() {
  if (!el.connect) return;
  // Attached is the answer to "what do I choose?". While something is attached
  // this prompt is a lie: the header strip says Connected and this asked the
  // operator to pick a daemon they had already picked. Say what is attached
  // instead, and point at the header's Disconnect, which already exists and
  // already works - no second control here to keep in step with it.
  if (isAttached(link)) {
    el.unpaired.hidden = false;
    el.private.hidden = true;
    el.unpairedHeading && (el.unpairedHeading.textContent = 'Attached');
    el.connect.innerHTML = `
      <p class="muted">Your live daemon is <b>${escapeText(link.baseUrl)}</b>.</p>
      <p class="muted">Use <b>Disconnect</b> above to attach a different one.</p>`;
    return;
  }
  el.unpaired.hidden = false;
  el.private.hidden = true;
  if (discoveryState.state === 'found') {
    // Stated once, in the markup, and left alone: the heading is the state, not
    // a status message that changes with every probe.
    el.unpairedHeading && (el.unpairedHeading.textContent = 'Your workforce, waiting');
    el.connect.innerHTML = `
      <ul class="sp-daemons">
        ${discoveryState.daemons.map((daemon) => {
          const preview = daemon.preview ?? previews[daemon.baseUrl];
          const lead = daemon.baseUrl === discoveryState.baseUrl;
          // Lead with what a person chooses between: which daemon, how long it
          // has been up, what work it holds. Write counters are diagnostics.
          const stats = preview
            ? `<p class="sp-preview">${preview.version ? `<span><b>${preview.version}</b> version</span>` : ''}${preview.uptimeMs != null ? `<span><b>${Math.max(1, Math.round(preview.uptimeMs / 60000))}m</b> up</span>` : ''}</p>
               ${preview.projects?.length
                 ? `<p class="sp-names">${preview.projects.join(' · ')}</p>`
                 : preview.projectSelectionRequired
                   ? '<p class="sp-names">No project chosen yet — pick one to scope this workforce.</p>' : ''}
               ${(daemon.addresses?.length ?? 0) > 1 ? `<p class="sp-names">Reachable at ${daemon.addresses.length} addresses</p>` : ''}
               ${(preview.failures ?? 0) > 0 ? `<p class="sp-names warn">${preview.failures} write failure(s) reported</p>` : ''}`
            : '<p class="sp-preview pending">reading what this daemon holds…</p>';
          return `<li class="sp-daemon${lead ? ' lead' : ''}">
            <div class="sp-dhead"><span class="sp-kind">${daemon.kindLabel}</span><code>${daemon.baseUrl}</code></div>
            ${stats}
            <button type="button" class="sp-btn ${lead ? 'sp-btn-primary' : ''}" data-connect="${daemon.baseUrl}">Connect</button>
          </li>`;
        }).join('')}
      </ul>`;
    el.connect.querySelectorAll('[data-connect]').forEach((button) => {
      button.addEventListener('click', () => guard('Connect', () => connect(button.dataset.connect)));
    });
    return;
  }
  if (discoveryState.state === 'none') {
    const remembered = (discoveryState.known ?? []);
    el.connect.innerHTML = `<p class="sp-empty-line">No Focusa daemon answered on loopback, this device's bridges or the tailnet.</p>`
      + (remembered.length
        ? `<ul class="sp-daemons">${remembered.map((item) => `<li class="sp-daemon dim">
            <div class="sp-dhead"><span class="sp-kind">Known</span><code>${item.baseUrl}</code></div>
            <p class="sp-names">Not answering right now. It will be tried again next time you open this tab.</p>
            <button type="button" class="sp-btn" data-connect="${item.baseUrl}">Try again</button>
          </li>`).join('')}</ul>`
        : '');
    el.connect.querySelectorAll('[data-connect]').forEach((button) => {
      button.addEventListener('click', () => guard('Connect', () => connect(button.dataset.connect)));
    });
    return;
  }
  const answered = new Set((discoveryState.answers ?? []).filter((a) => a.ok).map((a) => new URL(a.baseUrl).hostname));
  el.connect.innerHTML = `<ul class="sp-places">${PLACES.map((place) => {
    const ok = place.hosts ? place.hosts.some((host) => answered.has(host)) : [...answered].some(isTailnet);
    return `<li class="${ok ? 'ok' : ''}"><span class="dot"></span>${place.label}<em>${ok ? 'found' : 'checking'}</em></li>`;
  }).join('')}</ul>`;
}

function loadPreview(baseUrl) {
  return previewDaemon({ baseUrl })
    .then((preview) => { previews = { ...previews, [baseUrl]: preview }; renderDiscovery(); renderTelemetry(); })
    .catch(() => {});
}

function renderTelemetry() {
  if (!el.telemetry) return;
  const baseUrl = liveConnection?.base_url;
  const preview = baseUrl ? previews[baseUrl] : null;
  if (!preview) { el.telemetry.hidden = true; return; }
  el.telemetry.hidden = false;
  el.telemetry.textContent = `${preview.batches ?? '—'} writes persisted · ${preview.failures ?? '—'} failures · ${preview.projectCount ?? '—'} projects in this daemon`;
}

async function discover({ extra = [] } = {}) {
  const done = diag.step('discover', {});
  discoveryState = { state: 'discovering', daemons: [], baseUrl: null, alive: false, answers: [] };
  previews = {};
  renderDiscovery();
  renderDiagnostics();
  let found = [];
  let answers = [];
  try {
    ({ found, answers } = await discoverDaemons(chrome, {
      extra,
      onAnswer: (answer) => { discoveryState.answers = [...discoveryState.answers, answer]; renderDiscovery(); },
    }));
  } catch (error) {
    done(error);
    renderDiagnostics();
    throw error;
  }
  done(null, { found: found.length, answers: answers.length, ok: answers.filter((a) => a.ok).length });
  if (!found.length) {
    const remembered = await readKnownDaemons();
    discoveryState = { state: 'none', daemons: [], answers, known: remembered };
    if (!isAttached(link)) {
      link = { ...link, status: 'disconnected', baseUrl: null, note: 'No Focusa daemon answered' };
    }
    renderLink();
    renderDiscovery();
    renderDiagnostics();
    return;
  }
  discoveryState = { state: 'found', daemons: found, baseUrl: found[0].baseUrl, alive: true, answers };
  await loadRoster();
  renderLink();
  renderDiscovery();
  renderDiagnostics();
  for (const daemon of found) loadPreview(daemon.baseUrl);
}

async function connect(baseUrl) {
  const done = diag.step('connect.attach', { baseUrl });
  let origin;
  try {
    origin = normalizeDaemonOrigin(baseUrl);
  } catch (error) {
    done(error);
    renderDiagnostics();
    throw error;
  }
  link = { ...link, status: 'connecting', baseUrl: origin, note: 'Connecting…' };
  renderLink();
  const already = await hasDaemonOriginPermission(origin).catch(() => false);
  diag.log('connect.permission', { origin, already });
  if (!already) {
    const granted = await requestDaemonOriginPermission(origin, chrome).catch(() => false);
    if (!granted) {
      done({ code: 'permission-denied' });
      link = { ...link, status: 'disconnected', baseUrl: null, note: 'Chrome did not grant access. Click Connect again and choose Allow in the prompt.' };
      renderLink();
      renderDiagnostics();
      return;
    }
  }
  try {
    await saveLocalEnvironment({
      schema: 'focusa.workforce_local_environment.v1',
      environment_id: `local:${origin}`,
      label: `Focusa daemon (${origin})`,
      base_url: origin,
      created_at: new Date().toISOString(),
    }, chrome);
  } catch (error) {
    done(error, { step: 'saveLocalEnvironment' });
    renderDiagnostics();
    throw error;
  }
  await rememberDaemon(chrome, { baseUrl: origin, label: 'Focusa daemon' });
  liveConnection = { connection_id: `local:${origin}`, label: `Focusa daemon (${origin})`, base_url: origin, token: null };
  await chrome.storage.local.set({ [CONNECTION_KEY]: liveConnection.connection_id });
  link = { status: 'connected', baseUrl: origin, label: liveConnection.label, since: new Date().toISOString(), lastSeenAt: new Date().toISOString(), note: null };
  el.connect.hidden = true;
  // The body must follow the header: without this the page keeps asking the
  // operator to choose a daemon they just attached to.
  renderDiscovery();
  renderLink();
  done(null, { attached: origin });
  renderDiagnostics();
  await refresh();
  await loadInspectorIntoUI();
  startInspectorRefresh();
  startStream();
  stopHeartbeat?.();
  stopHeartbeat = watchLiveness(origin, (beat) => {
    discoveryState = { ...discoveryState, alive: beat.ok };
    link = applyBeat(link, beat);
    renderLink();
    if (beat.ok) loadPreview(origin);
  });
}

async function disconnect() {
  const done = diag.step('disconnect', { baseUrl: liveConnection?.base_url ?? null });
  stopHeartbeat?.();
  stopHeartbeat = null;
  // An explicit, remembered disconnect: stated plainly, and searched for nothing
  // until the operator asks again. Rendered FIRST: whatever the cleanup below
  // meets, the surface already says disconnected.
  link = { status: 'disconnected', baseUrl: null, label: null, since: new Date().toISOString(), lastSeenAt: null, note: 'You disconnected. Nothing is attached.' };
  const departingId = liveConnection?.connection_id ?? null;
  liveConnection = null;
  discoveryState = { state: 'idle', daemons: [], baseUrl: null, alive: false, answers: [], known: [] };
  renderLink();
  try {
    stopInspectorRefresh();
    await clearCache(chrome);
    diag.log('cache.cleared', {});
    const { forgetLocalEnvironment } = await import('./lib/storage.mjs');
    if (departingId?.startsWith('local:')) {
      await forgetLocalEnvironment(departingId, chrome).catch(() => {});
    }
    await chrome.storage.local.remove(CONNECTION_KEY);
    streamAbort?.abort();
    stopInspectorEvents();
    done(null, {});
  } catch (error) {
    // The detach stands (rendered above); only the cleanup stumbled.
    done(error);
    renderDiagnostics();
    throw error;
  }
  renderLink();
  // Likewise on the way out: the choice prompt belongs on screen once nothing
  // is attached.
  renderDiscovery();
}

// Asking for a daemon by name is a deliberate choice, not the entry condition.
$('#start-more-toggle')?.addEventListener('click', (event) => {
  const form = el.seedForm;
  const open = form.hidden;
  form.hidden = !open;
  event.currentTarget.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) el.seedInput?.focus();
});

el.pillAction?.addEventListener('click', () => {
  if (isAttached(link)) { guard('Disconnect', disconnect); return; }
  if (discoveryState.daemons?.length) { guard('Connect', () => connect(discoveryState.baseUrl ?? discoveryState.daemons[0].baseUrl)); return; }
  guard('Discovery', () => discover({}));
});
el.pill?.addEventListener('click', () => el.pillAction?.click());
el.connect?.addEventListener('click', (event) => {
  if (event.target?.id === 'start-disconnect') guard('Disconnect', disconnect);
});
el.seedForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = el.seedInput.value.trim();
  if (!value) return;
  const reachable = await reachableOriginFilter(chrome);
  const extra = [];
  for (const origin of seedCandidates(value)) if (await reachable(origin)) extra.push(origin);
  if (!extra.length) { el.seedNote.textContent = 'This device is not permitted to reach that address yet.'; return; }
  el.seedNote.textContent = `Looking for ${value}…`;
  await discover({ extra });
  el.seedNote.textContent = discoveryState.state === 'none' ? `No Focusa daemon answered on ${value}.` : '';
  el.seedInput.value = '';
});

async function loadSelectedConnection() {
  const [paired, local] = await Promise.all([listConnections(), listLocalEnvironments().catch(() => [])]);
  const records = [...local, ...paired];
  const stored = (await chrome.storage.local.get(CONNECTION_KEY))[CONNECTION_KEY];
  const preferred = records.find((r) => (r.connection_id ?? r.environment_id) === stored);
  liveConnection = preferred ?? records[0] ?? null;
  if (liveConnection) {
    el.envLabel.textContent = liveConnection?.label ?? liveConnection?.environment_id ?? '';
    el.unpaired.hidden = true;
    el.private.hidden = false;
    return true;
  }
  el.envLabel.textContent = 'Not connected';
  el.unpaired.hidden = false;
  el.private.hidden = true;
  return false;
}

async function refresh() {
  if (!liveConnection) return;
  const requestOptions = { base_url: liveConnection.base_url, token: liveConnection.token };
  try {
    const [loopBody, fleetBody] = await Promise.all([
      fetchWorkLoop(requestOptions),
      fetchBrowserFleet(requestOptions).catch(() => null),
    ]);
    const loop = projectWorkLoop(loopBody);
    const task = loop?.current_task ?? null;
    setFreshness('ok', 'Fresh');
    el.focusTitle.textContent = task?.title ?? task?.description ?? 'Workstream active';
    el.objective.textContent = task?.detail ?? task?.objective ?? '—';
    el.meta.textContent = [loop?.state, loop?.status, task?.id].filter(Boolean).join(' · ');
    el.stale.hidden = true;

    const working = fleetBody?.data?.bodies ?? [];
    el.working.replaceChildren(...(working.length
      ? working.slice(0, 4).map((b) => row(b.label ?? b.id, b.state ?? null))
      : [emptyRow('No active work reported.')]));

    const needs = notifications.filter((n) => n.severity === 'warning' || n.severity === 'danger');
    el.needs.replaceChildren(...(needs.length
      ? needs.slice(0, 2).map((n) => row(n.title, n.body ?? null))
      : [emptyRow('Nothing needs you right now.')]));
    el.needsCount.textContent = `${needs.length}`;

    renderTelemetry();
    const settled = notifications.filter((n) => n.severity === 'success');
    el.verified.replaceChildren(...(settled.length
      ? settled.slice(0, 3).map((n) => row(n.title, n.timestamp ?? null))
      : [emptyRow('No settled proof yet.')]));
  } catch (error) {
    // docs/17 §4 Unavailable: keep last-known orientation, label source unavailable.
    // docs/17 §4 Unavailable: keep last-known orientation and label it; with no
    // last-known content there is nothing to retain, so the band stays hidden.
    setFreshness('unavailable', 'Runtime unavailable');
    if (el.meta.textContent.trim() && el.meta.textContent.trim() !== '—') {
      el.stale.hidden = false;
      el.stale.firstChild.textContent = 'Last confirmed state may have changed. ';
    }
  }
}

function startStream() {
  if (!liveConnection) return;
  streamAbort?.abort();
  streamAbort = new AbortController();
  runReliableEventStream({
    base_url: liveConnection.base_url,
    token: liveConnection.token,
    initialCursor: liveConnection.last_cursor,
    signal: streamAbort.signal,
    onState: (state) => { if (isAttached(link)) link = { ...link, note: `stream ${state.phase}` }; renderLink(); },
    onEvent: async (event) => {
      const notification = notificationFromEvent(event);
      if (notification) { notifications = await saveNotification(notification); }
      refresh();
    },
    commitCursor: async (cursor) => {
      liveConnection = { ...liveConnection, last_cursor: cursor };
      await chrome.storage.local.set({ [CONNECTION_KEY]: liveConnection.connection_id ?? liveConnection.environment_id });
    },
  }).catch(() => { el.freshness.textContent = 'stream unavailable'; });
}

el.continue.addEventListener('click', () => openWorkforce('#/work/detail'));
el.openNeeds.addEventListener('click', () => openWorkforce('#/needs-you'));
el.openNeeds2.addEventListener('click', () => openWorkforce('#/needs-you'));
el.openWorkforce.addEventListener('click', () => openWorkforce('#/overview'));
// Pairing a remote daemon lives in Settings; the Start Page offers discovery first.
el.pair?.addEventListener('click', () => openWorkforce('#/settings?section=connections'));
el.refresh.addEventListener('click', refresh);
el.inspectorRefresh?.addEventListener('click', () => guard('Inspector refresh', loadInspectorIntoUI));

let inspectorTimer = null;
function stopInspectorRefresh() {
  if (inspectorTimer) { clearInterval(inspectorTimer); inspectorTimer = null; }
}
/** Re-pull the inspector on a loop while attached: connect pulls everything,
 *  the cache holds it, and the loop refreshes it. A failed round never blanks
 *  the screen - the last good data stays with its age shown. */
function startInspectorRefresh() {
  stopInspectorRefresh();
  inspectorTimer = setInterval(() => {
    if (!liveConnection || document.hidden) return;
    guard('Inspector refresh', loadInspectorIntoUI);
  }, 30_000);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && liveConnection) guard('Inspector refresh', loadInspectorIntoUI);
});
let eventsAbort = null;
function stopInspectorEvents() {
  eventsAbort?.abort();
  eventsAbort = null;
  el.inspectorEventsToggle && (el.inspectorEventsToggle.textContent = 'Watch live events');
  el.inspectorEventsState && (el.inspectorEventsState.textContent = '');
}
async function watchInspectorEvents() {
  if (!liveConnection || eventsAbort) { stopInspectorEvents(); return; }
  const done = diag.step('inspector.events', { baseUrl: liveConnection.base_url });
  eventsAbort = new AbortController();
  el.inspectorEventsToggle.textContent = 'Stop watching';
  el.inspectorEventsState.textContent = 'connecting…';
  renderDiagnostics();
  try {
    const response = await fetch(new URL('/v1/events/stream', liveConnection.base_url), {
      headers: { accept: 'text/event-stream' },
      signal: eventsAbort.signal,
    });
    if (!response.ok || !response.body) throw new Error(`stream answered ${response.status}`);
    el.inspectorEventsState.textContent = 'live';
    done(null, {});
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done: finished, value } = await reader.read();
      if (finished) break;
      buffer += decoder.decode(value, { stream: true });
      let index;
      while ((index = buffer.indexOf('\n\n')) >= 0) {
        const chunk = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        const data = chunk.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
        if (!data || data === '[DONE]') continue;
        let label = data.slice(0, 160);
        try {
          const parsed = JSON.parse(data);
          label = parsed.type ?? parsed.event ?? parsed.event_type ?? label.slice(0, 160);
        } catch { /* keep raw text */ }
        const li = document.createElement('li');
        li.append(Object.assign(document.createElement('strong'), { textContent: new Date().toISOString().slice(11, 19) }));
        li.append(Object.assign(document.createElement('span'), { textContent: ` ${label}` }));
        el.inspectorEvents.prepend(li);
        while (el.inspectorEvents.children.length > 30) el.inspectorEvents.lastChild.remove();
      }
    }
    el.inspectorEventsState.textContent = 'ended';
  } catch (error) {
    if (error?.name !== 'AbortError') {
      el.inspectorEventsState.textContent = 'unavailable';
      done(error);
    }
  }
  renderDiagnostics();
}
el.inspectorEventsToggle?.addEventListener('click', () => guard('Live events', watchInspectorEvents));
if (el.diagCopy && !el.diagCopy.dataset.wired) {
  el.diagCopy.dataset.wired = '1';
  el.diagCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(await diag.exportJson());
      el.diagCopy.textContent = 'Copied';
      setTimeout(() => { el.diagCopy.textContent = 'Copy diagnostics'; }, 1500);
    } catch {
      el.diagCopy.textContent = 'Copy failed';
    }
  });
  el.diagClear?.addEventListener('click', async () => { await diag.clear(); renderDiagnostics(); });
}

/**
 * Fill the Daemon inspector for the attached daemon. Scope comes from the
 * owner's own project/list (+ continuity when trajectory reports one), so
 * scoped reads carry what the daemon asks for instead of guessing.
 */
async function loadInspectorIntoUI() {
  if (!liveConnection || !el.inspector) return;
  const done = diag.step('inspector.load', { baseUrl: liveConnection.base_url });
  const client = createWorkforceClient({ baseUrl: liveConnection.base_url, token: liveConnection.token ?? null });
  el.inspector.hidden = false;
  el.inspectorNote.hidden = false;
  el.inspectorNote.textContent = 'Reading the daemon…';
  try {
    const projects = await client.projectList();
    const projectListBody = projects?.data ?? null;
    const scope = resolveScope(projectListBody);
    if (!scope.projectRoot) {
      el.inspectorNote.textContent = 'The daemon reports no project to inspect yet.';
      el.inspectorScope.textContent = '';
      el.inspectorSections.replaceChildren();
      done(null, { empty: true });
      return;
    }
    let ws = { projectRoot: scope.projectRoot };
    const trajectoryProbe = await client.trajectory(ws).catch(() => null);
    const continuityId = continuityFromTrajectory(trajectoryProbe?.data ?? null);
    if (continuityId) ws = { ...ws, continuityId };
    el.inspectorScope.textContent = ws.continuityId
      ? `${ws.projectRoot} · ${ws.continuityId}`
      : ws.projectRoot;
    const { sections, operationsTotal } = await loadInspector(client, ws, { projectListBody });
    el.inspectorNote.textContent = operationsTotal != null
      ? `The daemon offers ${operationsTotal} governed operations. Everything below is read-only.`
      : 'Everything below is read-only.';
    el.inspectorSections.replaceChildren(...sections.map(renderInspectorSection));
    await writeCache(chrome, liveConnection.base_url, {
      scope: ws, sections, operationsTotal, projectListBody,
    });
    diag.log('inspector.cached', { sections: sections.length });
    done(null, { sections: sections.length, operationsTotal });
  } catch (error) {
    el.inspectorNote.textContent = `Inspector failed: ${String(error?.message ?? error).slice(0, 160)}`;
    done(error);
  }
  renderDiagnostics();
}

/** One inspector section: a heading with its count, then owner rows. */
function renderInspectorSection(section) {
  const wrap = document.createElement('section');
  wrap.className = 'sp-inspector-section';
  const head = document.createElement('h3');
  head.className = 'sp-label';
  head.textContent = section.count != null ? `${section.title} (${section.count})` : section.title;
  wrap.append(head);
  if (section.note && section.state !== 'ok') {
    const note = document.createElement('p');
    note.className = 'sp-hero-meta';
    note.textContent = section.note;
    wrap.append(note);
  }
  if (section.rows?.length) {
    const list = document.createElement('ul');
    list.className = 'sp-list';
    const filter = section.rows.length > 12 ? document.createElement('input') : null;
    const draw = (query) => {
      list.replaceChildren(...section.rows
        .filter((row) => !query
          || `${row.primary ?? ''} ${row.secondary ?? ''} ${row.meta ?? ''}`.toLowerCase().includes(query))
        .slice(0, 60)
        .map((row) => {
          const li = document.createElement('li');
          li.append(Object.assign(document.createElement('strong'), { textContent: String(row.primary ?? '—') }));
          if (row.secondary) li.append(Object.assign(document.createElement('span'), { className: 'sp-row-meta', textContent: String(row.secondary).slice(0, 220) }));
          if (row.meta) li.append(Object.assign(document.createElement('span'), { className: 'sp-row-meta', textContent: String(row.meta).slice(0, 160) }));
          return li;
        }));
    };
    if (filter) {
      filter.type = 'search';
      filter.placeholder = `Filter ${section.title.toLowerCase()}…`;
      filter.setAttribute('aria-label', `Filter ${section.title}`);
      filter.addEventListener('input', () => draw(filter.value.trim().toLowerCase()));
      wrap.append(filter);
    }
    draw('');
    wrap.append(list);
  }
  return wrap;
}
window.addEventListener('pagehide', () => { streamAbort?.abort(); stopInspectorEvents(); stopInspectorRefresh(); });

// docs/17 §5: public mode loads a dedicated module that cannot read private
// storage or private projections. The private path is never executed.
if (new URL(window.location.href).searchParams.get('public-work') === '1') {
  await import('./startpage-public.mjs');
} else {
  notifications = await listNotifications().catch(() => []);
  // Discovery runs first so the face is alive immediately, then any stored
  // connection is adopted.
  renderLink();
  if (el.buildStamp) el.buildStamp.textContent = `build ${BUILD.sha}${BUILD.committedAt ? ` · ${BUILD.committedAt.slice(0, 10)}` : ''}`;
  // A returning tab goes straight to the workforce interface; discovery is for
  // first run (operator requirement 2026-09-27: auto-load after initial connect).
  // Discovery is always run: what is out there must be visible without a click,
  // whether or not a daemon is already attached.
  const discoveryRun = guard('Discovery', () => discover({}));
  const connected = await loadSelectedConnection();
  await discoveryRun;
  if (connected) {
    link = { status: 'connected', baseUrl: liveConnection.base_url, label: liveConnection.label, since: new Date().toISOString(), lastSeenAt: new Date().toISOString(), note: null };
    renderLink();
    // Render the cache first: instant, and proof the connection is real. Then
    // replace it with live reads as they land.
    await hydrateFromCache();
    await refresh();
    await loadInspectorIntoUI();
    startInspectorRefresh();
    startStream();
    if (liveConnection?.base_url) loadPreview(liveConnection.base_url);
    stopHeartbeat?.();
    stopHeartbeat = watchLiveness(liveConnection.base_url, (beat) => {
      link = applyBeat(link, beat);
      renderLink();
      if (beat.ok) loadPreview(liveConnection.base_url);
    });
  }
}

/** Paint the last good inspector snapshot instantly, labelled with its age. */
async function hydrateFromCache() {
  if (!liveConnection) return;
  const done = diag.step('inspector.hydrate', { baseUrl: liveConnection.base_url });
  const entry = await readCache(chrome, liveConnection.base_url);
  if (!entry || !isUsable(entry)) {
    done(null, { hit: false });
    renderDiagnostics();
    return;
  }
  const { sections, operationsTotal, scope } = entry.data ?? {};
  if (!Array.isArray(sections)) {
    done(null, { hit: false, reason: 'unparseable' });
    renderDiagnostics();
    return;
  }
  el.inspector.hidden = false;
  el.inspectorNote.hidden = false;
  el.inspectorNote.textContent = `Last updated ${ageLabel(entry)} — refreshing…`;
  el.inspectorScope.textContent = scope?.projectRoot ?? '';
  el.inspectorSections.replaceChildren(...sections.map(renderInspectorSection));
  done(null, { hit: true, ageMs: ageMs(entry), sections: sections.length });
  renderDiagnostics();
}
