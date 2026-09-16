# Focusa Workforce — Pre-Redesign Baseline and Deployment Guardrail

**Status:** CURRENT baseline/deployment guardrail; **not the execution handoff**  
**Master execution handoff:** `15-build-agent-master-handoff.md`  
**Full Trajectory:** `14-workforce-full-trajectory.md`  
**Authoritative repo:** `Startempire-Wire/Focusa-Workforce-Extension`  
**Live demo:** `https://os.focusa.dev`

This document preserves migration, baseline, Chromebook/cloud and live-promotion constraints. Product/UX/build execution now follows docs `10–15` and `AGENTS.md`.

---

## 1. Baseline

The exact pre-redesign implementation is preserved on:

```text
baseline/pre-redesign-2026-09-15
```

Use it only to answer:

```text
what behavior existed before redesign
whether a core operation regressed
what extension identity/configuration must be preserved
whether a rewrite is actually necessary
```

Do not develop new product work on the baseline branch.

---

## 2. Authoritative source

```text
Startempire-Wire/Focusa-Workforce-Extension
```

Typical Chromebook/cloud checkout:

```text
/home/wirebot/focusa-workforce-extension
```

GitHub `main` is the shared source of truth. Do not create divergent Chromebook-only/server-only source trees.

---

## 3. Live deployment boundary

Live promotion remains explicit:

```text
repo main
  ↓ CI
Chromebook/browser dogfood
  ↓
wfx veragensia
  ↓
Veragensia atomic stage/promote/rollback
  ↓
os.focusa.dev
```

A green `main` build is not live promotion.

Do not convert every push to implicit production deployment unless the owner deliberately changes the release contract.

---

## 4. Live invariants

Preserve until a deliberate migration changes them:

```text
extension ID: ohfbbkpacpcapicpgplnnmifmlnmjggj
public demo build/startpage public-work behavior
required manifest identity/permission boundaries
Veragensia atomic stage/promote/rollback semantics
extension/daemon/HTTP health verification
```

Do not expose customer data, browser profiles or secrets through Git/public demo artifacts.

---

## 5. Proven core primitives

The current extension contains useful implementation primitives around:

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

A UI redesign is not permission to rewrite these safety/reconciliation paths without evidence.

---

## 6. Chromebook / cloud division

### Chromebook

```text
daily dogfood
side-panel/full-page UX
browser behavior
voice interaction
responsive verification
lightweight local work
```

### Cloud/server

```text
heavy builds/tests
Focusa/UIAI/Veragensia integration
deployment
multi-agent implementation where useful
```

The environments collaborate through the same GitHub source and canonical runtime contracts.

---

## 7. Promotion acceptance

Before `wfx veragensia`:

```text
relevant tests/build green
MV3 valid
changed journey dogfooded in browser
live-facing behavior understood
rollback available
```

After promotion:

```text
verify stable extension ID
verify pages load
verify daemon/client health
verify changed user journey
rollback on material failure
```

---

## 8. Current execution authority

Do not use this baseline document to decide product UX or implementation structure.

Read:

```text
docs/15-build-agent-master-handoff.md
docs/14-workforce-full-trajectory.md
docs/10-workforce-product-requirements-and-proof-matrix.md
docs/11-workforce-experience-architecture-and-stateflow.md
docs/12-workforce-screen-and-component-contract.md
docs/13-workforce-visual-system-and-reference-surfaces.md
```

Wirebot App documentation is read-only from this workstream.

---

## 9. Final baseline law

```text
Preserve the working deployment path.
Preserve rollback.
Preserve stable identity.
Preserve proven safety primitives.
Use the baseline for regression comparison only.
Run the current Full Trajectory for new work.
```