/**
 * Build identity (docs/17 §4: build/debug identity belongs in footer or advanced
 * meta, never beside the product brand).
 *
 * The committed value is the development default. scripts/build.mjs overwrites
 * the packaged copy with the real commit and timestamp, so an operator can tell
 * at a glance which build a surface is actually running - which is how a stale
 * module in a browser is diagnosed in seconds instead of by guesswork.
 */
export const BUILD = Object.freeze({
  sha: 'dev',
  committedAt: null,
});
