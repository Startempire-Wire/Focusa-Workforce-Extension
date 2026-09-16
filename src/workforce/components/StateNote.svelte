<script>
  /**
   * Honest owner-state note. Renders exactly what the owner reported:
   * result state, owner failure class, and owner recovery action when present.
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
  <p class="state-note {tone}" title={result.status ? `HTTP ${result.status}` : ''}>
    <span class="pill">{label}: {result.state}</span>
    {#if result.note}<span class="detail">{result.note}</span>{/if}
    {#if result.code}<code>{result.code}</code>{/if}
    {#if result.recovery}<span class="detail">recovery: {result.recovery}</span>{/if}
  </p>
{/if}

<style>
  .state-note { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 4px 0; font-size: 12px; }
  .pill { padding: 2px 8px; border-radius: 999px; border: 1px solid currentColor; }
  .detail { opacity: 0.75; }
  code { opacity: 0.85; }
  .ok { color: #3fb950; }
  .warn { color: #d29922; }
  .blocked { color: #f85149; }
  .error { color: #f85149; }
  .idle { color: #8b949e; }
</style>
