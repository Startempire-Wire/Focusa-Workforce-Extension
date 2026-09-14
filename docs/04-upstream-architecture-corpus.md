# Focusa Workforce — Upstream Architecture Corpus

**Purpose:** collate the canonical source material that governs Workforce without creating a second source of truth.

This file is the authoritative reading map for Workforce implementation. Source documents remain canonical in their owning repositories; this repo may carry synchronized snapshots later, but implementation agents must resolve conflicts in favor of the primitive-owning source.

---

## 1. Focusa — workforce, identity, authority, work, evidence

### Direct Workforce sources

- `Startempire-Wire/focusa/docs/174-focusa-agent-workforce-extension-concept.md`
  - original Workforce extension concept;
  - browser-resident mission/workforce UI;
  - roster, graph, live agent, approvals, audit, evidence, Direction Bar;
  - multi-daemon owner lens;
  - Managers/Crew model;
  - extension is a window, not runtime.

- `Startempire-Wire/focusa/docs/175-focusa-roles-capabilities-spec.md`
  - roles and grounded capability semantics;
  - assignment vs membership vs credential vs execution grant;
  - risk-tier/consent relationships.

- `Startempire-Wire/focusa/docs/173-focusa-secrets-broker-concept.md`
  - early secret-broker/workforce relationship;
  - superseded where Spec 156 is more authoritative, but useful provenance for the original extension concept.

### Current security/authority owner

- `Startempire-Wire/focusa/docs/156-focusa-project-scoped-credential-authority-secret-broker-delegated-autonomy-mfa-totp-and-cross-surface-injection-spec.md`
  - project-scoped credential authority;
  - secret-free projections;
  - delegated autonomy;
  - cross-surface injection and credential grants.

### Workstream / Foreman / attention / voice

- `Startempire-Wire/focusa/docs/164-workstream-rooted-canonical-runtime-design.md`
  - Workstream-rooted runtime and identity boundary.

- `Startempire-Wire/focusa/docs/181-focusa-voice-conversation-expression-and-auditable-interaction-spec.md`
  - voice/conversation semantics;
  - Conversation Ledger;
  - utterance/action lineage;
  - Expression output.

- `Startempire-Wire/focusa/docs/182-focusa-project-foreman-workstream-intelligence-projection-spec.md`
  - persistent Project Foreman;
  - Workstream-scoped responsible intelligence;
  - hydration, worker steering, runtime/model attachment.

- `Startempire-Wire/focusa/docs/183-focusa-radar-proactive-observation-episodes-signal-economics-and-attention-routing-spec.md`
  - Radar observations/episodes/signals;
  - attention routing and proactive observation.

- `Startempire-Wire/focusa/docs/184-focusa-ambient-operator-mobile-wearable-presence-meeting-and-sync-spec.md`
  - mobile/wearable projection;
  - Foreman/Wirebot routing;
  - voice/meeting/presence sync.

- `Startempire-Wire/focusa/docs/181-184-voice-foreman-radar-ambient-operator-current-manifest.md`
  - current series manifest and cross-spec reading map.

### Capability / execution design

- `Startempire-Wire/focusa/docs/151-focusa-frictionless-program-design-runtime-and-agent-capability-fabric-spec.md`
  - canonical operation/capability fabric;
  - Workset/Workpoint binding;
  - structured execution routes;
  - UIAI as canonical browser execution route;
  - agent capability availability and recovery.

- `Startempire-Wire/focusa/docs/139-distributed-presence-environment-awareness-execution-placement-and-multi-daemon-coordination-spec.md`
  - distributed presence and placement;
  - multi-daemon coordination;
  - environment identity and routing.

### Evidence / execution continuity

- `Startempire-Wire/focusa/docs/119-*`
  - Evidence/Receipt/governance-ledger family; resolve exact active source before implementing evidence mutation.

- `Startempire-Wire/focusa/docs/133-silent-sessions-final-release-proof.md`
  - Silent Session implementation/release proof family.

