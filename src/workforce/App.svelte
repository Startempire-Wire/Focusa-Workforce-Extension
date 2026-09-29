<script>
  /**
   * Focusa Workforce — Full page (docs/17 §6 shell; §7–§19 faces).
   *
   * Construction rules honoured here (docs/17 §1, §22):
   *   - region order per face is taken from the atlas, never improvised;
   *   - every screen answers Where am I / what matters / what can I do /
   *     what needs me / what can I trust;
   *   - one face, one dominant job (docs/16 §2);
   *   - collapse order is shared priority: scope → attention → primary action
   *     → work → verified → context → diagnostics (docs/17 §1);
   *   - nothing the owner does not report is invented.
   */
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import StateNote from './components/StateNote.svelte';
  import Icon from './components/Icon.svelte';
  import { describeConnection, isAttached } from '../lib/connection.mjs';
  import ConnectionStrip from './components/ConnectionStrip.svelte';
  import { buildRoute, navItemForRoute, parseRoute, ROUTES, INTENTS } from './lib/router.js';
  import { createWorkforceStore } from './lib/workforce-store.svelte.js';
  import { hasDaemonOriginPermission } from '../lib/validation.mjs';
  import { groupRoster } from './lib/roster-groups.js';
  import { evidenceBuckets } from './lib/evidence-buckets.js';
  import { matchingMembers } from './lib/roster-groups.js';

  const store = createWorkforceStore(chrome);

  // docs/17 §21.7: when the OS asks for less motion, every transition collapses
  // to zero duration rather than merely being shorter.
  const reduceMotion = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const enterMs = $derived(reduceMotion ? 0 : 260);
  const enterDy = $derived(reduceMotion ? 0 : 6);

  let route = $state(parseRoute(location.hash).route);
  let ctx = $state(parseRoute(location.hash));
  let railOpen = $state(false);
  let diagCopyLabel = $state('Copy diagnostics');
  /** The workforce shell's own failure record, reload-proof: an empty report
   *  after a dead button is itself the bug, so this must never be empty. */
  async function copyWorkforceDiagnostics() {
    try {
      await navigator.clipboard.writeText(await store.exportDiagnostics());
      diagCopyLabel = 'Copied';
    } catch {
      diagCopyLabel = 'Copy failed';
    } finally {
      setTimeout(() => { diagCopyLabel = 'Copy diagnostics'; }, 1500);
    }
  }
  let instruction = $state('');
  let granularity = $state('full');
  let category = $state('O');
  let peopleFilter = $state('');
  let evidenceFilter = $state('all');
  let auditClass = $state('all');
  let auditActor = $state('');
  let pairUrl = $state('');
  let pairLabel = $state('');
  let scanFrom = $state('~/src');
  let uiaiTokenInput = $state('');
  let uiaiProfile = $state('detect');
  let uiaiModel = $state('');
  let uiaiProvider = $state('');

  /* ── derived scope + counts (docs/17 §1 priority) ── */
  // One connection truth, read from the store (src/lib/connection.mjs), so the
  // header, the strip, the side panel, the start page and the wall all agree.
  const connection = $derived(store.connection);
  const connLabel = $derived(describeConnection(connection).label);
  const connTone = $derived(describeConnection(connection).tone);
  const connDetail = $derived(describeConnection(connection).detail);
  const hasOwner = $derived(isAttached(connection));
  const healthState = $derived(store.resultOf('health')?.state ?? 'no environment');
  const freshClass = $derived(
    !hasOwner ? 'idle'
      : healthState === 'ok' ? 'ok'
        : healthState === 'degraded' ? 'stale' : 'unavailable',
  );
  const freshLabel = $derived(
    !hasOwner ? 'Not connected'
      : healthState === 'ok' ? 'Fresh'
        : healthState === 'degraded' ? 'Degraded' : 'Unavailable',
  );
  const verifiedEntries = $derived(store.evidenceTrail.entries.filter((e) => e.kind === 'receipt' || e.kind === 'projection'));
  const needsItems = $derived(store.needsYou.items);
  const workingNow = $derived(store.roster.filter((r) => /working|active|running/i.test(String(r.state ?? ''))));
  const rosterGroups = $derived(groupRoster(store.roster));
  const buckets = $derived(evidenceBuckets(store.evidenceTrail.entries));
  const shownEvidence = $derived(evidenceFilter === 'all' ? store.evidenceTrail.entries : store.evidenceTrail.entries.filter((e) => e.kind === evidenceFilter));
  const auditRows = $derived(store.activity.filter((e) => {
    if (auditClass === 'decision' && e.observation) return false;
    if (auditClass === 'observation' && !e.observation) return false;
    if (auditActor && e.origin !== auditActor) return false;
    return true;
  }));
  const auditActors = $derived([...new Set(store.activity.map((e) => e.origin).filter(Boolean))]);
  const peopleRows = $derived(peopleFilter ? store.roster.filter((r) => r.state === peopleFilter) : store.roster);
  const handoffCandidates = $derived(ctx.refState === 'ok' ? matchingMembers(store.roster, ctx.ref) : []);
  const steerTarget = $derived(store.directionTarget);
  const navLabel = $derived(navItemForRoute(route));
  const settingsSection = $derived(ctx.params.section ?? 'connections');
  // Which places discovery has actually reached, so the search reads as progress.
  const discoveryPlaces = $derived.by(() => {
    const answers = store.discovery.answers ?? [];
    const answered = new Map(answers.map((a) => [a.baseUrl, a]));
    const pick = (urls) => urls.map((url) => ({ url, ok: answered.get(url)?.ok === true }));
    return [
      { label: 'This device', urls: (store.tailnet?.self?.ips ?? []).map((ip) => `http://${ip}:8787`) },
      { label: 'Loopback', urls: ['http://127.0.0.1:8787', 'http://localhost:8787', 'http://[::1]:8787'] },
    ].map((place) => ({ label: place.label, ok: pick(place.urls).some((u) => u.ok) }));
  });
  const exceptionText = $derived(
    [store.anyBlocked ? 'entitlement policy is denying canonical operations' : '', envError].filter(Boolean).join(' · '),
  );

  /* ── local presentation state ── */
  let envError = $state('');

  function navigate(target) {
    const hash = buildRoute(target, {});
    if (location.hash !== hash) location.hash = hash;
  }

  function onHashChange() {
    route = parseRoute(location.hash).route;
    ctx = parseRoute(location.hash);
  }

  /* ── docs/17 §20 keyboard/focus ── */
  function onKeyDown(event) {
    const t = event.target;
    const typing = Boolean(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable));
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !typing) {
      const el = document.querySelector('[data-local-search]');
      if (el && !el.disabled) { event.preventDefault(); el.focus(); }
      return;
    }
    if ((event.key === 'd' || event.key === 'D') && !event.ctrlKey && !event.metaKey && !event.altKey && !typing) {
      if (route === '#/work' || route === '#/work/detail') {
        const el = document.querySelector('[data-direction]');
        if (el && !el.disabled) { event.preventDefault(); el.focus(); }
      }
      return;
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.altKey && route === '#/work/detail') {
      const el = document.querySelector('[data-direction]');
      if (el && !el.disabled && instruction.trim()) {
        event.preventDefault();
        el.closest('form')?.requestSubmit();
      }
      return;
    }
    if (event.key === 'Escape' && railOpen) { railOpen = false; document.querySelector('.rail-open-btn')?.focus(); }
  }

  onMount(async () => {
    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('keydown', onKeyDown);
    // Preview/debug hook: exposed ONLY outside the packaged extension, so a
    // renderer can drive or inspect the store while building a face.
    if (!globalThis.chrome?.runtime?.id) globalThis.focusaWorkforce = store;
    await store.refreshEnvironments();
    if (store.active) {
      await store.refreshOwner();
      await store.startStream();
    } else {
      // Silent, read-only discovery across loopback, this device's bridges and
      // the tailnet. Attaching stays a single deliberate click.
      await store.discover();
    }
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('keydown', onKeyDown);
      store.stopStream();
    };
  });

  /* ── actions ── */
  async function submitDirection(event) {
    event.preventDefault();
    if (!steerTarget || !instruction.trim()) return;
    await store.direct({ target: steerTarget, instruction: instruction.trim() });
  }

  async function connectLocal() {
    envError = '';
    for (const candidate of localDaemonCandidates()) {
      try { await store.addLocalDaemon(candidate); return; }
      catch (error) { envError = `${candidate} unresolved`; }
    }
  }

  async function saveUiaiToken() { await store.setUiaiToken(uiaiTokenInput); uiaiTokenInput = ''; }
  function useCapture(capture) {
    instruction = (capture.instruction ?? capture.note ?? `Page: ${capture.title ?? ''}`).trim();
    document.querySelector('[data-direction]')?.focus();
  }
  async function openUiai(sessionId) {
    const session = store.uiaiSessions?.[sessionId];
    if (session?.url) { window.open(session.url, '_blank', 'noopener,noreferrer'); return; }
    try { const r = await store.shareUiai(sessionId); if (r?.share_url) window.open(r.share_url, '_blank', 'noopener,noreferrer'); }
    catch (e) { console.error('open UIAI failed', e); }
  }

  const STATE_NOTES = ['health', 'license', 'project', 'trajectory', 'workpoint', 'workLoop', 'events', 'output', 'roles'];
