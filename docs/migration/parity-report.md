# Workforce Source Migration — Parity & Cutover Report

**Date:** 2026-09-15 (migration executed 2026-09-14 → 2026-09-15 PDT)
**Executor:** Verious Smith III (Canonical Owner Principal), via Chromebook agent.

## 1. Source provenance (recovered)

| Fact | Value |
| --- | --- |
| Original source path | `/home/wirebot/focusa-piext-sync/apps/workforce-extension` (worktree of `/home/wirebot/focusa`, branch `fix/pi-ext-port-reception-patches`) |
| Source HEAD at migration | `8797c6f3b844ee44d24f4894dc71f0fab90366d5` |
| Remote | `https://github.com/Startempire-Wire/focusa.git` |
| Extension history | 26 commits, first `b354bea86` (2026-08-24, "feat: add Focusa Workforce Chrome MV3 shell") through HEAD `8797c6f3b` |
| Worktree state | clean; single untracked dir `dist.pre-work-rollback/` (pre-public-work build, left untouched in place) |
| Extraction method | `git filter-branch --subdirectory-filter apps/workforce-extension` on a single-branch clone (history-preserving, monorepo untouched) |
| Extraction root | rewritten history root `0e0977ecce35e1a6584bb92cabef26c80cdf349d` |
| Merge into this repo | merge commit `b0144e3` (unrelated-histories merge; README conflict resolved by keeping the canonical README and appending the recovered operational notes) |

## 2. Identity preserved

- Extension ID: `ohfbbkpacpcapicpgplnnmifmlnmjggj` (ID derives from the
  `/extroot/dist` load path in the Veragensia demo container; no manifest `key`
  is used, so the ID is preserved by keeping the deployment mount path unchanged).
- Manifest: MV3, permissions exactly `storage, sidePanel, activeTab`,
  `optional_host_permissions` bounded to http(s), CSP `script-src 'self'`,
  new-tab override `startpage.html`, version `0.9.191`.
- Live-behavior pin: the deployed manifest keeps `newtab: startpage.html`
  (normal mode). The public Work view is opened explicitly via
  `startpage.html?public-work=1`. `FOCUSA_PUBLIC_NEWTAB=1` remains the build
  flag (embeds `public-newtab.html` + redirect), and the deployment adapter
  pins the new-tab override back to `startpage.html` to match the live
  artifact (provenance: the live manifest deployed 2026-09-09 was the plain
  `startpage.html` override; prior rollback + older stage dirs agree).

## 3. Artifact parity (old vs new)

- Old live artifact tree hash (`dist` content, 2026-09-09 deployment from the
  old worktree): `aa87575f10fc10bd22cbbb56faf30df23e1cb3e39313fba4dfa543c76a78c567`
- New artifact built from `Startempire-Wire/Focusa-Workforce-Extension`
  (commit `3066d7c8` via merged history) with `FOCUSA_PUBLIC_NEWTAB=1` plus
  the byte-exact live `public-work.json` snapshot
  (`sha256 38546d9041a95a5df8f57e8cc5156ef548717a16fef14d8c86dc3f44962b60a1`):
  **tree hash identical — `aa87575f10fc10bd22cbbb56faf30df23e1cb3e39313fba4dfa543c76a78c567`**
  (per-file: 28/28 identical, normalized-path comparison).
- Source-tree identity vs the old worktree at migration time: `src/`, `scripts/`,
  `tests/`, `manifest.json`, `package.json` all IDENTICAL (diff -r clean).

## 4. Veragensia deployment cutover

- `uiai-lab-push` (`Startempire-Wire/veragensia`, commits `d079a7f`, `985a2f6`)
  now builds from `/home/wirebot/focusa-workforce-extension` (checked-out copy
  of this repo) and:
  - keeps build-before-promotion, per-push stage dir (`dist.stage.$$`),
    manifest + snapshot checksum verification, atomic promote
    (`dist → dist.rollback → stage → dist`), automatic rollback with
    re-activation on failed activation;
  - keeps the health gates (chrome healthy / extension ready / owner_drift
    none / ext_id `ohfbbkpacpcapicpgplnnmifmlnmjggj`) and the
    `https://os.focusa.dev` HTTP 200 gate;
  - pins the live new-tab manifest override with provenance comments.
