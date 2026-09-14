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

The browser is therefore a **Cockpit surface**, but the product remains **Focusa Workforce**.

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

The original Workforce design defines this operating model:

```text
Owner
  └── pairs with N Focusa daemons / Agent Computers
        └── Projects
              └── Workstreams
                    └── Task Graphs
                          └── Nodes
                                └── Agents
```

Agents are instantiated from roles that bind objective, capabilities, secret scopes, model/runtime posture, budget, and lifespan.

The important distinction is between durable project responsibility and disposable execution:

```text
Project Foreman / Manager
    persistent Workstream responsibility
    understands project state
    delegates / reviews / replans
    survives worker and model turnover

Workers / Crew
    bounded execution
    Pi / Silent Session / UIAI / workcell / specialist
    replaceable
    evidence-producing
```

A worker can disappear without the project losing its identity, state, next action, or responsibility chain.

---

## Workforce surfaces

The architecture already establishes the major surface families. Their exact UI and release order will be planned separately; this README records the product contract they must preserve.

### Workforce roster

Show managers/Foremen, workers, runtimes, current responsibility, health, cost/resource posture, and execution location without inventing a second agent registry.

### Work / task graph

Show current work, dependencies, progress, blockers, human checkpoints, delegation, fanout, and review state. Graph state must resolve to canonical Focusa work primitives rather than browser-only task state.

### Direction

The operator can steer the owning Foreman/manager in natural language. Typed direction and voice are different modalities into the same governed operation path.

### Approvals

Consequential actions surface as explicit approval/clarification work. Workforce presents Focusa/Veragensia authority decisions; it does not mint authority locally.

### Evidence and audit

Every material agent action should be inspectable through linked Evidence, Receipts, conversation/action lineage, and runtime provenance. “Agent says done” is not completion proof.

### Live browser/computer work

UIAI Engine remains the first-party browser/computer execution authority. Workforce may present live/FPV execution, diagnostics, screenshots, artifacts, control posture, and proof without reimplementing UIAI.

### Foreman

Project Foreman is the persistent Workstream-scoped project-responsible intelligence. Workforce is one projection of the same Foreman available through Pi, Desktop, voice, mobile, API/CLI, and other surfaces.

### Radar

Radar provides proactive scoped observation and attention: developing Episodes, meaningful Signals, failures, stalls, verification problems, waiting approvals, and other conditions worth routing to the Foreman or human. Radar observes; it does not authorize.

### Voice

Voice is a first-class interaction modality. Workforce can provide an always-available path for speaking to the correct Foreman, steering work, asking for status, and resolving approvals while preserving transcript/action lineage. Voice identity alone never grants authority.

---

## Chromebook / lightweight Cockpit role

A major target for Workforce is a small, responsive Chromebook acting as the human collaboration surface while heavier work runs wherever it belongs.

```text
CHROMEBOOK
  Focusa Workforce
  browser
  voice
  terminal / Crostini when useful
  lightweight local tools
       |
       | paired authenticated Focusa connection
       |
       +-------------------------+
       |                         |
   LOCAL BODY                REMOTE BODY
   small/local work          larger compute
   Pi when appropriate       Pi / workers
   local project access      Silent Sessions
                             builds / tests
                             UIAI workcells
                             Agent Apps
                             high-memory jobs
```

This is **not cloud RAM swap**. Focusa/Veragensia execution placement moves eligible work to the appropriate runtime while the local device remains the control surface.

Workforce should make that topology understandable without forcing the operator to think in VMs, containers, daemons, or process placement for ordinary use.

The full Omarchy Veragensia Agent Computer remains a first-class target. The lightweight Workforce-on-ChromeOS path does not replace or defer the full Agent Computer; both project the same underlying primitives.

---

## Authority boundaries

Workforce must stay thin where another system already owns truth.

