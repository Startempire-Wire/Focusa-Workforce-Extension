# Focusa Workforce — Redesign Blueprint

**Status:** CURRENT implementation blueprint  
**Product:** Focusa Workforce  
**Architecture owners:** Focusa + ADLBOS portable contracts  
**Read-only counterpart:** Wirebot App current product/process docs  
**Execution counterparts:** UIAI Engine + Veragensia  
**Baseline:** `baseline/pre-redesign-2026-09-15`

This blueprint turns the existing Workforce product/UX/runtime specs into an implementable redesign.

It does not replace `00`, `05`, or `06`. It operationalizes them.

> **Focusa Workforce is the shared operations environment where a human collaborates with, steers, intervenes in, and verifies a Focusa-governed workforce.**

---

## 1. Product thesis

The current extension proves valuable primitives but presents them as disconnected utility surfaces.

The redesign must make the workforce feel like an **actual organization at work**, not a collection of sessions, daemons, browser contexts and API calls.

The user should understand the organization in this order:

```text
What are we trying to accomplish?
Who is accountable?
Who is working?
What is happening now?
What is blocked?
What needs me?
What has been proven?
Where is execution happening?
What can I direct next?
```

The product succeeds when the user can leave for hours, reopen the browser, understand the real state in seconds, intervene only where useful, and trust what is actually complete.

---

## 2. Product boundaries

### Workforce owns the workforce-operations experience

```text
Foreman / Workstream context
active workforce / responsibility
work progression
Direction
Needs You
Evidence / verification
execution links
fleet / topology posture
workforce-scoped history
```

### Workforce does not own

```text
owner-wide life/business relationship
organization commissioning authority
Focusa reducer/work authority
UIAI execution authority
Veragensia runtime/body authority
W.I.N.S. accepted-outcome authority
Startempire network/federation authority
credentials/secrets authority
```

### Relationship to Wirebot

Wirebot is the owner-level Operating Partner / Chief of Staff.

Workforce is the operational organization surface.

```text
Wirebot
“What matters across the owner’s life/business?”
“What should be delegated?”
“What role/capability is missing?”
“What accepted outcome matters?”

Workforce
“Who is responsible?”
“What are they doing?”
“What needs intervention?”
“What is proven?”
“Where is work running?”
```

Wirebot App is a read-only architecture/product dependency for this repo. Do not rewrite its docs from Workforce work.

---

## 3. Human / agent hierarchy

The interface must make these roles legible without forcing the user to learn implementation terminology.

```text
Canonical Owner Principal
        |
        +-- Delegated Human Principal(s), if explicitly granted
        |
        v
Operating Partner / Chief of Staff
Wirebot implementation family
        |
        | desired outcome / bounded delegation
        v
Workstream Foreman
        |
        +-- Manager(s)
        |     |
        |     +-- Worker(s)
        |
        +-- Specialist(s)
        +-- Verifier(s)
        |
        v
Execution
Pi / Silent Sessions / UIAI / Agent Computers
```

### Design consequence

The primary Workstream screen should visually center:

```text
Objective
Foreman
Current work frontier
People working
Needs You
Evidence
```

not:

```text
daemon
session IDs
model names
process IDs
raw event stream
```

Those remain inspectable one layer down.

---

## 4. Core collaboration loop

Every major interaction should fit one of these phases:

```text
ORIENT
→ DIRECT
→ INTERPRET / PROPOSE
→ DELEGATE
→ WORK
→ COLLABORATE / INTERVENE
→ VERIFY
→ CONTINUE / LEARN
```

### ORIENT

User returns and sees:

- active Workstream and objective;
- accountable Foreman;
- active workers;
- current frontier;
- blockers;
- Needs You;
- latest verified proof;
- environment freshness.

### DIRECT

The user gives natural typed or spoken direction inside the active Workstream.

Examples:

```text
Prioritize the login regression.
Do not rewrite the auth layer.
Use another verifier.
Do not deploy yet.
Move the build off this Chromebook if memory pressure remains high.
```

Direction resolves to exact Focusa scope and uses Focusa authority.

### INTERPRET / PROPOSE

For meaningful directives, the Foreman may show the concise interpretation:

```text
Priority
Login regression first

Constraints
No auth-layer rewrite
No production deployment

Plan
Reproduce → patch → focused tests → independent verify

People
Builder-2 · Verifier-1

Proceeding
```

This is shared awareness, not default approval ceremony.

### DELEGATE

Display responsibility and dependencies.

