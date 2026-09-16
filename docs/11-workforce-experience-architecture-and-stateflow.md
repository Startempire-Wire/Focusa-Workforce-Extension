# Focusa Workforce — Experience Architecture and Stateflow

**Status:** CURRENT Structure-plane authority  
**Depends on:** `10-workforce-product-requirements-and-proof-matrix.md`, ADLBOS `CROSS_PRODUCT_SEAM_CONTRACT.md`  
**Purpose:** remove navigation, scope, lifecycle and cross-surface interpretation from the build agent.

---

## 1. Experience model

Workforce operates on four orthogonal dimensions. Do not collapse them into one status enum.

```text
A. SCOPE
Environment → Project → Workstream → Foreman/work/actor

B. TRAJECTORY COVERAGE
Full | Medium | Short

C. WORK LIFECYCLE
PREPARE | DIAGNOSE | PLAN | SPECIFY | DECOMPOSE |
VERIFY AGAINST SPECS | IMPLEMENT | DEPLOY | VERIFY OUTCOME | REFINE

D. HUMAN COLLABORATION
Orient | Direct | Interpret/Propose | Delegate | Work |
Collaborate/Intervene | Verify | Continue/Learn
```

Authority/readiness/freshness are separate dimensions again.

---

## 2. Surfaces and canonical jobs

| Surface | Entry | Job | Mutation level |
|---|---|---|---|
| Side Panel | `sidepanel.html` | Current Workstream collaboration | Scoped mutations allowed |
| Full Workforce | `workforce.html` | Deep multi-Workstream operations | Scoped mutations allowed |
| Start Page | `startpage.html` | Return/orientation | Minimal quick actions; no deep orchestration |
| Wall | `wall.html` | Ambient situational awareness | Read only |

No additional top-level extension surface is required for the redesign.

---

## 3. Full Workforce route contract

Use one extension full-page entry point:

```text
workforce.html
```

Use client-side hash routing so MV3 does not require route rewrites:

```text
#/overview
#/work
#/work/detail
#/people
#/people/detail
#/evidence
#/evidence/detail
#/topology
#/audit
#/settings
```

Context is carried separately from route identity.

### 3.1 URL context transport

For extension-internal deep links, use query parameters after the hash:

```text
#/work/detail?env=<connection-key>&ref=<base64url-typed-ref>
```

`ref` is a base64url encoding of the UTF-8 JSON representation of the ADLBOS typed cross-product reference. It is a reference only, never a credential or authority token.

Allowed optional parameters:

```text
env      local connection key
ref      primary typed object ref
intent   inspect | direct | review | watch | approve
return   base64url encoded internal return location
```

Unknown parameters are ignored. Unsupported ref version/kind renders Incompatible and performs no mutation.

Cross-product handoffs use the owning `operator.surface_handoff.v1` adapter; the internal URL is only the browser transport.

---

## 4. Global shell

Full Workforce has one stable shell:

```text
┌─────────────────────────────────────────────────────────────┐
│ Operator / Partner       Scope breadcrumb       Freshness   │
├──────────────┬────────────────────────────┬─────────────────┤
│ Primary nav  │ Main content               │ Context rail    │
│              │                            │ (when useful)   │
│ Overview     │                            │ Needs You       │
│ Work         │                            │ Verified        │
│ People       │                            │ Source posture  │
│ Evidence     │                            │                 │
│              │                            │                 │
│ Topology     │                            │                 │
│ Audit        │                            │                 │
│ Settings     │                            │                 │
└──────────────┴────────────────────────────┴─────────────────┘
```

At widths below 1180px, context rail collapses to a drawer.
At widths below 860px, primary nav collapses to a compact rail/menu.
The Side Panel uses its own composition and is not this shell squeezed smaller.

---

## 5. Scope resolution state machine

