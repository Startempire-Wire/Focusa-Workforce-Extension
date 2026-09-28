<script>
  /**
   * Connection strip — the one surface that says whether a Focusa daemon is
   * present, and the only place Disconnect lives.
   *
   * It is deliberately the same object in every state, so connecting and
   * disconnecting is a change in the same place rather than a jump between
   * screens: searching -> found (Connect) -> connected (Disconnect, project
   * context, liveness) -> gone.
   *
   * Motion is the product's, and it is optional: every duration collapses to 0
   * when the OS asks for reduced motion (docs/17 §21.7).
   */
  import { fade, fly } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import { describeConnection } from '../../lib/connection.mjs';

  let { store, reduce = false, ondiscover = () => store.discover() } = $props();
  let seed = $state('');

  /** Adding a host is one action; it is then looked for on every launch. */
  async function addHostToBook(event) {
    event.preventDefault();
    if (!seed.trim()) return;
    await store.addTailnetHost({ host: seed.trim() });
    seed = '';
    await store.discover();
  }

  const book = $derived(store.hostBook ?? []);

  const d = $derived(store.discovery);
  const daemons = $derived(d.daemons ?? []);
  const live = $derived(d.baseUrl ? store.previews?.[d.baseUrl] ?? null : null);
  // Which places discovery is actually looking in, and which have answered.
  const places = $derived.by(() => {
    const answered = new Set((d.answers ?? []).filter((a) => a.ok).map((a) => new URL(a.baseUrl).hostname));
    return [
      { label: 'This browser', hosts: ['127.0.0.1', 'localhost', '[::1]'] },
      { label: 'This device', hosts: store.tailnet?.self?.ips ?? [] },
      { label: 'Tailnet', hosts: null },
    ].map((place) => ({
      label: place.label,
      ok: place.hosts
        ? (place.hosts.length ? place.hosts.some((host) => answered.has(host)) : [...answered].some((host) => store.tailnet?.self?.ips?.includes(host)))
        : [...answered].some((host) => /^\d{1,3(\.\d{1,3}){3}$/.test(host) && host.startsWith('100.') && Number(host.split('.')[1]) >= 64 && Number(host.split('.')[1]) <= 127),
    }));
  });
  const projects = $derived(store.projects?.projects?.length ?? 0);
  const activeProject = $derived(
    store.projects?.projects?.find((p) => p.root === store.selection.projectRoot)?.name ?? null,
  );
  const dur = $derived(reduce ? 0 : 240);
  const out = $derived(reduce ? 0 : 180);
  const link = $derived(store.connection ?? { status: 'disconnected' });
  const linkView = $derived(describeConnection(link));
  // A deliberate disconnect stays on screen until the operator connects again:
  // it must never look like a first run, and it must never look connected.
  // Shown whenever there is something to say: searching, daemons found, an
  // explicit disconnect, OR an attached daemon - because the Disconnect control
  // lives here and nowhere else.
  const show = $derived(
    d.state === 'discovering' || d.state === 'found' || d.state === 'connected' || d.state === 'not_found'
    || link.status === 'connected' || link.status === 'unreachable' || link.status === 'connecting'
    || (link.status === 'disconnected' && d.state === 'idle'),
  );
</script>

{#if show}
  <div class="strip" data-state={d.state} transition:fade={{ duration: dur }}>
    <!-- The tailnet roster, read from the tailnet itself (Tailscale LocalAPI on
         this host's loopback, so it works on any OS the tailnet runs on). A peer
         that is not granted yet cannot be probed - a browser may only fetch
         origins it holds - so each machine is one click that grants exactly it. -->
    {#if store.tailnet?.available && d.state !== 'connected'}
      <div class="tailnet-line">
        <span class="tl-label"><Icon name="link" size={13} /> Tailnet</span>
        <ul class="tailnet-list">
          {#each store.tailnet.connectable ?? [] as peer (`${peer.name}:${peer.ips?.[0] ?? ''}`)}
            <li class="peer" class:off={!peer.online} class:granted={peer.granted}>
              <span class="pn">{peer.name}</span>
              <span class="pip">{peer.ips?.[0] ?? ''}</span>
              {#if peer.online}<span class="pd" aria-hidden="true"></span>{/if}
              <button
                type="button"
                class="pbtn"
                onclick={() => store.connectTailnetPeer(peer)}
                title={peer.granted ? 'Connect to this machine' : 'Allow access to this one machine, then connect'}
              >{peer.granted ? 'Connect' : 'Allow & connect'}</button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if link.status === 'disconnected' && d.state === 'idle'}
      <div class="strip-body" in:fly={{ y: 4, duration: out }}>
        <span class="sp-pulse" aria-hidden="true" style="display:none"></span>
        <strong>{link.note ?? 'Disconnected'}</strong>
        <div class="row">
          <button type="button" class="connect primary" onclick={() => store.rediscover()}>Look for a daemon</button>
          <a class="quiet" href="#/settings?section=connections">Pair one</a>
        </div>
      </div>
    {:else if d.state === 'discovering'}
      <div class="strip-body searching" in:fly={{ y: 4, duration: out }}>
        <span class="pulse" aria-hidden="true"></span>
        <strong>Looking for Focusa</strong>
        <ul class="places">
          {#each places as place (place.label)}
            <li class="place" class:ok={place.ok}>
              <span class="dot" aria-hidden="true"></span>
              <span class="pl">{place.label}</span>
              <span class="pv">{place.ok ? 'found' : 'checking'}</span>
            </li>
          {/each}
        </ul>
      </div>

    {:else if d.state === 'connected'}
      <div class="strip-body" in:fly={{ y: 4, duration: out }}>
        <span class="beat" class:live={d.alive} aria-hidden="true"></span>
        <strong>Focusa is live</strong>
        <code>{d.baseUrl}</code>
        <span class="dim">
          {#if activeProject}{activeProject}{:else if projects}{projects} project(s){:else}no project selected{/if}
          {#if store.cacheNote} · {store.cacheNote}{/if}
        </span>
        {#if live}
          <span class="telemetry">
            {#if live.version}<b>{live.version}</b> · {/if}
            {#if live.uptimeMs != null}<b>{Math.max(1, Math.round(live.uptimeMs / 60000))}m</b> up · {/if}
            {#if live.sessions != null}<b>{live.sessions}</b> live session{live.sessions === 1 ? '' : 's'} · {/if}
            {live.projects?.length ? live.projects.join(' · ') : 'no project chosen yet'}
          </span>
        {/if}
        <button type="button" class="quiet" onclick={() => store.disconnect()} title="Detach this browser from the daemon">
          <Icon name="disconnect" size={15} /> Disconnect
        </button>
      </div>

    {:else if d.state === 'found'}
      <div class="strip-body" in:fly={{ y: 4, duration: out }}>
        <span class="beat" class:live={d.alive} aria-hidden="true"></span>
        <strong>{daemons.length > 1 ? `${daemons.length} Focusa daemons` : 'Focusa is live'}</strong>
        <ul class="daemons">
          {#each daemons as daemon (`${daemon.baseUrl}`)}
            {@const preview = daemon.preview ?? store.previews?.[daemon.baseUrl] ?? null}
            <li class="daemon" class:lead={daemon.baseUrl === d.baseUrl} class:parent={daemon.authoritative}>
              <div class="dhead">
                <Icon name={daemon.kind === 'remote' ? 'globe' : daemon.kind === 'tailnet' ? 'link' : 'monitor'} size={15} />
                <span class="dn">{daemon.label ?? daemon.kindLabel}</span>
                {#if daemon.authoritative}<span class="parent-tag">authoritative · holds your work</span>{/if}
                <code>{daemon.baseUrl}</code>
                <button
                  type="button"
                  class="connect"
                  class:primary={daemon.baseUrl === d.baseUrl}
                  onclick={() => store.connectDiscovered(daemon.baseUrl)}
                >Connect</button>
              </div>
              {#if preview}
                <p class="preview">
                  {#if preview.version}<span class="pv-item"><b>{preview.version}</b> version</span>{/if}
                  {#if preview.uptimeMs != null}<span class="pv-item"><b>{Math.max(1, Math.round(preview.uptimeMs / 60000))}m</b> up</span>{/if}
                  {#if preview.sessions != null}<span class="pv-item"><b>{preview.sessions}</b> live sessions</span>{/if}
                </p>
                {#if preview.projects?.length}
                  <p class="pprojects">{preview.projects.join(' · ')}</p>
                {:else if preview.projectSelectionRequired}
                  <p class="pprojects">No project chosen yet on this daemon.</p>
                {/if}
                {#if (daemon.addresses?.length ?? 0) > 1}
                  <p class="pprojects">Reachable at {daemon.addresses.length} addresses</p>
                {/if}
              {:else}
                <p class="preview pending">reading what this daemon holds…</p>
              {/if}
            </li>
          {/each}
        </ul>
        <form class="seed" onsubmit={addHostToBook}>
          <input bind:value={seed} placeholder="tailnet host, e.g. kh, kh.tailnet.ts.net or 100.64.1.9" aria-label="Add a tailnet host to look for" />
          <button type="submit" class="connect">Add host</button>
          <button type="button" class="connect" onclick={() => store.discover()}>Look again</button>
        </form>
        {#if book?.length}
          <p class="bookline">
            Looking for:
            {#each book as entry (entry.host)}
              <span class="bookentry">
                {entry.label}
                {#if !entry.default}<button type="button" class="bookx" title="Stop looking for this host" onclick={() => store.removeTailnetHost(entry.host)}>&times;</button>{/if}
              </span>
            {/each}
          </p>
        {/if}
        {#if store.discovery.seedError}<span class="dim">{store.discovery.seedError}</span>{/if}
      </div>

    {:else}
      <div class="strip-body" in:fly={{ y: 4, duration: out }}>
        <Icon name="alert" size={15} />
        <strong>No Focusa daemon answered</strong>
        <span class="dim">loopback, this device's bridges and the tailnet were checked</span>
        <button type="button" class="quiet" onclick={ondiscover}>Look again</button>
        <form class="seed" onsubmit={addHostToBook}>
          <input bind:value={seed} placeholder="name or address, e.g. kh or 100.64.1.9:8788" aria-label="Find a Focusa daemon by name or address" />
          <button type="submit" class="connect">Find</button>
        </form>
        {#if store.discovery.seedError}<span class="dim">{store.discovery.seedError}</span>{/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .strip {
    border-radius: var(--radius-md);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    overflow: hidden;
  }
  .strip[data-state='found'] { border-color: color-mix(in srgb, var(--success) 45%, var(--border-default)); }
  .strip[data-state='connected'] { border-color: color-mix(in srgb, var(--success) 35%, var(--border-default)); }

  .strip-body {
    display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
    padding: 11px 14px;
  }
  strong { font: var(--text-body-strong); }
  .dim { color: var(--text-secondary); font: var(--text-small); }
  code { color: var(--text-secondary); font: var(--text-micro); overflow-wrap: anywhere; }

  .quiet {
    display: inline-flex; align-items: center; gap: 6px; margin-left: auto;
    padding: 5px 10px; border-radius: var(--radius-sm);
    border: 1px solid transparent; background: transparent;
    color: var(--text-secondary); font: var(--text-small-strong); cursor: pointer;
  }
  .quiet:hover { background: var(--bg-subtle); color: var(--text-primary); }
  /* Disconnect is destructive, so it only shows its colour as it is approached. */
  .quiet[title^='Detach']:hover {
    background: var(--danger-weak);
    color: var(--danger);
    border-color: color-mix(in srgb, var(--danger) 30%, transparent);
  }

  .pulse, .beat { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); flex: none; }
  .beat.live { background: var(--success); }

  .seed { display: flex; gap: 8px; width: 100%; }
  .seed input {
    flex: 1; min-width: 0; padding: 7px 10px; border-radius: var(--radius-sm);
    border: 1px solid var(--border-default); background: var(--bg-inset);
    color: var(--text-primary); font: var(--text-small);
  }
  .seed input::placeholder { color: var(--text-muted); }

  .places { list-style: none; display: flex; flex-wrap: wrap; gap: 14px; margin: 0; padding: 0; }
  .place { display: inline-flex; align-items: center; gap: 7px; font: var(--text-small); color: var(--text-muted); }
  .place .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border-strong); }
  .place.ok { color: var(--success); }
  .place.ok .dot { background: var(--success); }
  .place .pv { color: var(--text-muted); }

  .dhead { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%; }
  .preview { display: flex; flex-wrap: wrap; gap: 12px; margin: 6px 0 0; font: var(--text-micro); color: var(--text-secondary); }
  .preview b { color: var(--text-primary); font-weight: 700; }
  .preview .warn, .preview .warn b { color: var(--danger); }
  .preview.pending { color: var(--text-muted); }
  .parent-tag {
    padding: 2px 8px; border-radius: var(--radius-pill);
    background: var(--accent-weak); color: var(--accent); font: var(--text-micro);
  }
  .daemon.parent { border-color: var(--accent-edge); }
  .tailnet-line {
    display: grid; gap: 6px; width: 100%;
    padding: 10px 14px; border-top: 1px solid var(--border-subtle);
  }
  .tl-label { display: inline-flex; align-items: center; gap: 6px; font: var(--text-micro); color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; }
  .tailnet-list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .peer {
    display: inline-flex; align-items: center; gap: 7px; padding: 4px 6px 4px 10px;
    border-radius: var(--radius-pill); background: var(--bg-subtle);
    border: 1px solid transparent; font: var(--text-micro); color: var(--text-secondary);
  }
  .peer.granted { border-color: var(--border-default); }
  .peer.off { opacity: .6; }
  .pn { font-weight: 600; color: var(--text-primary); }
  .pip { color: var(--text-muted); }
  .pd { width: 6px; height: 6px; border-radius: 50%; background: var(--success); }
  .pbtn {
    border: 1px solid var(--border-default); background: var(--bg-surface); color: var(--text-primary);
    border-radius: var(--radius-pill); padding: 2px 9px; font: var(--text-micro); cursor: pointer;
  }
  .pbtn:hover { background: var(--accent-weak); color: var(--accent); border-color: transparent; }
  .bookline { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0; font: var(--text-micro); color: var(--text-muted); }
  .bookentry { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--radius-pill); background: var(--bg-subtle); color: var(--text-secondary); }
  .bookx { border: 0; background: transparent; color: var(--text-muted); cursor: pointer; padding: 0 2px; font: inherit; }
  .bookx:hover { color: var(--danger); }
  .pprojects { margin: 2px 0 0; font: var(--text-micro); color: var(--text-muted); overflow-wrap: anywhere; }
  .telemetry { font: var(--text-micro); color: var(--text-secondary); }
  .telemetry b { color: var(--text-primary); }

  .daemons { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; width: 100%; }
  .daemon {
    display: flex; flex-direction: column; gap: 2px;
    padding: 9px 11px; border-radius: var(--radius-md);
    border: 1px solid var(--border-subtle); background: var(--bg-inset);
  }
  .daemon.lead { border-color: color-mix(in srgb, var(--success) 40%, transparent); }
  .dn { font: var(--text-small-strong); }
  .connect {
    margin-left: 4px; padding: 4px 11px; border-radius: var(--radius-sm);
    border: 1px solid var(--border-default); background: var(--bg-surface);
    color: var(--text-primary); font: var(--text-small-strong); cursor: pointer;
  }
  .connect.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  .connect:hover { filter: brightness(1.05); }

  @media (prefers-reduced-motion: no-preference) {
    .pulse { animation: strip-breathe 1.9s ease-in-out infinite; }
    .place:not(.ok) .dot { animation: strip-breathe 1.9s ease-in-out infinite; }
    .beat.live { animation: strip-heart 2.4s ease-in-out infinite; }
    .connect.primary { animation: strip-halo 2.4s ease-out infinite; }
  }
  @keyframes strip-breathe { 0%, 100% { opacity: .35; transform: scale(.85); } 50% { opacity: 1; transform: scale(1); } }
  @keyframes strip-heart { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.32); opacity: .72; } }
  @keyframes strip-halo {
    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 40%, transparent); }
    70% { box-shadow: 0 0 0 10px color-mix(in srgb, var(--accent) 0%, transparent); }
    100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 0%, transparent); }
  }
</style>
