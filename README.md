# Focusa Workforce

**Focusa Workforce** is the browser-resident command surface for a human-owned agent workforce: a Chrome/Chromium extension for seeing agents, directing work, reviewing evidence, handling approvals, and staying attached to the same governed Focusa work across local and remote computers.

The product name remains **Workforce**. This repository is its canonical home.

> **The extension is a window, not the runtime.**

Agents, Workstreams, Workpoints, authority, Evidence, Receipts, conversation state, and durable execution live in the systems that already own them. Workforce projects that reality into the browser and gives the operator one fast, inspectable place to work with it.

---

## Status

This repository is the **authoritative source and release home** for the existing Focusa Workforce extension.

The deployed extension source was recovered from the former Focusa monorepo worktree with its history preserved, merged here, reproduced byte-for-byte against the prior live artifact, and cut over in Veragensia. The public Agent Computer demo at `https://os.focusa.dev` now builds from a checked-out copy of this repository rather than from `/home/wirebot/focusa-piext-sync/apps/workforce-extension`.

Migration provenance, artifact parity, live verification and rollback proof are recorded in `docs/migration/parity-report.md`.

The exact pre-redesign reference point is preserved on:

```text
baseline/pre-redesign-2026-09-15
```

The current implementation is now cleared for iterative redesign. Read `docs/07-pre-redesign-baseline-and-agent-handoff.md` before substantial implementation work, especially when working across the Chromebook and cloud/server environments.

---

## What Workforce is

Workforce is the browser-facing operating surface for collaborating with agents as a real workforce rather than as isolated chat sessions.

Its job is to let the operator answer, at a glance:

- What projects and Workstreams are active?
- Which Foremen, managers, workers, browser agents, and background sessions are working?
- What is each one responsible for?
- What is happening now?
- What is blocked or waiting for me?
- What evidence exists that the work actually happened?
- Which actions require approval?
- Which machine or runtime is doing the work?
- Can this work move to a better execution venue?
- What should I direct next?

The browser is therefore a **workforce operations surface**, while the product remains **Focusa Workforce**. The term **Cockpit** remains reserved for UIAI Engine's execution-control surface.

```text
                         HUMAN
                           |
                    Focusa Workforce
               Chrome / Chromium extension
                           |
        +------------------+------------------+
        |                  |                  |
     Direction          Oversight          Evidence
   typed / voice      agents / graph     audit / receipts
        |                  |                  |
        +------------------+------------------+
                           |
                        FOCUSA
          scope · Workstreams · Workpoints
        Foreman · Radar · authority · proof
                           |
             +-------------+-------------+
             |                           |
        VERAGENSIA                    UIAI ENGINE
   placement / enforcement       browser/computer work
   local + cloud bodies          observation + proof
             |                           |
             +-------------+-------------+
                           |
             Pi · Silent Sessions · workers
             workcells · Agent Apps · browsers
```

---

## Core product model

The current upstream Workforce concept defines a multi-daemon workforce surface with a human owner lens over Projects, Workstreams, task graphs, Managers, Crew, Roles, Capabilities, Secret Scopes, budgets, approvals, Evidence and audit history.

```text
Owner
  |
  +-- pairs with one or more Focusa daemons
  |
  +-- owns Projects
        |
        +-- Workstreams
              |
              +-- Task Graphs
                    |
                    +-- Managers
                    +-- Crew
                    +-- Evidence
                    +-- Approvals
                    +-- Audit
```

The extension is not a daemon and does not own canonical workforce state. It federates and projects state from the daemon(s) currently paired to the owner.

---

## Primary surfaces

The canonical Workforce surface family currently includes:

