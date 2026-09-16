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

## 2. Non-negotiable implementation rule

> **Do not improvise product requirements, navigation, screen hierarchy, visual language, state semantics, authority boundaries or source ownership.**

If implementation reality conflicts with the blueprint:

```text
inspect owning source/contract
→ determine whether blueprint or runtime is stale
→ stop only the affected node
→ update the owning architecture document deliberately
→ continue unaffected ready work
```

Do not silently invent a third interpretation in code.

---

## 3. Source of truth hierarchy

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

## 4. Current starting point

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
   → test it there
   → return to Workforce
```

Do not create `/v1/foreman/*` or any other endpoint because the docs suggest a convenient name.

---

## 5. Development order

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

Parallel work is allowed only where the dependency graph in doc 14 allows it.

---

## 6. Requirements discipline

Every implementation change must cite requirement IDs from doc 10.

Examples:

```text
WF-FOR-001
WF-DIR-003
WF-ATT-004
WF-WRK-009
WF-EVD-003
```

Before closing a Workpoint:

```text
requirement mapped
acceptance satisfied
proof captured/tested
source owner preserved
failure path tested where material
next trajectory frontier known
```

No “done” based only on component rendering.

---

## 7. Garrett five-plane package is closed

Use these docs as the implementation authorities:

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

If a real source constraint makes a requirement impossible, open/refine the affected trajectory node and change the owning plane deliberately before coding the alternative.

---

## 8. UI technology

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

## 9. Required full-page entry

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

Do not invent additional top-level destinations without updating Structure/Skeleton first.

---

## 10. Visual implementation

Implement doc 13 exactly as the starting design system:

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

Do not choose a new theme, gradient system, component kit look or alternate dashboard style during build.

Component libraries may be used only if their rendered result is conformed to doc 13 rather than accepting their default aesthetic.

---

## 11. Human attention law

`Needs You` is not a notification feed.

Only source-backed human-value attention enters it.

```text
presenter seen/snooze/hide
!=
source approve/deny/resolve/cancel/expire
```

Refresh the source immediately before consequential action.

---

## 12. Trajectory law

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

---

## 13. Truth and evidence law

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

Use doc 10/14 proof obligations.

---

## 14. Failure/recovery law

Required handling:

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

On ambiguous consequential writes, reconcile before retry.

Cached state may inform display; stale cached authority never authorizes mutation.

---

## 15. Security and credential law

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

## 16. Testing minimum per slice

Use the smallest sufficient set that proves the actual requirement:

```text
unit/contract test
build
manifest/MV3 validation
browser acceptance for changed journey
stale/degraded path
negative authority/source case where applicable
```

Do not build ceremonial duplicate test suites.

For visual slices also verify:

```text
320px Side Panel
1024px Chromebook Full Workforce
1440px Full Workforce
keyboard
focus visibility
WCAG contrast
reduced motion
```

---

## 17. Promotion

Normal path remains:

```text
source changes
→ tests/build
→ main/CI according to repo workflow
→ Chromebook dogfood
→ explicit `wfx veragensia`
→ atomic live promotion
→ verify real changed journey
```

Do not silently turn every main push into live production deployment.

Preserve stable extension ID unless a deliberate migration changes it.

---

## 18. Cleanup

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

Do not hand routine cleanup to the owner.

Do not rewrite public history merely to cosmetically remove harmless prior commits unless explicitly instructed.

---

## 19. Completion reporting

At the end of each MLG or substantial STG report only:

```text
Trajectory nodes completed
Requirement IDs satisfied
Real source operations used/added
Tests/acceptance proof
Known blocked trajectory nodes
Current Short frontier
Whether live promotion occurred
```

Do not substitute a long process narrative for delivery status.

---

## 20. Final directive

> **Run the trajectory. Do not redesign the blueprint while building it. Resolve source reality through canonical owners, preserve the five-plane UX contracts, verify each accepted outcome, and continue through ready authorized work until the HLT is accepted or a genuine scoped blocker requires owner input.**