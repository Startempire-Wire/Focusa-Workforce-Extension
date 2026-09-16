#!/usr/bin/env node
/**
 * wfx-dev — build once, deploy to a browser channel, and hot-reload the
 * unpacked extension in a running browser (no restart, no manual
 * chrome://extensions reload).
 *
 *   node scripts/wfx-dev.mjs brave [--watch] [--port 9335] [--no-launch] [--git]
 *
 * With --watch the loop is: edit -> build -> sync channel -> hot-reload browser
 * -> (--git) commit + push, so local and GitHub stay live as the extension is built.
 *
 * How the reload works:
 *   1. build (single build path: scripts/build.mjs)
 *   2. sync dist/ -> the channel load directory (what the browser has loaded)
 *   3. over the CDP endpoint, call chrome.runtime.reload() in the extension's
 *      service worker, then reload every open extension page
 *   4. --watch repeats 1-3 on source changes (debounced)
 *
 * Unpacked extensions never auto-reload on file changes, which is why a rebuilt
 * extension otherwise needs a manual reload.
 */
import { spawn, spawnSync } from 'node:child_process';
import { cp, mkdir, open, readdir, readFile, rm, stat, watch } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const browser = args.find((a) => !a.startsWith('-')) ?? 'brave';
const watchMode = args.includes('--watch');
const gitMode = args.includes('--git');
// Never launch a browser unless explicitly asked: an operator window is usually
// already open and a second instance spawns extra windows.
const mayLaunch = args.includes('--launch');
const portArg = args.indexOf('--port');
const port = portArg >= 0 ? Number(args[portArg + 1]) : Number(process.env.UIAI_WFX_CDP_PORT ?? 9335);
const distRoot = process.env.UIAI_WFX_LOCAL_DIST ?? `${process.env.HOME}/.local/share/focusa-workforce`;
const channelDir = `${distRoot}/dist-${browser}`;
// One build/stage/test cycle at a time: a manual `wfx live` running alongside the
// watcher would otherwise rebuild dist while tests read it (flaky failures).
const lockPath = `${distRoot}/.wfx-dev.lock`;
const LOCK_STALE_MS = 5 * 60 * 1000;

function log(...parts) { console.log(`[wfx-dev]`, ...parts); }

function git(args) { return spawnSync('git', args, { cwd: root, encoding: 'utf8' }); }

/** Run the test suite; the live loop only commits verified builds. */
async function runTests() {
  const files = (await readdir(resolve(root, 'tests'))).filter((f) => f.endsWith('.test.mjs')).sort();
  if (!files.length) return { ok: false, summary: 'tests: none found' };
  const r = spawnSync(process.execPath, ['--test', ...files.map((f) => resolve(root, 'tests', f))], { cwd: root, encoding: 'utf8' });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const pass = /# pass (\d+)/.exec(out)?.[1] ?? '?';
  const fail = /# fail (\d+)/.exec(out)?.[1] ?? '?';
  return { ok: r.status === 0, summary: `tests: ${pass} pass, ${fail} fail` };
}

/** Commit and push the working tree so GitHub tracks the live build. */
async function commitAndPush(stamp) {
  const status = git(['status', '--porcelain']).stdout.trim();
  if (!status) return 'git: nothing to commit';
  const tests = await runTests();
  if (!tests.ok) return `git: NOT committed — ${tests.summary}`;
  if (git(['add', '-A']).status !== 0) return 'git: add failed';
  const commit = git(['commit', '-q', '-m', `chore(dev): live build ${stamp}`, '--no-verify']);
  if (commit.status !== 0) return `git: commit failed (${(commit.stderr || commit.stdout).trim().slice(0, 120)})`;
  const push = git(['push', '-q', 'origin', 'HEAD']);
  return push.status === 0
    ? `${tests.summary}; git: committed + pushed`
    : `git: committed; push failed (${(push.stderr || push.stdout).trim().slice(0, 120)})`;
}

function build() {
  const r = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stdout || '', r.stderr || '');
    throw new Error('build failed');
  }
  const line = (r.stdout || '').trim().split('\n').pop() ?? '';
  return line;
}

