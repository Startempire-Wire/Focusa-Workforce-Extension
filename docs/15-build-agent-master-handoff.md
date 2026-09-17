# Focusa Workforce — Master Build-Agent Handoff

**Status:** EXECUTION READY  
**Mission:** run the Workforce redesign to the accepted outcome without reopening settled product design.  
**Architecting standard applied:** Focusa Spec 120A + `120A-SWE` software-engineering vertical profile.  
**Do not modify:** Wirebot App documentation from this workstream.

## 1. Prime directive

> **Build the product. The blueprint exists to remove ambiguity, not to create a second workload.**

Apply Algorithm² continuously:

```text
Question
→ Delete
→ Simplify
→ Accelerate
→ Automate last
```

Apply it to both the product and the build machinery.

Then compound with **Leverage²**:

```text
prove a useful fix once
→ push it into the lowest correct shared primitive
→ let later work inherit it
→ remove duplicated local fixes
```

Do not abstract speculative behavior. Systemize only what running reality proves useful.

Default loop:

```text
current frontier
→ inspect real source
→ implement the largest safe useful increment
→ verify the material behavior
→ fix/reconcile what changed
→ continue
```

No routine permission pauses. No proof packets. No per-Workpoint reports. No cosmetic matrix maintenance. No architecture ceremony after the implementation path is clear.

## 2. Minimum read path

Start with:

```text
Workforce/AGENTS.md
docs/14-workforce-full-trajectory.md
current Workforce source/tests
current owning Focusa contract/source for the active frontier
```

When touching **any visible extension face**, also load:

```text
docs/16-extension-all-faces-experience-completion-contract.md
```

It is the cross-face completion authority for the toolbar/action entry, Side Panel, private/public Start Page, Full Workforce routes, pairing/connections, Wall, page-context flow, keyboard entry, deep-link/handoff ingress and all degraded/recovery states. No visible face is implementation glue.

Pull other detail only when the current work needs it:

```text
accepted scope          → docs/10
navigation/stateflow    → docs/11
screen/component shape  → docs/12
visual system           → docs/13
all visible faces       → docs/16
Slice 1 detail          → docs/09
runtime/data semantics  → docs/05
product context         → docs/00, docs/06, docs/08
baseline/deployment     → docs/07
```

Consult ADLBOS/UIAI/Veragensia only when crossing those boundaries.

Spec 120A/120A-SWE explain how this architecture package was produced. They are not required preload for ordinary build execution; consult them only if a genuine architecture ambiguity or refinement arises.

## 3. Autonomy boundary

The product architecture is resolved. Do not redesign:

```text
product purpose / accepted scope
canonical ownership / authority
Workstream / Foreman semantics
Trajectory semantics
Needs You semantics
Evidence / settlement meaning
top-level information architecture
face-specific purpose and hierarchy
core visual language
security/privacy boundaries
```

Everything below that boundary is normal engineering discretion.

Without asking permission, choose and change the simplest reversible implementation for:

```text
files/components/internal APIs
state/store organization
adapters
small refactors
CSS/layout mechanics
performance work
test implementation
bug fixes
implementation order among ready nodes
batching adjacent Workpoints
```

When the blueprint does not specify a low-level detail:

```text
use nearest canonical source/current conventions
→ choose simplest reversible option
→ implement
→ verify in reality
→ keep moving
```

Owner input is required only if the unresolved decision materially changes accepted scope/product behavior, owner authority, privacy/security, meaningful spend, irreversible external effects, or a major ecosystem boundary.

## 4. Current frontier

Start from the Short projection in `docs/14`:

```text
HLT-WF-001
→ MLG-0
→ STG-0.1
→ WP-0.1.1
```

Resolve the real Focusa operations needed by the first live product path.

For each semantic:

```text
owning operation exists
→ use it

equivalent owning operation exists
→ thin adapter preserving source identity

operation genuinely missing
→ implement the smallest correct operation in Focusa
→ return to Workforce
```

The known upstream blockers in `docs/14` are **implementation/contract-closure work**. They do not reopen settled Workforce product semantics. The required consumer behavior is already pinned by the Workforce package and owning Focusa/ADLBOS/UIAI/Veragensia contracts. If an owning contract is genuinely contradictory or semantically insufficient, stop only that affected node, surface the exact owner-level ambiguity, and continue independent ready work.