1. **Roster** — Managers, Crew, roles, state, assignment, budget/spend, and relevant capability posture.
2. **Task Graph** — DAG/work graph, fanout, joins, mid-flight direction, reprioritization, and current execution posture.
3. **Live Agent / UIAI view** — first-person browser/computer execution when UIAI owns the execution surface.
4. **Approvals** — exact pending human decisions and consequential actions.
5. **Audit Timeline** — inspectable agent/human actions and outcomes.
6. **Evidence** — verified/unverified proof and receipts; no false closure.
7. **Direction** — natural-language and structured direction routed to the owning Manager/Foreman rather than interpreted as ambient authority.
8. **Voice** — realtime speech-to-text as another input path into the same governed direction/operation model.

Radar may be projected where useful, but Radar remains a Focusa primitive and should not become a browser-only implementation.

---

## Foreman, Manager, and worker relationship

Focusa Project Foreman is the persistent Workstream-scoped project-responsible intelligence. It is not a second chatbot or another memory store.

Workforce should project that persistent role and its workers rather than manufacture its own agent identity layer.

```text
Workstream Root
      |
      v
Project Foreman
      |
      +-- Pi worker
      +-- Claude/Codex/other worker
      +-- UIAI/browser worker
      +-- Silent Session
      +-- verifier/reviewer
      +-- future specialist
```

The exact product vocabulary may distinguish long-lived Managers from ephemeral Crew, but all identities and responsibilities must bind back to canonical Focusa role/identity primitives.

---

## Multi-daemon and distributed topology

The owner may pair Workforce with multiple Focusa daemons/nodes.

```text
                  Focusa Workforce
                        |
          +-------------+-------------+
          |             |             |
      Laptop daemon   VPS daemon   Agent Computer
          |             |             |
      local work      services      cloud/remote work
```

The extension provides one owner lens without becoming a global canonical state store.

Important rules:

- each daemon remains authoritative for the state it owns;
- pairing is explicit and revocable;
- render-time federation must preserve source/daemon identity;
- concurrent direction requires deterministic conflict/intent semantics rather than last-writer mystery;
- Extension, native clients, CLI, and future surfaces are equal-intent clients over shared operations.

---

## Chromebook role

The Chromebook is an excellent first daily-dogfood host for Workforce because the extension can be useful before the full native Veragensia Agent Computer is available.

On ChromeOS, Workforce may combine:

```text
Chrome extension
  + side panel / start page / commands
  + Focusa pairing
  + local or Crostini bridge where available
  + remote/cloud daemon pairing
  + UIAI links / live execution
  + voice
```

This does **not** make ChromeOS/Crostini a Full Veragensia Agent Computer. Workforce should show the actual runtime/body posture truthfully.

The Chromebook is the primary operator/dogfood surface, while cloud/server infrastructure may perform CI, heavy builds, daemon work, or deployment. Those environments consume the same repository and must not fork the product code.

---

## Body-independent by design

Workforce is not tied to the Chromebook, browser, or any single computer body.

The persistent agent/work relationship lives above hardware. A Chromebook, conventional Linux computer, Full Veragensia Agent Computer, cloud Agent Computer, mobile/wearable surface, or future robotic/humanoid body may expose different capabilities while the same Focusa Workstreams, Foremen, Evidence, authority, and relationship continuity remain intact.

Canonical embodiment semantics live upstream in:

- Focusa Spec 153B — Agent Embodiment, Body Profiles, and Cross-Body Continuity Addendum;
- Veragensia Doc 201 — Agent Body Profiles, Embodiment, and Transfer Addendum;
- Wirebot App Doc 10 — Body-Independent Partner Continuity Addendum.

Workforce should project body/runtime state when useful, but it must not create another body identity, transfer, or authority system.

---

## Product boundaries

### Workforce owns

- extension/browser presentation;
- workforce roster/navigation;
- task-graph visualization;
- direction entry;
- approval/evidence/audit presentation;
- multi-daemon owner lens;
- extension-specific install/update/release UX;
- scoped links into UIAI execution views;
- browser-specific ambient integrations.

### Focusa owns