```text
NO CONNECTION
  → pair/connect
  → ENVIRONMENT KNOWN
  → load authorized Projects/Workstreams
  → SCOPE LIST READY
  → restore last valid Workstream if still authorized
      ↘ invalid/revoked → require selection
  → WORKSTREAM SELECTED
  → resolve Foreman/source projections
  → ACTIVE SCOPE READY
```

### Required transitions

```text
connection revoked
→ clear actionable scope
→ keep non-sensitive local presentation prefs
→ show Reconnect

Workstream deleted/revoked
→ retain history link if source permits
→ remove from active selection
→ select another scope

multiple plausible incoming handoff targets
→ do not guess
→ show scope disambiguation
```

A route change MUST NOT mutate Focusa scope by itself.

---

## 6. Environment switch behavior

Environment switch is a high-importance context change.

On switch:

1. abort/release surface-local reads/streams for prior environment;
2. persist the previous environment's last selected Workstream locally;
3. set active environment;
4. hydrate selected/most-recent valid Workstream for new environment;
5. reconnect projections/events;
6. render loading/skeleton without mixing prior-environment data;
7. only enable mutations after source scope is current.

Never preserve a prior environment's work/attention/evidence cards under the new header.

---

## 7. Workstream switch behavior

On Workstream switch:

```text
persist prior local selection
→ set new typed Workstream ref
→ immediately label content Loading/Refreshing
→ cancel stale in-flight local requests where possible
→ resolve Foreman
→ load current trajectory/work/people/attention/evidence
→ bind live event stream
→ mark Fresh only after source revisions are coherent
```

Direction input draft is scoped to Workstream. Unsaved draft for Workstream A MUST NOT appear under Workstream B.

---

## 8. Overview flow

`#/overview` is owner/operator orientation inside Workforce, not Wirebot's life/business Today view.

Display order:

```text
1. Current focus / most recently active Workstream
2. Needs You count and highest-consequence items
3. Working Now summary
4. Verified/Settled recently
5. Workstream list with state/freshness
6. Capacity/topology exception if meaningful
```

Primary actions:

```text
Continue Workstream
Open Needs You item
Inspect verified item
Open Work / People / Evidence
```

No generic KPI grid.

---

## 9. Work flow

### 9.1 Work index — `#/work`

Show Workstreams grouped by Project where Project exists.

Each row/card:

```text
Workstream name
objective/desired outcome
Foreman
lifecycle stage
trajectory coverage posture
working/waiting/blocked counts
Needs You count
proof state
freshness
```

Primary action opens `#/work/detail` with exact typed Workstream ref.

### 9.2 Work detail — `#/work/detail`

Header:

```text
Project / Workstream breadcrumb
objective
Foreman
freshness
trajectory depth control: Full | Medium | Short
presentation depth control: Human | Operations | Technical
```

Body order:

```text
Direction
Current frontier
Trajectory/work progression
Working Now
Needs You scoped to Workstream
Evidence/verification
execution placement
```

Technical mode may add exact refs/graph details but does not replace the hierarchy.

---

## 10. Trajectory projection behavior

### Full
Shows complete accepted-outcome coverage. Required unresolved branches remain visible.

### Medium
Shows selected substantial outcome/Workstream subtree while preserving HLT ancestry and external/cross-branch prerequisites.

### Short
Shows the exact executable slice, nearest ready Workpoint/frontier, prerequisites, evidence obligation, rollback where material, and next advancement condition.

Switching depth MUST NOT create or mutate trajectory data. It changes projection only.

### Presentation depth

```text
Human       plain organizational explanation
Operations  dependency/actor/acceptance detail
Technical   graph/attempt/session/lease/ref/receipt detail
```

Trajectory depth and presentation depth are independent controls.

---

## 11. Lifecycle projection

Lifecycle stage is source-owned. Workforce does not manufacture it.

Display canonical labels where supported:

```text
PREPARE
DIAGNOSE
PLAN
SPECIFY
DECOMPOSE
VERIFY AGAINST SPECS
IMPLEMENT
DEPLOY
VERIFY OUTCOME
REFINE
```

