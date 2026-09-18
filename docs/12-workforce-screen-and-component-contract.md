# Focusa Workforce — Screen and Component Contract

**Status:** CURRENT Skeleton-plane authority  
**Depends on:** `10-workforce-product-requirements-and-proof-matrix.md`, `11-workforce-experience-architecture-and-stateflow.md`  
**Purpose:** define exact screen anatomy, interaction hierarchy, component responsibilities and non-happy states so implementation does not invent UX structure.

---

## 1. Component architecture law

Components present source-owned state and emit typed intents. They do not own canonical work, authority, approval, Evidence, entitlement or execution state.

Organize UI components into:

```text
shell/
  AppShell
  SidePanelShell
  ScopeBreadcrumb
  EnvironmentSwitcher
  FreshnessIndicator
  GlobalNav

work/
  WorkstreamList
  WorkstreamHeader
  ForemanCard
  DirectionComposer
  TrajectoryControls
  TrajectoryHumanView
  TrajectoryOperationsView
  TrajectoryTechnicalView
  WorkFrontier
  WorkProgression
  LifecycleBadge

people/
  PeopleList
  PersonCard
  PersonDetail
  ResponsibilityTree
  ExecutionBadge

attention/
  NeedsYouList
  AttentionCard
  AttentionDetail
  AttentionActionBar

proof/
  EvidenceList
  EvidenceCard
  EvidenceDetail
  ProofStateBadge
  ClosureChain

topology/
  FleetSummary
  BodyCard
  TopologyDetail

shared/
  EmptyState
  ErrorState
  StaleBanner
  SourceMeta
  CapabilityPosture
  TypedRefDebug
  ConfirmedActionResult
```

Do not create a generic “Card” abstraction that erases semantic differences between attention, people, evidence and work.

---

## 2. Side Panel contract

### 2.1 Purpose
Immediate Workstream collaboration while browsing.

### 2.2 Fixed vertical order

```text
1. Compact operator/environment header
2. Project/Workstream selector
3. Foreman / objective block
4. Direction Composer
5. Needs You
6. Working Now
7. Verified Recently
8. Footer actions
```

### 2.3 Header

Required fields:

```text
Operator display name OR environment label
Partner display name when available
Network posture: Private / Federated / Unknown
Freshness indicator
```

Do not show daemon URL in the primary header.

### 2.4 Scope selector

Two-line compact selector:

```text
Project name
Workstream name                      chevron
```

Open menu shows:

```text
current environment
Projects
  Workstreams
status dot
Needs You count
working count
```

If more than 12 Workstreams, include search.

### 2.5 Foreman block

Required visible content:

```text
FOREMAN label
Foreman display/role name if source provides one
objective: max 2 lines
current frontier: max 2 lines
working count
latest proof state
```

Actions:

```text
Ask state
Why this path?
```

These are secondary text actions; Direction is primary.

### 2.6 Direction Composer

Default collapsed height: 44–48px.
Expanded when focused or multi-line.

Elements:

```text
target breadcrumb (small)
textarea
voice trigger placeholder if feature unavailable
submit button
```

Placeholder:

```text
Direct this Foreman…
```

Never use “Ask AI anything.”

Submit disabled when:

```text
no exact Workstream
no current Foreman/owning operation
source incompatible
connection unavailable
current principal cannot submit
```

If stale but inspectable, composer remains visible with explanation and Refresh/Revalidate action.

### 2.7 Needs You

Show up to 3 active highest-priority items.
If more, show `View all N`.

Compact card:

```text
class icon
short title
one-line why-now
consequence/expiry cue if material
primary action OR Open
```

Do not resolve consequential items in an accidental one-click icon.

### 2.8 Working Now

Show up to 5 responsibility rows:

```text
identity/role
current work
state
execution cue
```

State words:

```text
Working
Waiting
Blocked
Needs You
Reconciling
Offline
```

### 2.9 Verified Recently

Maximum 3 items.
Only Verified or Settled items appear here.
Claimed/Observed do not.

### 2.10 Footer

```text
Open Workforce
Watch UIAI   (only when active exact execution context exists)
```

---

## 3. Full Workforce — Overview screen

Route: `#/overview`

### 3.1 Header zone

```text
Good morning/afternoon/evening is optional and local-only.
Primary title: Workforce
Subtitle: active environment / Operator
Freshness
```

### 3.2 Main content

Desktop order:

```text
Current Focus                    Needs You
Working Now                      Verified Recently
Workstreams                      Capacity exception (conditional)
```

