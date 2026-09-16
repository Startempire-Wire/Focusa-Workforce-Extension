<script>
  /**
   * Roster: who the owner says is working. Renders owner-projected fields only.
   * @type {{roster: any[], result: any, onSelect?: (entry: any) => void, selectedId?: string}}
   */
  let { roster = [], result = null, onSelect = null, selectedId = '' } = $props();
</script>

<section class="roster">
  <header>
    <h2 class="wf-section-label">People</h2>
    <span class="count">{roster.length}</span>
  </header>

  {#if result && result.state !== 'ok'}
    <p class="wf-muted">Owner roster unavailable ({result.state}).</p>
  {:else if roster.length === 0}
    <p class="wf-muted">No owner-reported sessions in this Workstream scope.</p>
  {:else}
    <ul>
      {#each roster as entry (entry.id ?? entry.label)}
        <li>
          <button
            type="button"
            class:selected={selectedId === entry.id}
            aria-pressed={selectedId === entry.id}
            disabled={!onSelect}
            onclick={() => onSelect?.(entry)}
          >
            <span class="name">{entry.label}</span>
            <span class="meta">
              {#if entry.role}<span class="role">{entry.role}</span>{/if}
              <span class="state">{entry.state ?? 'state unknown'}</span>
              {#if entry.runId}<span class="run">run {entry.runId}{#if Number.isSafeInteger(entry.generation) && entry.generation >= 1} · gen {entry.generation}{/if}</span>{/if}
              {#if entry.workspace}<span class="ws">{entry.workspace}</span>{/if}
              {#if entry.configRevision}<span class="rev">cfg {entry.configRevision}</span>{/if}
              {#if entry.updatedAt}<span class="time">{entry.updatedAt}</span>{/if}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .roster header { display: flex; align-items: baseline; gap: var(--space-tight); }
  h2 { margin: 0; }
  .count { font-size: var(--text-small); color: var(--text-muted); font-variant-numeric: tabular-nums; }
  ul { list-style: none; margin: var(--space-tight) 0 0; padding: 0; display: grid; gap: var(--space-tight); }
  button {
    width: 100%; text-align: left; background: var(--bg-surface);
    border: 1px solid var(--border-default); border-radius: var(--radius-sm);
    padding: var(--space-tight) var(--space-compact); color: inherit; cursor: pointer;
    display: grid; gap: 2px; min-height: 44px;
  }
  button:hover { background: var(--bg-hover); }
  button:disabled { cursor: default; }
  button.selected { border-color: var(--accent); background: var(--bg-selected); }
  .name { font-weight: var(--weight-semibold); font-size: var(--text-body); }
  .meta { display: flex; gap: var(--space-tight); font-size: var(--text-micro); color: var(--text-muted); flex-wrap: wrap; }
  .run, .rev { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .ws { font-style: italic; }
  .role { text-transform: uppercase; letter-spacing: 0.06em; font-weight: var(--weight-semibold); }
  @media (max-width: 479px) { .meta { font-size: var(--text-small); } }
</style>