| Concern | Authority |
| --- | --- |
| Project / Workstream identity | Focusa |
| Workpoint / current continuation | Focusa |
| Foreman identity and project intelligence | Focusa |
| Radar observations / Episodes / Signals | Focusa |
| Roles / capabilities / grants | Focusa |
| Conversation semantics / Conversation Ledger | Focusa |
| Evidence / Receipts / settlement | Focusa |
| Browser execution / browser observation | UIAI Engine |
| OS execution placement / enforcement | Veragensia |
| Secure attention / computer-control fencing | Veragensia + Focusa authority |
| Browser presentation / operator interaction | Workforce |

Core rules:

1. Workforce is never a second Focusa reducer or database.
2. Browser state is not canonical project state.
3. Window/tab focus is not operator intent.
4. A paired transport is not authority by itself.
5. A role name is not permission.
6. A model/session change does not create a new Foreman.
7. UIAI artifacts remain UIAI-originated and Focusa-linked; Workforce only renders/steers them.
8. Local and cloud replicas/runtimes keep explicit identity and freshness.
9. Lost connectivity becomes stale/unknown, never silently healthy or complete.
10. Human stop/takeover must remain available even when an agent or model is unhealthy.

---

## Multi-daemon and multi-computer design

Workforce is intentionally not tied to one laptop daemon.

An owner may pair multiple Focusa/Veragensia environments:

```text
Workforce
   |
   +-- Chromebook / local Focusa
   +-- primary workstation
   +-- private VPS
   +-- full Veragensia Agent Computer
   +-- cloud Agent Computer
   +-- bounded workcells / specialists
```

The UI may present them under one owner lens, but each daemon/runtime remains the source of truth for its own operational state. Cross-daemon aggregation should federate first rather than creating a premature global mutable database.

Execution placement belongs below the surface. Workforce should show **where work is happening and why**, while Focusa/Veragensia decide whether an operation belongs local, remote, headless, browser-backed, or on a full Agent Computer under the applicable grants and resource posture.

---

## Capability and role model

Workforce roles must resolve to real Focusa capabilities. The UI must not invent decorative permissions that no runtime operation enforces.

Conceptually:

```text
Role
  = Objective
  + capability bundle
  + risk ceiling
  + delegation allowance
  + secret scopes
  + budget / lifespan
```

Examples of capability families include project binding, task/work execution, evidence, release operations, browser sessions/actions/evaluations, credential use, events, approvals, and Cockpit projections.

Delegation is bounded: managers may give workers only a subset of the authority they themselves are allowed to delegate, and worker grants expire with the work they were created to perform.

---

## Credentials and secrets

Workforce may expose credential readiness, approvals, and use status, but it must never become a password vault.

The preferred model is:

```text
Focusa authorizes
→ provider/custodian retains secret
→ UIAI/process/consumer injects or uses it
→ agent receives capability/result
```

Raw credentials should not enter extension logs, transcripts, audit cards, browser storage, or model context unless a separate explicit exposure grant permits it.

---

## Events and live state

Workforce is event-driven and reconnectable.

The original design expects the extension to reconnect to daemon event streams after the browser closes or a device changes. UI state is a projection of versioned runtime truth.

Preferred behavior:

```text
initial bounded snapshot
→ subscribe to Focusa events
→ validate scope / daemon / generation
→ invalidate affected projection
→ refetch bounded read model
→ render
```

Do not ship full screenshots, documents, transcripts, secrets, or giant state dumps through generic event envelopes. Use stable handles and bounded projections.

---

## Existing deployment provenance

The Veragensia public Agent Computer currently launches a real Chromium instance with the Focusa Workforce extension as its only enabled extension, discovers the extension through Chrome DevTools Protocol, and opens its Workforce start page.

The current Veragensia deployment path:

```text
existing private Focusa worktree
  apps/workforce-extension
        |
        | build
        v
      dist/
        |
        | atomic sync
        v
Veragensia public Agent Computer
        |
        v
https://os.focusa.dev
```

Veragensia currently verifies a stable deployed extension ID:

```text
ohfbbkpacpcapicpgplnnmifmlnmjggj
```

