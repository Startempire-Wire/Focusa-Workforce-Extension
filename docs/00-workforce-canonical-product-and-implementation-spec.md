# Focusa Workforce — Canonical Product and Implementation Specification

**Status:** canonical product/build direction for this repository  
**Date:** 2026-09-14  
**Product name:** Focusa Workforce  
**Primary surface:** Chrome/Chromium extension  
**Architecture posture:** browser-resident workforce operations surface; not the runtime, not the source of truth

---

## 0. Outcome

Build **Focusa Workforce** into the complete browser-resident surface for operating a human-owned agent workforce across local computers, cloud Agent Computers, Silent Sessions, UIAI browser/computer execution, and future body profiles.

The extension must be immediately useful on a Chromebook while remaining a first-class surface inside the broader Focusa/Veragensia ecosystem.

The product should feel like:

> Open the browser and your workforce is already there: who is working, what they are doing, what needs you, what is proven, where work is running, and what you can direct next.

It must not feel like:

- a generic chatbot;
- a devtools panel;
- a remote terminal;
- a second Focusa database;
- a second Wirebot App;
- a second UIAI Cockpit;
- a dashboard full of ornamental metrics.

---

## 1. Product role

```text
Human
  |
  +-- Wirebot ---------------- life/business Chief of Staff relationship
  |
  +-- Focusa Workforce ------- workforce operations
  |      |
  |      +-- Foremen / Managers
  |      +-- Workers / Crew
  |      +-- Workstreams
  |      +-- Task graphs
  |      +-- Direction
  |      +-- Approvals
  |      +-- Evidence
  |      +-- Audit
  |      +-- topology/body posture
  |
  +-- Focusa Desktop --------- deep project/work cognition surface
  |
  +-- UIAI Cockpit ----------- live browser/computer execution oversight/control
  |
  +-- Veragensia ------------ body/runtime/enforcement/placement substrate
```

### 1.1 Product law

**Workforce operates the workforce.**

Wirebot decides and coordinates across life/business context. Focusa owns canonical work/cognition/authority state. UIAI owns browser/computer execution. Veragensia owns machine/body integration and enforcement.

Workforce makes those primitives legible and operable in the browser without copying their authority.

---

## 2. Primary user jobs

The operator must be able to:

1. see every active Foreman/Manager and worker relevant to the current owner scope;
2. understand each agent's assignment, status, location/runtime, spend/resource posture, and last verified outcome;
3. switch between Projects and Workstreams without losing context;
4. inspect the task/work graph and current ready/running/blocked frontier;
5. give natural-language or structured direction to the owning Foreman/Manager;
6. inject/reprioritize bounded work during execution;
7. review approvals and understand the exact consequence before deciding;
8. inspect Evidence/Receipts and distinguish verified, unverified, uncertain, failed, and pending outcomes;
9. inspect audit history and trace human direction → agent action → evidence → result;
10. open the exact UIAI Cockpit/FPV execution surface for browser/computer work;
11. see where work is running: local computer, cloud Agent Computer, workcell, Silent Session, browser context, specialist runtime, future physical body;
12. request more workforce/capacity through canonical topology operations when available;
13. speak direction through voice without creating a parallel voice authority system;
14. reconnect after browser close/restart without losing durable work;
15. use the extension as a useful Chromebook-native daily surface even when heavyweight execution runs elsewhere.

---

## 3. Information architecture

### 3.1 Persistent shell

The extension should provide a stable shell with:

```text
Owner / environment selector
Project / Workstream scope
global Direction Bar
attention / approval count
connection + freshness posture
body/topology summary
quick access to UIAI
```

Recommended primary destinations:

```text
Overview
Workforce
Work
Approvals
Evidence
Audit
Topology
```

These are logical destinations, not a requirement for seven fixed tabs. Side panel, full-page app, start page, and contextual browser surfaces may compose them differently.

### 3.2 Overview

Purpose: immediate operational orientation.

Show only information that changes action:

- active Workstream / Foreman;
- what is running now;
- what needs owner attention;
- blockers/failures;
- next likely decision;
- recently verified outcomes;
- current local/cloud resource posture;
- stale/degraded connectivity.

No vanity charts.

### 3.3 Workforce

The roster is organizational, not merely process-oriented.

Each card/row should expose:

```text
identity / role
Foreman | Manager | Worker | Verifier | Specialist
current assignment
Workstream
runtime/body/node
status
last meaningful event
last Evidence/Receipt
budget/spend where applicable
authority/capability posture
controls: inspect / direct / pause / stop / open execution
```