### REFINE
REFINE is a loop annotation/operation, not a terminal linear phase. UI must identify what is being refined and why.

### Unknown lifecycle
If source cannot provide a stage:

```text
Lifecycle: Unknown
```

Do not derive `IMPLEMENT` merely because workers are active.

---

## 12. Direction state machine

```text
IDLE
  ↓ user types/speaks
DRAFT
  ↓ submit
VALIDATING SCOPE
  ├─ ambiguous → NEEDS CLARIFICATION
  ├─ stale → REVALIDATING
  ├─ denied → DENIED
  └─ valid
       ↓
SUBMITTING
  ├─ explicit source rejection → BLOCKED / DENIED
  ├─ clarification → NEEDS CLARIFICATION
  ├─ proposal → PROPOSAL CREATED
  ├─ accepted → ACCEPTED
  ├─ dispatched → DISPATCHED
  └─ transport ambiguity → OUTCOME UNKNOWN / RECONCILING
```

After a terminal/result state, the UI resolves source refs and updates the Workstream projection.

Never convert a network timeout into “failed” if the effect may have occurred.

---

## 13. Needs You state machine

Source-domain states:

```text
active
resolved
cancelled
expired
revoked
```

Presenter-only states:

```text
unseen
seen
snoozed
hidden
```

These sets are independent.

Action flow:

```text
open card
→ refresh source revision
→ if stale/terminal: render current source state; no action
→ if active: show source-owned allowed actions
→ user chooses
→ owning operation executes
→ reconcile
→ source becomes terminal or remains active
```

Snooze/hide never calls approve/deny/resolve.

---

## 14. UIAI takeover flow

```text
worker/UIAI reports auth/takeover boundary
→ Needs You item
→ open exact UIAI context
→ UIAI acquires human takeover according to its contract
→ human acts
→ human returns control
→ UIAI re-observes/reconciles
→ Focusa/worker continuation becomes eligible
→ Workforce updates from source state
```

Workforce states shown during flow:

```text
Needs authentication
Human control active
Returning control
Reconciling
Working / Blocked / Needs You
```

No Workforce-local takeover lease state.

---

## 15. People flow

### People index — `#/people`

Group/order:

```text
Foremen
Managers
Workers / Specialists / Verifiers
```

Filters:

```text
Workstream
role class
Working | Waiting | Blocked | Needs You | Offline
execution location
```

### Detail — `#/people/detail`

Sections:

```text
Identity + role
Current responsibility
Workstream/Foreman relationship
Current work
Authority/capability posture
Execution/runtime/body
Recent Evidence
History/audit links
```

No direct capability grant editing in this redesign unless an owning operation is later explicitly admitted.

---

## 16. Evidence flow

### Evidence index
Filters:

```text
Workstream
proof state
source
actor
time
```

Default grouping:

```text
Needs verification
Recently verified
Settled
Stale/corrected
```

### Evidence detail
Show:

```text
claim/outcome being supported
proof state
source/provenance
producer/actor
related work/workpoint
artifacts/observations
verification result
receipt/settlement ref
correction/revocation history
accepted outcome ref if any
```

Primary actions are source-owned inspection/verification operations only where currently supported.

---

## 17. Topology flow

Default view is organizational:

```text
Interactive surfaces
Cloud/remote workers
Browser contexts
Build/compute bodies
```

Only show health/capacity exceptions in primary summary.

Detail drawer exposes:

```text
environment/daemon/body/runtime refs
trust/enforcement posture
resources
health
spend/cost if available
capabilities
current assignments
```

Network federation is not part of topology except as a separate posture indicator.

---

## 18. Audit flow

Audit is not raw log dumping by default.

Default timeline events:

```text
Direction accepted/denied
important delegation changes
human attention/resolution
UIAI takeover start/return
verification/settlement
recovery/correction
scope/authority changes relevant to work
```

Technical mode can expose lower-level source events.

Audit entries always preserve typed source refs.

