# AGENTS — Focusa Workforce Build Contract

**Product:** Focusa Workforce  
**Execution authority:** `docs/15-build-agent-master-handoff.md`  
**Full Trajectory:** `docs/14-workforce-full-trajectory.md`

> **Focusa Workforce operates the workforce.**

## Mission

Build the real product continuously. Process exists only to preserve scope, ownership, truth, and material safety boundaries.

```text
Question
→ Delete
→ Simplify
→ Accelerate
→ Automate last
```

Apply that sequence to both:

```text
the product work
and
the machinery/process used to build it
```

Do not optimize documentation while the product is unfinished.

---

## Start here

Read first:

```text
docs/15-build-agent-master-handoff.md
docs/14-workforce-full-trajectory.md
current source/tests
current Focusa owning contracts for the active Workpoint
```

Then consult only what the active node needs:

```text
scope/requirements     → docs/10
navigation/stateflow   → docs/11
screen anatomy         → docs/12
visual implementation  → docs/13
Slice 1 deep detail    → docs/09
runtime/data contracts → docs/05
product/UX context     → docs/00, docs/06, docs/08
baseline/deployment    → docs/07
```

ADLBOS/Focusa/UIAI/Veragensia docs are loaded when an active boundary depends on them. Do not preload the whole corpus as ritual.

Wirebot App is read-only from this workstream. Do not rewrite its docs.

---

## Outcomes over process

```text
understand enough to act
→ implement real functionality
→ verify the material behavior/risk
→ reconcile if needed
→ continue
```

Rules:

- implementation outranks planning/reporting/proof collection;
- reuse existing evidence instead of recreating it;
- one check may satisfy many requirements;
- do not rerun unchanged expensive checks without cause;
- do not stop ready work for status updates or documentation polish;
- continue independent ready work when one node is blocked;
- update docs only when architecture/source truth materially changes;
- clean artifacts you create as you go.

Requirement IDs are coverage aids, not ticket bureaucracy.

---

## Current frontier

Start at the Short projection in `docs/14`:

```text
HLT-WF-001
→ MLG-0
→ STG-0.1
→ WP-0.1.1
```

Resolve current Focusa operation truth.

```text
real owner operation exists
→ use it

equivalent real operation exists
→ thin provenance-preserving adapter

owning operation missing
→ implement the smallest owning operation
→ verify that boundary
→ return to Workforce
```

Never invent convenient endpoints or client-owned canonical state.

---

## Product ownership

```text
Owner / delegated human
  root or bounded human authority

Wirebot / customer-named Operating Partner
  owner relationship, life/business orientation,
  Workforce Composer, owner-wide attention

Focusa
  Project / Workstream / Foreman / Workpoint,
  work authority, continuity, Evidence, settlement

Focusa Workforce
  live workforce operations UX

UIAI
  browser/computer execution and takeover

Veragensia
  body/runtime/placement/enforcement

W.I.N.S.
  accepted outcomes
```

Never duplicate canonical ownership to make UI implementation easier.

Keep distinct:

```text
owner
bounded delegated human
Operating Partner
Foreman
worker
runtime/body
optional architecture authority
```

---

## Technology

Use:

```text
Svelte 5
minimal Vite/MV3 bundling
JavaScript + JSDoc
```

No SvelteKit.

Preserve sound existing core modules unless focused evidence requires a change:

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

MV3 service-worker suspension is normal. Canonical work must not depend on keeping it alive.

---

## UX authority

```text
Strategy  → docs/00 + docs/08 + docs/10
Scope     → docs/10
Structure → docs/11
Skeleton  → docs/12
Surface   → docs/13
```

These are implementation targets, not invitations to redesign during construction.

If runtime reality makes a target invalid, refine only the affected owner/node and continue other ready work.

---

## Core truth laws

Do not collapse:

```text
Full / Medium / Short trajectory coverage
Human / Operations / Technical presentation depth
lifecycle stage
authority
freshness
```

Do not equate:

```text
agent claim = verified result
successful command = accepted product outcome
one branch complete = HLT complete
cached capability = current authority
presenter acknowledgement = source resolution
```

Needs You contains only human-value attention.

UIAI remains execution/takeover authority.

Fleet is one Operator's multi-environment/body aggregation. Federation is cross-Operator/network sharing.

Reusable secrets never belong in URLs, Direction, attention cache, Evidence, logs, receipts, or repository files.

---

## Minimum sufficient verification

Ask:

> What is the smallest existing or new check that would expose a material defect in what I changed?

Possible checks:

```text
focused unit/contract test
build/manifest validation
real browser journey
relevant stale/degraded case
relevant authority/source negative case
```

Use only the relevant subset.

Run broader regression/dogfood at meaningful integration/release boundaries, not after every small edit.

---

## Deployment

```text
main + CI
→ Chromebook/browser dogfood at meaningful boundary
→ explicit wfx veragensia
→ atomic promotion
→ verify changed live journey
```

Preserve extension ID `ohfbbkpacpcapicpgplnnmifmlnmjggj` unless deliberately migrated.

---

## Completion

Keep executing through ready authorized work until:

```text
HLT accepted
or
a genuine scoped blocker requires owner input
```

At meaningful milestones report only what works, what materially remains, the real blocker if any, current frontier, and promotion status if relevant.

The deliverable is a working Focusa Workforce, not an immaculate process trail.