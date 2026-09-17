# Focusa Workforce — Exact Upstream Architecture Corpus

**Status:** CURRENT source-of-truth map  
**Purpose:** name the exact upstream repositories/documents that govern Workforce so a downstream builder does not rediscover architecture from conversation history or broad topic searches.

## 1. Precedence

Use this order when sources appear to disagree:

```text
1. Canonical Owner / current owner-approved constitution
2. Current owning product runtime/generated contract
3. Current owning product implementation source
4. Current owning product canonical/current specification
5. ADLBOS shared seam doctrine
6. Workforce consumer contract
7. older concepts / historical material
```

A numbered spec does not override running canonical truth merely because it is numbered. A running implementation does not gain architecture authority merely because it exists.

If current runtime/source and current canonical spec genuinely conflict on product semantics, stop only the affected node and surface the exact contradiction.

---

# 2. ADLBOS — cross-product constitutional/integration authority

Repository:

```text
Startempire-Wire/agent-driven-life-business-os
```

Read exact files as applicable:

```text
AGENTS.md
OWNER_AUTHORITY_CONSTITUTION.md
CRYPTOGRAPHIC_AUTHORITY_PROFILE.md
CURRENT_ECOSYSTEM_ARCHITECTURE.md
AGENT_OS_GOLDEN_PATH.md
CROSS_PRODUCT_SEAM_CONTRACT.md
AGENT_COMPUTER_REFERENCE_PROFILE.md

docs/agent-os-golden-path/02-agent-os-golden-path-ordered-tasks.md
docs/agent-os-golden-path/09-composable-ai-workforce-catalogue-and-client-assignment-matrix.md
docs/agent-os-golden-path/10-wirebot-application-family-startempire-wire-integration-architecture.md
docs/agent-os-golden-path/11-agent-os-golden-path-seamless-autonomy-gap-audit.md
```

Use these for:

```text
Canonical Owner Principal
DelegatedHumanPrincipal
OperatingPartnerPrincipal vs ArchitectureAuthorityPrincipal
one-function/one-owner rule
fleet vs federation
deployment/hosting/isolation dimensions
capability/entitlement/authority separation
cross-product refs and handoffs
attention presenter-vs-source semantics
freshness/replay/correlation law
credential-use references
Wirebot ↔ Focusa ↔ Workforce boundaries
Workforce Composer ↔ Workforce distinction
worker catalogue/assignment doctrine
```

Do not create a second constitution inside Workforce.

---

# 3. Focusa — governed work / Foreman / Trajectory / Evidence authority

Repository:

```text
Startempire-Wire/focusa
```

## 3.1 Entry/current manifests

```text
README.md
docs/AGENTS.md
docs/agent/01-focusa-agent-docs-index.md
docs/181-184-voice-foreman-radar-ambient-operator-current-manifest.md
docs/current/WORKSTREAM_CONFORMANCE_2026-08-16.md
```

## 3.2 Workstream / canonical scope

```text
docs/164-workstream-rooted-canonical-runtime-design.md
```

When touching lower-level state partition/migration behavior also inspect current implementation/source and, where still applicable:

```text
docs/158-workstream-rooted-cognitive-runtime-canonical-state-partitioning-and-foundation-migration-spec.md
```

## 3.3 Original Workforce product lineage

```text
docs/174-focusa-agent-workforce-extension-concept.md
```

This is lineage/product intent, not a replacement for the current Workforce repo blueprint.

## 3.4 Voice / Foreman / Radar / Ambient Operator

```text
docs/181-focusa-voice-conversation-expression-and-auditable-interaction-spec.md
docs/182-focusa-project-foreman-workstream-intelligence-projection-spec.md
docs/183-focusa-radar-proactive-observation-episodes-signal-economics-and-attention-routing-spec.md
docs/184-focusa-ambient-operator-mobile-wearable-presence-meeting-and-sync-spec.md
```

Semantics:

```text
181 → auditable conversation/voice meaning and lineage
182 → Workstream-scoped persistent Foreman projection
183 → proactive observations/Episodes/Signals/attention routing
184 → mobile/wearable/meeting projection and routing
```

## 3.5 Presence / placement / body continuity

```text
docs/139-distributed-presence-environment-awareness-execution-placement-and-multi-daemon-coordination-spec.md
docs/153b-focusa-agent-embodiment-body-profile-and-transfer-addendum.md
```

Use these when Workforce touches fleet/presence/placement/body continuity. Do not reinterpret multi-runtime presence as sovereign federation.

## 3.6 Evidence / closure / receipts / settlement