```text
Login regression
├─ Builder-2     Fixing
├─ UIAI Browser  Reproducing
└─ Verifier-1    Waiting for patch
```

### WORK

Summarize real progression rather than tool chatter.

```text
Reproduced
→ cause isolated
→ patch in progress
→ focused tests
→ browser verification
```

### COLLABORATE / INTERVENE

Human comparative advantage enters locally:

```text
Foreman needs product truth
“Should the session persist after password reset?”
[ Answer ]
```

```text
UIAI needs authentication
[ Take control ]
```

### VERIFY

Proof becomes a first-class state transition.

### CONTINUE / LEARN

After owner input, takeover or verification, the system reconciles and continues without manual session archaeology.

---

## 5. Surface architecture

Four surfaces serve different jobs.

### 5.1 Side Panel — immediate collaboration

**Job:** operate the current Workstream without leaving the page.

Primary layout:

```text
┌──────────────────────────────┐
│ ACME OPERATOR       ● Fresh  │
│ Spock · Private              │
├──────────────────────────────┤
│ Project / Workstream      ▾  │
├──────────────────────────────┤
│ FOREMAN                      │
│ Customer Testing             │
│ Fix login regression         │
│ 3 people working             │
│                              │
│ [ Direct Foreman… ]     🎙   │
├──────────────────────────────┤
│ NEEDS YOU                  2 │
│ Product clarification        │
│ UIAI authentication          │
├──────────────────────────────┤
│ WORKING NOW                  │
│ Builder-2    Fixing          │
│ Verifier-1   Waiting         │
│ UIAI Chrome  Reproducing     │
├──────────────────────────────┤
│ VERIFIED RECENTLY            │
│ Login reproduction ✓         │
├──────────────────────────────┤
│ Open Workforce     Watch UIAI│
└──────────────────────────────┘
```

The panel is **not** a tiny admin console.

It should make the current organization feel present and reachable.

### 5.2 Full Workforce — operations room

**Job:** understand and operate the organization across Workstreams.

Recommended responsive desktop composition:

```text
┌──────────────┬───────────────────────────────┬─────────────────┐
│ WORKSTREAMS  │ ACTIVE WORK                   │ NEEDS YOU       │
│              │                               │                 │
│ Project A    │ Objective                     │ Approval        │
│  • Login     │ Foreman                       │ Clarification   │
│  • Billing   │ Direction                     │ Takeover        │
│              │                               │                 │
│ Project B    │ Mission / Current / Next      │                 │
│              │                               │                 │
│ PEOPLE       │ Working Now                   │ VERIFIED        │
│ Foremen      │                               │                 │
│ Crew         │ Evidence / progression        │                 │
└──────────────┴───────────────────────────────┴─────────────────┘
```

This is a **work surface**, not a BI dashboard.

### 5.3 Start Page — organizational return point

**Job:** concise daily reorientation.

```text
Good morning.

Current focus
Customer-ready Workforce redesign

Needs You       2
Working         5 people · 3 Workstreams
Verified        3 since last visit

[ Continue current Workstream ]
```

No configurable widget landfill as the primary experience.

### 5.4 Wall — ambient situational awareness

**Job:** large-screen read-only presence.

Show:

- current focus;
- active Workstreams;
- people working;
- meaningful attention;
- verified outcomes;
- freshness.

No mutations.

---

## 6. Information architecture

Primary destinations:

```text
Overview
Work
People
Evidence
```

Context/global capabilities:

```text
Needs You
Direction
Topology
Audit
Settings
```

### Overview

Answers:

```text
What matters now?
What changed?
What needs the owner?
What was verified?
```

### Work

Workstream-centered progression and dependencies.

### People

Foremen, Managers, Workers, Specialists, Verifiers and their responsibilities.

### Evidence

Verification and settlement confidence.

### Topology

Execution location/body/runtime posture only as needed for operational understanding.

---

## 7. Workstream as the primary operational container

Workforce should orient around **Workstream**, not session or daemon.

Every Workstream view should carry:

```text
Project
Workstream
Objective
Foreman
current Workpoint/frontier
responsible people
work progression
attention
Evidence
execution posture
freshness
```

A user should be able to switch Workstreams and immediately retain the mental model:

```text
mission
responsibility
progress
attention
proof
```

---

## 8. Foreman experience

The Foreman is the accountable local intelligence.

Primary Foreman card:

```text
FOREMAN
Focusa Workforce Redesign

Objective
Ship customer-testable extension redesign

Current frontier
Workstream + Foreman + Direction slice

People
Builder-2 · Verifier-1 · UIAI Browser

Last verified
Baseline parity confirmed

[ Direct ]  [ Ask state ]  [ Why this path? ]
```

Progressive detail:

- role/profile;
- exact Workstream refs;
- runtime attachment;
- authority posture;
- active Workpoint;
- delegation tree;
- last Evidence;
- audit/history.

Do not make a chat transcript the primary representation of the Foreman.

---

## 9. Direction experience

The Direction Bar is a defining interaction.

### Persistent context

It always shows the target:

```text
Direct → Focusa / Workforce Redesign / Foreman
```

### Input modes

```text
typed
voice
page context
selection
context menu
```

All use the same typed Direction contract.

### Result states

```text
accepted
clarification required
proposal created
dispatched
blocked
denied
stale/revalidation required
```

### UI law

Do not insert repeated confirmation when:

- exact Workstream is known;
- actor authority is valid;
- operation consequence class does not require additional approval.

Do show scope before dispatch when ambiguity would materially change work.

---

## 10. Working Now / roster

People cards answer **responsibility first**.

```text
Builder-2
Implementation Specialist

Fixing login regression
Focusa / Workforce Extension

UIAI Chrome · Context 7
Last proof: tests 18/18
```

Progressive details:

```text
role/capabilities
assignment
Workstream
Foreman/manager
current work
runtime/model
body/location
budget/spend posture
authority posture
Evidence/history
```

Avoid model-provider logos as the primary identity.

---

## 11. Work progression / graph

Use three abstraction levels.

### Human view

```text
Mission
├─ Current
├─ Parallel
└─ Next
```

### Operations view

```text
groups
dependencies
responsible actors
blockers
acceptance
Evidence
```

### Technical view

```text
DAG
attempts
sessions
leases
generations
refs
receipts
```

The graph must explain work—not force the owner to think like a scheduler.

---

## 12. Needs You

`Needs You` is a shared source-bearing attention projection.

Allowed classes:

```text
approval
owner truth / clarification
authentication
takeover
budget/resource exception
recovery decision
meaningful blocker
high-value workforce signal
```

Excluded:

```text
worker started
heartbeat
ordinary tool event
ordinary completion
routine session churn
```

### Card anatomy

```text
WHAT
What needs the human?

WHY NOW
Why autonomous work cannot continue safely/usefully.

CONTEXT
Project / Workstream / work / worker.

CONSEQUENCE
What happens if approved/denied/deferred.

ACTIONS
Source-owned typed actions.

SOURCE
Owner/ref/revision/freshness/expiry.
```

### State law

```text
local seen/hidden/snoozed
!=
source approved/denied/resolved/cancelled/expired
```

Revalidate source revision before consequential action.

---

## 13. Evidence / verification

Evidence should make weak versus strong completion visually obvious.

Confidence vocabulary:

```text
Claimed
Observed
Supported
Verified
Settled
Unknown
Stale
```

Example:

```text
LOGIN REGRESSION

Implementation        ✓ Finished
Focused tests         ✓ 18 / 18
Browser verification  ✓ UIAI
Independent review    ✓ Verifier

VERIFIED
2m ago
[ Inspect Evidence ]
```

Weak state:

```text
DEPLOYMENT
Agent reports complete

UNVERIFIED
No external observation or settlement receipt.
```

### Closure chain

```text
activity
→ Evidence candidate
→ Focusa Evidence
→ verification
→ settlement / Receipt
→ accepted outcome
→ W.I.N.S. where applicable
```

Workforce displays the chain. It does not own W.I.N.S.

---

## 14. UIAI convergence

Workforce projects **execution context**, not Cockpit.

```text
Builder-2
Using UIAI
Chrome · Context 7
Stripe Dashboard
● Working

[ Watch ]
```

### Watch

Deep-links to exact UIAI execution context.

### Take control

Uses UIAI control/takeover flow.

### Return

UIAI re-observes/reconciles before autonomous continuation where required.

Workforce shows transitional state:

```text
Human control returned
Reconciling browser state…
```

Do not duplicate UIAI control lease machinery.

---

## 15. Fleet / topology

Translate infrastructure into organizational language.

Primary view:

```text
YOUR WORKFORCE

This Chromebook
Interactive surface

Cloud Team
4 people · 2 busy

Browser Team
3 contexts · 1 active

Build Computer
Tests running
```

