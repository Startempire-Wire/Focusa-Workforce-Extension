# Focusa Workforce — Slice 1 Implementation Blueprint

**Slice:** Workstream + Foreman + Direction  
**Status:** READY FOR IMPLEMENTATION DISCOVERY / VERTICAL SLICE  
**Parent blueprint:** `08-workforce-redesign-blueprint.md`  
**Do not modify:** Wirebot App docs from this workstream.

Slice 1 establishes the product’s core mental model:

```text
exact Workstream
→ accountable Foreman
→ current objective/frontier
→ human Direction
→ governed Focusa operation
→ visible source-backed result
```

If this slice does not work against real Focusa state, do not hide the gap behind mock architecture.

---

## 1. Outcome

The side panel and a simple full-page Workforce surface must let a user:

1. select an authorized Focusa environment;
2. resolve/select a Project/Workstream;
3. see the accountable Foreman projection for that Workstream;
4. see the objective/current frontier/freshness;
5. type a direction scoped to that exact Workstream/Foreman;
6. submit through the owning Focusa operation;
7. see accepted / clarification / proposed / dispatched / blocked / denied / stale result honestly;
8. reload/reopen without losing selected scope;
9. survive temporary daemon/network loss without inventing current state.

This is the smallest slice that makes the extension feel like **operating a workforce** rather than observing infrastructure.

---

## 2. Important upstream truth

Focusa Spec 182 currently defines the Project Foreman semantics and proposed operation family:

```text
foreman.resolve
foreman.view
foreman.hydrate
foreman.status
foreman.explain
foreman.work.list
foreman.worker.list
foreman.worker.delegate
foreman.worker.steer
foreman.worker.pause
foreman.worker.stop
...
```

However, Spec 182 is still a draft architecture direction and the current generated API inventory does not by itself prove those Foreman operations are implemented/mounted.

Therefore:

> **Do not invent `/v1/foreman/...` endpoints in the extension.**

The build agent must first inspect current Focusa generated operations/routes/contracts and choose one of these paths:

```text
A. Foreman/Workstream operations already exist
   → consume generated contracts directly

B. equivalent Workstream-rooted projection exists under another current operation
   → write a thin Workforce adapter with exact provenance

C. required owning operation is genuinely missing
   → implement the smallest owning Focusa operation/adapter first
   → then consume it from Workforce
```

Client-side synthesis from unrelated endpoints is not a substitute for a missing canonical Foreman contract.

---

## 3. Existing extension code to preserve

Do not rewrite proven safety/reconciliation logic merely to introduce Svelte.

Preserve/reuse where correct:

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

Current `api-client.mjs` already proves the correct pattern:

```text
bounded response
schema validation
401 / 403 / unsupported / degraded distinction
exact paired token
read:* projection permission
```

Extend that pattern rather than bypassing it.

---

## 4. Do not over-centralize MV3 runtime

The long-term architecture uses a shared Workforce runtime client, but MV3 service workers can suspend.

Slice 1 MUST NOT depend on keeping the background service worker continuously alive for canonical state or SSE continuity.

Recommended initial shape:

```text
shared Workforce client library
  ├─ projection fetch
  ├─ selection persistence
  ├─ freshness/reconciliation
  └─ event adapter where currently supported

visible side panel / full app
  └─ instantiate client while active

background service worker
  ├─ side-panel / command routing
  ├─ handoff routing
  └─ bounded shared browser coordination

chrome.storage.local
  └─ selected context + bounded projection cache + cursor metadata
```

If later requirements justify an offscreen/persistent event mechanism, add it deliberately. Do not introduce keepalive hacks in Slice 1.

---

## 5. Minimal Svelte introduction

Recommended dependencies:

```text
svelte
vite
@sveltejs/vite-plugin-svelte
```

Use pnpm if/when package management is introduced consistently.

Do **not** introduce SvelteKit.

### Build requirement

The current build script validates manifest permissions and then copies `src/` to `dist/`.

The Svelte migration must preserve these invariants:

```text
exact permissions: activeTab, sidePanel, storage
no persistent host_permissions
bounded optional http(s) origins
background.mjs remains MV3 service worker
sidepanel.html remains declared side-panel entry
startpage.html remains new-tab entry
stable extension ID/load path behavior
FOCUSA_BRAND substitution behavior
FOCUSA_PUBLIC_NEWTAB behavior
```

Do not replace the build pipeline in one shot.

Preferred migration:

1. add a deterministic UI bundle step;
2. keep existing manifest validation/copy/brand/public-demo logic;
3. emit Svelte assets into the expected extension `dist` tree;
4. preserve legacy surfaces until replaced.

---

## 6. Proposed Slice 1 source shape

Keep this small:

```text
src/
├── lib/                         existing core
├── runtime/
│   ├── workforce-client.mjs
│   └── selection.mjs
├── ui/
│   ├── components/
│   │   ├── EnvironmentHeader.svelte
│   │   ├── WorkstreamSelector.svelte
│   │   ├── ForemanCard.svelte
│   │   ├── DirectionBar.svelte
│   │   ├── FreshnessBadge.svelte
│   │   └── OperationResult.svelte
│   ├── sidepanel/
│   │   ├── App.svelte
│   │   └── main.js
│   └── workforce/
│       ├── App.svelte
│       └── main.js
├── sidepanel.html
└── workforce.html
```

Do not create generic component libraries or design-system packages before the slice works.

---

## 7. Shared selected context

Define one extension-owned **selection**, not canonical work state:

```js
{
  environmentId,
  projectRef,
  workstreamRef,
  foremanRef,
  updatedAt
}
```

Rules:

- selection may persist in `chrome.storage.local`;
- deep handoff may update selection;
- selection does not grant access;
- Workstream/Foreman refs are typed/source-qualified according to ADLBOS `CROSS_PRODUCT_SEAM_CONTRACT.md`;
- source is revalidated after reconnect or before consequential mutation.

---

## 8. Slice 1 projection contract

The UI needs a normalized local projection, but the fields remain source-owned.

Conceptual:

```js
{
  schema: 'focusa.workforce.foreman_view.v1',
  source: {
    environmentRef,
    daemonRef,
    revision,
    observedAt,
    freshness
  },
  project: {
    projectRef,
    displayName
  },
  workstream: {
    workstreamRef,
    displayName,
    objective,
    state
  },
  foreman: {
    foremanRef,
    displayName,
    roleRef,
    currentWorkpointRef,
    status,
    health
  },
  frontier: {
    summary,
    readyCount,
    blockedCount
  },
  attentionSummary,
  lastEvidenceRef
}
```

This is a **client projection contract** only.

Do not make it a new server authority if Focusa already has/generated equivalent schemas.

---

## 9. Side-panel UX

First functional screen:

```text
┌─────────────────────────────┐
│ FOCUSA WORKFORCE   ● Fresh  │
│ Operator / environment      │
├─────────────────────────────┤
│ Project / Workstream     ▾  │
├─────────────────────────────┤
│ FOREMAN                     │
│ Customer Testing            │
│ Fix login regression        │
│ Current: reproduce + patch  │
│                             │
│ [ Direct Foreman… ]    🎙*  │
│                             │
│ Last verified               │
│ Baseline parity ✓           │
├─────────────────────────────┤
│ Open Workforce              │
└─────────────────────────────┘
```

`🎙` can remain disabled/hidden until the voice slice; do not implement a fake voice path.

### Required states

```text
unpaired
connecting
loading
ready/fresh
stale
offline
unauthorized
incompatible
no project/workstream
operation pending
operation accepted
operation clarification required
operation blocked/denied
operation outcome unknown/reconciling
```

---

## 10. Foreman card behavior

Primary content:

```text
Workstream name
objective
Foreman display identity
current Workpoint/frontier summary
freshness
last meaningful Evidence
```

Secondary expandable detail:

```text
exact refs
role profile
runtime attachment
source revision
authority posture if available
health
```

Never lead with model/provider/session identity.

If the Foreman contract is not yet implemented, render the missing capability honestly instead of labeling a Silent Session as “Foreman.”

---

## 11. Workstream selector

The selector must distinguish:

```text
Environment
Project
Workstream
```

but should avoid three noisy dropdowns when context can be represented as one compact chooser.

Suggested label:

```text
Focusa / Workforce Extension
Customer Testing
```

Expanded chooser groups by project/environment.

### Multi-environment rule

Two environments may contain the same bare local ID.

Selection and cache keys use typed/source-qualified refs and environment scope.

---

## 12. Direction Bar contract

Input:

```js
{
  clientRequestId,
  actorRef,
  environmentRef,
  projectRef,
  workstreamRef,
  foremanRef,
  text,
  source: 'typed',
  expectedRevision,
  correlationRef,
  submittedAt
}
```

The exact server operation/schema must come from Focusa.

The UI MUST NOT create its own work reducer state after submission.

### Submission lifecycle

```text
local input
→ validate exact scope
→ preflight current source revision/authority where required
→ submit owning Focusa operation
→ receive source response/ref
→ refresh/reconcile projection
→ render resulting state
```

### Result presentation

```text
Accepted
“Login regression is now first priority.”

Clarification required
“Do you mean the customer login or admin login?”

Blocked
“This Workstream is read-only under your current grant.”

Outcome unknown
“Request may have reached Focusa. Reconciling before retry.”
```