```text
docs/116-provider-neutral-work-item-closure-authority-spec.md
docs/119-verifiable-agent-work-receipts-and-governed-execution-ledger-spec.md
docs/136-governed-proposal-to-settlement-protocol-and-outcome-truth-infrastructure-spec.md
```

Use these to preserve distinctions between:

```text
claim
Evidence
verification
receipt
settlement
accepted outcome
```

## 3.7 Autonomous/silent execution

```text
docs/133-daemon-native-durable-silent-sessions-and-governed-autonomous-execution-spec.md
```

## 3.8 Professional workspace / CRIST project genesis

```text
docs/135-focusa-professional-workspaces-and-crist-project-genesis-master-spec.md
docs/135b-crist-project-genesis-context-role-interview-spec-tasks.md
```

## 3.9 Spec/architecture-to-execution workflow

```text
docs/120-adversarial-spec-workbench-and-operator-approval-gates.md
docs/120a-architecture-to-execution-workbench-and-full-trajectory-handoff-spec.md
docs/120a-swe-software-engineering-vertical-profile.md
```

`120A` is cross-vertical. `120A-SWE` adds software-specific repository/API/UI/test/release concerns. Workforce was architected using both.

## 3.10 Full Trajectory / release completion

```text
GitHub issue #618 — Full/Medium/Short Trajectory requirements
docs/149-focusa-workset-flow-ledger-and-release-completion-spec.md
```

## 3.11 Runtime/generated contract is mandatory before inventing an operation

For every live Workforce integration, inspect actual owning operations/source first.

Known runtime discovery surface:

```text
GET /v1/agent/operations
```

Then inspect the owning route/operation implementation in the current Focusa source tree.

Decision law:

```text
real owning operation exists
→ consume it

real equivalent exists
→ thinnest provenance-preserving adapter

operation genuinely missing
→ implement smallest correct owning operation upstream
→ return to Workforce
```

Never invent `/v1/foreman/...` or other convenient endpoints from a prose spec alone.

---

# 4. Wirebot App — owner/Operating-Partner altitude

Repository:

```text
Startempire-Wire/Wirebot-App
```

**Read-only from this Workforce workstream. Do not rewrite these documents.**

Current integration-relevant documents:

```text
docs/04-wirebot-app-system-map.md
docs/05-wirebot-app-core-process-contracts.md
docs/06-wirebot-app-primary-surfaces-and-operational-slice.md
docs/08-wirebot-app-autonomous-execution-contract.md
docs/09-wirebot-app-granular-callgraph-review.md
docs/10-wirebot-body-independent-partner-continuity-addendum.md
docs/10-wirebot-owner-transport-correctness.md
docs/11-wirebot-app-full-trajectory-and-acceptance.md
```

Use these only to maintain the altitude boundary:

```text
Wirebot App
→ owner relationship
→ life/business orientation
→ owner-wide recommendation/attention
→ Workforce Composer
→ broad delegation
→ accepted-outcome/portfolio presentation

Focusa Workforce
→ already-governed workforce operation
→ Workstream/Foreman direction
→ live people/work/attention/proof/execution posture
```

Wirebot is not a global Focusa Foreman. Workforce must not recreate Wirebot's owner/life/business surface.

---

# 5. UIAI Engine — browser/computer execution authority

Repository:

```text
WPUIAI/uiai-engine
```

Start with:

```text
AGENTS.md
docs/UIAI_COCKPIT_DOCUMENT_REGISTER.md
```

Workforce-relevant current documents/contracts:

```text
docs/UIAI_COCKPIT_002_AGENT_FIRST_BROWSER_AMENDMENT_2026-07-19_v1.0.md
docs/UIAI_COCKPIT_003_OPERATIONAL_CONSTITUTION_2026-08-01_v1.0.md
docs/UIAI_COCKPIT_005_FOCUSA_DAEMON_PAIRING_MULTI_DAEMON_SCOPE_RECONCILIATION_SPEC_2026-08-03_v1.0.md
docs/UIAI_COCKPIT_008_FOCUSA_MISSION_CANVAS_INTERLOCK_HANDOFF_CREDENTIALS_SUPERVISION_2026-08-01_v1.0.md
docs/UIAI_VERAGENSIA_COMPUTER_CONTROL_AND_VOICE_BINDING_2026-09-04.md
docs/contracts/UIAI_COCKPIT_008_C02_CONTEXTUAL_HANDOFF_TYPED_INTAKE_v1.yaml
docs/contracts/UIAI_COCKPIT_008_C06_FUNCTIONAL_UI_CROSS_GUI_VISUAL_PROOF_MATRIX_v1.yaml
```

Use these for:

```text
browser/computer observation and actuation
control-lease/takeover semantics
Focusa/UIAI exact handoff
credentials boundary
multi-daemon scope reconciliation
ambiguous side-effect reconciliation
execution evidence/proof
voice/computer-control parity
```

