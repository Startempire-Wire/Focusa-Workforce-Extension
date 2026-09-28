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
  discoverDaemons, previewDaemon, rememberDaemon, reachableOriginFilter, seedCandidates, watchLiveness,
} from './lib/discovery.mjs';
import { hasDaemonOriginPermission, requestDaemonOriginPermission, normalizeDaemonOrigin } from './lib/validation.mjs';
import { saveLocalEnvironment } from './lib/storage.mjs';
import { BUILD } from './lib/build-info.mjs';
import { initialConnection, describeConnection, applyBeat, isAttached } from './lib/connection.mjs';

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
  pair: $('#pair-focusa'),
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
  publicDate: $('#public-date'),
  publicMission: $('#public-mission'),
  publicWorkforce: $('#public-workforce'),
  publicCurrent: $('#public-current'),
  publicProof: $('#public-proof'),
  publicFailure: $('#public-failure'),
};

const CONNECTION_KEY = 'focusa_startpage_connection.v1';

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
  renderLink();
}

/* ── the living connection surface ──────────────────────────────────────────
   The Start Page is the calmest face, but it is not inert: it discovers
   automatically, previews each daemon with that daemon's own reported
   liveness, and keeps a heartbeat running so freshness is a live fact. */
let discoveryState = { state: 'discovering', daemons: [], baseUrl: null, alive: false, answers: [], known: [] };
let link = initialConnection();

/** The one place the Start Page's connection state is turned into words. */
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
  el.private.hidden = !isAttached(link) || discoveryState.state === 'found';
  el.unpaired.hidden = isAttached(link) || link?.status === 'disconnected';
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
  { label: 'This device', hosts: ['100.115.92.26', '100.127.113.90'] },
  { label: 'Tailnet', hosts: null },
];
const isTailnet = (host) => {
  const parts = String(host).split('.');
  return /^[\d.]+$/.test(host) && parts[0] === '100' && Number(parts[1]) >= 64 && Number(parts[1]) <= 127;
};

function renderDiscovery() {
  if (!el.connect) return;
  el.unpaired.hidden = false;
  el.private.hidden = true;
  if (discoveryState.state === 'found') {
    el.unpairedHeading && (el.unpairedHeading.textContent = 'Your workforce is here');
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
  discoveryState = { state: 'discovering', daemons: [], baseUrl: null, alive: false, answers: [] };
  previews = {};
  renderDiscovery();
  const { found, answers } = await discoverDaemons(chrome, {
    extra,
    onAnswer: (answer) => { discoveryState.answers = [...discoveryState.answers, answer]; renderDiscovery(); },
  });
  if (!found.length) {
    const remembered = await readKnownDaemons();
    discoveryState = { state: 'none', daemons: [], answers, known: remembered };
    if (!isAttached(link)) {
      link = { ...link, status: 'disconnected', baseUrl: null, note: 'No Focusa daemon answered' };
    }
    renderLink();
    renderDiscovery();
    return;
  }
  discoveryState = { state: 'found', daemons: found, baseUrl: found[0].baseUrl, alive: true, answers };
  if (!isAttached(link)) {
    link = { ...link, status: 'disconnected', baseUrl: null, note: `${found.length} daemon(s) available` };
  }
  renderLink();
  renderDiscovery();
  for (const daemon of found) loadPreview(daemon.baseUrl);
}

async function connect(baseUrl) {
  const origin = normalizeDaemonOrigin(baseUrl);
  link = { ...link, status: 'connecting', baseUrl: origin, note: 'Connecting…' };
  renderLink();
  const already = await hasDaemonOriginPermission(origin).catch(() => false);
  if (!already) {
    const granted = await requestDaemonOriginPermission(origin, chrome).catch(() => false);
    if (!granted) return;
  }
  await saveLocalEnvironment({
    schema: 'focusa.workforce_local_environment.v1',
    environment_id: `local:${origin}`,
    label: `Focusa daemon (${origin})`,
    base_url: origin,
    created_at: new Date().toISOString(),
  }, chrome);
  await rememberDaemon(chrome, { baseUrl: origin, label: 'Focusa daemon' });
  liveConnection = { connection_id: `local:${origin}`, label: `Focusa daemon (${origin})`, base_url: origin, token: null };
  await chrome.storage.local.set({ [CONNECTION_KEY]: liveConnection.connection_id });
  link = { status: 'connected', baseUrl: origin, label: liveConnection.label, since: new Date().toISOString(), lastSeenAt: new Date().toISOString(), note: null };
  el.connect.hidden = true;
  renderLink();
  await refresh();
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
  stopHeartbeat?.();
  stopHeartbeat = null;
  // An explicit, remembered disconnect: stated plainly, and searched for nothing
  // until the operator asks again.
  link = { status: 'disconnected', baseUrl: null, label: null, since: new Date().toISOString(), lastSeenAt: null, note: 'You disconnected. Nothing is attached.' };
  const { forgetLocalEnvironment } = await import('./lib/storage.mjs');
  if (liveConnection?.connection_id?.startsWith('local:')) {
    await forgetLocalEnvironment(liveConnection.connection_id, chrome).catch(() => {});
  }
  await chrome.storage.local.remove(CONNECTION_KEY);
  streamAbort?.abort();
  liveConnection = null;
  discoveryState = { state: 'idle', daemons: [], baseUrl: null, alive: false, answers: [], known: [] };
  renderLink();
}

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
el.pair.addEventListener('click', () => openWorkforce('#/settings?section=connections'));
el.refresh.addEventListener('click', refresh);
window.addEventListener('pagehide', () => streamAbort?.abort());

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
  const connected = await loadSelectedConnection();
  if (!connected) await guard('Discovery', () => discover({}));
  if (connected) {
    link = { status: 'connected', baseUrl: liveConnection.base_url, label: liveConnection.label, since: new Date().toISOString(), lastSeenAt: new Date().toISOString(), note: null };
    renderLink();
    await refresh();
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