That live source is the migration seed for this repository. Source recovery should preserve behavior/history where available rather than replacing the deployed extension with a speculative rewrite.

---

## Repository responsibility

This repository should own:

```text
extension source
manifest
service worker / browser integration
Workforce UI
start page / side-panel surfaces
pairing client
Focusa API/event client
UIAI presentation/oversight adapters
voice input surface adapters
extension-local state that is strictly presentation/configuration
build scripts
unit/integration/e2e tests
ChromeOS install/dev instructions
packaged release artifacts
CI/CD
extension-specific documentation
upstream architecture source map
```

It should **not** absorb implementations owned by Focusa, Veragensia, UIAI Engine, Pi, or another runtime merely to make this repository self-contained.

---

## Intended repository shape

The exact recovered source layout wins over this sketch where they differ, but the canonical repo should converge toward something similar to:

```text
.
├── src/                    # extension implementation
├── public/                 # static extension assets
├── scripts/                # build/package/source-sync tooling
├── tests/                  # unit + browser/e2e tests
├── docs/
│   ├── architecture/       # Workforce-specific decisions
│   └── upstream/           # curated source map / synced references
├── .github/workflows/      # CI + packaged extension builds/releases
├── manifest.*              # source/build manifest as recovered
├── package.json            # if retained by recovered implementation
└── README.md
```

Do not reshape recovered code merely to match this diagram.

---

## Build and install contract

The first practical milestone for this repository is simple:

```text
recover current deployed source
→ build reproducibly
→ test manifest/output
→ install unpacked on Chromebook
→ pair with a Focusa daemon
→ prove live Workforce state
→ iterate from this repo
```

Once the deployed source is migrated here, the README will contain the exact build command from the recovered implementation rather than inventing one now.

For development on ChromeOS, the intended loop is:

```text
clone repo in Crostini
→ build extension
→ Chrome/Brave extension developer mode
→ Load unpacked build output
→ connect to approved local/remote Focusa endpoint
→ iterate
```

The extension should remain Chromium-compatible so it can run in Chrome, Brave, and the managed Chromium profile used by Veragensia where their supported extension APIs overlap.

---

## Continuous delivery direction

This repository is intended to become the sole extension build source.

The deployment chain should converge from:

```text
server-local worktree
→ bespoke Veragensia build/sync script
```

to:

```text
Focusa Workforce repo
→ CI test/build
→ versioned extension artifact
→ Chromebook/dev install
→ Veragensia consumes pinned artifact
→ os.focusa.dev deployment verification
```

Veragensia remains responsible for deploying/activating the Agent Computer demo. Workforce owns producing a tested extension artifact.

Release automation must preserve the stable extension identity where required by the current deployment and pairing model.

---

## Canonical architecture sources

This repository consumes architecture from upstream primitive-owning repositories. Copies or indexes placed here are for implementation convenience and provenance; they do not silently supersede their canonical sources.

### Focusa

Primary Workforce definition and direct dependencies:

- `docs/174-focusa-agent-workforce-extension-concept.md` — Workforce vision, object model, surfaces, multi-daemon model, direction and voice.
- `docs/175-focusa-roles-capabilities-spec.md` — roles, grounded capabilities, delegation and risk model.
- `docs/173-focusa-secrets-broker-concept.md` — Workforce secret-scope/broker relationship.
- `docs/139-distributed-presence-environment-awareness-execution-placement-and-multi-daemon-coordination-spec.md` — presence, resource pressure, placement and multi-daemon operational reality.
- `docs/164-workstream-rooted-canonical-runtime-design.md` — canonical Workstream-rooted state.
- `docs/181-focusa-voice-conversation-expression-and-auditable-interaction-spec.md` — voice/conversation and auditable interaction.
- `docs/182-focusa-project-foreman-workstream-intelligence-projection-spec.md` — Project Foreman.
- `docs/183-focusa-radar-proactive-observation-episodes-signal-economics-and-attention-routing-spec.md` — Radar.
- `docs/184-focusa-ambient-operator-mobile-wearable-presence-meeting-and-sync-spec.md` — Ambient Operator/mobile/wearable projection.
- `docs/181-184-voice-foreman-radar-ambient-operator-current-manifest.md` — current ownership map.
- `docs/135c-uiai-rich-artifact-live-refresh-and-research-bridge-spec.md` — UIAI artifact/event/rendering bridge.
- `docs/156-focusa-project-scoped-credential-authority-secret-broker-delegated-autonomy-mfa-totp-and-cross-surface-injection-spec.md` — credential authority and injection.
- `docs/117a-living-mission-field-pwa-spec.md` — richer browser/PWA mission-surface principles.
- `docs/151-focusa-frictionless-program-design-runtime-and-agent-capability-fabric-spec.md` — capability/operation fabric and modality parity.

