# Focusa Workforce — Master Build-Agent Handoff

**Status:** EXECUTION READY  
**Mission:** implement the complete Workforce redesign without making foundational product/UX/architecture decisions during construction.  
**Do not modify:** Wirebot App documentation from this workstream.

---

## 1. Read exactly in this order

### Ecosystem law

```text
ADLBOS/OWNER_AUTHORITY_CONSTITUTION.md
ADLBOS/CURRENT_ECOSYSTEM_ARCHITECTURE.md
ADLBOS/CROSS_PRODUCT_SEAM_CONTRACT.md
ADLBOS/AGENTS.md
```

### Workforce product package

```text
Workforce/AGENTS.md
00-workforce-canonical-product-and-implementation-spec.md
05-extension-runtime-data-and-integration-contracts.md
06-workforce-ux-and-interaction-spec.md
08-workforce-redesign-blueprint.md
10-workforce-product-requirements-and-proof-matrix.md
11-workforce-experience-architecture-and-stateflow.md
12-workforce-screen-and-component-contract.md
13-workforce-visual-system-and-reference-surfaces.md
14-workforce-full-trajectory.md
09-slice-1-workstream-foreman-direction-implementation.md
```

### Current reality

```text
current Workforce source/tests
current Focusa generated operations/routes/contracts
current UIAI/Veragensia owning contracts only when their trajectory node is reached
```

Older/historical docs are reference/provenance only where they conflict with this package.

---

## 2. Primary execution law: accomplish the work

> **The blueprint exists to remove ambiguity and accelerate implementation. It must never become a reason to spend more time proving, reporting or planning than building the actual product.**

Operate with minimum sufficient ceremony:

```text
understand enough to act
→ build real functionality
→ verify the material acceptance condition
→ reuse valid evidence
→ continue immediately into the next ready authorized work
```

Do not create separate proof artifacts, reports, screenshots, matrices, checklists or tests unless they establish something materially necessary that existing evidence does not already establish.

One real browser acceptance may satisfy several requirements. One existing contract test may cover several Workpoints. A valid existing receipt or source revision should be reused rather than re-proven.

Do not rerun unchanged expensive checks merely because another Workpoint finished.

Do not stop after each node to request permission, summarize progress, polish documentation or update tracking when the next node is already authorized and ready.

If one node is blocked, continue independent ready work.

---

## 3. Non-negotiable implementation rule

> **Do not improvise product requirements, navigation, screen hierarchy, visual language, state semantics, authority boundaries or source ownership.**

If implementation reality conflicts with the blueprint:

```text
inspect owning source/contract
→ determine whether blueprint or runtime is stale
→ stop only the affected node
→ correct the owning architecture only if necessary
→ continue unaffected ready work
```

Do not silently invent a third interpretation in code.

Documentation changes are required only when actual architecture/source truth changes or the current blueprint would otherwise misdirect future implementation.

---

## 4. Source of truth hierarchy

```text
owner authority / ADLBOS law
      ↓
Focusa owning contracts for work/Foreman/Trajectory/Evidence
      ↓
UIAI owning contracts for computer execution
      ↓
Veragensia owning contracts for body/runtime
      ↓
Workforce requirements + experience contracts
      ↓
Workforce source
```

Running operational truth may expose a documentation defect; it does not authorize a client to create a parallel authority.

---

## 5. Current starting point

The first executable Workpoint from the Full Trajectory is:

```text
HLT-WF-001
→ MLG-0
→ STG-0.1
→ WP-0.1.1
```

### WP-0.1.1
Inspect current Focusa generated/current operations for:

```text
Workstream listing/resolution
Foreman binding/status/hydration
Direction/steer/proposal
Trajectory Full/Medium/Short projection
attention/approval
Evidence/settlement
UIAI execution refs
presence/fleet
```

For each required semantic:

```text
A. real operation exists
   → consume generated/current contract

B. equivalent real operation exists
   → create the thinnest provenance-preserving Workforce adapter

C. operation genuinely missing
   → implement the smallest owning Focusa operation first
   → verify it at its owning boundary
   → return to Workforce
```

Do not create `/v1/foreman/*` or any other endpoint because the docs suggest a convenient name.

---

## 6. Development order

Follow `14-workforce-full-trajectory.md`.

Primary sequence:

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

Parallelize ready independent work where dependency truth allows it.

The sequence is a coverage map, not a requirement to finish every MLG serially when safe work can advance in parallel.

---

## 7. Requirements are guardrails, not bureaucracy

`docs/10-workforce-product-requirements-and-proof-matrix.md` prevents scope loss and false completion.

Use requirement IDs when they help preserve coverage, resolve ambiguity, debug a failure or hand off substantive work.

Do **not**:

```text
annotate every code edit with requirement IDs
create a separate proof packet for every Workpoint
pause implementation to keep a matrix cosmetically current
repeat proof already supplied by a valid source/test/receipt
```

Before treating a substantive outcome as complete, be satisfied that:

```text
the intended behavior works
the owning source/authority remains correct
a material failure path is not being ignored
no required accepted scope is being silently dropped
```

Then advance.

---

## 8. Garrett five-plane package is closed

Use these docs as implementation authorities:

```text
STRATEGY
  docs/00 + docs/08 + docs/10

SCOPE
  docs/10

STRUCTURE
  docs/11

SKELETON
  docs/12

SURFACE
  docs/13
```