- `Startempire-Wire/focusa/docs/79-focusa-governed-continuous-work-loop.md`
  - governed continuous execution/work-loop semantics.

### Browser/PWA presentation direction

- `Startempire-Wire/focusa/docs/117-mission-deck-onboarding-recall-pwa-spec.md`
  - Mission Deck/PWA baseline.

- `Startempire-Wire/focusa/docs/117a-living-mission-field-pwa-spec.md`
  - richer mission field, transcript river, agent streams, evidence/authority/drift projection.

### Embodiment / physical future

- `Startempire-Wire/focusa/docs/153-physical-world-modeling-measurement-simulation-and-scientific-reasoning-spec.md`
  - physical systems, sensors, actuators, controller, digital twin, robotics boundary.

- `Startempire-Wire/focusa/docs/153a-physical-verification-experimental-settlement-and-high-consequence-scientific-control-addendum.md`
  - consequential physical-actuation verification and settlement.

- `Startempire-Wire/focusa/docs/153b-focusa-agent-embodiment-body-profile-and-transfer-addendum.md`
  - body is not identity;
  - body profiles and BodyBinding;
  - cross-body continuity;
  - humanoid/robotic body trajectory.

- `Startempire-Wire/focusa/docs/current/FOCUSA_BRAIN_BODY_ANALOGY_GAP_MAP.md`
  - whole-organism model;
  - senses, motor/action body, homeostasis, learning, actuator taxonomy.

---

## 2. Veragensia — Agent Computer, Chromebook, cloud/runtime, bodies

- `Startempire-Wire/veragensia/docs/182-veragensia-focusa-agent-os-spec.md`
  - Veragensia product/Agent Computer architecture;
  - Focusa/UIAI/Pi/default full-profile composition;
  - surfaces interchangeable, primitives platform.

- `Startempire-Wire/veragensia/docs/186-veragensia-v0.1-native-chromebook-release-spec.md`
  - constrained Chromebook/native proof;
  - private Chromium/Workforce requirement;
  - low-resource behavior;
  - build unavailable artifacts elsewhere.

- `Startempire-Wire/veragensia/docs/188-veragensia-v0.1-decisions-and-integration-contracts.md`
  - native integration contracts;
  - UIAI/Pi/Focusa boundaries;
  - browser/computer execution relationships.

- `Startempire-Wire/veragensia/docs/190-veragensia-agent-first-software-and-capability-resolution-spec.md`
  - Agentability and capability-first software resolution.

- `Startempire-Wire/veragensia/docs/191-veragensia-elastic-agent-computing-and-cloud-runtime-spec.md`
  - local body / cloud body;
  - Full Agent Computer, workcells, Silent Sessions, Agent Apps, browser contexts;
  - TopologyGrant;
  - elastic workforce/capacity.

- `Startempire-Wire/veragensia/docs/193-veragensia-execution-substrate-workload-identity-and-capability-enforcement-spec.md`
  - ExecutionPrincipal / WorkloadIdentity / EnforcementPlan;
  - machine enforcement;
  - Human Control Reserve.

- `Startempire-Wire/veragensia/docs/194-veragensia-trusted-human-control-secure-attention-and-desktop-observation-spec.md`
  - Secure Attention;
  - DesktopObservation;
  - ComputerControlLease;
  - operator takeover/reconciliation.

- `Startempire-Wire/veragensia/docs/195-veragensia-resource-identity-runtime-incarnation-and-state-transfer-spec.md`
  - ResourceRef;
  - RuntimeIncarnation;
  - replicas/writer fencing;
  - local/cloud migration and state transfer.

- `Startempire-Wire/veragensia/docs/196-veragensia-platform-runtime-trust-*`
  - platform/runtime trust family; resolve exact current filename before implementation dependency.

- `Startempire-Wire/veragensia/docs/197-veragensia-voice-native-agent-computer-audio-ui-and-conversation-continuity-spec.md`
  - voice-complete Agent Computer;
  - keyboard/mouse optional;
  - trusted audio and conversation continuity.

