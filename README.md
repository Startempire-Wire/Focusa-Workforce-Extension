# Focusa Workforce

**Focusa Workforce** is the browser-resident command surface for a human-owned agent workforce: a Chrome/Chromium extension for seeing agents, directing work, reviewing evidence, handling approvals, and staying attached to the same governed Focusa work across local and remote computers.

The product name remains **Workforce**. This repository is its canonical home.

> **The extension is a window, not the runtime.**

Agents, Workstreams, Workpoints, authority, Evidence, Receipts, conversation state, and durable execution live in the systems that already own them. Workforce projects that reality into the browser and gives the operator one fast, inspectable place to work with it.

---

## Status

This repository is being established as the canonical source and release home for the existing Focusa Workforce extension.

A real Workforce extension already exists and is deployed in the Veragensia public Agent Computer demo at `https://os.focusa.dev`. The current Veragensia deployment tooling builds that extension from a private Focusa worktree and loads the resulting `dist/` directory into Chromium. The source must be recovered/migrated into this repository without inventing or replacing it.

Until that source migration lands, this repository should be treated as the canonicalization point for:

- the Workforce product identity;
- the extension source once recovered;
- build/test/release automation;
- Chromebook installation artifacts;
- extension-specific contracts and documentation;
- the curated upstream architecture corpus that governs this surface.

Do **not** create a second competing Workforce implementation merely because the currently deployed source is not yet present here.

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

## Source recovery rule

The existing deployed extension is the migration seed.

Known deployment evidence points to a Focusa worktree path:

```text
/home/wirebot/focusa-piext-sync/apps/workforce-extension
```

The recovered source should be migrated here with provenance/history preserved where possible.

Do not scaffold a competing implementation over the top of this repo until that recovery attempt is complete.

---

## Intended repository shape

Once source recovery is complete, this repository should converge on something close to:

```text
src/
  background/
  content/
  sidepanel/
  startpage/
  options/
  lib/
    focusa/
    pairing/
    events/
    workforce/
    evidence/
    approvals/
    uiai/
    voice/
    topology/

public/
manifest.json
scripts/
  build.mjs
  package-extension.mjs
  verify-build.mjs

tests/
  unit/
  integration/
  browser/

docs/
  upstream/
  contracts/
  decisions/
  runbooks/

.github/workflows/
```

The actual recovered source layout wins where it is already coherent.

---

## Build and release direction

The repo should support:

```text
commit
  ↓
validate
  ↓
test
  ↓
build deterministic dist/
  ↓
package extension artifact
  ↓
checksums / provenance
  ↓
preview/demo deployment
  ↓
Chromebook install/update path
```

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

## Workbench: clone, build, deploy (Chromebook, cloud-capable)

This repo is the single codebase for every deployment channel. Clone it, then
use `scripts/wfx-deploy` (symlink `wfx`): `build`, `test`, `gh` (push + CI),
`brave` / `chrome` (stable local dist copies + `launch`), and `veragensia`
(existing OVH atomic-promotion pipeline for `https://os.focusa.dev`). All
targets consume the same checkout and the same `scripts/build.mjs` output; no
codebase duplication. See `docs/migration/parity-report.md` §7.

## Immediate priorities

1. Recover the deployed extension source and provenance.
2. Make the repo build deterministically from a clean checkout.
3. Produce an installable Chromebook build immediately.
4. Pair it to a real Focusa daemon without duplicating state.
5. Implement/verify Roster, Task Graph, Direction, Approvals, Evidence, Audit, and UIAI handoff.
6. Add voice as an input route into the same governed operation model.
7. Add resource/body/topology posture so local versus cloud execution is visible.
8. Wire CI/CD for preview/demo and versioned install artifacts.
9. Dogfood continuously on the Chromebook.
10. Expand toward the richer Workforce operations surface while preserving Focusa/UIAI/Veragensia/Wirebot ownership boundaries.

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
