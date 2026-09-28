/**
 * Side Panel (docs/17 §3) — collaborate with the current Workstream now.
 *
 * The panel is a projection surface only: every value it shows is read from the
 * owning daemon, and every mutation goes through the same governed paths the
 * full page uses. Nothing here invents scope, freshness or proof.
 */
import { captureActiveTab, createOrientationPacket, renderOrientationMission } from './lib/orientation.mjs';
import { startPairing, pollPairing } from './lib/pairing.mjs';
import { listConnections, listLocalEnvironments, saveLocalEnvironment, forgetLocalEnvironment } from './lib/storage.mjs';
import {
  createWorkforceClient, rosterFromOwner, projectsFromOwner, eventsFromOwner,
} from './lib/workforce-client.mjs';
import { runReliableEventStream } from './lib/reconnect.mjs';
import { buildSafeSessionConfig, createPreflightedSession, preflightSafeSession } from './lib/session-create.mjs';
import { orchestrateAction } from './lib/orchestration.mjs';
import { listNotifications, markNotificationsRead, notificationFromEvent, saveNotification, unreadNotificationCount } from './lib/notifications.mjs';
import { auditRecordFromEvent, clearAuditRecords, listAuditRecords, saveAuditRecord } from './lib/audit-log.mjs';
import {
  discoverDaemons, previewDaemon, rememberDaemon, reachableOriginFilter, seedCandidates, watchLiveness,
} from './lib/discovery.mjs';
import { hasDaemonOriginPermission, requestDaemonOriginPermission } from './lib/validation.mjs';
import { BUILD } from './lib/build-info.mjs';
import { initialConnection, describeConnection, applyBeat, isAttached } from './lib/connection.mjs';

const $ = (selector) => {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`required panel element missing: ${selector}`);
  return node;
};

const el = {
  status: $('#connection-status'),
  select: $('#connection-select'),
  pairSection: $('#pair-section'),
  pairForm: $('#pair-form'),
  pairResult: $('#pair-result'),
  pairCode: $('#pair-code'),
  pairCheck: $('#pair-check'),
  projectRoot: $('#project-root'),
  continuityId: $('#continuity-id'),
  objective: $('#objective'),
  form: $('#orientation-form'),
  capture: $('#capture-tab'),
  observation: $('#observation-summary'),
  mission: $('#mission-preview'),
  frontier: $('#foreman-frontier'),
  workItem: $('#work-item-ref'),
  preflight: $('#preflight'),
  create: $('#create-draft'),
  start: $('#start-session'),
  refresh: $('#refresh-roster'),
  loop: $('#loop-summary'),
  needs: $('#roster'),
  working: $('#sp-working-list'),
  verified: $('#notifications'),
  stream: $('#stream-status'),
  audit: $('#audit'),
  auditCount: $('#audit-count'),
  auditFilter: $('#audit-filter'),
  connectBody: $('#connect-body'),
  buildStamp: $('#build-stamp'),
  surfaceError: $('#surface-error'),
  pill: $('#connection-pill'),
  pillLabel: $('#conn-label'),
  pillWhere: $('#conn-where'),
  seed: $('#pair-base-url'),
  auditState: $('#audit-state'),
  clearAudit: $('#clear-audit'),
  notifCount: $('#notification-count'),
  markRead: $('#mark-notifications-read'),
  openWorkforce: $('#open-workforce'),
  watchUiai: $('#watch-uiai'),
};

let connection = null;
let pairing = null;
let observation = null;
let packet = null;
let preflight = null;
let draft = null;
let streamAbort = null;
const exactTargets = new Map();
let auditRecords = [];
let notifications = [];

function setStatus(node, state, note = '') {
  node.className = `status ${state}`;
  node.textContent = note || state;
}

/**
 * Run an interaction and show any failure IN the surface. A rejected handler
 * must never be console-only: the operator has to see that the thing they
 * pressed did not happen, in the place they pressed it.
 */
async function guard(label, work) {
  try {
    await work();
  } catch (error) {
    showSurfaceError(`${label} failed: ${safeError(error)}`);
  }
}

function showSurfaceError(message) {
  el.surfaceError.textContent = message;
  el.surfaceError.hidden = false;
}

function clearSurfaceError() {
  el.surfaceError.hidden = true;
  el.surfaceError.textContent = '';
}

