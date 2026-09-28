import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function moduleFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await moduleFiles(full));
    else if (entry.name.endsWith('.mjs')) out.push(full);
  }
  return out;
}

function specifiers(source) {
  return [...source.matchAll(/(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+['"](\.[^'"]+)['"]/g)].map((m) => m[1]);
}

function dynamicSpecifiers(source) {
  return [...source.matchAll(/import\(\s*['"](\.[^'"]+)['"]\s*\)/g)].map((m) => m[1]);
}

test('the packaged extension ships every module its surfaces import', async (t) => {
  const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr || build.stdout);

  // The plain surfaces are copied verbatim, so a relative import that does not
  // exist in dist is a module that silently fails to load at runtime. This
  // happened once: the Start Page and Side Panel imported a module the build
  // never copied, and both faces went dead without a single failing check.
  const broken = [];
  for (const file of await moduleFiles(dist)) {
    if (file.includes(`${join('dist', 'workforce-assets')}`)) continue; // vite bundle
    const source = await readFile(file, 'utf8');
    for (const specifier of [...specifiers(source), ...dynamicSpecifiers(source)]) {
      const target = resolve(dirname(file), specifier);
      if (!(await exists(target))) broken.push(`${file.slice(dist.length + 1)} -> ${specifier}`);
    }
  }
  assert.deepEqual(broken, [], 'every relative import must resolve inside the package');
});

test('shared runtime modules live in the copied lib, not in the bundled page tree', async (t) => {
  // scripts/build.mjs copies every src entry except `workforce` (vite bundles
  // it), so a module used by more than one surface belongs in src/lib.
  const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr || build.stdout);
  assert.ok(await exists(resolve(dist, 'lib', 'discovery.mjs')), 'discovery ships with the shared lib');
  assert.ok(await exists(resolve(dist, 'lib', 'validation.mjs')));
  assert.ok(await exists(resolve(dist, 'lib', 'storage.mjs')));
  assert.ok(!(await exists(resolve(dist, 'workforce', 'lib'))), 'the vite-bundled page tree is not shipped raw');
});

