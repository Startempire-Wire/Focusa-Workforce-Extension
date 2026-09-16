# Focusa Workforce — Pre-Redesign Baseline and Build-Agent Handoff

**Status:** CURRENT build-agent handoff  
**Audience:** build agents operating from the Chromebook and cloud/server environments  
**Authoritative repo:** `Startempire-Wire/Focusa-Workforce-Extension`  
**Live demo:** `https://os.focusa.dev`

This document describes how to redesign Focusa Workforce without losing the working migrated extension, deployment path, or current ecosystem architecture.

---

## 1. Read order before redesign

Before material redesign work, read these current owners in order:

```text
1. ADLBOS OWNER_AUTHORITY_CONSTITUTION.md
2. ADLBOS CURRENT_ECOSYSTEM_ARCHITECTURE.md
3. ADLBOS AGENT_OS_GOLDEN_PATH.md
4. Wirebot-App docs/03-wirebot-app-user0-product-recommendations.md
5. Workforce docs/00-workforce-canonical-product-and-implementation-spec.md
6. Workforce docs/05-extension-runtime-data-and-integration-contracts.md
7. Workforce docs/06-workforce-ux-and-interaction-spec.md
8. current source + tests
```

Do not use older concept docs to silently override these current boundaries.

---

## 2. Current source and deployment authority

GitHub repo:

```text
Startempire-Wire/Focusa-Workforce-Extension
```

Typical Chromebook/cloud checkout:

```text
/home/wirebot/focusa-workforce-extension
```

Veragensia live deployment builds from the authoritative repo checkout rather than the pre-migration Focusa monorepo source path.

Deployment remains explicit:

```text
repo main
  ↓ CI
Chromebook/cloud dogfood
  ↓
wfx veragensia
  ↓
Veragensia atomic deployment / rollback path
  ↓
os.focusa.dev
```

Do not turn every `main` push into implicit production/live promotion unless the owner deliberately changes that release contract.

---

## 3. Baseline

The exact pre-redesign implementation is preserved on:

```text
baseline/pre-redesign-2026-09-15
```

Use it to answer:

- what behavior existed before redesign;
- whether a core operation regressed;
- what live extension identity/configuration must be preserved;
- whether a proposed rewrite is actually necessary.

Do not develop new product work on the baseline branch.

---

## 4. Product identity

The product is **Focusa Workforce**.

It is not:

```text
Wirebot Extension
Focusa HQ
UIAI Cockpit
Veragensia dashboard
generic agent monitor
```

Its job is:

> **Operate the Focusa-governed workforce.**

The customer-level Operating Partner may be named Wirebot, Spock, Athena, etc. Workforce is Operator-neutral and projects that partner identity without becoming the partner itself.

---

## 5. Ecosystem boundary

Current chain:

```text
Owner
  ↓
Operating Partner / Chief of Staff
Wirebot implementation family
  ↓
Focusa
Project / Workstream / Foreman / governed work
  ↓
Focusa Workforce
live workforce operations
  ↓
UIAI / Veragensia / Pi / workers
  ↓
Evidence / settlement / accepted outcome
```

The build agent must preserve these boundaries.

### Wirebot App

Owns:

- partner relationship;
- life/business orientation;
- owner-wide conversation/attention;
- Workforce Composer;
- organization design/commissioning;
- network context;
- accepted outcome portfolio.

### Focusa Workforce

Owns UI/experience for:

- Foreman/workstream operations;
- roster;
- live work;
- Direction;
- workforce Needs You;
- Evidence inspection;
- UIAI execution links;
- fleet/topology posture.

### Focusa

Owns canonical work/authority/Evidence state.

### UIAI

Owns browser/computer execution/control.

### Veragensia

Owns body/runtime/Agent Computer state/enforcement.

---

## 6. Workforce Composer is not Workforce

Do not implement organization commissioning as another local extension database.

Expected path:

```text
Wirebot identifies need
→ Workforce Composer proposes role/assignment
→ CRIST + owner/governance acceptance
→ Focusa canonical binding
→ Workforce projects/operates it
```

If the redesign needs a field that is not yet available upstream, document/issue the missing owning contract rather than silently making the extension authoritative.

---

## 7. Shared ADLBOS seams

Do not invent product-local equivalents for:

```text
operator.partner_profile.v1
operator.surface_handoff.v1
operator.attention.v1
operator.correlation.v1
operator.capability_posture.v1
operator.closure.v1
```

These are cross-product reference envelopes owned at ADLBOS integration level.

Until exact schemas are implemented upstream, keep local adapter code clearly transitional and preserve exact source refs.

---

## 8. Fleet, not federation

One Operator's multiple Focusa daemons/machines/bodies are:

```text
fleet
multi-daemon aggregation
environment fleet
```