---

## 19. Start Page stateflow

Start Page loads:

```text
connection posture
last/current Workstream
owner attention count
working summary
recent verified/settled items
```

Primary action:

```text
Continue current Workstream
```

Secondary:

```text
Open Needs You
Open Workforce
```

If no connection: simple Pair Focusa call to action.
If stale: show last-confirmed data with clear stale label and no consequential quick mutations.

---

## 20. Wall stateflow

Read-only.

If fresh: live situational view.
If stale: keep last known state visibly stale.
If unavailable: state that work may continue in Focusa but cannot be confirmed.

Wall never opens mutation dialogs in place; selecting an item may open Full Workforce inspection on another surface only if the user explicitly acts.

---

## 21. Browser/page context flow

Context-menu/page actions are hidden/disabled when no active valid Workstream exists.

Flow:

```text
user invokes explicit page action
→ capture minimal permitted page/selection metadata
→ display exact target Workstream/Foreman
→ submit through owning operation
→ show result
```

No background broad browsing capture.

---

## 22. Recovery and reconnect

On reconnect:

1. authenticate connection;
2. resolve active selected scope;
3. load current source revisions;
4. reconcile any ambiguous pending mutation by idempotency/correlation key;
5. discard/mark stale cached projections that no longer match;
6. resume event stream from acknowledged cursor where owning stream supports it;
7. enable mutation only when current scope/authority can be confirmed.

The UI must not imply workers stopped while the extension was suspended/offline.

---

## 23. Loading, empty, degraded and error taxonomy

Every major surface supports exactly these presentation classes:

```text
loading
ready-empty
ready
stale
partial/degraded
unauthenticated
forbidden
unsupported/incompatible
unavailable
reconciling
```

### Copy law

- `Empty` means source confirms no items.
- `Unavailable` means source could not be read.
- `Stale` means previously confirmed information is outside freshness contract.
- `Unsupported` means required owning operation/schema is not present.
- `Forbidden` means current principal lacks authority.

Do not use “No items” for an unreadable source.

---

## 24. Cross-surface return semantics

Every specialist handoff includes a return location where possible.

Example:

```text
Workforce Work detail
→ UIAI Watch
→ return control
→ same Workstream detail + same primary item
```

Internal route return state stores only references/presentation position. It does not cache authority.

---

## 25. Browser history/back behavior

- internal navigation pushes history;
- scope filter changes replace history unless they materially change primary object;
- opening a detail object pushes history;
- closing drawer returns to prior route;
- Back never performs a mutation;
- if returning to a stale source object, refresh/reconcile before enabling action.

---

## 26. Acceptance journeys

The following must work without manual scope rediscovery:

### J1 — Return and direct
Open browser → orient → select/restore Workstream → direct Foreman → accepted/dispatched → see resulting work.

### J2 — Clarification
Foreman needs truth → Needs You → answer through source-owned operation → item resolves → work continues.

### J3 — UIAI takeover
Attention → exact UIAI context → human takes over → returns → reconciliation → work continues.

### J4 — Verify completion
Worker claim → Evidence → verification → settlement state → accepted outcome projection where applicable.

### J5 — Multi-environment
Switch environment → no state bleed → select Workstream → exact source refs → switch back restores prior valid local selection.

### J6 — Offline recovery
Disconnect during work → stale truth shown → reconnect → source reconciled → no duplicate consequential effect → current state restored.

### J7 — Full Trajectory inspection
Open Workstream → Full trajectory → see every accepted branch/disposition → switch to Short → exact ready frontier → switch Human/Technical without changing source plan.

---

## 27. Structure-plane completion rule

A build agent may not invent navigation, scope inheritance, lifecycle semantics, trajectory depth semantics, cross-surface return behavior or failure-state meaning outside this contract. If an owning Focusa/UIAI/ADLBOS contract makes a route impossible or materially different, stop that affected node, record the exact upstream conflict, and update this document before implementing a divergent UX.