test('connect() pulls the inspector UI loader, not the pure data loader', async () => {
  // This exact mix-up shipped: connect() awaited loadInspector() (pure,
  // needs client+scope) instead of loadInspectorIntoUI() (wired to the live
  // connection and the DOM), so every connect threw
  // "Cannot read properties of undefined (reading 'projectRoot')" and the
  // inspector never rendered. The pure loader must only ever be called with
  // both arguments.
  const source = await readFile(resolve(root, 'src/startpage.mjs'), 'utf8');
  const body = source.slice(source.indexOf('async function connect('));
  const end = body.indexOf('\n}\n', body.indexOf('await loadInspectorIntoUI'));
  const connectBody = end > 0 ? body.slice(0, end) : body;
  assert.match(connectBody, /await loadInspectorIntoUI\(\)/, 'connect() awaits the UI loader');
  assert.doesNotMatch(connectBody, /await loadInspector\(/, 'connect() never calls the pure loader bare');
});

test('every click handler in a shipped surface points at a declared function', async (t) => {
  await t.test('preparing the build', () => {
    const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr || build.stdout);
  });

  // A rename that misses one call site compiles cleanly and only throws when
  // the operator clicks that control - which is exactly how "disconnectDaemon is
  // not defined" reached a live extension. Every handler reference must resolve
  // to something the module declares or imports.
  const files = (await moduleFiles(dist)).filter((f) => !f.includes('workforce-assets'));
  const problems = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const declared = new Set();
    for (const m of source.matchAll(/(?:^|[\n;])\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
    for (const m of source.matchAll(/(?:^|[\n;])\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
    // parameters are legitimate targets (a handler passed in by the caller)
    for (const m of source.matchAll(/(?:function\s*[A-Za-z_$][\w$]*\s*|\([^)]*\)\s*=>|,\s*function\s*)\(([^)]*)\)/g)) {
      for (const part of m[1].split(',')) {
        const name = part.split(/[:=]/)[0].trim().replace(/^\.\.\./, '');
        if (/^[A-Za-z_$][\w$]*$/.test(name)) declared.add(name);
      }
    }
    for (const m of source.matchAll(/import\s*\{([^}]*)\}\s*from/g)) {
      for (const part of m[1].split(',')) {
        const name = part.split(/\s+as\s+/).pop().trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name)) declared.add(name);
      }
    }
    // addEventListener('click', handler) and onclick={handler(...)} in markup
    const references = [
      ...[...source.matchAll(/addEventListener\(\s*['"]click['"]\s*,\s*([A-Za-z_$][\w$]*)\s*\)/g)].map((m) => m[1]),
      ...[...source.matchAll(/\.addEventListener\(\s*['"]click['"]\s*,\s*\(\)\s*=>\s*([A-Za-z_$][\w$]*)\(/g)].map((m) => m[1]),
    ];
    for (const name of references) {
      if (!declared.has(name)) problems.push(`${file.slice(dist.length + 1)}: click handler '${name}' is not declared`);
    }
  }
  assert.deepEqual(problems, [], 'every click handler must resolve');
});

test('the package carries a real build identity the operator can see', async (t) => {
  await t.test('preparing the build', () => {
    const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr || build.stdout);
  });
  const stamp = await readFile(resolve(dist, 'lib', 'build-info.mjs'), 'utf8');
  // Not the development default: a stale module in a browser is diagnosable.
  assert.match(stamp, /sha: "[0-9a-f]{7,}(-dirty)?"/, 'the packaged build names its commit');
  assert.doesNotMatch(stamp, /sha: "dev"/, 'the development default is never shipped');
  // Commit identity, so the build stays byte-deterministic (tests/build.test.mjs).
  assert.match(stamp, /committedAt: "\d{4}-\d{2}-\d{2}T/, 'the packaged build carries its commit date');

  // and every plain surface shows it in footer/advanced meta (docs/17 §4)
  for (const [file, marker] of [['sidepanel.mjs', 'build-stamp'], ['startpage.mjs', 'build-stamp']]) {
    const source = await readFile(resolve(dist, file), 'utf8');
    assert.match(source, /BUILD/, `${file} imports the build identity`);
    assert.match(source, new RegExp(marker), `${file} shows it`);
  }
});

test('a failing interaction is shown in the surface, not only in the console', async (t) => {
  await t.test('preparing the build', () => {
    const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr || build.stdout);
  });
  for (const file of ['sidepanel.mjs', 'startpage.mjs']) {
    const source = await readFile(resolve(dist, file), 'utf8');
    assert.match(source, /unhandledrejection/, `${file} surfaces unhandled rejections`);
    assert.match(source, /async function guard\(/, `${file} guards its interactions`);
    assert.match(source, /showSurfaceError/, `${file} shows the failure in the surface`);
  }
});

test('every element a surface looks up actually exists in that surface', async (t) => {
  await t.test('preparing the build', () => {
    const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr || build.stdout);
  });
  // A $(' #id ') that no longer exists throws at module scope, which kills the
  // whole surface silently. That happened twice (a renamed element, a removed
  // freshness chip), so every lookup is checked against its own markup.
  const pairs = [['sidepanel.mjs', 'sidepanel.html'], ['startpage.mjs', 'startpage.html'], ['wall.mjs', 'wall.html']];
  const problems = [];
  for (const [script, markup] of pairs) {
    const source = await readFile(resolve(dist, script), 'utf8');
    const html = await readFile(resolve(dist, markup), 'utf8');
    for (const m of source.matchAll(/\$\(\s*['"]#([A-Za-z0-9_-]+)['"]\s*\)/g)) {
      const id = m[1];
      if (!html.includes(`id="${id}"`)) problems.push(`${script} looks up #${id}, absent from ${markup}`);
    }
  }
  assert.deepEqual(problems, [], 'no surface may reference a missing element');
});
