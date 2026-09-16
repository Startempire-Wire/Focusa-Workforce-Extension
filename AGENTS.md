# AGENTS — Focusa Workforce Build Contract

**Execution authority:** `docs/15-build-agent-master-handoff.md`  
**Trajectory:** `docs/14-workforce-full-trajectory.md`  
**Architecting standard applied:** Focusa Spec 120A + software-engineering profile `120A-SWE`

> **Build Focusa Workforce to completion. Do not turn the build process into the work.**

## Operating law

```text
Question
→ Delete
→ Simplify
→ Accelerate
→ Automate last
```

Apply it twice: to the product and to the machinery used to build it.

Then apply **Leverage²**:

```text
when a fix/optimization proves itself
→ move it into the lowest correct shared primitive
→ let later slices inherit it
→ delete duplicated local work
```

Do not generalize speculation. Compound only improvements proven in running reality.

The objective is working software that satisfies the accepted product outcome. Planning, requirements, trajectory, tests, evidence and documentation exist only to prevent wrong work or false completion.

## Start

Read:

```text
docs/15-build-agent-master-handoff.md
docs/14-workforce-full-trajectory.md
current source/tests
current owning Focusa contracts needed by the active frontier
```

Load detail only when needed:

```text
scope                 → docs/10
navigation/stateflow  → docs/11
screen anatomy        → docs/12
visual system         → docs/13
Slice 1 detail        → docs/09
runtime/data          → docs/05
product context       → docs/00, docs/06, docs/08
baseline/deployment   → docs/07
```

Spec 120A/120A-SWE are provenance for how this package was architected, not required preload for ordinary implementation. Consult them only if the architecture package itself must be refined.

Do not preload the whole corpus as ritual. Wirebot App is read-only from this workstream; do not rewrite its docs.

## Product decisions are resolved; implementation decisions are delegated

Do **not** improvise:

```text
product purpose or accepted scope
canonical ownership or authority
Workstream / Foreman semantics
Trajectory semantics
Needs You source semantics
Evidence / settlement meaning
top-level information architecture
core visual language
security/privacy boundaries
```

Within those boundaries, **use engineering judgment freely**. Do not ask permission for ordinary reversible implementation choices.

Choose the simplest sound option for:

```text
file/component boundaries
internal function names
state/store organization
adapter shape
small refactors
CSS/layout mechanics within the visual contract
focused test structure
implementation order among ready nodes
batching adjacent Workpoints
performance fixes
bug fixes
```

When detail is unspecified:

```text
infer from the nearest canonical contract/current code
→ choose the simplest reversible implementation
→ build it
→ verify it in running reality
→ continue
```

Ask the owner only when the unresolved choice would materially change accepted product behavior, scope, authority, privacy/security, meaningful spend, irreversible external effects, or a major ecosystem boundary.

Minor ambiguity is not a blocker.

## Outcomes over process

Default loop:

```text
understand enough to act
→ implement the largest safe useful increment
→ verify the material behavior/risk
→ fix what failed
→ continue
```

Rules:

- implementation outranks planning, reporting and proof collection;
- prefer complete end-to-end behavior over horizontal scaffolding;
- batch adjacent work when context is hot;
- reorder independent ready work when it accelerates the outcome;
- continue around local blockers;
- reuse existing evidence and tests;
- one real check may satisfy many requirements;
- do not rerun unchanged expensive checks without cause;
- do not stop for routine status updates;
- update docs only when product/architecture/source truth materially changed;
- clean temporary artifacts you create as you go.

Requirement IDs are coverage aids, not tickets.

## Current frontier

Begin from the current Short projection in `docs/14`:

```text
HLT-WF-001
→ MLG-0
→ STG-0.1
→ WP-0.1.1
```

Resolve real Focusa operations required by the active product path:

```text
real owning operation exists
→ use it

equivalent owning operation exists
→ thin provenance-preserving adapter

owning operation is genuinely missing
→ implement the smallest correct operation in the owning product
→ return immediately to Workforce
```

Known upstream blockers in the trajectory are **implementation/contract-closure work, not permission to reopen settled product semantics**. Use the semantic contracts already pinned in Workforce docs and the owning Focusa/ADLBOS/UIAI/Veragensia specs. Escalate only if those owners are genuinely contradictory or insufficient to determine product behavior.

Do not invent client-owned canonical state or fake convenient endpoints.

A missing upstream operation blocks only the work that actually depends on it.

## Ownership

```text
Owner / delegated human
  root or bounded human authority

Wirebot / customer-named Operating Partner
  owner relationship, life/business orientation,
  Workforce Composer, owner-wide attention

Focusa
  Project / Workstream / Foreman / Workpoint,
  governed work, continuity, Evidence, settlement

Focusa Workforce
  live workforce operations UX

UIAI
  browser/computer execution and takeover

Veragensia
  body/runtime/placement/enforcement

W.I.N.S.
  accepted outcomes
```

Never duplicate canonical ownership merely to simplify UI code.

## Technology

Use:

```text
Svelte 5
minimal Vite/MV3 bundling
JavaScript + JSDoc
```

No SvelteKit.

Preserve sound existing core primitives where they remain correct:

```text
api-client
contracts
orchestration
orientation
pairing
projections
reconnect
session-create
sse-parser
storage
validation
```

Refactor them when necessary to accomplish the product; do not preserve accidental structure for ceremony.

MV3 suspension is normal. Canonical work cannot depend on the extension worker remaining alive.

## UX construction authority

```text
Strategy  → docs/00 + docs/08 + docs/10
Scope     → docs/10
Structure → docs/11
Skeleton  → docs/12
Surface   → docs/13
```

These resolve product design so the build agent can execute. They are not pixel-law where a simpler implementation preserves the same intended hierarchy, behavior and visual system.

## Truth boundaries

Keep distinct:

```text
Full / Medium / Short trajectory coverage
Human / Operations / Technical presentation depth
lifecycle stage
authority
freshness
```

Never equate:

```text
agent claim = verified result
successful command = accepted product outcome
one branch complete = HLT complete
cached capability = current authority
presenter acknowledgement = source resolution
```

Needs You is human-value attention, not activity noise.
UIAI remains execution/takeover authority.
Fleet is one Operator's infrastructure; federation is cross-Operator sharing.
Reusable secrets never belong in URLs, Direction, attention cache, Evidence, logs, receipts or repository files.

## Minimum sufficient verification

Verify what you changed, at the cheapest boundary that can expose a material defect.

Examples:

```text
focused test
build/manifest validation
real browser journey
relevant stale/degraded case
relevant authority/source negative case
```

Use only what is relevant. Prefer evidence naturally produced by execution. Run broad regression/dogfood at meaningful integration or release boundaries, not after every edit.

If a failure is obvious in running reality, fix it instead of creating a report about it.

## Deployment

```text
main + CI
→ Chromebook/browser dogfood at meaningful boundary
→ explicit wfx veragensia
→ atomic promotion
→ verify changed live journey
```

Preserve extension ID `ohfbbkpacpcapicpgplnnmifmlnmjggj` unless deliberately migrated.

## Completion behavior

Keep executing through ready authorized work until:

```text
the accepted HLT is achieved
or
a genuine decision requiring owner authority is reached
```

Do not stop because a Workpoint ended, an MLG ended, a commit landed, a test passed, or a report could be written.

At a meaningful milestone or real blocker, report tersely:

```text
what works
what materially remains
real blocker, if any
current frontier
promotion status, if relevant
```

**The deliverable is the functioning product, not the trajectory, the test suite, the documentation, or the process trail.**