</script>

<div class="shell">
  <a class="skip" href="#wf-main">Skip to main content</a>

  <!-- HEADER (docs/17 §6): Operator · Environment / Project / Workstream · Fresh -->
  <header class="topbar">
    <div class="brand">
      <span class="mark" aria-hidden="true"><Icon name="layers" size={17} /></span>
      <div class="brand-text">
        <p class="wf-section-label">Focusa Workforce</p>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>{store.active?.label ?? 'No environment'}</span>
          {#if store.selection.projectRoot}
            <span class="crumb-sep" aria-hidden="true">/</span>
            <span>{store.selection.projectRoot.split('/').filter(Boolean).pop()}</span>
          {/if}
          {#if store.selection.continuityId}
            <span class="crumb-sep" aria-hidden="true">/</span>
            <span class="crumb-current">{store.selection.continuityId}</span>
          {/if}
        </nav>
      </div>
    </div>
    <div class="topbar-right">
      <button type="button" class="wf-btn rail-open-btn" aria-expanded={railOpen} onclick={() => (railOpen = !railOpen)}>Context</button>
      <span class="posture-chip">{store.entitlementState ?? 'unknown'}</span>
      <button
        type="button"
        class="conn"
        data-tone={connTone}
        title={connDetail}
        onclick={() => navigate(connection.status === 'connected' || connection.status === 'unreachable' ? '#/settings?section=connections' : '#/overview')}
      >
        <span class="conn-dot" aria-hidden="true"></span>
        <span class="conn-text"><span>{connLabel}</span>{#if connection.baseUrl}<span class="conn-where">{connection.baseUrl}</span>{/if}</span>
      </button>
      <span class="fresh {freshClass} live-chip" class:streaming={store.streamState?.phase === 'open'}>
        {store.streamState?.phase === 'open' ? 'stream live' : freshLabel}
      </span>
      <button type="button" class="wf-btn" onclick={() => store.refreshOwner()} disabled={!store.active}><Icon name="refresh" size={16} /> Refresh</button>
    </div>
  </header>

  <div class="body">
    <!-- NAV (docs/17 §6: Needs You is NOT a primary nav item) -->
    <nav class="nav" aria-label="Workforce">
      <ul class="nav-list">
        {#each [['#/overview', 'Overview', 'overview'], ['#/work', 'Work', 'work'], ['#/people', 'People', 'people'], ['#/evidence', 'Evidence', 'evidence'], ['#/topology', 'Topology', 'topology'], ['#/audit', 'Audit', 'audit'], ['#/settings', 'Settings', 'settings']] as [href, label, icon] (href)}
          <li>
            <a class="nav-item" class:active={navLabel === label} {href} onclick={(e) => { e.preventDefault(); navigate(href); }}>
              <Icon name={icon} size={17} />
              <span>{label}</span>
            </a>
          </li>
        {/each}
      </ul>
      <div class="nav-spacer" aria-hidden="true"></div>
      <ul class="nav-list nav-nonmain">
        <li><a class="nav-item" class:active={navLabel === 'Needs You'} href="#/needs-you" onclick={(e) => { e.preventDefault(); navigate('#/needs-you'); }}><Icon name="attention" size={17} /><span>Needs You</span> {#key needsItems.length}<span class="nav-count" aria-label={`${needsItems.length} items`}>{needsItems.length}</span>{/key}</a></li>
        <li><a class="nav-item" class:active={navLabel === 'Wall'} href="#/wall" onclick={(e) => { e.preventDefault(); navigate('#/wall'); }}><Icon name="wall" size={17} /><span>Wall</span></a></li>
      </ul>
    </nav>

    <div class="main" id="wf-main" tabindex="-1">
      <ConnectionStrip {store} reduce={reduceMotion} />
      <!-- Keyed on route AND on daemon presence: moving between faces and
           attaching/detaching a daemon both cross-fade, in both directions. -->
      {#key `${route}|${store.active ? 'live' : 'off'}`}
      <div class="face" in:fly={{ y: enterDy, duration: enterMs }} out:fade={{ duration: reduceMotion ? 0 : 160 }}>
      {#if store.bootError}<StateNote label="Extension" result={{ state: 'error', note: store.bootError }} />{/if}

      <!-- docs/17 §19 degraded geometry: one banner under the header, last-known retained -->
      {#if healthState !== 'ok' && store.active}
        <div class="banner {healthState === 'degraded' ? 'degraded' : 'unavailable'}" role="status">
          <strong>{healthState === 'degraded' ? 'Owner degraded — showing last-known state' : 'Owner unavailable — showing last-known state'}</strong>
          <div class="row">
            <button type="button" class="wf-btn" onclick={() => store.refreshOwner()}>Refresh</button>
            <a class="wf-btn" href={store.active.baseUrl} target="_blank" rel="noreferrer">Open source</a>
          </div>
        </div>
      {/if}

      <!-- docs/17 §18 ingress: revoked handoff / choose destination, in MAIN -->
      {#if store.scopeGuard.level !== 'ok' && ctx.refState === 'ok'}
        <section class="card">
          <div class="card-head"><h2>Revoked handoff</h2></div>
          <p class="gap">This handoff no longer grants access to this context. {store.scopeGuardLabel}</p>
          <div class="row">
            <button type="button" class="wf-btn" onclick={() => navigate('#/overview')}>Return</button>
            <button type="button" class="wf-btn btn-primary" onclick={() => navigate('#/overview')}>Open Workforce</button>
          </div>
        </section>
      {/if}
      {#if handoffCandidates.length > 1 && (route === '#/work/detail' || route === '#/people/detail')}
        <section class="card">
          <div class="card-head"><h2>Choose destination</h2></div>
          <p class="muted tiny">This reference names more than one member — Workforce does not guess.</p>
          <ul class="items">
            {#each handoffCandidates as candidate (candidate.id)}
              <li>
                <button type="button" class="wf-btn" onclick={() => navigate(buildRoute('#/people/detail', { env: ctx.params.env, ref: { session_id: candidate.id } }))}>{candidate.label}</button>
                <span class="muted tiny">{candidate.state}{candidate.role ? ` · ${candidate.role}` : ''}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <!-- ══════════ §7 OVERVIEW ══════════ -->
      {#if route === '#/overview'}
        <p class="wf-section-label">Workforce</p>
        <div class="ov-grid">
          <!-- CURRENT FOCUS -->
          <section class="card ov-focus ov-hero" aria-labelledby="wf-current-focus">
            <p class="wf-section-label">Current Focus</p>
            {#if store.workstream}
              <h2 id="wf-current-focus">{store.foremanCard.objective ?? 'Workstream active'}</h2>
              <p class="muted tiny">{store.selection.continuityId} · {store.foremanProfiles[0]?.role ?? 'accountable role — owner not reported'}</p>
              <dl class="facts">
                <dt>Frontier</dt><dd>{store.foremanCard.frontier ?? store.trajectoryView.ladder.currentWorkpoint ?? '—'}</dd>
                <dt>Proof</dt>
                <dd>{#if store.foremanCard.recentProof.length === 0}—{:else}{#each store.foremanCard.recentProof as p, i (i)}<code>{p.ref}</code>{' '}{/each}{/if}</dd>
              </dl>
              <div class="row">
                <button type="button" class="wf-btn btn-primary" onclick={() => navigate('#/work/detail')}>Continue</button>
                <span class="muted tiny">{store.scopeGuard.canDirect ? 'Direction available' : store.scopeGuardLabel}</span>
              </div>
            {:else}
              <h2 id="wf-current-focus">No Workstream selected</h2>
              <p class="muted tiny">Choose the work this browser returns to.</p>
              <button type="button" class="wf-btn btn-primary" onclick={() => navigate('#/work')}>Choose Workstream</button>
            {/if}
            <StateNote label="Workpoint" result={store.resultOf('workpoint')} />
          </section>

          <!-- NEEDS YOU (top 3) -->
          <section class="card ov-needs" aria-labelledby="wf-overview-needs">
            <div class="card-head"><h2 id="wf-overview-needs"><Icon name="attention" size={16} /> Needs You</h2>{#key needsItems.length}<span class="count-chip">{needsItems.length}</span>{/key}</div>
            {#if needsItems.length === 0}
              <p class="empty">Nothing needs a human decision right now.</p>
            {:else}
              <ul class="items">
                {#each needsItems.slice(0, 3) as item (item.label)}
                  <li>
                    <span class="kind">{item.kind.replace('_', ' ')}</span>
                    <strong>{item.label}</strong>
                    {#if item.detail}<span class="detail">{item.detail}</span>{/if}
                  </li>
                {/each}
              </ul>
              <a class="inline-link" href="#/needs-you" onclick={(e) => { e.preventDefault(); navigate('#/needs-you'); }}>Open Needs You →</a>
            {/if}
          </section>

          <!-- WORKING NOW -->
          <section class="card ov-working" aria-labelledby="wf-overview-working">
            <div class="card-head"><h2 id="wf-overview-working"><Icon name="activity" size={16} /> Working Now</h2>{#key workingNow.length}<span class="count-chip">{workingNow.length}</span>{/key}</div>
            {#if workingNow.length === 0}
              <p class="empty">No active work reported by the owner.</p>
            {:else}
              <ul class="items">
                {#each workingNow.slice(0, 5) as member (member.id)}
                  <li>
                    <strong>{member.label}</strong>
                    {#if member.role}<span class="detail">{member.role}</span>{/if}
                    <span class="state-sig {member.state}">{member.state ?? 'unknown'}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </section>

          <!-- VERIFIED RECENTLY -->
          <section class="card ov-verified" aria-labelledby="wf-overview-verified">
            <div class="card-head"><h2 id="wf-overview-verified"><Icon name="shield" size={16} /> Verified Recently</h2>{#key verifiedEntries.length}<span class="count-chip">{verifiedEntries.length}</span>{/key}</div>
            {#if verifiedEntries.length === 0}
              <p class="empty">No settled proof reported yet.</p>
            {:else}
              <ul class="items">
                {#each verifiedEntries.slice(0, 3) as entry (entry.ref)}
                  <li><span class="kind">{entry.kind}</span><code>{entry.ref}</code></li>
                {/each}
              </ul>
            {/if}
          </section>
        </div>

        <!-- PROJECTS: everything this daemon is connected to (owner-reported) -->
        <section class="card">
          <div class="card-head">
            <h2>Projects</h2>
            <span class="count-chip">{store.projects?.projects?.length ?? 0}</span>
          </div>
          {#if store.projects?.projects?.length}
            <p class="muted tiny">{store.projects.projects.length} project(s) connected to this daemon. Choosing one scopes the whole workforce.</p>
            <ul class="items">
              {#each store.projects.projects as project (`${project.id ?? ''}:${project.root ?? ''}`)}
                <li>
                  <strong>{project.name}</strong>
                  <code>{project.root ?? '—'}</code>
                  {#if project.stack}<span class="detail">{project.stack}</span>{/if}
                  {#if store.selection.projectRoot === project.root}
                    <span class="state-sig active">active</span>
                  {:else}
                    <button type="button" class="wf-btn" onclick={() => store.useProject(project.root)} disabled={store.projectBusy || !project.root}>Use</button>
                  {/if}
                </li>
              {/each}
            </ul>
          {:else}
            <p class="empty">This daemon reports no projects yet.</p>
          {/if}
          {#if store.capabilities}
            <p class="muted tiny">{store.capabilities.total} governed operations · {store.capabilities.families.length} families · <a class="inline-link" href="#/topology" onclick={(e) => { e.preventDefault(); navigate('#/topology'); }}>What this daemon can do →</a></p>
          {/if}
        </section>

        <!-- WORKSTREAMS grouped by Project -->
        <section class="card">
          <div class="card-head"><h2>Workstreams</h2><span class="count-chip">{store.discovered.length}</span></div>
          <div class="row">
            <input type="text" data-local-search aria-label="Scan directory for projects" bind:value={scanFrom} style="max-width:320px" />
            <button type="button" class="wf-btn" onclick={() => store.discoverProjects(scanFrom)} disabled={store.projectBusy}>Discover projects</button>
          </div>
          {#if store.projectSelectionRequired}
            <p class="gap">Focusa requires an explicit project selection before it will scope operations.</p>
          {/if}
          {#if store.discovered.length === 0}
            <p class="empty">No project discovered yet — scan a directory or pick one on the Work face.</p>
          {:else}
            {#each store.discovered as project (`${project.root ?? ''}:${project.id ?? ''}`)}
              <div class="project-group">
                <h3 class="project-title">{project.name}</h3>
                <table class="wtable">
                  <thead><tr><th>Workstream</th><th>Objective</th><th>Foreman</th><th>State</th><th>Needs You</th></tr></thead>
                  <tbody>
                    <tr onclick={() => navigate('#/work')}>
                      <td data-label="Workstream"><span class="ws-ref">{store.selection.continuityId || '—'}</span></td>
                      <td data-label="Objective">{store.foremanCard.objective ?? '—'}</td>
                      <td data-label="Foreman">{store.foremanProfiles[0]?.role ?? '—'}</td>
                      <td data-label="State"><span class="state-sig {store.trajectoryView.ladder.currentWorkpoint ? 'active' : ''}">{store.trajectoryView.ladder.currentWorkpoint ?? 'idle'}</span></td>
                      <td data-label="Needs You">{needsItems.length}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="row">
                  <button type="button" class="wf-btn" onclick={() => store.useProject(project.root)} disabled={store.projectBusy}>Use this project</button>
                </div>
              </div>
            {/each}
          {/if}
        </section>

        {#if exceptionText}
          <section class="card">
            <div class="card-head"><h2>Capacity / Topology</h2></div>
            <p class="gap">{exceptionText}</p>
            <a class="inline-link" href="#/topology" onclick={(e) => { e.preventDefault(); navigate('#/topology'); }}>Open Topology →</a>
          </section>
        {/if}
      {/if}

      <!-- ══════════ §8 WORK INDEX ══════════ -->
      {#if route === '#/work'}
        <div class="card-head">
          <h2>Work</h2>
          <div class="row">
            <input type="search" data-local-search aria-label="Search workstreams" placeholder="Search" style="max-width:220px" />
            <select aria-label="State filter" bind:value={peopleFilter}>
              <option value="">All states</option>
              {#each [...new Set(store.roster.map((r) => r.state).filter(Boolean))] as s (s)}<option value={s}>{s}</option>{/each}
            </select>
          </div>
        </div>
        <section class="card">
          <div class="card-head"><h3>Workstream</h3>{#if store.workstream}<span class="count-chip">{store.workstream.continuityId}</span>{/if}</div>
          <dl class="facts">
            <dt>Project root</dt><dd>{store.selection.projectRoot || '— not selected'}</dd>
            <dt>Continuity</dt><dd>{store.selection.continuityId || '— not selected'}</dd>
          </dl>
          <div class="row">
            <input type="text" aria-label="Project root" placeholder="~/src/project" bind:value={scanFrom} style="max-width:320px" />
            <button type="button" class="wf-btn" onclick={() => store.useProject(scanFrom)} disabled={store.projectBusy}>Use project</button>
            <button type="button" class="wf-btn" onclick={() => store.discoverProjects(scanFrom)} disabled={store.projectBusy}>Discover</button>
          </div>
          <StateNote label="Project" result={store.resultOf('project')} />
        </section>
        <section class="card">
          <table class="wtable">
            <thead><tr><th>Workstream</th><th>Objective</th><th>Foreman</th><th>State</th><th>Needs You</th></tr></thead>
            <tbody>
              {#each peopleRows as member (member.id)}
                <tr onclick={() => navigate(buildRoute('#/work/detail', { env: store.activeId, ref: { session_id: member.id } }))}>
                  <td data-label="Workstream"><span class="ws-ref">{member.label}</span></td>
                  <td data-label="Objective">{store.foremanCard.objective ?? '—'}</td>
                  <td data-label="Foreman">{member.role ?? '—'}</td>
                  <td data-label="State"><span class="state-sig {member.state}">{member.state ?? 'unknown'}</span></td>
                  <td data-label="Needs You">{#if member.id === steerTarget?.session_id}{needsItems.length}{:else}0{/if}</td>
                </tr>
              {:else}
                <tr><td colspan="5"><p class="empty">No Workstream reported by the owner in this scope.</p></td></tr>
              {/each}
            </tbody>
          </table>
        </section>
        {#if store.pageCaptures.length}
          <section class="card">
            <div class="card-head"><h2>Incoming page work</h2><span class="count-chip">{store.pageCaptures.length}</span></div>
            <p class="muted tiny">Captured locally from the browser context menu. Not a daemon work item until an owner operation accepts it.</p>
            <ul class="items">
              {#each store.pageCaptures as capture (capture.id)}
                <li>
                  <strong>{capture.title}</strong>
                  <a href={capture.source} target="_blank" rel="noreferrer">Open source</a>
                  <div class="row">
                    <button type="button" class="wf-btn" onclick={() => useCapture(capture)}>Use as Direction</button>
                    <button type="button" class="wf-btn" onclick={() => store.submitPageWork(capture.id)} disabled={store.pageWorkBusy}>Submit to work-loop driver</button>
                    <button type="button" class="wf-btn btn-quiet" onclick={() => store.removePageCapture(capture.id)}>Dismiss</button>
                  </div>
                  {#if store.pageWorkOutcomeFor(capture.id)}
                    <span class="muted tiny">{store.pageWorkOutcomeFor(capture.id).ok ? 'Driver accepted' : `${store.pageWorkOutcomeFor(capture.id).kind}`}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      {/if}

      <!-- ══════════ §9 WORK DETAIL ══════════ -->
      {#if route === '#/work/detail'}
        {#if ctx.params.env}<p class="muted tiny">Deep-linked: env {ctx.params.env}</p>{/if}
        <section class="card">
          <div class="wd-head">
            <div class="wd-head-text">
              <h2>{store.selection.continuityId || 'Workstream'}</h2>
              <p class="muted tiny">{store.selection.projectRoot || 'no project root'}</p>
              <p class="wd-objective">{store.foremanCard.objective ?? 'Objective not reported by the owner.'}</p>
            </div>
            <div class="chips">
              <span class="state-sig">{store.trajectoryView.ladder.currentWorkpoint ?? 'idle'}</span>
              <button
        type="button"
        class="conn"
        data-tone={connTone}
        title={connDetail}
        onclick={() => navigate(connection.status === 'connected' || connection.status === 'unreachable' ? '#/settings?section=connections' : '#/overview')}
      >
        <span class="conn-dot" aria-hidden="true"></span>
        <span class="conn-text"><span>{connLabel}</span>{#if connection.baseUrl}<span class="conn-where">{connection.baseUrl}</span>{/if}</span>
      </button>
      <span class="fresh {freshClass} live-chip" class:streaming={store.streamState?.phase === 'open'}>
        {store.streamState?.phase === 'open' ? 'stream live' : freshLabel}
      </span>
              {#each ['full', 'medium', 'short'] as g (g)}
                <button type="button" class="chip" class:on={granularity === g} onclick={() => (granularity = g)}>{g}</button>
              {/each}
              {#each ['H', 'O', 'T'] as c (c)}
                <button type="button" class="chip" class:on={category === c} onclick={() => (category = c)}>{c}</button>
              {/each}
            </div>
          </div>
        </section>

        <div class="wd-split wide">
          <section class="card">
            <div class="card-head"><h2><Icon name="foreman" size={16} /> Foreman</h2><span class="count-chip">{store.foremanProfiles.length}</span></div>
            <dl class="facts">
              <dt>Role</dt><dd>{store.foremanProfiles[0]?.role ?? 'accountable role — owner not reported'}</dd>
              <dt>Objective</dt><dd>{store.foremanCard.objective ?? '—'}</dd>
              <dt>Frontier</dt><dd>{store.foremanCard.frontier ?? '—'}</dd>
              <dt>Proof</dt><dd>{store.foremanCard.recentProof.map((p) => p.ref).join(' ') || '—'}</dd>
            </dl>
            <StateNote label="Roles" result={store.resultOf('roles')} />
          </section>
          <section class="card">
            <div class="card-head"><h2>Needs You</h2><span class="count-chip">{needsItems.length}</span></div>
            {#if needsItems.length === 0}
              <p class="empty">Nothing needs a human decision in this scope.</p>
            {:else}
              <ul class="items">
                {#each needsItems as item (item.label)}
                  <li><span class="kind">{item.kind.replace('_', ' ')}</span><strong>{item.label}</strong>{#if item.detail}<span class="detail">{item.detail}</span>{/if}</li>
                {/each}
              </ul>
            {/if}
          </section>
        </div>

        <section class="card">
          <div class="card-head"><h2><Icon name="direction" size={16} /> Direct → Workstream / Foreman</h2></div>
          {#if !store.workstream}
            <p class="empty">Select a Workstream to address Direction.</p>
          {:else if !steerTarget}
            <p class="gap">Focusa reports no exact session target in this scope yet — bind one on the Work index.</p>
          {:else}
            <p class="target">
              <code>{steerTarget.session_id}</code>
              <span>run <code>{steerTarget.run_id}</code></span>
              <span>gen <code>{steerTarget.generation}</code></span>
              <span class="origin {store.directionTargetOrigin}">{store.directionTargetOrigin === 'owner_roster' ? 'Focusa roster (authoritative)' : store.directionTargetOrigin === 'owner_create' ? 'Focusa create response (authoritative)' : 'operator binding (stopgap)'}</span>
            </p>
            <form onsubmit={submitDirection}>
              <textarea data-direction rows="3" aria-label="Direction instruction" placeholder="Direct this work…" bind:value={instruction} disabled={store.directing}></textarea>
              <div class="row">
                <button type="submit" class="wf-btn btn-primary" disabled={store.directing || !instruction.trim()}>{store.directing ? 'Submitting…' : 'Send Direction'}</button>
                {#each ['start', 'pause', 'resume', 'cancel'] as action (action)}
                  <button type="button" class="wf-btn" disabled={store.directing} onclick={() => store.controlSession({ action, target: steerTarget })}>{action}</button>
                {/each}
                {#each Object.values(store.uiaiSessions) as session (session.session_id)}
                  <button type="button" class="wf-btn" onclick={() => openUiai(session.session_id)}>Open in UIAI</button>
                {/each}
              </div>
            </form>
            {#if store.lastDirection}
              <p class="muted tiny">
                {#if store.lastDirection.ok}Focusa accepted {store.lastDirection.action}{:else}Focusa rejected: {store.lastDirection.kind} — {store.lastDirection.message}{/if}
              </p>
            {/if}
          {/if}
        </section>

        <section class="card">
          <div class="card-head"><h2><Icon name="trajectory" size={16} /> Trajectory</h2><StateNote label="Source" result={store.resultOf('trajectory')} /></div>
          <p class="source {store.trajectoryView.authoritative ? 'authoritative' : 'stopgap'}">{store.trajectoryView.disclosure}</p>
          <ol class="trajectory">
            <li><span class="t-kind">desired outcome</span><span class="t-value">{store.foremanCard.objective ?? '— not reported'}</span></li>
            <li><span class="t-kind">current</span><span class="t-value">{store.trajectoryView.ladder.currentWorkpoint ?? '—'}</span></li>
            <li><span class="t-kind">parallel</span><span class="t-value">{store.trajectoryView.ladder.parallel?.length ? store.trajectoryView.ladder.parallel.join(' · ') : '— none reported'}</span></li>
            <li><span class="t-kind">next</span><span class="t-value">{store.trajectoryView.ladder.nextAction ?? '—'}</span></li>
            <li><span class="t-kind">unresolved</span><span class="t-value">{store.trajectoryView.ladder.clarityBlocking.length ? store.trajectoryView.ladder.clarityBlocking.join(' · ') : '— none reported'}</span></li>
          </ol>
          <StateNote label="Workpoint" result={store.resultOf('workpoint')} />
        </section>

        <section class="card">
          <div class="card-head"><h2><Icon name="activity" size={16} /> Working Now</h2><span class="count-chip">{workingNow.length}</span></div>
          {#if workingNow.length === 0}
            <p class="empty">No member reports active responsibility.</p>
          {:else}
            <ul class="tree">
              {#each workingNow as member (member.id)}
                <li>
                  <strong>{member.label}</strong>
                  {#if member.role}<span class="muted tiny">{member.role}</span>{/if}
                  <span class="state-sig {member.state}">{member.state ?? 'unknown'}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </section>

        <div class="wd-split">
          <section class="card">
            <div class="card-head"><h2>Evidence</h2><span class="count-chip">{store.evidenceTrail.entries.length}</span></div>
            {#if store.evidenceTrail.entries.length === 0}
              <p class="empty">No owner-reported proof for this frontier.</p>
            {:else}
              <ul class="items">
                {#each buckets.needs.slice(0, 4) as entry (entry.ref)}
                  <li><span class="proof-state {entry.kind}">{entry.kind}</span><code>{entry.ref}</code></li>
                {/each}
              </ul>
            {/if}
            <a class="inline-link" href="#/evidence" onclick={(e) => { e.preventDefault(); navigate('#/evidence'); }}>Open Evidence →</a>
          </section>
          <section class="card">
            <div class="card-head"><h2><Icon name="monitor" size={16} /> Execution Posture</h2><span class="count-chip">{store.environments.length}</span></div>
            <ul class="items">
              {#each store.environments as env (env.id)}
                <li>
                  <strong>{env.label}</strong>
                  <span class="state-sig {env.id === store.activeId ? 'active' : ''}">{env.id === store.activeId ? 'active' : 'standby'}</span>
                  <span class="muted tiny">{env.kind} · {env.baseUrl}</span>
                </li>
              {/each}
            </ul>
            {#if store.uiaiTakeovers && Object.keys(store.uiaiTakeovers).length}
              <p class="gap">UIAI takeover pending for {Object.keys(store.uiaiTakeovers).length} session(s).</p>
            {/if}
            {#if exceptionText}<p class="gap">{exceptionText}</p>{/if}
          </section>
        </div>
      {/if}

      <!-- ══════════ §10 PEOPLE ══════════ -->
      {#if route === '#/people'}
        <div class="card-head">
          <h2>People</h2>
          <div class="row">
            <input type="search" data-local-search aria-label="Search people" placeholder="Search" style="max-width:220px" />
            <select aria-label="State filter" bind:value={peopleFilter}>
              <option value="">All states</option>
              {#each [...new Set(store.roster.map((r) => r.state).filter(Boolean))] as s (s)}<option value={s}>{s}</option>{/each}
            </select>
          </div>
        </div>
        {#if peopleRows.length === 0}
          <section class="card"><p class="empty">No member reported in this scope.</p></section>
        {:else}
          {#each rosterGroups.filter((g) => peopleRows.some((m) => g.entries.some((x) => x.id === m.id))) as group (group.role)}
            <section class="card">
              <div class="card-head"><h3>{group.role}</h3><span class="count-chip">{group.entries.length}</span></div>
              <ul class="items">
                {#each group.entries.filter((m) => !peopleFilter || m.state === peopleFilter) as member (member.id)}
                  <li>
                    <strong>{member.label}</strong>
                    <span class="detail">{member.role ?? group.role}</span>
                    <span class="state-sig {member.state}">{member.state ?? 'unknown'}</span>
                    <span class="muted tiny">{member.authority ?? '—'}</span>
                    <button type="button" class="wf-btn btn-quiet" onclick={() => navigate(buildRoute('#/people/detail', { env: store.activeId, ref: { session_id: member.id } }))}>Open</button>
                  </li>
                {/each}
              </ul>
            </section>
          {/each}
        {/if}
        <p class="muted tiny">Execution location is secondary; rows prioritise identity/role, current responsibility, state, last proof.</p>
      {/if}

      {#if route === '#/people/detail'}
        {@const member = store.roster.find((m) => ctx.refState === 'ok' && (m.id === ctx.ref?.session_id || m.id === ctx.ref?.id)) ?? store.roster[0]}
        {#if member}
          <section class="card">
            <div class="card-head"><h2>{member.label}</h2><span class="state-sig {member.state}">{member.state ?? 'unknown'}</span></div>
            <dl class="facts">
              <dt>Role</dt><dd>{member.role ?? 'accountable role — owner not reported'}</dd>
              <dt>Workstream</dt><dd>{store.selection.continuityId || '—'}</dd>
              <dt>Current responsibility</dt><dd>{store.foremanCard.frontier ?? '— not reported'}</dd>
              <dt>Authority / capability</dt><dd>{member.authority ?? '—'}</dd>
              <dt>Execution body</dt><dd>{member.workspace ?? '—'}</dd>
              <dt>Config revision</dt><dd>{member.configRevision ?? '—'}</dd>
            </dl>
          </section>
          <section class="card">
            <div class="card-head"><h3>Recent Evidence</h3><span class="count-chip">{verifiedEntries.length}</span></div>
            {#if verifiedEntries.length === 0}
              <p class="empty">No settled proof reported for this member.</p>
            {:else}
              <ul class="items">{#each verifiedEntries.slice(0, 5) as e (e.ref)}<li><code>{e.ref}</code><span class="muted tiny">{e.source}</span></li>{/each}</ul>
            {/if}
          </section>
          <section class="card">
            <div class="card-head"><h3>Activity / Audit</h3></div>
            <a class="inline-link" href="#/audit" onclick={(e) => { e.preventDefault(); navigate('#/audit'); }}>Open Audit →</a>
          </section>
        {:else}
          <section class="card"><p class="empty">No owner-reported member matches this reference.</p></section>
        {/if}
      {/if}

      <!-- ══════════ §11 NEEDS YOU ══════════ -->
      {#if route === '#/needs-you'}
        <div class="reading-col">
          <div class="card-head"><h2>Needs You</h2><span class="count-chip">{needsItems.length}</span></div>
          <section class="bucket">
            <h3>Now</h3>
            {#if needsItems.length === 0}
              <p class="empty">Nothing needs you right now. Your workforce can continue without input.</p>
            {:else}
              <ul class="items">
                {#each needsItems as item (item.label)}
                  <li class="evidence-card">
                    <span class="kind">{item.kind.replace('_', ' ')}</span>
                    <span class="claim">{item.label}</span>
                    {#if item.detail}<span class="detail">{item.detail}</span>{/if}
                    <span class="muted tiny">via {item.source}</span>
                    <div class="row">
                      <button type="button" class="wf-btn btn-primary" onclick={() => navigate(buildRoute('#/needs-you/detail', { env: store.activeId, ref: { session_id: item.label } }))}>Open</button>
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}
          </section>
          <section class="bucket stale">
            <h3>Recently resolved</h3>
            <p class="muted tiny">Focusa reports no recently resolved attention in this scope.</p>
          </section>
          <StateNote label="Attention" result={store.resultOf('needs')} />
        </div>
      {/if}

      {#if route === '#/needs-you/detail'}
        {@const item = needsItems.find((n) => n.label === ctx.ref?.session_id || n.label === ctx.ref?.id) ?? needsItems[0]}
        <div class="reading-col">
          {#if item}
            <section class="card">
              <div class="card-head"><h2>{item.label}</h2><span class="kind">{item.kind.replace('_', ' ')}</span></div>
              <p>{item.detail ?? 'The owner reports no additional why-now detail.'}</p>
              <p class="muted tiny">Context: {store.selection.continuityId || 'no Workstream'} · source {item.source}</p>
              <div class="row">
                <button type="button" class="wf-btn btn-quiet" onclick={() => navigate('#/needs-you')}>Back</button>
                <button type="button" class="wf-btn btn-primary" onclick={() => navigate('#/work/detail')}>PRIMARY SOURCE ACTION</button>
              </div>
            </section>
          {:else}
            <section class="card">
              <p class="empty">No owner-reported need matches this reference. Workforce renders no invented need.</p>
              <a class="inline-link" href="#/needs-you" onclick={(e) => { e.preventDefault(); navigate('#/needs-you'); }}>Open Needs You →</a>
            </section>
          {/if}
        </div>
      {/if}

      <!-- ══════════ §12 EVIDENCE ══════════ -->
      {#if route === '#/evidence'}
        <div class="card-head">
          <h2>Evidence</h2>
          <div class="row">
            <input type="search" data-local-search aria-label="Search evidence" placeholder="Search" style="max-width:220px" />
            <select aria-label="Proof state filter" bind:value={evidenceFilter}>
              <option value="all">All proof states</option>
              <option value="evidence">Needs verification</option>
              <option value="receipt">Settled</option>
              <option value="projection">Projection</option>
              <option value="corrected">Stale / corrected</option>
            </select>
          </div>
        </div>
        {#each [['needs', 'Needs verification'], ['settled', 'Settled'], ['stale', 'Stale / corrected']] as [key, title] (key)}
          <section class="bucket {key}">
            <h3>{title}</h3>
            {#if buckets[key].length === 0}
              <p class="empty">The owner reports none in this scope.</p>
            {:else}
              <ul class="items">
                {#each buckets[key] as entry (entry.ref)}
                  <li class="evidence-card">
                    <span class="proof-state {entry.kind}">{entry.kind}</span>
                    <code>{entry.ref}</code>
                    <span class="muted tiny">via {entry.source}</span>
                    <button type="button" class="wf-btn btn-quiet" onclick={() => navigate(buildRoute('#/evidence/detail', { env: store.activeId, ref: { evidence_id: entry.ref } }))}>Open</button>
                  </li>
                {/each}
              </ul>
            {/if}
          </section>
        {/each}
        <p class="source {store.evidenceTrail.authoritative ? 'authoritative' : 'stopgap'}">{store.evidenceTrail.disclosure}</p>
      {/if}

      {#if route === '#/evidence/detail'}
        {@const entry = shownEvidence.find((e) => e.ref === ctx.ref?.evidence_id || e.ref === ctx.ref?.id) ?? shownEvidence[0]}
        <div class="reading-col">
          {#if entry}
            <section class="card">
              <div class="card-head"><h2>{entry.claim ?? entry.ref}</h2><span class="proof-state {entry.kind}">{entry.kind}</span></div>
              <p class="muted tiny">Source: {entry.source}</p>
            </section>
            <section class="card">
              <div class="card-head"><h3>Supporting Evidence</h3></div>
              <p class="empty">Artifacts and observations are not reported for this ref.</p>
            </section>
            <section class="card">
              <div class="card-head"><h3>Provenance</h3></div>
              <dl class="facts"><dt>Operation</dt><dd>{entry.source}</dd><dt>Kind</dt><dd>{entry.kind}</dd></dl>
            </section>
            <section class="card">
              <div class="card-head"><h3>Settlement / Receipt</h3></div>
              {#if entry.kind === 'receipt' || entry.kind === 'projection'}
                <p class="muted tiny">Owner reports this ref as settled.</p>
              {:else}
                <p class="empty">No settlement reported.</p>
              {/if}
            </section>
          {:else}
            <section class="card"><p class="empty">No owner-reported evidence matches this ref. Workforce renders no invented claim.</p></section>
          {/if}
        </div>
      {/if}

      <!-- ══════════ §13 TOPOLOGY ══════════ -->
      {#if route === '#/topology'}
        <h2><Icon name="topology" size={18} /> Topology</h2>
        {#if store.environments.length === 0}
          <section class="card"><p class="empty">No environment placed. Connect Focusa on the Connections face.</p></section>
        {:else}
          <section class="topo-group">
            <h3>Interactive</h3>
            <div class="topo-cards">
              {#each store.environments.filter((e) => e.kind === 'paired') as env (env.id)}
                <article class="body-card" class:active={env.id === store.activeId}>
                  <h4>{env.label}</h4>
                  <span class="muted tiny">Paired Focusa environment</span>
                  <StateNote label="Health" result={env.id === store.activeId ? store.resultOf('health') : null} />
                  {#if env.id === store.activeId && store.capabilities}
                    <p class="muted tiny">
                      {store.capabilities.total} governed operations · {store.capabilities.families.length} families
                    </p>
                  {/if}
                  <details class="tech">
                    <summary>Technical detail</summary>
                    <dl class="facts"><dt>Base URL</dt><dd>{env.baseUrl}</dd><dt>Scopes</dt><dd>{env.scopes?.join(' · ') ?? '—'}</dd><dt>Token</dt><dd>{env.token ? 'stored' : 'none (local principal)'}</dd></dl>
                    {#if env.id === store.activeId && store.capabilities}
                      <h4 class="cap-head">Daemon capabilities</h4>
                      <p class="muted tiny">{store.capabilities.disclosure}</p>
                      <ul class="cap-families">
                        {#each store.capabilities.families as family (family.name)}
                          <li><span>{family.name}</span><span class="muted tiny">{family.count}</span></li>
                        {/each}
                      </ul>
                      <ul class="cap-ops">
                        {#each store.capabilities.operations as op (op.id)}
                          <li>
                            <code>{op.method}</code> <code>{op.path}</code>
                            <span class="muted tiny">{op.permissions.join(' · ') || 'no scope'}{op.reversible === false ? ' · not reversible' : ''}</span>
                          </li>
                        {/each}
                      </ul>
                      {#if store.capabilities.truncated}<p class="muted tiny">Showing the first {store.capabilities.operations.length} of {store.capabilities.total}.</p>{/if}
                    {/if}
                  </details>
                </article>
              {/each}
            </div>
          </section>
          <section class="topo-group">
            <h3>Browser execution</h3>
            <div class="topo-cards">
              {#each Object.values(store.uiaiSessions) as session (session.session_id)}
                <article class="body-card">
                  <h4>UIAI {session.session_id.slice(0, 8)}</h4>
                  <span class="muted tiny">{session.status ?? 'unknown'}</span>
                  <div class="row">
                    <button type="button" class="wf-btn" onclick={() => openUiai(session.session_id)}>Open</button>
                    <button type="button" class="wf-btn btn-quiet" onclick={() => store.closeUiai(session.session_id)}>Close</button>
                  </div>
                </article>
              {:else}
                <article class="body-card"><h4>UIAI engine</h4><span class="muted tiny">{store.uiaiHealth?.healthy ? 'healthy' : 'no session placed'}</span></article>
              {/each}
            </div>
          </section>
          <section class="topo-group">
            <h3>Local daemon</h3>
            <div class="topo-cards">
              {#each store.environments.filter((e) => e.kind === 'local') as env (env.id)}
                <article class="body-card" class:active={env.id === store.activeId}>
                  <h4>{env.label}</h4>
                  <span class="muted tiny">Local daemon (this device)</span>
                  <StateNote label="Health" result={env.id === store.activeId ? store.resultOf('health') : null} />
                  <StateNote label="Entitlement" result={env.id === store.activeId ? store.resultOf('license') : null} />
                  <details class="tech">
                    <summary>Technical detail</summary>
                    <dl class="facts"><dt>Base URL</dt><dd>{env.baseUrl}</dd><dt>Principal</dt><dd>local-loopback (tokenless)</dd></dl>
                  </details>
                </article>
              {/each}
            </div>
          </section>
        {/if}
        <p class="muted tiny">Resource pressure is not invented: Focusa reports no capacity metric for this body class.</p>
      {/if}

      <!-- ══════════ §14 AUDIT ══════════ -->
      {#if route === '#/audit'}
        <div class="card-head">
          <h2>Audit</h2>
          <div class="row">
            <select aria-label="Event class filter" bind:value={auditClass}>
              <option value="all">All events</option>
              <option value="decision">Decisions</option>
              <option value="observation">Observations</option>
            </select>
            <select aria-label="Actor filter" bind:value={auditActor}>
              <option value="">All actors</option>
              {#each auditActors as origin (origin)}<option value={origin}>{origin}</option>{/each}
            </select>
          </div>
        </div>
        <section class="card">
          {#if auditRows.length === 0}
            <p class="empty">No owner event reported in this scope.</p>
          {:else}
            <ol class="timeline">
              {#each auditRows as event, i (event.id ?? `${event.timestamp}-${i}`)}
                <li class={event.observation ? 'observation' : 'decision'}>
                  <span class="tl-time">{event.timestamp ?? '—'}</span>
                  <span class="tl-row">
                    <span class="tl-event">{event.type ?? 'event'}</span>
                    {#if event.origin}<span class="tl-actor">{event.origin}</span>{/if}
                    {#if event.sessionId}<span class="tl-actor">{event.sessionId}</span>{/if}
                    <span class="tl-state">{event.observation ? 'Observed' : 'Decided'}</span>
                  </span>
                  <details class="tech">
                    <summary>Raw event</summary>
                    <div class="tl-raw"><pre>{JSON.stringify(event, null, 2)}</pre></div>
                  </details>
                </li>
              {/each}
            </ol>
          {/if}
          <StateNote label="Events" result={store.resultOf('events')} />
        </section>
      {/if}

      <!-- ══════════ §16 WALL (in-page route) ══════════ -->
      {#if route === '#/wall'}
        <div class="wall-face">
          <section class="card wall-focus">
            <p class="wf-section-label">Current Focus</p>
            <h2>{store.foremanCard.objective ?? 'No current focus reported'}</h2>
            <p class="muted">{store.foremanCard.frontier ?? '—'}</p>
            <p class="muted tiny">{store.selection.continuityId || 'no Workstream'} · {store.foremanProfiles[0]?.role ?? 'owner not reported'}</p>
          </section>
          <div class="wall-cols">
            <section class="card">
              <div class="card-head"><h3>Working Now</h3><span class="count-chip">{workingNow.length}</span></div>
              <ul class="items">{#each workingNow.slice(0, 5) as m (m.id)}<li><strong>{m.label}</strong><span class="state-sig {m.state}">{m.state ?? 'unknown'}</span></li>{/each}</ul>
            </section>
            <section class="card">
              <div class="card-head"><h3>Needs You</h3><span class="count-chip">{needsItems.length}</span></div>
              <ul class="items">{#each needsItems.slice(0, 5) as n (n.label)}<li><strong>{n.label}</strong></li>{/each}</ul>
            </section>
            <section class="card">
              <div class="card-head"><h3>Verified Recently</h3><span class="count-chip">{verifiedEntries.length}</span></div>
              <ul class="items">{#each verifiedEntries.slice(0, 5) as e (e.ref)}<li><code>{e.ref}</code></li>{/each}</ul>
            </section>
          </div>
          {#if exceptionText}
            <section class="card"><div class="card-head"><h3>Exception</h3></div><p class="gap">{exceptionText}</p></section>
          {/if}
        </div>
      {/if}

      <!-- ══════════ §15 SETTINGS ══════════ -->
      {#if route === '#/settings'}
        <div class="settings">
          <div class="card-head">
            <h2 class="settings-title"><Icon name="settings" size={18} /> Settings</h2>
            <nav class="settings-nav" aria-label="Settings sections">
              {#each [['connections', 'Connections', 'link'], ['appearance', 'Appearance', 'monitor'], ['notifications', 'Notifications', 'bell'], ['browser-permissions', 'Browser & context permissions', 'browser'], ['public-demo', 'Public demo / local behavior', 'globe'], ['uiai', 'UIAI Engine', 'browser'], ['advanced', 'Advanced / debug', 'settings']] as [key, label, icon] (key)}
                <a href={`#/settings?section=${key}`} class:active={settingsSection === key} onclick={(e) => { e.preventDefault(); navigate(`#/settings?section=${key}`); }}>
                  <Icon name={icon} size={14} /> {label}
                </a>
              {/each}
            </nav>
          </div>

          {#key settingsSection}<div class="set-body" in:fly={{ y: enterDy, duration: enterMs }} out:fade={{ duration: reduceMotion ? 0 : 120 }}>
          {#if settingsSection === 'connections'}
            <div class="settings-split">
              <section class="set-group">
                <h3><Icon name="monitor" size={15} /> Your environments</h3>
                {#if store.environments.length === 0}
                  <p class="empty">No environment connected yet — pair one on the right.</p>
                {:else}
                  <ul class="items">
                    {#each store.environments as env (env.id)}
                      <li class="env-row">
                        <button type="button" class="wf-btn env-select" class:env-active={env.id === store.activeId} onclick={() => store.setEnvironment(env.id)}>
                          <strong>{env.label}</strong>
                          <span class="state-sig {env.id === store.activeId ? 'active' : ''}">{env.id === store.activeId ? 'Active' : 'Standby'}</span>
                        </button>
                        <span class="muted tiny">{env.kind} · <code>{env.baseUrl}</code></span>
                      </li>
                    {/each}
                  </ul>
                  <div class="row">
                    <button type="button" class="wf-btn" onclick={connectLocal} disabled={store.environments.some((e) => e.kind === 'local')}>
                      {store.environments.some((e) => e.kind === 'local') ? 'Local daemon connected' : 'Use the daemon on this device'}
                    </button>
                    {#if store.active}
                      <button type="button" class="wf-btn danger" onclick={() => store.disconnect()}>Disconnect from {store.active.label}</button>
                    {/if}
                  </div>
                  {#if store.active}
                    <p class="muted tiny">Disconnect detaches this browser only. Focusa keeps running; reconnecting is one click.</p>
                  {/if}
                  {#if envError}<p class="gap">{envError}</p>{/if}
                {/if}
              </section>

              <section class="set-group">
                <h3><Icon name="link" size={15} /> Pair Focusa</h3>
                {#if !store.pairing}
                  <form class="set-group" onsubmit={(e) => { e.preventDefault(); store.beginPairing({ baseUrl: pairUrl, label: pairLabel || 'Focusa daemon' }); }}>
                    <label class="field"><span>Environment label</span><input type="text" aria-label="Environment label" bind:value={pairLabel} /></label>
                    <label class="field"><span>Focusa address</span><input type="text" aria-label="Focusa address" placeholder="https://daemon.example:8787" bind:value={pairUrl} /></label>
                    <div class="row"><button type="submit" class="wf-btn btn-primary" disabled={store.pairingBusy || !pairUrl.trim()}>Start pairing</button></div>
                  </form>
                {:else if store.pairing.state === 'awaiting_approval'}
                  <p class="wf-section-label">Pairing code</p>
                  <p class="pair-code">{store.pairing.code}</p>
                  <p class="muted tiny">Approve in Focusa on the daemon. Expires {store.pairing.expires_at}.</p>
                  <div class="row">
                    <button type="button" class="wf-btn" onclick={() => store.checkPairingNow()} disabled={store.pairingBusy}>Check again</button>
                    <button type="button" class="wf-btn btn-quiet" onclick={() => store.cancelPairing()}>Cancel</button>
                  </div>
                {:else}
                  <p class="gap">Pairing {store.pairing.state}</p>
                  <button type="button" class="wf-btn" onclick={() => store.cancelPairing()}>Reset</button>
                {/if}
                {#if store.pairingError}<p class="gap">{store.pairingError}</p>{/if}
              </section>
            </div>
          {:else if settingsSection === 'uiai'}
            <section class="set-group">
              <h3><Icon name="browser" size={15} /> UIAI Engine</h3>
              <p class="muted tiny">Browser execution body on this machine (loopback <code>:7456</code>, or a local bridge address it reports).</p>
              <div class="row">
                <button type="button" class="wf-btn" onclick={() => store.checkUiai()} disabled={store.uiaiBusy}>Check engine</button>
                {#if store.uiaiHealth}<span class="state-sig {store.uiaiHealth.healthy ? 'done' : 'waiting'}">{store.uiaiHealth.healthy ? 'healthy' : store.uiaiHealth.reachable ? 'degraded' : 'unreachable'}</span>{/if}
              </div>
              <label class="field">
                <span>Extension token (X-Extension-Token)</span>
                <input type="password" aria-label="UIAI extension token" bind:value={uiaiTokenInput} autocomplete="off" />
              </label>
              <div class="row">
                <button type="button" class="wf-btn" onclick={saveUiaiToken} disabled={!uiaiTokenInput.trim()}>Save token</button>
                {#if store.uiaiToken}<span class="state-sig done">token configured</span>{/if}
              </div>
              <div class="row">
                <select aria-label="Browser profile" bind:value={uiaiProfile}>
                  <option value="detect">detect</option><option value="no_detect">no_detect</option><option value="research">research</option><option value="operator">operator</option>
                </select>
                <input type="text" aria-label="Model (optional)" placeholder="model" bind:value={uiaiModel} style="max-width:180px" />
                <input type="text" aria-label="Provider (optional)" placeholder="provider" bind:value={uiaiProvider} style="max-width:180px" />
                <button type="button" class="wf-btn btn-primary" onclick={() => store.createUiai({ profile: uiaiProfile, model: uiaiModel || undefined, provider: uiaiProvider || undefined })} disabled={store.uiaiBusy || !store.uiaiToken}>Create session</button>
                <button type="button" class="wf-btn" onclick={() => store.pollUiaiTakeover()} disabled={store.uiaiBusy || !Object.keys(store.uiaiSessions).length}>Check for takeover needs</button>
              </div>
              {#if Object.keys(store.uiaiTakeovers).length}
                <ul class="items">
                  {#each Object.entries(store.uiaiTakeovers) as [id, t] (id)}
                    <li>
                      <span class="kind">takeover</span><strong>{id}</strong><span class="muted tiny">{t.reason ?? 'needs human'}</span>
                      <button type="button" class="wf-btn btn-primary" onclick={() => openUiai(id)}>Take over in UIAI</button>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="muted tiny">No session currently needs operator takeover.</p>
              {/if}
            </section>
          {:else if settingsSection === 'appearance'}
            <section class="set-group">
              <h3>Appearance</h3>
              <p class="muted tiny">The shell follows the OS theme and the docs/13 token layer, and respects reduced motion. Owner-provided appearance options render here when they exist — none are invented.</p>
            </section>
          {:else if settingsSection === 'notifications'}
            <section class="set-group">
              <h3>Notifications</h3>
              <p class="muted tiny">{store.notifications.length} notification(s) stored · {store.unreadCount} unread.</p>
              <div class="row"><button type="button" class="wf-btn" onclick={() => store.markAllRead()} disabled={store.unreadCount === 0}>Mark all read</button></div>
            </section>
          {:else if settingsSection === 'browser-permissions'}
            <section class="set-group">
              <h3>Browser &amp; context permissions</h3>
              <p class="muted tiny">Declared permissions: <code>activeTab</code>, <code>contextMenus</code>, <code>scripting</code>, <code>sidePanel</code>, <code>storage</code>. Host access is limited to the local daemon and UIAI bridge origins.</p>
            </section>
          {:else if settingsSection === 'public-demo'}
            <section class="set-group">
              <h3>Public demo / local behavior</h3>
              <p class="muted tiny">The public <code>os.focusa.dev</code> profile is a read-only demo — Workforce never authenticates there.</p>
              <p class="muted tiny">A loopback daemon on this device pairs without a token (principal: local-loopback).</p>
            </section>
          {:else}
            <section class="set-group">
              <h3><Icon name="settings" size={16} /> Advanced / debug</h3>
              <dl class="facts">
                <dt>Loaded build</dt><dd>{ctx.refVersion ?? 'dev'}</dd>
                <dt>Addressable routes</dt><dd>{ROUTES.length}</dd>
                <dt>Intents</dt><dd>{INTENTS.join(', ')}</dd>
                <dt>Owner gaps</dt><dd>{store.ownerGaps.join(', ') || 'none reported'}</dd>
              </dl>
              <p class="muted tiny">All Workforce data is local to this extension; nothing is synced to a private surface.</p>
              <h4>Diagnostics</h4>
              <p class="muted tiny">Every connect, disconnect and discovery outcome is recorded here — including across reloads. Copy this when reporting a dead button.</p>
              <div class="row"><button type="button" class="wf-btn" onclick={copyWorkforceDiagnostics}>{diagCopyLabel}</button></div>
            </section>
          {/if}
          </div>{/key}
        </div>
      {/if}
      </div>
      {/key}
    </div>

    <!-- CONTEXT RAIL (docs/17 §6): Needs You · Verified · source posture · contextual only -->
    <aside class="rail" class:rail-open={railOpen} aria-label="Context">
      <div class="rail-head">
        <h2 class="rail-title">Context</h2>
        <button type="button" class="rail-close" aria-label="Close context rail" onclick={() => (railOpen = false)}>&times;</button>
      </div>

      <section class="rail-block">
        <h3><Icon name="attention" size={13} /> Needs You</h3>
        {#if needsItems.length === 0}
          <p class="empty">Nothing needs a human decision right now.</p>
        {:else}
          <p class="count-big">{needsItems.length}</p>
          <ul class="items compact">
            {#each needsItems.slice(0, 3) as item (item.label)}
              <li><span class="kind">{item.kind.replace('_', ' ')}</span><strong>{item.label}</strong></li>
            {/each}
          </ul>
          <a class="inline-link" href="#/needs-you" onclick={(e) => { e.preventDefault(); navigate('#/needs-you'); }}>Open Needs You</a>
        {/if}
      </section>

      <section class="rail-block">
        <h3><Icon name="shield" size={13} /> Verified</h3>
        <p class="count-big">{verifiedEntries.length}</p>
        <a class="inline-link" href="#/evidence" onclick={(e) => { e.preventDefault(); navigate('#/evidence'); }}>Open Evidence</a>
      </section>

      {#if Object.keys(store.uiaiTakeovers).length}
        <section class="rail-block">
          <h3>UIAI Takeover</h3>
          <p class="count-big">{Object.keys(store.uiaiTakeovers).length}</p>
          <a class="inline-link" href="#/settings?section=uiai" onclick={(e) => { e.preventDefault(); navigate('#/settings?section=uiai'); }}>Open UIAI Engine</a>
        </section>
      {/if}

      <section class="rail-block">
        <h3><Icon name="layers" size={13} /> Source posture</h3>
        <dl class="facts rail-facts">
          <dt>Entitlement</dt><dd>{store.entitlementState ?? 'unknown'}</dd>
          <dt>Trajectory</dt><dd>{store.trajectoryView.authoritative ? 'canonical' : 'stopgap projection'}</dd>
          <dt>Workpoint</dt><dd>{store.trajectoryView.ladder.currentWorkpoint ?? '—'}</dd>
          <dt>Stream</dt><dd>{store.streamState?.phase ?? 'idle'}</dd>
          <dt>Target origin</dt><dd>{store.directionTargetOrigin ?? '—'}</dd>
        </dl>
      </section>
    </aside>
  </div>
</div>
