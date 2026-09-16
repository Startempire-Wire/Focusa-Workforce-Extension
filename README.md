# Focusa Workforce

**Browser-resident operations for a Focusa-governed AI workforce.**

```text
Who is accountable?
What is happening now?
What needs me?
What is proven?
Where is work executing?
What can I direct next?
```

Workforce is a projection/intent surface over durable Focusa work. Closing the browser does not stop canonical work.

## Architecture

```text
Owner / delegated human
        ↓
Operating Partner / Chief of Staff
Wirebot implementation family; customer name may vary
        ↓
Focusa
Project · Workstream · Foreman · Workpoint · authority · Evidence
        ↓
Focusa Workforce
Direction · People · Needs You · Work · Evidence · topology
        ↓
UIAI / Veragensia / Pi / agents / Agent Computers
```

Wirebot App owns the owner relationship and Workforce Composer. Focusa Workforce operates already-governed workforce activity. UIAI owns computer/browser execution. Veragensia owns bodies/runtime/enforcement. W.I.N.S. owns accepted outcomes.

## Build agent: start here

Read:

```text
AGENTS.md
docs/15-build-agent-master-handoff.md
docs/14-workforce-full-trajectory.md
current source/tests
```

Then load only the detail required by the active trajectory node:

```text
accepted scope          → docs/10
navigation/stateflow    → docs/11
screen/component shape  → docs/12
visual system           → docs/13
Slice 1 specifics       → docs/09
runtime/data semantics  → docs/05
product/UX context      → docs/00, docs/06, docs/08
baseline/deployment     → docs/07
```

Do not preload the whole corpus as process ceremony.

## Full Trajectory

```text
HLT-WF-001
│
├─ MLG-0  Foundation/contracts
├─ MLG-1  Workstream + Foreman + Direction
├─ MLG-2  Working Now / People
├─ MLG-3  Needs You
├─ MLG-4  Trajectory / progression
├─ MLG-5  Evidence / closure
├─ MLG-6  UIAI execution / takeover
├─ MLG-7  Fleet / topology / capacity
├─ MLG-8  Complete surfaces / accessibility
├─ MLG-9  Voice / Radar / contextual expansion
└─ MLG-10 Production acceptance
```

Current Short frontier:

```text
MLG-0 → STG-0.1 → WP-0.1.1
```

Resolve the real current Focusa operations required by the first slice, then advance through ready work.

## UX build authorities

```text
Strategy  → docs/00 + docs/08 + docs/10
Scope     → docs/10
Structure → docs/11
Skeleton  → docs/12
Surface   → docs/13
```

Implement these; do not redesign them casually during construction.

## Outcomes over process

Apply Algorithm² to the product **and** the build machinery:

```text
Question
→ Delete
→ Simplify
→ Accelerate
→ Automate last
```

Build real functionality first. Use minimum sufficient verification. Reuse valid evidence. Continue independent ready work when one node is blocked. Do not turn requirements, trajectory, testing, or documentation into a second project.

## Technology

```text
Svelte 5
minimal Vite/MV3 bundling
JavaScript + JSDoc
```

No SvelteKit.

Preserve sound existing core logic for pairing, API contracts, orchestration, sessions, SSE/reconnect, projections, storage, and validation unless a concrete defect requires change.

## Deployment

```text
main + CI
→ meaningful Chromebook/browser dogfood
→ explicit wfx veragensia
→ atomic Veragensia promotion
→ https://os.focusa.dev
```

Stable extension ID:

```text
ohfbbkpacpcapicpgplnnmifmlnmjggj
```

Pre-redesign baseline:

```text
baseline/pre-redesign-2026-09-15
```

Wirebot App documentation is read-only from this workstream.