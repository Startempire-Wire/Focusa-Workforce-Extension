<script>
  /**
   * Focusa Workforce — full page.
   *
   * One shared runtime client serves every panel; nothing here owns canonical
   * state. Each section shows the owning operation's result with its honest
   * state, and each stopgap (see AGENTS.md stopgap doctrine) is labelled with
   * the source that answered and the owner's own reason.
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
  let scanFrom = $state('~/src');
  let bindInput = $state('');
  let bindResult = $state('');
  let pairUrl = $state('');
  let pairLabel = $state('');
  let sessionName = $state('');
  let sessionPreparation = $state(null);

  const liveMessage = $derived(
    store.streamState
      ? `owner stream ${store.streamState.phase}${store.lastEventAt ? `, last event ${store.lastEventAt}` : ''}`
      : 'owner stream idle',
  );

  // Direction addresses an exact owner target: the owner's roster when it reports
  // one, otherwise an operator binding (labelled stopgap).
  const steerTarget = $derived(store.directionTarget);
  const outputText = $derived(store.outputLines.join('\n'));

  const counts = $derived({
    people: store.roster.length,
    needsYou: store.needsYou.items.length,
    evidence: store.evidenceTrail.entries.length,
    activity: store.activity.length,
  });

  onMount(async () => {
    await store.refreshEnvironments();
    if (store.active) {
      await store.refreshOwner();
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

  function bindTarget(event) {
    event.preventDefault();
    const result = store.bindTarget(bindInput);
    bindResult = result.ok ? `bound ${result.label}` : result.error;
    if (result.ok) bindInput = '';
  }

  async function prepareSession() {
    sessionPreparation = await store.prepareSession({ displayName: sessionName });
  }
</script>

<main>
  <a class="skip" href="#wf-workstream">Skip to Workstream</a>
  <div class="sr-only" role="status" aria-live="polite">{liveMessage}</div>

  <header class="app-head">
    <div class="brand">
      <span class="mark" aria-hidden="true">F</span>
      <div>
        <p class="wf-section-label">Focusa Workforce</p>
        <h1>{store.projectDashboard?.selected?.root?.split('/').filter(Boolean).pop() ?? 'Workforce operations'}</h1>
        <p class="sub">
          <span class="stamp" title="loaded build">{buildStamp}</span>
          {#if store.streamState}
            <span class="live {store.streamState.phase}" title={store.lastEventAt ? `last owner event ${store.lastEventAt}` : 'no owner event yet'}>
              {store.streamState.phase}
            </span>
          {/if}
          {#if store.active}
            <span class="muted tiny">{store.active.label}</span>
            {#if store.health?.version}<span class="muted tiny">Focusa {store.health.version}</span>{/if}
          {/if}
        </p>
      </div>
    </div>
    <button type="button" class="wf-btn" onclick={() => store.refreshOwner()} disabled={!store.active}>Refresh</button>
  </header>

  {#if store.bootError}
    <StateNote label="Extension" result={{ state: 'error', note: store.bootError }} />
  {/if}

  <!-- Status strip: the four numbers an operator scans first -->
  <ul class="strip">
    <li class="attention">
      <span class="num">{counts.needsYou}</span>
      <span class="cap">Needs You</span>
    </li>
    <li>
      <span class="num">{counts.people}</span>
      <span class="cap">People</span>
    </li>
    <li>
      <span class="num">{counts.activity}</span>
      <span class="cap">Signals</span>
    </li>
    <li>
      <span class="num">{counts.evidence}</span>
      <span class="cap">Evidence refs</span>
    </li>
    <li class="wide">
      <span class="cap">Entitlement</span>
      <span class="value">{store.entitlementState ?? 'unknown'}</span>
    </li>
  </ul>

  <div class="layout">
    <div class="col">
      <!-- Needs You -->
      <section class="card needs-you" aria-labelledby="wf-needs">
        <div class="card-head">
          <h2 id="wf-needs">Needs You</h2>
          <span class="count-chip">{counts.needsYou}</span>
        </div>
        <p class="source {store.needsYou.authoritative ? 'authoritative' : 'stopgap'}">{store.needsYou.disclosure}</p>
        {#if store.needsYou.items.length === 0}
          <p class="empty">Nothing needs a human decision in this scope right now.</p>
        {:else}
          <ul class="items">
            {#each store.needsYou.items as item (`${item.kind}:${item.label}`)}
              <li>
                <span class="kind">{item.kind.replace('_', ' ')}</span>
                <strong>{item.label}</strong>
                {#if item.detail}<span class="detail">{item.detail}</span>{/if}
                <span class="muted tiny">via {item.source}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <!-- Workstream scope -->
      <section class="card" id="wf-workstream" aria-labelledby="wf-workstream-h">
        <div class="card-head">
          <h2 id="wf-workstream-h">Workstream</h2>
          {#if store.workstream}<span class="count-chip">{store.workstream.continuityId}</span>{/if}
        </div>
        <p class="muted tiny">
          Focusa identity axes: project folder (project boundary) + continuity id (logical Workstream).
        </p>

        {#if store.projectSelectionRequired}
          <p class="gap">Focusa requires a project selection before Workstream state is available.</p>
        {/if}

        {#if store.projectDashboard?.projects?.length}
          <div class="row">
            <label class="field">
              <span>Project</span>
              <select onchange={(e) => e.currentTarget.value && store.useProject(e.currentTarget.value)}>
                <option value="">Select a project…</option>
                {#each store.projectDashboard.projects as project (project.root)}
                  <option value={project.root} selected={project.root === store.selection.projectRoot}>
                    {project.name}{#if project.stack} · {project.stack}{/if}
                  </option>
                {/each}
              </select>
            </label>
          </div>
        {/if}

        <div class="row">
          <label class="field grow">
            <span>Scan directory</span>
            <input type="text" aria-label="Directory to scan for projects" placeholder="directory to scan" bind:value={scanFrom} />
          </label>
          <button type="button" class="wf-btn" onclick={() => store.discoverProjects(scanFrom)} disabled={store.projectBusy || !store.active}>
            {store.projectBusy ? 'Asking Focusa…' : 'Scan for projects'}
          </button>
        </div>

        {#if store.discovered.length}
          <ul class="items compact">
            {#each store.discovered as project (project.root)}
              <li>
                <strong>{project.name}</strong>
                <code>{project.root}</code>
                {#if project.stack}<span class="muted tiny">{project.stack}</span>{/if}
                <button type="button" class="wf-btn" onclick={() => store.useProject(project.root)} disabled={store.projectBusy}>Use</button>
              </li>
            {/each}
          </ul>
        {:else if store.resultOf('discover')}
          <StateNote label="Discovery" result={store.resultOf('discover')} />
        {/if}

        <div class="row">
          <label class="field grow">
            <span>Project folder</span>
            <input
              type="text"
              aria-label="Project root"
              placeholder="/absolute/project/root"
              value={store.selection.projectRoot}
              onchange={(e) => store.setSelection({ projectRoot: e.currentTarget.value.trim() })}
            />
          </label>
          <label class="field">
            <span>Continuity (Workstream)</span>
            <input
              type="text"
              aria-label="Continuity id (Workstream)"
              placeholder="continuity id"
              value={store.selection.continuityId}
              onchange={(e) => store.setSelection({ continuityId: e.currentTarget.value.trim() })}
            />
          </label>
        </div>

        <StateNote label="Projects" result={store.resultOf('projects')} />
        <StateNote label="Project identity" result={store.resultOf('project')} />
        <StateNote label="Project status" result={store.resultOf('projectStatus')} />
      </section>

      <!-- Foreman -->
      <section class="card" aria-labelledby="wf-foreman">
        <div class="card-head">
          <h2 id="wf-foreman">Foreman</h2>
          <span class="count-chip">{store.foremanProfiles.length}</span>
        </div>
        {#if store.ownerGaps.includes('foreman')}
          <p class="gap">
            Owner gap: Focusa has no Project Foreman operation yet, so Workforce will not invent one.
            Closest real surface is the Workstream role-profile list below.
          </p>
        {/if}
        {#if store.foremanProfiles.length === 0}
          <p class="empty">No role profile bound to this Workstream.</p>
        {:else}
          <ul class="items compact">
            {#each store.foremanProfiles as profile (profile.role_profile_id ?? profile.id ?? profile.role)}
              <li><strong>{profile.role ?? profile.role_profile_id ?? 'role'}</strong><span class="detail">{profile.state ?? ''}</span></li>
            {/each}
          </ul>
        {/if}
        <StateNote label="Role profiles" result={store.resultOf('roles')} />
      </section>

      <!-- Frontier -->
      <section class="card" aria-labelledby="wf-frontier">
        <h2 id="wf-frontier">Frontier</h2>
        <p class="source {store.trajectoryView.authoritative ? 'authoritative' : 'stopgap'}">{store.trajectoryView.disclosure}</p>
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
          </dl>
          <p class="muted tiny">
            Values come from the owner's workpoint anchor, clarity gate and reconciliation fields —
            nothing is invented while its projection reports no committed ladder.
          </p>
        {/if}
        <StateNote label="Trajectory" result={store.resultOf('trajectory')} />
        <StateNote label="Workpoint" result={store.resultOf('workpoint')} />
        <StateNote label="Work loop" result={store.resultOf('workLoop')} />
      </section>

      <!-- Direction -->
      <section class="card" aria-labelledby="wf-direction">
        <h2 id="wf-direction">Direction</h2>
        {#if !store.workstream}
          <p class="empty">Select a Workstream to address Direction.</p>
        {:else if !steerTarget}
          <p class="gap">
            Focusa reports no session instance yet, so there is no exact target
            (session · run · generation) to address. Bind one from any authoritative
            surface to direct work now — the owner's roster takes over automatically.
          </p>
          <form onsubmit={bindTarget} class="row">
            <label class="field grow">
              <span>Exact target</span>
              <input type="text" aria-label="Exact owner target" placeholder="session_id:run_id:generation (or JSON)" bind:value={bindInput} />
            </label>
            <button type="submit" class="wf-btn" disabled={!bindInput.trim()}>Bind target</button>
          </form>
          {#if bindResult}<p class="muted tiny">{bindResult}</p>{/if}
        {:else}
          <p class="target">
            <code>{steerTarget.session_id}</code>
            <span>run <code>{steerTarget.run_id}</code></span>
            <span>gen <code>{steerTarget.generation}</code></span>
            <span class="origin {store.directionTargetOrigin}">
              {store.directionTargetOrigin === 'owner_roster' ? 'Focusa roster (authoritative)' : 'operator binding (stopgap)'}
            </span>
            {#if store.directionTargetOrigin === 'operator_binding'}
              <button type="button" class="wf-btn" onclick={() => store.clearBoundTarget()}>clear</button>
            {/if}
          </p>
          <form onsubmit={submitDirection}>
            <textarea rows="3" aria-label="Direction instruction" placeholder="Direct this work…" bind:value={instruction} disabled={store.directing}></textarea>
            <div class="row">
              <button type="submit" class="wf-btn wf-btn-primary" disabled={store.directing || !instruction.trim()}>
                {store.directing ? 'Submitting…' : 'Send Direction'}
              </button>
              {#each ['start', 'pause', 'resume', 'cancel'] as action (action)}
                <button type="button" class="wf-btn" disabled={store.directing} onclick={() => store.controlSession({ action, target: steerTarget })}>
                  {action}
                </button>
              {/each}
            </div>
          </form>
          <div class="row">
            <button type="button" class="wf-btn" onclick={() => store.loadOutput({ reset: true })} disabled={store.directing}>Load output</button>
            <span class="muted tiny">owner-reported output ({store.outputLines.length} line(s))</span>
          </div>
          {#if store.outputLines.length}
            <pre class="output" aria-label="Owner-reported session output">{outputText}</pre>
          {/if}
          <StateNote label="Output" result={store.resultOf('output')} />
        {/if}
        {#if store.lastDirection}
          <p class="muted tiny">
            {#if store.lastDirection.ok}
              Focusa accepted {store.lastDirection.action}{#if store.lastDirection.status} · {store.lastDirection.status}{/if}{#if store.lastDirection.approval} · approval {store.lastDirection.approval}{/if}
            {:else}
              Focusa rejected: {store.lastDirection.kind} — {store.lastDirection.message}
            {/if}
          </p>
        {/if}
      </section>
    </div>

    <aside class="col">
      <!-- Environment -->
      <section class="card" aria-labelledby="wf-env">
        <h2 id="wf-env">Environment</h2>
        {#if store.environments.length === 0}
          <p class="empty">No paired Focusa environment.</p>
        {:else}
          <label class="field">
            <span>Active</span>
            <select value={store.activeId} onchange={(e) => store.setEnvironment(e.currentTarget.value)}>
              {#each store.environments as env (env.id)}
                <option value={env.id}>{env.label} — {env.baseUrl}</option>
              {/each}
            </select>
          </label>
        {/if}
        <StateNote label="Health" result={store.resultOf('health')} />
        <StateNote label="Entitlement" result={store.resultOf('license')} />
        <div class="row">
          <button type="button" class="wf-btn" onclick={connectLocal} disabled={store.environments.some((e) => e.kind === 'local')}>
            {store.environments.some((e) => e.kind === 'local') ? 'Local daemon connected' : 'Use the daemon on this device'}
          </button>
        </div>
        {#if environmentError}<p class="gap">{environmentError}</p>{/if}

        <details class="capability">
          <summary>Pair a Focusa daemon</summary>
          {#if !store.pairing}
            <form onsubmit={(event) => { event.preventDefault(); store.beginPairing({ baseUrl: pairUrl, label: pairLabel || 'Focusa daemon' }); }}>
              <label class="field">
                <span>Daemon URL</span>
                <input type="text" aria-label="Daemon URL" placeholder="https://daemon.example:8787" bind:value={pairUrl} />
              </label>
              <label class="field">
                <span>Label</span>
                <input type="text" aria-label="Environment label" placeholder="label (optional)" bind:value={pairLabel} />
              </label>
              <button type="submit" class="wf-btn" disabled={store.pairingBusy || !pairUrl.trim()}>Start pairing</button>
            </form>
          {:else if store.pairing.state === 'awaiting_approval'}
            <p class="muted tiny">Approve on the daemon: <code>{store.pairing.operator_command ?? store.pairing.code}</code></p>
            <p class="muted tiny">expires {store.pairing.expires_at}</p>
            <button type="button" class="wf-btn" onclick={() => store.cancelPairing()}>Cancel</button>
          {:else}
            <p class="gap">pairing {store.pairing.state}</p>
            <button type="button" class="wf-btn" onclick={() => store.cancelPairing()}>Reset</button>
          {/if}
          {#if store.pairingError}<p class="gap">{store.pairingError}</p>{/if}
        </details>
      </section>

      <!-- People -->
      <section class="card" aria-labelledby="wf-people-h">
        <div class="card-head">
          <h2 id="wf-people-h">People</h2>
          <span class="count-chip">{counts.people}</span>
        </div>
        <RosterList
          roster={store.roster}
          result={store.resultOf('sessions')}
          selectedId={store.selectedSessionId}
          onSelect={(entry) => store.selectSession(entry.id ?? '')}
        />
        <StateNote label="Selected person" result={store.resultOf('sessionStatus')} />
        <StateNote label="Session profiles" result={store.resultOf('profiles')} />

        <div class="row">
          <label class="field grow">
            <span>New session name</span>
            <input type="text" aria-label="New session name" placeholder="optional display name" bind:value={sessionName} />
          </label>
          <button type="button" class="wf-btn" onclick={prepareSession} disabled={!store.workstream}>Prepare session</button>
        </div>
        {#if sessionPreparation?.ok}
          <p class="source authoritative">
            preflight accepted · config {sessionPreparation.preflight.redacted_config_hash.slice(0, 12)}… — creation is a separate governed step
          </p>
        {:else if sessionPreparation?.blocker}
          <p class="gap">
            {sessionPreparation.blocker.reason}
            Owner operations that satisfy it: {sessionPreparation.blocker.ownerOperations.join(', ')}.
          </p>
        {:else if sessionPreparation?.error}
          <p class="gap">{sessionPreparation.error}</p>
        {/if}

        {#if store.sessionProfiles.length || store.sessionPresets.length}
          <details class="capability">
            <summary>Owner session capability ({store.sessionProfiles.length} profile(s), {store.sessionPresets.length} preset(s))</summary>
            <ul class="items compact">
              {#each store.sessionProfiles as profile (profile.profile_id ?? profile.description)}
                <li><strong>{profile.profile_id ?? 'profile'}</strong><span class="detail">{profile.description ?? ''}</span></li>
              {/each}
              {#each store.sessionPresets as preset (preset.preset_id)}
                <li><strong>{preset.preset_id}</strong><span class="detail">{preset.description ?? ''}</span></li>
              {/each}
            </ul>
          </details>
        {/if}
      </section>

      <!-- Activity -->
      <section class="card" aria-labelledby="wf-activity">
        <div class="card-head">
          <h2 id="wf-activity">Activity</h2>
          <span class="count-chip">{counts.activity}</span>
        </div>
        {#if store.activity.length === 0}
          <p class="empty">Focusa has not reported recent activity for this scope.</p>
        {:else}
          <ul class="items compact">
            {#each store.activity.slice(0, 10) as event (event.id ?? `${event.type}-${event.timestamp}`)}
              <li>
                <strong>{event.type ?? 'event'}</strong>
                {#if event.observation}<span class="kind">observation</span>{/if}
                <span class="muted tiny">{event.timestamp ?? ''}{#if event.origin} · {event.origin}{/if}</span>
              </li>
            {/each}
          </ul>
        {/if}
        <StateNote label="Events" result={store.resultOf('events')} />
      </section>

      <!-- Evidence -->
      <section class="card" aria-labelledby="wf-evidence">
        <div class="card-head">
          <h2 id="wf-evidence">Evidence</h2>
          <span class="count-chip">{counts.evidence}</span>
        </div>
        <p class="source {store.evidenceTrail.authoritative ? 'authoritative' : 'stopgap'}">{store.evidenceTrail.disclosure}</p>
        {#if store.evidenceTrail.entries.length === 0}
          <p class="empty">Focusa has not reported an evidence or receipt reference for this scope.</p>
        {:else}
          <ul class="items compact">
            {#each store.evidenceTrail.entries as entry (`${entry.kind}:${entry.ref}`)}
              <li>
                <span class="kind {entry.kind}">{entry.kind}</span>
                <code>{entry.ref}</code>
                <span class="muted tiny">via {entry.source}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </aside>
  </div>

  {#if store.anyBlocked}
    <p class="gap">
      Focusa's entitlement policy is denying some canonical operations. Workforce shows only what the
      owner returns; activate or repair the owner lease to restore full operation.
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
    max-width: 1280px;
    margin: 0 auto;
    padding: var(--space-section) var(--page-gutter) var(--space-page);
    display: grid;
    gap: var(--space-standard);
  }

  .app-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-standard); flex-wrap: wrap; }
  .brand { display: flex; gap: var(--space-compact); align-items: flex-start; }
  .mark {
    display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px;
    border-radius: var(--radius-md); background: var(--accent); color: var(--text-inverse);
    font-weight: var(--weight-bold); font-size: 18px;
  }
  h1 { font-size: var(--text-page-title); line-height: var(--leading-page-title); font-weight: var(--weight-bold); margin: 2px 0 0; }
  .sub { margin: var(--space-micro) 0 0; font-size: var(--text-small); color: var(--text-secondary); display: flex; gap: var(--space-tight); align-items: center; flex-wrap: wrap; }
  .stamp { font-family: var(--font-mono); font-size: var(--text-micro); color: var(--text-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-pill); padding: 1px var(--space-tight); }
  .live { font-size: var(--text-micro); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.06em; border-radius: var(--radius-pill); padding: 1px var(--space-tight); border: 1px solid currentColor; }
  .live.live { color: var(--success); }
  .live.replaying { color: var(--warning); }
  .live.unavailable, .live.unauthorized { color: var(--danger); }

  .strip {
    list-style: none; margin: 0; padding: var(--space-compact) var(--space-standard);
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; gap: var(--space-standard);
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: var(--radius-md); box-shadow: var(--elevation-card);
  }
  .strip li { display: grid; gap: 2px; min-width: 0; }
  .strip .num { font-size: var(--text-display); line-height: var(--leading-display); font-weight: var(--weight-bold); font-variant-numeric: tabular-nums; }
  .strip .cap { font-size: var(--text-micro); text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
  .strip .value { font-size: var(--text-body); font-weight: var(--weight-semibold); }
  .strip .attention .num { color: var(--violet); }

  .layout { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: var(--space-standard); align-items: start; }
  .col { display: grid; gap: var(--space-standard); min-width: 0; }

  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: var(--space-roomy);
    display: grid;
    gap: var(--space-tight);
    box-shadow: var(--elevation-card);
    min-width: 0;
  }
  .card-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-tight); }
  h2 {
    font-size: var(--text-micro);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0;
  }
  .count-chip {
    font-size: var(--text-micro); font-weight: var(--weight-semibold);
    color: var(--text-secondary); background: var(--bg-subtle);
    border: 1px solid var(--border-default); border-radius: var(--radius-pill);
    padding: 0 var(--space-tight); font-variant-numeric: tabular-nums;
  }
  .needs-you { border-left: 3px solid var(--violet); }

  .row { display: flex; gap: var(--space-tight); align-items: flex-end; flex-wrap: wrap; }
  .row > button { flex: 0 0 auto; }
  /* Fields are the only width-bearing flex items; inputs never exceed their field,
     which is what let a long placeholder push a button out of the row before. */
  .field { display: grid; gap: 4px; flex: 1 1 16rem; min-width: 0; }
  .field > span { font-size: var(--text-micro); text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-weight: var(--weight-semibold); }
  .field > input, .field > select { width: 100%; min-width: 0; }
  .field.grow { flex: 1 1 20rem; }
  input, select, textarea {
    font: inherit; font-size: var(--text-small); color: var(--text-primary);
    background: var(--bg-surface); border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm); padding: var(--space-tight) var(--space-compact);
    min-height: 32px; min-width: 0;
  }
  input::placeholder, textarea::placeholder { color: var(--text-muted); }
  textarea { resize: vertical; line-height: var(--leading-body); margin-bottom: var(--space-tight); width: 100%; }
  button {
    font: inherit; font-size: var(--text-small); font-weight: var(--weight-medium);
    color: var(--text-primary); background: var(--bg-surface);
    border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
    padding: var(--space-tight) var(--space-compact); min-height: 32px; cursor: pointer;
  }
  button:hover { background: var(--bg-hover); }
  button:disabled { color: var(--text-disabled); background: var(--bg-subtle); cursor: default; }
  .wf-btn-primary { background: var(--accent); border-color: var(--accent); color: var(--text-inverse); }
  .wf-btn-primary:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
  .wf-btn-primary:disabled { background: var(--bg-subtle); border-color: var(--border-default); }

  .muted { font-size: var(--text-small); color: var(--text-secondary); margin: 0; }
  .tiny { font-size: var(--text-micro); }
  .empty { font-size: var(--text-small); color: var(--text-muted); margin: 0; }
  .gap {
    border-left: 3px solid var(--warning); background: var(--warning-subtle);
    color: var(--text-primary); padding: var(--space-tight) var(--space-compact);
    font-size: var(--text-small); border-radius: var(--radius-sm); margin: 0;
  }
  .source {
    font-size: var(--text-micro); font-weight: var(--weight-semibold); margin: 0;
    padding: var(--space-micro) var(--space-tight); border-radius: var(--radius-sm);
    border-left: 3px solid var(--text-muted); background: var(--bg-subtle); color: var(--text-secondary);
  }
  .source.authoritative { border-left-color: var(--success); background: var(--success-subtle); color: var(--text-primary); }
  .source.stopgap { border-left-color: var(--warning); background: var(--warning-subtle); color: var(--text-primary); }

  .items { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-tight); }
  .items li {
    display: flex; flex-wrap: wrap; gap: var(--space-tight); align-items: baseline;
    padding: var(--space-tight) 0; border-bottom: 1px solid var(--border-default);
    font-size: var(--text-small); min-width: 0;
  }
  .items li:last-child { border-bottom: 0; }
  .items .detail { color: var(--text-secondary); font-size: var(--text-small); }
  .kind {
    font-size: var(--text-micro); text-transform: uppercase; letter-spacing: 0.06em;
    font-weight: var(--weight-semibold); color: var(--text-secondary);
    border: 1px solid var(--border-default); border-radius: var(--radius-pill);
    padding: 0 var(--space-tight); background: var(--bg-subtle); white-space: nowrap;
  }
  .kind.evidence { color: var(--info); border-color: var(--info); background: var(--info-subtle); }
  .kind.receipt, .kind.projection { color: var(--settled); border-color: var(--settled); background: var(--settled-subtle); }

  .facts { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 2px var(--space-tight); margin: 0; font-size: var(--text-small); }
  .facts dt { color: var(--text-muted); }
  .facts dd { margin: 0; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }

  .target { display: flex; flex-wrap: wrap; gap: var(--space-tight); align-items: center; font-size: var(--text-small); margin: 0; color: var(--text-secondary); }
  .target .origin { border-radius: var(--radius-pill); padding: 0 var(--space-tight); font-size: var(--text-micro); border: 1px solid currentColor; }
  .target .origin.owner_roster { color: var(--success); }
  .target .origin.operator_binding { color: var(--warning); }

  .output {
    max-height: 260px; overflow: auto; margin: 0;
    padding: var(--space-compact); border: 1px solid var(--border-default);
    border-radius: var(--radius-sm); background: var(--bg-subtle);
    font-family: var(--font-mono); font-size: var(--text-micro); line-height: 1.5;
    white-space: pre-wrap; overflow-wrap: anywhere;
  }
  .capability { font-size: var(--text-small); }
  .capability summary { cursor: pointer; color: var(--text-secondary); margin-bottom: var(--space-tight); }

  @media (max-width: 1000px) {
    .layout { grid-template-columns: minmax(0, 1fr); }
    .strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 479px) {
    main { padding: var(--space-roomy) var(--page-gutter) var(--space-section); }
    h1 { font-size: var(--text-display); line-height: var(--leading-display); }
    .app-head > button { width: 100%; }
    .facts { grid-template-columns: minmax(0, 1fr); }
  }
</style>
