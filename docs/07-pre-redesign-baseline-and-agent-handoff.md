# Focusa Workforce — Pre-Redesign Baseline & Build-Agent Handoff

**Status:** implementation-ready baseline
**Date:** 2026-09-15
**Audience:** build agents operating from the Chromebook and connected cloud/server infrastructure

## 1. Current truth

`Startempire-Wire/Focusa-Workforce-Extension` is now the authoritative source for Focusa Workforce.

The old source at:

```text
/home/wirebot/focusa-piext-sync/apps/workforce-extension
```

is provenance/rollback material only. Do not resume feature work there.

The exact pre-redesign state before this stabilization pass is preserved at:

```text
baseline/pre-redesign-2026-09-15
```

Migration provenance, byte parity, live cutover and rollback proof are in `docs/migration/parity-report.md`.

## 2. Development topology

The agent may work across machines. The repository remains the single source of truth.

```text
                       GITHUB
       Startempire-Wire/Focusa-Workforce-Extension
                          |
          +---------------+----------------+
          |                                |
          v                                v
   CHROMEBOOK                         CLOUD / SERVER
   daily operator                    CI + deployment
   UI/browser dogfood                heavy execution
          |                                |
   ~/src/focusa-workforce-extension        |
   ~/.local/bin/wfx                        |
          |                                |
          +---------- same commits --------+
                                           |
                                 kh authoritative checkout
                         /home/wirebot/focusa-workforce-extension
                                           |
                                  Veragensia uiai-lab-push
                                           |
                                           v
                                  https://os.focusa.dev
```

Do not create Chromebook-specific or cloud-specific forks of the product code.

Machine-local material stays outside Git:

- browser profiles;
- pairing tokens/credentials;
- operator state;
- private/public-work snapshots unless explicitly curated for source control;
- deployment SSH credentials;
- customer data.

## 3. Promotion semantics

There are deliberately two separate operations:

```text
wfx gh
  -> push source
  -> CI test/build/checksum
  -> DOES NOT make os.focusa.dev live

wfx veragensia
  -> require cloud checkout to equal exact local HEAD
  -> invoke Veragensia build/stage/checksum/atomic promote
  -> activation/health gates
  -> rollback on failure
  -> https://os.focusa.dev
```

Keep this separation during redesign. Do not turn every `main` push into an uncontrolled live customer/demo mutation unless the release contract is intentionally changed later.

The public Veragensia extension identity remains:

```text
ohfbbkpacpcapicpgplnnmifmlnmjggj
```

## 4. Stabilization performed before redesign

This baseline fixes four migration-era sharp edges without redesigning the product:

1. `src/startpage.mjs` now imports `fetchWorkLoop` and `ProjectionRequestError` explicitly from the API client. The private start-page route referenced them previously without importing them.
2. Start-page shared event binding now runs once rather than twice.
3. `scripts/wfx-deploy` resolves its real path via `readlink -f`, so the Chromebook symlink `~/.local/bin/wfx` resolves the repository correctly.
4. The duplicated `deploy_local_browser()` helper was removed.

Regression tests now lock these assumptions instead of merely checking for identifier strings.

## 5. What is already strong and should be preserved

The redesign is not permission to rewrite proven plumbing.

Preserve these contracts unless an upstream owning system changes them:

- MV3 least-privilege manifest;
- explicit daemon pairing and exact-origin host permission;
- connection validation and bounded local storage;
- canonical API schema checks and bounded projections;
- SSE cursor replay, post-render cursor commit and bounded reconnect;
- exact `session_id + run_id + generation` mutation targeting;
- stale-target failure rather than guessed mutation;
- durable idempotency intent before mutation;
- approval binding for consequential operations;
- safe Silent Session preflight and config hash binding;
- public Work isolation from private connection/storage/event paths;
- Focusa as state/authority owner;
- UIAI as browser/computer execution owner;
- Veragensia as placement/body/enforcement owner;
- Wirebot as life/business Chief-of-Staff layer.

## 6. What may be redesigned aggressively

The current UI was built as a functional operator prototype. The product surface can now change substantially.

Primary current surfaces:

```text
startpage   daily glance / launch
sidepanel   pairing + orientation + create/control + audit/notifications
wall        read-only situational display
```

The next product should become the richer Workforce operations experience defined in the canonical product/UX specs:

```text
Owner
 |
 +-- Projects / Workstreams
 |      |
 |      +-- Foreman
 |             +-- Managers / Crew
 |             +-- work/task graph
 |             +-- Evidence
 |             +-- approvals
 |
 +-- Needs You
 +-- Direction + voice
 +-- Radar projection
 +-- UIAI execution handoff
 +-- multi-daemon owner lens
 +-- machine/body/topology/resource posture
 +-- elastic execution visibility
```

The current `lib/` modules are intentionally candidates to survive the UI redesign.

## 7. Recommended implementation direction

Do not begin with a giant framework migration.

Recommended sequence:

```text
1. keep existing core modules green
2. introduce shared Workforce client/runtime state
3. move duplicated per-page daemon/SSE logic behind that client
4. build the new UI shell around real canonical data
5. ship vertical slices one at a time
6. dogfood each slice on Chromebook
7. use cloud/server for heavy build/runtime work
8. explicitly promote proven slices to Veragensia
```

Svelte 5 + JavaScript/JSDoc is appropriate for the richer presentation layer if it reduces UI complexity, but it should wrap/reuse the proven integration core rather than trigger a ground-up rewrite.

A practical vertical-slice order:

```text
Foreman + Roster
-> Direction / Needs You
-> Work Graph
-> Evidence + Approvals
-> UIAI live handoff
-> Radar
-> multi-daemon federation
-> topology / cloud capacity / body posture
```

## 8. Definition of forward progress

Do not substitute process for implementation.

A redesign step counts when a real operator flow improves in the extension and remains tested/dogfoodable.

Examples:

- a real Foreman appears from canonical Focusa state;
- a direction reaches the exact owning Foreman through governed operations;
- an approval can be understood and resolved without opening raw daemon state;
- Evidence can be inspected and linked to work;
- an agent executing in UIAI can be opened in the owning Cockpit surface;
- local vs cloud/body placement is shown truthfully;
- the Chromebook remains responsive while heavier execution happens remotely.

## 9. Before promoting to live

For consequential UI/runtime changes:

```text
wfx test
wfx build
local Chrome/Brave dogfood
verify pairing + live projection + mutation path
push / CI green
then wfx veragensia
verify extension ID + HTTP 200 + actual rendered behavior
```

The build, CI result or deploy command is not the outcome. Verify the operator-visible behavior.
