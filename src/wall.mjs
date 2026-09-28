/**
 * Wall (docs/17 §16) — read-only ambient surface.
 *
 * The wall renders owner projections and owner events. It has no mutation
 * authority: every control on the face either hands off to Full Workforce or
 * refreshes a read. Freshness is always owner-sourced and always visible.
 */
import { createWorkforceClient, rosterFromOwner } from './lib/workforce-client.mjs';
import { runReliableEventStream } from './lib/reconnect.mjs';
import { listConnections, listLocalEnvironments } from './lib/storage.mjs';
import { initialConnection, describeConnection, applyBeat } from './lib/connection.mjs';
import { watchLiveness } from './lib/discovery.mjs';

const $ = (selector) => {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`required wall element missing: ${selector}`);
  return node;
};

const el = {
  source: $('#source'),
  freshness: $('#freshness'),
  focusTitle: $('#wall-focus-heading'),
  task: $('#task'),
  loopState: $('#loop-state'),
  signals: $('#signals'),
  needs: $('#wall-needs'),
  verified: $('#wall-verified'),
  workingCount: $('#working-count'),
  needsCount: $('#needs-count'),
  verifiedCount: $('#verified-count'),
  exception: $('#wall-exception'),
  exceptionText: $('#wall-exception-text'),
  stream: $('#stream-state'),
  open: $('#open-workforce'),
};

let connection = null;
let streamAbort = null;
let link = initialConnection();

const elConn = document.querySelector('#wall-conn');
const elConnLabel = document.querySelector('#wall-conn-label');

/** The wall states the same connection truth as every other surface. */
function renderLink() {
  if (!elConn) return;
  const view = describeConnection(link);
  elConn.dataset.tone = view.tone;
  elConnLabel.textContent = view.label;
  elConn.setAttribute('title', link.baseUrl ? `${link.baseUrl} — ${view.detail}` : view.detail);
}

/**
 * The same owner client the rest of the product uses. The wall previously used
 * the legacy paired-only client with a `base_url` option name, so every read
 * failed and it could never tell whether a daemon was alive.
 */
function ownerClient() {
  if (!connection) throw new Error('no environment selected');
  return createWorkforceClient({ baseUrl: connection.base_url, token: connection.token ?? null });
}

function setFreshness(state, note = '') {
  el.freshness.className = `wall-fresh ${state}`;
  el.freshness.textContent = note || state;
}

function row(title, meta) {
  const li = document.createElement('li');
  li.append(Object.assign(document.createElement('span'), { className: 'wall-row-title', textContent: title }));
  if (meta) li.append(Object.assign(document.createElement('span'), { className: 'wall-row-meta', textContent: meta }));
  return li;
}

function emptyRow(message) {
  return Object.assign(document.createElement('li'), { className: 'wall-empty', textContent: message });
}

function render(loop, roster) {
  const focus = loopData?.current_task ?? null;
  el.focusTitle.textContent = focus?.title ?? focus?.description ?? '— no current focus reported';
  el.task.textContent = focus?.detail ?? focus?.objective ?? '—';
  el.loopState.textContent = [loopData?.state, loopData?.status, focus?.id].filter(Boolean).join(' · ') || '—';

  const working = roster.filter((m) => /working|active|running/i.test(String(m.state ?? '')));
  el.signals.replaceChildren(...(working.length ? working.slice(0, 5).map((m) => row(m.label, m.state)) : [emptyRow('No active work reported.')]));
  el.workingCount.textContent = `${working.length}`;

  const needs = roster.filter((m) => /needs|attention|blocked|waiting/i.test(`${m.state ?? ''}`));
  el.needs.replaceChildren(...(needs.length ? needs.slice(0, 5).map((m) => row(m.label, m.state)) : [emptyRow('Nothing needs you right now.')]));
  el.needsCount.textContent = `${needs.length}`;

  el.verified.replaceChildren(emptyRow('No settled proof reported by the owner.'));

  const material = loopData?.degraded === true || /error|unavailable|degraded/i.test(String(loopData?.status ?? ''));
  el.exception.hidden = !material;
  if (material) el.exceptionText.textContent = `Focusa reports ${loopData.status}. Open Workforce for the full owner surface.`;
}

async function refresh() {
  if (!connection) {
    link = { ...link, status: 'disconnected', baseUrl: null, note: 'No environment' };
    setFreshness('unavailable', 'Not connected');
    renderLink();
    return;
  }
  link = { ...link, status: 'connecting', baseUrl: connection.base_url };
  renderLink();
  startLink();
  el.source.textContent = connection.label;
  try {
    const client = ownerClient();
    const [loop, sessions] = await Promise.all([client.workLoopStatus({}).catch(() => null), client.sessions(undefined).catch(() => null)]);
    const loopData = loop?.state === 'ok' ? loop.data : null;
    const roster = sessions?.state === 'ok' ? rosterFromOwner(sessions.data) : [];
    link = { status: 'connected', baseUrl: connection.base_url, lastSeenAt: new Date().toISOString(), note: null };
    setFreshness('ok', 'Live');
    render(loopData, roster);
    renderLink();
  } catch (error) {
    // The daemon may still be reachable; say what is actually true.
    setFreshness('degraded', 'No data');
    link = { ...link, note: 'Connected, but the owner reported nothing readable' };
    renderLink();
    el.focusTitle.textContent = '— owner unavailable';
    el.exception.hidden = false;
    el.exceptionText.textContent = `${error?.kind ?? 'error'}: ${String(error?.message ?? error).slice(0, 140)}`;
  }
}

let stopLink = null;

/** The wall shares the same heartbeat as every other surface. */
function startLink() {
  stopLink?.();
  const base = connection?.base_url;
  if (!base) return;
  stopLink = watchLiveness(base, (beat) => {
    link = applyBeat(link, beat);
    setFreshness(beat.ok ? 'ok' : 'unavailable', beat.ok ? 'Live' : 'Not answering');
    renderLink();
  });
}

function startStream() {
  streamAbort?.abort();
  streamAbort = new AbortController();
  runReliableEventStream({
    baseUrl: connection.base_url,
    token: connection?.token ?? null,
    initialCursor: connection.last_cursor,
    signal: streamAbort.signal,
    onState: (state) => { el.stream.textContent = `stream ${state.phase}`; },
    onEvent: () => { refresh(); },
    commitCursor: async (cursor) => { connection = { ...connection, last_cursor: cursor }; },
  }).catch((error) => { if (error?.name !== 'AbortError') el.stream.textContent = `stream ${error?.status ?? 'error'}`; });
}

el.open.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('workforce.html') }));
window.addEventListener('pagehide', () => { streamAbort?.abort(); stopLink && clearInterval(stopLink); });
renderLink();

Promise.all([listConnections(), listLocalEnvironments().catch(() => [])])
  .then(([paired, local]) => {
    const records = [...local, ...paired];
    connection = records[0] ?? null;
    if (!connection) {
    link = { ...link, status: 'disconnected', baseUrl: null, note: 'No environment' };
    setFreshness('unavailable', 'Not connected');
    renderLink();
    return;
  }
  link = { ...link, status: 'connecting', baseUrl: connection.base_url };
  renderLink();
  startLink();
    return refresh();
  })
  .catch(() => setFreshness('unavailable', 'No environment'));
