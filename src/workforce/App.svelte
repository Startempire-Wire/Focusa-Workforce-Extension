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
  let selectedSessionId = $state('');
  let environmentError = $state('');
  let scanFrom = $state('~/src');

  const selectedSession = $derived(store.roster.find((r) => r.id === selectedSessionId) ?? null);
  const steerTarget = $derived(
    selectedSession && selectedSession.runId && Number.isSafeInteger(selectedSession.generation) && selectedSession.generation >= 1
      ? { session_id: selectedSession.id, run_id: selectedSession.runId, generation: selectedSession.generation }
      : null,
  );

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
    <button type="button" onclick={() => store.refreshOwner()} disabled={!store.active}>Refresh</button>
  </header>

  {#if store.bootError}
    <StateNote label="Extension" result={{ state: 'error', note: store.bootError }} />
  {/if}

  <!-- Environment -->
  <section class="card">
    <h2>Environment</h2>
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
    {#if environmentError}
      <p class="gap">{environmentError}</p>
    {/if}
  </section>

  <!-- Workstream scope -->
  <section class="card">
    <h2>Workstream</h2>
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
      <input type="text" placeholder="directory to scan" bind:value={scanFrom} />
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
        placeholder="/absolute/project/root"
        value={store.selection.projectRoot}
        onchange={(e) => store.setSelection({ projectRoot: e.currentTarget.value.trim() })}
      />
      <input
        type="text"
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
  <section class="card">
    <h2>Foreman</h2>
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
  <section class="card">
    <h2>Frontier</h2>
    <StateNote label="Trajectory" result={store.resultOf('trajectory')} />
    {#if store.trajectory}
      <dl class="facts">
        <dt>HLT</dt><dd>{store.trajectory.hltRef ?? '—'}</dd>
        <dt>Current</dt><dd>{store.trajectory.current?.id ?? store.trajectory.current ?? '—'}</dd>
        <dt>Next</dt><dd>{store.trajectory.next?.id ?? store.trajectory.next ?? '—'}</dd>
        <dt>Revision</dt><dd>{store.trajectory.revision ?? '—'}</dd>
      </dl>
    {/if}
    <StateNote label="Workpoint" result={store.resultOf('workpoint')} />
    <StateNote label="Work loop" result={store.resultOf('workLoop')} />
  </section>

  <!-- Direction -->
  <section class="card">
    <h2>Direction</h2>
    {#if !selectedSession}
      <p class="muted">Select a person (silent session) to address exact Direction.</p>
    {:else if !steerTarget}
      <p class="gap">
        Owner reports no exact target (run + generation) for this session, so Direction cannot be submitted safely.
        Refresh after the owner reports an active run.
      </p>
    {:else}
      <p class="muted tiny">
        target: <code>{steerTarget.session_id}</code> run <code>{steerTarget.run_id}</code> gen <code>{steerTarget.generation}</code>
      </p>
      <form onsubmit={submitDirection}>
        <textarea
          rows="3"
          placeholder="Direct this Foreman…"
          bind:value={instruction}
          disabled={store.directing}
        ></textarea>
        <button type="submit" disabled={store.directing || !instruction.trim()}>
          {store.directing ? 'Submitting…' : 'Send Direction'}
        </button>
      </form>
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

  <!-- People -->
  <section class="card">
    <RosterList
      roster={store.roster}
      result={store.resultOf('sessions')}
      selectedId={selectedSessionId}
      onSelect={(entry) => { selectedSessionId = entry.id ?? ''; }}
    />
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
  main { max-width: 880px; margin: 0 auto; padding: 24px 20px 48px; display: grid; gap: 14px; }
  .app-head { display: flex; align-items: center; justify-content: space-between; }
  h1 { font-size: 18px; margin: 0; }
  .sub { margin: 2px 0 0; font-size: 12px; opacity: 0.65; }
  .stamp { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; opacity: 0.8; border: 1px solid #30363d; border-radius: 999px; padding: 1px 7px; }
  .live { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; border-radius: 999px; padding: 1px 7px; border: 1px solid currentColor; }
  .live.live { color: #3fb950; }
  .live.replaying { color: #d29922; }
  .live.unavailable, .live.unauthorized { color: #f85149; }
  .card { border: 1px solid #30363d; border-radius: 12px; padding: 14px 16px; display: grid; gap: 6px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 2px; opacity: 0.75; }
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  input, select, textarea { background: #0d1117; color: inherit; border: 1px solid #30363d; border-radius: 8px; padding: 7px 9px; font: inherit; min-width: 0; }
  input { flex: 1 1 240px; }
  textarea { width: 100%; resize: vertical; margin-bottom: 8px; }
  button { background: #21262d; color: inherit; border: 1px solid #30363d; border-radius: 8px; padding: 7px 12px; font: inherit; cursor: pointer; }
  button:disabled { opacity: 0.5; cursor: default; }
  .muted { font-size: 12px; opacity: 0.72; margin: 0; }
  .tiny { font-size: 11px; }
  .gap { border-left: 3px solid #d29922; padding: 6px 10px; background: rgba(210,153,34,0.08); font-size: 12px; border-radius: 6px; }
  .facts { display: grid; grid-template-columns: 90px 1fr; gap: 2px 10px; margin: 4px 0 0; font-size: 12px; }
  .facts dt { opacity: 0.6; }
  .facts dd { margin: 0; }
  .plain { margin: 4px 0 0 16px; padding: 0; font-size: 12px; display: grid; gap: 4px; }
  .capability { font-size: 12px; }
  .capability summary { cursor: pointer; opacity: 0.8; }
  .plain button { padding: 3px 8px; font-size: 11px; margin-left: 6px; }
</style>
