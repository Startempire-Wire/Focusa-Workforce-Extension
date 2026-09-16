<script>
  /**
   * Honest owner-state note. Renders exactly what the owner reported:
   * result state, owner failure class, and owner recovery action when present.
   * Meaning is carried by text + outline weight, not colour alone.
   */
  let { label = 'Owner', result = null } = $props();

  const tone = $derived(
    !result ? 'idle'
      : result.state === 'ok' ? 'ok'
        : result.state === 'degraded' ? 'warn'
          : result.state === 'entitlement_blocked' ? 'blocked'
            : result.state === 'unauthenticated' || result.state === 'forbidden' ? 'blocked'
              : result.state === 'unsupported' ? 'warn'
                : 'error',
  );
</script>

{#if result}
  <p class="state-note {tone}" role="status" title={result.status ? `HTTP ${result.status}` : ''}>
    <span class="pill">{label}: {result.state}</span>
    {#if result.note}<span class="detail">{result.note}</span>{/if}
    {#if result.code}<code>{result.code}</code>{/if}
    {#if result.recovery}<span class="detail">recovery: {result.recovery}</span>{/if}
  </p>
{/if}

<style>
  .state-note {
    display: flex; flex-wrap: wrap; gap: var(--space-tight); align-items: center;
    margin: var(--space-micro) 0; font-size: var(--text-small); color: var(--text-secondary);
  }
  .pill {
    padding: 2px var(--space-tight);
    border-radius: var(--radius-pill);
    border: 1px solid currentColor;
    font-weight: var(--weight-medium);
  }
  .detail { color: var(--text-secondary); }
  code { color: var(--text-muted); }
  .ok { color: var(--success); }
  .warn { color: var(--warning); }
  .blocked, .error { color: var(--danger); }
  .idle { color: var(--text-muted); }
</style>
