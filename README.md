# Focusa Workforce

**Focusa Workforce is the browser-resident operations surface for a Focusa-governed AI workforce.**

It answers:

```text
Who is working?
What are they doing?
What is blocked?
What needs the owner?
What is proven?
Where is work executing?
What can I direct next?
```

The extension is a window over durable work—not the runtime itself. Agents continue in Focusa/owned runtimes when the browser closes.

## Current architecture

```text
Owner
  ↓
Operating Partner / Chief of Staff
Wirebot implementation family; customer name may be Spock/Athena/etc.
  ↓
Focusa
Project · Workstream · Foreman · Workpoint · authority · Evidence
  ↓
Focusa Workforce
roster · work · Direction · Needs You · Evidence · topology
  ↓
UIAI / Veragensia / Pi / agents / Agent Computers
```

Wirebot App and Focusa Workforce are intentionally distinct:

- **Wirebot App** runs the owner relationship, life/business orientation, Workforce Composer, owner-wide attention and outcomes.
- **Focusa Workforce** runs live workforce operations after roles/assignments are governed through Focusa.

UIAI owns browser/computer execution. Veragensia owns bodies/runtime/enforcement. W.I.N.S. owns accepted outcomes. Startempire Wire federation is optional.

## Product surfaces

- **Side Panel** — immediate collaboration, Direction, Working Now, Needs You.
- **Full Workforce** — deep roster/work/Evidence/topology operations.
- **Start Page** — return/orientation briefing.
- **Wall** — read-only situational view.

## Human-agent operating loop

```text
Orient
→ Direct
→ Interpret / Propose
→ Delegate
→ Work
→ Collaborate / Intervene
→ Verify
→ Continue / Learn
```

The user should spend attention on direction, judgment and meaningful intervention—not agent machinery.

## Full Trajectory

The redesign is governed by one connected Focusa-style Full Trajectory:

```text
HLT-WF-001
│
├─ MLG-0  Canonical contracts + implementation foundation
├─ MLG-1  Workstream + Foreman + Direction
├─ MLG-2  Working Now / People
├─ MLG-3  Needs You
├─ MLG-4  Trajectory / work progression
├─ MLG-5  Evidence / closure
├─ MLG-6  UIAI execution / takeover
├─ MLG-7  Fleet / topology / capacity
├─ MLG-8  Complete surfaces / accessibility
├─ MLG-9  Voice / Radar / contextual expansion
└─ MLG-10 Production acceptance
```

`Full`, `Medium`, and `Short` are projections of this same trajectory, not separate plans.

Current Short frontier begins at `MLG-0 / STG-0.1 / WP-0.1.1`: resolve the real current Focusa operations needed by the first slice.

## UX design authority

The redesign resolves the five UX planes as build contracts:

```text
Strategy  → docs/00 + docs/08 + docs/10
Scope     → docs/10
Structure → docs/11
Skeleton  → docs/12
Surface   → docs/13
```

Build agents are expected to implement these contracts rather than redesign them during construction.

## Shared ecosystem seams

Cross-product reference contracts belong to ADLBOS. Workforce consumes them; it does not create another integration database.

Cross-product references are source-qualified and do not transfer authority. Capability support, entitlement, activation, authority, health and consent remain distinct.

## Fleet versus federation

One Operator's multiple Focusa daemons/machines/bodies form a **fleet / multi-daemon aggregation**.

**Sovereign federation** is reserved for explicit relationships between independently scoped Operators/nodes.

## Source and live deployment

This repository is the authoritative source after the completed migration.

Live deployment flow:

```text
main + CI
→ Chromebook/browser dogfood
→ wfx veragensia
→ atomic Veragensia promotion
→ https://os.focusa.dev
```

Current live extension identity is preserved as:

```text
ohfbbkpacpcapicpgplnnmifmlnmjggj
```

Pre-redesign behavioral baseline:

```text
baseline/pre-redesign-2026-09-15
```

## Implementation direction

Preserve sound core primitives—pairing, API client, contracts, orchestration, session creation, SSE/reconnect, projections and validation—while evolving presentation toward a shared runtime/projection layer and a Svelte 5 + JavaScript/JSDoc UI.

No SvelteKit.

Visual target is defined in `docs/13-workforce-visual-system-and-reference-surfaces.md`: light-first, precise, restrained, modern and operational.

## Build-agent entry point

Start here:

```text
docs/15-build-agent-master-handoff.md
```

Then follow the Full Trajectory:

```text
docs/14-workforce-full-trajectory.md
```

## Canonical local docs

```text
00-workforce-canonical-product-and-implementation-spec.md
05-extension-runtime-data-and-integration-contracts.md
06-workforce-ux-and-interaction-spec.md
07-pre-redesign-baseline-and-agent-handoff.md
08-workforce-redesign-blueprint.md
09-slice-1-workstream-foreman-direction-implementation.md
10-workforce-product-requirements-and-proof-matrix.md
11-workforce-experience-architecture-and-stateflow.md
12-workforce-screen-and-component-contract.md
13-workforce-visual-system-and-reference-surfaces.md
14-workforce-full-trajectory.md
15-build-agent-master-handoff.md
```

Wirebot App documentation is a read-only dependency from this workstream and must not be rewritten as part of Workforce implementation.

## Non-negotiable law

```text
Surfaces are interchangeable; primitives are the platform.

A surface never becomes the source of truth merely because it is the richest UI.
Entitlement never equals authority.
Federation never equals ambient access.
Branding never equals identity or authority.
Branch/Workpoint completion never equals whole accepted outcome completion.
```
