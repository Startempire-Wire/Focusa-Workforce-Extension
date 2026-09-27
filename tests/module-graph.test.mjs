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