- `Startempire-Wire/veragensia/docs/199-veragensia-ambient-operator-companion-sync-and-omarchy-integration-spec.md`
  - ambient/mobile sync and native service topology;
  - `veragens-sessiond`, `veragens-audiod`, `veragens-syncd` direction.

- `Startempire-Wire/veragensia/docs/200-veragensia-living-agent-computer-implementation-tranche-plan.md`
  - implementation sequencing and vertical-slice philosophy.

- `Startempire-Wire/veragensia/docs/201-veragensia-agent-body-profiles-embodiment-and-transfer-addendum.md`
  - integrated existing computer vs Full Agent Computer;
  - AgentBody runtime projection;
  - body transfer/concurrency;
  - robotic/humanoid body and cloud augmentation.

### Deployment evidence

Veragensia deployment tooling currently proves that a real extension build exists outside published GitHub source and is used by `os.focusa.dev`. The migration runbook in this repo owns recovery/cutover.

---

## 3. Wirebot App — product boundary and partner relationship

- `Startempire-Wire/Wirebot-App/docs/04-wirebot-app-system-map.md`
  - Wirebot as persistent life-and-business operating partner;
  - one Web/PWA/Desktop/Mobile family;
  - Focusa/UIAI/Veragensia remain distinct specialist products;
  - Systems & Workforce is a Wirebot domain projection, not ownership of Workforce runtime.

- `Startempire-Wire/Wirebot-App/docs/06-wirebot-app-primary-surfaces-and-operational-slice.md`
  - current IA;
  - Systems & Workforce, Work & Results, Devices & Sessions;
  - specialist-product scoped handoff;
  - UIAI/Focusa/Veragensia convergence boundaries.

- `Startempire-Wire/Wirebot-App/docs/10-wirebot-body-independent-partner-continuity-addendum.md`
  - Wirebot relationship independent of hardware body;
  - body transfer consumed through Focusa/Veragensia ownership.

---

## 4. Agent-Driven Life & Business OS — ecosystem/product convergence

Relevant supporting architecture includes:

- `Startempire-Wire/agent-driven-life-business-os/docs/agent-os-golden-path/04-agent-os-golden-path-ecosystem-topology-map.*`
  - ecosystem topology and deployment ownership.

- `Startempire-Wire/agent-driven-life-business-os/docs/agent-os-golden-path/06-wirebot-product-ui-options-inventory-and-consolidation-audit.md`
  - historical/current UI ownership audit;
  - identifies Focusa browser Workforce concept separately from Wirebot extension and UIAI browser tooling.

Use this repo for ecosystem convergence context, not to override primitive-owning Focusa/Veragensia contracts.

---

## 5. Reading order for Workforce implementation

### Essential first

```text
Focusa 174
→ Focusa 175
→ Focusa 164
→ Focusa 182
→ Focusa 156
→ Focusa 151
→ Veragensia 191
→ Veragensia 193/194/195
→ Wirebot 04/06
→ Workforce docs/00
```

### Chromebook slice

```text
Workforce docs/02
→ Veragensia 186
→ Veragensia 188
→ Veragensia 191
→ Veragensia 193
```

### Voice

```text
Focusa 181
→ Veragensia 197
→ Focusa 184
→ Veragensia 199
```

### Body/topology projection

```text
Focusa 139
→ Veragensia 191
→ Veragensia 195
→ Focusa 153B
→ Veragensia 201
```

---

## 6. Collation policy

Do not manually fork these specifications into competing rewritten copies.

If synchronized snapshots are added under `docs/upstream/`, every snapshot MUST include:

```text
source repository
source path
source commit SHA
sync timestamp
```

and MUST be treated as a convenience snapshot only.

A newer primitive-owning source always wins.

---

## 7. Implementation principle

Read enough upstream material to preserve ownership, then implement.

Do not turn the corpus into a process trap. The purpose of this map is to prevent architectural duplication while allowing the extension to move quickly.
