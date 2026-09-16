# Focusa Workforce — Extension Runtime, Data, and Integration Contracts

**Status:** CURRENT implementation contract  
**Depends on:** Workforce canonical product spec, Focusa generated contracts, ADLBOS shared seam contracts, Wirebot App convergence, UIAI/Veragensia owning contracts.

---

## 0. Architectural rule

The extension is a **projection and intent client**.

It may cache bounded state for responsiveness, but it does not become the canonical owner of:

```text
Workstreams
Foremen
worker/task state
approvals
Evidence
credentials
authority/budgets
conversation truth
runtime/body state
entitlements
federation state
Operating Partner identity
```

Every consequential operation resolves through its owning product contract.

---

## 1. MV3 process model

Target runtime shape:

```text
Manifest V3 Extension

service worker
  ├─ environment/pairing registry
  ├─ scoped auth handles
  ├─ shared Workforce runtime client
  ├─ event stream coordinator
  ├─ normalized snapshot/cache
  ├─ notification/attention broker
  ├─ command/context-menu router
  ├─ surface-handoff router
  └─ migration/version coordinator

side panel
  └─ compact live collaboration

full app
  └─ deep workforce operations

start page
  └─ optional orientation / return surface

wall
  └─ optional read-only situational projection

options/settings
  └─ pairing / preferences / diagnostics

content script
  └─ minimal explicit page-context capture/actions
```

The service worker may be suspended/restarted. Durable work never depends on keeping it alive.

The redesign should move daemon/event/snapshot coordination toward the shared runtime client instead of having every page independently reinvent connectivity/state.

---

## 2. Local extension state

```ts
WorkforceLocalState {
  schemaVersion
  activeEnvironmentId
  activeProjectRef?
  activeWorkstreamRef?
  activeForemanRef?
  environments[]
  preferences
  projectionCache
  eventCursors
  uiState
  partnerPresentationCache?
}
```

Allowed local state:

```text
paired environment metadata
scoped extension auth material/handles
UI preferences
selected project/workstream
last known bounded projections
last stream cursor/epoch
release/build diagnostics
bounded partner presentation cache
```

Forbidden local canonical authority:

```text
Workpoint/work/task reducer state
worker employment/assignment authority
approval truth
Evidence truth
credential grants
budget authority
Foreman/partner memory
Conversation Ledger
TopologyGrant
entitlement grants
federation grants
```

---

## 3. Environment and fleet model

```ts
WorkforceEnvironment {
  environmentId
  label
  endpoint
  environmentClass: 'local' | 'private' | 'cloud_agent_computer' | 'public_demo'
  nodeRef?
  daemonRef?
  ownerRef?
  deploymentRef?
  pairingState
  authRef?
  focusaVersion?
  contractVersion?
  health
  freshness
  lastConnectedAt?
  capabilities[]
}
```

One browser may pair with multiple environments belonging to the same authorized owner/Operator context.

Every projected entity retains source environment/daemon identity.

Call this **fleet / multi-daemon aggregation**.

Do not call it sovereign federation.

Cross-Operator federation is a separate Startempire/network trust boundary and is projected only through the owning federation contracts.

---

## 4. Pairing

Conceptual client requirements:

```ts
PairingRequest {
  deviceId
  extensionVersion
  browserClass
  requestedScopes[]
  nonce
}
```

```ts
PairingResult {
  environmentId
  nodeRef
  daemonRef
  credentialRef
  grantedScopes[]
  focusaVersion
  contractVersion
  capabilities[]
  expiresAt?
}
```

These shapes are client requirements only. Exact wire schemas come from the current Focusa/generated pairing registry.

Rules:

- discovery is not authentication;
- browser permission is not Focusa authority;
- each client device has scoped/revocable identity;
- pairing one environment does not authorize another;
- pairing does not merge reducer state;
- credentials never travel in handoff URLs.

---

## 5. Operating Partner projection

Workforce is Operator-neutral and may display a customer-selected partner presentation.

Use the ADLBOS `operator.partner_profile.v1` family.

Conceptual projection:

```ts
OperatingPartnerProjection {
  ownerRef
  partnerRef
  implementationFamily
  displayName
  avatarRef?
  voiceProfileRef?
  brandRef?
  deploymentRef?
  networkPresentationRef?
  freshness
}
```

This is presentation/relationship context, not an architecture-authority claim.

Changing `displayName` does not create a new `partnerRef`.

---

## 6. Workforce snapshot

The UI consumes normalized bounded projections rather than arbitrary raw API responses.

```ts
WorkforceSnapshot {
  source
  revision
  generatedAt
  freshness

  owner
  operatingPartner?

  projects[]
  workstreams[]
  foremen[]
  agents[]
  work[]
  attention[]
  evidence[]
  auditTail[]
  topology[]

  radarSummary?
  resourcePosture?
  federationPosture?
  capabilityPosture?
}
```

Each entity keeps upstream refs intact.

`attention[]` replaces any temptation to invent a parallel generic approval store in the client.

---

## 7. Core projected entities

