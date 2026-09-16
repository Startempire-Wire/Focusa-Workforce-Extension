<script>
  /**
   * Focusa Workforce — full page (Slice 1: Workstream + Foreman + Direction).
   *
   * Everything shown is an owner projection with its honest result state.
   * Foreman and attention are declared owner gaps: this surface says so
   * instead of inventing state.
   */
  import { onMount } from 'svelte';
  import { createWorkforceStore } from './lib/workforce-store.svelte.js';
  import StateNote from './components/StateNote.svelte';
  import RosterList from './components/RosterList.svelte';

  const store = createWorkforceStore();

  /** Build identity injected at bundle time (see vite.config.mjs). */
  const buildStamp = typeof __WF_BUILD__ === 'string' ? __WF_BUILD__ : 'dev';

  let instruction = $state('');

  let environmentError = $state('');
  const liveMessage = $derived(
    store.streamState ? `owner stream ${store.streamState.phase}${store.lastEventAt ? ', last event ' + store.lastEventAt : ''}` : 'owner stream idle',
  );
  let scanFrom = $state('~/src');
  let bindInput = $state('');
  let bindResult = $state('');
  let pairUrl = $state('');
  let pairLabel = $state('');
  let sessionName = $state('');
  let sessionPreparation = $state(null);

  // Direction addresses an exact owner target. Preferred source: the owner's own
  // roster projection. Stopgap: an operator-bound target (see AGENTS.md stopgap
  // doctrine) used only until the owner reports one.
  const steerTarget = $derived(store.directionTarget);
  const outputText = $derived(store.outputLines.join('\n'));

  onMount(async () => {
    await store.refreshEnvironments();
    if (store.active) {
      await store.refreshOwner();
      // Owner-sourced freshness: the page follows the daemon's event stream and
      // re-reads projections rather than polling or inventing state.
      await store.startStream();
    }
    return () => store.stopStream();
  });

  async function submitDirection(event) {
    event.preventDefault();
    if (!steerTarget || !instruction.trim()) return;
    await store.direct({ target: steerTarget, instruction: instruction.trim() });
    instruction = '';
  }

  async function connectLocal() {
    environmentError = '';
    try {
      await store.addLocalDaemon();
    } catch (error) {
      environmentError = error instanceof Error ? error.message : String(error);
    }
  }
</script>

