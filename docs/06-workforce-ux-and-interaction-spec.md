# Focusa Workforce — UX and Interaction Specification

**Status:** product UX contract  
**Goal:** make the workforce understandable and operable in seconds, without turning Focusa primitives into a generic dashboard or duplicating Wirebot/UIAI.

---

## 0. Experience principle

The user should feel:

> **My workforce is here, working, inspectable, steerable, and accountable.**

The interface should answer before it decorates.

```text
Who is working?
What are they doing?
What needs me?
What is blocked?
What is proven?
Where is work running?
What should happen next?
```

---

## 1. Surface hierarchy

### Side Panel — ambient operations

Primary high-frequency surface.

Structure:

```text
[ Environment ]       [ health ]
[ Project / Workstream selector ]

Foreman
  current objective
  current Workpoint
  status / attention

Direction Bar
  [ type or speak ]

Needs You
  approvals
  blockers
  auth/takeover

Working Now
  workers / assignments / runtimes

Verified Recently
  evidence-backed outcomes

[ Open Workforce ] [ UIAI ]
```

The side panel should not try to fit the full graph/audit system.

### Full Workforce — deep operations

Recommended desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Environment · Workstream · Foreman           Search / Voice │
├───────────────┬──────────────────────────────┬───────────────┤
│ Workforce     │                              │ Attention     │
│ roster        │        Work / graph          │ approvals     │
│               │                              │ blockers      │
│ Foremen       │                              │ evidence      │
│ Managers      │                              │               │
│ Workers       │                              │               │
├───────────────┴──────────────────────────────┴───────────────┤
│ Direction Bar / current selection / action context          │
└──────────────────────────────────────────────────────────────┘
```

Panels should be collapsible on Chromebook-sized screens.

### Start Page — operational return point

Optional, calm, sparse.

```text
Good afternoon

3 agents working
1 decision needs you
2 verified outcomes since last visit

[ Direction Bar ]

Continue
- Project A — Foreman waiting on verification
- Project B — build running in cloud

Needs You
- approve production deploy

Verified
- login regression fixed and tests passed
```

No news-feed behavior.

---

## 2. Navigation model

Top-level mental model:

```text
Overview
Workforce
Work
Evidence
```

Approvals and Audit should be accessible globally and contextually rather than necessarily consuming permanent primary-navigation slots.

Topology is contextual from Workforce/Work and available as a dedicated diagnostic/operations view when needed.

The user should rarely need to think about navigation to perform routine steering.

---

## 3. Scope is always visible

Every consequential action must make current scope obvious.

Persistent scope strip:

```text
Environment: Private VPS
Project: Focusa
Workstream: Chrome Extension
Foreman: Foreman / Chrome Extension
```

If scope changes, update visually before accepting consequential direction.

Do not infer canonical scope from the active tab alone.

---

## 4. Workforce roster

### Agent card

Each agent card should communicate in approximately this order:

```text
[status] Agent Name / Role
Assignment
Workstream
Runtime / body
Last meaningful action
Evidence / blocker / attention
```

Expanded details:

```text
capabilities
authority posture
budget/spend
runtime attachment
session/execution reference
worker parent/manager
recent audit
stop/pause/direct/open execution
```

### Status language

Prefer human-operational wording:

```text
Working
Waiting
Needs approval
Blocked
Verifying
Ready for review
Completed — verified
Failed
Disconnected
Unknown
```

Avoid exposing internal enum names unless diagnostics are enabled.

### Agent visual identity

Use stable role/identity cues, but do not anthropomorphize state falsely.

A pulsing avatar is not proof an agent is working.

---

## 5. Work graph

The graph should communicate execution dependencies without becoming an engineering diagram by default.

Default representation:

```text
Current
  Implement pairing       Working · Builder-2
      ↓
  Verify pairing          Waiting
      ↓
  Chromebook acceptance   Waiting

Parallel
  UI polish               Working · Designer-1
  Docs                    Verified
```

Users may switch to a detailed DAG when useful.

### Node interaction

Selecting a node opens a detail panel containing:

```text
objective
acceptance criteria
assigned agent
runtime
dependencies
status/blocker
approvals
Evidence
recent activity
Direction / reprioritize / pause / stop
```

---

## 6. Direction Bar

The Direction Bar is the product's highest-value control.

### Default state

```text
Direct Chrome Extension Foreman…
```

The placeholder itself reflects scope.

### While typing

Show lightweight resolution chips:

```text
To: Chrome Extension Foreman
Scope: Focusa / Workforce Extension
Execution: automatic within current grants
```

If the request implies a consequential operation, do not pretend it has already executed.

### Result states

```text
Sent to Foreman
Proposal prepared
Needs approval
Dispatched
Blocked — missing capability
Completed — awaiting verification
Verified
```

Direction responses should not become an endless chat stream. Keep the interaction attached to work and outcomes.

---

## 7. Voice

Voice UI should be immediate and inspectable.

```text
[ mic ]
Listening…
"Move the build work to the cloud computer"

To: Chrome Extension Foreman
[ Cancel ] [ Send ]
```

For low-risk conversational direction, optional fast-send behavior may be added later according to Focusa voice contracts.

Always make listening state obvious.

---

## 8. Needs You / attention

One unified attention stack, ordered by consequence and actionability.

Possible items:

```text
Approval required
Authentication/takeover required
Blocked work requiring owner truth
Budget/resource decision
Failed recovery needing owner decision
High-value Radar signal
```

Do not mix informational agent chatter into this list.

Each attention item must have one obvious primary action.

---

## 9. Approval experience

Approval card example:

```text
Production deploy
Builder-3 · Focusa / Workforce

