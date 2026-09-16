/**
 * Workforce presentation store (Svelte 5 runes).
 *
 * Holds ONLY presentation state + bounded owner projections:
 *   - paired environments and the active one
 *   - the selected Workstream reference (project_root + continuity_id)
 *   - last owner projections, with their honest result state
 *
 * Canonical state (Foreman, trajectory, work, approvals, evidence) is never
 * stored here; it is read from and re-read after every owner mutation.
 *
 * @module workforce/lib/workforce-store
 */
import { listConnections, listLocalEnvironments, saveLocalEnvironment } from '../../lib/storage.mjs';
import { startPairing, pollPairing } from '../../lib/pairing.mjs';
import { createWorkforceClient, ResultState, rosterFromOwner, trajectoryFromOwner, projectsFromOwner, discoveredFromOwner } from '../../lib/workforce-client.mjs';
import { workstreamRef, OWNER_GAPS } from '../../lib/owner-contracts.mjs';
import { resolveTrajectorySource } from '../../lib/trajectory-source.mjs';
import { parseExactTarget, resolveDirectionTarget, describeTarget } from '../../lib/direction-target.mjs';
import { buildEvidenceTrail } from '../../lib/evidence-trail.mjs';
import { normalizeDaemonOrigin, requestDaemonOriginPermission } from '../../lib/validation.mjs';
import { orchestrateAction } from '../../lib/orchestration.mjs';
import { preflightSafeSession, createPreflightedSession } from '../../lib/session-create.mjs';

const SELECTION_KEY = 'focusa.workforce.selection.v1';
const INTENT_KEY = 'focusa.workforce.intents.v1';

/** Durable idempotency store for consequential owner mutations (MV3-safe). */
function intentStore(chromeApi) {
  return {
    async load(key) { return (await chromeApi.storage.local.get(INTENT_KEY))[INTENT_KEY]?.[key] ?? null; },
    async persist(record) {
      const current = (await chromeApi.storage.local.get(INTENT_KEY))[INTENT_KEY] ?? {};
      await chromeApi.storage.local.set({ [INTENT_KEY]: { ...current, [record.idempotency_key]: record } });
    },
  };
}

function randomKey(prefix) { return `${prefix}:${crypto.randomUUID()}`; }

/** @param {any} chromeApi */
async function loadSelection(chromeApi) {
  try {
    const raw = await chromeApi?.storage?.local?.get(SELECTION_KEY);
    const value = raw?.[SELECTION_KEY];
    if (value && typeof value === 'object') {
      return {
        projectRoot: typeof value.project_root === 'string' ? value.project_root : '',
        continuityId: typeof value.continuity_id === 'string' ? value.continuity_id : '',
      };
    }
  } catch { /* selection is a convenience; absence is fine */ }
  return { projectRoot: '', continuityId: '' };
}

/** @param {any} chromeApi @param {{projectRoot: string, continuityId: string}} selection */
async function persistSelection(chromeApi, selection) {
  try {
    await chromeApi?.storage?.local?.set({
      [SELECTION_KEY]: { project_root: selection.projectRoot, continuity_id: selection.continuityId, updated_at: new Date().toISOString() },
    });
  } catch { /* non-fatal */ }
}

/**
 * @param {any} chromeApi
 */