async function syncChannel() {
  // Sync IN PLACE: never delete the directory the loaded extension reads from.
  // Copy changed files, then remove only files that no longer exist in dist.
  const distDir = resolve(root, 'dist');
  await mkdir(channelDir, { recursive: true });
  const list = async (dir) => new Set((await readdir(dir, { recursive: true, withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => resolve(e.parentPath ?? e.path, e.name).slice(dir.length + 1)));
  const wanted = await list(distDir);
  const existing = await list(channelDir);
  for (const rel of wanted) {
    await mkdir(dirname(resolve(channelDir, rel)), { recursive: true });
    await cp(resolve(distDir, rel), resolve(channelDir, rel));
  }
  for (const rel of existing) {
    if (!wanted.has(rel)) await rm(resolve(channelDir, rel), { force: true });
  }
}

async function cdpTargets() {
  const res = await fetch(`http://127.0.0.1:${port}/json`, { signal: AbortSignal.timeout(3000) }).catch(() => null);
  if (!res?.ok) return null;
  return res.json();
}

/** Reload the extension via its service worker, then reload its pages. */
async function hotReload(targets) {
  const extensionTargets = targets.filter((t) => (t.url ?? '').startsWith('chrome-extension://'));
  if (!extensionTargets.length) return { reloaded: false, reason: 'no extension targets (is the extension loaded?)' };

  const worker = extensionTargets.find((t) => t.type === 'service_worker');
  if (worker) {
    const ok = await evalInTarget(worker.webSocketDebuggerUrl, 'chrome.runtime.reload(); "reloaded"');
    if (!ok.ok) return { reloaded: false, reason: ok.error ?? 'runtime.reload failed' };
  }

  // Give the worker a moment, then refresh whatever extension pages are open.
  await new Promise((r) => setTimeout(r, 600));
  const after = await cdpTargets();
  let pages = 0;
  for (const t of (after ?? []).filter((x) => x.type === 'page' && (x.url ?? '').startsWith('chrome-extension://'))) {
    const r = await evalInTarget(t.webSocketDebuggerUrl, 'location.reload(); "reloading"');
    if (r.ok) pages += 1;
  }
  return { reloaded: true, pages };
}

/** Minimal CDP evaluate over the built-in WebSocket. */
function evalInTarget(wsUrl, expression) {
  return new Promise((resolveResult) => {
    if (!wsUrl) return resolveResult({ ok: false, error: 'no websocket url' });
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolveResult(v); try { ws.close(); } catch { /* closed */ } } };
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => done({ ok: false, error: 'cdp timeout' }), 8000);
    ws.onopen = () => ws.send(JSON.stringify({
      id: 1, method: 'Runtime.evaluate',
      params: { expression, awaitPromise: true, returnByValue: true, allowUnsafeEvalBlockedByCSP: true },
    }));
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id !== 1) return;
        clearTimeout(timer);
        const details = msg.result?.exceptionDetails;
        done(details ? { ok: false, error: details.text ?? 'exception' } : { ok: true });
      } catch { /* ignore non-JSON frames */ }
    };
    ws.onerror = () => { clearTimeout(timer); done({ ok: false, error: 'websocket error' }); };
  });
}

async function launchBrowser() {
  const launcher = resolve(root, 'scripts/wfx-deploy');
  const child = spawn(launcher, ['launch', browser], { detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 30; i += 1) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await cdpTargets()) return true;
  }
  return false;
}

async function withLock(fn) {
  await mkdir(distRoot, { recursive: true });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const handle = await open(lockPath, 'wx');
      await handle.writeFile(String(process.pid));
      try {
        return await fn();
      } finally {
        await handle.close();
        await rm(lockPath, { force: true });
      }
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      const age = await stat(lockPath).then((s) => Date.now() - s.mtimeMs).catch(() => LOCK_STALE_MS);
      if (age > LOCK_STALE_MS) { await rm(lockPath, { force: true }); continue; }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  log('another build cycle is running; skipped this one');
  return undefined;
}

async function deploy({ launch = false } = {}) {
  return withLock(async () => {
    const summary = build();
    await syncChannel();
    let targets = await cdpTargets();
    if (!targets) {
      if (mayLaunch) {
        log('no CDP endpoint; launching browser (--launch given)');
        if (!(await launchBrowser())) { log('launch timed out; extension is staged and loads on next start'); return; }
        targets = await cdpTargets();
      } else {
        log(`staged -> ${channelDir}`);
        log(summary);
        log(`refresh your open ${browser} tab to load it (extension pages re-read from disk; a background/service-worker change needs a chrome://extensions reload)`);
        if (gitMode) log(await commitAndPush(summary));
        return;
      }
    }
    const result = await hotReload(targets ?? []);
    log(summary);
    log(result.reloaded
      ? `hot-reloaded extension in ${browser} (${result.pages} page(s) refreshed)`
      : `staged -> ${channelDir}; reload skipped: ${result.reason}`);
    const manifest = JSON.parse(await readFile(resolve(root, 'dist/manifest.json'), 'utf8'));
    log('loaded version:', manifest.version, '| channel:', channelDir);
    if (gitMode) log(await commitAndPush(summary));
  });
}

async function main() {
  await deploy({ launch: false });
  if (!watchMode) return;
  log('watching src/, manifest.json, vite.config.mjs — edit and the browser reloads'
    + (gitMode ? ' and the commit is pushed' : ''));
  const watchers = [
    watch(resolve(root, 'src'), { recursive: true }),
    watch(resolve(root, 'manifest.json')),
    watch(resolve(root, 'vite.config.mjs')),
  ];
  let timer = null;
  let running = false;
  let pending = false;
  for (const w of watchers) {
    // eslint-disable-next-line no-await-in-loop
    for await (const _event of w) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (running) { pending = true; return; }
        running = true;
        try { await deploy({ launch: false }); } catch (error) { log('rebuild failed:', error.message); }
        running = false;
        if (pending) { pending = false; await deploy({ launch: false }).catch((e) => log('rebuild failed:', e.message)); }
      }, gitMode ? 1200 : 350);
    }
  }
}

main().catch((error) => { console.error('[wfx-dev]', error.message); process.exitCode = 1; });