Will:
• deploy release 0.3.4 to production
• restart the service

Evidence:
✓ tests passed
✓ verifier approved artifact

Risk: external effect · reversible by rollback

[ Deny ] [ Review details ] [ Approve deploy ]
```

Never present:

```text
Agent wants permission.
[Approve] [Deny]
```

without consequences/target.

---

## 10. Evidence experience

Evidence should feel like the workforce showing its work.

Evidence card:

```text
✓ Verified
Pairing survives Chrome restart

Source: acceptance run #...
Verifier: QA-1
Work: pairing persistence
Captured: 3 min ago

[ Inspect ]
```

Unverified example:

```text
○ Unverified claim
Builder reports deployment succeeded
No independent deployment evidence yet
```

This distinction must be visually obvious.

---

## 11. Audit experience

Audit is not a raw log dump by default.

Readable timeline:

```text
2:14 PM  You
         "Move build work to cloud"

2:14 PM  Foreman
         Selected Cloud Agent Computer A

2:15 PM  Builder-2
         Build started

2:19 PM  Builder-2
         Build artifact produced

2:20 PM  Verifier-1
         ✓ artifact verified
```

Advanced detail may expose operation IDs, receipts, refs and raw structured events.

---

## 12. UIAI handoff

When a worker is using UIAI:

```text
Browser execution
UIAI · Chrome Context 7
Working on Stripe dashboard

[ Watch in Cockpit ]
```

If control is with the human:

```text
Operator has control
Agent waiting for return/reconciliation
```

Do not duplicate the entire Cockpit inside Workforce.

---

## 13. Topology and bodies

Topology should be human-readable first.

```text
This Chromebook
Interactive · Healthy
Workforce UI / Voice
Memory pressure: normal

Cloud Agent Computer
Heavy compute · 4 workers
12 GB / 32 GB memory

UIAI Browser Context
1 active browser worker

Phone
Voice companion · connected
```

Future:

```text
Humanoid Body
Physical presence · attached
locomotion / manipulation available
```

Never imply body capability that has not been verified.

---

## 14. Resource/offload UX

The user should not manage infrastructure merely to stay responsive.

Example:

```text
This build needs more memory than the Chromebook should use locally.

Recommended:
Run on Cloud Agent Computer
Estimated additional usage: within plan

[ Run remotely ]
```

Where current policy already authorizes automatic placement:

```text
Build moved to Cloud Agent Computer
Chromebook remains interactive
```

Topology choice remains inspectable.

---

## 15. Browser-context interaction

Right-click/context actions should be terse:

```text
Focusa Workforce
  Ask Foreman about page
  Research page
  Send page to Foreman
  Capture selection
  Open in UIAI
```

After action, use a small confirmation with exact scope:

```text
Sent to: Marketing Foreman
Workstream: Q4 Launch
```

---

## 16. Empty states

Empty states should teach the next useful action.

### No pairing

```text
Connect Focusa Workforce
Pair this browser with the Focusa environment that owns your work.
[ Add environment ]
```

### No active workforce

```text
No agents are active in this Workstream.
[ Direct Foreman ]
```

### No approvals

```text
Nothing needs your approval.
Your workforce can continue within its current authority.
```

### No Evidence

```text
No Evidence has been attached to this work yet.
Completion should remain unverified.
```

---

## 17. Error/degraded states

Errors must preserve truth and forward motion.

Bad:

```text
Something went wrong.
```

Good:

```text
Focusa disconnected 18s ago.
Showing last-known state from 2:41 PM.
No new directions can be safely submitted until scope is refreshed.
[ Reconnect ]
```

If another environment remains healthy, keep it usable.

---

## 18. Visual language

The extension should be calm, premium and operational.

Guidance:

- generous whitespace;
- strong typography hierarchy;
- restrained motion;
- status expressed with icon + text, not color alone;
- minimal chrome;
- dense information only when expanded;
- project/role identity stable across surfaces;
- Evidence and approvals visually stronger than decorative metrics;
- no gamer-style agent swarm visualization by default.

The product should feel suitable for a premium/luxury Agent Computer experience without requiring expensive visual effects.

---

## 19. Chromebook responsive behavior

At narrow widths:

- roster collapses into drawer/list;
- work detail takes center stage;
- attention is reachable without horizontal scroll;
- Direction Bar remains persistently reachable;
- graph falls back to ordered dependency list;
- large Evidence previews open separately;
- touch targets support convertible/tablet use.

---

## 20. Keyboard shortcuts

Candidate shortcuts, subject to Chrome conflicts:

```text
Open Workforce
Open Direction Bar
Push-to-talk
Switch Workstream
Open attention
Open active execution/UIAI
```

Do not seize common browser/ChromeOS shortcuts without explicit user configuration.

---

## 21. First complete UI slice

Build this before broadening:

```text
Side Panel
  scope
  Foreman
  Direction Bar
  Needs You
  Working Now
  Verified Recently

Full App
  roster
  work list/graph
  approval detail
  evidence detail
  audit timeline
```

Then add:

```text
voice
topology/resource posture
multi-daemon lens
context menus
start page
advanced graph
```

---

## 22. UX acceptance test

A first-time but authorized user should be able to open Workforce and, without documentation, correctly answer within roughly one minute:

1. which Workstream is selected;
2. who the responsible Foreman is;
3. what agents are actively working;
4. what is blocked or needs approval;
5. what was recently verified;
6. where to give new direction;
7. how to inspect a live UIAI execution;
8. whether displayed state is current or stale.

If those answers are unclear, visual polish is not yet the priority.
