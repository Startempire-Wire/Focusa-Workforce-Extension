<script>
  /**
   * Start Page — return/orientation surface (docs/11 §2, §19; docs/10 WF-SUR-003).
   *
   * Concise by contract: connection posture, the current Workstream, the owner's
   * attention count, a working summary and recent owner-reported proof — plus the
   * primary "Continue current Workstream" action and the two secondary handoffs.
   * It performs no consequential mutation, so a stale owner leaves it safe to use.
   */
  import { onMount } from 'svelte';
  import { createWorkforceStore } from '../workforce/lib/workforce-store.svelte.js';

  const store = createWorkforceStore();
  const buildStamp = typeof __WF_BUILD__ === 'string' ? __WF_BUILD__ : 'dev';

  /** Owner freshness, read from the owner stream posture rather than assumed. */
  const staleness = $derived(
    !store.active ? 'unconfigured'
      : store.streamState?.phase === 'live' ? 'fresh'
        : store.streamState?.phase === 'replaying' ? 'replaying'
          : 'stale',
  );

  const workingSummary = $derived(
    store.roster.length === 0
      ? 'no session reported'
      : `${store.roster.length} session(s): ${[...new Set(store.roster.map((r) => r.state ?? 'unknown'))].join(', ')}`,
  );

  const proof = $derived(store.evidenceTrail.entries.slice(0, 3));

  function open(path) {
    chrome.tabs.create({ url: chrome.runtime.getURL(path) });
  }

  onMount(async () => {
    await store.refreshEnvironments();
    if (store.active) {
      await store.refreshOwner();
      await store.startStream();
    }
    return () => store.stopStream();
  });
</script>

<main>
  <header>
    <div class="brand">
      <span class="mark" aria-hidden="true">F</span>
      <div>
        <p class="wf-section-label">Focusa Workforce</p>
        <p class="stamp" title="loaded build">{buildStamp}</p>
      </div>
    </div>
    <span class="freshness {staleness}">
      {#if staleness === 'fresh'}owner stream live
      {:else if staleness === 'replaying'}replaying owner events
      {:else if staleness === 'unconfigured'}no environment
      {:else}stale — last confirmed{store.lastEventAt ? ` ${store.lastEventAt}` : ''}{/if}
    </span>
  </header>

  <section class="welcome">
    <h1>{store.projectDashboard?.selected?.root?.split('/').filter(Boolean).pop() ?? 'Focusa Workforce'} is in focus.</h1>
    <p class="lead">
      {#if !store.active}
        No Focusa environment is paired on this device yet.
      {:else}
        {store.active.label} · Focusa {store.health?.version ?? 'unknown'} ·
        entitlement {store.entitlementState ?? 'unknown'}
        {#if staleness === 'stale'}· last confirmed data only{/if}
      {/if}
    </p>
  </section>

  <div class="actions">
    {#if !store.active}
      <button type="button" class="primary" onclick={() => open('workforce.html')}>Pair Focusa</button>
      <span class="note">Pairing lives in the full Workforce page.</span>
    {:else}
      <button
        type="button"
        class="primary"
        disabled={!store.directionTarget}
        title={store.directionTarget ? 'Open the current Workstream in the full page' : 'No exact owner target reported yet'}
        onclick={() => open('workforce.html')}
      >Continue current Workstream</button>
      <button type="button" onclick={() => open('workforce.html')}>Open Needs You ({store.needsYou.items.length})</button>
      <button type="button" onclick={() => open('workforce.html')}>Open Workforce</button>
    {/if}
  </div>

  <section class="facts-card" aria-label="Current orientation">
    <dl>
      <dt>Connection</dt>
      <dd>
        {#if !store.active}not paired
        {:else}{store.active.baseUrl} · health {store.resultOf('health')?.state ?? 'unknown'}{/if}
      </dd>
      <dt>Workstream</dt>
      <dd>{store.workstream ? `${store.workstream.projectRoot} · ${store.workstream.continuityId}` : 'not selected'}</dd>
      <dt>Needs You</dt>
      <dd>{store.needsYou.items.length} {#if store.needsYou.authoritative}(owner-reported){:else}(derived from owner signals){/if}</dd>
      <dt>Working</dt>
      <dd>{workingSummary}</dd>
      <dt>Recent proof</dt>
      <dd>
        {#if proof.length === 0}
          none reported by Focusa yet
        {:else}
          {#each proof as item (`${item.kind}:${item.ref}`)}<code>{item.ref}</code>{/each}
          <span class="note">owner-reported references ({store.evidenceTrail.authoritative ? 'evidence projection' : 'no evidence projection yet'})</span>
        {/if}
      </dd>
      <dt>Scope</dt>
      <dd>{store.scopeGuardLabel}</dd>
    </dl>
  </section>
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--space-major) var(--page-gutter) var(--space-page);
    display: grid;
    gap: var(--space-section);
    min-height: 100vh;
    align-content: start;
  }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-standard); flex-wrap: wrap; }
  .brand { display: flex; gap: var(--space-compact); align-items: center; }
  .mark {
    display: grid; place-items: center; width: 40px; height: 40px;
    border-radius: var(--radius-md); background: var(--accent); color: var(--text-inverse);
    font-weight: var(--weight-bold); font-size: 19px;
  }
  .stamp { margin: 2px 0 0; font-family: var(--font-mono); font-size: var(--text-micro); color: var(--text-secondary); }
  .freshness {
    font-size: var(--text-micro); font-weight: var(--weight-semibold);
    text-transform: uppercase; letter-spacing: 0.06em;
    border: 1px solid currentColor; border-radius: var(--radius-pill);
    padding: 2px var(--space-tight);
  }
  .freshness.fresh { color: var(--success); }
  .freshness.replaying { color: var(--warning); }
  .freshness.stale, .freshness.unconfigured { color: var(--text-muted); }

  h1 {
    font-size: var(--text-display); line-height: var(--leading-display);
    font-weight: var(--weight-bold); margin: 0; max-width: 22ch;
  }
  .lead { margin: var(--space-tight) 0 0; color: var(--text-secondary); font-size: var(--text-body); max-width: 60ch; }

  .actions { display: flex; gap: var(--space-tight); flex-wrap: wrap; align-items: center; }
  button {
    font: inherit; font-size: var(--text-small); font-weight: var(--weight-medium);
    color: var(--text-primary); background: var(--bg-surface);
    border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
    padding: var(--space-tight) var(--space-standard); min-height: 36px; cursor: pointer;
  }
  button:hover { background: var(--bg-hover); }
  button:disabled { color: var(--text-disabled); background: var(--bg-subtle); cursor: default; }
  button.primary { background: var(--accent); border-color: var(--accent); color: var(--text-inverse); }
  button.primary:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
  button.primary:disabled { background: var(--bg-subtle); border-color: var(--border-default); }
  .note { font-size: var(--text-micro); color: var(--text-muted); }

  .facts-card {
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: var(--radius-md); padding: var(--space-roomy); box-shadow: var(--elevation-card);
  }
  dl { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-tight) var(--space-standard); margin: 0; font-size: var(--text-small); }
  dt { color: var(--text-muted); }
  dd { margin: 0; overflow-wrap: anywhere; display: flex; flex-wrap: wrap; gap: var(--space-tight); align-items: baseline; }

  @media (max-width: 479px) {
    dl { grid-template-columns: minmax(0, 1fr); }
    h1 { font-size: var(--text-page-title); line-height: var(--leading-page-title); }
  }
</style>