Do not render empty capacity/upsell panels if no meaningful condition exists.

### 3.3 Current Focus card

Required:

```text
Workstream
objective
Foreman
current lifecycle stage
current Short trajectory frontier
Needs You count
proof state
```

Primary action: `Continue`.

---

## 4. Work index screen

Route: `#/work`

### 4.1 Toolbar

```text
Work
search
filter: All / Working / Blocked / Needs You / Verified recently
optional environment filter when >1
```

### 4.2 Workstream row

```text
Workstream name
Project
objective
Foreman
lifecycle
work state summary
attention count
proof state
freshness
```

Click anywhere except inline secondary control opens detail.

No progress percentage unless Focusa source provides a valid accepted-scope denominator. Never fabricate percent complete from task counts.

---

## 5. Work detail screen

Route: `#/work/detail`

This is the primary deep-operations screen.

### 5.1 Sticky header

Left:

```text
Project / Workstream
objective
```

Right:

```text
Freshness
Lifecycle
Trajectory depth selector
Presentation depth selector
```

### 5.2 Top operational block

Two columns desktop; stacked narrow:

```text
ForemanCard | NeedsYouList scoped to Workstream
```

DirectionComposer spans below Foreman card or full width based on available width.

### 5.3 Trajectory block

Header:

```text
Trajectory
Full | Medium | Short
Human | Operations | Technical
```

Human view card anatomy:

```text
Desired outcome
Current
Parallel
Next
Blocked/Unresolved
Acceptance summary
```

Operations view:

```text
node/group name
actor/owner
state
prerequisites
evidence/acceptance
next dependency
```

Technical view uses expandable tree/graph; never force a large node graph into Side Panel.

### 5.4 Working Now block

Show responsibility tree first; list view toggle optional only if implementation remains simple.

### 5.5 Evidence block

Show proof directly related to current frontier first.
Then recent Workstream proof.

### 5.6 Execution posture

Compact inline section:

```text
current bodies/runtimes used by this Workstream
active UIAI contexts
health exceptions
```

Deep details hand off to Topology/UIAI.

---

## 6. People index

Route: `#/people`

### 6.1 Header

```text
People
N active · M waiting · K need attention
```

### 6.2 Role grouping

Always group in this order where present:

```text
Foremen
Managers
Workers / Specialists
Verifiers
```

### 6.3 PersonCard anatomy

Primary:

```text
display name or role identity
role
state
current responsibility
Workstream
```

Secondary:

```text
execution location
last proof
```

Do not lead with model/provider.

---

## 7. Person detail

Route: `#/people/detail`

Sections:

```text
1 Identity and role
2 Current responsibility
3 Workstream relationship
4 Current work
5 Capability/authority posture
6 Execution/runtime/body
7 Recent Evidence
8 Activity/audit links
```

### Authority posture
Use neutral, exact labels:

```text
Authorized for current work
Limited
Approval required
Expired
Revoked
Unknown
```

Do not expose raw grant internals by default.

---

## 8. Needs You index/detail

### 8.1 Index

Canonical addressable route: `#/needs-you`. It is not a primary-navigation item. It is entered from the header/context rail, Start Page, Side Panel, Overview and Work detail; wide layouts may visually present it with the established context-rail/drawer language without changing route/history semantics.

Canonical detail route: `#/needs-you/detail?env=<key>&ref=<typed-ref>`.

Sections ordered:

```text
Now
Soon / expiring
Snoozed
Recently resolved
```

### 8.2 AttentionCard anatomy

```text
Icon + class
Title
Why now
Context breadcrumb
Consequence cue
Freshness / expiry
Primary action
Secondary: Inspect
```

Urgency uses semantic styling but avoids alarmist red for ordinary clarification.

### 8.3 Detail

```text
What needs you
Why autonomous work stopped/escalated
Context
Current source state
Consequence of each available action
Evidence/context needed for judgment
Source metadata
Action bar
```

### 8.4 Action bar

Primary source action right aligned on desktop; full width on narrow screens.
Potential secondary actions:

```text
Deny
Defer
Open source
Take control
Answer
```

Only show actions source currently allows.

---

## 9. Evidence index/detail

### 9.1 EvidenceCard

```text
outcome/claim title
ProofStateBadge
related Workstream/work
one-line proof summary
producer/source
age/freshness
```

### 9.2 ProofStateBadge exact labels

```text
CLAIMED
OBSERVED
SUPPORTED
VERIFIED
SETTLED
UNKNOWN
STALE
```

Do not substitute “Done” for these.

### 9.3 EvidenceDetail

Top:

```text
claim/outcome
proof state
verification summary
```

Then:

```text
Evidence items/artifacts
Source/provenance
Related work
Verification history
Settlement/Receipt
Correction/revocation
Accepted outcome/W.I.N.S. link if present
```

---

## 10. Topology screen

Route: `#/topology`

### Summary groups

```text
Interactive
Browser execution
Compute
Other bodies
```

BodyCard:

```text
friendly label
role in workforce
health
busy/available
current Workstreams
exception indicator
```

Technical details in drawer.

Avoid CPU/RAM numbers in card headline unless resource pressure is actually the operational issue.

---

## 11. Audit screen

Route: `#/audit`

Default timeline row:

```text
time
meaningful event verb
actor
Workstream/context
result/proof cue
```

Filters:

```text
Workstream
People
Direction
Attention
Evidence
Recovery
Execution
```

Technical event verbosity toggle available one layer down.

---

## 12. Settings screen

Route: `#/settings`

Sections:

```text
Connections
Appearance
Notifications
Browser/context permissions
Public demo/local behavior where applicable
Advanced/debug
```

No owner authority, federation authority, credential management or role-grant editor unless an owning operation is intentionally added later.

---

## 13. Shared state components

### EmptyState
Must answer:

```text
what is empty
whether source confirmed it
what useful next action exists
```

### ErrorState
Must distinguish:

```text
unauthenticated
forbidden
unsupported
incompatible
unavailable
```

### StaleBanner
Exact pattern:

```text
Last confirmed <relative time>. Current work may have changed.
[ Refresh ]
```

No mutation controls that rely on stale authority remain enabled.

### ReconcilingState
Use after ambiguous writes/takeover/reconnect:

```text
Reconciling current state…
```

Never optimistically claim failure/success until source resolves.

---

## 14. Responsive skeleton

Detailed construction authority is `docs/17 §21`. These are the Skeleton-level invariants:

### 320–479px / reflow

```text
single semantic column
16px horizontal content padding
no page-level horizontal scrolling for ordinary content
primary action remains reachable
drawers become full-width sheets where docs/16/17 require
```

Side Panel keeps its canonical order and uses one primary vertical scroll region. Direction is **not sticky**.

### 480–859px

Single-column content with compact drawers/sheets. Dense list rows become stacked semantic rows rather than horizontally scrolling tables.

### 860–1179px

Full Workforce uses compact left navigation and main content; context rail becomes a drawer.

### 1180–1599px

Three-region Full Workforce shell.

### 1600px+

Max content width 1520px. Do not stretch prose/cards indefinitely; increase gutters instead.

### Reflow continuity

Responsive transitions do not mutate scope, lose selected objects, discard Direction drafts, resolve attention, or create browser-history entries. At 200% zoom/text enlargement, content and controls remain available. Long/unbroken machine strings cannot force page width.

---

## 15. Keyboard contract

Minimum shortcuts:

```text
/           focus an existing local search on Work/People/Evidence/Audit when not typing; otherwise no-op
D           focus Direction when Workstream detail active and not typing
Esc         close drawer/dialog; never cancel source work implicitly
Enter       submit only in single-line controls; Direction textarea uses Cmd/Ctrl+Enter
```

All interactive elements reachable by Tab.
Visible focus ring mandatory.

A global command palette is not in the current HLT. Do not add Cmd/Ctrl+K.
Do not ship shortcut conflicts with existing extension commands (`Alt+Shift+F`, `Alt+Shift+W`, `Alt+Shift+K`).

---

## 16. Dialog/drawer law

Use modal dialogs only for:

```text
consequential confirmation required by source policy
scope ambiguity that cannot be resolved inline
explicit destructive local setting action
```

Use side drawers for inspection/detail without losing Workstream context.

Do not use modal dialogs for ordinary evidence inspection or worker details.

---

## 17. Animation/motion placement

Allowed:

```text
new attention item enters
work state changes
verification strengthens
reconciliation completes
context drawer opens/closes
```

Not allowed:

```text
continuous pulsing workers
fake typing indicators as work progress
ambient floating particles
constant graph motion
```

Reduced-motion setting removes nonessential movement.

---

## 18. Skeleton acceptance checklist

A screen is not implementation-ready unless this document or an owner-approved revision states:

```text
purpose
entry condition
primary information
primary action
secondary actions
component order
loading state
empty state
stale/degraded state
unauth/forbidden/unsupported state
responsive behavior
keyboard behavior
source owner
exact handoffs
```

The build agent must not invent missing screen anatomy during implementation.