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

const $ = (selector) => {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`required start page element missing: ${selector}`);
  return node;
};

const el = {
  envLabel: $('#daemon-select-label'),
  freshness: $('#start-freshness'),
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

function setFreshness(state, text) {
  el.freshness.textContent = text;
  el.freshness.className = state;
}

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
    onState: (state) => { el.freshness.textContent = `live ${state.phase}`; },
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
  const connected = await loadSelectedConnection();
  if (connected) {
    await refresh();
    startStream();
  }
}