// Nothing in this surface fails silently, including failures nobody expected.
window.addEventListener('unhandledrejection', (event) => {
  showSurfaceError(`Something did not finish: ${safeError(event.reason)}`);
});

function safeError(error) {
  return String(error?.kind || error?.failure_class || error?.message || 'unknown failure').slice(0, 180);
}

function randomKey(prefix) { return `${prefix}:${crypto.randomUUID()}`; }

/**
 * Shared request options. The runtime libs take `baseUrl`; this panel was
 * passing `base_url`, so every owner read and every governed mutation failed
 * with "daemon URL is required" the moment a connection existed.
 */
function requestOptions() {
  if (!connection) throw new Error('paired connection required');
  return { baseUrl: connection.base_url, token: connection.token ?? null };
}

const INTENT_KEY = 'focusa.workforce.intents.v1';
const intentStore = {
  async load(key) { return (await chrome.storage.local.get(INTENT_KEY))[INTENT_KEY]?.[key] ?? null; },
  async persist(record) {
    const current = (await chrome.storage.local.get(INTENT_KEY))[INTENT_KEY] ?? {};
    await chrome.storage.local.set({ [INTENT_KEY]: { ...current, [record.idempotency_key]: record } });
  },
};

/* ── renderers (docs/17 §3 caps: Needs You 3 · Working Now 5 · Verified 3) ── */
function renderNeedsYou(roster) {
  const active = roster.filter((m) => /needs|attention|blocked|waiting/i.test(`${m.state ?? ''}`));
  const rows = (active.length ? active : roster).slice(0, 3);
  el.needs.replaceChildren();
  if (!rows.length) {
    el.needs.append(Object.assign(document.createElement('li'), { className: 'sp-empty', textContent: 'Nothing needs you right now.' }));
    return;
  }
  for (const row of rows) {
    const li = document.createElement('li');
    li.append(Object.assign(document.createElement('strong'), { textContent: row.label }));
    if (row.role) li.append(Object.assign(document.createElement('span'), { className: 'sp-meta', textContent: row.role }));
    li.append(Object.assign(document.createElement('span'), { className: 'sp-meta', textContent: row.state ?? 'unknown' }));
    el.needs.append(li);
  }
}

function renderWorkingNow(roster) {
  const rows = roster.filter((m) => /working|active|running/i.test(String(m.state ?? ''))).slice(0, 5);
  el.working.replaceChildren();
  if (!rows.length) {
    el.working.append(Object.assign(document.createElement('li'), { className: 'sp-empty', textContent: 'No active work reported.' }));
    return;
  }
  for (const row of rows) {
    const li = document.createElement('li');
    li.append(Object.assign(document.createElement('strong'), { textContent: row.label }));
    li.append(Object.assign(document.createElement('span'), { className: 'sp-meta', textContent: row.state ?? 'unknown' }));
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'btn btn-quiet';
    control.textContent = 'control';
    control.addEventListener('click', () => controlSession('start', { exact_target: exactTargets.get(row.id) ?? null, label: row.label }));
    li.append(control);
    el.working.append(li);
  }
}

function renderVerified() {
  el.verified.replaceChildren();
  const rows = notifications.filter((n) => n.severity === 'success').slice(0, 3);
  if (!rows.length) {
    el.verified.append(Object.assign(document.createElement('li'), { className: 'sp-empty', textContent: 'No settled proof yet.' }));
    return;
  }
  for (const row of rows) {
    const li = document.createElement('li');
    li.append(Object.assign(document.createElement('strong'), { textContent: row.title }));
    el.verified.append(li);
  }
  el.notifCount.textContent = `${unreadNotificationCount(notifications)}`;
}

function renderAudit() {
  const filter = el.auditFilter.value.trim().toLowerCase();
  const rows = auditRecords
    .filter((item) => !filter || [item.event_type, item.cursor, item.source].some((v) => String(v ?? '').toLowerCase().includes(filter)))
    .slice(0, 50);
  el.audit.replaceChildren();
  if (!rows.length) {
    el.audit.append(Object.assign(document.createElement('li'), { className: 'sp-empty', textContent: filter ? 'No matching audit events.' : 'No durable events rendered yet.' }));
  }
  for (const row of rows) {
    const li = document.createElement('li');
    li.append(Object.assign(document.createElement('strong'), { textContent: row.event_type }));
    li.append(Object.assign(document.createElement('span'), { className: 'sp-meta', textContent: `${row.timestamp} · ${row.source}` }));
    el.audit.append(li);
  }
  el.auditCount.textContent = `${rows.length}/${auditRecords.length} events`;
}