`Federation` is reserved for explicit relationships between independently scoped sovereign Operators/nodes.

Do not carry old “multi-daemon federation” language into new UI/contracts.

---

## 9. Human-agent UX target

The redesign must implement the operating loop:

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

Do not reskin the existing start page and call that the redesign.

The defining experiences are:

```text
Workstream + Foreman
Direction
Working Now / roster
Needs You
work progression
Evidence / verification
UIAI watch/takeover
fleet/topology
```

---

## 10. Existing core to preserve

The current extension already contains useful implementation primitives around:

```text
pairing
API client
contracts
projections
session creation
orchestration
SSE/reconnect
notifications
audit/storage
validation
```

Preserve/reuse these when correct.

A visual redesign is not permission to rewrite safety-critical request/reconciliation logic without evidence.

---

## 11. Presentation architecture direction

The existing pages currently own too much independent runtime/network state.

Target:

```text
MV3 service worker / shared runtime client
        ↓
Focusa event/snapshot normalization
        ↓
shared application state
        ↓
side panel · full Workforce · start page · wall
```

Svelte 5 is appropriate for the UI layer if implemented without moving canonical semantics into components.

Prefer JavaScript/JSDoc where consistent with this repo unless the owner changes that direction.

---

## 12. Redesign slices

Build vertical slices, not horizontal scaffolding projects:

```text
1. Workstream + Foreman + Direction
2. Working Now / roster
3. Needs You
4. work progression / graph
5. Evidence / verified closure
6. UIAI execution / takeover
7. voice
8. fleet / topology
9. Radar
10. elastic capacity
```

Each slice should:

- work against real current owners/contracts;
- include degraded/stale states;
- preserve exact refs;
- have browser-level acceptance;
- be useful by itself;
- avoid speculative abstraction.

---

## 13. Visual target

Target **expensive calm**:

- Google-clean restraint;
- excellent typography;
- strong hierarchy;
- generous efficient spacing;
- subtle motion tied to state change;
- minimal chrome;
- meaningful color;
- responsive Chromebook use;
- accessibility;
- technical depth one layer down.

Avoid dashboard theater, gamer/neon swarm visuals, raw IDs and unnecessary stats.

---

## 14. Live identity and deployment invariants

Preserve until a deliberate migration says otherwise:

```text
extension ID: ohfbbkpacpcapicpgplnnmifmlnmjggj
public demo build path / startpage public-work behavior
manifest identity/permissions required by current deployment
Veragensia atomic stage/promote/rollback semantics
CDP + extension + daemon + HTTP health verification
```

Do not expose customer data/secrets/browser profiles through Git or the public demo.

---

## 15. Chromebook / cloud working model

### Chromebook

Use for:

- daily interaction/dogfood;
- UI/UX verification;
- browser behavior;
- lightweight local development;
- voice/side-panel workflow testing.

### Cloud/server

Use for:

- heavy builds/tests;
- daemon/runtime work;
- deployment;
- Veragensia/UIAI integration;
- multi-agent implementation when appropriate.

GitHub `main` is the shared source of truth between them.

Do not create divergent Chromebook-only or server-only source copies.

---

## 16. Build-agent behavior

Outcomes over process.

When implementation is authorized:

```text
inspect
→ make smallest correct change
→ run relevant tests/build
→ verify in browser/runtime
→ fix discovered regressions
→ update owning docs when architecture changed
→ clean temporary artifacts/branches/workflows you created
→ leave a clear commit/report
```

Do not stop because one tool fails if another safe route exists.

Do not leave known cleanup for the owner.

Do not write elaborate plans instead of implementing a ready vertical slice.

---

## 17. Promotion boundary

`main` + green CI is not the same as live promotion.

Before `wfx veragensia`:

- CI/build passes;
- relevant Chromebook/browser dogfood passes;
- live-facing behavior is understood;
- rollback remains available.

After promotion:

- verify extension ID;
- verify page loads;
- verify daemon/client health;
- verify the changed user journey;
- rollback on material failure.

---

## 18. Completion for a redesign slice

A slice is not done because components render.

It is done when:

1. exact real source state is displayed;
2. interaction reaches the owning operation;
3. authority/entitlement/freshness are honest;
4. success/failure/reconciliation behave correctly;
5. the user journey works in Chromium/Chromebook;
6. CI/build remain green;
7. no duplicate canonical state was introduced;
8. docs/contracts changed by the slice are reconciled;
9. temporary implementation mess is removed.

---

## 19. Current directive

The repository is migration-complete and stabilized.

The next work is a **real product redesign**, not another recovery/replatforming cycle.

Use the current architecture and UX specs as the target, preserve proven core primitives, and implement the new experience in vertical slices.
