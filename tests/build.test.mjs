import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function digestTree(directory) {
  const files = (await readdir(directory, { recursive: true })).sort();
  const hash = createHash('sha256');
  for (const relative of files) {
    const path = resolve(directory, relative);
    try {
      const bytes = await readFile(path);
      hash.update(relative); hash.update(bytes);
    } catch (error) {
      if (error?.code !== 'EISDIR') throw error;
    }
  }
  return hash.digest('hex');
}

function build(env = {}) {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8', env: { ...process.env, ...env } });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PASS: built Focusa Workforce MV3 unpacked extension/);
}

/**
 * Verification builds into its own directory: the live dev loop rebuilds and
 * removes `dist/` continuously, so tests must never read it.
 */
const VERIFY_DIR = resolve(root, `.wf-verify-${process.pid}`);

async function ensureDefaultBuild() {
  try {
    await readFile(resolve(VERIFY_DIR, 'workforce.html'));
  } catch {
    await rm(VERIFY_DIR, { recursive: true, force: true });
    build({ WF_DIST_DIR: VERIFY_DIR });
  }
}

test.after(() => rm(VERIFY_DIR, { recursive: true, force: true }));

test('manifest is least-privilege MV3 with no content script', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual([...manifest.permissions].sort(), ['activeTab', 'sidePanel', 'storage']);
  assert.deepEqual([...manifest.optional_host_permissions].sort(), ['http://*/*', 'https://*/*']);
  assert.equal(manifest.content_scripts, undefined);
  assert.equal(manifest.host_permissions, undefined);
});

test('unpacked build is deterministic and complete', async () => {
  // Build into two isolated dirs: the live dev loop may be rebuilding dist/ concurrently.
  // Per-process dirs: the live dev loop runs this suite too, so fixed names would collide.
  const dirA = resolve(root, `.build-test-a-${process.pid}`);
  const dirB = resolve(root, `.build-test-b-${process.pid}`);
  await rm(dirA, { recursive: true, force: true });
  await rm(dirB, { recursive: true, force: true });
  try {
    build({ WF_DIST_DIR: dirA }); const first = await digestTree(dirA);
    build({ WF_DIST_DIR: dirB }); const second = await digestTree(dirB);
    assert.equal(second, first);
  } finally {
    await rm(dirA, { recursive: true, force: true });
    await rm(dirB, { recursive: true, force: true });
  }
  await ensureDefaultBuild();
  for (const file of ['manifest.json', 'background.mjs', 'sidepanel.html', 'sidepanel.mjs', 'styles.css']) {
    await readFile(resolve(VERIFY_DIR, file));
  }
});

test('the Workforce full page is bundled and its Svelte sources do not ship', async () => {
  await ensureDefaultBuild();
  const html = await readFile(resolve(VERIFY_DIR, 'workforce.html'), 'utf8');
  assert.match(html, /workforce-assets\//, 'built page references its bundled assets');
  const assets = await readdir(resolve(VERIFY_DIR, 'workforce'));
  assert.ok(assets.some((f) => /^workforce\.[A-Za-z0-9_-]{8}\.js$/.test(f)), `content-hashed bundle expected, saw ${assets.join(',')}`);
  await assert.rejects(readFile(resolve(VERIFY_DIR, 'workforce', 'App.svelte')));
  await assert.rejects(readFile(resolve(VERIFY_DIR, 'src', 'workforce', 'App.svelte')));
  const manifest = JSON.parse(await readFile(resolve(VERIFY_DIR, 'manifest.json'), 'utf8'));
  assert.equal(manifest.commands['open-workforce'].suggested_key.default, 'Alt+Shift+K');
});

test('workforce surface consumes the docs/13 token contract', async () => {
  const tokens = await readFile(resolve(root, 'src/tokens.css'), 'utf8');
  for (const token of [
    '--bg-app', '--bg-surface', '--bg-subtle', '--text-primary', '--text-secondary', '--text-muted',
    '--border-default', '--border-focus', '--accent', '--success', '--warning', '--danger', '--info',
    '--violet', '--settled', '--radius-sm', '--radius-md', '--radius-pill', '--space-tight',
    '--space-standard', '--text-body', '--text-small', '--text-micro', '--page-gutter',
  ]) {
    assert.ok(tokens.includes(token), `docs/13 token ${token} is declared`);
  }
  const page = await readFile(resolve(root, 'src/workforce/workforce.css'), 'utf8');
  assert.match(page, /@import '\.\.\/tokens\.css'/, 'page base imports the token layer');
  assert.match(page, /prefers-reduced-motion/, 'reduced motion is respected');
  assert.match(page, /:focus-visible/, 'focus is visible');
  // the shipped theme must not hardcode the previous dark palette
  const app = await readFile(resolve(root, 'src/workforce/App.svelte'), 'utf8');
  assert.ok(!/#0d1117|#30363d/.test(app), 'no legacy hardcoded dark colours remain in the page');
});

test('every surface is bridged onto the shared token system', async () => {
  const tokens = await readFile(resolve(root, 'src/tokens.css'), 'utf8');
  assert.ok(tokens.includes('--bg-app') && tokens.includes('--accent'), 'shared token layer exists');
  for (const surface of ['styles.css', 'startpage.css', 'wall.css']) {
    const css = await readFile(resolve(root, 'src', surface), 'utf8');
    assert.match(css, /@import '\.\/tokens\.css'/, `${surface} imports the shared tokens`);
    assert.match(css, /docs\/13 token bridge/, `${surface} carries the bridge block`);
    assert.match(css, /--panel: var\(--bg-surface\)/, `${surface} maps its panel variable onto shared tokens`);
    assert.match(css, /--text: var\(--text-primary\)/, `${surface} maps its text variable onto shared tokens`);
  }
  const page = await readFile(resolve(root, 'src/workforce/workforce.css'), 'utf8');
  assert.match(page, /@import '\.\.\/tokens\.css'/, 'workforce page imports the shared tokens');
});

test('bridged surfaces ship the shared token layer in the build', async () => {
  await ensureDefaultBuild();
  for (const file of ['tokens.css']) {
    const css = await readFile(resolve(VERIFY_DIR, file), 'utf8');
    assert.match(css, /--bg-app/, 'shared tokens are shipped for the plain surfaces');
  }
  const sidepanel = await readFile(resolve(VERIFY_DIR, 'styles.css'), 'utf8');
  assert.match(sidepanel, /@import '\.\/tokens\.css'/, 'shipped sidepanel css imports the shipped tokens');
});