- `uiai-lab-live` fix (`847eaee`, deployed to OVH `/usr/local/bin`): the
  Omarchy/Hyprland demo supervises Chromium via `chromium-loop.sh`; the old
  KDE-era `pkill -f chromium` killed the supervisor itself and could never
  relaunch the browser. Now it kills only the chromium binary, lets the
  supervisor relaunch, falls back to the legacy `lab-ext.sh` path only when a
  plasmashell session exists, and records the CDP extension ID into
  `/tmp/uiai-ext-id`.

## 5. Live verification

- Final verified push (from this repo's checkout): all gates pass,
  `ext_id: ohfbbkpacpcapicpgplnnmifmlnmjggj`, `https://os.focusa.dev` HTTP 200.
- Rollback drill (real promote of a broken stage using the wrapper's own
  mechanics): gates caught the broken build (chrome down, ext_id empty);
  the documented restore + re-activation path returned the lab to
  healthy + HTTP 200 with the pinned extension ID. A subsequent verified
  push left the lab in a fresh green state.

## 6. CI/CD

- Full pipeline on `push`/`PR`/`dispatch` to `main`: baseline validation,
  `node --test` (22 test files), MV3 build with manifest assertions,
  unpacked-extension validation, checksum logging. Runner: repo-scoped
  self-hosted `ovh-workforce` on the OVH build host.
- Org constraints (recorded so nobody re-fights this): the Startempire-Wire
  free plan exhausts private-repo hosted-runner minutes and artifact storage
  quota; hosted-runner jobs fail with `startup_failure`/upload errors. This
  repo was made **public** (its source already lived in the public `focusa`
  monorepo) and CI pinned to self-hosted. Artifact upload was replaced with
  logged checksums for the same reason; deployment builds from a checked-out
  copy, not from CI artifacts.

## 7. Chromebook workbench (single codebase, multi-target)

`scripts/wfx-deploy` (symlinked as `wfx` on the Chromebook at `~/.local/bin/wfx`,
repo checkout `~/src/focusa-workforce-extension`):

- `wfx build` / `wfx test` — same build/test entrypoints CI uses.
- `wfx gh` — push to GitHub (CI runs).
- `wfx brave` / `wfx chrome` — refresh the stable per-channel dist copies
  (`~/.local/share/focusa-workforce/dist-<browser>`); `wfx launch brave|chrome`
  starts the browser with the dist loaded (unpacked load path ⇒ stable
  per-channel extension ID; verified live: Brave channel loaded the extension
  and rendered the public Work view).
- `wfx veragensia` — verifies the OVH checkout matches this repo's HEAD, then
  runs the existing `uiai-lab-push` pipeline end-to-end.
- Private state (browser profiles, credentials, snapshots) stays outside the
  repo; snapshots are passed by path at deploy time.

## 8. Remaining migration debt

1. Old source `/home/wirebot/focusa-piext-sync/apps/workforce-extension` is
   still present (untouched, per rollback rule). Retire it after a few
   successful release cycles with operator approval; keep `dist.pre-work-rollback/`
   until then. The `fix/pi-ext-port-reception-patches` branch in the monorepo
   still carries the extension source — future Workforce development should
   not resume there.
2. Probe repos `wf-ci-probe` / `wf-ci-probe2` (empty) need `delete_repo`
   scope to remove.
3. `veragensia` repo has local dirt (`.beads/issues.jsonl`, `__pycache__`,
   `.focusa/`) that predates the migration — operator state, not migration debt.
4. The `public-work.json` snapshot is currently pinned to the 2026-09-09
   curation; refresh via `veragens-public-work.py` when the demo content
   should move forward.
5. Chrome/Chromium channel on the Chromebook has no `public-work.json`
   (dogfood build only); add `--snapshot` plumbing for local channels if
   dogfooding the public view locally becomes a need.
