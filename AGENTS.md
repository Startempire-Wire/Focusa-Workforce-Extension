# AGENTS — Focusa Workforce Build Contract

**Product:** Focusa Workforce  
**Authoritative repo:** `Startempire-Wire/Focusa-Workforce-Extension`  
**Execution authority:** `docs/15-build-agent-master-handoff.md`  
**Full Trajectory:** `docs/14-workforce-full-trajectory.md`  
**Portable ecosystem doctrine:** ADLBOS `CURRENT_ECOSYSTEM_ARCHITECTURE.md` + `CROSS_PRODUCT_SEAM_CONTRACT.md`

> **Focusa Workforce operates the workforce.**

The redesign package is sufficiently specified. Build agents are expected to execute it, not redesign it during implementation.

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

## Outcomes over process — controlling execution law

**True working product progress outranks planning, reporting, proof collection, documentation ceremony and process completion.**

The trajectory, requirement IDs and acceptance notes exist to keep implementation aimed at the correct outcome. They are not a second job.

Rules:

```text
implement before elaborating
reuse valid evidence before creating more
verify the material risk, not every imaginable assertion
one check may satisfy many requirements
never create proof artifacts merely to say proof exists
do not repeat unchanged tests/builds without a concrete reason
do not stop ready work for status reports, matrices or documentation updates
continue independent ready work when one node is blocked
update docs only when source truth or architecture materially changed
```

Do **not** spend hours making the trajectory look complete while the product is incomplete.

Do **not** turn requirement IDs into ticket bureaucracy. Use them to preserve coverage and traceability for substantive work; do not annotate every line edit, refactor or obvious implementation step.

Verification is sufficient when removing the check would leave an applicable acceptance condition or material failure risk unverified. Once that is true, advance.

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
→ verify the owning behavior
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

Run `docs/14-workforce-full-trajectory.md` continuously through ready authorized work. Do not pause after each Workpoint for ceremony or permission when the next node is already authorized and ready.

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

Preserve the owning closure path where applicable:

```text
activity
→ Focusa Evidence
→ verification
→ settlement / Receipt
→ accepted outcome / W.I.N.S.
```

Do not manufacture extra Evidence objects when an existing test, receipt, source revision, browser observation or owning-system result already proves the applicable acceptance condition.

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

## Verification

Use the **minimum sufficient verification** for the changed behavior.

Typical available checks include:

```text
focused unit/contract test
build/MV3 validation
real browser journey
stale/degraded path
negative authority/source case when materially relevant
```

Do not automatically run all of them for every edit. Choose the smallest combination that proves the changed acceptance condition and material regression risk.

Reuse still-valid results. Do not rebuild unchanged artifacts or rerun expensive browser journeys solely for ritual completeness.

For major visual/surface acceptance, verify representative target sizes and accessibility obligations that the change actually affects. Do not turn every component edit into a full responsive/accessibility certification pass.

## Deployment

```text
main + CI
→ Chromebook/browser dogfood
→ explicit wfx veragensia
→ atomic Veragensia promotion
→ os.focusa.dev
```

Preserve extension ID `ohfbbkpacpcapicpgplnnmifmlnmjggj`, public-demo behavior, rollback and health gates unless a deliberate migration changes them.

## Execution loop

```text
orient once enough to act
→ implement the current ready Workpoint
→ verify the material behavior
→ reconcile only what changed
→ immediately continue the next ready authorized work
→ clean artifacts you created as you go
```

Tool failure is route failure when another safe route exists.

Do not leave temporary branches, helper workflows, debug files or routine cleanup for the owner.

## Completion reporting

Reporting is terse and does not interrupt execution. At a meaningful milestone or genuine blocker report:

```text
what now works
what materially remains
actual blocker, if any
current frontier
live promotion status, if relevant
```

Requirement IDs, tests and source refs may be included when they materially help handoff/debugging; they are not mandatory ceremony for every change.

Do not substitute process narrative for delivery.
