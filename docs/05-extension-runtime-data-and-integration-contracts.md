# Focusa Workforce — Extension Runtime, Data, and Integration Contracts

**Status:** implementation contract  
**Depends on:** docs/00, Focusa Specs 151/156/164/174/175/181/182/183, Veragensia Docs 191/193/194/195/201

---

## 0. Architectural rule

The extension is a **projection and intent client**.

It may cache bounded state for responsiveness, but it does not become the canonical owner of Workstreams, Foremen, worker state, Evidence, approvals, topology, or conversation truth.

---

## 1. MV3 process model

```text
Manifest V3 Extension

service worker
  ├─ environment/pairing registry
  ├─ auth token broker (scoped extension credential)
  ├─ Focusa clients
  ├─ event stream coordinator
  ├─ snapshot cache
  ├─ notification broker
  ├─ command/context-menu router
  ├─ UIAI deep-link router
  └─ migration/version coordinator

side panel
  └─ compact workforce projection + Direction Bar

full app page
  └─ full roster/work/approvals/evidence/audit/topology

start page (optional)
  └─ operational briefing / quick direction

options/settings
  └─ pairing / channels / preferences / diagnostics

content script (minimal)
  └─ current page metadata and explicit capture/context actions
```

The service worker must tolerate suspension/restart. Durable work cannot depend on keeping it alive.

---

## 2. Local extension state

### 2.1 `WorkforceLocalState`

```ts
WorkforceLocalState {
  schemaVersion
  activeEnvironmentId
  activeProjectRef?
  activeWorkstreamRef?
  environments[]
  preferences
  projectionCache
  eventCursors
  uiState
}
```

### 2.2 Allowed local state

```text
paired environment metadata
scoped extension auth handle/material
UI preferences
last selected project/workstream
last known bounded projection
last event cursor/epoch
release/build diagnostics
```

### 2.3 Forbidden local authority

Do not use browser storage as canonical storage for:

```text
Workpoint state
agent/task state
approval state
Evidence truth
credential grants
budget authority
Foreman memory
Conversation Ledger
TopologyGrant
```

---

## 3. Environment model

```ts
WorkforceEnvironment {
  environmentId
  label
  endpoint
  environmentClass: 'local' | 'private' | 'cloud_agent_computer' | 'public_demo'
  nodeRef?
  daemonRef?
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

One browser may pair with multiple environments.

Every projected item must retain its source environment/daemon identity.

---

## 4. Pairing contract

Conceptual request:

```ts
PairingRequest {
  deviceId
  extensionVersion
  browserClass
  requestedScopes[]
  nonce
}
```

Conceptual response:

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

The exact wire schema must be taken from current Focusa pairing contracts. These shapes define client needs, not permission to invent parallel server APIs.

---

## 5. Snapshot model

The UI consumes a normalized projection rather than arbitrary raw API responses.

```ts
WorkforceSnapshot {
  source
  revision
  generatedAt
  freshness
  owner
  projects[]
  workstreams[]
  foremen[]
  agents[]
  work[]
  approvals[]
  evidence[]
  auditTail[]
  topology[]
  radarSummary?
  resourcePosture?
}
```

Each entity keeps upstream refs intact.

---

## 6. Core projected entities

### 6.1 Foreman

```ts
ForemanProjection {
  foremanRef
  workstreamRef
  projectRef
  displayName
  roleRef
  status
  runtimeAttachment
  currentWorkpointRef?
  workerRefs[]
  attention[]
  lastEvidenceRef?
  health
  freshness
}
```

### 6.2 Agent/worker

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

### 6.3 Work item

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
  approvalRef?
  evidenceRefs[]
  executionRef?
  startedAt?
  updatedAt
}
```

### 6.4 Approval

```ts
ApprovalProjection {
  approvalRef
  actorRef
  operationRef
  targetRefs[]
  workstreamRef
  consequenceClass
  summary
  materialEffects[]
  reversibility
  evidenceRefs[]
  state
  expiresAt?
}
```

### 6.5 Evidence

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
  capturedAt
}
```

### 6.6 Topology/body

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

## 7. Event envelope

The normalized client event envelope should preserve upstream identity:

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
  workstreamRef?
  revision?
  payload
}
```

Event handling laws:

1. Ignore duplicate `eventId`/sequence where semantics allow.
2. Detect sequence gaps.
3. Mark affected projections stale after a gap.
4. Resnapshot rather than guessing missing mutations.
5. A service-worker restart may lose in-memory state; resume using persisted cursor only if upstream contract supports it.
6. Never replay mutation requests from event history.

---

## 8. Freshness model

Every remote projection should resolve to one of:

```text
fresh
stale
unknown
unavailable
incompatible
```

UI rules:

- `fresh`: normal actions according to authority.
- `stale`: show stale marker; mutation may require resnapshot/preflight.
- `unknown`: do not claim current state.
- `unavailable`: dependency/source offline.
- `incompatible`: version/contract mismatch; explain upgrade path.

---

## 9. Direction request

The extension creates a typed **intent request**, not an execution grant.

