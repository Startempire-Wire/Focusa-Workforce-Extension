<script module>
  /**
   * Icon set (docs/13 Surface). Lucide geometry: 24px grid, 2px stroke, round
   * caps and joins, `currentColor` so an icon always inherits its context's
   * semantic colour. Vendored as paths so the extension carries no new runtime
   * dependency and no network access at render time.
   *
   * Meaning is never carried by the icon alone: every icon here sits beside a
   * text label (docs/17 §21.7).
   */
  export const ICONS = Object.freeze({
    // navigation / regions
    overview: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    work: 'M4 4h16v5H4zM4 13h7v7H4zM15 13h5v7h-5z',
    people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    evidence: 'M9 12l2 2 4-4M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
    topology: 'M12 3v6M12 15v6M6 9v6M18 9v6M6 15h12M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    audit: 'M3 3v18h18M7 15l4-5 3 3 5-7',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.61.77 1.02 1.42 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    // state / attention
    attention: 'M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    check: 'M20 6 9 17l-5-5',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2',
    alert: 'M12 8v4M12 16h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
    // actions
    refresh: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
    connect: 'M5 12h14M12 5v14M7 7l-4 5 4 5M17 7l4 5-4 5',
    disconnect: 'M18.36 5.64 12 12M9 7l-4 5 4 5M15 7l4 5-4 5M3 3l18 18',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.35-4.35',
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
    play: 'M5 3l14 9-14 9z',
    pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
    resume: 'M6 4l9 8-9 8zM18 4v16',
    stop: 'M6 6h12v12H6z',
    // surfaces / devices
    monitor: 'M2 3h20v14H2zM8 21h8M12 17v4',
    panel: 'M3 3h18v18H3zM9 3v18',
    browser: 'M3 5h18v14H3zM3 9h18M6.5 7h.01M9.5 7h.01',
    wall: 'M3 3h18v18H3zM3 9h18M9 21V9',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18',
    // flow
    direction: 'M4 12h10M4 8h10M4 16h6M16 9l4 3-4 3z',
    foreman: 'M12 2 4 6v6c0 5 3.4 9.3 8 10 4.6-.7 8-5 8-10V6zM9 12l2 2 4-4',
    trajectory: 'M4 19h4V9H4zM10 19h4V4h-4zM16 19h4v-7h-4z',
    project: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    layers: 'M12 2 2 7l10 5 10-5zM2 12l10 5 10-5M2 17l10 5 10-5',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    document: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
    link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    power: 'M12 2v10M18.36 6.64a9 9 0 1 1-12.73 0',
  });
</script>

<script>
  /**
   * One icon, always beside a text label. `title` gives it an accessible name;
   * decorative use passes `label={null}`.
   */
  let { name, size = 18, label = null, class: klass = '' } = $props();
  const d = $derived(ICONS[name] ?? ICONS.alert);
</script>

<svg
  class="icon {klass}"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? 'img' : 'presentation'}
  aria-label={label ?? undefined}
  aria-hidden={label ? undefined : 'true'}
>
  {#each d.split('M').filter(Boolean) as segment, i (i)}
    <path d={'M' + segment} />
  {/each}
</svg>

<style>
  .icon { display: inline-block; flex: none; vertical-align: -0.15em; }
</style>