/* ── owner reads ──────────────────────────────────────────────────────────
   The panel reads through the SAME client the full page uses, so a local
   daemon is read with its tokenless local-loopback principal exactly as the
   full page reads it. The legacy paired-only client required a token and
   therefore never worked here at all. */
function ownerClient() {
  return createWorkforceClient({ baseUrl: connection.base_url, token: connection.token ?? null });
}

async function refreshObservation() {
  if (!connection) return;
  try {
    const client = ownerClient();
    const health = await client.health();
    const projects = await client.projectList();
    const projectRoot = el.projectRoot.value.trim() || projects?.data?.effective_project?.project_root || '';
    const continuityId = el.continuityId.value.trim() || projects?.data?.effective_project?.continuity_id || '';
    const scope = projectRoot ? { projectRoot, continuityId: continuityId || undefined } : {};

    if (health.state === 'ok') setStatus(el.status, 'paired', `${connection.label} · healthy`);
    else setStatus(el.status, 'degraded', `${connection.label} · ${health.state}`);

    // A daemon with no project chosen is a real, common state: say so plainly
    // instead of showing an empty workforce.
    if (projectRoot) {
      const [loop, sessions] = await Promise.all([
        client.workLoopStatus(scope).catch(() => null),
        client.sessions(projectRoot).catch(() => null),
      ]);
      const loopData = loop?.state === 'ok' ? loop.data : null;
      el.loop.textContent = loopData
        ? `${loopData.state ?? '—'} · ${loopData.status ?? '—'}`
        : (loop?.note ?? '—');
      el.frontier.textContent = loopData?.current_task?.title ?? loopData?.current_task?.id ?? '— no frontier reported';
      const roster = sessions?.state === 'ok' ? rosterFromOwner(sessions.data) : [];
      renderNeedsYou(roster);
      renderWorkingNow(roster);
    } else {
      el.loop.textContent = 'no project chosen';
      el.frontier.textContent = 'Choose a project to scope this panel.';
      renderNeedsYou([]);
      renderWorkingNow([]);
    }
    renderVerified();
    startStream();
  } catch (error) {
    setStatus(el.status, 'degraded', safeError(error));
  }
}

function startStream() {
  streamAbort?.abort();
  streamAbort = new AbortController();
  runReliableEventStream({
    ...requestOptions(),
    token: connection?.token ?? null,
    initialCursor: connection.last_cursor,
    signal: streamAbort.signal,
    onState: (state) => { el.stream.textContent = `stream ${state.phase}${state.delay_ms ? ` ${state.delay_ms / 1000}s` : ''}`; },
    onEvent: async (event) => {
      const record = auditRecordFromEvent(event, connection?.label ?? 'Focusa daemon');
      if (record) auditRecords = await saveAuditRecord(record);
      renderAudit();
      const notification = notificationFromEvent(event);
      if (notification) { notifications = await saveNotification(notification); renderVerified(); }
    },
    commitCursor: async (cursor) => {
      connection = { ...connection, last_cursor: cursor, last_connected_at: new Date().toISOString() };
    },
  }).catch((error) => {
    if (error?.name !== 'AbortError') el.stream.textContent = safeError(error);
  });
}

/* ── governed mutations ── */
async function controlSession(action, target) {
  if (!target?.exact_target) { el.preflight.hidden = false; el.preflight.textContent = 'No exact owner target — bind one on the full Workforce page first.'; return; }
  try {
    el.preflight.hidden = false;
    el.preflight.textContent = `${action} pending canonical refresh…`;
    await orchestrateAction({
      action, target: target.exact_target, idempotency_key: randomKey(action),
      idempotencyStore: intentStore, requestOptions: requestOptions(),
    });
    await refreshObservation();
    el.preflight.textContent = `${action} accepted by the owner`;
  } catch (error) {
    el.preflight.textContent = `${action} rejected: ${safeError(error)}`;
  }
}

