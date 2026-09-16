# AGENTS — Focusa Workforce Build Contract

**Product:** Focusa Workforce  
**Authoritative repo:** `Startempire-Wire/Focusa-Workforce-Extension`  
**Execution authority:** `docs/15-build-agent-master-handoff.md`  
**Full Trajectory:** `docs/14-workforce-full-trajectory.md`  
**Portable ecosystem doctrine:** ADLBOS `CURRENT_ECOSYSTEM_ARCHITECTURE.md` + `CROSS_PRODUCT_SEAM_CONTRACT.md`

> **Focusa Workforce operates the workforce.**

The redesign package is now sufficiently specified that build agents are expected to execute it, not redesign it during implementation.

## Read order

Read exactly:

```text
ADLBOS OWNER_AUTHORITY_CONSTITUTION.md
ADLBOS CURRENT_ECOSYSTEM_ARCHITECTURE.md
ADLBOS CROSS_PRODUCT_SEAM_CONTRACT.md
ADLBOS AGENTS.md

docs/15-build-agent-master-handoff.md
docs/14-workforce-full-trajectory.md
docs/10-workforce-product-requirements-and-proof-matrix.md
docs/11-workforce-experience-architecture-and-stateflow.md
docs/12-workforce-screen-and-component-contract.md
docs/13-workforce-visual-system-and-reference-surfaces.md

docs/00-workforce-canonical-product-and-implementation-spec.md
docs/05-extension-runtime-data-and-integration-contracts.md
docs/06-workforce-ux-and-interaction-spec.md
docs/08-workforce-redesign-blueprint.md
docs/09-slice-1-workstream-foreman-direction-implementation.md
docs/07-pre-redesign-baseline-and-agent-handoff.md

current source/tests
current owning Focusa contracts for the active trajectory node
```

Wirebot App is a read-only product/architecture dependency from this workstream. **Do not rewrite Wirebot App documentation.**

## Do not improvise

Do not invent or casually change:

```text
product scope
navigation
screen hierarchy
visual language
trajectory semantics
lifecycle semantics
attention semantics
proof semantics
product ownership
authority boundaries
cross-product reference rules
```

If source reality conflicts with the blueprint, stop only the affected trajectory node, inspect the canonical owner, update the owning blueprint deliberately if necessary, then continue ready unaffected work.

Do not encode a third interpretation in client code.

## Current Short frontier

Start at:

```text
HLT-WF-001
→ MLG-0
→ STG-0.1
→ WP-0.1.1
```

Inspect current Focusa generated/current operations required by Slice 1.

Decision rule:

```text
real owning operation exists
→ consume it

real equivalent exists
→ thin provenance-preserving adapter

owning operation genuinely missing
→ implement the smallest owning Focusa operation first
→ prove it
→ return to Workforce
```

Never invent convenient endpoints or client-side canonical state.

## Ownership boundaries

```text
Canonical Owner / delegated humans
  owner-rooted authority

Wirebot / customer-named Operating Partner
  owner relationship, life/business orientation,
  Workforce Composer, owner-wide attention

Focusa
  Project / Workstream / Foreman / Workpoint,
  governed work, authority, Evidence, settlement, continuity

Focusa Workforce
  browser-resident live workforce operations UX

UIAI
  browser/computer execution, diagnostics, takeover/proof

Veragensia
  body/runtime/Agent Computer/placement/enforcement

W.I.N.S.
  accepted outcomes
```

Never create duplicate canonical state to make the extension easier to build.

## Technology

Use:

```text
Svelte 5
Vite or equivalent minimal MV3 bundling
JavaScript + JSDoc
```

Do not introduce SvelteKit.

Preserve/reuse sound current core modules unless focused evidence requires a change:

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

MV3 service-worker suspension is a design constraint. Canonical work must never depend on the worker staying alive.

## Five-plane UX authority

```text
Strategy  → docs/00 + docs/08 + docs/10
Scope     → docs/10
Structure → docs/11
Skeleton  → docs/12
Surface   → docs/13
```

These are build targets, not prompts for fresh design exploration.

## Full Trajectory law

`Full`, `Medium`, and `Short` are coverage projections of one source-owned Trajectory.

They are separate from:

```text
Human / Operations / Technical presentation depth
```

and separate from lifecycle stage.

Never infer whole-project completion from current Workpoint or branch completion.

Run `docs/14-workforce-full-trajectory.md` continuously through ready authorized work.

## Shared ecosystem seams

Consume ADLBOS seam families and typed/source-qualified refs. Do not assume bare IDs are globally unique.

Consequential actions must preserve/revalidate current:

```text
schema/version
source ref/revision
owner/environment scope
actor
correlation
freshness/expiry
idempotency/replay semantics
```

Unsupported consequential versions fail closed. Ambiguous writes reconcile before retry. Wall-clock time does not establish cross-machine causal order.

## Needs You

Needs You contains only human-value attention. Presenter state is not source resolution.

```text
seen / hidden / snoozed
!=
approved / denied / resolved / cancelled / expired
```

Refresh source state immediately before consequential action.

## Evidence truth

Never equate:

```text
agent claim = verified result
screenshot = accepted outcome
successful command = product completion
one deployed branch = full trajectory completion
```

Preserve:

```text
activity
→ Focusa Evidence
→ verification
→ settlement / Receipt
→ accepted outcome / W.I.N.S. where applicable
```

## Security

Reusable secrets never belong in:

```text
handoff URLs
Direction text
attention objects
projection cache
Evidence
receipts/logs
repository files
```

Credential references are opaque requests/references, not authority.

## Visual target

Implement `docs/13-workforce-visual-system-and-reference-surfaces.md`.

Canonical redesign is light-first, restrained and operational. Do not substitute a new dashboard/theme/component-library aesthetic during build.

## Tests

For changed requirements use the smallest sufficient proof set:

```text
unit/contract
build
MV3/manifest
real browser journey
stale/degraded path
negative authority/source case where material
```

Visual slices additionally verify 320px Side Panel, 1024px Chromebook, 1440px desktop, keyboard, visible focus, WCAG 2.2 AA and reduced motion.

## Deployment

```text
main + CI
→ Chromebook/browser dogfood
→ explicit wfx veragensia
→ atomic Veragensia promotion
→ os.focusa.dev
```

Preserve extension ID `ohfbbkpacpcapicpgplnnmifmlnmjggj`, public-demo behavior, rollback and health gates unless a deliberate migration changes them.

## Outcomes over process

```text
orient
→ implement the current trajectory Workpoint
→ test
→ verify real behavior
→ reconcile/refine affected nodes
→ continue ready work
→ clean artifacts you created
```

Tool failure is route failure when another safe route exists.

Do not leave temporary branches, helper workflows, debug files or routine cleanup for the owner.

## Completion

Report substantive progress as:

```text
Trajectory nodes completed
Requirement IDs satisfied
Owning operations consumed/added
Proof/tests
Blocked nodes
Current Short frontier
Live promotion status
```

Do not substitute process narrative for delivery.