### Veragensia

Primary Agent Computer / Cockpit context:

- `docs/182-veragensia-focusa-agent-os-spec.md` — canonical Agent Computer composition and surface boundaries.
- `docs/186-veragensia-v0.1-native-chromebook-release-spec.md` — Chromebook/native release requirements and private Workforce surface.
- `docs/188-veragensia-v0.1-decisions-and-integration-contracts.md` — integration ownership and contracts.
- `docs/191-veragensia-elastic-agent-computing-and-cloud-runtime-spec.md` — local/cloud bodies, workcells, teams and topology placement.
- `docs/193-veragensia-execution-substrate-workload-identity-and-capability-enforcement-spec.md` — actual machine enforcement.
- `docs/194-veragensia-trusted-human-control-secure-attention-and-desktop-observation-spec.md` — trusted human control and computer-control leases.
- `docs/195-veragensia-resource-identity-runtime-incarnation-and-state-transfer-spec.md` — resource/runtime identity and local/cloud replicas.
- `docs/197-veragensia-voice-native-agent-computer-audio-ui-and-conversation-continuity-spec.md` — voice-complete Agent Computer behavior.
- `docs/199-veragensia-ambient-operator-companion-sync-and-omarchy-integration-spec.md` — Focusa/Veragensia/UIAI surface responsibilities.
- `docs/200-veragensia-living-agent-computer-implementation-tranche-plan.md` — current dependency ordering across the living Agent Computer stack.
- `scripts/lab-ext.sh` — current public-demo Chromium extension loader.
- `scripts/uiai-lab-push` — current Workforce build/sync/activation path for `os.focusa.dev`.

---

## Design principles

When implementation decisions are ambiguous, prefer these rules:

1. **Outcome over ceremony.** Build the smallest working surface that advances real operator capability.
2. **One primitive, many surfaces.** Do not create browser-only versions of canonical Focusa concepts.
3. **Thin surface, strong contracts.** Workforce presents and directs; primitive owners retain truth.
4. **Local-first, topology-aware.** Local and remote execution are explicit but should not burden the operator.
5. **Structured before visual.** Prefer typed operations and semantic automation before pixel-level control.
6. **Evidence before completion.** Work is not done because an agent says it is.
7. **Human control stays immediate.** Stop, takeover, approval, and degraded state must remain understandable and reachable.
8. **Unknown stays unknown.** Stale/disconnected state does not become success.
9. **No secret leakage.** Prefer brokered use/injection over giving credentials to agents or browser UI.
10. **Do not overbuild.** The existing Workforce extension is the starting point; evolve it instead of replacing it with architecture theater.

---

## Immediate repository milestone

Before expanding product scope, establish one trustworthy source lineage:

```text
CURRENT DEPLOYED WORKFORCE
        ↓
recover source + provenance
        ↓
THIS REPOSITORY
        ↓
reproducible build
        ↓
Chromebook unpacked install
        ↓
real Focusa pairing + live state
        ↓
continuous iteration and release
```

Once that baseline is in this repository and running on the Chromebook, additional Cockpit scope can be evaluated against real use rather than speculative UI design.
