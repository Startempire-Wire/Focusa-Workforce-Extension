/**
 * Start page entry (docs/11 §19 — return/orientation surface).
 *
 * Two modes, decided before anything else touches chrome.*:
 *
 *   ?public-work=1  the curated public Work snapshot. Deliberately does not read
 *                   connections, notifications or layout preferences. The demo at
 *                   os.focusa.dev depends on this exact path.
 *   default         the concise orientation surface: connection posture, current
 *                   Workstream, owner attention count, working summary, recent
 *                   owner-reported proof, and navigation to the deep surface.
 *                   No consequential mutations live here (WF-SUR-003).
 */
import { mount } from 'svelte';
import App from './App.svelte';

const isPublicWork = new URL(window.location.href).searchParams.get('public-work') === '1';

if (isPublicWork) {
  // Minimal host the public renderer expects, built before mounting anything else
  // so the public mode stays independent of extension state.
  document.body.innerHTML = `
    <main>
      <section class="welcome">
        <h1>Focusa Workforce</h1>
        <p class="lead">Loading the public checkpoint snapshot…</p>
      </section>
      <section class="dashboard">
        <article class="widget hero-widget" data-widget="focus"></article>
      </section>
      <footer><span id="runtime-label">Public snapshot · read-only</span></footer>
    </main>`;
  // Public-only stylesheet, code-split so it never applies to the orientation surface.
  await import('./public-work.css');
  const { mountPublicWork } = await import('../lib/public-work.mjs');
  await mountPublicWork(document, chrome.runtime.getURL('public-work.json'));
} else {
  mount(App, { target: document.getElementById('wf-start-root') });
}
