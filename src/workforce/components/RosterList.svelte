<script>
  /**
   * Roster: who the owner says is working. Renders owner-projected fields only.
   * @type {{roster: any[], result: any, onSelect?: (entry: any) => void, selectedId?: string}}
   */
  let { roster = [], result = null, onSelect = null, selectedId = '' } = $props();
</script>

<section class="roster">
  <header>
    <h2>People</h2>
    <span class="count">{roster.length}</span>
  </header>

  {#if result && result.state !== 'ok'}
    <p class="muted">Owner roster unavailable ({result.state}).</p>
  {:else if roster.length === 0}
    <p class="muted">No owner-reported sessions in this Workstream scope.</p>
  {:else}
    <ul>
      {#each roster as entry (entry.id ?? entry.label)}
        <li>
          <button
            type="button"
            class:selected={selectedId === entry.id}
            disabled={!onSelect}
            onclick={() => onSelect?.(entry)}
          >
            <span class="name">{entry.label}</span>
            <span class="meta">
              {#if entry.role}<span class="role">{entry.role}</span>{/if}
              <span class="state">{entry.state ?? 'state unknown'}</span>
              {#if entry.updatedAt}<span class="time">{entry.updatedAt}</span>{/if}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .roster header { display: flex; align-items: baseline; gap: 8px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; margin: 0; opacity: 0.8; }
  .count { font-size: 12px; opacity: 0.6; }
  ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; }
  button { width: 100%; text-align: left; background: transparent; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px; color: inherit; cursor: pointer; display: grid; gap: 2px; }
  button:disabled { cursor: default; }
  button.selected { border-color: #58a6ff; }
  .name { font-weight: 600; font-size: 13px; }
  .meta { display: flex; gap: 8px; font-size: 11px; opacity: 0.7; }
  .role { text-transform: uppercase; letter-spacing: 0.04em; }
  .muted { font-size: 12px; opacity: 0.6; }
</style>