Worker identity and role MUST come from Focusa-owned contracts.

### 3.4 Work

A graph/timeline hybrid should make the execution model understandable.

Required states:

```text
proposed
ready
queued
running
waiting
blocked
awaiting_approval
verifying
review_ready
completed_verified
failed
unknown
cancelled/stopped
```

The surface must preserve the distinction between:

- work existing;
- work dispatched;
- an agent claiming completion;
- Evidence existing;
- outcome being verified/settled.

### 3.5 Approvals

Each approval must answer:

```text
Who is asking?
What exactly will happen?
What resource/account/body is affected?
Why is approval required?
What evidence/context supports the request?
What are the material effects?
Can it be reversed?
What happens if I deny/defer?
```

Never reduce consequential approval to unlabeled Approve/Deny buttons.

### 3.6 Evidence

Evidence is a first-class product surface, not an attachment drawer.

Support:

```text
artifact
file/diff
screenshot/frame
UIAI execution proof
test/build result
receipt
external-system record
operator observation
verification result
```

Display provenance, freshness, scope, verification posture and related Workpoint/task.

### 3.7 Audit

The audit timeline should support causal tracing:

```text
human direction
→ Foreman interpretation/proposal
→ assignment/delegation
→ worker execution
→ tool/computer actions
→ approvals/interventions
→ evidence
→ verification/settlement
```

Filters:

- Workstream;
- agent;
- runtime/body;
- operation;
- approval;
- evidence type;
- state;
- time.

### 3.8 Topology

Topology answers **where the workforce exists and where work is happening**.

Represent:

```text
local body / Chromebook
Full Agent Computers
cloud Agent Computers
workcells
Silent Sessions
UIAI browser contexts
mobile/wearable surfaces
future robotic bodies
```

For each:

- health/freshness;
- body/runtime class;
- active agents/work;
- CPU/memory/resource posture where exposed;
- trust/enforcement class;
- capabilities;
- spend/budget posture where applicable.

Do not imply a conventional Chromebook has Full Agent Computer enforcement guarantees.

---

## 4. Browser surfaces

The extension SHOULD support four complementary browser forms.

### 4.1 Side panel

The fastest ambient surface.

Use for:

- current Workstream/Foreman;
- roster subset;
- Direction Bar;
- approvals;
- current page → Foreman actions;
- active execution status;
- quick UIAI handoff.

### 4.2 Full Workforce app

The main deep operations surface, opened in a browser tab/window or installable extension page.

Use for full roster, work graph, audit, evidence, topology and settings/pairing.

### 4.3 Start/new-tab surface

Optional and user-controlled.

When enabled, start page provides:

- owner briefing for workforce operations;
- active work;
- attention;
- verified outcomes;
- quick direction;
- launch back into normal browser.

Never hijack the new tab without explicit opt-in.

### 4.4 Contextual browser actions

Examples:

```text
Send this page to Foreman
Research this
Capture as Evidence
Open this in UIAI
Create bounded work from selection
Ask Workforce about this page
```

Page content is data, never authority.

---

## 5. Direction model

### 5.1 Direction Bar

The Direction Bar is not a generic chatbot box.

Its contract is:

```text
human intent
→ exact owner/project/workstream scope
→ owning Foreman/Manager
→ Focusa operation/proposal
→ authority/approval as required
→ execution
→ evidence/outcome
```

The UI should surface resolved scope before consequential dispatch.

Examples:

```text
"Give this project another team."
"Move the build work to the cloud computer."
"Pause everything expensive."
"Have the verifier inspect this result."
"Focus the team on the login regression first."
```

### 5.2 Voice

Voice is another input modality to the same Direction contract.

Voice should support:

- push-to-talk initially;
- realtime transcription where configured;
- explicit listening state;
- interruption/barge-in where supported;
- transcript correction;
- attribution to the operator;
- no voice-only hidden mutation path.

Focusa Conversation/Expression contracts own semantic voice lineage.

---

## 6. Foreman / Manager / Crew model

The extension must reconcile the existing Workforce concept with newer Focusa Project Foreman semantics.

### Foreman

Persistent Workstream-scoped responsible intelligence.

Owns no independent canonical database; hydrates from Focusa state.

### Manager

A long-lived management role where the workforce model requires a manager beneath or beside the Foreman. Managers may delegate within bounded allowance.

### Crew / Worker

Task/run-scoped execution actor. May be ephemeral.

### Verifier / Reviewer

Independently checks required outcomes/evidence where the work contract requires it.