/* ── the panel's living connection surface ──
   The same discovery the full page uses: automatic, silent, and honest. Each
   daemon previews its own liveness and inventory before anything is attached,
   and the numbers keep moving once a heartbeat is running. */
let discoveryState = { state: 'discovering', daemons: [], baseUrl: null, alive: false };
let link = initialConnection();

/** The panel says the same thing as every other surface, from the same state. */
function renderLink() {
  const view = describeConnection(link);
  el.pill.dataset.tone = view.tone;
  el.pillLabel.textContent = view.label;
  el.pillWhere.textContent = link?.baseUrl ? ` ${link.baseUrl}` : '';
  el.pill.setAttribute('title', view.detail);
}
let previews = {};
let stopHeartbeat = null;

const PLACES = [
  { label: 'This browser', hosts: ['127.0.0.1', 'localhost', '[::1]'] },
  // whatever the machine itself reported, at runtime
  { label: 'This device', hosts: [] },
  { label: 'Tailnet', hosts: null },
];

function isTailnetHost(host) {
  if (typeof host === 'string' && host.toLowerCase().endsWith('.ts.net')) return true;
  const parts = String(host).split('.');
  return /^[\d.]+$/.test(host) && parts[0] === '100' && Number(parts[1]) >= 64 && Number(parts[1]) <= 127;
}

function placeRows() {
  const answered = new Set((discoveryState.answers ?? []).filter((a) => a.ok).map((a) => new URL(a.baseUrl).hostname));
  return PLACES.map((place) => ({
    label: place.label,
    ok: place.hosts
      ? place.hosts.some((host) => answered.has(host))
      : [...answered].some(isTailnetHost),
  }));
}

