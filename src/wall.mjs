/**
 * Wall (docs/17 §16) — read-only ambient surface.
 *
 * The wall renders owner projections and owner events. It has no mutation
 * authority: every control on the face either hands off to Full Workforce or
 * refreshes a read. Freshness is always owner-sourced and always visible.
 */
import { fetchWorkLoop, fetchRoster } from './lib/api-client.mjs';
import { projectRoster, projectWorkLoop } from './lib/projections.mjs';
import { runReliableEventStream } from './lib/reconnect.mjs';
import { listConnections, listLocalEnvironments } from './lib/storage.mjs';

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

function requestOptions() {
  if (!connection) throw new Error('no environment selected');
  return { base_url: connection.base_url, token: connection.token };
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
  const focus = loop?.current_task ?? null;
  el.focusTitle.textContent = focus?.title ?? focus?.description ?? '— no current focus reported';
  el.task.textContent = focus?.detail ?? focus?.objective ?? '—';
  el.loopState.textContent = [loop?.state, loop?.status, loop?.current_task?.id].filter(Boolean).join(' · ') || '—';

  const working = roster.filter((m) => /working|active|running/i.test(String(m.state ?? '')));
  el.signals.replaceChildren(...(working.length ? working.slice(0, 5).map((m) => row(m.label, m.state)) : [emptyRow('No active work reported.')]));
  el.workingCount.textContent = `${working.length}`;

  const needs = roster.filter((m) => /needs|attention|blocked|waiting/i.test(`${m.state ?? ''}`));
  el.needs.replaceChildren(...(needs.length ? needs.slice(0, 5).map((m) => row(m.label, m.state)) : [emptyRow('Nothing needs you right now.')]));
  el.needsCount.textContent = `${needs.length}`;

  el.verified.replaceChildren(emptyRow('No settled proof reported by the owner.'));

  const material = loop?.degraded === true || /error|unavailable|degraded/i.test(String(loop?.status ?? ''));
  el.exception.hidden = !material;
  if (material) el.exceptionText.textContent = `Focusa reports ${loop.status}. Open Workforce for the full owner surface.`;
}

async function refresh() {
  if (!connection) { setFreshness('unavailable', 'No environment'); return; }
  el.source.textContent = connection.label;
  try {
    const [loopBody, rosterBody] = await Promise.all([fetchWorkLoop(requestOptions()), fetchRoster(requestOptions())]);
    const loop = projectWorkLoop(loopBody);
    const roster = projectRoster(rosterBody);
    setFreshness('ok', 'Fresh');
    render(loop, roster);
    startStream();
  } catch (error) {
    setFreshness('unavailable', 'Unavailable');
    el.focusTitle.textContent = '— owner unavailable';
    el.exception.hidden = false;
    el.exceptionText.textContent = `${error?.kind ?? 'error'}: ${String(error?.message ?? error).slice(0, 140)}`;
  }
}

function startStream() {
  streamAbort?.abort();
  streamAbort = new AbortController();
  runReliableEventStream({
    ...requestOptions(),
    initialCursor: connection.last_cursor,
    signal: streamAbort.signal,
    onState: (state) => { el.stream.textContent = `stream ${state.phase}`; },
    onEvent: () => { refresh(); },
    commitCursor: async (cursor) => { connection = { ...connection, last_cursor: cursor }; },
  }).catch((error) => { if (error?.name !== 'AbortError') el.stream.textContent = `stream ${error?.status ?? 'error'}`; });
}

el.open.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('workforce.html') }));
window.addEventListener('pagehide', () => streamAbort?.abort());

Promise.all([listConnections(), listLocalEnvironments().catch(() => [])])
  .then(([paired, local]) => {
    const records = [...local, ...paired];
    connection = records[0] ?? null;
    if (!connection) { setFreshness('unavailable', 'No environment'); return; }
    return refresh();
  })
  .catch(() => setFreshness('unavailable', 'No environment'));