### Rule

Do not create ambiguous duplicate personas where the Foreman already fills the persistent project-responsibility role.

---

## 7. Multi-daemon federation

Workforce may pair with N Focusa daemons.

```text
Workforce
  +-- daemon A: Chromebook/local
  +-- daemon B: business VPS
  +-- daemon C: Cloud Agent Computer
  +-- daemon D: specialist/private node
```

Required properties:

- explicit pairing;
- device/node identity;
- credential revocation;
- source identity on every projection;
- per-daemon health/freshness;
- query-at-render federation where appropriate;
- no hidden browser-side canonical merge database;
- conflict-aware direction semantics;
- reconnect without replaying ambiguous mutations.

A daemon disconnect must become stale/unavailable, not silently healthy.

---

## 8. Realtime event model

Preferred pattern:

```text
initial snapshot
+ resumable event stream
+ explicit freshness
+ resnapshot after gap/epoch change
```

The extension should consume Focusa SSE/event contracts where available.

Every projected object SHOULD carry enough metadata to reason about:

```text
source daemon
revision / sequence
runtime epoch/incarnation when relevant
freshness
canonical/degraded posture
```

Never retry a non-idempotent mutation merely because the browser lost the response.

---

## 9. Pairing and trust

Pairing must be explicit and revocable.

The extension should never require raw daemon/admin credentials to be stored in ordinary page-visible JavaScript state.

Pairing flow:

```text
add Focusa environment
→ discover/enter trusted endpoint
→ pairing token / device registration
→ versioned nonce/handshake
→ capability/version negotiation
→ store scoped extension credential
→ initial snapshot
→ live event connection
```

Support separate environments:

```text
local/private
customer/private
public demo
```

Public demo credentials/profiles MUST NOT migrate to private devices.

---

## 10. UIAI integration

UIAI Engine Cockpit retains ownership of execution control.

Workforce should show enough to answer:

- is UIAI executing this task?
- what browser/computer body/context is it using?
- is the observation/control lease fresh?
- what Evidence has been produced?
- can I inspect/take over?

Then deep-link/open the exact UIAI Cockpit surface.

Do not duplicate UIAI's FPV, control-lease, observation/action or diagnostics engines inside Workforce.

---

## 11. Wirebot integration

Wirebot is the Chief-of-Staff/life-and-business partner.

Workforce is a specialist workforce operations surface.

Wirebot may:

```text
brief owner
recommend outcome
select exact Workstream/Foreman
delegate bounded work
open Workforce on the relevant scope
receive verified outcome
```

Workforce must not become a second Life & Business map, CRM, personal knowledge system, W.I.N.S. application, or generalized Wirebot command center.

---

## 12. Chromebook deployment profile

The initial Chromebook profile should optimize for responsiveness.

Local:

```text
Chrome/Chromium UI
Workforce extension
Direction/voice
light Focusa/Pi bridge where practical
resource telemetry
```

Remote/offloaded:

```text
heavy agents
builds/tests
browser fleets
indexing
containers
large context/model workloads
cloud Agent Computers/workcells
```

The extension should make execution placement visible so the user experiences one workforce regardless of where compute occurs.

---

## 13. Resource-pressure / placement projection

Workforce should project, not own, a body/resource posture such as:

```text
normal
constrained
offload_recommended
offloading
remote_attached
degraded
```

Useful metrics when available:

```text
memory available / pressure
CPU/load pressure
I/O pressure
battery / thermal posture
interactive latency
available remote capacity
active workcells / Agent Computers
budget/spend envelope
```

The desired user outcome is:

```text
heavy work requested on Chromebook
→ local pressure/requirements evaluated
→ remote execution selected
→ Chromebook stays responsive
→ evidence/result returns
→ same Workstream/Foreman continues
```

---

## 14. Security and authority laws

1. Browser UI is never canonical authority.
2. Page text is data, not instruction authority.
3. Pairing transport access is not permission to execute arbitrary operations.
4. The extension never writes Focusa storage/database files directly.
5. Every consequential mutation uses a registered operation and current authority.
6. Credentials are scoped and revocable.
7. UIAI/browser control remains observation/control-lease bound.
8. Missing proof cannot be presented as verified completion.
9. Stale state is visibly stale.
10. Extension close/reopen cannot change durable work state by itself.

---

## 15. Extension technical architecture

Target Manifest V3 architecture after source recovery:

```text
manifest.json

service worker
  pairing / auth broker
  daemon connection coordination
  event stream lifecycle
  notifications
  commands/context menus

side panel
  ambient Workforce surface

full extension app
  roster / work / approvals / evidence / audit / topology

start page
  optional owner-selected Workforce landing page

content scripts
  minimal contextual page capture / UIAI handoff only

shared libraries
  contracts
  Focusa client
  event reducer/projection
  pairing
  freshness
  UIAI links
  voice adapter
  storage schema
```

### 15.1 Storage

Browser storage may hold:

- paired endpoint metadata;
- scoped extension credential material using the safest browser-available mechanism;
- user UI preferences;
- last-known noncanonical projection cache;
- event cursor/epoch metadata.

Browser storage MUST NOT become canonical Workstream/task/evidence state.

---

## 16. Offline/degraded behavior

When Focusa is unavailable:

```text
show last-known state as stale
retain safe local UI preferences
allow read-only inspection of cached bounded projection
queue NO consequential mutations unless owning operation explicitly supports durable idempotent queueing
provide reconnect/retry controls
```

Unknown outcome remains unknown.

---

## 17. Notifications

Notify only actionable exceptions:

- approval required;
- worker blocked and owner input required;
- verified milestone complete;
- execution failed after bounded recovery;
- resource/spend threshold requires decision;
- agent requests takeover/authentication;
- critical Radar signal where policy allows.

Do not notify for ordinary internal agent chatter.

---

## 18. Accessibility and input

Required:

- keyboard operability;
- meaningful focus order;
- screen-reader labels;
- reduced-motion support;
- readable compact Chromebook layouts;
- no color-only status semantics;
- voice path for high-frequency direction;
- adequate touch targets for convertible Chromebooks/tablets.

---

## 19. Performance targets

For Chromebook-class hardware:

- side panel becomes interactive quickly from local cached shell;
- expensive graph rendering is incremental/lazy;
- event updates patch bounded state rather than rerendering the entire app;
- no continuous high-frequency polling when event streams are healthy;
- no embedded browser automation runtime in the extension;
- large Evidence artifacts open on demand;
- browser memory use remains subordinate to normal browsing.

Exact measured budgets should be established after source recovery on the actual Chromebook.

---

## 20. Acceptance journeys

### A. Open and orient

Open Chromebook → Workforce shows exact paired environment, current Workstream/Foreman, active workers, blockers, approvals, and freshness.

### B. Direct work

Enter direction → exact scope resolved → Foreman receives canonical request → worker dispatch visible → evidence/result returns.

### C. Approval

Worker reaches consequential step → Workforce shows exact consequence → owner approves/denies → decision and resulting effect are auditable.

### D. UIAI takeover

Browser task running → open exact UIAI Cockpit → inspect/take over → return control → Workforce shows reconciled status/evidence.

### E. Cloud offload

Request heavy work on constrained Chromebook → remote body/workcell selected → local UI stays responsive → same Workstream receives result.

### F. Browser close/reopen

Close Chrome → agents continue in owning runtimes → reopen → resnapshot/reconnect → no duplicate dispatch.

### G. Multi-daemon

Pair local + cloud/private daemon → view unified roster with clear source identity → direct exact Workstream → no cross-daemon ambiguity.

### H. Voice

Speak bounded direction → transcript visible/correctable → same Direction operation path executes → lineage retained.

---

## 21. Release definition

A release is not “the extension loads.”

A release candidate must prove:

```text
build reproducibility
manifest validity
pairing/auth
snapshot + event stream
scope correctness
roster truthfulness
direction dispatch
approval semantics
evidence/audit lineage
UIAI handoff
close/reopen continuity
Chromebook performance
upgrade/rollback path
```

---

## 22. Implementation order

1. recover deployed source;
2. reproduce current build exactly;
3. install same build on Chromebook;
4. document current implemented surfaces/gaps;
5. stabilize pairing + event layer;
6. Roster + Workstream scope;
7. Direction Bar;
8. Work graph;
9. Approvals;
10. Evidence + Audit;
11. UIAI exact handoff;
12. voice;
13. topology/resource/body posture;
14. multi-daemon federation;
15. Chromebook performance hardening;
16. versioned CD/promotion channels;
17. richer agent-first browser interactions.

No new architecture ceremony should delay a functioning vertical slice.

---

## 23. Completion criterion

Focusa Workforce is mature when the operator can use the Chromebook as a responsive workforce operations surface while the actual workforce may span local, cloud, browser, specialist, and future embodied runtimes — and the operator never has to reason about infrastructure topology merely to know who is working, steer them, intervene, and verify outcomes.