The build agent does not redesign these planes while implementing.

If a real source constraint makes a requirement impossible, refine only the affected plane/node and continue ready work.

---

## 9. UI technology

Use:

```text
Svelte 5
Vite or equivalent minimal bundling compatible with current build
JavaScript + JSDoc
MV3
```

Do not introduce SvelteKit.

Preserve/reuse the existing core modules unless real defects require focused changes:

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

Svelte components must not become business-authority owners.

---

## 10. Required full-page entry

Add:

```text
workforce.html
```

Use the hash-route contract from doc 11.

Current required routes:

```text
#/overview
#/work
#/work/detail
#/people
#/people/detail
#/evidence
#/evidence/detail
#/topology
#/audit
#/settings
```

Do not invent additional top-level destinations without a real product requirement.

---

## 11. Visual implementation

Implement doc 13 as the starting design system:

```text
light-first
specified tokens
specified typography scale
specified spacing/radii
Lucide visual language if icon package is introduced
semantic freshness/work/proof colors
reference Side Panel
reference Full Workforce
```

Do not choose a new theme, gradient system, component-kit look or alternate dashboard style during build.

Component libraries may be used only if their rendered result conforms to doc 13 rather than accepting default aesthetics.

---

## 12. Human attention law

`Needs You` is not a notification feed.

Only source-backed human-value attention enters it.

```text
presenter seen/snooze/hide
!=
source approve/deny/resolve/cancel/expire
```

Refresh the source immediately before consequential action.

---

## 13. Trajectory law

Do not confuse:

```text
Full / Medium / Short
```

with:

```text
Human / Operations / Technical
```

or with lifecycle stages.

Full/Medium/Short are coverage projections of one source-owned Trajectory.
Human/Operations/Technical are presentation depth.
Lifecycle is separate source-owned process state.

Never infer whole-project completion from current Workpoint/branch completion.

Trajectory bookkeeping must remain proportional. The agent should not spend time continuously rewriting Trajectory prose when source reality has not materially changed.

---

## 14. Truth and evidence law

Never equate:

```text
agent says done
= verified

test command exited 0
= accepted product outcome

screenshot
= settlement

deployed one branch
= HLT complete
```

But also never mistake **more proof** for **more progress**.

Use the smallest existing or new evidence that demonstrates the applicable acceptance condition. Prefer evidence naturally produced by doing the work:

```text
source diff/revision
focused test result
build result
browser behavior
owning-system receipt
real source state
```

Do not manufacture secondary proof-management artifacts around those results.

---

## 15. Failure/recovery law

Required behavior includes:

```text
stale source
lost response
service-worker suspension
connection loss
revoked auth
unsupported schema
ambiguous scope
multi-environment ID collision
UIAI unavailable
source correction/revocation
```

Test these when the implementation touches the relevant boundary or when failure risk is material. Do not run the entire failure matrix for unrelated presentation edits.

On ambiguous consequential writes, reconcile before retry.

Cached state may inform display; stale cached authority never authorizes mutation.

---

## 16. Security and credential law

Use opaque credential-use refs only when needed.

Never place reusable secrets in:

```text
URLs
Direction text
attention objects
local projection caches
Evidence
receipts/logs
repository files
```

Possession of a ref is not authority.

---

## 17. Minimum sufficient verification

Verification is not a checklist quota.

Ask:

> **What is the smallest check or existing evidence that would falsify a material defect in the behavior I just changed?**

Possible checks:

```text
focused unit/contract test
build or manifest validation
real browser acceptance
stale/degraded case
negative authority/source case
```

Use only the relevant subset.

Reuse still-valid evidence. Avoid unchanged rebuilds, repeated expensive end-to-end runs and duplicate proof formats.

A representative connected browser journey can satisfy multiple UI requirements when it genuinely exercises them.

Run wider regression/acceptance at integration and release boundaries, not reflexively after every small edit.

---

## 18. Promotion

Normal path remains:

```text
source changes
→ sufficient changed-scope verification
→ main/CI according to repo workflow
→ Chromebook dogfood at meaningful integration/release points
→ explicit `wfx veragensia`
→ atomic live promotion
→ verify real changed journey
```

Do not silently turn every main push into live production deployment.

Preserve stable extension ID unless a deliberate migration changes it.

---

## 19. Cleanup

You own cleanup for artifacts you create:

```text
temporary branches
helper workflows
temp files
unused dependencies
debug logging
stale generated output
abandoned migration code
```

Clean as you go. Do not create elaborate cleanup phases for trivial transient files.

Do not rewrite public history merely to cosmetically remove harmless prior commits unless explicitly instructed.

---

## 20. Reporting

Reporting must not interrupt execution.

At a meaningful milestone or genuine blocker, keep it terse:

```text
what now works
what materially remains
real blocker, if any
current frontier
promotion status, if relevant
```

Include requirement IDs/tests/source refs only when they materially help the next agent or explain a risk.

Do not produce per-Workpoint essays, proof reports or status ceremony.

---

## 21. Final directive

> **Run the trajectory to completion. Build first. Verify only what materially needs verification. Reuse proof. Avoid process churn. Continue through ready authorized work without routine pauses. The objective is a working Focusa Workforce, not a beautifully documented implementation process.**