- Workstreams / Workpoints / Foreman bindings;
- role/agent identity semantics;
- authority and capability decisions;
- Evidence / Receipts / audit truth;
- Conversation / voice semantics;
- Radar semantics;
- canonical operation/state contracts;
- body-independent work continuity.

### UIAI Engine owns

- browser/computer perception and actuation;
- execution capsules;
- observation-bound actions;
- browser/computer control leases;
- FPV/Cockpit diagnostics and intervention;
- browser/computer proof.

### Veragensia owns

- runtime/body integration;
- local/cloud placement;
- enforcement and workload identity;
- Human Control Reserve / Secure Attention;
- machine resource governance;
- body/runtime incarnation and transfer;
- Full Agent Computer composition.

### Wirebot owns

- the persistent Chief-of-Staff/life-and-business partner relationship;
- broader owner context and orchestration above individual Focusa Workstreams;
- cross-project delegation into exact Foremen;
- life/business briefing and partner experience.

Workforce should integrate cleanly with Wirebot without becoming a second all-purpose life/business command application.

---

## Source authority and migration provenance

The existing deployed extension was the migration seed and has now been recovered here.

Original deployment source:

```text
/home/wirebot/focusa-piext-sync/apps/workforce-extension
```

That old tree is retained only for provenance/rollback during the transition period. Future Workforce development belongs in this repository.

Authoritative server checkout used by the Veragensia deployment pipeline:

```text
/home/wirebot/focusa-workforce-extension
```

See `docs/migration/parity-report.md` for recovered history, source hashes, artifact parity, extension identity, rollback drill and live verification.

---

## Current repository shape

The recovered implementation currently uses a deliberately simple MV3/ES-module layout:

```text
src/
  background.mjs
  sidepanel.html
  sidepanel.mjs
  startpage.html
  startpage.mjs
  startpage.css
  wall.html
  wall.mjs
  wall.css
  styles.css
  lib/
    api-client.mjs
    audit-log.mjs
    contracts.mjs
    notifications.mjs
    orchestration.mjs
    orientation.mjs
    pairing.mjs
    projections.mjs
    public-work.mjs
    reconnect.mjs
    session-create.mjs
    sse-parser.mjs
    storage.mjs
    validation.mjs
    views.mjs

manifest.json
scripts/
  build.mjs
  check-public-work.mjs
  wfx-deploy

tests/
docs/
.github/workflows/
```

Do not reorganize this merely for aesthetics. The redesign may introduce a richer presentation/runtime structure when a real implementation slice benefits from it.

---

## Build and release direction

The repo supports this flow:

```text
commit
  ↓
validate
  ↓
test
  ↓
build deterministic dist/
  ↓
checksums / provenance
  ↓
local Chromebook/browser dogfood
  ↓
explicit preview/demo promotion
```

`wfx gh` pushes source and triggers CI. It does not make the public demo live.

`wfx veragensia` is the explicit promotion path into the Veragensia public demo. It verifies the server checkout matches the exact local HEAD, then uses Veragensia's staged/checksummed/atomic/rollback-protected deployment path.

Continuous deployment must never silently change customer/private profiles without the appropriate release/update contract. The public Veragensia demo and private Chromebook/customer channels may use different promotion rules while consuming the same versioned Workforce build.

---

## Upstream architecture corpus

This repository should carry or synchronize the relevant upstream documentation from the primitive-owning repositories rather than rewrite those contracts as extension-local truth.

Primary upstream source families include:

### Focusa

- Spec 174 — Agent Workforce Extension Concept
- Spec 175 — roles/capabilities
- Spec 156 — credential authority
- Spec 164 — Workstream Root
- Spec 181 — Voice/Conversation
- Spec 182 — Project Foreman
- Spec 183 — Radar
- Spec 184 — Ambient Operator
- Spec 151 — Program Design / capability fabric
- Specs 153/153A/153B — physical/robotic semantics and embodiment
- Mission Deck / PWA and shared presentation contracts where relevant