Technical detail on demand:

```text
node/runtime/body refs
source environment
daemon
trust/enforcement
CPU/RAM/resources
spend
capabilities
health
```

One Operator’s infrastructure is a **fleet / aggregation**, not federation.

---

## 16. Multi-environment model

One browser can project multiple authorized Focusa environments.

The user sees a unified organizational lens while every entity retains:

```text
source domain
source environment
source daemon
owner/tenant scope
exact typed reference
source revision/freshness
```

Never merge reducer state between environments.

### Collision law

A bare ID is not globally unique.

Cross-product/environment refs follow ADLBOS `CROSS_PRODUCT_SEAM_CONTRACT.md`.

---

## 17. Time, freshness and degraded truth

States:

```text
Fresh
Stale
Unknown
Unavailable
Incompatible
```

Example:

```text
Last confirmed 3m ago
Connection lost — controls limited until refreshed
```

or:

```text
Work may still be running in Focusa.
Workforce cannot currently confirm state.
```

### Distributed-system rule

Wall-clock timestamps from independent machines do not establish causal order.

Prefer source:

```text
revision
sequence
epoch
generation
lease/version
```

If a consequential expiry is ambiguous due to clock confidence, revalidate with source rather than guessing.

The extension closing never implies work stopped.

---

## 18. Credentials and authentication

Workforce never becomes a credential manager.

For work requiring a provider credential, pass an opaque ADLBOS `operator.credential_use_ref.v1` or source-owned auth request.

Never place reusable secrets in:

```text
Direction text
page context
handoff URLs
Needs You cards
projection cache
Evidence
receipts/logs
```

UIAI/credential owner resolves authentication according to current authority.

---

## 19. Operating Partner projection

The user may see:

```text
ACME OPERATOR
Partner: Spock
Private
```

or:

```text
VERIOUS OPERATOR
Partner: Wirebot
Federated
```

The partner presentation comes from `operator.partner_profile.v1`.

Changing the display name does not change durable partner identity.

Within a Workstream, the Foreman remains the central accountable actor.

---

## 20. Delegated human operators

A Workforce deployment may be used by humans other than the Canonical Owner Principal.

Examples:

```text
assistant
employee
family operator
contractor
managed-service operator
```

Every consequential operation must carry current actor/delegation scope where applicable.

UI should make restricted scope legible without turning every screen into an IAM console.

Examples:

```text
You can inspect this Workstream but cannot approve deployment.
```

```text
Approval requires Owner.
[ Send to Owner ]
```

Delegated operation is not ownership.

---

## 21. Voice and ambient interaction

Voice is another Direction/attention input surface.

At Workstream scope:

```text
spoken direction → Foreman / Focusa work intent
```

At portfolio/life/business scope:

```text
broader conversation → Operating Partner / Wirebot
```

This boundary supports future:

```text
mobile
phone
wearable
earbuds
Ambient Operator
```

without creating separate authority semantics.

---

## 22. Browser-context operations

Explicit operations:

```text
Ask Foreman about this page
Send page to Foreman
Create work proposal from selection
Capture selection as Evidence candidate
Open page in UIAI
```

Default captured context:

```text
URL
title
explicit selection
browser-local tab/window ref
```

Do not ambiently collect full page bodies, password fields, forms, cookies, clipboard, history or all tabs.

Page context is data/evidence candidate, not authority.

---

## 23. Radar

Radar should enter Workforce only as actionable workforce context.

Useful examples:

```text
A dependency changed and affects this Workstream.
A production signal contradicts current assumptions.
A relevant upstream release may unblock work.
```

Radar signals should resolve to:

```text
informational
proposed work
Needs You
ignored / not relevant
```

Do not build a generic news/feed product inside Workforce.

---

## 24. Elastic capacity

Capacity appears as work-placement posture, not infrastructure shopping.

Example:

```text
Local build body is memory constrained.

Current
Chromebook · 82% memory pressure

Available
Cloud Agent Computer · entitled · ready

[ Move eligible work ]
```

The UI must distinguish:

```text
supported
entitled
activated
available
authorized
```

Moving work must preserve Workstream/Foreman continuity.

---

## 25. Contextual ecosystem expansion

Expansion belongs exactly where a real capability gap appears.

Examples:

```text
Browser execution required
UIAI is not entitled
[ Learn about UIAI ]
```

```text
Role unfilled
Compatible Draftees available
[ Explore candidates ]
```

```text
External collaboration could help
Operator is private
[ Explore federation ]
```