export function createWorkforceStore(chromeApi = globalThis.chrome) {
  let environments = $state(/** @type {any[]} */ ([]));
  let activeId = $state('');
  let selection = $state({ projectRoot: '', continuityId: '' });
  let ownerGaps = $state(/** @type {string[]} */ ([...OWNER_GAPS]));

  /** @type {Record<string, {state: string, status: number|null, note: string|null, data: any, at: string|null}>} */
  let reads = $state({});
  let directing = $state(false);
  let lastDirection = $state(/** @type {any} */ (null));
  let bootError = $state(/** @type {string|null} */ (null));
  let discovered = $state(/** @type {any[]} */ ([]));
  let projectBusy = $state(false);
  // Live freshness: owner-sourced event stream state (never synthesized).
  let streamState = $state(/** @type {{phase: string, cursor: string|null, attempt: number}|null} */ (null));
  let lastEventAt = $state(/** @type {string|null} */ (null));
  let streamAbort = null;
  let refreshTimer = null;
  const STREAM_CURSOR_KEY = 'focusa.workforce.stream_cursors.v1';
  const TARGET_KEY = 'focusa.workforce.direction_targets.v1';
  // Operator-bound exact target per environment (a reference only; the owner
  // roster wins the moment it reports one). Stopgap for the missing session.
  let boundTarget = $state(/** @type {any} */ (null));
  // In-page pairing (the side panel's proven flow, available on the full page).
  let selectedSessionId = $state('');
  let outputCursor = $state(/** @type {string|null} */ (null));
  let outputLines = $state(/** @type {string[]} */ ([]));
  let pairing = $state(/** @type {any} */ (null));
  let pairingBusy = $state(false);
  let pairingError = $state('');
  let pairingTimer = null;

  const active = $derived(environments.find((e) => e.id === activeId) ?? null);
  const workstream = $derived(
    selection.projectRoot && selection.continuityId
      ? workstreamRef({ projectRoot: selection.projectRoot, continuityId: selection.continuityId })
      : null,
  );
  const health = $derived(reads.health?.data ?? null);
  const entitlement = $derived(reads.license?.data?.authority ?? reads.license?.data ?? null);
  const entitlementState = $derived(
    reads.license?.state === ResultState.ENTITLEMENT_BLOCKED ? 'blocked'
      : (entitlement?.state ?? (reads.license?.data ? 'unknown' : null)),
  );
  const roster = $derived(reads.sessions?.state === ResultState.OK ? rosterFromOwner(reads.sessions.data) : []);
  const trajectory = $derived(reads.trajectory?.state === ResultState.OK || reads.trajectory?.state === ResultState.DEGRADED
    ? trajectoryFromOwner(reads.trajectory.data) : null);
  const foremanProfiles = $derived(reads.roles?.state === ResultState.OK ? (reads.roles.data?.profiles ?? []) : []);
  const anyBlocked = $derived(Object.values(reads).some((r) => r.state === ResultState.ENTITLEMENT_BLOCKED));
  const projectDashboard = $derived(reads.projects ? projectsFromOwner(reads.projects.data) : null);
  // Ladder view: the owner projection when it carries a committed ladder,
  // otherwise a labelled stopgap derived from owner-answered operations.
  // The cutover is automatic — see lib/trajectory-source.mjs (focusa#621).
  const evidenceTrail = $derived(buildEvidenceTrail(reads));
  const resolvedTarget = $derived(resolveDirectionTarget({ roster, bound: boundTarget }));
  const directionTarget = $derived(resolvedTarget.target);
  const directionTargetOrigin = $derived(resolvedTarget.origin);
  const trajectoryView = $derived(resolveTrajectorySource({
    view: reads.trajectory ?? null,
    workpoint: reads.workpoint ?? null,
    workLoop: reads.workLoop ?? null,
    workstream,
  }));
  const sessionProfiles = $derived(reads.profiles?.state === ResultState.OK ? (reads.profiles.data?.data?.profiles ?? []) : []);
  const sessionPresets = $derived(reads.presets?.state === ResultState.OK ? (reads.presets.data?.data?.presets ?? []) : []);
  const projectSelectionRequired = $derived(projectDashboard?.failureClass === 'project_root_selection_required');

  function record(name, r) {
    reads = { ...reads, [name]: { state: r.state, status: r.status, note: r.note ?? r.failureClass ?? null, data: r.data, at: new Date().toISOString() } };
    if (r.state === ResultState.NETWORK || r.state === ResultState.UNAUTHENTICATED) {
      // no retry loop here: surfaces render the state and the operator decides (MV3-safe, no background state)
    }
  }

  function client() {
    if (!active) throw new Error('no active environment selected');
    return createWorkforceClient({ baseUrl: active.baseUrl, token: active.token });
  }

  async function refreshEnvironments() {
    try {
      const paired = (await listConnections(chromeApi)).map((c) => ({
        id: c.connection_id, kind: 'paired', label: c.label, baseUrl: c.base_url, token: c.token, scopes: c.granted_scopes,
      }));
      let local = [];
      try {
        local = (await listLocalEnvironments(chromeApi)).map((e) => ({
          id: e.environment_id, kind: 'local', label: e.label, baseUrl: e.base_url, token: null, scopes: ['read', 'write'],
        }));
      } catch { /* an invalid stored local record must not break paired environments */ }
      environments = [...local, ...paired];
      if (!activeId && environments.length) activeId = environments[0].id;
      if (!selection.projectRoot) {
        const stored = await loadSelection(chromeApi);
        if (stored.projectRoot) selection = stored;
      }
    } catch (error) {
      bootError = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Register the daemon running on this machine. The owner authenticates the
   * device as principal:local-loopback, so no pairing token is involved.
   * @param {string} baseUrl loopback origin, e.g. http://127.0.0.1:8787
   */
  async function addLocalDaemon(baseUrl = 'http://127.0.0.1:8787') {
    const origin = normalizeDaemonOrigin(baseUrl);
    // Must run inside the click's user gesture: the extension needs an optional
    // host permission before it can reach the loopback daemon.
    const granted = await requestDaemonOriginPermission(origin, chromeApi);
    if (!granted) throw new Error(`origin permission for ${origin} was not granted`);
    const record = await saveLocalEnvironment({
      schema: 'focusa.workforce_local_environment.v1',
      environment_id: `local:${origin}`,
      label: `This device (${origin})`,
      base_url: origin,
      created_at: new Date().toISOString(),
    }, chromeApi);
    await refreshEnvironments();
    activeId = record.environment_id;
    await refreshOwner();
    await startStream();
    return record.environment_id;
  }

  /**
   * Start owner-stream freshness for the active environment. Events are only a
   * trigger: the projections are always re-read from the owning operations.
   */
  async function startStream() {
    streamAbort?.abort();
    streamAbort = new AbortController();
    const environment = active;
    if (!environment) return;
    const cursors = (await chromeApi?.storage?.local?.get(STREAM_CURSOR_KEY).catch(() => null))?.[STREAM_CURSOR_KEY] ?? {};
    try {
      await createWorkforceClient({ baseUrl: environment.baseUrl, token: environment.token }).openEventStream({
        scope: selection.projectRoot ? { projectRoot: selection.projectRoot } : {},
        initialCursor: cursors[environment.id] ?? null,
        signal: streamAbort.signal,
        onState: (state) => { streamState = { phase: state.phase, cursor: state.cursor, attempt: state.attempt }; },
        onEvent: () => {
          lastEventAt = new Date().toISOString();
          if (refreshTimer) clearTimeout(refreshTimer);
          refreshTimer = setTimeout(() => {
            refreshOwner().catch(() => {});
            loadOutput().catch(() => {});
          }, 800);
        },
        commitCursor: async (cursor) => {
          if (!cursor) return;
          await chromeApi?.storage?.local?.set({ [STREAM_CURSOR_KEY]: { ...cursors, [environment.id]: cursor } }).catch(() => {});
        },
      });
    } catch (error) {
      streamState = { phase: 'unavailable', cursor: null, attempt: 0 };
    }
  }

  function stopStream() {
    streamAbort?.abort();
    streamAbort = null;
    streamState = null;
  }

  async function refreshOwner() {
    if (!active) return;
    const c = client();
    record('health', await c.health());
    record('license', await c.licenseStatus());
    record('projects', await c.projectList());
    if (selection.projectRoot) {
      record('project', await c.projectIdentity(selection.projectRoot));
      record('projectStatus', await c.projectStatus(selection.projectRoot));
      record('workpoint', await c.workpointCurrent(selection.projectRoot));
      record('sessions', await c.sessions(selection.projectRoot));
      record('profiles', await c.sessionProfiles(selection.projectRoot));
      record('presets', await c.sessionPresets(selection.projectRoot));
    }
    if (workstream) {
      record('trajectory', await c.trajectory(workstream));
      record('workLoop', await c.workLoopStatus(workstream));
      record('roles', await c.roleProfiles(workstream));
    }
  }

  /**
   * Owner project discovery over a directory. Results are owner summaries.
   * @param {string} from
   */
  async function discoverProjects(from) {
    if (!active) return;
    projectBusy = true;
    try {
      const r = await client().projectDiscover({ from: from || undefined, maxDepth: 4, maxResults: 30, includeGitOnly: true });
      record('discover', r);
      discovered = r.state === ResultState.OK ? discoveredFromOwner(r.data) : [];
    } finally {
      projectBusy = false;
    }
  }

  /**
   * Ask the owner to make a project active, then adopt it as the Workstream project axis.
   * @param {string} projectRoot
   */
  async function useProject(projectRoot) {
    if (!active) return;
    projectBusy = true;
    try {
      const r = await client().projectUse({ projectRoot });
      record('projectUse', r);
      if (r.state === ResultState.OK || r.state === ResultState.DEGRADED) {
        await setSelection({ projectRoot });
      }
    } finally {
      projectBusy = false;
    }
  }

  async function setEnvironment(id) {
    activeId = id;
    await refreshOwner();
    await loadBoundTarget();
    await startStream();
  }

  /**
   * Begin pairing with a Focusa daemon from the full page.
   * Uses the proven pairing client: owner approval happens on the daemon side.
   */
  async function beginPairing({ baseUrl, label }) {
    pairingError = '';
    pairingBusy = true;
    try {
      pairing = await startPairing({ base_url: baseUrl, label, device_name: 'Focusa Workforce (full page)' }, { chromeApi });
      startPairingPoll();
    } catch (error) {
      pairingError = error instanceof Error ? error.message : String(error);
    } finally {
      pairingBusy = false;
    }
  }

  function startPairingPoll() {
    stopPairingPoll();
    pairingTimer = setInterval(async () => {
      if (!pairing || pairing.state !== 'awaiting_approval') { stopPairingPoll(); return; }
      try {
        const next = await pollPairing(pairing, { chromeApi });
        pairing = next;
        if (next.state === 'paired') {
          stopPairingPoll();
          await refreshEnvironments();
          activeId = next.connection.connection_id;
          await refreshOwner();
          await loadBoundTarget();
          await startStream();
        }
      } catch (error) {
        pairingError = error instanceof Error ? error.message : String(error);
        stopPairingPoll();
      }
    }, 3000);
  }

  function stopPairingPoll() {
    if (pairingTimer) clearInterval(pairingTimer);
    pairingTimer = null;
  }

  function cancelPairing() {
    stopPairingPoll();
    pairing = null;
    pairingError = '';
  }

  /**
   * Select a person and read its owner-reported status.
   * The owner decides what it reports; Workforce adds nothing.
   * @param {string} sessionId
   */
  async function selectSession(sessionId) {
    selectedSessionId = sessionId;
    if (!active || !sessionId) return;
    try {
      record('sessionStatus', await createWorkforceClient({ baseUrl: active.baseUrl, token: active.token })
        .sessionStatus(sessionId, selection.projectRoot ? { projectRoot: selection.projectRoot } : {}));
    } catch (error) {
      record('sessionStatus', { state: 'invalid', status: null, note: error?.message ?? 'status read failed', data: null });
    }
  }

  /**
   * Read owner-reported output for the resolved exact target.
   * The owner serves output only for an exact target; nothing is invented.
   */
  async function loadOutput({ reset = false } = {}) {
    const target = resolvedTarget.target;
    if (!active || !target) return;
    if (reset) { outputLines = []; outputCursor = null; }
    const result = await createWorkforceClient({ baseUrl: active.baseUrl, token: active.token }).sessionOutput({
      sessionId: target.session_id, runId: target.run_id, generation: target.generation,
      ...(outputCursor ? { cursor: outputCursor } : {}),
      scope: selection.projectRoot ? { projectRoot: selection.projectRoot } : {},
    });
    record('output', result);
    if (result.state === ResultState.OK) {
      const body = result.data ?? {};
      const chunks = body.chunks ?? body.data?.chunks ?? [];
      const text = chunks
        .map((chunk) => (typeof chunk === 'string' ? chunk : chunk?.text ?? chunk?.data ?? ''))
        .filter(Boolean);
      if (text.length) outputLines = [...outputLines, ...text].slice(-500);
      outputCursor = body.next_cursor ?? body.cursor ?? outputCursor;
    }
  }

  async function loadBoundTarget() {
    try {
      const all = (await chromeApi?.storage?.local?.get(TARGET_KEY))?.[TARGET_KEY] ?? {};
      boundTarget = all[activeId] ?? null;
    } catch {
      boundTarget = null;
    }
  }

  /** @param {string} raw operator-pasted exact target */
  async function bindTarget(raw) {
    const parsed = parseExactTarget(raw);
    if (!parsed.ok) return parsed;
    boundTarget = parsed.target;
    try {
      const all = (await chromeApi?.storage?.local?.get(TARGET_KEY))?.[TARGET_KEY] ?? {};
      await chromeApi.storage.local.set({ [TARGET_KEY]: { ...all, [activeId]: parsed.target } });
    } catch { /* binding is a convenience; failure to persist is not fatal */ }
    return { ok: true, target: parsed.target, label: describeTarget(parsed.target) };
  }

  async function clearBoundTarget() {
    boundTarget = null;
    try {
      const all = (await chromeApi?.storage?.local?.get(TARGET_KEY))?.[TARGET_KEY] ?? {};
      delete all[activeId];
      await chromeApi.storage.local.set({ [TARGET_KEY]: all });
    } catch { /* ignore */ }
  }

  async function setSelection({ projectRoot, continuityId }) {
    selection = {
      projectRoot: projectRoot ?? selection.projectRoot,
      continuityId: continuityId ?? selection.continuityId,
    };
    await persistSelection(chromeApi, selection);
    await refreshOwner();
  }

  /**
   * Owner session control (start/pause/resume/cancel) on an exact target,
   * through the proven governed orchestration path.
   * @param {{action: 'start'|'pause'|'resume'|'cancel', target: object}} input
   */
  async function controlSession({ action, target }) {
    if (!active) throw new Error('no active environment selected');
    directing = true;
    lastDirection = null;
    try {
      const outcome = await orchestrateAction({
        action, target, idempotency_key: randomKey(action),
        idempotencyStore: intentStore(chromeApi),
        requestOptions: { baseUrl: active.baseUrl, token: active.token },
      });
      lastDirection = { ok: true, action, status: outcome.mutation_status ?? null, approval: outcome.approval?.approval_id ?? null };
    } catch (error) {
      lastDirection = { ok: false, kind: error?.kind ?? 'error', message: error instanceof Error ? error.message : String(error) };
    } finally {
      directing = false;
      await refreshOwner();
    }
  }

  /**
   * Submit Direction to one exact owner target (silent session/run/generation).
   * Uses the proven governed orchestration path: durable idempotency intent,
   * owner approval when the action requires it, exact-target refresh, canonical re-read.
   *
   * @param {{target: {session_id: string, run_id: string, generation: number}, instruction: string}} input
   */
  async function direct({ target, instruction }) {
    if (!active) throw new Error('no active environment selected');
    directing = true;
    lastDirection = null;
    try {
      const outcome = await orchestrateAction({
        action: 'steer',
        target,
        payload: { instruction },
        idempotency_key: randomKey('steer'),
        idempotencyStore: intentStore(chromeApi),
        requestOptions: { baseUrl: active.baseUrl, token: active.token },
      });
      lastDirection = {
        ok: true,
        action: outcome.action,
        status: outcome.mutation_status ?? null,
        approval: outcome.approval?.approval_id ?? null,
      };
    } catch (error) {
      lastDirection = { ok: false, kind: error?.kind ?? 'error', message: error instanceof Error ? error.message : String(error) };
    } finally {
      directing = false;
      await refreshOwner();
    }
  }

  return {
    get environments() { return environments; },
    get activeId() { return activeId; },
    get active() { return active; },
    get selection() { return selection; },
    get workstream() { return workstream; },
    get reads() { return reads; },
    get health() { return health; },
    get entitlement() { return entitlement; },
    get entitlementState() { return entitlementState; },
    get roster() { return roster; },
    get sessionProfiles() { return sessionProfiles; },
    get sessionPresets() { return sessionPresets; },
    get trajectory() { return trajectory; },
    get trajectoryView() { return trajectoryView; },
    get evidenceTrail() { return evidenceTrail; },
    get directionTarget() { return directionTarget; },
    get directionTargetOrigin() { return directionTargetOrigin; },
    get boundTarget() { return boundTarget; },
    get selectedSessionId() { return selectedSessionId; },
    get outputLines() { return outputLines; },
    get pairing() { return pairing; },
    get pairingBusy() { return pairingBusy; },
    get pairingError() { return pairingError; },
    get foremanProfiles() { return foremanProfiles; },
    get ownerGaps() { return ownerGaps; },
    get anyBlocked() { return anyBlocked; },
    get projectDashboard() { return projectDashboard; },
    get projectSelectionRequired() { return projectSelectionRequired; },
    get discovered() { return discovered; },
    get projectBusy() { return projectBusy; },
    get streamState() { return streamState; },
    get lastEventAt() { return lastEventAt; },
    get directing() { return directing; },
    get lastDirection() { return lastDirection; },
    get bootError() { return bootError; },
    refreshEnvironments,
    refreshOwner,
    setEnvironment,
    setSelection,
    addLocalDaemon,
    discoverProjects,
    useProject,
    startStream,
    stopStream,
    bindTarget,
    clearBoundTarget,
    beginPairing,
    cancelPairing,
    selectSession,
    loadOutput,
    controlSession,
    direct,
    resultOf: (name) => reads[name] ?? null,
  };
}