No blind mutation replay.

---

## 13. Direction interpretation

If Focusa/Foreman returns an interpretation/proposal, show it compactly:

```text
Understood

Priority
Login regression first

Constraints
No auth rewrite · no deploy

Next
Reproduce → patch → tests → verify
```

Do not synthesize this in the client from raw text unless the owning contract explicitly marks the result as a client-presentable interpretation.

---

## 14. Full Workforce surface for Slice 1

The full page can remain intentionally narrow in scope:

```text
left
  Workstreams

center
  selected Workstream
  Foreman
  Objective
  Direction
  Current frontier

right
  source/freshness
  latest Evidence
  environment posture
```

Do not build People/Needs You/Graph/Evidence explorers yet.

Use placeholders only when they are clearly future destinations, not fake functional panels.

---

## 15. Data/freshness rules

Every rendered consequential projection retains:

```text
source environment
source ref
source revision/sequence where available
observed time
freshness state
```

### Causal ordering

Do not resolve conflicting state based solely on browser/server wall-clock timestamps.

Prefer upstream revision/sequence/epoch/generation semantics.

### Reconnect

```text
connection returns
→ fetch current projection
→ compare source revision
→ reconcile selection
→ restore mutations only after current state is known
```

---

## 16. No-SSE fallback

Slice 1 can ship useful behavior even if a canonical Foreman event stream is not yet available.

Allowed initial behavior:

```text
initial projection fetch
manual/operation-triggered refresh
bounded periodic refresh while surface is visible if needed
existing safe SSE where current endpoint supports it
```

Do not invent a persistent background streaming mechanism to satisfy visual liveliness.

Real-time events can improve the slice after correct state/operation semantics work.

---

## 17. Public demo

The Slice 1 public demo should use fixture/snapshot data to demonstrate:

```text
Workstream
Foreman
objective
frontier
Direction UI
freshness/proof
```

Direction is disabled or clearly simulated in public demo unless an intentionally isolated demo backend exists.

No private daemon/customer data may enter the snapshot.

---

## 18. Tests required

### Contract/unit

```text
projection schema validation
unsupported schema/version
multi-environment same bare ID isolation
selection persistence
stale cache rendering
Direction request construction
exact scope propagation
401/403/unsupported/degraded handling
ambiguous mutation reconciliation
```

### UI/component

```text
Foreman card fresh/stale/offline
Workstream switching
Direction disabled when scope invalid
operation state transitions
no raw IDs in primary UI
```

### Browser acceptance

```text
load unpacked
pair daemon
select real project/workstream
see real Foreman/source projection
submit a safe Direction
observe source-backed result
reload side panel
scope persists
lose/recover connection
stale state never mutates source
```

If real Foreman operation is unavailable, the browser acceptance must explicitly show the missing owning capability and test the adapter path chosen by the build agent.

---

## 19. Build/deployment checks

Before promotion:

```text
pnpm/npm dependency integrity if dependencies added
node tests
Svelte/Vite build
existing manifest validation
no new persistent permissions
unpacked extension load
side panel journey
public demo snapshot
```

Then dogfood on Chromebook.

Live promotion remains explicit through `wfx veragensia` after Slice 1 is proven.

---

## 20. What Slice 1 must not do

Do not:

- redesign Wirebot App docs;
- implement Workforce Composer;
- invent a Foreman database;
- call Silent Sessions “Foremen” without the canonical binding;
- move current Focusa authority logic into Svelte;
- implement People/Needs You/Graph/Radar/voice prematurely;
- keep MV3 service worker artificially alive;
- add broad host/content-script permissions;
- replace all legacy surfaces at once;
- declare success from mock/demo data only.

---

## 21. Suggested implementation commits

Keep these as implementation-sized outcomes, not ceremony:

```text
1. build: add minimal Svelte/Vite multi-entry pipeline while preserving MV3 invariants
2. runtime: add shared environment/selection + Foreman projection adapter
3. ui: replace side-panel core with Workstream + Foreman + Direction
4. ui: add minimal full Workforce Workstream surface
5. tests: browser/contract failure + stale/reconciliation coverage
6. cleanup: remove only legacy side-panel code actually superseded by the proven slice
```

If the build agent finds a smaller clean sequence, use it.

---

## 22. Slice 1 exit condition

Slice 1 is complete only when:

```text
real Focusa environment
+ exact Workstream
+ canonical/owned Foreman projection
+ human Direction
+ real owning operation
+ honest result/reconciliation
+ persisted scope
+ stale/degraded behavior
+ Chromebook browser proof
```

work together without adding duplicate authority or state.

At that point, Slice 2 — **Working Now / roster** — can attach to a stable product center instead of another utility page.
