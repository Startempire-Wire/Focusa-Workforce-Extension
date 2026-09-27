/**
 * Public Start Page (docs/17 §5) — curated public understanding.
 *
 * Loaded ONLY for ?public-work=1, from its own module, so the public face can
 * never read private storage, private projections or authenticated owner
 * operations. The private start page is never executed in this mode.
 *
 * Atlas layout: brand · PUBLIC SNAPSHOT date · example mission / current focus
 * · one-sentence explanation · WORKFORCE | CURRENT WORK · PROOF (2–4 curated
 * examples) · safe public CTA. Private language such as "Needs You" is never
 * rendered as an actionable control here.
 *
 * Snapshot failure replaces the body with the honest failure state; it never
 * falls through to private mode.
 */
import { loadPublicWorkSnapshot } from './lib/public-work.mjs';

const $ = (selector) => {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`required public start page element missing: ${selector}`);
  return node;
};

const el = {
  root: $('#start-public'),
  date: $('#public-date'),
  mission: $('#public-mission'),
  workforce: $('#public-workforce'),
  current: $('#public-current'),
  proof: $('#public-proof'),
  failure: $('#public-failure'),
  cta: $('#public-cta'),
};

const SNAPSHOT_URL = chrome.runtime.getURL('public-work.json');

function text(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
}

function showFailure() {
  // docs/17 §5: the body is replaced, not appended to.
  el.root.querySelectorAll('.sp-summary, #public-proof-section').forEach((node) => { node.hidden = true; });
  el.failure.hidden = false;
}

export async function mountPublicWork() {
  el.date.textContent = new Date().toISOString().slice(0, 10);
  try {
    const snapshot = await loadPublicWorkSnapshot(SNAPSHOT_URL);
    el.mission.textContent = snapshot.mission;
    el.workforce.textContent = `${snapshot.project} · ${snapshot.state}`;
    el.current.textContent = `${snapshot.stage} · ${snapshot.next_action}`;
    el.proof.replaceChildren(
      text('li', 'sp-row-title', `Checkpoint ${snapshot.checkpoint_at}`),
      text('li', 'sp-row-meta', `Published ${snapshot.published_at}${snapshot.stale ? ' · stale' : ''}`),
    );
    // docs/17 §5: the public face states it is a dated snapshot, never live telemetry.
    const disclaimer = document.querySelector('#public-disclaimer');
    if (disclaimer) {
      disclaimer.textContent = `Dated snapshot from ${snapshot.checkpoint_at} (published ${snapshot.published_at}). `
        + 'This is a dated snapshot, not live agent telemetry. It grants no execution permission.';
    }
    el.failure.hidden = true;
  } catch {
    showFailure();
  }
}

el.cta?.addEventListener('click', () => { chrome.tabs.create({ url: 'https://os.focusa.dev' }); });

await mountPublicWork();
