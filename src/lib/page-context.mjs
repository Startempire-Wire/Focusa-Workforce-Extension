/**
 * Page-context capture (MLG-6.3): canonical envelopes for browser-sourced
 * work creation and evidence candidates. Everything is LOCAL staging —
 * nothing here claims daemon authority. The daemon work-item creation path is
 * owner-gated (see work-loop-prompt.mjs for the honest submit attempt).
 */

export const PAGE_CAPTURE_SCHEMA = 'focusa.workforce.page_capture.v1';
export const INCOMING_WORK_DRAFT_SCHEMA = 'focusa.workforce.incoming_work_draft.v1';
export const EVIDENCE_CANDIDATE_SCHEMA = 'focusa.workforce.evidence_candidate.v1';
export const PAGE_WORK_PROMPT_SCHEMA = 'focusa.workforce.page_work_prompt.v1';

/** Collapse whitespace and bound the excerpt length. */
export function summarizeSelection(text, max = 500) {
  if (typeof text !== 'string') return '';
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max)}…`;
}

/**
 * Canonical page-capture envelope. `local: true` is the explicit honesty
 * marker: this record is a browser-captured candidate, never a daemon item.
 */
export function pageContextFromCapture({ url, title = '', selectedText = '', capturedAt = new Date().toISOString() }) {
  if (typeof url !== 'string' || !url.trim()) throw new TypeError('capture requires a page URL');
  let parsed;
  try { parsed = new URL(url); } catch { throw new TypeError('capture URL is not parseable'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new TypeError('capture URL must be http(s)');
  const capture = {
    schema: PAGE_CAPTURE_SCHEMA,
    url: parsed.pathname === '/' ? parsed.origin : parsed.href,
    title: (typeof title === 'string' && title.trim() ? title.trim() : 'Untitled page').slice(0, 300),
    selection: summarizeSelection(selectedText),
    capturedAt,
    local: true,
    provisionedBy: 'extension:context-menu',
  };
  return Object.freeze(capture);
}

/** Direction-shaped draft built from a captured page (used to prefill the
 * Direction composer and to drive the work-loop prompt). */
export function createIncomingWorkDraft(context) {
  const parts = [`Page: ${context.title}`, `Url: ${context.url}`];
  if (context.selection) parts.push(`Selection:\n${context.selection}`);
  return Object.freeze({
    schema: INCOMING_WORK_DRAFT_SCHEMA,
    title: context.title,
    source: context.url,
    instruction: parts.join('\n'),
    selection: context.selection,
    capturedAt: context.capturedAt,
    local: true,
    provisionedBy: context.provisionedBy,
  });
}

/** Evidence candidate staged for later receipt/settlement by the owner. */
export function createEvidenceCandidate(context) {
  return Object.freeze({
    schema: EVIDENCE_CANDIDATE_SCHEMA,
    kind: 'browser_capture',
    source: context.url,
    title: context.title,
    note: context.selection || `Page captured: ${context.title}`,
    capturedAt: context.capturedAt,
    local: true,
    provisionedBy: context.provisionedBy,
  });
}

/**
 * Daemon-compatible driver-prompt body (focusa.agent_execution_prompt.request.v1:
 * a single required `message`, optional `streaming_behavior`). Bounded.
 */
export function promptBodyFor(draft, { maxMessage = 4000 } = {}) {
  const message = (draft.instruction ?? draft.message ?? draft.note ?? '').trim().slice(0, maxMessage);
  if (!message) throw new TypeError('work-loop prompt message must not be empty');
  return Object.freeze({ message, streaming_behavior: 'steer' });
}

/** Stable capture id for durable staging (idempotency key source). */
export function captureId(prefix) {
  return `${prefix}:${crypto.randomUUID()}`;
}