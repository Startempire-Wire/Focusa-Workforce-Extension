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
- **Start Page** — optional return/orientation briefing.
- **Wall** — optional read-only situational view.

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

## Shared ecosystem seams

Cross-product reference contracts belong to ADLBOS, including:

```text
operator.partner_profile.v1
operator.surface_handoff.v1
operator.attention.v1
operator.correlation.v1
operator.capability_posture.v1
operator.closure.v1
```

Workforce consumes them; it does not create another integration database.

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

## Redesign direction

Preserve sound core primitives—pairing, API client, contracts, orchestration, session creation, SSE/reconnect, projections and validation—while evolving presentation toward a shared runtime/projection layer and a modern Svelte 5 UI.

Target vertical slices:

```text
1. Workstream + Foreman + Direction
2. Working Now / roster
3. Needs You
4. work progression / graph
5. Evidence / verified closure
6. UIAI execution / takeover
7. voice
8. fleet / topology
9. Radar
10. elastic capacity
```

Visual goal: **expensive calm**—clean, restrained, precise and deeply informative without dashboard theater.

## Canonical local docs

Read in this order for product work:

```text
docs/00-workforce-canonical-product-and-implementation-spec.md
docs/04-upstream-architecture-corpus.md
docs/05-extension-runtime-data-and-integration-contracts.md
docs/06-workforce-ux-and-interaction-spec.md
docs/07-pre-redesign-baseline-and-agent-handoff.md
```

For cross-product architecture, read ADLBOS `CURRENT_ECOSYSTEM_ARCHITECTURE.md` and current Wirebot App convergence docs before inventing new boundaries.

## Non-negotiable law

```text
Surfaces are interchangeable; primitives are the platform.

A surface never becomes the source of truth merely because it is the richest UI.
Entitlement never equals authority.
Federation never equals ambient access.
Branding never equals identity or authority.
```