### Veragensia

- Doc 182 — Focusa Agent OS / Agent Cloud Computer
- Doc 186 — native Chromebook release
- Doc 188 — integration contracts
- Doc 191 — Elastic Agent Computing
- Doc 193 — execution enforcement
- Doc 194 — trusted human control
- Doc 195 — runtime identity/state transfer
- Doc 197 — voice-native Agent Computer
- Doc 199 — Ambient Operator / companion integration
- Doc 200 — implementation tranche plan
- Doc 201 — Agent Body Profiles / Embodiment / Transfer

### Wirebot App

- current system map and product-ownership boundaries
- primary surfaces / specialist handoff rules
- body-independent partner continuity addendum

---

## Workbench: clone, build, deploy (Chromebook + cloud)

This repo is the single codebase for every deployment channel. On the Chromebook, use `scripts/wfx-deploy` through the `wfx` symlink. The normal commands are:

```text
wfx test
wfx build
wfx brave | wfx chrome
wfx gh
wfx veragensia
```

All targets consume the same checkout and the same `scripts/build.mjs` output; no codebase duplication. See `docs/migration/parity-report.md` §7 and `docs/07-pre-redesign-baseline-and-agent-handoff.md`.

Private state (browser profiles, credentials, snapshots) stays outside the repo.

## Immediate redesign priorities

1. Preserve the proven pairing/API/projection/SSE/orchestration/session-preflight core while improving its integration tests.
2. Introduce shared Workforce client/runtime state so each surface does not independently own daemon/SSE lifecycle.
3. Make Workstreams and Project Foremen primary navigation/context.
4. Build the real Roster/Foreman workforce view from canonical state.
5. Add Direction + Needs You as the fastest operator loop.
6. Add Work/Task Graph visualization and steering.
7. Add first-class Approvals and Evidence/Receipt inspection.
8. Add exact UIAI live-execution handoff without duplicating Cockpit.
9. Add Radar projection, multi-daemon federation and body/topology/resource posture.
10. Dogfood every vertical slice on the Chromebook and explicitly promote proven builds to `os.focusa.dev`.

---

## Design law

> **Surfaces are interchangeable; primitives are the platform.**

Workforce should feel like the most immediate place to work with an agent workforce, without ever becoming another hidden runtime or source of truth.

---

## Recovered deployed-extension notes (public Work view)

# Focusa Chrome extension

The normal start page, command panel, pairing, storage and private daemon paths
remain unchanged. The extension does not acquire additional permissions.

## Public Work view

`startpage.html?public-work=1` is an explicit read-only presentation mode. It does
not load private connections, notifications, layout preferences or event streams.
It renders a packaged `public-work.json` using text nodes; Refresh rereads that
artifact without credentials or an external network request. Missing, malformed,
oversized or unsupported data replaces the view with an unavailable state.

`focusa.public_work_snapshot.v1` has exactly these fields:

- `schema`, `visibility` (`public`), `project`, `mission`;
- `state` (`active`, `blocked`, `completed`), `stage`, `next_action`;
- `checkpoint_at`, `published_at`, `stale` (boolean).

The canonical validator and 16 KiB bound live in `src/lib/contracts.mjs`. This is
a dated display artifact, **not** a connection record, live worker count,
execution grant or a new state authority. Unsupported versions fail closed.
The producer must verify its exact source scope and curate approved public
wording before publishing. Never bundle raw Workpoint packets or credentials.

The Veragensia public-deployment adapter stages the artifact after the ordinary
extension build and validates it with `scripts/check-public-work.mjs`. Generic
extension builds do not contain a public snapshot. Identity and browser profile
are preserved; this deployment is not a full Focusa stable release.

Verification: `node --test tests/*.test.mjs`; `node scripts/build.mjs`.
Public-view tests cover contract/version bounds, safe rendering, failed reads,
credential omission and isolation from the existing private bootstrap path.
