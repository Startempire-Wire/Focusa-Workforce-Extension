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
  import { groupRoster, personFacts, distinctStates, matchingMembers } from './lib/roster-groups.js';
  import { needsBuckets } from './lib/needs-buckets.js';
  import { evidenceBuckets, evidenceSources } from './lib/evidence-buckets.js';
  import { localDaemonCandidates } from './lib/local-daemon.js';
  import { hasDaemonOriginPermission } from '../lib/validation.mjs';
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
    const target = event.target;
    const typing =
      (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) || false;
    // `/`: focus an existing local search; otherwise a correct no-op (docs/17 §20).
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !typing) {
      const local = document.querySelector('[data-local-search]');
      if (local && typeof local.focus === 'function') local.focus();
      return;
    }
    // `D`: focus Direction on the Work faces when not typing (docs/17 §20).
    if ((event.key === 'd' || event.key === 'D') && !event.ctrlKey && !event.metaKey && !event.altKey && !typing) {
      if (route === '#/work' || route === '#/work/detail') {
        const dir = document.querySelector('[data-direction]');
        if (dir && !dir.disabled) {
          event.preventDefault();
          dir.focus();
        }
      }
      return;
    }
    // `Cmd/Ctrl+Enter`: submit Direction when valid (docs/17 §20).
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.altKey && route === '#/work/detail') {
      const dir = document.querySelector('[data-direction]');
      if (dir && !dir.disabled && instruction.trim()) {
        event.preventDefault();
        const form = dir.closest('form');
        if (form) form.requestSubmit();
      }
      return;
    }
    // `Esc`: close the presentation-only context rail; never cancel canonical work (docs/17 §20).
    if (event.key === 'Escape' && railOpen) {
      railOpen = false;
    }
  }

  /* ---- app state ---- */
  let instruction = $state('');
  let environmentError = $state('');
  let scanFrom = $state('~/src');
  let bindInput = $state('');
  let bindResult = $state('');
  let pairUrl = $state('');
  let pairLabel = $state('');
  // UIAI settings form state
  let uiaiTokenInput = $state('');
  let uiaiProfile = $state('detect');
  let uiaiModel = $state('');
  let uiaiProvider = $state('');
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

  /* ---- Topology face (docs/17 §13: bodies, grouped) ---- */
  const topologyGroups = $derived(
    (() => {
      const byKind = new Map();
      for (const env of store.environments) {
        const role = env.kind === 'paired' ? 'Paired Focusa environment' : 'Local daemon (this device)';
        if (!byKind.has(role)) byKind.set(role, []);
        byKind.get(role).push(env);
      }
      return [...byKind.entries()].map(([role, bodies]) => ({ role, bodies }));
    })(),
  );

  /* ---- Audit face state (docs/17 §14: causal timeline) ---- */
  let auditClassFilter = $state('all');
  let auditActorFilter = $state('');
  const auditActors = $derived([...new Set(store.activity.map((e) => e.origin).filter(Boolean))]);
  const auditTimeline = $derived(
    store.activity.filter((event) => {
      if (auditClassFilter === 'observation' && !event.observation) return false;
      if (auditClassFilter === 'decision' && event.observation) return false;
      if (auditActorFilter && event.origin !== auditActorFilter) return false;
      return true;
    }),
  );

  /* docs/17 §15: after successful pairing, the store already selected the env,
     refreshed the owner source and restored the Workstream; route to Overview. */
  $effect(() => {
    if (store.pairing?.state === 'paired' && route === '#/settings') {
      navigate('#/overview');
    }
  });

  /* Wall face state (docs/17 §16: ambient read-only board) */
  const wallWorking = $derived(store.roster.filter((entry) => /working|active/.test(String(entry.state ?? ''))));
  const wallVerified = $derived(store.evidenceTrail.entries.filter((entry) => entry.kind === 'receipt' || entry.kind === 'projection'));

  /* docs/17 §18 deep-link ingress: exact-match disambiguation + revoked handoff */
  const handoffCandidates = $derived(
    routeCtx.refState === 'ok' ? matchingMembers(store.roster, routeCtx.ref) : [],
  );

  function goBackOrOverview() {
    if (window.history.length > 1) window.history.back();
    else navigate('#/overview');
  }

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
      : route === '#/wall' ? 'Wall'
      : 'Workforce',
  );

  const activeNav = $derived(navItemForRoute(route));

  /* ---- primary nav from docs/18 §4 (Needs You intentionally absent; Wall is an ambient addressable target, not primary nav) ---- */
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
    } else {
      // First-run code-side connect: Chrome's optional host-permission model
      // (docs/17 §15 + scripts/build.mjs: persistent host_permissions are
      // forbidden) requires ONE user-gesture grant; after that the permission
      // persists and every launch auto-connects silently.
      for (const candidate of localDaemonCandidates()) {
        let granted = false;
        try {
          granted = await hasDaemonOriginPermission(candidate);
        } catch {
          granted = false; // non-Chrome context (dev) — skip silently
        }
        if (!granted) continue;
        try {
          await store.addLocalDaemon(candidate);
          await store.refreshOwner();
          await store.startStream();
          break;
        } catch {
          // try the next candidate; leave the empty state if none answer
        }
      }
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

  function useCaptureAsDirection(capture) {
    instruction = (capture.instruction ?? capture.message ?? capture.note ?? `Page: ${capture.title ?? capture.source ?? ''}`).trim();
    document.querySelector('[data-direction]')?.focus();
  }

  async function openUiaiSession(sessionId) {
    const session = store.uiaiSessions?.[sessionId];
    if (session?.url) {
      window.open(session.url, '_blank', 'noopener,noreferrer');
    } else {
      try {
        const result = await store.shareUiai(sessionId);
        if (result?.share_url) window.open(result.share_url, '_blank', 'noopener,noreferrer');
      } catch (error) { console.error('Could not open UIAI session', error); }
    }
  }

  async function saveUiaiToken() {
    await store.setUiaiToken(uiaiTokenInput);
    uiaiTokenInput = '';
  }

  async function watchUiaiSession(target, sessionId) {
    if (!target) return;
    try {
      const result = await store.shareUiai(sessionId);
      if (result?.share_url) {
        // Deep link with return so the operator can come back to this work detail
        const returnUrl = encodeURIComponent(location.href);
        location.hash = `#/work/detail?env=${store.activeId}&return=${returnUrl}&watch=${sessionId}`;
      } else {
        console.error('No share URL from UIAI');
      }
    } catch (error) { console.error('Watch UIAI failed', error); }
  }

  async function connectLocal() {
    environmentError = '';
    // The browser sees a different loopback than the container: probe the
    // local candidates in order and keep the first the daemon answers.
    for (const candidate of localDaemonCandidates()) {
      try {
        await store.addLocalDaemon(candidate);
        return;
      } catch (error) {
        environmentError = `${candidate} unresolved (${error instanceof Error ? error.message : String(error)})`;
      }
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
      <!-- Needs You + Wall: addressable non-nav routes (docs/18 §4; ambient/contextual) -->
      <ul class="nav-list nav-nonmain">
        <li>
          <a class="nav-item needs-you {activeNav === 'Needs You' ? 'active' : ''}" href="#/needs-you" onclick={(e) => { e.preventDefault(); navigate('#/needs-you'); }}>
            Needs You
            <span class="nav-count" aria-label={`${counts.needsYou} items`}>{counts.needsYou}</span>
          </a>
        </li>
        <li>
          <a class="nav-item {activeNav === 'Wall' ? 'active' : ''}" href="#/wall" onclick={(e) => { e.preventDefault(); navigate('#/wall'); }}>
            Wall
          </a>
        </li>
      </ul>
    </nav>

    <!-- MAIN (route faces) -->
    <div class="main" id="wf-main" tabindex="-1">
      {#if store.bootError}
        <StateNote label="Extension" result={{ state: 'error', note: store.bootError }} />
      {/if}

      <!-- docs/17 §19 Unavailable/Stale: one banner below the surface header,
           last-known content retained, Refresh/Open source where useful. -->
      {#if store.resultOf('health') && store.resultOf('health').state !== 'ok'}
        <div class="banner {store.resultOf('health').state === 'degraded' ? 'degraded' : 'unavailable'}" role="status">
          <strong>{
            store.resultOf('health').state === 'network' || store.resultOf('health').state === 'invalid'
              ? 'Owner unavailable — showing last-known state'
              : store.resultOf('health').state === 'degraded'
                ? 'Owner degraded — showing last-known state'
                : `Owner ${store.resultOf('health').state.replace('_', ' ')}`
          }</strong>
          {#if store.resultOf('health').note}<span class="muted tiny">{store.resultOf('health').note}</span>{/if}
          <div class="row">
            <button type="button" class="wf-btn" onclick={() => store.refreshOwner()}>Refresh</button>
            {#if store.active?.baseUrl}
              <a class="wf-btn" href={store.active.baseUrl} target="_blank" rel="noreferrer">Open source</a>
            {/if}
          </div>
        </div>
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

      <!-- docs/17 §18: a handoff whose guard denies renders the revoked card in MAIN (no modal, no new route). -->
      {#if store.scopeGuard.level !== 'ok' && routeCtx.refState === 'ok'}
        <section class="card" aria-labelledby="wf-handoff-revoked">
          <div class="card-head"><h2 id="wf-handoff-revoked">Revoked handoff</h2></div>
          <p class="gap">This handoff no longer grants access to this context. {store.scopeGuardLabel}</p>
          <div class="row">
            <button type="button" class="wf-btn" onclick={goBackOrOverview}>Return</button>
            <button type="button" class="wf-btn" onclick={() => navigate('#/overview')}>Open Workforce</button>
          </div>
          <p class="muted tiny">No credential is transported in the visible URL (docs/17 §18).</p>
        </section>
      {/if}
      <!-- docs/17 §18: two or more exact candidates → choose destination in the MAIN region. -->
      {#if handoffCandidates.length > 1 && (route === '#/work/detail' || route === '#/people/detail')}
        <section class="card" aria-labelledby="wf-choose-dest">
          <div class="card-head"><h2 id="wf-choose-dest">Choose destination</h2></div>
          <p class="muted tiny">This reference names more than one member — Workforce does not guess.</p>
          <ul class="items compact">
            {#each handoffCandidates as candidate (candidate.id)}
              <li>
                <button type="button" class="wf-btn"
                  onclick={() => navigate(buildRoute('#/people/detail', { env: routeCtx.params.env, ref: { session_id: candidate.id } }))}>
                  {candidate.label}
                </button>
                <span class="muted tiny">{candidate.state}{#if candidate.role} · {candidate.role}{/if}</span>
              </li>
            {/each}
          </ul>
        </section>
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
              <textarea data-direction rows="3" aria-label="Direction instruction" placeholder="Direct this work…" bind:value={instruction} disabled={store.directing}></textarea>
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

          {#if store.pageCaptures.length}
            <section id="wf-incoming" aria-labelledby="wf-incoming-title">
              <h2 id="wf-incoming-title">Incoming page work</h2>
              <p class="muted tiny">
                Captured locally by this extension from the browser context menu — never a daemon item until an owner
                operation accepts it. Submitting routes the page context to the work-loop driver
                (focusa.agent_execution.prompt, scoped to the selected Workstream).
              </p>
              <ul class="capture-list">
                {#each store.pageCaptures as capture (capture.id)}
                  {#if !store.pageWorkOutcomeFor(capture.id)?.ok}
                    <li>
                      <p class="flow">
                        <strong>{capture.title}</strong>
                        <a href={capture.source} target="_blank" rel="noreferrer">Open source</a>
                        <span></span>
                      </p>
                      <p class="muted tiny">{(capture.note || capture.selection || capture.instruction || '').slice(0, 240)}</p>
                      <div class="row">
                        <button type="button" class="wf-btn" onclick={() => useCaptureAsDirection(capture)} disabled={store.directing}>Use as Direction</button>
                        <button type="button" class="wf-btn" onclick={() => store.submitPageWork(capture.id)} disabled={store.pageWorkBusy}>Submit to work-loop driver</button>
                        <button type="button" class="wf-btn" onclick={() => store.removePageCapture(capture.id)}>Dismiss</button>
                        {#if store.pageWorkOutcomeFor(capture.id)}
                          <span class="muted tiny {store.pageWorkOutcomeFor(capture.id).ok ? '' : 'wf-err'}">
                            {#if store.pageWorkOutcomeFor(capture.id).ok}
                              Driver accepted{store.pageWorkOutcomeFor(capture.id).replayed ? ' (idempotent replay)' : ''}{store.pageWorkOutcomeFor(capture.id).session_id ? ` · session ${store.pageWorkOutcomeFor(capture.id).session_id}` : ''}
                            {:else}
                              {store.pageWorkOutcomeFor(capture.id).kind} — {store.pageWorkOutcomeFor(capture.id).message}
                            {/if}
                          </span>
                        {/if}
                      </div>
                    </li>
                  {/if}
                {/each}
              </ul>
            </section>
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
              <textarea data-direction rows="3" aria-label="Direction instruction" placeholder="Direct this work…" bind:value={instruction} disabled={store.directing}></textarea>
              <div class="row">
                <button type="submit" class="wf-btn wf-btn-primary" disabled={store.directing || !instruction.trim()}>{store.directing ? 'Submitting…' : 'Send Direction'}</button>
                {#each ['start', 'pause', 'resume', 'cancel'] as action (action)}
                  <button type="button" class="wf-btn" disabled={store.directing} onclick={() => store.controlSession({ action, target: steerTarget })}>{action}</button>
                {/each}
                {#if store.uiaiSessions && Object.keys(store.uiaiSessions).length > 0}
                  {#each Object.values(store.uiaiSessions) as uis (uis.session_id)}
                    <button type="button" class="wf-btn" onclick={() => openUiaiSession(uis.session_id)} disabled={store.uiaiBusy}>Open in UIAI</button>
                    <button type="button" class="wf-btn" onclick={() => watchUiaiSession(steerTarget, uis.session_id)} disabled={store.uiaiBusy}>Watch</button>
                  {/each}
                {/if}
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
        <!-- ============ TOPOLOGY (docs/17 §13: bodies, grouped) ============ -->
        <section class="card" aria-labelledby="wf-topology">
          <div class="card-head">
            <h2 id="wf-topology">Topology</h2>
            <span class="count-chip">{store.environments.length}</span>
          </div>
          <p class="source stopgap">source: paired/local bodies Workforce knows (owner-reported); Interactive/Browser-execution/Compute classification is NOT owner-reported — not invented (docs/17 §13).</p>

          {#if store.environments.length === 0}
            <p class="empty">No paired Focusa environment — pair one below.</p>
          {:else}
            {#each topologyGroups as group (group.role)}
              <h3 class="bucket">{group.role}</h3>
              <div class="body-grid">
                {#each group.bodies as body (body.id)}
                  <article class="body-card {body.id === store.activeId ? 'active' : ''}">
                    <div class="body-head">
                      <strong>{body.label}</strong>
                      {#if body.id === store.activeId}<span class="state-sig">active</span>{/if}
                    </div>
                    <p class="muted tiny">role in workforce: {body.kind}</p>
                    {#if body.id === store.activeId}
                      <StateNote label="Health" result={store.resultOf('health')} />
                      <StateNote label="Entitlement" result={store.resultOf('license')} />
                    {:else}
                      <p class="muted tiny">owner reports health/entitlement for the active body only.</p>
                    {/if}
                    <details class="capability">
                      <summary>Technical detail</summary>
                      <dl class="facts">
                        <dt>Base URL</dt><dd><code>{body.baseUrl}</code></dd>
                        <dt>Scopes</dt><dd>{body.scopes?.join(' · ') ?? '—'}</dd>
                        <dt>Auth</dt><dd>{body.token ? 'token stored' : 'no token (local)'}</dd>
                      </dl>
                    </details>
                  </article>
                {/each}
              </div>
            {/each}
            <p class="muted tiny">Body cards show owner-reported facts; CPU/RAM stay out of headlines unless they are the reason you are here (docs/17 §13).</p>
          {/if}

          <div class="row">
            <label class="field">
              <span>Active</span>
              <select value={store.activeId} onchange={(e) => store.setEnvironment(e.currentTarget.value)}>
                {#each store.environments as env (env.id)}
                  <option value={env.id}>{env.label}{#if env.kind === 'local'} (local){/if}</option>
                {/each}
              </select>
            </label>
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

          <p class="muted tiny">Workstream bindings for each body appear when the owner assigns them; the selection above is this extension's active body choice.</p>
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
            <div class="row audit-tools">
              <label class="field audit-filter">
                <span>Event class</span>
                <select value={auditClassFilter} onchange={(e) => (auditClassFilter = e.currentTarget.value)}>
                  <option value="all">All events</option>
                  <option value="decision">Decisions</option>
                  <option value="observation">Observations</option>
                </select>
              </label>
              <label class="field audit-filter">
                <span>Actor</span>
                <select value={auditActorFilter} onchange={(e) => (auditActorFilter = e.currentTarget.value)}>
                  <option value="">All actors</option>
                  {#each auditActors as actor (actor)}
                    <option value={actor}>{actor}</option>
                  {/each}
                </select>
              </label>
            </div>
            <ol class="timeline">
              {#each auditTimeline.slice(0, 12) as event (event.id ?? `${event.type}-${event.timestamp}`)}
                <li class:observation={event.observation}>
                  <time class="t-time">{event.timestamp ?? '—'}</time>
                  <span class="t-body">
                    <strong>{event.type ?? 'event'}</strong>
                    {#if event.observation}<span class="kind">observation</span>{/if}
                    {#if event.origin}<span class="muted tiny">actor {event.origin}</span>{/if}
                    {#if event.sessionId}<span class="muted tiny">workstream/session {event.sessionId}</span>{/if}
                  </span>
                  <details class="capability t-tech">
                    <summary>raw</summary>
                    <pre class="output">{JSON.stringify(event, null, 1)}</pre>
                  </details>
                </li>
              {/each}
            </ol>
            <p class="muted tiny">Single vertical causal timeline (docs/17 §14); technical raw events are a per-row verbosity toggle, never a parallel default table. Result/proof cues render when the owner reports them.</p>
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

      {:else if route === '#/wall'}
        <!-- ============ WALL (docs/17 §16: ambient, read-only, distance board) ============ -->
        <section class="wall" aria-labelledby="wf-wall">
          <header class="wall-bar">
            <h2 id="wf-wall" class="wall-bar-title">Focusa Workforce</h2>
            <span class="wall-fresh">
              {#if store.resultOf('health')?.state === 'ok'}● Fresh{:else}● {store.resultOf('health')?.state ?? 'no environment'}{/if}
              {store.active ? ` · ${store.active.label}` : ''}
            </span>
          </header>

          <div class="wall-focus">
            <h3 class="wall-section-label">Current focus</h3>
            {#if store.foremanCard.objective}
              <p class="wall-focus-title">{store.foremanCard.objective}</p>
              {#if store.foremanCard.frontier}<p class="wall-focus-sub">{store.foremanCard.frontier}</p>{/if}
              <p class="muted tiny">frontier via {store.foremanCard.source}{#if store.foremanCard.revision} · rev {store.foremanCard.revision}{/if}</p>
            {:else}
              <p class="wall-focus-title empty">No current focus reported.</p>
            {/if}
          </div>

          <div class="wall-grid">
            <section class="wall-col" aria-labelledby="wf-wall-working">
              <h3 id="wf-wall-working" class="wall-section-label">Working now <span class="count-chip">{wallWorking.length}</span></h3>
              {#if wallWorking.length === 0}
                <p class="muted tiny">No working members reported.</p>
              {:else}
                <ul class="items compact">
                  {#each wallWorking.slice(0, 3) as row (row.id)}
                    <li><strong>{row.label}</strong><span class="muted tiny">{row.state}{#if row.role} · {row.role}{/if}</span></li>
                  {/each}
                </ul>
              {/if}
            </section>

            <section class="wall-col" aria-labelledby="wf-wall-needs">
              <h3 id="wf-wall-needs" class="wall-section-label">Needs you <span class="count-chip">{counts.needsYou}</span></h3>
              {#if store.needsYou.items.length === 0}
                <p class="muted tiny">Nothing needs a human decision right now.</p>
              {:else}
                <ul class="items compact">
                  {#each store.needsYou.items.slice(0, 3) as item (`${item.kind}:${item.label}`)}
                    <li><strong>{item.label}</strong><span class="muted tiny">{item.kind.replace('_', ' ')}</span></li>
                  {/each}
                </ul>
                {#if store.needsYou.items.length > 3}<p class="muted tiny">…and {store.needsYou.items.length - 3} more on <a href="#/needs-you" onclick={(e) => { e.preventDefault(); navigate('#/needs-you'); }}>Needs You</a>.</p>{/if}
              {/if}
            </section>

            <section class="wall-col" aria-labelledby="wf-wall-verified">
              <h3 id="wf-wall-verified" class="wall-section-label">Verified recently <span class="count-chip">{wallVerified.length}</span></h3>
              {#if wallVerified.length === 0}
                <p class="muted tiny">No settled owner references yet.</p>
              {:else}
                <ul class="items compact">
                  {#each wallVerified.slice(0, 3) as entry (`${entry.kind}:${entry.ref}`)}
                    <li><span class="kind">{entry.kind}</span><code>{entry.ref}</code></li>
                  {/each}
                </ul>
                {#if wallVerified.length > 3}<p class="muted tiny">…and {wallVerified.length - 3} more on <a href="#/evidence" onclick={(e) => { e.preventDefault(); navigate('#/evidence'); }}>Evidence</a>.</p>{/if}
              {/if}
            </section>
          </div>

          {#if store.anyBlocked || environmentError || store.pairingError}
            <p class="wall-exception">Exception (material only): {store.anyBlocked ? 'entitlement policy is denying canonical operations' : ''}{environmentError ? ` ${environmentError}` : ''}{store.pairingError ? ` ${store.pairingError}` : ''} — <a href="#/topology" onclick={(e) => { e.preventDefault(); navigate('#/topology'); }}>Topology</a></p>
          {/if}

          <p class="muted tiny">Ambient read-only view; when content overflows, the board summarizes and hands off to the <a href="#/work" onclick={(e) => { e.preventDefault(); navigate('#/work'); }}>Full Workforce</a> (docs/17 §16). No scrolling log.</p>
        </section>

      {:else if route === '#/settings'}
        <!-- ============ SETTINGS / CONNECTIONS (docs/17 §15) ============ -->
        {@const settingsSection = routeCtx.params.section ?? 'connections'}
        <section class="settings" aria-labelledby="wf-settings" style:max-width="1040px">
          <div class="card-head">
            <h2 id="wf-settings" class="settings-title">Settings</h2>
            <nav class="settings-nav" aria-label="Settings sections">
              <a href="#/settings?section=connections" onclick={(e) => { e.preventDefault(); navigate('#/settings?section=connections'); }} class:active={settingsSection === 'connections'}>Connections</a>
              <a href="#/settings?section=appearance" onclick={(e) => { e.preventDefault(); navigate('#/settings?section=appearance'); }} class:active={settingsSection === 'appearance'}>Appearance</a>
              <a href="#/settings?section=notifications" onclick={(e) => { e.preventDefault(); navigate('#/settings?section=notifications'); }} class:active={settingsSection === 'notifications'}>Notifications</a>
              <a href="#/settings?section=browser-permissions" onclick={(e) => { e.preventDefault(); navigate('#/settings?section=browser-permissions'); }} class:active={settingsSection === 'browser-permissions'}>Browser permissions</a>
              <a href="#/settings?section=public-demo" onclick={(e) => { e.preventDefault(); navigate('#/settings?section=public-demo'); }} class:active={settingsSection === 'public-demo'}>Public demo</a>
              <a href="#/settings?section=uiai" onclick={(e) => { e.preventDefault(); navigate('#/settings?section=uiai'); }} class:active={settingsSection === 'uiai'}>UIAI Engine</a>
              <a href="#/settings?section=advanced" onclick={(e) => { e.preventDefault(); navigate('#/settings?section=advanced'); }} class:active={settingsSection === 'advanced'}>Advanced</a>
            </nav>
          </div>

          {#if settingsSection === 'connections'}
            <div class="settings-split">
              <section class="set-group" aria-labelledby="wf-envs">
                <h3 id="wf-envs">Your environments</h3>
                {#if store.environments.length === 0}
                  <p class="empty">No paired Focusa environment yet — pair one on the right.</p>
                {:else}
                  <ul class="items compact">
                    {#each store.environments as env (env.id)}
                      <li class="env-row">
                        <button type="button" class="env-select" class:env-active={env.id === store.activeId} onclick={() => store.setEnvironment(env.id)}>
                          <strong>{env.label}</strong>
                          <span class="state-sig">{env.id === store.activeId ? 'Active' : 'Standby'}</span>
                        </button>
                        <span class="muted tiny">{env.kind} · <code>{env.baseUrl}</code></span>
                      </li>
                    {/each}
                  </ul>
                  <div class="row">
                    <button type="button" class="wf-btn" onclick={connectLocal} disabled={store.environments.some((e) => e.kind === 'local')}>
                      {store.environments.some((e) => e.kind === 'local') ? 'Local daemon connected' : 'Use the daemon on this device'}
                    </button>
                  </div>
                  {#if environmentError}<p class="gap">{environmentError}</p>{/if}
                  <p class="muted tiny">Health/liveness per body renders when the owner reports it; “Fresh/Offline” is not invented.</p>
                {/if}
              </section>

              <section class="set-group" aria-labelledby="wf-pair">
                <h3 id="wf-pair">Pair Focusa</h3>
                {#if !store.pairing}
                  <form onsubmit={(event) => { event.preventDefault(); store.beginPairing({ baseUrl: pairUrl, label: pairLabel || 'Focusa daemon' }); }} class="stack">
                    <label class="field">
                      <span>Environment label</span>
                      <input type="text" aria-label="Environment label" placeholder="label (optional)" bind:value={pairLabel} />
                    </label>
                    <label class="field">
                      <span>Focusa address</span>
                      <input type="text" aria-label="Daemon URL" placeholder="https://daemon.example:8787" bind:value={pairUrl} />
                    </label>
                    <button type="submit" class="wf-btn" disabled={store.pairingBusy || !pairUrl.trim()}>Start pairing</button>
                  </form>
                {:else if store.pairing.state === 'awaiting_approval'}
                  <p class="muted tiny">PAIRING CODE</p>
                  <p class="pair-code">{store.pairing.code}</p>
                  <p class="muted tiny">Approve in Focusa on the daemon — or run: <code>{store.pairing.operator_command ?? ''}</code></p>
                  <p class="muted tiny">expires {store.pairing.expires_at}</p>
                  <div class="row">
                    <button type="button" class="wf-btn" onclick={() => store.checkPairingNow()} disabled={store.pairingBusy}>Check again</button>
                    <button type="button" class="wf-btn" onclick={() => store.cancelPairing()}>Cancel</button>
                  </div>
                {:else}
                  <p class="gap">pairing {store.pairing.state}</p>
                  <button type="button" class="wf-btn" onclick={() => store.cancelPairing()}>Reset</button>
                {/if}
                {#if store.pairingError}<p class="gap">{store.pairingError}</p>{/if}
                <p class="muted tiny">On success Workforce selects the environment, refreshes the owner source, restores/requests the Workstream, and routes to Overview (docs/17 §15).</p>
              </section>
            </div>
          {:else if settingsSection === 'appearance'}
            <div class="set-group">
              <h3>Appearance</h3>
              <p class="muted tiny">The workforce shell follows the extension/OS theme tokens and respects reduced motion. Owner-provided appearance options render here when they exist — none are invented.</p>
            </div>
          {:else if settingsSection === 'notifications'}
            <div class="set-group">
              <h3>Notifications</h3>
              <p class="muted tiny">{store.notifications.length} notification(s) stored; {store.unreadCount} unread.</p>
              <div class="row">
                <button type="button" class="wf-btn" onclick={() => store.markAllRead()} disabled={store.unreadCount === 0}>Mark all read</button>
              </div>
            </div>
          {:else if settingsSection === 'browser-permissions'}
            <div class="set-group">
              <h3>Browser &amp; context permissions</h3>
              <p class="muted tiny">Declared extension permissions are <code>storage</code>, <code>alarms</code>, <code>notifications</code> — scoped to this extension.</p>
              <p class="muted tiny">Focusa sessions run in the platform browser Workforce does not drive directly; no invented site permission is claimed.</p>
            </div>
          {:else if settingsSection === 'public-demo'}
            <div class="set-group">
              <h3>Public demo / local behavior</h3>
              <p class="muted tiny">The public <code>os.focusa.dev</code> profile is a read-only demo — Workforce never authenticates there.</p>
              <p class="muted tiny">Local behavior: a loopback daemon on this device pairs without a token (principal: local-loopback).</p>
            </div>
          {:else if settingsSection === 'uiai'}
            <div class="set-group" style="max-width: 720px;">
              <h3>UIAI Engine</h3>
              <p class="muted tiny">The UIAI engine runs at <code>http://100.115.92.26:7456</code> (bridged from loopback 7456). Configure the extension token and launch browser sessions for live execution.</p>
              {#if store.uiaiHealth}
                <div class="row">
                  <span class:ok={store.uiaiHealth.healthy} class:warn={!store.uiaiHealth.healthy && store.uiaiHealth.reachable} class:err={!store.uiaiHealth.reachable}>
                    {store.uiaiHealth.healthy ? 'Engine healthy' : (store.uiaiHealth.reachable ? 'Engine reachable but degraded' : 'Engine unreachable')}
                  </span>
                  <button type="button" class="wf-btn" onclick={() => store.checkUiai()} disabled={store.uiaiBusy}>Refresh</button>
                </div>
              {:else}
                <button type="button" class="wf-btn" onclick={() => store.checkUiai()} disabled={store.uiaiBusy}>Check engine</button>
              {/if}
              <hr style="margin: 12px 0;">
              <label class="field">
                <span>Extension token (X-Extension-Token)</span>
                <input type="password" aria-label="UIAI extension token" placeholder="set once; never printed" bind:value={uiaiTokenInput} />
                <button type="button" class="wf-btn" onclick={saveUiaiToken} disabled={store.uiaiBusy || !uiaiTokenInput.trim()}>Save</button>
              </label>
              {#if store.uiaiToken}
                <p class="muted tiny ok">Token configured (hidden).</p>
              {:else}
                <p class="muted tiny gap">No token — session create will fail.</p>
              {/if}
              <hr style="margin: 12px 0;">
              <div class="row">
                <select bind:value={uiaiProfile}>
                  <option value="detect">detect</option>
                  <option value="no_detect">no_detect</option>
                  <option value="research">research</option>
                  <option value="operator">operator</option>
                </select>
                <input type="text" placeholder="model (optional)" bind:value={uiaiModel} style="width: 180px;" />
                <input type="text" placeholder="provider (optional)" bind:value={uiaiProvider} style="width: 180px;" />
                <button type="button" class="wf-btn wf-btn-primary" onclick={() => store.createUiai({ profile: uiaiProfile, model: uiaiModel || undefined, provider: uiaiProvider || undefined })} disabled={store.uiaiBusy || !store.uiaiToken}>Create session</button>
              </div>
              {#if Object.keys(store.uiaiSessions).length}
                <ul class="items">
                  {#each Object.values(store.uiaiSessions) as session (session.session_id)}
                    <li>
                      <span><strong>{session.session_id}</strong> · {session.status}</span>
                      {#if session.url}<a href={session.url} target="_blank" rel="noreferrer" class="muted tiny">open</a>{/if}
                      <div class="row">
                        <button type="button" class="wf-btn" onclick={() => store.shareUiai(session.session_id).then((r) => navigator.clipboard.writeText(r.share_url)).catch(() => {})} disabled={store.uiaiBusy}>Copy share link</button>
                        <button type="button" class="wf-btn" onclick={() => store.closeUiai(session.session_id)} disabled={store.uiaiBusy}>Close</button>
                      </div>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="muted tiny">No active UIAI sessions.</p>
              {/if}
              <hr style="margin: 12px 0;">
              <div class="set-group">
                <h4>Operator takeover (MLG-6.2)</h4>
                <p class="muted tiny">UIAI sessions with captcha/auth challenges surface here. Engine config: operator_escalation=true, challenge_policy=solve_and_retry.</p>
                <div class="row">
                  <button type="button" class="wf-btn" onclick={() => store.pollUiaiTakeover()} disabled={store.uiaiBusy}>Check for takeover needs</button>
                </div>
                {#if Object.keys(store.uiaiTakeovers).length}
                  <ul class="items">
                    {#each Object.entries(store.uiaiTakeovers) as [sessionId, t] (sessionId)}
                      <li class="takeover-item">
                        <span class="kind">takeover</span>
                        <strong>{sessionId}</strong>
                        <span class="muted tiny">{t.reason ?? t.challenge?.type ?? 'needs human'}</span>
                        <div class="row">
                          <button type="button" class="wf-btn wf-btn-primary" onclick={() => { store.shareUiai(sessionId).then(r => { if(r?.share_url) window.open(r.share_url, '_blank', 'noopener,noreferrer'); }); }}>Take over in UIAI</button>
                          <button type="button" class="wf-btn" onclick={() => { delete store.uiaiTakeovers[sessionId]; }}>Dismiss</button>
                        </div>
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <p class="muted tiny">No sessions currently need takeover.</p>
                {/if}
              </div>
            </div>
          {:else}
            <div class="set-group">
              <h3>Advanced / debug</h3>
              <dl class="facts">
                <dt>Loaded build</dt><dd>{buildStamp}</dd>
                <dt>Route</dt><dd><code>{route}</code></dd>
                <dt>Addressable routes</dt><dd>{ROUTES.length} · <code>#/needs-you</code> is a non-nav route</dd>
                <dt>Intents</dt><dd>{INTENTS.join(', ')}</dd>
              </dl>
              <p class="muted tiny">All Workforce data is local to this extension (no remote sync surface). A wipe/export action renders when the owner provides one.</p>
            </div>
          {/if}
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

      {#if Object.keys(store.uiaiTakeovers).length}
        <section class="rail-block" aria-labelledby="rail-uiai-takeover">
          <h3 id="rail-uiai-takeover">UIAI Takeover</h3>
          <p class="count-big">{Object.keys(store.uiaiTakeovers).length}</p>
          <ul class="items compact">
            {#each Object.entries(store.uiaiTakeovers) as [sessionId, t] (sessionId)}
              <li>
                <span class="kind">takeover</span>
                <strong>{sessionId.slice(0, 12)}…</strong>
                <span class="muted tiny">{t.reason ?? 'needs human'}</span>
              </li>
            {/each}
          </ul>
          <a class="inline-link" href="#/settings?section=uiai" onclick={(e) => { e.preventDefault(); navigate('#/settings?section=uiai'); }}>Open UIAI Engine</a>
        </section>
      {/if}

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
  .body-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-standard); }
  .body-card {
    background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md);
    padding: var(--space-compact) var(--space-roomy); display: grid; gap: var(--space-tight); min-width: 0;
    box-shadow: var(--elevation-card);
  }
  .body-card.active { border-color: var(--accent); }
  .body-head { display: flex; align-items: center; gap: var(--space-tight); justify-content: space-between; }
  .audit-tools { align-items: center; }
  .audit-filter { flex: 0 1 13rem; }
  .timeline { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; border-left: 1px solid var(--border-default); }
  .timeline li {
    display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: var(--space-tight);
    align-items: baseline; padding: var(--space-tight) var(--space-compact); border-bottom: 1px solid var(--border-default);
  }
  .timeline li.observation { background: var(--bg-subtle); }
  .t-time { font-size: var(--text-micro); color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .t-body { display: flex; flex-wrap: wrap; gap: var(--space-tight); align-items: baseline; font-size: var(--text-small); }
  .t-tech { font-size: var(--text-micro); }
  .settings-title { margin: 0; }
  .settings { display: grid; gap: var(--space-standard); }
  .settings-nav { display: flex; flex-wrap: wrap; gap: var(--space-tight); font-size: var(--text-small); }
  .settings-nav a { color: var(--text-muted); text-decoration: none; border-bottom: 1px solid transparent; }
  .settings-nav a.active, .settings-nav a:hover { color: var(--text-strong); border-bottom-color: var(--accent); }
  .settings-split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-standard); align-items: start; }
  .set-group { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: var(--space-compact) var(--space-roomy); display: grid; gap: var(--space-tight); }
  .set-group h3 { margin: 0; font-size: var(--text-small); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .env-row { display: grid; gap: var(--space-tight); }
  .env-select { display: flex; justify-content: space-between; align-items: center; gap: var(--space-tight); width: 100%; background: transparent; border: 1px solid var(--border-default); border-radius: var(--radius-sm); padding: var(--space-tight) var(--space-compact); color: inherit; font: inherit; cursor: pointer; }
  .env-select.env-active { border-color: var(--accent); }
  .env-select:hover { border-color: var(--accent); }
  .pair-code { font-size: 1.4rem; letter-spacing: 0.18em; font-variant-numeric: tabular-nums; }
  .stack { display: grid; gap: var(--space-tight); }
  /* Wall (docs/17 §16): larger type, 32–40px gutters, max 1600px, read-only */
  .wall { max-width: 1600px; display: grid; gap: 32px; }
  .wall-bar { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-standard); border-bottom: 1px solid var(--border-default); padding-bottom: var(--space-tight); }
  .wall-bar-title { margin: 0; font-size: 1.15rem; }
  .wall-fresh { color: var(--text-muted); font-size: var(--text-small); }
  .wall-focus { display: grid; gap: var(--space-tight); max-width: 46rem; }
  .wall-section-label { margin: 0; font-size: 1rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .wall-focus-title { margin: 0; font-size: clamp(1.75rem, 2.5vw, 2rem); font-weight: 650; line-height: 1.15; }
  .wall-focus-sub { margin: 0; font-size: 1.05rem; color: var(--text-muted); }
  .wall-grid { display: grid; grid-template-areas: 'working needs verified'; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px 40px; }
  .wall-col { display: grid; gap: var(--space-tight); align-content: start; }
  .wall-col#wall-col-working { grid-area: working; }
  .wall-col#wall-col-needs { grid-area: needs; }
  .wall-col#wall-col-verified { grid-area: verified; }
  .wall-exception { border: 1px solid var(--border-warning, #d99a2b); border-radius: var(--radius-md); padding: var(--space-compact); color: var(--text-warning, inherit); }
  /* docs/17 §19: consistent degraded geometry — one banner, retained content */
  .banner { border: 1px solid var(--border-default); border-left-width: 4px; border-radius: var(--radius-md); padding: var(--space-compact) var(--space-roomy); display: grid; gap: var(--space-tight); align-items: start; background: var(--bg-surface); }
  .banner.unavailable { border-left-color: var(--border-warning, #d99a2b); }
  .banner.degraded { border-left-color: var(--accent); }
  /* <900px: Current Focus → Needs You → Working Now → Verified, one column */
  @media (max-width: 899px) {
    .wall-grid { grid-template-areas: 'needs' 'working' 'verified'; grid-template-columns: minmax(0, 1fr); }
  }

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

  /* docs/17 §15: <900px stacks environments first, pairing second */
  @media (max-width: 899px) {
    .settings-split { grid-template-columns: minmax(0, 1fr); }
  }

</style>