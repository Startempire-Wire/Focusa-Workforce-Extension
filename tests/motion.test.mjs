import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const surfaces = [
  'src/workforce/workforce.css',
  'src/styles.css',
  'src/startpage.css',
  'src/wall.css',
];

// Motion is a product decision (operator direction 2026-09-27): every surface
// shares one language, and every animation is optional. These assertions stop
// either half from regressing.
test('every surface carries the shared motion language', async () => {
  for (const file of surfaces) {
    const css = await readFile(resolve(root, file), 'utf8');
    assert.match(css, /MOTION LANGUAGE/, `${file} declares the motion language`);
    assert.match(css, /prefers-reduced-motion: no-preference/, `${file} gates its motion`);
  }
});

test('no surface declares an animation outside the reduced-motion guard', async () => {
  for (const file of surfaces) {
    const css = await readFile(resolve(root, file), 'utf8');
    const guardAt = css.indexOf('prefers-reduced-motion: no-preference');
    assert.ok(guardAt > 0, `${file} has the guard`);
    // Everything after the guard is opt-in motion; the only animation declared
    // before it must be the pre-existing reduced-motion kill switch.
    const before = css.slice(0, guardAt);
    const outside = before.replace(/prefers-reduced-motion:\s*reduce[^}]*}/g, '');
    assert.doesNotMatch(outside, /animation(-name)?\s*:/, `${file} animates unconditionally`);
  }
});

test('the token layer defines the motion scale and easings', async () => {
  const tokens = await readFile(resolve(root, 'src/tokens.css'), 'utf8');
  for (const token of ['--motion-instant', '--motion-fast', '--motion-base', '--motion-slow',
    '--ease-out', '--ease-in-out', '--ease-spring', '--press-scale', '--lift-distance']) {
    assert.ok(tokens.includes(token), `docs/13 motion token ${token} is declared`);
  }
});

test('the full page animates its faces and settings in both directions', async () => {
  const app = await readFile(resolve(root, 'src/workforce/App.svelte'), 'utf8');
  // Enter AND leave, so attaching/detaching a daemon cross-fades.
  assert.match(app, /in:fly=/);
  assert.match(app, /out:fade=/);
  assert.match(app, /reduceMotion \? 0/);
  assert.match(app, /prefers-reduced-motion: reduce/);
});
