# AGENTS — Focusa Workforce Build Contract

**Product:** Focusa Workforce  
**Authoritative repo:** `Startempire-Wire/Focusa-Workforce-Extension`  
**Portable ecosystem doctrine:** ADLBOS `CURRENT_ECOSYSTEM_ARCHITECTURE.md`  
**Portable seam contract:** ADLBOS `CROSS_PRODUCT_SEAM_CONTRACT.md`  
**Current product spec:** `docs/00-workforce-canonical-product-and-implementation-spec.md`  
**Current redesign blueprint:** `docs/08-workforce-redesign-blueprint.md`  
**Active implementation slice:** `docs/09-slice-1-workstream-foreman-direction-implementation.md`

This file tells build agents how to change this repository without breaking product ownership, live deployment, or the human-agent workforce model.

## Mission

Build the specialist browser-resident surface where an owner can understand, direct, collaborate with and verify a Focusa-governed workforce.

> **Focusa Workforce operates the workforce.**

Do not reduce the product to a prettier status dashboard. Do not turn it into Wirebot, Focusa Desktop, UIAI Cockpit or Veragensia.

## Read order

Before material redesign work:

```text
ADLBOS OWNER_AUTHORITY_CONSTITUTION.md
ADLBOS CURRENT_ECOSYSTEM_ARCHITECTURE.md
ADLBOS CROSS_PRODUCT_SEAM_CONTRACT.md
Wirebot-App current product/convergence docs (read-only dependency; do not rewrite from this repo)
this repo docs/00
docs/05
docs/06
docs/08
docs/09 for the active Slice 1
docs/07 for migration/baseline/deployment guardrails
current source/tests
```

Current product architecture outranks older concept language when they conflict.

## Ownership boundaries

```text
Canonical owner
  root owner authority

Delegated human operator
  bounded owner-granted operational scope only

Wirebot / customer-named Operating Partner
  owner relationship, life/business orientation,
  Workforce Composer, owner-wide attention

Focusa
  Project / Workstream / Foreman / Workpoint,
  governed work, authority, Evidence, receipts

Focusa Workforce
  live workforce operations UX

UIAI
  browser/computer execution, diagnostics, takeover/proof

Veragensia
  body/runtime/Agent Computer/enforcement

W.I.N.S.
  accepted outcomes
```

Never create duplicate canonical state to make the extension easier to build.

## Operator neutrality

The customer-level Operating Partner may be named `Spock`, `Athena`, `Wirebot`, etc. Workforce must not hard-code the assumption that the partner is named Wirebot.

Keep distinct:

```text
CanonicalOwnerPrincipal
DelegatedHumanPrincipal
OperatingPartnerPrincipal
partner presentation name
worker/agent identity
runtime/session/body identity
optional ArchitectureAuthorityPrincipal
```

A delegated human may operate only within the owner-issued grant. Human operator access is not co-ownership and is not architecture authority.

Partner identity, presentation name, model/runtime/body and optional architecture authority are distinct.

## Workforce Composer versus Workforce

Wirebot Workforce Composer designs/commissions roles and assignments. Focusa Workforce operates active governed work.

Do not implement a second role/assignment database inside the extension. If upstream assignment data is missing, fix/track the owning contract rather than inventing local authority.

## Human-agent operating loop

Design around:

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

Primary experiences:

```text
Workstream + Foreman
Direction
Working Now / roster
Needs You
work progression
Evidence
UIAI watch/takeover
fleet/topology
```

## Shared ecosystem seams

Consume ADLBOS `CROSS_PRODUCT_SEAM_CONTRACT.md` and shared seam families rather than inventing local variants:

```text
operator.partner_profile.v1
operator.surface_handoff.v1
operator.attention.v1
operator.correlation.v1
operator.capability_posture.v1
operator.closure.v1
operator.credential_use_ref.v1
```

These are reference envelopes, not another backend.

Cross-product refs are typed/source-qualified. Do not assume a bare `workRef`, `attentionRef`, `executionRef`, etc. is globally unique across environments or products.

For actionable shared envelopes, preserve machine-readable compatibility and freshness: schema/version, producer/version, source ref/revision, owner/environment scope, actor ref where applicable, correlation, issued/observed time, expiry where applicable and idempotency/replay metadata where a mutation can be retried.

Rules:

- unsupported consequential versions fail closed;
- stale/expired cached projections may be rendered honestly but must be revalidated before mutation;
- wall-clock timestamps from independent machines do not establish causal order;
- prefer source revision/sequence/epoch/generation/lease semantics for conflict and freshness decisions;
- if clock confidence is insufficient around a consequential expiry, revalidate with the source rather than guessing;
- ambiguous consequential writes reconcile before retry.

## Credential-use references

Workforce does not move reusable secret material between products.

If a work/attention/handoff path needs a provider credential, carry only an opaque `operator.credential_use_ref.v1` reference or bounded use request. The owning credential authority resolves or denies it at execution time.

Never place raw reusable secrets in:

```text
handoff URLs
Direction text
attention objects
local projection cache
Evidence
receipts/logs
```

Possession of a credential reference is not authorization to use it.

## Terminology

Use `fleet` / `multi-daemon aggregation` for one Operator's multiple Focusa environments/daemons/bodies.