Rules:

- contextual, not generic banners;
- explanation first;
- purchase is not activation;
- activation is not authority;
- recommendations never silently alter work.

---

## 26. Visual design system

Target: **expensive calm**.

### Visual hierarchy

Use typography/space before borders/color.

Priority:

```text
Objective
Needs You
Working Now
Evidence
Navigation / metadata
```

### Color

Saturated color is scarce and semantic:

```text
attention
verified success
warning/degraded
active execution
```

Avoid neon AI gradients as the organizing visual language.

### Motion

Motion communicates real state transitions:

```text
worker changes state
new Needs You item
Evidence becomes verified
control handed to/from human
Workstream focus changes
```

No perpetual “AI is thinking” spectacle.

### Density

Primary surfaces remain calm.

Technical detail expands on demand.

### Icons

Use consistent simple iconography with labels for high-consequence actions.

### Dark/light

Both may be supported, but semantic contrast/focus must remain equivalent.

---

## 27. Responsive model

### Side panel

~320–500px width.

Single-column hierarchy.

### Chromebook / normal desktop

Three-region layout where useful:

```text
navigation/context
main work
attention/evidence
```

### Narrow full-page / tablet

Collapse right rail into contextual drawer; preserve Direction and Needs You priority.

### Touch

High-value actions meet comfortable touch targets and avoid hover dependence.

---

## 28. Accessibility

Minimum acceptance:

- semantic headings/regions;
- keyboard navigation;
- visible focus;
- screen-reader labels;
- status not conveyed by color alone;
- motion reduction support;
- accessible contrast;
- logical focus after dynamic updates;
- no auto-focus theft during live events;
- high-consequence action labels remain explicit.

Live event updates should not cause constant screen-reader interruption.

---

## 29. Notifications

Notify only when owner/user attention is likely useful.

Good:

```text
Deployment approval required
UIAI needs authentication
Foreman needs product clarification
Recovery requires a decision
```

Bad:

```text
Worker started
Tool called
Heartbeat received
Ordinary node completed
```

Notifications privacy-minimize content and open exact source context.

---

## 30. Runtime architecture target

The biggest technical UX problem in the current code is page-local connectivity/state ownership.

Target:

```text
MV3 service worker
       |
       v
Workforce Runtime Client
  environment registry
  pairing/auth handles
  snapshot normalization
  event stream coordination
  attention broker
  handoff router
  cache/freshness
       |
       v
Shared application state
       |
 ┌─────┼─────────┬──────────┐
 v     v         v          v
Panel Full App  Start Page  Wall
```

### Preserve existing core logic where correct

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

Do not rewrite these just to make the UI framework cleaner.

---

## 31. Presentation implementation target

Recommended:

```text
Svelte 5
JavaScript + JSDoc
MV3-compatible bundling
```

Not SvelteKit unless a future requirement materially needs its application/router/server model.

Proposed source shape:

```text
src/
├── core/              existing/preserved domain clients
├── runtime/
│   ├── workforce-client.js
│   ├── environment-runtime.js
│   ├── event-runtime.js
│   └── handoff-runtime.js
├── stores/
│   ├── environment.js
│   ├── selection.js
│   ├── workforce.js
│   ├── attention.js
│   ├── evidence.js
│   └── topology.js
├── components/
│   ├── ForemanCard.svelte
│   ├── DirectionBar.svelte
│   ├── NeedsYouList.svelte
│   ├── AgentCard.svelte
│   ├── WorkProgress.svelte
│   ├── EvidenceCard.svelte
│   └── ExecutionPosture.svelte
└── surfaces/
    ├── sidepanel/
    ├── workforce/
    ├── startpage/
    └── wall/
```

Exact folders may change. The architectural separation should not.

---

## 32. State architecture

### Canonical state

Always upstream.

### Extension state

Only:

```text
pairing/environment metadata
bounded auth handles
selected context
projection cache
freshness/event cursors
UI preferences
presenter-only acknowledgement
release diagnostics
```

### Shared selection

One selected context model should drive surfaces:

```text
environment
project
workstream
foreman
optional work/agent/evidence focus
```

A deep link updates selection; it does not copy canonical state.

---

## 33. Public demo behavior

The public demo is a product demonstration, not an authority-capable mirror of private customer state.

Rules:

- fixture/demo projection only;
- no customer secrets/data;
- clearly distinguish demo/snapshot freshness;
- no private mutation path;
- demonstrate product mental model, not internal implementation complexity.