Never fabricate a client-side canonical Foreman, Trajectory, approval, Evidence state, or convenient endpoint.

A missing upstream operation blocks only its dependents. Continue other ready work.

## 5. Build for connected outcomes, not ticket completion

`docs/14` is a coverage/dependency map. Workpoints are navigation aids, not mandatory serial tickets.

The agent may:

```text
batch adjacent Workpoints
complete several STGs in one implementation pass
parallelize independent work
reorder ready work when it shortens feedback
refactor opportunistically when it reduces total complexity
reuse one implementation/test across multiple requirements
```

Do not stop at artificial document boundaries when the next connected work is clear.

## 6. Technology and preservation

Use:

```text
Svelte 5
minimal Vite/MV3 bundling
JavaScript + JSDoc
```

No SvelteKit.

Preserve proven current core behavior where correct: pairing, API client, contracts, orchestration, orientation, projections, reconnect, session creation, SSE, storage and validation.

Preservation is about behavior, not file shape. Refactor structure when it makes the implementation simpler without changing ownership/semantics.

Canonical work must survive MV3 service-worker suspension.

## 7. UX implementation

The five planes are settled inputs:

```text
Strategy   → docs/00 + docs/08 + docs/10
Scope      → docs/10
Structure  → docs/11
Skeleton   → docs/12
Surface    → docs/13
All faces  → docs/16
```

Implement their intent. Do not reopen design exploration during construction.

`docs/16` closes the previous cross-surface gap: **every user-visible face and entry path is part of the designed product**, including Chrome toolbar action behavior, Side Panel, private Start Page, public Start Page, Full Workforce route faces, pairing/connections, Wall, active-tab/page-context flow, keyboard commands, deep-link/handoff ingress and recovery/degraded states.

Do not treat a face as complete merely because it renders. Its purpose, content/action hierarchy, states, return behavior, responsiveness and visual semantics must match the resolved contract.

Do not mistake exact example layouts for mandatory accidental pixels: preserve hierarchy, behavior, responsive intent and visual language while using sound implementation judgment.

## 8. Truth and safety

Do not collapse:

```text
entitled / authorized / available / consented
claim / observed / verified / settled
presenter acknowledgement / source resolution
Full / Medium / Short trajectory
Human / Operations / Technical detail
fleet / sovereign federation
```

Consequential mutations require current source scope/authority. Ambiguous writes reconcile before retry. Reusable secrets do not move through UI handoffs, Direction, attention, caches, Evidence or logs.

These boundaries are mandatory because they prevent wrong effects, not because they create process.

## 9. Verification

Use **minimum sufficient verification**.

Ask:

> What is the cheapest check that could reveal a material defect in what just changed?

Use the relevant subset only:

```text
focused test
build/manifest check
real browser journey
relevant degraded/reconnect case
relevant authority/source negative case
```

Reuse valid evidence. Do not duplicate proof formats. Do not rerun expensive unchanged checks without a reason.

Run broad integration/regression at meaningful integration/release boundaries.

## 10. Promotion

Normal release boundary remains:

```text
working source
→ sufficient changed-scope verification
→ main/CI
→ Chromebook/browser dogfood
→ explicit wfx veragensia
→ atomic promotion
→ verify changed live journey
```

Do not automatically promote every main push.

## 11. Stop conditions

Keep moving until the HLT is achieved.

Stop only when continuing would require:

```text
owner-only product/scope decision
missing authority/grant
material irreversible or high-consequence choice not already authorized
canonical upstream decision that cannot be safely inferred or implemented
explicit owner pause/stop
```

A failed tool, missing preferred route, ended Workpoint, finished MLG, passing test, landed commit, or documentation gap is **not** by itself a stop condition.

## 12. Reporting

Reporting never interrupts ready work.

At meaningful milestones or genuine blockers, report only:

```text
what now works
what materially remains
real blocker, if any
current frontier
live promotion status, if relevant
```

Requirement IDs/source refs/test names are included only when they materially help continuation or explain risk.

## Final directive

> **Use the blueprint as rails, not shackles. Make the product real. Exercise engineering judgment aggressively inside resolved product boundaries. Every face of the extension is part of the product. Delete ceremony, preserve truth, compound proven leverage, keep advancing, and do not stop until the accepted outcome is actually achieved or a genuine owner decision is required.**