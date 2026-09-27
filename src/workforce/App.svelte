<script>
  /**
   * Focusa Workforce — full page (docs/18 §4 global shell).
   *
   * Shell anatomy: Top bar (Operator/Partner · breadcrumb · Fresh) → PRIMARY NAV
   * (Overview · Work · People · Evidence · Topology · Audit · Settings) → MAIN
   * (route-specific faces) → CONTEXT RAIL (Needs You · Verified · Source posture).
   *
   * Needs You is an addressable non-nav route (docs/16, docs/18): reachable by
   * deep link and from the context rail, never a primary-nav item.
   *
   * One shared runtime client serves every face; nothing here owns canonical
   * state. Each section shows the owning operation's result with its honest
   * state, and each stopgap (AGENTS.md stopgap doctrine) is labelled with the
   * source that answered and the owner's own reason.
   *
   * Responsive contract (docs/12 invariants, docs/13 §24–25): reflow BETWEEN
   * breakpoints mutates layout only — never scope, selection, drafts, attention,
   * or history entries. Navigation is the only thing that touches the hash.
   */
  import { onMount } from 'svelte';
  import { createWorkforceStore } from './lib/workforce-store.svelte.js';
  import StateNote from './components/StateNote.svelte';
  import { groupRoster, personFacts, distinctStates } from './lib/roster-groups.js';
  import { needsBuckets } from './lib/needs-buckets.js';
  import { evidenceBuckets, evidenceSources } from './lib/evidence-buckets.js';
  import {
    ROUTES,
    INTENTS,
    parseRoute,
    buildRoute,
    navItemForRoute,
  } from './lib/router.js';

  const store = createWorkforceStore();

  /** Build identity injected at bundle time (see vite.config.mjs). */
  const buildStamp = typeof __WF_BUILD__ === 'string' ? __WF_BUILD__ : 'dev';

  /* ---- route state (the only thing the hash mutates) ---- */
  let route = $state(parseRoute(location.hash).route);
  let routeCtx = $state(parseRoute(location.hash));

  function onHashChange() {
    const parsed = parseRoute(location.hash);
    route = parsed.route;
    routeCtx = parsed;
  }

  /** Navigate by setting the hash; a route change never mutates scope. */
  function navigate(target) {
    const hash = buildRoute(target, {});
    if (location.hash !== hash) location.hash = hash;
  }

  /* ---- rail drawer (presentation state; creates no history entry) ---- */
  let railOpen = $state(false);

  /* ---- local-search shortcut (docs/12 `key`: focus existing search, else no-op) ---- */
  function onKeyDown(event) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const local = document.querySelector('[data-local-search]');
    if (local && typeof local.focus === 'function') local.focus();
    // No local search element today → `/` is a correctly documented no-op.
  }

  /* ---- app state ---- */
  let instruction = $state('');
  let environmentError = $state('');
  let scanFrom = $state('~/src');
  let bindInput = $state('');
  let bindResult = $state('');
  let pairUrl = $state('');
  let pairLabel = $state('');
  let sessionName = $state('');
  let sessionPreparation = $state(null);
  let sessionCreation = $state(null);

  /* ---- Work detail presentation (docs/17 §9): projection-only chips. Selecting a
     granularity or category changes how this face presents — never scope, authority
     or any owner state (docs/12 layout-only reflow; no percent-complete, docs/17 §8). ---- */
  let granularity = $state('full');
  let category = $state('O');

  const verdictGroups = $derived(
    (() => {
      const groups = { needs: [], settled: [], stale: [] };
      for (const entry of store.evidenceTrail.entries) {
        const group =
          entry.kind === 'receipt' || entry.kind === 'projection'
            ? 'settled'
            : entry.kind === 'corrected' || entry.kind === 'revoked' || entry.kind === 'stale'
              ? 'stale'
              : 'needs';
        groups[group].push(entry);
      }
      return groups;
    })(),
  );

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
    unread: store.unreadCount,
  });

  const verifiedCount = $derived(
    store.evidenceTrail.entries.filter((e) => e.kind === 'receipt' || e.kind === 'projection').length,
  );

  /* ---- People face state (docs/17 §10) ---- */
  let peopleStateFilter = $state('');
  const peopleStates = $derived(distinctStates(store.roster));
  const peopleGroups = $derived(
    groupRoster(
      peopleStateFilter
        ? store.roster.filter((entry) => entry.state === peopleStateFilter)
        : store.roster,
    ),
  );
  const personForDetail = $derived(
    (() => {
      const { refState, ref } = routeCtx;
      if (refState === 'ok' && ref) {
        const refId = ref.session_id ?? ref.id ?? ref.workpoint_id ?? null;
        const hit = store.roster.find((entry) => entry.id === refId || entry.id === ref);
        if (hit) return hit;
      }
      return store.roster.find((entry) => entry.id === store.selectedSessionId) ?? null;
    })(),
  );

  /* ---- Needs You face state (docs/17 §11) ---- */
  const needsBucketed = $derived(needsBuckets(store.needsYou.items));
  const needForDetail = $derived(
    (() => {
      const { refState, ref } = routeCtx;
      if (refState === 'ok' && ref) {
        const refId = ref.session_id ?? ref.id ?? ref.workpoint_id ?? String(ref);
        return store.needsYou.items.find((item) => item.label === refId || item.label === ref) ?? null;
      }
      return null;
    })(),
  );

  /* ---- Evidence face state (docs/18 §Evidence, docs/17 §12) ---- */
  let evidenceSourceFilter = $state('');
  const evidenceSourceOptions = $derived(evidenceSources(store.evidenceTrail.entries));
  const evidenceIndex = $derived(
    evidenceBuckets(
      evidenceSourceFilter
        ? store.evidenceTrail.entries.filter((entry) => entry.source === evidenceSourceFilter)
        : store.evidenceTrail.entries,
    ),
  );
  const evidenceEntryForDetail = $derived(
    (() => {
      const { refState, ref } = routeCtx;
      if (refState === 'ok' && ref) {
        const refId = ref.evidence_id ?? ref.sha256 ?? ref.receipt_id ?? ref.id ?? null;
        return store.evidenceTrail.entries.find((entry) => entry.ref === refId || entry.ref === ref || entry.ref === String(ref)) ?? null;
      }
      return null;
    })(),
  );

  const freshLabel = $derived(
    store.foremanCard.freshness ?? (store.lastEventAt ? `last owner event ${store.lastEventAt}` : 'no owner event yet'),
  );

  const routeTitle = $derived(
    route === '#/overview' ? 'Overview'
      : route === '#/work' ? 'Work'
      : route === '#/work/detail' ? 'Work · detail'
      : route === '#/people' ? 'People'
      : route === '#/people/detail' ? 'People · detail'
      : route === '#/needs-you' ? 'Needs You'
      : route === '#/needs-you/detail' ? 'Needs You · detail'
      : route === '#/evidence' ? 'Evidence'
      : route === '#/evidence/detail' ? 'Evidence · detail'
      : route === '#/topology' ? 'Topology'
      : route === '#/audit' ? 'Audit'
      : route === '#/settings' ? 'Settings'
      : 'Workforce',
  );

  const activeNav = $derived(navItemForRoute(route));

  /* ---- primary nav from docs/18 §4 (Needs You deliberately absent) ---- */
  const NAV = $derived([
    { route: '#/overview', label: 'Overview' },
    { route: '#/work', label: 'Work' },
    { route: '#/people', label: 'People' },
    { route: '#/evidence', label: 'Evidence' },
    { route: '#/topology', label: 'Topology' },
    { route: '#/audit', label: 'Audit' },
    { route: '#/settings', label: 'Settings' },
  ]);

  onMount(async () => {
    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('keydown', onKeyDown);
    await store.refreshEnvironments();
    if (store.active) {
      await store.refreshOwner();
      await store.startStream();
    }
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('keydown', onKeyDown);
      store.stopStream();
    };
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

  async function createSessionNow() {
    if (!sessionPreparation?.ok) return;
    sessionCreation = await store.createSession({
      preflight: sessionPreparation.preflight,
      idempotencyKey: `create:${crypto.randomUUID()}`,
    });
  }

  /** Deep-link detail context (env/ref/intent/return) with the Incompatible guard. */
  function detailCtxLine() {
    const { params, refState, ref } = routeCtx;
    const parts = [];
    if (params.env) parts.push(`env ${params.env}`);
    if (refState === 'ok' && ref) parts.push(`${ref.kind} ${ref.ref_id ?? ref.id ?? ref.workpoint_id ?? JSON.stringify(ref)}`);
    if (params.intent) parts.push(`intent ${params.intent}`);
    if (params.return) parts.push(`return ${params.return}`);
    return parts.join(' · ');
  }
</script>

<main class="shell">
  <a class="skip" href="#wf-main">Skip to main content</a>
  <div class="sr-only" role="status" aria-live="polite">{liveMessage}</div>

  <!-- ======================= TOP BAR ======================= -->
  <header class="topbar">
    <div class="brand">
      <span class="mark" aria-hidden="true">F</span>
      <div class="brand-text">
        <p class="wf-section-label">Focusa Workforce</p>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>{store.projectDashboard?.selected?.root?.split('/').filter(Boolean).pop() ?? 'Workforce operations'}</span>
          <span class="crumb-sep" aria-hidden="true">/</span>
          <span class="crumb-current">{routeTitle}</span>
        </nav>
      </div>
    </div>
    <div class="topbar-right">
      <button type="button" class="wf-btn rail-open-btn" aria-expanded={railOpen} onclick={() => (railOpen = !railOpen)}>Context</button>
      <span class="posture-chip" title="Ownership posture for this device">
        {#if store.entitlementState}{store.entitlementState}{:else}partner{/if}
      </span>
      <span class="fresh" title="Freshness of owner-reported state">{freshLabel}</span>
      <span class="stamp" title="loaded build">{buildStamp}</span>
      {#if store.streamState}
        <span class="live {store.streamState.phase}" title={store.lastEventAt ? `last owner event ${store.lastEventAt}` : 'no owner event yet'}>
          {store.streamState.phase}
        </span>
      {/if}
      <button type="button" class="wf-btn" onclick={() => store.refreshOwner()} disabled={!store.active}>Refresh</button>
    </div>
  </header>

  <!-- ======================= BODY GRID ======================= -->
  <div class="body">
    <!-- PRIMARY NAV (docs/18 §4; Needs You is not a nav item) -->
    <nav class="nav" aria-label="Workforce">
      <ul class="nav-list">
        {#each NAV as item (item.route)}
          <li>
            <a class="nav-item {activeNav === item.label ? 'active' : ''}" href={item.route} onclick={(e) => { e.preventDefault(); navigate(item.route); }}>
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
      <div class="nav-spacer" aria-hidden="true"></div>
      <!-- Needs You: addressable non-nav route (context rail + deep link) -->
      <ul class="nav-list nav-nonmain">
        <li>
          <a class="nav-item needs-you {activeNav === 'Needs You' ? 'active' : ''}" href="#/needs-you" onclick={(e) => { e.preventDefault(); navigate('#/needs-you'); }}>
            Needs You
            <span class="nav-count" aria-label={`${counts.needsYou} items`}>{counts.needsYou}</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- MAIN (route faces) -->
    <div class="main" id="wf-main" tabindex="-1">
      {#if store.bootError}
        <StateNote label="Extension" result={{ state: 'error', note: store.bootError }} />
      {/if}

      {#if store.scopeGuard.level !== 'ok'}
        <div class="guard {store.scopeGuard.level}" role="status">
          <strong>{store.scopeGuardLabel}</strong>
          <ul>
            {#each store.scopeGuard.reasons as reason (reason.guard)}
              <li><span class="kind">{reason.guard.replace('_', ' ')}</span> {reason.detail} <span class="muted tiny">via {reason.source}</span></li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if routeCtx.refState === 'incompatible'}
        <section class="card" aria-labelledby="wf-incompatible">
          <div class="card-head"><h2 id="wf-incompatible">Incompatible reference</h2></div>
          <p class="gap">
            The typed reference on this deep link is not one Workforce can present
            (docs/11 §3: an unsupported ref version/kind renders Incompatible and
            performs no mutation). {routeCtx.refReason}
          </p>
          <button type="button" class="wf-btn" onclick={() => navigate(route)}>Open {routeTitle} without the reference</button>
        </section>
      {:else if route === '#/overview'}
        <!-- ============ OVERVIEW (docs/17 §7) ============ -->
        <ul class="strip">
          <li class="attention">
            <span class="num">{counts.needsYou}</span>
            <span class="cap">Needs You <a class="inline-link" href="#/needs-you" onclick={(e) => { e.preventDefault(); navigate('#/needs-you'); }}>open</a></span>
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
          <dl class="facts">
            <dt>Objective</dt><dd>{store.foremanCard.objective ?? '—'}</dd>
            <dt>Frontier</dt><dd>{store.foremanCard.frontier ?? '—'}</dd>
            <dt>Next step</dt><dd>{store.foremanCard.nextStep ?? '—'}</dd>
            <dt>Proof refs</dt>
            <dd>
              {#if store.foremanCard.recentProof.length === 0}—
              {:else}
                {#each store.foremanCard.recentProof as proof (`${proof.kind}:${proof.ref}`)}<code>{proof.ref}</code>{/each}
              {/if}
            </dd>
            <dt>Freshness</dt>
            <dd>{store.foremanCard.freshness ?? 'no owner event yet'}
              <span class="muted tiny">· source {store.foremanCard.source}</span>
            </dd>
          </dl>
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

        <!-- Direction summary (the live form lives on Work) -->
        <section class="card" aria-labelledby="wf-direct-summary">
          <div class="card-head">
            <h2 id="wf-direct-summary">Direction</h2>
            <button type="button" class="wf-btn" onclick={() => navigate('#/work')}>Open Work</button>
          </div>
          {#if !steerTarget}
            <p class="empty">No session instance bound yet — bind one on the Work face and direct it there.</p>
          {:else}
            <p class="target">
              <code>{steerTarget.session_id}</code>
              <span>run <code>{steerTarget.run_id}</code></span>
              <span>gen <code>{steerTarget.generation}</code></span>
              <span class="origin {store.directionTargetOrigin}">
                {store.directionTargetOrigin === 'owner_roster' ? 'Focusa roster (authoritative)'
                  : store.directionTargetOrigin === 'owner_create' ? 'Focusa create response (authoritative)'
                  : 'operator binding (stopgap)'}
              </span>
            </p>
            {#if store.lastDirection}
              <p class="muted tiny">
                {#if store.lastDirection.ok}
                  Focusa accepted {store.lastDirection.action}{#if store.lastDirection.status} · {store.lastDirection.status}{/if}{#if store.lastDirection.approval} · approval {store.lastDirection.approval}{/if}
                {:else}
                  Focusa rejected: {store.lastDirection.kind} — {store.lastDirection.message}
                {/if}
              </p>
            {/if}
          {/if}
        </section>

      {:else if route === '#/work'}
        <!-- ============ WORK INDEX (docs/17 §8: grouped rows; no card mosaic) ============ -->

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
                <select data-local-search onchange={(e) => e.currentTarget.value && store.useProject(e.currentTarget.value)}>
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

        <!-- Direction -->
        <section class="card" aria-labelledby="wf-direction">
          <h2 id="wf-direction">Direction</h2>
          {#if !store.scopeGuard.canDirect}
            <p class="gap">
              Direction is held: {store.scopeGuard.reasons.map((r) => r.guard).join(', ') || 'scope not confirmed'}. A consequential
              owner mutation needs a reachable owner and a confirmed scope.
            </p>
          {:else if !store.workstream}
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
                {store.directionTargetOrigin === 'owner_roster' ? 'Focusa roster (authoritative)'
                  : store.directionTargetOrigin === 'owner_create' ? 'Focusa create response (authoritative)'
                  : 'operator binding (stopgap)'}
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

      {:else if route === '#/work/detail'}
        <!-- ============ WORK DETAIL (docs/17 §9 / docs/18 §Work detail) ============ -->
        {#if routeCtx.params.env}
          <p class="context-line">Deep-linked: {detailCtxLine()}</p>
        {/if}

        <!-- §1 header: project / workstream · objective · lifecycle · fresh -->
        <section class="card" aria-labelledby="wf-wd-head">
          <div class="wd-head">
            <div class="wd-head-text">
              <p class="wd-context">{store.workstream ? `Workstream ${store.workstream.continuityId}` : 'No Workstream bound yet'}</p>
              <h2 id="wf-wd-head">{store.foremanCard.objective ?? 'Work objective not reported by the owner yet'}</h2>
              <p class="muted tiny">lifecycle · {store.streamState?.phase ?? 'idle'} · fresh {freshLabel}</p>
            </div>
            <div class="chips" role="group" aria-label="Objective granularity and category (projection only)">
              {#each ['full', 'medium', 'short'] as g (g)}
                <button type="button" class="chip {granularity === g ? 'on' : ''}" onclick={() => (granularity = g)}>{g}</button>
              {/each}
              <span class="chips-sep" aria-hidden="true">|</span>
              {#each ['H', 'O', 'T'] as c (c)}
                <button type="button" class="chip {category === c ? 'on' : ''}" onclick={() => (category = c)}>{c}</button>
              {/each}
            </div>
          </div>
          <p class="muted tiny">Granularity and category chips are projection-only (docs/17 §8): they select how this face presents, never scope, authority or any owner state.</p>
        </section>

        <!-- §2 Foreman + scoped Needs You (stack under 1100px) -->
        <div class="wd-split">
          <section class="card" aria-labelledby="wf-wd-foreman">
            <div class="card-head">
              <h2 id="wf-wd-foreman">Foreman</h2>
              <span class="count-chip">{store.foremanProfiles.length}</span>
            </div>
            <dl class="facts">
              <dt>Role</dt>
              <dd>{store.foremanProfiles[0]?.role ?? store.foremanProfiles[0]?.role_profile_id ?? 'accountable role — owner not reported'}</dd>
              <dt>Objective</dt><dd>{store.foremanCard.objective ?? '—'}</dd>
              <dt>Frontier</dt><dd>{store.foremanCard.frontier ?? '—'}</dd>
              <dt>Proof</dt>
              <dd>
                {#if store.foremanCard.recentProof.length === 0}—
                {:else}{#each store.foremanCard.recentProof as proof (`${proof.kind}:${proof.ref}`)}<code>{proof.ref}</code>{/each}{/if}
              </dd>
              <dt>Freshness</dt>
              <dd>{store.foremanCard.freshness ?? 'no owner event yet'} <span class="muted tiny">· source {store.foremanCard.source}</span></dd>
            </dl>
            {#if store.ownerGaps.includes('foreman')}<p class="gap">Owner gap: no Project Foreman operation — Workforce will not invent one.</p>{/if}
          </section>

          <section class="card needs-you" aria-labelledby="wf-wd-needs">
            <div class="card-head">
              <h2 id="wf-wd-needs">Needs You</h2>
              <span class="count-chip">{counts.needsYou}</span>
            </div>
            {#if store.needsYou.items.length === 0}
              <p class="empty">Nothing needs a human decision in this scope right now.</p>
            {:else}
              <ul class="items compact">
                {#each store.needsYou.items as item (`${item.kind}:${item.label}`)}
                  <li><span class="kind">{item.kind.replace('_', ' ')}</span><strong>{item.label}</strong>{#if item.detail}<span class="detail">{item.detail}</span>{/if}<span class="muted tiny">via {item.source}</span></li>
                {/each}
              </ul>
            {/if}
          </section>
        </div>

        <!-- §3 Direction (never disappears below the trajectory) -->
        <section class="card" aria-labelledby="wf-wd-direct">
          <h2 id="wf-wd-direct">Direction</h2>
          {#if !store.scopeGuard.canDirect}
            <p class="gap">Direction is held: {store.scopeGuard.reasons.map((r) => r.guard).join(', ') || 'scope not confirmed'}. A consequential owner mutation needs a reachable owner and a confirmed scope.</p>
          {:else if !store.workstream}
            <p class="empty">Select a Workstream to address Direction.</p>
          {:else if !steerTarget}
            <p class="gap">Focusa reports no session instance yet — bind an exact owner target on the Work index to direct now.</p>
          {:else}
            <p class="target">
              <code>{steerTarget.session_id}</code><span>run <code>{steerTarget.run_id}</code></span><span>gen <code>{steerTarget.generation}</code></span>
              <span class="origin {store.directionTargetOrigin}">{store.directionTargetOrigin === 'owner_roster' ? 'Focusa roster (authoritative)' : store.directionTargetOrigin === 'owner_create' ? 'Focusa create response (authoritative)' : 'operator binding (stopgap)'}</span>
            </p>
            <form onsubmit={submitDirection}>
              <textarea rows="3" aria-label="Direction instruction" placeholder="Direct this work…" bind:value={instruction} disabled={store.directing}></textarea>
              <div class="row">
                <button type="submit" class="wf-btn wf-btn-primary" disabled={store.directing || !instruction.trim()}>{store.directing ? 'Submitting…' : 'Send Direction'}</button>
                {#each ['start', 'pause', 'resume', 'cancel'] as action (action)}
                  <button type="button" class="wf-btn" disabled={store.directing} onclick={() => store.controlSession({ action, target: steerTarget })}>{action}</button>
                {/each}
              </div>
            </form>
          {/if}
          {#if store.lastDirection}
            <p class="muted tiny">{#if store.lastDirection.ok}Focusa accepted {store.lastDirection.action}{#if store.lastDirection.status} · {store.lastDirection.status}{/if}{:else}Focusa rejected: {store.lastDirection.kind} — {store.lastDirection.message}{/if}</p>
          {/if}
          <StateNote label="Output" result={store.resultOf('output')} />
        </section>

        <!-- §4 Trajectory: desired outcome → current → next → unresolved (parallel only if the owner reports it) -->
        <section class="card" aria-labelledby="wf-wd-trajectory">
          <div class="card-head">
            <h2 id="wf-wd-trajectory">Trajectory</h2>
            <StateNote label="Trajectory" result={store.resultOf('trajectory')} />
          </div>
          <p class="source {store.trajectoryView.authoritative ? 'authoritative' : 'stopgap'}">{store.trajectoryView.disclosure}</p>
          <ol class="trajectory">
            <li><span class="t-kind">desired outcome</span><span class="t-value">{store.foremanCard.objective ?? '— not reported'}</span></li>
            <li><span class="t-kind">current</span><span class="t-value">{store.trajectoryView.ladder.currentWorkpoint ?? '—'}</span></li>
            <li><span class="t-kind">parallel</span><span class="t-value">{store.trajectoryView.ladder.parallel?.length ? store.trajectoryView.ladder.parallel.join(' · ') : '— none reported'}</span></li>
            <li><span class="t-kind">next</span><span class="t-value">{store.trajectoryView.ladder.nextAction ?? '—'}</span></li>
            <li><span class="t-kind">unresolved</span><span class="t-value">{store.trajectoryView.ladder.clarityBlocking.length ? store.trajectoryView.ladder.clarityBlocking.join(' · ') : '— none reported'}</span></li>
          </ol>
          {#if store.trajectoryView.authoritative}
            <dl class="facts">
              <dt>HLT</dt><dd>{store.trajectoryView.ladder.hltRef ?? '—'}</dd>
              <dt>Current</dt><dd>{store.trajectoryView.ladder.current?.id ?? store.trajectoryView.ladder.current ?? '—'}</dd>
              <dt>Next</dt><dd>{store.trajectoryView.ladder.next?.id ?? store.trajectoryView.ladder.next ?? '—'}</dd>
              <dt>Revision</dt><dd>{store.trajectoryView.ladder.revision ?? '—'}</dd>
            </dl>
          {/if}
          <StateNote label="Workpoint" result={store.resultOf('workpoint')} />
          <StateNote label="Work loop" result={store.resultOf('workLoop')} />
        </section>

        <!-- §5 Working Now: responsibility tree, current HLT only, no list/tree toggle (docs/17 §9) -->
        <section class="card" aria-labelledby="wf-wd-working">
          <h2 id="wf-wd-working">Working Now</h2>
          <p class="gap">Owner gap: Focusa reports no responsibility tree for the current HLT yet (docs/18 §Work detail 5) — Workforce will not invent one.</p>
          <StateNote label="Working Now" result={store.resultOf('workLoop')} />
        </section>

        <!-- §6 + §7 Evidence | Execution posture (stack under 1100px) -->
        <div class="wd-split">
          <section class="card" aria-labelledby="wf-wd-evidence">
            <div class="card-head">
              <h2 id="wf-wd-evidence">Evidence</h2>
              <span class="count-chip">{counts.evidence}</span>
            </div>
            <p class="source {store.evidenceTrail.authoritative ? 'authoritative' : 'stopgap'}">{store.evidenceTrail.disclosure}</p>
            {#if store.evidenceTrail.entries.length === 0}
              <p class="empty">Focusa has not reported an evidence or receipt reference for this scope.</p>
            {:else}
              <dl class="verdicts">
                {#if verdictGroups.needs.length}
                  <div class="verdict"><dt>Needs verification</dt><dd>{#each verdictGroups.needs as e (`${e.kind}:${e.ref}`)}<code>{e.ref}</code>{/each}</dd></div>
                {/if}
                {#if verdictGroups.settled.length}
                  <div class="verdict"><dt>Settled</dt><dd>{#each verdictGroups.settled as e (`${e.kind}:${e.ref}`)}<code>{e.ref}</code>{/each}</dd></div>
                {/if}
                {#if verdictGroups.stale.length}
                  <div class="verdict"><dt>Stale / corrected</dt><dd>{#each verdictGroups.stale as e (`${e.kind}:${e.ref}`)}<code>{e.ref}</code>{/each}</dd></div>
                {/if}
              </dl>
            {/if}
          </section>

          <section class="card" aria-labelledby="wf-wd-posture">
            <div class="card-head">
              <h2 id="wf-wd-posture">Execution posture</h2>
            </div>
            <dl class="facts">
              <dt>Environment</dt><dd>{store.environments.map((e) => e.label).join(', ') || 'none paired'}</dd>
              <dt>Bodies</dt><dd>owner-reported only</dd>
              <dt>UIAI</dt><dd>owner-reported only</dd>
              <dt>Exceptions</dt><dd>{store.scopeGuard.reasons.length ? store.scopeGuard.reasons.map((r) => r.guard).join(', ') : 'none in scope'}</dd>
            </dl>
            <p class="muted tiny">Execution/body state is owner-owned (docs/18 §Work detail 7); Workforce shows bodies and UIAI only when the owner reports them.</p>
          </section>
        </div>

      {:else if route === '#/people'}
        <!-- ============ PEOPLE INDEX (docs/17 §10) ============ -->
        <section class="card" aria-labelledby="wf-people-h">
          <div class="card-head">
            <h2 id="wf-people-h">People</h2>
            <span class="count-chip">{counts.people}</span>
          </div>
          {#if store.resultOf('sessions') && store.resultOf('sessions').state !== 'ok'}
            <p class="empty">Owner roster unavailable ({store.resultOf('sessions').state}).</p>
          {:else if store.roster.length === 0}
            <p class="empty">No owner-reported sessions in this Workstream scope.</p>
          {:else}
            <div class="row people-tools">
              <label class="field people-filter">
                <span>State filter</span>
                <select value={peopleStateFilter} onchange={(e) => (peopleStateFilter = e.currentTarget.value)}>
                  <option value="">All states</option>
                  {#each peopleStates as state (state)}
                    <option value={state}>{state}</option>
                  {/each}
                </select>
              </label>
              <p class="muted tiny">Location filter: the owner reports no execution location yet, so it is not invented (docs/17 §10 row-priority).</p>
            </div>
            {#each peopleGroups as group (group.role)}
              <section class="tier">
                <div class="tier-title">
                  <h3>{group.role}</h3>
                  <span class="count-chip">{group.entries.length}</span>
                </div>
                <ul class="items person-rows">
                  {#each group.entries as entry (entry.id ?? entry.label)}
                    <li class="person-row">
                      <a class="person-main" href="#/people/detail" onclick={(e) => { e.preventDefault(); store.selectSession(entry.id ?? ''); navigate('#/people/detail'); }}>
                        <strong>{entry.label}</strong>
                        {#if entry.state}<span class="state-sig">{entry.state}</span>{/if}
                      </a>
                      <span class="person-meta">
                        {#if entry.role}<span class="cap">{entry.role}</span>{/if}
                        {#if entry.runId}<span>run <code>{entry.runId}</code>{#if Number.isSafeInteger(entry.generation) && entry.generation >= 1} · gen <code>{entry.generation}</code>{/if}</span>{/if}
                        {#if entry.workspace}<span>ws <code>{entry.workspace}</code></span>{/if}
                        {#if entry.authority}<span>authority <code>{entry.authority}</code></span>{/if}
                        {#if entry.configRevision}<span>cfg <code>{entry.configRevision}</code></span>{/if}
                        {#if entry.updatedAt}<span class="muted tiny">{entry.updatedAt}</span>{/if}
                      </span>
                    </li>
                  {/each}
                </ul>
              </section>
            {/each}
            <p class="muted tiny">Row priority docs/17 §10: identity/role · state · run · workstream · authority/config · last proof. Current responsibility and last proof render only when the owner reports them.</p>
          {/if}
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
              preflight accepted · config {sessionPreparation.preflight.redacted_config_hash.slice(0, 12)}…
            </p>
            <div class="row">
              <button
                type="button"
                class="wf-btn wf-btn-primary"
                onclick={createSessionNow}
              >Create session</button>
              <span class="muted tiny">governed owner creation; the returned target becomes Direction's target</span>
            </div>
          {:else if sessionPreparation?.blocker}
            <p class="gap">
              {sessionPreparation.blocker.reason}
              Owner operations that satisfy it: {sessionPreparation.blocker.ownerOperations.join(', ')}.
            </p>
          {:else if sessionPreparation?.error}
            <p class="gap">{sessionPreparation.error}</p>
          {/if}
          {#if sessionCreation?.ok}
            <p class="source authoritative">
              Focusa created the session{#if sessionCreation.target} · target {sessionCreation.target.session_id} run {sessionCreation.target.run_id} gen {sessionCreation.target.generation}{/if}{#if sessionCreation.warning} · {sessionCreation.warning}{/if}
            </p>
          {:else if sessionCreation?.error}
            <p class="gap">Focusa rejected creation: {sessionCreation.error}</p>
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

      {:else if route === '#/people/detail'}
        <!-- ============ PERSON DETAIL (docs/17 §10) ============ -->
        {#if routeCtx.params.env}
          <p class="context-line">Deep-linked: {detailCtxLine()}</p>
        {/if}
        {#if personForDetail}
          {@const person = personForDetail}
          {@const facts = personFacts(person)}
          <section class="card" aria-labelledby="wf-person-h">
            <div class="card-head">
              <h2 id="wf-person-h">{person.label}</h2>
              <button type="button" class="wf-btn" onclick={() => navigate('#/people')}>All People</button>
            </div>
            <p class="source {person.role ? 'authoritative' : 'stopgap'}">
              {person.role ? `role ${person.role}` : 'role not reported by the owner'} · state {person.state ?? 'not reported'}
            </p>
            <dl class="facts">
              {#each facts as fact (fact.label)}
                <dt>{fact.label}</dt><dd>{fact.value}</dd>
              {/each}
            </dl>
          </section>

          <div class="wd-split">
            <section class="card" aria-labelledby="wf-person-current">
              <h2 id="wf-person-current">Current responsibility</h2>
              {#if person.runId || person.workspace || person.authority}
                <dl class="facts">
                  {#if person.runId}<dt>Run</dt><dd>{person.runId}{#if Number.isSafeInteger(person.generation) && person.generation >= 1} · gen {person.generation}{/if}</dd>{/if}
                  {#if person.workspace}<dt>Workstream</dt><dd>{person.workspace}</dd>{/if}
                  {#if person.authority}<dt>Authority</dt><dd>{person.authority}</dd>{/if}
                </dl>
              {:else}
                <p class="empty">Owner has not reported current work details for this person.</p>
              {/if}
              <StateNote label="Person status" result={store.resultOf('sessionStatus')} />
            </section>

            <section class="card" aria-labelledby="wf-person-evidence">
              <div class="card-head">
                <h2 id="wf-person-evidence">Recent evidence</h2>
                <span class="count-chip">{counts.evidence}</span>
              </div>
              {#if store.evidenceTrail.entries.length === 0}
                <p class="empty">No owner-reported evidence for this scope.</p>
              {:else}
                <ul class="items compact">
                  {#each store.evidenceTrail.entries.slice(0, 5) as entry (`${entry.kind}:${entry.ref}`)}
                    <li><span class="kind {entry.kind}">{entry.kind}</span><code>{entry.ref}</code><span class="muted tiny">via {entry.source}</span></li>
                  {/each}
                </ul>
              {/if}
              <p class="muted tiny">Scope-level evidence; person-scoped proof appears when the owner scopes it.</p>
            </section>
          </div>

          <section class="card" aria-labelledby="wf-person-links">
            <h2 id="wf-person-links">Activity / Audit</h2>
            <div class="row">
              <a class="wf-btn" href="#/audit" onclick={(e) => { e.preventDefault(); navigate('#/audit'); }}>Open Audit</a>
              <a class="wf-btn" href="#/evidence" onclick={(e) => { e.preventDefault(); navigate('#/evidence'); }}>Open Evidence</a>
            </div>
            <p class="muted tiny">Person-attributed activity shows when the owner attributes activity to a session.</p>
          </section>
        {:else}
          <section class="card" aria-labelledby="wf-person-none">
            <h2 id="wf-person-none">Person not found</h2>
            <p class="gap">No owner-reported session matches this detail reference ({routeCtx.refReason ?? 'no reference'}). Workforce renders no invented person.</p>
            <button type="button" class="wf-btn" onclick={() => navigate('#/people')}>Back to People</button>
          </section>
        {/if}

      {:else if route === '#/needs-you'}
        <!-- ============ NEEDS YOU INDEX (docs/17 §11; non-nav route) ============ -->
        <section class="card needs-you needs-index" aria-labelledby="wf-needs">
          <div class="card-head">
            <h2 id="wf-needs">Needs You</h2>
            <span class="count-chip">{counts.needsYou}</span>
          </div>
          <p class="source {store.needsYou.authoritative ? 'authoritative' : 'stopgap'}">{store.needsYou.disclosure}</p>
          {#if store.needsYou.items.length === 0}
            <p class="empty">Nothing needs a human decision in this scope right now.</p>
          {:else}
            <h3 class="bucket">NOW</h3>
            <ul class="items">
              {#each needsBucketed.now as item (`${item.kind}:${item.label}`)}
                <li>
                  <span class="kind">{item.kind.replace('_', ' ')}</span>
                  <a class="item-link" href="#/needs-you/detail" onclick={(e) => { e.preventDefault(); navigate(`#/needs-you/detail?ref=${encodeURIComponent(item.label)}`); }}>
                    <strong>{item.label}</strong>
                  </a>
                  {#if item.detail}<span class="detail">{item.detail}</span>{/if}
                  <span class="muted tiny">via {item.source}</span>
                </li>
              {/each}
            </ul>
            {#if needsBucketed.soon.length}
              <h3 class="bucket">SOON / EXPIRING</h3>
              <ul class="items">
                {#each needsBucketed.soon as item (`${item.kind}:${item.label}`)}
                  <li><span class="kind">{item.kind.replace('_', ' ')}</span><strong>{item.label}</strong>{#if item.detail}<span class="detail">{item.detail}</span>{/if}<span class="muted tiny">via {item.source}</span></li>
                {/each}
              </ul>
            {/if}
            <p class="muted tiny">SOON/SNOOZED/RESOLVED appear only when the owner reports due/expiry or status (docs/17 §11); none is invented.</p>
          {/if}
          <StateNote label="Attention" result={store.resultOf('attention')} />
        </section>

      {:else if route === '#/needs-you/detail'}
        <!-- ============ NEEDS YOU DETAIL (docs/17 §11) ============ -->
        {#if routeCtx.params.env}
          <p class="context-line">Deep-linked: {detailCtxLine()}</p>
        {/if}
        {#if needForDetail}
          {@const need = needForDetail}
          <section class="card needs-you needs-index" aria-labelledby="wf-need-detail">
            <div class="card-head">
              <h2 id="wf-need-detail">Needs You</h2>
              <button type="button" class="wf-btn" onclick={() => navigate('#/needs-you')}>All needs</button>
            </div>
            <dl class="facts">
              <dt>What needs you</dt><dd>{need.label}</dd>
              {#if need.detail}<dt>Why now</dt><dd>{need.detail}</dd>{/if}
              <dt>Source state</dt><dd class="{need.source}">{need.source} · {store.needsYou.disclosure}</dd>
              <dt>Freshness</dt><dd>{store.lastEventAt ?? store.needsYou.items.length > 0 ? 'owner-returned with this read' : 'none yet'}</dd>
            </dl>
            <h3 class="bucket">Decision context</h3>
            <p class="muted tiny">
              This need surfaced from {need.source === 'roster' ? 'the owner roster (a session reported requiring human attention)' : need.source === 'trajectory' ? 'the owner trajectory (a clarity blocker on the next step)' : 'the owner attention projection'}.
              Workforce confirms decision consequences only through the owner; none are invented here.
            </p>
            <h3 class="bucket">Consequence of each allowed action</h3>
            <ul class="items">
              {#if need.kind === 'session'}
                <li><strong>Open the person</strong><span class="detail">inspects the session and its owner-reported status before you direct it</span></li>
                <li><strong>Direct on Work</strong><span class="detail">the direction composer sends an explicit owner instruction (accepted/rejected is answered by the owner)</span></li>
                <li><strong>Wait</strong><span class="detail">the need stays on this queue until the owner state changes</span></li>
              {:else}
                <li><strong>Resolve the clarity blocker</strong><span class="detail">record the missing decision on the owner trajectory; the frontier advances the next time the owner commits</span></li>
                <li><strong>Wait</strong><span class="detail">the blocker stays listed until the owner reports it cleared</span></li>
              {/if}
            </ul>
            <div class="row">
              {#if need.kind === 'session'}
                <a class="wf-btn wf-btn-primary" href="#/people/detail" onclick={(e) => { e.preventDefault(); navigate('#/people/detail'); }}>Open in People</a>
              {:else}
                <a class="wf-btn wf-btn-primary" href="#/work/detail" onclick={(e) => { e.preventDefault(); navigate('#/work/detail'); }}>Open Work detail</a>
              {/if}
              <span class="muted tiny">primary source action stays with the owner surface; Workforce navigates, the owner decides.</span>
            </div>
          </section>
        {:else}
          <section class="card needs-you needs-index" aria-labelledby="wf-need-none">
            <h2 id="wf-need-none">Need not found</h2>
            <p class="gap">No owner-reported need matches this detail reference ({routeCtx.refReason ?? 'no reference'}). Workforce renders no invented need.</p>
            <button type="button" class="wf-btn" onclick={() => navigate('#/needs-you')}>Back to Needs You</button>
          </section>
        {/if}

      {:else if route === '#/evidence'}
        <!-- ============ EVIDENCE INDEX (docs/18 §Evidence) ============ -->
        <section class="card evidence-index" aria-labelledby="wf-evidence">
          <div class="card-head">
            <h2 id="wf-evidence">Evidence</h2>
            <span class="count-chip">{counts.evidence}</span>
          </div>
          <p class="source {store.evidenceTrail.authoritative ? 'authoritative' : 'stopgap'}">{store.evidenceTrail.disclosure}</p>
          {#if store.evidenceTrail.entries.length === 0}
            <p class="empty">Focusa has not reported an evidence or receipt reference for this scope.</p>
          {:else}
            <div class="row evidence-tools">
              <label class="field evidence-filter">
                <span>Source filter</span>
                <select value={evidenceSourceFilter} onchange={(e) => (evidenceSourceFilter = e.currentTarget.value)}>
                  <option value="">All sources</option>
                  {#each evidenceSourceOptions as source (source)}
                    <option value={source}>{source}</option>
                  {/each}
                </select>
              </label>
            </div>
            {#if evidenceIndex.needs.length}
              <h3 class="bucket">Needs verification</h3>
              <ul class="items compact">
                {#each evidenceIndex.needs as entry (`${entry.kind}:${entry.ref}`)}
                  <li>
                    <span class="kind {entry.kind}">{entry.kind}</span>
                    <a class="item-link" href="#/evidence/detail" onclick={(e) => { e.preventDefault(); navigate(`#/evidence/detail?ref=${encodeURIComponent(entry.ref)}`); }}><code>{entry.ref}</code></a>
                    <span class="muted tiny">via {entry.source}</span>
                  </li>
                {/each}
              </ul>
            {/if}
            {#if evidenceIndex.settled.length}
              <h3 class="bucket">Settled</h3>
              <ul class="items compact">
                {#each evidenceIndex.settled as entry (`${entry.kind}:${entry.ref}`)}
                  <li>
                    <span class="kind {entry.kind}">{entry.kind}</span>
                    <a class="item-link" href="#/evidence/detail" onclick={(e) => { e.preventDefault(); navigate(`#/evidence/detail?ref=${encodeURIComponent(entry.ref)}`); }}><code>{entry.ref}</code></a>
                    <span class="muted tiny">via {entry.source}</span>
                  </li>
                {/each}
              </ul>
            {/if}
            {#if evidenceIndex.stale.length}
              <h3 class="bucket">Stale / corrected</h3>
              <ul class="items compact">
                {#each evidenceIndex.stale as entry (`${entry.kind}:${entry.ref}`)}
                  <li><span class="kind {entry.kind}">{entry.kind}</span><code>{entry.ref}</code><span class="muted tiny">via {entry.source}</span></li>
                {/each}
              </ul>
            {/if}
            <p class="muted tiny">Recently verified appears when the owner reports a verification step; stale/corrected appears when the owner reports a correction. Neither is invented (docs/18 §Evidence).</p>
          {/if}
        </section>

      {:else if route === '#/evidence/detail'}
        <!-- ============ EVIDENCE DETAIL (docs/17 §12) ============ -->
        {#if routeCtx.params.env}
          <p class="context-line">Deep-linked: {detailCtxLine()}</p>
        {/if}
        {#if evidenceEntryForDetail}
          {@const entry = evidenceEntryForDetail}
          <section class="card evidence-index" aria-labelledby="wf-evidence-detail">
            <div class="card-head">
              <h2 id="wf-evidence-detail">Evidence</h2>
              <button type="button" class="wf-btn" onclick={() => navigate('#/evidence')}>All evidence</button>
            </div>
            <dl class="facts">
              <dt>Claim / outcome</dt><dd><code>{entry.ref}</code></dd>
              <dt>Proof state</dt><dd><span class="kind {entry.kind}">{entry.kind}</span></dd>
              <dt>Source</dt><dd>{entry.source} · {store.evidenceTrail.disclosure}</dd>
              <dt>Verification summary</dt><dd>owner reports only — see supporting refs and settlement below</dd>
            </dl>
            <h3 class="bucket">Supporting evidence</h3>
            <p class="muted tiny">Artifacts/observations attach when the owner reports them (docs/17 §12); none is invented.</p>
            <div class="wd-split">
              <section class="card">
                <h2 class="wf-section-label">Settlement / Receipt</h2>
                {#if entry.kind === 'receipt' || entry.kind === 'projection'}
                  <p class="source authoritative">This reference is a {entry.kind} — owner-reported as settled.</p>
                {:else}
                  <p class="empty">No owner-reported settlement or receipt for this reference yet.</p>
                {/if}
              </section>
              <section class="card">
                <h2 class="wf-section-label">Correction / Revocation</h2>
                <p class="empty">Owner has not reported a correction or revocation for this reference.</p>
              </section>
            </div>
            <h3 class="bucket">Accepted outcome link</h3>
            <p class="muted tiny">Rendered when the owner reports one; the reference above is the closest owner-reported proof today.</p>
          </section>
        {:else}
          <section class="card evidence-index" aria-labelledby="wf-evidence-none">
            <h2 id="wf-evidence-none">Reference not found</h2>
            <p class="gap">No owner-reported evidence reference matches this detail ref ({routeCtx.refReason ?? 'no reference'}). Workforce renders no invented claim.</p>
            <button type="button" class="wf-btn" onclick={() => navigate('#/evidence')}>Back to Evidence</button>
          </section>
        {/if}

      {:else if route === '#/topology'}
        <!-- ============ TOPOLOGY (bodies) ============ -->
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

      {:else if route === '#/audit'}
        <!-- ============ AUDIT (causal history) ============ -->
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

        <section class="card" aria-labelledby="wf-notifications">
          <div class="card-head">
            <h2 id="wf-notifications">Notifications</h2>
            <span class="count-chip">{counts.unread} unread</span>
          </div>
          {#if store.notifications.length === 0}
            <p class="empty">No owner event has required attention yet.</p>
          {:else}
            <ul class="items compact">
              {#each store.notifications.slice(0, 8) as item (item.id ?? `${item.event_type}-${item.timestamp}`)}
                <li class:unread={!item.read}>
                  <span class="kind {item.severity ?? ''}">{item.severity ?? 'info'}</span>
                  <strong>{item.title}</strong>
                  <span class="detail">{item.body}</span>
                  <span class="muted tiny">{item.timestamp}</span>
                </li>
              {/each}
            </ul>
            {#if counts.unread > 0}
              <button type="button" class="wf-btn" onclick={() => store.markAllRead()}>Mark all read</button>
            {/if}
          {/if}
        </section>

      {:else if route === '#/settings'}
        <!-- ============ SETTINGS ============ -->
        <section class="card" aria-labelledby="wf-settings">
          <div class="card-head">
            <h2 id="wf-settings">Settings</h2>
          </div>

          <details class="capability">
            <summary>Environment &amp; connections</summary>
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
            <div class="row">
              <button type="button" class="wf-btn" onclick={connectLocal} disabled={store.environments.some((e) => e.kind === 'local')}>
                {store.environments.some((e) => e.kind === 'local') ? 'Local daemon connected' : 'Use the daemon on this device'}
              </button>
            </div>
            {#if environmentError}<p class="gap">{environmentError}</p>{/if}
            <StateNote label="Health" result={store.resultOf('health')} />
            <StateNote label="Entitlement" result={store.resultOf('license')} />
          </details>

          <details class="capability">
            <summary>Pair a daemon</summary>
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

          <dl class="facts">
            <dt>Loaded build</dt><dd>{buildStamp}</dd>
            <dt>Route</dt><dd><code>{route}</code></dd>
            <dt>Addressable routes</dt><dd>{ROUTES.length} · <code>#/needs-you</code> is a non-nav route</dd>
            <dt>Intents</dt><dd>{INTENTS.join(', ')}</dd>
          </dl>
        </section>
      {/if}

      {#if store.anyBlocked}
        <p class="gap">
          Focusa's entitlement policy is denying some canonical operations. Workforce shows only what the
          owner returns; activate or repair the owner lease to restore full operation.
        </p>
      {/if}
    </div>

    <!-- CONTEXT RAIL (docs/18 §4): Needs You · Verified · Source posture -->
    <aside class="rail" class:rail-open={railOpen} aria-label="Context">
      <div class="rail-head">
        <h2 class="rail-title">Context</h2>
        <button type="button" class="rail-close" aria-label="Close context rail" onclick={() => (railOpen = false)}>&times;</button>
      </div>

      <section class="rail-block" aria-labelledby="rail-needs">
        <h3 id="rail-needs">Needs You</h3>
        {#if counts.needsYou === 0}
          <p class="empty">Nothing needs a human decision right now.</p>
        {:else}
          <p class="count-big">{counts.needsYou}</p>
          <ul class="items compact">
            {#each store.needsYou.items.slice(0, 3) as item (`${item.kind}:${item.label}`)}
              <li>
                <span class="kind">{item.kind.replace('_', ' ')}</span>
                <strong>{item.label}</strong>
              </li>
            {/each}
          </ul>
          <a class="inline-link" href="#/needs-you" onclick={(e) => { e.preventDefault(); navigate('#/needs-you'); }}>Open Needs You</a>
        {/if}
      </section>

      <section class="rail-block" aria-labelledby="rail-verified">
        <h3 id="rail-verified">Verified</h3>
        <p class="count-big">{counts.evidence}</p>
        <p class="muted tiny">{verifiedCount} receipt/projection refs this scope</p>
        <a class="inline-link" href="#/evidence" onclick={(e) => { e.preventDefault(); navigate('#/evidence'); }}>Open Evidence</a>
      </section>

      <section class="rail-block" aria-labelledby="rail-source">
        <h3 id="rail-source">Source posture</h3>
        <dl class="facts rail-facts">
          <dt>Entitlement</dt><dd>{store.entitlementState ?? 'unknown'}</dd>
          <dt>Trajectory</dt><dd>{store.trajectoryView.authoritative ? 'canonical' : store.trajectoryView.disclosure}</dd>
          <dt>Workpoint</dt><dd>{store.trajectoryView.ladder.currentWorkpoint ?? '—'}</dd>
          <dt>Stream</dt><dd>{store.streamState?.phase ?? 'idle'}</dd>
          <dt>Target origin</dt><dd>{store.directionTargetOrigin ?? '—'}</dd>
        </dl>
      </section>
    </aside>
  </div>
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

  .shell {
    max-width: 1440px;
    margin: 0 auto;
    padding: var(--space-standard) var(--page-gutter) var(--space-page);
    display: grid;
    gap: var(--space-standard);
    min-width: 0;
  }

  /* ---------- TOP BAR ---------- */
  .topbar {
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-standard);
    flex-wrap: wrap; padding: var(--space-tight) 0;
  }
  .brand { display: flex; gap: var(--space-compact); align-items: center; min-width: 0; }
  .mark {
    display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px;
    border-radius: var(--radius-md); background: var(--accent); color: var(--text-inverse);
    font-weight: var(--weight-bold); font-size: 16px;
  }
  .brand-text { min-width: 0; }
  .wf-section-label { margin: 0; font-size: var(--text-micro); text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
  .breadcrumb {
    display: flex; align-items: baseline; gap: var(--space-tight);
    font-size: var(--text-section); font-weight: var(--weight-bold); margin: 0; min-width: 0;
    overflow-wrap: anywhere;
  }
  .crumb-sep { color: var(--text-muted); }
  .crumb-current { color: var(--text-secondary); }
  .topbar-right { display: flex; align-items: center; gap: var(--space-tight); flex-wrap: wrap; }
  .posture-chip {
    font-size: var(--text-micro); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.06em;
    border: 1px solid currentColor; border-radius: var(--radius-pill); padding: 1px var(--space-tight); color: var(--success);
  }
  .fresh { font-size: var(--text-micro); color: var(--text-secondary); overflow-wrap: anywhere; }
  .rail-open-btn { display: none; }
  .stamp {
    font-family: var(--font-mono); font-size: var(--text-micro); color: var(--text-secondary);
    border: 1px solid var(--border-default); border-radius: var(--radius-pill); padding: 1px var(--space-tight);
  }
  .live { font-size: var(--text-micro); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.06em; border-radius: var(--radius-pill); padding: 1px var(--space-tight); border: 1px solid currentColor; }
  .live.live { color: var(--success); }
  .live.replaying { color: var(--warning); }
  .live.unavailable, .live.unauthorized { color: var(--danger); }

  /* ---------- BODY GRID ---------- */
  .body {
    display: grid;
    gap: var(--space-standard);
    align-items: start;
    min-width: 0;
  }

  /* PRIMARY NAV */
  .nav { display: grid; gap: var(--space-standard); align-content: start; min-width: 0; }
  .nav-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .nav-item {
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-tight);
    padding: var(--space-tight) var(--space-compact);
    border-radius: var(--radius-sm); border-left: 3px solid transparent;
    color: var(--text-secondary); font-size: var(--text-small); font-weight: var(--weight-medium);
    text-decoration: none;
  }
  .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
  .nav-item.active { background: var(--bg-subtle); border-left-color: var(--accent); color: var(--text-primary); font-weight: var(--weight-semibold); }
  .nav-item.needs-you { color: var(--violet); }
  .nav-count {
    font-size: var(--text-micro); font-weight: var(--weight-semibold);
    background: var(--bg-subtle); border: 1px solid var(--border-default); border-radius: var(--radius-pill);
    padding: 0 var(--space-tight); font-variant-numeric: tabular-nums;
  }
  .nav-item.active .nav-count, .nav-item.needs-you .nav-count { border-color: currentColor; }
  .nav-spacer { border-top: 1px solid var(--border-default); margin: 0 var(--space-tight); }
  .nav-nonmain { margin-top: var(--space-tight); }

  /* MAIN */
  .main { display: grid; gap: var(--space-standard); align-content: start; min-width: 0; }
  .main:focus { outline: none; }
  .context-line {
    font-size: var(--text-micro); color: var(--text-secondary);
    border: 1px dashed var(--border-strong); border-radius: var(--radius-sm);
    padding: var(--space-tight) var(--space-compact); margin: 0; overflow-wrap: anywhere;
  }

  /* CONTEXT RAIL */
  .rail { display: grid; gap: var(--space-standard); align-content: start; min-width: 0; }
  .rail-head { display: flex; align-items: center; justify-content: space-between; }
  .rail-title { font-size: var(--text-micro); font-weight: var(--weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); margin: 0; }
  .rail-close { display: none; }
  .rail-block {
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: var(--radius-md); padding: var(--space-compact) var(--space-roomy);
    display: grid; gap: var(--space-tight); box-shadow: var(--elevation-card); min-width: 0;
  }
  .rail-block h3 { font-size: var(--text-micro); font-weight: var(--weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); margin: 0; }
  .count-big { font-size: var(--text-display); line-height: var(--leading-display); font-weight: var(--weight-bold); margin: 0; font-variant-numeric: tabular-nums; }
  .rail-facts { grid-template-columns: minmax(0, 1fr); }
  .inline-link { font-size: var(--text-small); color: var(--accent); text-decoration: none; }
  .inline-link:hover { text-decoration: underline; }

  /* ---------- shared pieces ---------- */
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
  .card-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-tight); flex-wrap: wrap; }
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
  .field { display: grid; gap: 4px; flex: 1 1 16rem; min-width: 0; }
  .field > span { font-size: var(--text-micro); text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-weight: var(--weight-semibold); }
  .field > input, .field > select { width: 100%; min-width: 0; }
  .field.grow { flex: 1 1 20rem; }
  input, select, textarea {
    font: inherit; font-size: var(--text-small); color: var(--text-primary);
    background: var(--bg-surface); border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm); padding: var(--space-tight) var(--space-compact);
    min-height: 32px; min-width: 0; max-width: 100%;
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
  .guard {
    border-radius: var(--radius-md); padding: var(--space-compact) var(--space-standard);
    font-size: var(--text-small); display: grid; gap: var(--space-tight);
  }
  .guard.warn { background: var(--warning-subtle); border: 1px solid var(--warning); }
  .guard.blocked { background: var(--danger-subtle); border: 1px solid var(--danger); }
  .guard ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .gap {
    border-left: 3px solid var(--warning); background: var(--warning-subtle);
    color: var(--text-primary); padding: var(--space-tight) var(--space-compact);
    font-size: var(--text-small); border-radius: var(--radius-sm); margin: 0; overflow-wrap: anywhere;
  }
  .source {
    font-size: var(--text-micro); font-weight: var(--weight-semibold); margin: 0;
    padding: var(--space-micro) var(--space-tight); border-radius: var(--radius-sm);
    border-left: 3px solid var(--text-muted); background: var(--bg-subtle); color: var(--text-secondary);
    overflow-wrap: anywhere;
  }
  .source.authoritative { border-left-color: var(--success); background: var(--success-subtle); color: var(--text-primary); }
  .source.stopgap { border-left-color: var(--warning); background: var(--warning-subtle); color: var(--text-primary); }

  .items { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-tight); min-width: 0; }
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
  .items li.unread strong { font-weight: var(--weight-bold); }
  .kind.info { color: var(--info); border-color: var(--info); background: var(--info-subtle); }
  .kind.success { color: var(--success); border-color: var(--success); background: var(--success-subtle); }
  .kind.warning { color: var(--warning); border-color: var(--warning); background: var(--warning-subtle); }
  .kind.danger { color: var(--danger); border-color: var(--danger); background: var(--danger-subtle); }
  .kind.evidence { color: var(--info); border-color: var(--info); background: var(--info-subtle); }
  .kind.receipt, .kind.projection { color: var(--settled); border-color: var(--settled); background: var(--settled-subtle); }

  .facts { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 2px var(--space-tight); margin: 0; font-size: var(--text-small); }
  .facts dt { color: var(--text-muted); }
  .facts dd { margin: 0; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }

  .target { display: flex; flex-wrap: wrap; gap: var(--space-tight); align-items: center; font-size: var(--text-small); margin: 0; color: var(--text-secondary); }
  .target .origin { border-radius: var(--radius-pill); padding: 0 var(--space-tight); font-size: var(--text-micro); border: 1px solid currentColor; }
  .target .origin.owner_roster, .target .origin.owner_create { color: var(--success); }
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

  /* ---------- Work detail (docs/17 §9) ---------- */
  .wd-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-standard); flex-wrap: wrap; min-width: 0; }
  .wd-head-text { min-width: 0; }
  .wd-context { margin: 0 0 2px; font-size: var(--text-micro); font-weight: var(--weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); overflow-wrap: anywhere; }
  .chips { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .chip {
    min-height: 24px; padding: 0 var(--space-compact); font-size: var(--text-micro);
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: var(--weight-semibold);
    border-radius: var(--radius-pill); color: var(--text-secondary); background: var(--bg-subtle);
    border: 1px solid var(--border-default);
  }
  .chip:hover { background: var(--bg-hover); }
  .chip.on { color: var(--text-inverse); background: var(--accent); border-color: var(--accent); }
  .chips-sep { color: var(--text-muted); padding: 0 2px; }
  .wd-split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-standard); align-items: start; }
  .trajectory { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; counter-reset: step; }
  .trajectory li { display: grid; grid-template-columns: 108px minmax(0, 1fr); gap: var(--space-tight); align-items: baseline; padding: var(--space-tight) 0; border-bottom: 1px solid var(--border-default); }
  .trajectory li:last-child { border-bottom: 0; }
  .t-kind { font-size: var(--text-micro); text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-weight: var(--weight-semibold); }
  .t-value { font-size: var(--text-small); color: var(--text-primary); overflow-wrap: anywhere; }
  .verdicts { display: grid; gap: var(--space-tight); margin: 0; }
  .verdict { display: grid; gap: 4px; }
  .verdict dt { font-size: var(--text-micro); text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-weight: var(--weight-semibold); }
  .verdict dd { margin: 0; display: flex; flex-wrap: wrap; gap: var(--space-tight); }
  .verdict code { font-family: var(--font-mono); font-size: var(--text-micro); background: var(--bg-subtle); border: 1px solid var(--border-default); border-radius: var(--radius-sm); padding: 0 var(--space-tight); overflow-wrap: anywhere; }

  /* ---------- People (docs/17 §10) ---------- */
  .people-tools { align-items: center; }
  .people-filter { flex: 0 1 14rem; }
  .tier { display: grid; gap: var(--space-tight); }
  .tier-title { display: flex; align-items: center; gap: var(--space-tight); }
  .tier-title h3 { margin: 0; font-size: var(--text-micro); font-weight: var(--weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }
  .person-rows { margin: 0; }
  .person-row { display: grid; gap: var(--space-tight); }
  .person-main { display: flex; flex-wrap: wrap; gap: var(--space-tight); align-items: center; text-decoration: none; color: inherit; }
  .person-main strong { font-size: var(--text-body); }
  .person-main:hover strong { text-decoration: underline; }
  .state-sig {
    font-size: var(--text-micro); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.06em;
    border: 1px solid currentColor; border-radius: var(--radius-pill); padding: 0 var(--space-tight); color: var(--text-secondary);
  }
  .person-meta { display: flex; flex-wrap: wrap; gap: var(--space-compact); font-size: var(--text-small); color: var(--text-secondary); align-items: baseline; }
  .person-meta .cap { font-size: var(--text-micro); text-transform: uppercase; letter-spacing: 0.06em; font-weight: var(--weight-semibold); color: var(--violet); }
  .person-meta code { font-family: var(--font-mono); font-size: var(--text-micro); background: var(--bg-subtle); border: 1px solid var(--border-default); border-radius: var(--radius-sm); padding: 0 var(--space-tight); }

  /* ---------- Needs You (docs/17 §11) ---------- */
  .needs-index { max-width: 900px; }
  .bucket { margin: var(--space-compact) 0 0; font-size: var(--text-micro); font-weight: var(--weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--violet); }
  .item-link { text-decoration: none; color: inherit; }
  .item-link strong { color: var(--accent); }
  .item-link:hover strong { text-decoration: underline; }
  .evidence-index { max-width: 1000px; }
  .evidence-tools { align-items: center; }
  .evidence-filter { flex: 0 1 14rem; }

  /* ===================== RESPONSIVE (docs/18 §4) ===================== */
  /* ≥1180: nav · main · rail, all in flow. Reflow between breakpoints is
     layout-only: it never mutates scope/selection/drafts/attention and never
     creates a history entry. */
  @media (min-width: 1180px) {
    .body { grid-template-columns: 220px minmax(0, 1fr) 280px; }
    .rail-close { display: none; }
    .rail-open-btn { display: none; }
  }

  /* 860–1179: nav · main; the rail becomes a fixed right drawer so the page
     never grows horizontally. Opening it is presentation state only. */
  @media (min-width: 860px) and (max-width: 1179px) {
    .body { grid-template-columns: 200px minmax(0, 1fr); }
    .rail-open-btn { display: inline-flex; }
    .rail {
      position: fixed; top: 0; right: 0; height: 100%;
      width: min(300px, 86vw); overflow-y: auto;
      background: var(--bg-app); border-left: 1px solid var(--border-default);
      padding: var(--space-standard); transform: translateX(100%);
      transition: transform 160ms ease; z-index: 20;
    }
    .rail.rail-open { transform: translateX(0); }
    .rail-close { display: grid; place-items: center; }
  }

  /* <860: single column, everything in flow; nav becomes its own local
     scroll strip (never the page). 320px acceptance: no page-level overflow. */
  @media (max-width: 859px) {
    .body { grid-template-columns: minmax(0, 1fr); }
    .nav {
      display: flex; flex-direction: column; gap: var(--space-tight);
      max-width: 100%;
    }
    .nav-list {
      display: flex; gap: 2px; overflow-x: auto; -webkit-overflow-scrolling: touch;
      max-width: 100%;
    }
    .nav-item { white-space: nowrap; border-left: 0; border-bottom: 2px solid transparent; }
    .nav-item.active { border-bottom-color: var(--accent); }
    .nav-spacer { display: none; }
    .nav-nonmain { margin-top: 0; }
    .strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .topbar { align-items: stretch; }
    .topbar-right { justify-content: flex-start; }
    .rail { display: grid; gap: var(--space-standard); }
    .rail-close { display: none; }
    .rail-head { display: none; }
  }

  @media (max-width: 479px) {
    .shell { padding: var(--space-roomy) var(--page-gutter) var(--space-section); }
    .brand-text h1 { font-size: var(--text-display); line-height: var(--leading-display); }
    .facts { grid-template-columns: minmax(0, 1fr); }
    .topbar > * { width: 100%; }
    .topbar-right { width: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .rail { transition: none; }
  }

  /* Work detail stacking: under 1100px the two-column sections stack (docs/17 §9).
     Stacks at a higher threshold than the shell rail breakpoints because the split
     columns carry the deep proof + posture panels. */
  @media (max-width: 1099px) {
    .wd-split { grid-template-columns: minmax(0, 1fr); }
  }

</style>