function node(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/**
 * What an operator is actually choosing between: which daemon, how long it has
 * been up, and what work it holds. Persistence counters are diagnostics and stay
 * out of the headline - leading with "1857 writes" means nothing to a person.
 */
function previewNodes(daemon) {
  const preview = daemon?.preview ?? previews[daemon?.baseUrl];
  if (!preview) return [node('p', 'sp-preview pending', 'reading what this daemon holds…')];
  const facts = node('p', 'sp-preview');
  const add = (value, label) => {
    const span = node('span');
    span.append(node('b', null, String(value)), document.createTextNode(` ${label}`));
    facts.append(span);
  };
  if (preview.version) add(preview.version, 'version');
  if (preview.uptimeMs != null) add(`${Math.max(1, Math.round(preview.uptimeMs / 60000))}m`, 'up');
  const nodes = [facts];
  if (preview.projects?.length) {
    nodes.push(node('p', 'sp-names', preview.projects.join(' · ')));
  } else if (preview.projectSelectionRequired) {
    nodes.push(node('p', 'sp-names', 'No project chosen yet — pick one to scope this workforce.'));
  }
  if ((preview.failures ?? 0) > 0) nodes.push(node('p', 'sp-names warn', `${preview.failures} write failure(s) reported`));
  if ((daemon?.addresses?.length ?? 0) > 1) {
    nodes.push(node('p', 'sp-names', `Reachable at ${daemon.addresses.length} addresses`));
  }
  return nodes;
}

function renderConnection() {
  // Once a daemon is attached, the panel shows the workforce interface. The
  // connection surface belongs to first run and to Disconnect - it must never
  // take the surface back from a working panel (operator requirement 2026-09-27).
  el.pairSection.hidden = Boolean(connection);
  const body = el.connectBody;
  body.replaceChildren();
  if (connection && discoveryState.state !== 'connected') {
    discoveryState = { ...discoveryState, state: 'connected', baseUrl: connection.base_url, alive: true };
  }

  if (discoveryState.state === 'connected') {
    const live = node('p', 'sp-live');
    live.append(node('span', `sp-beat${discoveryState.alive ? ' live' : ''}`), node('strong', null, 'Focusa is live'));
    body.append(live, node('code', 'sp-origin', discoveryState.baseUrl));
    const preview = previews[discoveryState.baseUrl];
    if (preview) {
      const line = node('p', 'sp-telemetry');
      const b = (v) => node('b', null, String(v));
      if (preview.version) line.append(b(preview.version), document.createTextNode(' · '));
      if (preview.uptimeMs != null) line.append(b(`${Math.max(1, Math.round(preview.uptimeMs / 60000))}m`), document.createTextNode(' up · '));
      line.append(preview.projects?.length ? preview.projects.join(' · ') : 'no project chosen yet');
      body.append(line);
    }
    const disconnect = node('button', 'btn btn-quiet', 'Disconnect');
    disconnect.type = 'button';
    disconnect.addEventListener('click', () => guard('Disconnect', disconnectFromDaemon));
    body.append(disconnect);
    return;
  }

  if (discoveryState.state === 'found') {
    const head = node('p', 'sp-live');
    head.append(node('span', 'sp-beat live'), node('strong', null, `${discoveryState.daemons.length} Focusa daemon${discoveryState.daemons.length > 1 ? 's' : ''}`));
    const list = node('ul', 'sp-daemons');
    for (const daemon of discoveryState.daemons) {
      const item = node('li', `sp-daemon${daemon.baseUrl === discoveryState.baseUrl ? ' lead' : ''}`);
      const head2 = node('div', 'sp-dhead');
      head2.append(node('span', 'sp-kind', daemon.kindLabel), node('code', null, daemon.baseUrl));
      const button = node('button', `btn${daemon.baseUrl === discoveryState.baseUrl ? ' btn-primary' : ''}`, 'Connect');
      button.type = 'button';
      button.addEventListener('click', () => guard('Connect', () => connectDaemon(daemon.baseUrl)));
      item.append(head2, ...previewNodes(daemon), button);
      list.append(item);
    }
    body.append(head, list);
    return;
  }

  if (discoveryState.state === 'discovering') {
    const head = node('p', 'sp-live');
    head.append(node('span', 'sp-pulse'), node('strong', null, 'Looking for Focusa'));
    const places = node('ul', 'sp-places');
    for (const place of placeRows()) {
      const item = node('li', place.ok ? 'ok' : null);
      item.append(node('span', 'dot'), document.createTextNode(place.label), node('em', null, place.ok ? 'found' : 'checking'));
      places.append(item);
    }
    body.append(head, places);
    return;
  }

  body.append(
    node('p', 'sp-live', 'No Focusa daemon answered'),
    node('p', 'sp-meta', 'loopback, this device\'s bridges and the tailnet were checked. Name one above to look again.'),
  );
  const again = node('button', 'btn', 'Look again');
  again.type = 'button';
  again.addEventListener('click', () => guard('Look again', () => discover({})));
  body.append(again);
}

function loadPreview(baseUrl) {
  return previewDaemon({ baseUrl })
    .then((preview) => { previews = { ...previews, [baseUrl]: preview }; renderConnection(); })
    .catch(() => {});
}

async function discover({ extra = [] } = {}) {
  discoveryState = { state: 'discovering', daemons: [], baseUrl: null, alive: false, answers: [] };
  previews = {};
  renderConnection();
  const { found, answers } = await discoverDaemons(chrome, {
    extra,
    onAnswer: (answer) => { discoveryState.answers = [...discoveryState.answers, answer]; renderConnection(); },
  });
  if (!found.length) { discoveryState = { state: 'none', daemons: [], answers }; renderConnection(); return; }
  discoveryState = { state: 'found', daemons: found, baseUrl: found[0].baseUrl, alive: true, answers };
  renderConnection();
  for (const daemon of found) loadPreview(daemon.baseUrl);
}

async function connectDaemon(baseUrl) {
  const already = await hasDaemonOriginPermission(baseUrl).catch(() => false);
  if (!already) {
    const granted = await requestDaemonOriginPermission(baseUrl, chrome).catch(() => false);
    if (!granted) return;
  }
  connection = { ...connection, status: 'connecting', baseUrl, note: 'Connecting…' };
  renderConnection();
  await saveLocalEnvironment({
    schema: 'focusa.workforce_local_environment.v1',
    environment_id: `local:${baseUrl}`,
    label: `Focusa daemon (${baseUrl})`,
    base_url: baseUrl,
    created_at: new Date().toISOString(),
  }, chrome);
  await rememberDaemon(chrome, { baseUrl, label: 'Focusa daemon' });
  await loadConnectionOptions(`local:${baseUrl}`);
  discoveryState = { ...discoveryState, state: 'connected', baseUrl, alive: true };
  link = { status: 'connected', baseUrl, label: connection?.label ?? null, since: new Date().toISOString(), lastSeenAt: new Date().toISOString(), note: null };
  renderLink();
  stopHeartbeat?.();
  stopHeartbeat = watchLiveness(baseUrl, (beat) => {
    discoveryState = { ...discoveryState, alive: beat.ok };
    link = applyBeat(link, beat);
    renderLink();
    if (beat.ok) loadPreview(baseUrl);
  });
  renderConnection();
}

async function disconnectFromDaemon() {
  stopHeartbeat?.();
  stopHeartbeat = null;
  link = { status: 'disconnected', baseUrl: null, label: null, since: new Date().toISOString(), lastSeenAt: null, note: 'You disconnected. Nothing is attached.' };
  renderLink();
  if (connection) await forgetLocalEnvironment(connection.connection_id ?? connection.environment_id, chrome).catch(() => {});
  streamAbort?.abort();
  connection = null;
  discoveryState = { state: 'idle', daemons: [], baseUrl: null, alive: false, answers: [] };
  await loadConnectionOptions();
  renderConnection();
}

el.pairForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = el.seed.value.trim();
  if (!value) return;
  const reachable = await reachableOriginFilter(chrome);
  const extra = [];
  for (const origin of seedCandidates(value)) if (await reachable(origin)) extra.push(origin);
  if (!extra.length) { el.pairResult.textContent = 'This device is not permitted to reach that address yet.'; return; }
  el.pairResult.textContent = `Looking for ${value}…`;
  await discover({ extra });
  el.pairResult.textContent = discoveryState.state === 'none' ? `No Focusa daemon answered on ${value}.` : '';
  el.seed.value = '';
});