```ts
DirectionIntent {
  requestId
  environmentId
  projectRef
  workstreamRef
  foremanRef?
  text
  source: 'typed' | 'voice' | 'context_menu' | 'page_selection'
  browserContextRef?
  utteranceRef?
  submittedAt
}
```

Server/Focusa resolves this into proposal/operation/work according to current contracts.

The UI must display resolved scope before consequential dispatch where ambiguity exists.

---

## 10. Mutation envelope

Every extension-originated mutation needs:

```ts
MutationIntent {
  clientRequestId
  operationId
  environmentId
  scopeRef
  targetRefs[]
  expectedRevision?
  idempotencyKey?
  params
}
```

Client rules:

- use operation registry/generated schemas;
- validate locally for UX, server remains authority;
- preserve `clientRequestId` for reconciliation;
- automatic retry only if operation contract proves idempotency or safe retry;
- ambiguous response -> reconcile current state before another mutation.

---

## 11. Approval decision

```ts
ApprovalDecisionIntent {
  clientRequestId
  approvalRef
  decision: 'approve' | 'deny' | 'defer'
  expectedRevision?
  operatorComment?
}
```

The extension never manufactures an approval because an action looks risky. It renders/answers the owning authority decision flow.

---

## 12. UIAI link contract

Workforce needs an exact, typed pointer:

```ts
UIAIExecutionLink {
  executionRef
  cockpitUrlOrRoute
  browserContextRef?
  controlLeaseRef?
  observationRef?
  evidenceRefs[]
  health
}
```

Opening UIAI must preserve the exact work/execution context.

Do not pass broad credentials in URLs.

---

## 13. Browser page context

Content-script collection must be minimal and explicit.

Default allowed context:

```text
page URL
page title
selected text only after explicit user action
basic tab/window identifier local to browser
```

Do not ambiently capture:

```text
page bodies
form values
password fields
cookies
browser history
all tabs
clipboard
```

unless a separately authorized feature and owning contract explicitly requires it.

Page context produces **data/evidence candidate**, never authority.

---

## 14. Context-menu operations

Initial commands:

```text
Ask Foreman about this page
Send page to Foreman
Research this page
Capture selection as evidence candidate
Open page in UIAI
Create work proposal from selection
```

Each command resolves exact active environment/project/workstream. If scope is not safe to infer, the extension asks the user to choose rather than dispatching globally.

---

## 15. Notifications

Notification payload must contain only enough information to decide whether to open Workforce.

Do not leak sensitive project/credential/content details into ChromeOS notifications by default.

Notification action should deep-link to exact approval/work/evidence context.

---

## 16. Voice adapter

```ts
VoiceCaptureState {
  state: 'idle' | 'listening' | 'transcribing' | 'review' | 'submitting' | 'error'
  conversationRef?
  utteranceRef?
  interimText
  finalText
  confidence?
}
```

Voice provider credentials should be brokered according to product architecture; do not expose reusable provider secrets in ordinary extension code when avoidable.

---

## 17. Extension message bus

Use explicit typed message families between extension contexts:

```text
environment.*
pairing.*
snapshot.*
events.*
direction.*
approval.*
evidence.*
uiai.*
voice.*
preferences.*
diagnostics.*
```

Messages must be schema-versioned where persisted or externally exposed.

Avoid a generic `{ method, payload }` RPC that can become an arbitrary privileged backdoor.

---

## 18. Diagnostics

A private diagnostics page should expose:

```text
extension version/commit/channel
browser version
paired environments
Focusa versions/contracts
event-stream state/cursor/epoch
last snapshot age
storage schema version
UIAI link health
local bridge health if configured
recent bounded errors
```

Never print raw credentials/tokens.

---

## 19. Storage/security requirements

- minimize token scope and lifetime;
- redact secrets from logs/errors;
- clear revoked environment credentials promptly;
- separate public-demo from private credentials;
- encrypt/protect at rest only using actually supported browser/platform mechanisms; do not claim stronger protection than Chrome provides;
- use Content Security Policy compatible with MV3;
- no remote arbitrary code execution;
- no `eval`/dynamic untrusted script injection;
- sanitize rendered remote content.

---

## 20. Contract-generation direction

Where Focusa exposes generated machine-readable operation schemas, Workforce should generate/consume client types from them rather than hand-maintaining divergent request definitions.

Preferred flow:

```text
Focusa operation registry
→ versioned contract bundle
→ Workforce client generation/validation
→ CI compatibility test
```

Local wrapper types may improve UI ergonomics but must retain upstream operation IDs and refs.

---

## 21. Implementation acceptance

This runtime layer is ready when:

1. multiple environments can pair and remain distinguishable;
2. snapshot + events converge after reconnect;
3. stale/gap handling never fabricates freshness;
4. Direction sends exact scope;
5. approvals reconcile exact state;
6. UIAI deep-link opens exact execution;
7. browser context actions cannot widen authority;
8. extension restart does not duplicate work;
9. diagnostics explain connection/version failures without exposing secrets.