Workforce may show bounded execution posture and exact handoffs. It does not become UIAI Cockpit or computer-control authority.

---

# 6. Veragensia — body/runtime/Agent Computer authority

Repository:

```text
Startempire-Wire/veragensia
```

Start with:

```text
README.md
AGENTS.md
```

Current Workforce-relevant documents:

```text
docs/182-veragensia-focusa-agent-os-spec.md
docs/182b-veragensia-base-os-and-overlay-detailed-spec.md
docs/182c-veragensia-fleet-scale-tailnet-spec.md
docs/183-veragensia-public-agent-computer-security-and-lifecycle.md
docs/184-veragensia-epwa-preview-surface-spec.md
docs/185-veragensia-architecture-authority-provenance-and-wirebot-identity-policy.md
docs/186-veragensia-v0.1-native-chromebook-release-spec.md
docs/187-veragensia-chromebook-first-install-runbook.md
docs/188-veragensia-v0.1-decisions-and-integration-contracts.md
docs/190-veragensia-agent-first-software-and-capability-resolution-spec.md
docs/191-veragensia-elastic-agent-computing-and-cloud-runtime-spec.md
```

Use these for:

```text
Agent Computer/body classes
machine/runtime lifecycle
tailnet/fleet posture
security/enforcement
Chromebook body/runtime integration
preview/demo hosting boundary
architecture/identity separation
agent-first capability resolution
elastic/cloud Agent Computer capacity
```

A body/runtime is not the persistent Operating Partner or Foreman identity.

---

# 7. Workforce local construction authorities

This repository owns the browser workforce-operations product.

Use:

```text
docs/00-workforce-canonical-product-and-implementation-spec.md
docs/05-extension-runtime-data-and-integration-contracts.md
docs/06-workforce-ux-and-interaction-spec.md
docs/08-workforce-redesign-blueprint.md
docs/09-slice-1-workstream-foreman-direction-implementation.md
docs/10-workforce-product-requirements-and-proof-matrix.md
docs/11-workforce-experience-architecture-and-stateflow.md
docs/12-workforce-screen-and-component-contract.md
docs/13-workforce-visual-system-and-reference-surfaces.md
docs/14-workforce-full-trajectory.md
docs/15-build-agent-master-handoff.md
docs/16-extension-all-faces-experience-completion-contract.md
docs/17-workforce-layout-atlas.md
```

Construction authority split:

```text
Strategy   → 00 + 08 + 10
Scope      → 10
Structure  → 11
Skeleton   → 12
Surface    → 13
Trajectory → 14
Execution  → 15
All faces  → 16
Layout     → 17
Runtime    → 05
```

---

# 8. Exact seam-to-owner lookup

| Workforce need | Owner | Read first |
|---|---|---|
| Owner/delegated-human authority | ADLBOS | `OWNER_AUTHORITY_CONSTITUTION.md` |
| Cross-product refs/handoffs/freshness | ADLBOS | `CROSS_PRODUCT_SEAM_CONTRACT.md` |
| Wirebot vs Workforce boundary | ADLBOS + Wirebot | ADLBOS doc `10...integration-architecture.md`, Wirebot docs 04–06 |
| Workstream identity/state | Focusa | Spec 164 + current runtime/source |
| Foreman | Focusa | Spec 182 + current runtime/source |
| Trajectory | Focusa | issue #618 + 120A + current operations |
| Attention/Radar | ADLBOS + Focusa | ADLBOS seam contract + Spec 183 |
| Voice | Focusa | Spec 181 |
| Evidence/closure | Focusa | Specs 116/119/136 |
| Silent workers | Focusa | Spec 133 |
| UIAI watch/takeover | UIAI | UIAI 003 + 008 + current runtime |
| UIAI multi-environment reconciliation | UIAI | UIAI 005 |
| Body/runtime/topology | Veragensia | 182/182c/183/188 |
| Elastic Agent Computer capacity | Veragensia | 191 |
| Operating Partner continuity | Wirebot + ADLBOS | Wirebot doc 10 body-independence + ADLBOS constitution |
| Workforce assignment design | ADLBOS/Wirebot | ADLBOS workforce catalogue + Wirebot system/process docs |

---

# 9. Builder rule

Do not broad-search the ecosystem before using this map.

When a Workforce node crosses an owner boundary:

```text
open the exact file(s) above
→ inspect current owning runtime/source
→ preserve the owner semantics
→ implement/consume the smallest necessary seam
→ return to Workforce
```

If implementation proves this corpus stale, update this file rather than leaving future agents to rediscover the same ownership decision.