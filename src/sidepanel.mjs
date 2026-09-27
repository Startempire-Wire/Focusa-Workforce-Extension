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
import { fetchHealth, fetchWorkLoop, fetchRoster } from './lib/api-client.mjs';
import { projectHealth, projectRoster, projectWorkLoop } from './lib/projections.mjs';
import { runReliableEventStream } from './lib/reconnect.mjs';
import { buildSafeSessionConfig, createPreflightedSession, preflightSafeSession } from './lib/session-create.mjs';
import { orchestrateAction } from './lib/orchestration.mjs';
import { listNotifications, markNotificationsRead, notificationFromEvent, saveNotification, unreadNotificationCount } from './lib/notifications.mjs';
import { auditRecordFromEvent, clearAuditRecords, listAuditRecords, saveAuditRecord } from './lib/audit-log.mjs';
import {
  discoverDaemons, previewDaemon, rememberDaemon, reachableOriginFilter, seedCandidates, watchLiveness,
} from './lib/discovery.mjs';
import { hasDaemonOriginPermission, requestDaemonOriginPermission } from './lib/validation.mjs';

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

function safeError(error) {
  return String(error?.kind || error?.failure_class || error?.message || 'unknown failure').slice(0, 180);
}

function randomKey(prefix) { return `${prefix}:${crypto.randomUUID()}`; }

function requestOptions() {
  if (!connection) throw new Error('paired connection required');
  return { base_url: connection.base_url, token: connection.token };
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

/* ── owner reads ── */
async function refreshObservation() {
  if (!connection) return;
  try {
    const [healthBody, loopBody, rosterBody] = await Promise.all([
      fetchHealth(requestOptions()), fetchWorkLoop(requestOptions()), fetchRoster(requestOptions()),
    ]);
    const health = projectHealth(healthBody);
    const loop = projectWorkLoop(loopBody);
    const roster = projectRoster(rosterBody);
    setStatus(el.status, health.status === 'healthy' ? 'paired' : 'degraded', `${connection.label} · ${health.status}`);
    el.loop.textContent = `${loop.state} · ${loop.status}`;
    el.frontier.textContent = loop.current_task?.description ?? loop.current_task?.id ?? '— no frontier reported';
    renderNeedsYou(roster);
    renderWorkingNow(roster);
    renderVerified();
    startStream();
  } catch (error) {
    const kind = error?.kind;
    setStatus(el.status, kind === 'unauthenticated' ? 'unauthorized' : kind === 'forbidden' ? 'scope_denied' : 'degraded', safeError(error));
  }
}

function startStream() {
  streamAbort?.abort();
  streamAbort = new AbortController();
  runReliableEventStream({
    ...requestOptions(),
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
let previews = {};
let stopHeartbeat = null;

const PLACES = [
  { label: 'This browser', hosts: ['127.0.0.1', 'localhost', '[::1]'] },
  { label: 'This device', hosts: ['100.115.92.26', '100.127.113.90'] },
  { label: 'Tailnet', hosts: null },
];

function isTailnetHost(host) {
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

function previewNodes(baseUrl) {
  const preview = previews[baseUrl];
  if (!preview) return [node('p', 'sp-preview pending', 'reading what this daemon holds…')];
  const stats = node('p', 'sp-preview');
  const add = (label, value, warn) => {
    const span = node('span', warn ? 'warn' : null);
    span.append(node('b', null, String(value)), document.createTextNode(` ${label}`));
    stats.append(span);
  };
  add('writes', preview.batches ?? '—');
  add('failures', preview.failures ?? '—', (preview.failures ?? 0) > 0);
  add('projects', preview.projectCount ?? '—');
  const nodes = [stats];
  if (preview.projects?.length) nodes.push(node('p', 'sp-names', preview.projects.join(' · ')));
  return nodes;
}

function renderConnection() {
  el.pairSection.hidden = false;
  const body = el.connectBody;
  body.replaceChildren();

  if (discoveryState.state === 'connected') {
    const live = node('p', 'sp-live');
    live.append(node('span', `sp-beat${discoveryState.alive ? ' live' : ''}`), node('strong', null, 'Focusa is live'));
    body.append(live, node('code', 'sp-origin', discoveryState.baseUrl));
    const preview = previews[discoveryState.baseUrl];
    if (preview) {
      const line = node('p', 'sp-telemetry');
      const b = (v) => node('b', null, String(v));
      line.append(b(preview.batches ?? '—'), document.createTextNode(' writes · '), b(preview.failures ?? '—'),
        document.createTextNode(' failures · '), b(preview.projectCount ?? '—'), document.createTextNode(' projects'));
      body.append(line);
    }
    const disconnect = node('button', 'btn btn-quiet', 'Disconnect');
    disconnect.type = 'button';
    disconnect.addEventListener('click', disconnectFromDaemon);
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
      button.addEventListener('click', () => connectDaemon(daemon.baseUrl));
      item.append(head2, ...previewNodes(daemon.baseUrl), button);
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
  again.addEventListener('click', () => discover({}));
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
  stopHeartbeat?.();
  stopHeartbeat = watchLiveness(baseUrl, (beat) => {
    discoveryState = { ...discoveryState, alive: beat.ok };
    renderConnection();
    if (beat.ok) loadPreview(baseUrl);
  });
  renderConnection();
}

async function disconnectFromDaemon() {
  stopHeartbeat?.();
  stopHeartbeat = null;
  if (connection) await forgetLocalEnvironment(connection.connection_id ?? connection.environment_id, chrome).catch(() => {});
  streamAbort?.abort();
  connection = null;
  discoveryState = { state: 'idle', daemons: [], baseUrl: null, alive: false, answers: [] };
  await loadConnectionOptions();
  await discover({});
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

// The panel discovers first, then adopts any stored connection, so the surface
// is alive from the moment it opens.
(async () => {
  await discover({});
  await loadConnectionOptions().catch((error) => setStatus(el.status, 'degraded', safeError(error)));
  if (connection) {
    discoveryState = { ...discoveryState, state: 'connected', baseUrl: connection.base_url, alive: true };
    renderConnection();
    loadPreview(connection.base_url);
  }
})();