<main>
  <a class="skip" href="#wf-workstream">Skip to Workstream</a>
  <div class="sr-only" role="status" aria-live="polite">{liveMessage}</div>
  <header class="app-head">
    <div>
      <h1>Focusa Workforce</h1>
      <p class="sub">
        Workstream · Foreman · Direction
        <span class="stamp" title="loaded build">{buildStamp}</span>
        {#if store.streamState}
          <span class="live {store.streamState.phase}" title={store.lastEventAt ? `last owner event ${store.lastEventAt}` : 'no owner event yet'}>
            {store.streamState.phase}
          </span>
        {/if}
      </p>
    </div>
    <button type="button" class="wf-btn" onclick={() => store.refreshOwner()} disabled={!store.active}>Refresh</button>
  </header>

  {#if store.bootError}
    <StateNote label="Extension" result={{ state: 'error', note: store.bootError }} />
  {/if}

  <!-- Environment -->
  <section class="card" aria-labelledby="wf-env">
    <h2 id="wf-env">Environment</h2>
    {#if store.environments.length === 0}
      <p class="muted">No paired Focusa environment.</p>
    {:else}
      <div class="row">
        <select value={store.activeId} onchange={(e) => store.setEnvironment(e.currentTarget.value)}>
          {#each store.environments as env (env.id)}
            <option value={env.id}>{env.label} — {env.baseUrl}</option>
          {/each}
        </select>
        {#if store.health}
          <span class="muted">
            daemon {store.health.version ?? 'unknown'} · {store.health.status ?? ''}
          </span>
        {/if}
      </div>
      <StateNote label="Health" result={store.resultOf('health')} />
      <StateNote label="Entitlement" result={store.resultOf('license')} />
      {#if store.entitlementState}
        <p class="muted">lease state: <strong>{store.entitlementState}</strong>{#if store.entitlement?.limits} · limits {JSON.stringify(store.entitlement.limits)}{/if}</p>
      {/if}
    {/if}
    <div class="row">
      <button type="button" onclick={connectLocal} disabled={store.environments.some((e) => e.kind === 'local')}>
        {store.environments.some((e) => e.kind === 'local') ? 'Local daemon connected' : 'Use the daemon on this device'}
      </button>
      <span class="muted tiny">loopback only · the owner authenticates this device itself (no pairing token)</span>
    </div>

    <details class="capability">
      <summary>Pair a Focusa daemon (remote or paired device)</summary>
      {#if !store.pairing}
        <form onsubmit={(event) => { event.preventDefault(); store.beginPairing({ baseUrl: pairUrl, label: pairLabel || 'Focusa daemon' }); }}>
          <input type="text" aria-label="Daemon URL" placeholder="https://daemon.example:8787" bind:value={pairUrl} />
          <input type="text" aria-label="Environment label" placeholder="label (optional)" bind:value={pairLabel} />
          <button type="submit" disabled={store.pairingBusy || !pairUrl.trim()}>Start pairing</button>
        </form>
      {:else if store.pairing.state === 'awaiting_approval'}
        <p class="muted tiny">
          Approve on the daemon: <code>{store.pairing.operator_command ?? store.pairing.code}</code>
        </p>
        <p class="muted tiny">pairing {store.pairing.state} · expires {store.pairing.expires_at}</p>
        <button type="button" onclick={() => store.cancelPairing()}>Cancel</button>
      {:else}
        <p class="gap">pairing {store.pairing.state}</p>
        <button type="button" onclick={() => store.cancelPairing()}>Reset</button>
      {/if}
      {#if store.pairingError}<p class="gap">{store.pairingError}</p>{/if}
    </details>

    {#if environmentError}
      <p class="gap">{environmentError}</p>
    {/if}
  </section>

  <!-- Workstream scope -->
  <section class="card" id="wf-workstream" aria-labelledby="wf-workstream-h">
    <h2 id="wf-workstream-h">Workstream</h2>
    <p class="muted tiny">
      Owner identity axes: project_root = project boundary · continuity_id = logical Workstream.
    </p>

    {#if store.projectSelectionRequired}
      <p class="gap">Owner requires a project selection before Workstream state is available.</p>
    {/if}

    {#if store.projectDashboard?.projects?.length}
      <div class="row">
        <select onchange={(e) => e.currentTarget.value && store.useProject(e.currentTarget.value)}>
          <option value="">Select a project…</option>
          {#each store.projectDashboard.projects as project (project.root)}
            <option value={project.root} selected={project.root === store.selection.projectRoot}>
              {project.name}{#if project.stack} · {project.stack}{/if}
            </option>
          {/each}
        </select>
      </div>
    {/if}

    <div class="row">
      <input type="text" aria-label="Directory to scan for projects" placeholder="directory to scan" bind:value={scanFrom} />
      <button type="button" onclick={() => store.discoverProjects(scanFrom)} disabled={store.projectBusy || !store.active}>
        {store.projectBusy ? 'Asking owner…' : 'Scan for projects'}
      </button>
    </div>

    {#if store.discovered.length}
      <ul class="plain">
        {#each store.discovered as project (project.root)}
          <li>
            <strong>{project.name}</strong> — <code>{project.root}</code>
            {#if project.stack}<span class="muted tiny"> · {project.stack}</span>{/if}
            <button type="button" onclick={() => store.useProject(project.root)} disabled={store.projectBusy}>Use</button>
          </li>
        {/each}
      </ul>
    {:else if store.resultOf('discover')}
      <StateNote label="Discovery" result={store.resultOf('discover')} />
    {/if}

    <div class="row">
      <input
        type="text"
        aria-label="Project root"
        placeholder="/absolute/project/root"
        value={store.selection.projectRoot}
        onchange={(e) => store.setSelection({ projectRoot: e.currentTarget.value.trim() })}
      />
      <input
        type="text"
        aria-label="Continuity id (Workstream)"
        placeholder="continuity id (Workstream)"
        value={store.selection.continuityId}
        onchange={(e) => store.setSelection({ continuityId: e.currentTarget.value.trim() })}
      />
    </div>
    {#if store.workstream}
      <p class="muted">resolved: <code>{store.workstream.label}</code></p>
    {/if}
    <StateNote label="Projects" result={store.resultOf('projects')} />
    <StateNote label="Project identity" result={store.resultOf('project')} />
    <StateNote label="Project status" result={store.resultOf('projectStatus')} />
    <StateNote label="Project selection" result={store.resultOf('projectUse')} />
  </section>

  <!-- Foreman -->
  <section class="card" aria-labelledby="wf-foreman">
    <h2 id="wf-foreman">Foreman</h2>
    {#if store.ownerGaps.includes('foreman')}
      <p class="gap">
        Owner gap: Focusa Spec 182 Project Foreman has no daemon operation yet (UP-01).
        Workforce will not fabricate a Foreman. Closest real surface is the Workstream role-profile list.
      </p>
    {/if}
    <StateNote label="Role profiles" result={store.resultOf('roles')} />
    {#if store.foremanProfiles.length === 0}
      <p class="muted">No role profile bound to this Workstream.</p>
    {:else}
      <ul class="plain">
        {#each store.foremanProfiles as profile (profile.role_profile_id ?? profile.id ?? profile.role)}
          <li><strong>{profile.role ?? profile.role_profile_id ?? 'role'}</strong> — {profile.state ?? ''}</li>
        {/each}
      </ul>
    {/if}
  </section>

  <!-- Frontier / trajectory -->
  <section class="card" aria-labelledby="wf-frontier">
    <h2 id="wf-frontier">Frontier</h2>
    <p class="source {store.trajectoryView.authoritative ? 'authoritative' : 'stopgap'}">
      {store.trajectoryView.disclosure}
    </p>
    <StateNote label="Trajectory" result={store.resultOf('trajectory')} />
    {#if store.trajectoryView.authoritative}
      <dl class="facts">
        <dt>HLT</dt><dd>{store.trajectoryView.ladder.hltRef ?? '—'}</dd>
        <dt>Current</dt><dd>{store.trajectoryView.ladder.current?.id ?? store.trajectoryView.ladder.current ?? '—'}</dd>
        <dt>Next</dt><dd>{store.trajectoryView.ladder.next?.id ?? store.trajectoryView.ladder.next ?? '—'}</dd>
        <dt>Revision</dt><dd>{store.trajectoryView.ladder.revision ?? '—'}</dd>
      </dl>
    {:else}
      <dl class="facts">
        <dt>Workpoint</dt><dd>{store.trajectoryView.ladder.currentWorkpoint ?? '—'}</dd>
        <dt>Authority</dt><dd>{store.trajectoryView.ladder.reconciliation.authorityForNextAction ?? '—'}</dd>
        <dt>Gap</dt><dd>{store.trajectoryView.ladder.gap ?? '—'}</dd>
        <dt>Missing</dt><dd>{store.trajectoryView.ladder.clarityBlocking.join(', ') || '—'}</dd>
        <dt>Next step</dt><dd class="tiny">{store.trajectoryView.ladder.nextAction ?? '—'}</dd>
      </dl>
      <p class="muted tiny">
        Ladder values are not invented: they come from the owner's workpoint anchor,
        clarity gate and reconciliation fields until Focusa's projection reports the
        committed ladder ({store.trajectoryView.failureClass ?? 'not committed'}).
      </p>
    {/if}
    <StateNote label="Workpoint" result={store.resultOf('workpoint')} />
    <StateNote label="Work loop" result={store.resultOf('workLoop')} />
  </section>

  <!-- Direction -->
  <section class="card" aria-labelledby="wf-direction">
    <h2 id="wf-direction">Direction</h2>
    {#if !steerTarget}
      <p class="gap">
        Owner reports no session instance yet, so there is no exact target (session · run · generation)
        to address. Bind one from any authoritative surface to direct work now — the owner's roster
        takes over automatically as soon as it reports a target.
      </p>
      <form onsubmit={(event) => { event.preventDefault(); const r = store.bindTarget(bindInput); bindResult = r.ok ? `bound ${r.label}` : r.error; if (r.ok) bindInput = ''; }}>
        <input
          type="text"
          aria-label="Exact owner target"
          placeholder="session_id:run_id:generation  (or paste JSON)"
          bind:value={bindInput}
        />
        <button type="submit" disabled={!bindInput.trim()}>Bind target</button>
      </form>
      {#if bindResult}<p class="muted tiny">{bindResult}</p>{/if}
    {:else}
      <p class="muted tiny">
        target: <code>{steerTarget.session_id}</code> run <code>{steerTarget.run_id}</code> gen <code>{steerTarget.generation}</code>
        · source: {store.directionTargetOrigin === 'owner_roster' ? 'Focusa roster (authoritative)' : 'operator binding (stopgap)'}
        {#if store.directionTargetOrigin === 'operator_binding'}
          <button type="button" onclick={() => store.clearBoundTarget()}>clear</button>
        {/if}
      </p>
      <p class="muted tiny">
        target: <code>{steerTarget.session_id}</code> run <code>{steerTarget.run_id}</code> gen <code>{steerTarget.generation}</code>
      </p>
      <form onsubmit={submitDirection}>
        <textarea
          rows="3"
          aria-label="Direction instruction"
          placeholder="Direct this Foreman…"
          bind:value={instruction}
          disabled={store.directing}
        ></textarea>
        <button type="submit" disabled={store.directing || !instruction.trim()}>
          {store.directing ? 'Submitting…' : 'Send Direction'}
        </button>
      </form>
      <div class="row">
        {#each ['start', 'pause', 'resume', 'cancel'] as action (action)}
          <button
            type="button"
            disabled={store.directing}
            onclick={() => store.controlSession({ action, target: steerTarget })}
          >{action}</button>
        {/each}
        <span class="muted tiny">governed owner operations on the exact target</span>
      </div>
    {/if}
    {#if store.lastDirection}
      <p class="muted tiny">
        {#if store.lastDirection.ok}
          owner accepted steer · status {store.lastDirection.status ?? 'ok'}{#if store.lastDirection.approval} · approval {store.lastDirection.approval}{/if}
        {:else}
          owner rejected: {store.lastDirection.kind} — {store.lastDirection.message}
        {/if}
      </p>
    {/if}
  </section>

  <!-- Activity: what the owner reports happening now -->
  <section class="card" aria-labelledby="wf-activity">
    <h2 id="wf-activity">Activity</h2>
    <p class="muted tiny">most recent events Focusa reported for this project scope (owner-sourced)</p>
    {#if store.activity.length === 0}
      <p class="muted">Focusa has not reported recent activity for this scope.</p>
    {:else}
      <ul class="plain">
        {#each store.activity.slice(0, 12) as event (event.id ?? `${event.type}-${event.timestamp}`)}
          <li>
            <strong>{event.type ?? 'event'}</strong>
            {#if event.observation}<span class="badge">observation</span>{/if}
            <span class="muted tiny">{event.timestamp ?? ''}{#if event.origin} · {event.origin}{/if}{#if event.sessionId} · session {event.sessionId.slice(0, 8)}{/if}</span>
          </li>
        {/each}
      </ul>
    {/if}
    <StateNote label="Events" result={store.resultOf('events')} />
  </section>

  <!-- Evidence -->
  <section class="card" aria-labelledby="wf-evidence">
    <h2 id="wf-evidence">Evidence</h2>
    <p class="source {store.evidenceTrail.authoritative ? 'authoritative' : 'stopgap'}">{store.evidenceTrail.disclosure}</p>
    {#if store.evidenceTrail.entries.length === 0}
      <p class="muted">Focusa has not reported an evidence or receipt reference for this scope yet.</p>
    {:else}
      <ul class="plain">
        {#each store.evidenceTrail.entries as entry (`${entry.kind}:${entry.ref}`)}
          <li>
            <span class="badge">{entry.kind}</span>
            <code>{entry.ref}</code>
            <span class="muted tiny">via {entry.source}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <!-- People -->
  <section class="card" aria-labelledby="wf-people-h">
    <h2 id="wf-people-h" class="wf-section-label">People</h2>
    <RosterList
      roster={store.roster}
      result={store.resultOf('sessions')}
      selectedId={store.selectedSessionId}
      onSelect={(entry) => store.selectSession(entry.id ?? '')}
    />
    <StateNote label="Selected person" result={store.resultOf('sessionStatus')} />
    {#if steerTarget}
      <div class="row">
        <button type="button" onclick={() => store.loadOutput({ reset: true })} disabled={store.directing}>Load output</button>
        <span class="muted tiny">owner-reported {store.outputLines.length ? `${store.outputLines.length} line(s)` : 'output (none yet)'}</span>
      </div>
      {#if store.outputLines.length}
        <pre class="output" aria-label="Owner-reported session output">{outputText}</pre>
      {/if}
      <StateNote label="Output" result={store.resultOf('output')} />
    {/if}
    <StateNote label="Session profiles" result={store.resultOf('profiles')} />
    {#if store.sessionProfiles.length || store.sessionPresets.length}
      <details class="capability">
        <summary>Owner session capability ({store.sessionProfiles.length} profile(s), {store.sessionPresets.length} preset(s))</summary>
        <ul class="plain">
          {#each store.sessionProfiles as profile (profile.profile_id ?? profile.description)}
            <li><strong>{profile.profile_id ?? 'profile'}</strong> — {profile.description ?? ''}</li>
          {/each}
          {#each store.sessionPresets as preset (preset.preset_id)}
            <li><strong>{preset.preset_id}</strong> — {preset.description ?? ''}</li>
          {/each}
        </ul>
      </details>
    {/if}
    <div class="row">
      <button type="button" onclick={async () => { sessionPreparation = await store.prepareSession({ displayName: sessionName }); }} disabled={!store.workstream}>
        Prepare a work session
      </button>
      <span class="muted tiny">uses the owner's role profile and profile defaults; never invents identity</span>
    </div>
    {#if sessionPreparation?.ok}
      <p class="source authoritative">preflight accepted · config {sessionPreparation.preflight.redacted_config_hash.slice(0, 12)}… — creation is a separate governed step</p>
    {:else if sessionPreparation?.blocker}
      <p class="gap">
        {sessionPreparation.blocker.reason}
        Owner operations that satisfy it: {sessionPreparation.blocker.ownerOperations.join(', ')}.
      </p>
    {:else if sessionPreparation?.error}
      <p class="gap">{sessionPreparation.error}</p>
    {/if}
    {#if store.resultOf('sessions')?.state === 'ok' && store.roster.length === 0}
      <p class="muted tiny">
        Focusa silent sessions are available (profiles/presets above) but this environment has no
        session instance yet, so there is no exact target (session · run · generation) to address
        Direction to. Creating one is the owner's operation — Workforce never invents a target.
      </p>
    {/if}
  </section>

  {#if store.anyBlocked}
    <p class="gap">
      This environment's entitlement policy is denying canonical operations. Workforce shows owner
      projections only; activate or repair the owner lease to restore full operation.
    </p>
  {/if}
</main>

<style>
  .skip {
    position: absolute; left: -9999px; top: 0; background: var(--bg-surface);
    padding: var(--space-tight) var(--space-compact); border-radius: var(--radius-sm); z-index: 10;
  }
  .skip:focus { left: var(--space-compact); top: var(--space-tight); }
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }

  main {
    max-width: 880px;
    margin: 0 auto;
    padding: var(--space-section) var(--page-gutter) var(--space-page);
    display: grid;
    gap: var(--space-compact);
  }

  .app-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-standard); flex-wrap: wrap; }
  h1 { font-size: var(--text-page-title); line-height: var(--leading-page-title); font-weight: var(--weight-bold); margin: 0; }
  .sub { margin: var(--space-micro) 0 0; font-size: var(--text-small); color: var(--text-secondary); display: flex; gap: var(--space-tight); align-items: center; flex-wrap: wrap; }
  .stamp { font-family: var(--font-mono); font-size: var(--text-micro); color: var(--text-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-pill); padding: 1px var(--space-tight); }
  .live { font-size: var(--text-micro); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.06em; border-radius: var(--radius-pill); padding: 1px var(--space-tight); border: 1px solid currentColor; }
  .live.live { color: var(--success); }
  .live.replaying { color: var(--warning); }
  .live.unavailable, .live.unauthorized { color: var(--danger); }

  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: var(--space-roomy);
    display: grid;
    gap: var(--space-tight);
    box-shadow: var(--elevation-card);
  }
  h2 {
    font-size: var(--text-micro);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0;
  }

  .row { display: flex; gap: var(--space-tight); align-items: center; flex-wrap: wrap; }
  input, select, textarea {
    font: inherit; font-size: var(--text-small); color: var(--text-primary);
    background: var(--bg-surface); border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm); padding: var(--space-tight) var(--space-compact);
    min-height: 32px; min-width: 0;
  }
  input::placeholder, textarea::placeholder { color: var(--text-muted); }
  input { flex: 1 1 240px; }
  textarea { width: 100%; resize: vertical; margin-bottom: var(--space-tight); line-height: var(--leading-body); }
  button {
    font: inherit; font-size: var(--text-small); font-weight: var(--weight-medium);
    color: var(--text-primary); background: var(--bg-surface);
    border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
    padding: var(--space-tight) var(--space-compact); min-height: 32px; cursor: pointer;
  }
  button:hover { background: var(--bg-hover); }
  button:disabled { color: var(--text-disabled); background: var(--bg-subtle); cursor: default; }
  form button[type='submit'] { background: var(--accent); border-color: var(--accent); color: var(--text-inverse); }
  form button[type='submit']:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
  form button[type='submit']:disabled { background: var(--bg-subtle); border-color: var(--border-default); }

  .muted { font-size: var(--text-small); color: var(--text-secondary); margin: 0; }
  .tiny { font-size: var(--text-micro); }
  .source {
    font-size: var(--text-micro);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.02em;
    margin: 0;
    padding: var(--space-micro) var(--space-tight);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--text-muted);
    background: var(--bg-subtle);
    color: var(--text-secondary);
  }
  .source.authoritative { border-left-color: var(--success); background: var(--success-subtle); color: var(--text-primary); }
  .source.stopgap { border-left-color: var(--warning); background: var(--warning-subtle); color: var(--text-primary); }
  .gap {
    border-left: 3px solid var(--warning);
    background: var(--warning-subtle);
    color: var(--text-primary);
    padding: var(--space-tight) var(--space-compact);
    font-size: var(--text-small);
    border-radius: var(--radius-sm);
    margin: 0;
  }
  .facts { display: grid; grid-template-columns: 96px 1fr; gap: 2px var(--space-tight); margin: var(--space-micro) 0 0; font-size: var(--text-small); }
  .facts dt { color: var(--text-muted); }
  .facts dd { margin: 0; font-variant-numeric: tabular-nums; }
  .plain { margin: var(--space-micro) 0 0 var(--space-standard); padding: 0; font-size: var(--text-small); display: grid; gap: var(--space-micro); }
  .plain button { padding: 3px var(--space-tight); font-size: var(--text-micro); margin-left: var(--space-tight); min-height: 24px; }
  .output {
    max-height: 260px; overflow: auto; margin: 0;
    padding: var(--space-compact); border: 1px solid var(--border-default);
    border-radius: var(--radius-sm); background: var(--bg-subtle);
    font-family: var(--font-mono); font-size: var(--text-micro); line-height: 1.5;
    white-space: pre-wrap; overflow-wrap: anywhere;
  }
  .badge {
    display: inline-block; padding: 1px var(--space-tight); margin-right: var(--space-tight);
    border: 1px solid var(--border-default); border-radius: var(--radius-pill);
    font-size: var(--text-micro); text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text-secondary); background: var(--bg-subtle);
  }
  .capability { font-size: var(--text-small); }
  .capability summary { cursor: pointer; color: var(--text-secondary); }

  @media (max-width: 479px) {
    main { padding: var(--space-roomy) var(--page-gutter) var(--space-section); }
    h1 { font-size: var(--text-display); line-height: var(--leading-display); }
    .card { padding: var(--space-standard); }
    .app-head { align-items: stretch; }
    .app-head > button { width: 100%; }
    .facts { grid-template-columns: 1fr; gap: 0; }
  }
</style>
