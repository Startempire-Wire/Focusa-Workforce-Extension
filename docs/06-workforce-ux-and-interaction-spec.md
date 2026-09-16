# Focusa Workforce — UX and Interaction Specification

**Status:** CURRENT redesign UX direction  
**Depends on:** canonical Workforce spec, runtime/data contracts, ADLBOS ecosystem architecture, Wirebot App convergence.

The UX goal is simple:

> **My workforce is here, working, inspectable, steerable, collaborative and accountable.**

The extension should not feel like a monitoring dashboard placed beside autonomous agents. It should feel like a shared work environment where the human, their Operating Partner, the Workstream Foreman and the execution workforce collaborate at the right altitude.

---

## 1. Core experience

At any moment, the user should be able to answer:

```text
What are we trying to accomplish?
Who is responsible?
What is happening now?
What changed?
What is blocked?
What genuinely needs me?
What has been proven?
Where is work executing?
What can I direct next?
```

The interface should prioritize **orientation, direction, intervention and confidence**.

Anything that does not improve one of those should earn its place one layer down.

---

## 2. Human-agent collaborative loop

Design the entire product around this loop:

```text
ORIENT
  ↓
DIRECT
  ↓
INTERPRET / PROPOSE
  ↓
DELEGATE
  ↓
WORK
  ↓
COLLABORATE / INTERVENE
  ↓
VERIFY
  ↓
CONTINUE / LEARN
```

### Orient

Answer immediately:

- current Workstream objective;
- Foreman;
- working agents;
- meaningful blockers;
- owner attention;
- recent verification;
- freshness/health.

### Direct

Human types or speaks natural intent into the current Workstream/Foreman scope.

The UI shows exact resolved scope when ambiguity is material.

### Interpret / Propose

When useful, the Foreman may expose its concise understanding:

```text
Priority
Fix login regression first.

Approach
Reproduce → patch → focused tests → independent verification.

Workers
Builder-2 · Verifier-1

Proceeding
```

This is shared situational awareness, not a forced approval ceremony.

### Delegate

Show responsibility rather than spawned-process trivia:

```text
Login regression
├─ Builder        Working
├─ UIAI Browser   Reproducing
└─ Verifier       Waiting on patch
```

### Work

Show meaningful progression:

```text
Reproducing
→ cause identified
→ patch underway
→ tests
→ verification
```

Raw tool/model events live deeper in audit/debug views.

### Collaborate / Intervene

Human interaction should appear at the point of need:

```text
Foreman needs product truth
Which behavior is intentional?
[ Answer ]
```

```text
UIAI needs authentication
[ Take control ]
```

```text
You: Keep this surgical. Do not rewrite auth.
Foreman: Constraint updated.
```

### Verify

Make proof visible and legible.

### Continue / Learn

After owner input/takeover/verification, the work should reconcile and continue without manual session archaeology.

---

## 3. Surface roles

### Side Panel — collaborate now

Best for:

- orientation while browsing;
- Workstream/Foreman status;
- Direction;
- Needs You;
- Working Now;
- quick verification;
- page-context operations;
- UIAI watch/takeover.

Suggested structure:

```text
[ Operator / Environment ]    [ health ]
[ Project / Workstream ]

FOREMAN
current objective
current Workpoint / state

[ Direct Foreman… ]

NEEDS YOU
1 approval · 1 clarification

WORKING NOW
Builder-2      Working
Verifier-1     Waiting
Browser        UIAI active

VERIFIED RECENTLY
Login repro confirmed

[ Open Workforce ]  [ Watch ]
```

### Full Workforce — deep operations

Best for:

- multi-Workstream navigation;
- people/roles;
- dependency/work graph;
- all current attention;
- Evidence;
- detailed work history;
- topology/fleet;
- resource posture;
- larger review/steering sessions.

### Start Page — return to the organization

A calm briefing, not a widget landfill.

```text
Good morning.

Current focus
Customer-ready Workforce redesign

Needs You
2

Working
5 agents · 3 Workstreams

Verified since last visit
3 outcomes
```

### Wall

Read-only shared situational projection for a larger screen.

---

## 4. Wirebot / Operating Partner convergence

Workforce must not feel like a disconnected second application.

The customer may know their partner as `Spock`, `Athena`, or another selected name.

Workforce can project that identity quietly:

```text
ACME OPERATOR
Partner: Spock
Private
```

But the central work actor inside a Workstream is the **Foreman**, not the partner.

Wirebot App and Workforce show the same underlying work at different altitudes:

```text
Wirebot
“Focusa launch is drifting. The extension redesign is the blocker.”
[ Follow in Workforce ]

            ↓ exact handoff

Workforce
Focusa / Workforce Extension
Foreman · workers · work · attention · Evidence
```

Handoff must preserve exact context.

---

## 5. Needs You

`Needs You` is one of the product's defining experiences.

Only include items requiring owner comparative advantage.

Classes:

```text
approval
clarification / owner truth
authentication
takeover
budget/resource exception
recovery decision
meaningful blocker
high-value opportunity/signal
```

Do not include routine worker starts, heartbeat noise or ordinary completions.

Card requirements:

- what needs the owner;
- why now;
- Workstream/work context;
- consequence/reversibility when relevant;
- recommended/available actions;
- expiry if applicable;
- freshness/source;
- exact deep link.

Same source item may appear in Wirebot's owner-wide `Needs You`; resolving it from either surface must resolve the same source object.

---

## 6. Foreman experience

The Foreman should feel like the accountable project/workstream leader.

Show:

```text
name / identity
Workstream
objective
current Workpoint / phase
current responsibility
workers
attention
last meaningful Evidence
health/freshness
```

Foreman interaction should remain work-connected.

Avoid endless chat transcript as primary UI.

Useful actions:

```text
Direct
Ask about current state
Ask why this path
Change priority/constraint
Inspect delegation
Inspect evidence
Pause/resume supported work
```

Answers should cite current work/evidence refs when relevant.

---

## 7. Roster / People

Agent cards emphasize responsibility and state, not model branding.

Example:

```text
Builder-2
Implementation Specialist

Working
Login regression patch

Focusa / Workforce Extension
UIAI Chrome · Context 7

Last proof
Focused tests 18/18
```

Progressively reveal:

- role/capabilities;
- assignment;
- authority posture;
- model/runtime;
- budget/spend;
- body/execution location;
- Evidence/history.

Foremen/Managers/Workers/Verifiers should be visually distinguishable without cartoon gamification.

---

## 8. Work and task graph

Use progressive abstraction.

### Owner/human view

```text
Mission
→ Current
→ Parallel
→ Next
```

### Operations view

Groups, dependencies, responsible actors, blockers and acceptance.

### Technical view

Exact DAG / attempts / sessions / leases / refs / receipts.

A nontechnical owner should never need to understand graph theory to understand whether work is progressing.

---

## 9. Evidence UX

Evidence should materially change how “done” feels.

Use confidence/state language consistently:

```text
Claimed
Observed
Supported
Verified
Settled
Unknown
Stale
```

Example verified card:

```text
LOGIN REGRESSION

Implementation       ✓
Focused tests        ✓ 18/18
Browser verification ✓ UIAI
Independent review   ✓

VERIFIED
2 minutes ago
[ Inspect Evidence ]
```

Example unverified card:

```text
DEPLOYMENT

Agent reports complete
UNVERIFIED
No external observation or settlement receipt yet.
```

Do not decorate weak proof into certainty.

---

## 10. UIAI UX

Workforce should show computer activity in context:

```text
Builder-2
Using UIAI
Chrome · Context 7
Stripe Dashboard
● Working
[ Watch ]
```

`Watch` opens UIAI at exact execution context.

`Take control` belongs to UIAI's governed takeover path.

When control returns, Workforce should show that work is reconciling/re-observing before autonomous continuation if required.

Do not embed a second full Cockpit into Workforce simply to avoid navigation.

---

## 11. Direction Bar

Direction is persistent/contextual, not a separate chatbot destination.

Placement:

- visible in side panel;
- sticky/contextual in full Workforce;
- scoped explicitly to active Workstream/Foreman;
- voice uses the same contract.

Examples:

```text
Prioritize the login issue.
Use another verifier.
Don't deploy this yet.
Move the build to cloud capacity if local pressure remains high.
Explain why checkout is blocked.
```

The UI should show whether the direction was:

```text
accepted
clarification required
proposal created
dispatched
blocked/denied
```

without inventing state beyond Focusa.

---

## 12. Operator / sovereign UX

Workforce may quietly show:

```text
Operator
Acme Manufacturing

Partner
Spock

Deployment
Sovereign · Managed

Network
Private
```

or:

```text
Network
Federated
2 shared capabilities · 1 collaboration
```

This is posture, not a network dashboard.

Broad network operations hand off to Wirebot/Startempire surfaces.

---

## 13. Fleet / topology UX

Translate infrastructure into organizationally useful language.

Prefer:

```text
Your Workforce

This Chromebook
Interactive surface

Cloud Team
4 workers · 2 busy

Browser Team
3 contexts · 1 active

Build Computer
Tests running
```

with technical detail available on demand:

- node/runtime/body refs;
- trust/enforcement posture;
- resources;
- spend;
- health;
- capabilities.

Do not call this federation.

---

## 14. Capability / contextual expansion UX

Expansion appears only where the current work reveals a useful adjacent capability.

Examples:

```text
This task requires browser control.
UIAI Engine can complete it without handing it back to you.
[ Learn about UIAI ]
```

```text
The current body is resource constrained.
Cloud Agent Computer capacity can continue this work.
[ Review capacity ]
```

```text
This role is unfilled.
Compatible Draftees are available.
[ Explore candidates ]
```

Always distinguish current posture:

```text
Available
Requires setup
Not entitled
Active
Unavailable
```

Do not make the product feel like an upsell storefront.

---

## 15. Page-context actions

Context menu / browser actions:

```text
Ask Foreman about this page
Send page to Foreman
Create work from selection
Capture selection as Evidence candidate
Open page in UIAI
```

Current-page data collection stays explicit and minimal.

---

## 16. Voice

Voice should feel like speaking to the responsible work system, not activating a separate assistant.

At Workstream scope, spoken direction routes to the same Foreman/Direction intent.

At owner/portfolio scope, Wirebot App remains the appropriate broader conversation surface.

The architecture should support future phone/earbuds/Ambient Operator surfaces using the same intent and attention semantics.

---

## 17. Degraded/offline states

Never bluff freshness.

States:

```text
Fresh
Stale
Unknown
Unavailable
Incompatible
```

Examples:

```text
Last confirmed 3m ago
Connection lost — controls limited until refreshed
```

or:

```text
Work may still be running in Focusa.
Workforce cannot currently confirm state.
```

The browser closing/offline state never implies workers stopped.

---

## 18. Notifications

Notify for meaningful owner attention, not agent activity.

Good:

```text
Deployment approval required
UIAI needs takeover
Foreman needs product clarification
Recovery requires a choice
```

Bad:

```text
Worker started
Worker ran tool
Worker completed ordinary node
```

Notification content should be privacy-minimized and open exact context.

---

## 19. Visual system

Target: **expensive calm**.

Principles:

- high-quality typography;
- generous but efficient spacing;
- clear hierarchy;
- minimal borders/chrome;
- restrained color;
- subtle elevation/spatial grouping;
- motion used for state change, not decoration;
- crisp microinteractions;
- excellent empty/loading/error states;
- meaningful icons;
- responsive Chromebook/desktop layouts;
- strong dark/light modes if both are supported;
- accessible contrast/focus/touch targets.

Avoid:

```text
gamer swarm dashboards
neon AI aesthetic
constant animation
giant stat grids
over-personified cartoon agents
raw JSON/IDs as primary UI
terminal cosplay
```

---

## 20. Navigation principle

Favor contextual expansion over page hopping.

A user should be able to move:

```text
Wirebot summary
→ exact Workforce context
→ exact UIAI execution
→ back to same Workforce context
→ owner outcome
```

without losing scope.

---

## 21. Acceptance journeys

### A. Owner delegates through Wirebot

```text
Owner: “Get the extension ready for customer testing.”
→ Wirebot delegates bounded desired outcome
→ Focusa resolves Workstream/Foreman
→ Workforce opens exact context
→ workers execute
→ owner sees proof/outcome
```

### B. Foreman needs truth

```text
Foreman blocked on intended product behavior
→ Needs You
→ owner answers in Wirebot or Workforce
→ same attention source resolves
→ work resumes
```

### C. UIAI takeover

```text
worker reaches MFA/auth boundary
→ Needs You
→ owner takes control in UIAI
→ UIAI reconciles/re-observes
→ worker continues
→ Evidence records result
```

### D. Resource expansion

```text
local machine constrained
→ Workforce shows truthful posture
→ eligible cloud capacity suggested
→ entitlement/authority/setup resolved by owners
→ work moves
→ same Workstream continuity retained
```

### E. Verified completion

```text
worker claims done
→ Evidence inspected/verified
→ Focusa settlement
→ accepted outcome
→ Wirebot/W.I.N.S. projection
```

---

## 22. UX law

> **The user should spend their attention on direction, judgment and meaningful intervention—not managing agent machinery.**

Workforce succeeds when complex multi-agent execution becomes understandable and steerable without hiding uncertainty, proof, authority or ownership boundaries.