### 7.1 Foreman

```ts
ForemanProjection {
  foremanRef
  workstreamRef
  projectRef
  displayName
  roleRef
  status
  runtimeAttachment?
  currentWorkpointRef?
  workerRefs[]
  attentionRefs[]
  lastEvidenceRef?
  health
  freshness
}
```

### 7.2 Agent / worker

```ts
AgentProjection {
  agentRef
  roleRef
  displayName
  class: 'foreman' | 'manager' | 'worker' | 'verifier' | 'specialist'
  assignmentRef?
  workstreamRef
  executionRef?
  runtimeRef?
  bodyRef?
  status
  budgetPosture?
  capabilityRefs[]
  authorityPosture?
  lastEventAt?
  lastEvidenceRef?
}
```

### 7.3 Work

```ts
WorkProjection {
  workRef
  parentRefs[]
  childRefs[]
  workstreamRef
  workpointRef?
  ownerAgentRef?
  objective
  acceptanceRefs[]
  state
  blockedReason?
  attentionRef?
  evidenceRefs[]
  executionRef?
  correlationRef?
  startedAt?
  updatedAt
}
```

### 7.4 Evidence

```ts
EvidenceProjection {
  evidenceRef
  workRef?
  workpointRef?
  sourceRef
  type
  title
  verificationState
  freshness
  artifactRef?
  previewRef?
  receiptRef?
  closureRef?
  capturedAt
}
```

### 7.5 Topology

```ts
TopologyProjection {
  runtimeRef
  bodyRef?
  nodeRef
  class
  label
  locationClass
  health
  trustClass?
  enforcementClass?
  capabilities[]
  activeAgentRefs[]
  resourcePosture?
  spendPosture?
}
```

---

## 8. Shared attention / Needs You

Workforce consumes ADLBOS `operator.attention.v1`.

Conceptual projection:

```ts
AttentionProjection {
  attentionRef
  sourceOwner
  sourceRef
  ownerRef
  projectRef?
  workstreamRef?
  workRef?

  class:
    | 'approval'
    | 'owner_truth'
    | 'authentication'
    | 'takeover'
    | 'blocker'
    | 'budget_resource'
    | 'recovery'
    | 'opportunity'

  summary
  consequence?
  urgency?
  expiresAt?
  primaryActionRef?
  freshness
}
```

Rules:

1. The source product owns the underlying decision/state.
2. Workforce may render and route it.
3. Wirebot may render the same source item at owner-wide altitude.
4. Resolution must be correlated back to the source object.
5. Do not create a second approval merely because Workforce needs a card.

---

## 9. Event envelope

```ts
WorkforceEvent {
  sourceEnvironmentId
  sourceDaemonRef?
  streamEpoch
  sequence
  eventId
  eventType
  occurredAt
  receivedAt
  entityRef?
  projectRef?
  workstreamRef?
  revision?
  correlationRef?
  payload
}
```

Rules:

- deduplicate where upstream semantics permit;
- detect sequence gaps;
- mark affected projection stale;
- resnapshot rather than invent missing state;
- persist cursor only where upstream supports replay safely;
- never replay mutations from event history;
- restart/suspension must not create duplicate work.

---

## 10. Freshness

Remote projections resolve to:

```text
fresh
stale
unknown
unavailable
incompatible
```

`fresh` does not itself mean authorized.

A fresh cache of old source data does not make the source fresh.

Mutations against stale consequential state should preflight/resnapshot according to owning operation contracts.

---

## 11. Direction intent

Workforce submits typed intent, not an execution grant.

```ts
DirectionIntent {
  requestId
  environmentId
  ownerRef?
  partnerRef?
  projectRef
  workstreamRef
  foremanRef?
  text
  source: 'typed' | 'voice' | 'context_menu' | 'page_selection'
  browserContextRef?
  utteranceRef?
  correlationRef?
  submittedAt
}
```

Focusa resolves intent to proposal/work/operation according to current authority and work contracts.

Where scope is ambiguous and material, show the resolved scope before consequential dispatch.

Do not add confirmation merely for ceremony when current authority and scope are already unambiguous.

---

## 12. Mutation intent

```ts
MutationIntent {
  clientRequestId
  operationId
  environmentId
  scopeRef
  targetRefs[]
  expectedRevision?
  idempotencyKey?
  correlationRef?
  params
}
```

Rules:

- use operation registry/generated schemas;
- local validation is UX, server remains authority;
- preserve client request ID/correlation for reconciliation;
- retry only if operation semantics prove safe/idempotent;
- ambiguous result → inspect current state before replay;
- do not widen authority to make an operation succeed.

---

## 13. Attention decision / approval response

When the source item is a Focusa approval, the owning operation may accept a shape such as:

```ts
ApprovalDecisionIntent {
  clientRequestId
  approvalRef
  decision: 'approve' | 'deny' | 'defer'
  expectedRevision?
  operatorComment?
  correlationRef?
}
```

The extension does not manufacture approval state.

For non-approval attention classes, use the owning product's typed operation through the source reference.