/* ── connection lifecycle ── */
async function loadConnectionOptions(preferred = null) {
  const [paired, local] = await Promise.all([listConnections(), listLocalEnvironments().catch(() => [])]);
  const records = [...local, ...paired];
  el.select.replaceChildren(new Option('Choose a paired daemon', ''));
  for (const record of records) el.select.append(new Option(record.label ?? record.environment_id, record.connection_id ?? record.environment_id));
  const selected = preferred ?? records[0]?.connection_id ?? records[0]?.environment_id ?? '';
  el.select.value = selected;
  connection = records.find((item) => (item.connection_id ?? item.environment_id) === selected) ?? null;
  el.pairSection.hidden = Boolean(connection);
  setStatus(el.status, connection ? 'paired' : 'unconfigured', connection ? connection.label : 'Not connected');
  if (connection) await refreshObservation();
}

el.select.addEventListener('change', async () => {
  streamAbort?.abort();
  const [paired, local] = await Promise.all([listConnections(), listLocalEnvironments().catch(() => [])]);
  const records = [...local, ...paired];
  connection = records.find((item) => (item.connection_id ?? item.environment_id) === el.select.value) ?? null;
  el.pairSection.hidden = Boolean(connection);
  setStatus(el.status, connection ? 'paired' : 'unconfigured', connection?.label ?? 'Not connected');
  if (connection) await refreshObservation();
});

el.pairForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(el.pairForm);
  try {
    pairing = await startPairing({ base_url: form.get('base_url'), label: 'Focusa daemon' });
    if (pairing.state === 'awaiting_approval') {
      el.pairCode.textContent = pairing.code;
      el.pairCode.hidden = false;
      el.pairCheck.hidden = false;
      el.pairResult.textContent = `Approve in Focusa on the daemon. Expires ${pairing.expires_at}.`;
    } else {
      el.pairResult.textContent = pairing.state;
    }
  } catch (error) { el.pairResult.textContent = safeError(error); }
});

el.pairCheck.addEventListener('click', async () => {
  if (!pairing) return;
  try {
    const result = await pollPairing(pairing);
    if (result.state === 'paired') {
      pairing = null;
      el.pairCheck.hidden = true;
      el.pairCode.hidden = true;
      await loadConnectionOptions(result.connection.connection_id);
    } else {
      pairing = result;
      el.pairResult.textContent = result.state;
    }
  } catch (error) { el.pairResult.textContent = safeError(error); }
});

