# Focusa Workforce — Master Build-Agent Handoff

**Status:** EXECUTION READY  
**Mission:** implement the complete Workforce redesign without making foundational product/UX/architecture decisions during construction.  
**Do not modify:** Wirebot App documentation from this workstream.

---

## 1. Run law

> **Build the actual product. The blueprint removes ambiguity; it must not become a second workload.**

Apply Algorithm² to both the product and the build process:

```text
Question requirements
→ Delete unnecessary parts/process
→ Simplify around existing owners/primitives
→ Accelerate real implementation and feedback
→ Automate only proven repetition
```

Default loop:

```text
read current frontier
→ inspect current source/owning contract
→ implement smallest material advance
→ verify the material acceptance/risk
→ reconcile only if reality changed
→ continue immediately
```

No routine permission pauses. No per-Workpoint essays. No proof packets. No cosmetic tracking work.

---

## 2. Minimum read path

Start with only:

```text
Workforce/AGENTS.md
docs/14-workforce-full-trajectory.md
current Workforce source/tests
current Focusa owning operations/contracts needed by the active Workpoint
```

Pull detail on demand:

```text
accepted scope          → docs/10
navigation/stateflow    → docs/11
screen/component shape  → docs/12
visual system           → docs/13
Slice 1 specifics       → docs/09
runtime/data semantics  → docs/05
product context         → docs/00, docs/06, docs/08
baseline/deployment     → docs/07
```

Consult ADLBOS/UIAI/Veragensia only when the active boundary crosses them.

Do not preload the entire corpus as ceremony.

---

## 3. Current Short frontier

Start here:

```text
HLT-WF-001
→ MLG-0
→ STG-0.1
→ WP-0.1.1
```

Resolve current Focusa source truth for:

```text
Workstream listing/resolution
Foreman binding/status/hydration
Direction/steer/proposal
Trajectory projection
attention/approval
Evidence/settlement
UIAI execution refs
presence/fleet
```

Decision rule:

```text
real operation exists
→ consume it

equivalent real operation exists
→ thinnest provenance-preserving adapter

owning operation genuinely missing
→ implement smallest owning Focusa operation
→ verify that boundary
→ return to Workforce
```

Do not invent `/v1/foreman/*` or any other convenient client contract because a design document suggests a name.

---

## 4. Full trajectory

`docs/14-workforce-full-trajectory.md` is the coverage map:

```text
MLG-0  Foundation/contracts
MLG-1  Workstream + Foreman + Direction
MLG-2  Working Now / People
MLG-3  Needs You
MLG-4  Trajectory / progression
MLG-5  Evidence / closure
MLG-6  UIAI / browser context
MLG-7  Fleet / topology / capacity
MLG-8  Complete surfaces / accessibility
MLG-9  Voice / Radar / contextual expansion
MLG-10 Production acceptance
```

It is not a command to serialize all work. Advance independent ready nodes in parallel when dependencies are genuinely satisfied.

A blocked node blocks only its dependents.

Do not spend time continuously rewriting trajectory prose. Update it only when accepted scope/dependency truth materially changes.

---

## 5. Five UX planes are build constraints

```text
Strategy  → docs/00 + docs/08 + docs/10
Scope     → docs/10
Structure → docs/11
Skeleton  → docs/12
Surface   → docs/13
```

Do not redesign them during implementation.

If source reality makes one decision impossible, change only the affected plane/node deliberately; do not create a third interpretation in code.

---

## 6. Implementation defaults

Use:

```text
Svelte 5
minimal Vite/MV3 bundling
JavaScript + JSDoc
```

No SvelteKit.

Preserve proven current core logic unless a concrete defect requires change:

```text
src/lib/api-client.mjs
src/lib/contracts.mjs
src/lib/orchestration.mjs
src/lib/orientation.mjs
src/lib/pairing.mjs
src/lib/projections.mjs
src/lib/reconnect.mjs
src/lib/session-create.mjs
src/lib/sse-parser.mjs
src/lib/storage.mjs
src/lib/validation.mjs
```

Add `workforce.html` and use the route/screen contracts from docs 11/12.

Implement doc 13's visual system rather than choosing a new theme/component-kit aesthetic.

---

## 7. Product ownership hard lines

```text
Wirebot / named Operating Partner
  owner relationship + Workforce Composer

Focusa
  Workstream / Foreman / Workpoint / authority / Evidence / settlement

Focusa Workforce
  live workforce-operations UX

UIAI
  computer/browser execution + takeover

Veragensia
  body/runtime/placement/enforcement

W.I.N.S.
  accepted outcomes
```

Never create duplicate canonical state merely to make the extension easier to build.

Wirebot App docs are read-only from this workstream.

---

## 8. Requirements without bureaucracy

`docs/10` is accepted scope, not a ticket queue.

Use requirement IDs when they help preserve scope, debug, or hand off meaningful work.

Do not:

```text
annotate every edit with IDs
maintain a separate proof ledger
create one test per requirement
pause implementation to keep matrices pretty
repeat evidence already established
```

At meaningful integration/release boundaries, confirm accepted scope has not been silently dropped.

---

## 9. Truth laws

Keep distinct:

```text
Full / Medium / Short trajectory coverage
Human / Operations / Technical presentation depth
lifecycle stage
freshness
authority
```

Never infer whole-project completion from a finished Workpoint/branch.

Never equate:

```text
agent claim = verified
command success = accepted product outcome
screenshot = settlement
cached capability = current authority
presenter acknowledgement = source resolution
```

Needs You contains only human-value attention.

Fleet is intra-Operator aggregation. Federation is cross-Operator/network sharing.

Reusable secrets never enter URL/Direction/attention cache/Evidence/log/receipt/repository content.

---

## 10. Minimum sufficient verification

Ask one question:

> **What is the smallest existing or new check that could expose a material defect in the behavior I changed?**

Choose only what applies:

```text
focused unit/contract test
build/manifest validation
real browser journey
relevant stale/degraded case
relevant authority/source negative case
owning-system receipt/source revision
```

Reuse still-valid evidence.

One representative connected browser journey can cover many UI requirements.

Run broader regression/dogfood at meaningful integration/release boundaries, not reflexively after every edit.

---

## 11. Failure and ambiguity

When a mutation outcome is ambiguous, reconcile before retry.

When source state is stale, render it honestly and revalidate before consequential action.

When one tool/route fails, use another valid route and keep moving.

When one trajectory node is blocked, advance ready independent work.

Only stop for owner input when there is a genuine scoped decision/authority boundary that cannot be resolved from current contracts/direction.

---

## 12. Promotion

```text
source changes
→ sufficient changed-scope verification
→ main/CI
→ Chromebook/browser dogfood at meaningful boundary
→ explicit wfx veragensia
→ atomic promotion
→ verify changed live journey
```

Do not make every main push a live deployment.

Preserve stable extension ID unless deliberately migrated.

---

## 13. Cleanup and reporting

Clean temporary artifacts you create as you go. Do not create a separate cleanup project for trivial debris.

At a meaningful milestone or genuine blocker report only:

```text
what now works
what materially remains
real blocker, if any
current Short frontier
promotion status, if relevant
```

Requirement IDs/tests/source refs are included only when they help the next action.

---

## 14. Final directive

> **Run the trajectory to completion. Build first. Verify material risk, not paperwork. Reuse proof. Remove unnecessary machinery. Continue through ready authorized work until the HLT is accepted or a genuine scoped blocker requires owner input.**