Reserve `sovereign federation` for explicit cross-Operator/network sharing. Do not reintroduce “multi-daemon federation.”

## Source and migration baseline

The migration into this repo is complete. Do not rebuild the extension from scratch merely because the old UI is insufficient.

Preserve sound core primitives:

```text
pairing
API client
contracts
orchestration
session creation
SSE / reconnect
projections
validation
```

The pre-redesign baseline is:

```text
baseline/pre-redesign-2026-09-15
```

Use it for behavioral comparison, not new development.

## UI architecture direction

Evolve toward:

```text
shared Workforce runtime client
        ↓
normalized Focusa snapshot/events
        ↓
shared application state
        ↓
side panel · full app · start page · wall
```

MV3 service-worker suspension is a design constraint. Do not make canonical state or long-lived work depend on keeping the service worker alive.

Svelte 5 is appropriate for presentation. Do not move authority/reconciliation/business semantics into Svelte components.

## UX law

Target **expensive calm**: clean typography, strong hierarchy, restrained color, minimal chrome, subtle state-driven motion, technical depth one layer down, excellent degraded states, responsive Chromebook use and accessibility.

Avoid gamer/neon dashboards, widget clutter and raw agent/tool chatter.

## Needs You

Needs You is source-bearing shared attention, not a local notification bucket.

Show only owner-value items such as approval, owner truth, authentication, takeover, resource exception, recovery decision, meaningful blocker or high-value signal.

Routine agent activity does not belong here.

A local `seen`, `acknowledged`, `hidden` or `snoozed` state is presenter UX only. It is not the source object's approval/resolution/cancellation. Revalidate the source revision before a consequential action.

## Evidence truth

Do not equate agent claim with verified result, tool success with accepted work, or screenshot with accepted business outcome.

Preserve:

```text
execution
→ Focusa Evidence
→ verification / settlement
→ accepted outcome / W.I.N.S.
→ optional MeriFolio standing
```

## Capability / entitlement / authority

Never collapse:

```text
supported
entitled
activated/connected
authorized
available/healthy
consented for this effect
```

Contextual expansion may explain adjacent products/capacity, but the extension never grants entitlement or authority.

A cached capability posture is not current authority. Revalidate before consequential activation/use.

## Browser and UIAI

Useful explicit page actions:

```text
Ask Foreman about page
Send page to Foreman
Create work from selection
Capture Evidence candidate
Open in UIAI
```

UIAI remains detailed browser/computer execution authority. Workforce deep-links exact execution context rather than rebuilding Cockpit.

## Development sequence

Implement vertical slices:

```text
1 Workstream + Foreman + Direction
2 Working Now / roster
3 Needs You
4 work progression / graph
5 Evidence / verified closure
6 UIAI execution / takeover
7 voice
8 fleet / topology
9 Radar
10 elastic capacity
```

Slice 1 implementation authority is `docs/09-slice-1-workstream-foreman-direction-implementation.md`.

Each slice must be useful end-to-end. Avoid framework/process ceremony before the first real slice works.

## Tests and truth

A green unit suite is not enough when browser integration can still fail.

For relevant changes verify:

```text
unit/contract tests
build
manifest/MV3 validity
browser load
actual side-panel/full-page journey
Focusa interaction
stale/degraded behavior
```

Add regression tests for concrete bugs found.

When implementing the shared seams, include negative tests for:

```text
delegated human exceeds grant → denied
same bare ID from two environments → no collision
stale attention/capability cache → no consequential mutation
unsupported consequential envelope version → fail closed
clock disagreement → source revision/sequence wins over local timestamp ordering
ambiguous mutation → reconcile before retry
credential-use ref → no raw secret disclosure / no implicit grant
presenter acknowledgement → source action remains unresolved until owner resolves it
```

## Deployment

GitHub `main` is authoritative source.

Live promotion remains explicit:

```text
main + CI
→ Chromebook/browser dogfood
→ wfx veragensia
→ atomic Veragensia promotion
→ os.focusa.dev
```

Preserve extension ID `ohfbbkpacpcapicpgplnnmifmlnmjggj`, public-demo behavior, atomic rollback and live health verification unless an intentional migration changes them.

## Chromebook/cloud workflow

Chromebook: UI/UX dogfood, browser behavior, lightweight implementation, voice/side-panel testing.

Cloud/server: heavy builds/tests, Focusa/UIAI/Veragensia integration, deployment and multi-agent implementation when appropriate.

GitHub is the shared source of truth. No divergent source trees.

## Outcomes Over Process

When implementation is authorized:

```text
inspect
→ implement smallest correct slice
→ test/build
→ verify running behavior
→ fix regressions
→ update owning docs/contracts
→ clean temporary artifacts you created
→ land cleanly
```

Keep making forward progress when a tool fails and another safe route exists.

Do not churn on planning/proofs/abstraction after the path is clear. Do not leave branches, helper workflows, temp files or cleanup for the owner when you created them and can remove them.

## Completion

A change is complete only when it works against real source/contracts, browser behavior is verified where applicable, exact refs/scope/freshness remain honest, no duplicate authority/state was added, tests/build are green, deployment is promoted only when intended, docs are reconciled, and temporary implementation mess is removed.