/* ── direction + capture ── */
el.capture.addEventListener('click', async (event) => {
  event.preventDefault();
  try {
    observation = await captureActiveTab();
    el.observation.textContent = `${observation.title} · ${observation.url}`;
  } catch (error) { el.observation.textContent = safeError(error); }
});

el.form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    if (!el.objective.value.trim()) throw new Error('Write an instruction first');
    packet = createOrientationPacket({
      objective: el.objective.value.trim(),
      exclusions: [],
      observation,
      project_root: el.projectRoot.value.trim() || null,
      continuity_id: el.continuityId.value.trim() || null,
      work_item_ref: el.workItem.value.trim() || null,
      role_profile_ref: null,
      agent_identity_ref: 'agent:browser-sidepanel',
    });
    el.mission.textContent = renderOrientationMission(packet);
    el.mission.hidden = false;
    preflight = null; draft = null;
    el.create.disabled = true; el.start.disabled = true;
  } catch (error) { el.mission.hidden = false; el.mission.textContent = safeError(error); }
});

el.create.addEventListener('click', async () => {
  try {
    const config = buildSafeSessionConfig({ packet, display_name: packet.objective, provider: '', model: '', auth_profile_ref: null });
    preflight = await preflightSafeSession(config, requestOptions());
    el.preflight.hidden = false;
    el.preflight.textContent = `Safe preflight approved · ${preflight.redacted_config_hash}`;
    el.create.disabled = false;
  } catch (error) { el.preflight.hidden = false; el.preflight.textContent = safeError(error); }
});

el.start.addEventListener('click', async () => {
  if (!draft) return;
  const target = { session_id: draft.session.id, run_id: draft.run.id, generation: draft.run.generation };
  try {
    const result = await orchestrateAction({ action: 'start', target, idempotency_key: randomKey('start'), idempotencyStore: intentStore, requestOptions: requestOptions() });
    exactTargets.set(draft.session.id, target);
    el.preflight.textContent = `Canonical lifecycle: ${result.canonical.session.lifecycle}`;
    await refreshObservation();
  } catch (error) { el.preflight.textContent = safeError(error); }
});

el.refresh.addEventListener('click', refreshObservation);
el.markRead.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('workforce.html') + '#/needs-you' }));
el.auditFilter.addEventListener('input', renderAudit);
el.clearAudit.addEventListener('click', async () => {
  if (!window.confirm('Clear the local audit projection? Daemon records are not deleted.')) return;
  auditRecords = await clearAuditRecords();
  renderAudit();
  el.auditState.textContent = 'Local audit projection cleared · daemon records remain authoritative.';
});
el.openWorkforce.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('workforce.html') }));
el.watchUiai.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('workforce.html') + '#/settings?section=uiai' }));
window.addEventListener('pagehide', () => streamAbort?.abort());

Promise.all([listNotifications(), listAuditRecords()])
  .then(([items, audits]) => { notifications = items; auditRecords = audits; renderVerified(); renderAudit(); })
  .catch(() => { renderVerified(); renderAudit(); });

renderLink();
el.buildStamp && (el.buildStamp.textContent = `build ${BUILD.sha}${BUILD.committedAt ? ` · ${BUILD.committedAt.slice(0, 10)}` : ''}`);

// The panel discovers first, then adopts any stored connection, so the surface
// is alive from the moment it opens.
(async () => {
  clearSurfaceError();
  // Adopt any stored connection FIRST: a returning panel goes straight to work.
  await loadConnectionOptions().catch((error) => setStatus(el.status, 'degraded', safeError(error)));
  if (connection) {
    discoveryState = { ...discoveryState, state: 'connected', baseUrl: connection.base_url, alive: true };
    link = { status: 'connected', baseUrl: connection.base_url, label: connection.label, since: new Date().toISOString(), lastSeenAt: new Date().toISOString(), note: null };
    renderLink();
    loadPreview(connection.base_url);
    stopHeartbeat?.();
    stopHeartbeat = watchLiveness(connection.base_url, (beat) => {
      discoveryState = { ...discoveryState, alive: beat.ok };
      link = applyBeat(link, beat);
      renderLink();
      if (beat.ok) loadPreview(connection.base_url);
    });
  } else {
    // First run on this device: discover in the open.
    await guard('Discovery', () => discover({}));
  }
})();