The redesign should make `os.focusa.dev` useful as a product story without making public-demo behavior dictate private runtime architecture.

---

## 34. Failure-state design

Every core surface needs:

```text
loading
empty
fresh
stale
offline
incompatible
unauthorized
unentitled
operation blocked
operation outcome unknown
reconciling
```

The UI must distinguish:

```text
“No work exists”
from
“Workforce cannot retrieve work.”
```

and:

```text
“Operation failed”
from
“Operation result is unknown; reconciling.”
```

---

## 35. Security / authority gotchas

### Never infer authority from

```text
role name
model capability
entitlement
credential existence
network membership
pairing
source reference
browser permission
```

### Never treat

```text
local cached approval
presenter acknowledgement
old capability posture
stale handoff
```

as current mutation authority.

### Never leak

```text
raw credentials
private page/form data
customer project data into demo
partner-wide private memory into workers
```

---

## 36. Product gotchas

### Do not make Workforce a second Wirebot

Owner-wide conversation/portfolio orientation remains Wirebot.

### Do not make Foreman a chat persona detached from work

Foreman interaction stays anchored to Workstream state.

### Do not make UIAI a video widget inside Workforce

Use exact handoff to Cockpit.

### Do not turn topology into Kubernetes-for-humans

Translate infrastructure into organizational posture first.

### Do not create “approval center” as a second truth store

Needs You projects source-owned attention.

### Do not expose every event

Show meaningful work progression; audit remains deeper.

### Do not make demo data drive private architecture

Public demo is an adapter/profile.

---

## 37. Implementation sequence

Build in vertical slices:

```text
Slice 1 — Workstream + Foreman + Direction
Slice 2 — Working Now / roster
Slice 3 — Needs You
Slice 4 — work progression / graph
Slice 5 — Evidence / verified closure
Slice 6 — UIAI execution / takeover
Slice 7 — voice
Slice 8 — fleet / topology
Slice 9 — Radar
Slice 10 — elastic capacity
```

### Why this order

Slice 1 establishes the core mental model:

```text
scope
accountability
human direction
real Focusa operation
```

Everything else attaches to it.

Do not spend a separate cycle building generalized framework infrastructure before Slice 1 renders and operates real state.

---

## 38. Redesign migration strategy

Use a strangler-style replacement.

```text
existing core modules
        |
        +--> new shared runtime adapter
                  |
                  +--> new Svelte surface slice

legacy surface remains available until replacement slice proves parity/usefulness
```

Avoid one giant rewrite.

For each migrated feature:

1. bind existing/source operation;
2. implement new projection/store;
3. render new UX;
4. test real mutation/reconciliation;
5. verify Chromebook browser flow;
6. remove superseded legacy UI only after parity/usefulness is proven.

---

## 39. Browser-level acceptance journeys

### Journey A — return and orient

```text
open side panel
→ correct Operator + environment
→ active Workstream
→ Foreman + objective
→ working people
→ Needs You
→ latest verified proof
```

### Journey B — direction

```text
enter “Prioritize login regression; do not deploy”
→ exact Workstream/Foreman target visible
→ Focusa accepts direction
→ interpretation/progression updates
→ constraint visible in work state
```

### Journey C — clarification

```text
Foreman requests product truth
→ Needs You
→ user answers
→ same source item resolves
→ work continues
```

### Journey D — UIAI takeover

```text
worker reaches auth boundary
→ Needs You
→ Watch/Take control exact UIAI context
→ human acts
→ return
→ reconciling state
→ work resumes
```

### Journey E — proof

```text
worker claims done
→ claim remains unverified
→ Focusa/UIAI/verifier Evidence arrives
→ status upgrades to Verified/Settled according to source
```

### Journey F — degraded source

```text
connection drops
→ cached state marked stale
→ no stale approval mutation
→ source reconnects
→ revisions revalidated
→ controls restore
```

### Journey G — multi-environment collision

```text
environment A and B contain same bare local ID
→ typed/source refs keep entities separate
→ no cross-environment mutation
```

---

## 40. Definition of redesign success

The redesign is successful when a nontechnical owner can say:

> “I know what my team is working on, who is responsible, what actually needs me, what has been proven, and I can redirect the work without managing the machinery.”

and a technical operator can still drill down to:

```text
exact environment
Workstream / Workpoint
worker/session/runtime
UIAI execution
source revision
Evidence / Receipt
correlation
health / audit
```

without the product inventing a second source of truth.