---

## 14. Exact surface handoff

Use ADLBOS `operator.surface_handoff.v1`.

Conceptual shape:

```ts
SurfaceHandoff {
  schema
  sourceSurface
  targetSurface

  ownerRef
  partnerRef?
  environmentRef?
  projectRef?
  workstreamRef?
  foremanRef?
  workRef?
  agentRef?
  attentionRef?
  evidenceRef?
  executionRef?
  runtimeRef?
  bodyRef?

  intent:
    | 'inspect'
    | 'direct'
    | 'review'
    | 'approve'
    | 'watch'
    | 'intervene'

  correlationRef?
  returnSurfaceRef?
  issuedAt
  expiresAt?
}
```

Rules:

- refs + intent only;
- no broad credentials/tokens in URLs;
- target resolves refs fresh;
- unsupported refs fail clearly rather than opening unrelated default state;
- deep links preserve exact user context.

---

## 15. UIAI execution link

Workforce may project a UIAI-owned execution pointer:

```ts
UIAIExecutionLink {
  executionRef
  surfaceHandoffRef?
  cockpitRoute?
  browserContextRef?
  controlLeaseRef?
  observationRef?
  evidenceRefs[]
  health
  freshness
}
```

Workforce does not operate UIAI private control machinery directly unless UIAI exposes the exact governed operation for that client.

Human takeover/release must follow UIAI fencing/re-observation/reconciliation rules.

---

## 16. Correlation

Use ADLBOS `operator.correlation.v1` to connect causal work without centralizing product state.

Minimum useful reference family may include:

```text
ownerRef
partnerRef
assignmentRef
projectRef
workstreamRef
foremanRef
workRef
workpointRef
agentRef
sessionRef
executionRef
evidenceRefs
receiptRefs
outcomeRef
```

Not every operation carries every ref.

A correlation envelope is not a new canonical object store.

---

## 17. Capability posture / contextual expansion

Consume ADLBOS `operator.capability_posture.v1`.

```ts
CapabilityPosture {
  capabilityRef
  providerRef
  supported
  entitled
  activationState
  authorityPosture?
  availability
  setupRef?
  expansionRef?
  freshness
}
```

The extension may display:

```text
UIAI supported but not entitled
Cloud Agent Computer entitled but not activated
Capability active but worker not authorized
```

Never infer authority from commercial entitlement.

Commercial metadata/pricing stays with the owning commerce/product system.

---

## 18. Closure

Consume ADLBOS `operator.closure.v1` to connect refs across:

```text
execution
Evidence
verification
Focusa settlement/receipt
accepted outcome
W.I.N.S.
optional MeriFolio standing
```

Workforce uses this to explain confidence/proof without becoming the W.I.N.S. or MeriFolio authority.

---

## 19. Browser page context

Default explicit context:

```text
page URL
page title
selected text after explicit action
browser-local tab/window identifier
```

Do not ambiently collect:

```text
full page bodies
form values
password fields
cookies
all tabs/history
clipboard
```

unless a separately authorized owning feature explicitly requires it.

Page context is data/evidence candidate, never authority.

---

## 20. Context-menu operations

Initial useful commands:

```text
Ask Foreman about this page
Send page to Foreman
Research this page
Capture selection as Evidence candidate
Open page in UIAI
Create work proposal from selection
```

Each operation resolves exact environment/project/Workstream.

If safe scope cannot be resolved, ask the user to choose rather than dispatch globally.

---

## 21. Notifications

Notifications contain only enough information to decide whether to open Workforce.

Avoid leaking project/client/sensitive content into OS notification surfaces by default.

Actions deep-link to exact source attention/work/evidence via a handoff ref.

Routine agent activity should not create owner-notification noise.

---

## 22. Voice

Voice is an input modality to the same Direction/attention/operation contracts.

It does not create separate actuator or authorization semantics.

A voice utterance should retain an attributable utterance/conversation reference where the owning Focusa Conversation contract provides one.

---

## 23. Sovereign federation posture

Workforce may display bounded network posture supplied by the owning Startempire/federation layer:

```text
private
available
federated
federation_degraded
```

It may also show selected workforce-relevant opportunities/collaboration refs.

It does not implement the federation trust protocol itself.

Federation never grants ambient access to private Operator state.

---

## 24. Security laws

1. Least privilege at browser, product and runtime layers.
2. Never store raw long-lived secrets in extension logs/cache/source.
3. Never put credentials in handoff URLs.
4. Entitlement is not authority.
5. Pairing is not global authorization.
6. UIAI control lease is not Focusa cognitive authority.
7. Network membership is not federation grant.
8. Public worker standing is not private Operator access.
9. Stale state cannot be silently presented as current truth.
10. Unknown outcome triggers reconciliation, not optimistic success.

---

## 25. Design constraint for implementation

The existing extension's lower-level modules should remain reusable where they already enforce these laws.

The redesign should centralize shared runtime/event/projection state while keeping UI components as presenters/intent emitters.

No presentation framework migration is permission to redesign upstream contracts.
