# Agent operations contract — Focusa Workforce

**Status:** active · **Authority:** Focusa [#618](https://github.com/Startempire-Wire/Focusa/issues/618), [#621](https://github.com/Startempire-Wire/Focusa/issues/621) · **Machine contract:** `/home/verioussmith/AGENTS.md` §9

This document exists so an agent knows the next step without having to derive it.
Everything here was verified live against a running daemon. If a claim here is
wrong, fix it here and in `AGENTS.md` §9 in the same change — the contract is
versioned and the two are one contract in two places.

---

## 1. Read this first — the three facts that decide everything

```sh
# 1. Which build is the browser actually running?
grep -o 'sha: "[^"]*"' /mnt/shared/MyFiles/Downloads/FocusaWorkforceExtension/lib/build-info.mjs

# 2. Is the project identity verified (this gates the capability tier)?
curl -s -X POST http://127.0.0.1:8787/v1/project/verify \
  -H 'Content-Type: application/json' \
  -d '{"project_root":"/srv/wfx/focusa-workforce-extension"}' | python3 -m json.tool

# 3. Is the deployed daemon new enough to satisfy the trajectory specs?
/usr/local/bin/focusa-daemon --version   # 0.9.194-dev == STALE, see §4
```

If (1) differs from `git rev-parse --short HEAD`, every UI symptom is a
**delivery** failure, not a code defect. A build mirrors itself to the load
path; `wfx-sync-loaded.timer` repairs drift. Do not debug the UI.

---

## 2. Canonical paths — there is exactly one of each

| Thing | Canonical | Never use |
|---|---|---|
| Repo / build | `/srv/wfx/focusa-workforce-extension` | `/home/verioussmith/src/focusa-workforce-extension` |
| Browser load path | `/mnt/shared/MyFiles/Downloads/FocusaWorkforceExtension` | hand-copied trees |
| Daemon | `http://127.0.0.1:8787` | rebinding to `0.0.0.0` |
| Daemon from the browser | `http://100.115.92.26:8787` | — |
| UIAI engine | `http://127.0.0.1:7456` (bridge `100.115.92.26:7456`) | — |
| Project marker | `<repo>/.focusa-project.json` | a marker naming another root |
| `continuity_id` | `37574af3709baa6b` | a newly minted id while this one owns the workstream |

The stale `/home` checkout is retained only as history. Its marker previously
named `/home/...`, which is what split the daemon's project fingerprint across
three values and made every scope-scoped read miss.

---

## 3. Governed operations — required inputs, failure modes, next actions

| Operation | Surface | Required inputs | Common failure | Next action on failure |
|---|---|---|---|---|
| Project identity verify | `POST /v1/project/verify` | `project_root` | `status: mismatch`, `mismatch_reason` names a different root | Fix `.focusa-project.json`; do not retry the request |
| Trajectory define | `POST /v1/trajectory/define-goal` | `project_root`, `continuity_id`, `long_term_goal`, `desired_end_state`, `current_ask` | `missing_fields: ["continuity_id"]`; or `completed` but unreadable (§4) | Get identity verified (§3 row 1) first; see §4 for the readback gap |
| Trajectory read | `GET /v1/trajectory/view` | `project_root`, `continuity_id` | `not_found` on a ledger that demonstrably has the record | Stale daemon — §4. Verify the ledger before re-writing |
| Trajectory assess | `POST /v1/trajectory/assess` | `project_root`, `continuity_id` | `clarity_gate.blocking_reasons` | Supply the named fields; the gate is authoritative |
| Genesis start | `POST /v1/project/genesis/start` | `project_root`, `continuity_id`, `idempotency_key` | `active_agent_coordination_conflict` | If the owning workstream is orphaned → `takeover: true, confirm: true`. Never create a parallel continuity |
| Workpoint current | `GET /v1/workpoint/current` | `project_root`, `continuity_id` | `not_found` | No Workpoint for this scope yet — run genesis/first-mission |
| Work-loop status | `GET /v1/work-loop/status` | `project_root`, `continuity_id` | `scope_mismatch` | Both headers/params required. Control path is unroutable on 0.9.194-dev |

**CLI caveat (#621).** `focusa trajectory define-goal` is not usable:
`--lifecycle-action is supported by install, update, and uninstall`.
Use the HTTP API. `focusa project identity`, `focusa project genesis start`,
`focusa first-mission` and `focusa status` do work.

---

## 4. Trajectory readback — fixed 2026-10-02; keep this from regressing

**Status: RESOLVED.** The daemon is now **0.9.198**, rebuilt from `origin/main`.
`define-goal` -> `trajectory/view` round-trips, `canonical: true`, and
`clarity_gate.status` is `clear`.

```sh
/usr/local/bin/focusa-daemon --version      # expect 0.9.198, NOT 0.9.194-dev
curl -s "http://127.0.0.1:8787/v1/trajectory/view?project_root=/srv/wfx/focusa-workforce-extension&continuity_id=37574af3709baa6b" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['status'], d['details']['tool_result_v1']['intelligence_view']['clarity_gate']['status'])"
# -> completed clear
```

### The failure shape, kept so it is recognised instantly

| | |
|---|---|
| Symptom | `define-goal` returns `status: completed` with a real `trajectory_id`; `trajectory/view` returns `not_found`; `assess` reports `clarity_gate.blocking_reasons: [long_term_goal, desired_end_state, ...]` |
| Not the cause | scope, project identity, or persistence — the record **is** on disk |
| Where it is | `~/.local/lib/focusa/trajectory-ledger/<scope-hash>/events.jsonl` |
| Root cause it was | deployed binary built **2026-09-16**; the fix landed **2026-09-17** |
| Fix | rebuild from `origin/main` (`01ab90ca1` goal admission, `9bea89c1c` reconcile view revision with scoped ledger) |
| Tracking | Focusa #621 |

If it ever returns: check the version first. Do not re-diagnose the scope.

### Rebuild recipe (kh -> ovh; this container has 4 GB RAM and cannot build)

kh's memory is contended (`mariadbd` alone holds ~4.9 GB, no swap permitted), so
compile on ovh through the project's own helper rather than locally:

```sh
# 1. clean origin/main checkout (never the divergent /home/wirebot/focusa tree)
runuser -u wirebot -- git clone --filter=blob:none \
  https://github.com/Startempire-Wire/Focusa.git /home/wirebot/focusa-main
runuser -u wirebot -- bash -lc "cd /home/wirebot/focusa-main && git reset --hard origin/main"

# 2. delegate the compile to ovh (kh -> focusa-build-ovh)
cd /home/wirebot/focusa-main
runuser -u wirebot -- env FOCUSA_SOURCE_ROOT=/home/wirebot/focusa-main \
  /usr/local/bin/focusa-ovh-build cargo build -p focusa-api --bin focusa-daemon --release
# ARTIFACT local=/home/wirebot/focusa-main/target/release/focusa-daemon

# 3. install here
sudo install -m 0755 <artifact> /usr/local/bin/focusa-daemon
systemctl --user restart focusa-daemon.service
```

Notes learned the hard way: `focusa-*` crates need `rustc >= 1.91` (kh has 1.91.0
installed but not selected — `cargo +1.91.0`); AlmaLinux 8 has no musl package, so
build the default glibc target (forward-compatible with this Debian container);
scp the binary across and `--version` it here before replacing anything.


Rebuild recipe (kh; this container has 4 GB RAM and cannot build):

```sh
git clone --filter=blob:none https://github.com/Startempire-Wire/Focusa.git /root/build/focusa/src
cd /root/build/focusa/src && git reset --hard origin/main
export CARGO_TARGET_DIR=/root/build/focusa/target
export FOCUSA_AUTHORITY_ROOT_KEYS_JSON='{"authority-root-2026-01":"A6EHv/POEL4dcN0Y50vAmWfk1jCbpQ1fHdyGZBJVMbg="}'
cargo +1.91.0 build -p focusa-api --bin focusa-daemon --release -j 2
```

`focusa-*` crates require `rustc >= 1.91`; select it explicitly. AlmaLinux 8 has
no musl package, so build the default glibc target (forward-compatible with the
Debian container).

---

## 5. Rules this extension lives by

- **Trajectory is not optional.** Per #618, a Full trajectory — HLT → required
  MLG/STG branches and waypoints → specification/acceptance → dependencies →
  linked admitted work and evidence — is the definition of implementation
  readiness. A roadmap, coverage table, or structurally valid graph does not
  satisfy it, and Definition of Ready is enforced daemon-side.
- **Ad hoc work gets a declared capability ceiling, never an exemption.**
  Without a complete ladder the daemon grants a reduced tier
  (`unbound_read_only`, `recovery_read_plan`, `blocked_read_only`,
  `planned_read_only`, `idempotent_read_or_guarded_write`). Ad hoc work runs in
  that tier: it may read, plan, checkpoint and record evidence; it may not claim
  completion or settle. The tier lifts automatically when the ladder verifies.
  This is the same shape as the stopgap doctrine: smallest honest step, labelled
  with its owner, transition wired in.
- **Never invent owner data.** If the daemon did not return it, the surface says
  so. Browser captures are marked `local: true` and are not owner-canonical.
- **Verify live, never assert.** Every row in §3 has a command. A claim without a
  command is not a claim.
- **One commit per verified change**, gated on `npm run test` (which runs a real
  vite build) plus repo CI.

---

## 6. Verification commands (copy-paste)

```sh
# identity + tier
curl -s -X POST http://127.0.0.1:8787/v1/project/verify -H 'Content-Type: application/json' \
  -d '{"project_root":"/srv/wfx/focusa-workforce-extension"}' | python3 -m json.tool

# project list (failure_class must be null)
curl -s http://127.0.0.1:8787/v1/project/list | python3 -m json.tool

# workpoint (must be status: active, canonical: true)
curl -s "http://127.0.0.1:8787/v1/workpoint/current?project_root=/srv/wfx/focusa-workforce-extension&continuity_id=37574af3709baa6b"

# deployed path matches the build
diff -r /srv/wfx/focusa-workforce-extension/dist \
        /mnt/shared/MyFiles/Downloads/FocusaWorkforceExtension   # expect: no output

# suite + CI parity
cd /srv/wfx/focusa-workforce-extension && npm run test
gh api repos/Startempire-Wire/Focusa-Workforce-Extension/actions/runs \
   --jq '.workflow_runs[0] | {head: .head_sha[0:7], status, conclusion}'
```