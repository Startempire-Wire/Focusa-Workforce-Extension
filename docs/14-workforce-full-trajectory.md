# Focusa Workforce — Full Trajectory

**Status:** CURRENT trajectory authority  
**Model:** Focusa #618 Full / Medium / Short coverage projections of one connected truth  
**Accepted scope:** `10-workforce-product-requirements-and-proof-matrix.md`  
**UX authorities:** `11`, `12`, `13`  
**Baseline:** `baseline/pre-redesign-2026-09-15`  
**Trajectory revision:** 2 (2026-09-16)  
**Verification basis:** live Focusa daemon `0.9.194-dev` on the estate dev device
(`developer_full`, `authority_source=tailnet`), `GET /v1/agent/operations` (157 governed
operations), the daemon route table (509 `/v1` paths in the owning source), and the
extension's own suite (98 tests) + live contract checks.

Per #618, these four things are distinct and must not be collapsed:

```text
trajectory view depth   Full | Medium | Short        (this document)
lifecycle stage         PREPARE DIAGNOSE PLAN SPECIFY DECOMPOSE
                        VERIFY-AGAINST-SPECS REFINE IMPLEMENT DEPLOY VERIFY-OUTCOME
operational mode        Orientation Recovery Walking Flying Delivery Correction
run/readiness status    active | ready | blocked | done | unresolved
autonomy policy         permitted continuous execution under current grants
```

A compact projection (Medium/Short) must disclose the coverage it omits and remain
expandable into this Full record; a current-path summary is never a Full ladder.

This is one connected trajectory. It is a **coverage/dependency map**, not a reporting system or proof ledger.

## Algorithm² execution law

Apply to both the product and the trajectory machinery:

```text
Question
→ Delete
→ Simplify
→ Accelerate
→ Automate last
```

Do not create a new document, test, report, checklist, abstraction, service, or state machine unless removing it would leave a real requirement, dependency, authority boundary, or material failure risk unresolved.

The Workpoint loop is:

```text
prepare enough
→ act
→ reconcile only what changed
→ advance
```

Reuse valid work and evidence. A blocked node blocks only its dependents. Do not pause independent ready work. Do not rewrite trajectory prose unless accepted scope/dependency truth changed.

---

# 1. HLT — High-Level Trajectory

## HLT-WF-001

**Deliver a production-grade Focusa Workforce browser experience that makes a Focusa-governed AI organization continuously understandable, steerable, collaborative, evidence-backed, and operable without creating duplicate canonical authority.**

### Desired end state

An authorized owner/delegated human can:

```text
open Chrome
→ understand current workforce state immediately
→ restore/select exact Workstream
→ interact with its accountable Foreman
→ direct work without unnecessary ceremony
→ see who is doing what and why
→ respond only where human judgment/authority is needed
→ watch/take over UIAI execution when needed
→ inspect Full / Medium / Short trajectory truth
→ distinguish claimed from verified/settled work
→ recover honestly from stale/offline/restart conditions
→ operate across authorized environments without state bleed
→ use a coherent accessible premium UI
→ close the browser while canonical work continues in Focusa
```

### HLT acceptance

HLT-WF-001 is accepted only when all required branches below are accepted or explicitly removed by owner scope change.

One finished slice, green build, or successful deployment never implies whole-project completion.

---

# 2. MLG map

Disposition key: `done` (accepted with evidence) · `active` · `ready` (unblocked,
not started) · `blocked` (named dependency) · `unresolved` (owned resolution step,
scope or contract not yet determined).

```text
MLG-0   done        contracts resolved + foundation built (WP-0.1.1, STG-0.2, part of STG-0.3)
MLG-1   active      slice 1 surface live; Direction needs an owner session instance
MLG-2   ready       People/responsibility — same client, owner `silent-sessions` is real
MLG-3   blocked     Needs You — owner gap UP-03 (no attention operation)
MLG-4   active      Trajectory consumes `trajectory/view` + `workpoint/*` + `work-loop/status`
MLG-5   ready       Evidence — owner `evidence/capture` + `workpoint/link-evidence` are real
MLG-6   ready       UIAI handoff/takeover; session create→start→steer path identified
MLG-7   blocked     Fleet/multi-environment — owner gap UP-06 (no presence projection)
MLG-8   ready       Surface/visual/accessibility completion (STG-0.3 tokens, docs 12/13)
MLG-9   unresolved  Voice/Radar — owner scope decision required before implementation
MLG-10  blocked     Production acceptance depends on the branches above
```

```text
HLT-WF-001
│
├─ MLG-0  Canonical contracts + implementation foundation
├─ MLG-1  Workstream + Foreman + Direction
├─ MLG-2  Working Now / People / responsibility
├─ MLG-3  Needs You / human intervention
├─ MLG-4  Trajectory + work progression
├─ MLG-5  Evidence / verification / closure
├─ MLG-6  UIAI execution / takeover / browser context
├─ MLG-7  Fleet / multi-environment / topology / capacity
├─ MLG-8  Complete surfaces / visual system / accessibility
├─ MLG-9  Voice / Radar / contextual expansion
└─ MLG-10 Production acceptance / migration / deployment
```

`MLG-9` may ship after a production-grade core release only if the owner explicitly scopes that release. It remains part of the HLT until scope changes.

---

# 3. MLG-0 — Canonical contracts + foundation

**Outcome:** Workforce consumes real owners through a safe shared UI/runtime foundation.

## STG-0.1 — Resolve current Focusa operation truth

### WP-0.1.1 Inspect current/generated contracts for

```text
Workstream listing/resolution
Foreman binding/status/hydration
Direction/steer/proposal
Trajectory projection
attention/approval
Evidence/settlement
UIAI execution refs
presence/fleet
```

Decision:

```text
real operation exists → use it
real equivalent exists → thin provenance-preserving adapter
owning operation missing → implement smallest owning operation upstream
```

Never synthesize canonical Foreman/Trajectory/approval state from unrelated client endpoints.

## STG-0.2 — Presentation architecture

### WP-0.2.1 Add Svelte 5 + minimal Vite/MV3 bundling
### WP-0.2.2 Add `workforce.html`
### WP-0.2.3 Add shared projection/runtime client for local connection selection, selected Workstream preference, query/event orchestration, freshness metadata, and presenter-local state only

Constraints:

```text
JavaScript + JSDoc
no SvelteKit
stable extension identity
public-demo path preserved
sidepanel/startpage/wall behavior preserved until intentionally replaced
MV3 service-worker suspension tolerated
```

## STG-0.3 — Minimal shared presentation foundation

### WP-0.3.1 Implement doc-13 tokens needed by first slice
### WP-0.3.2 Implement only shared state components actually needed
### WP-0.3.3 Add Lucide only when first used

### MLG-0 accepted when

- required owning operations are known or exact upstream blockers exist;
- valid MV3 build loads;
- Full Workforce entry loads;
- proven core libs remain usable;
- no canonical state is duplicated.

---

# 4. MLG-1 — Workstream + Foreman + Direction

**Outcome:** Workforce feels like operating a responsible organization.

## STG-1.1 — Exact scope

### WP-1.1.1 Environment selector
### WP-1.1.2 Project/Workstream list
### WP-1.1.3 Restore last valid Workstream per environment
### WP-1.1.4 Scope/freshness guards

## STG-1.2 — Foreman projection

### WP-1.2.1 Resolve exact Foreman for selected Workstream
### WP-1.2.2 Foreman card
### WP-1.2.3 Objective/frontier/recent proof/freshness
### WP-1.2.4 Honest missing/unsupported contract state

## STG-1.3 — Direction

### WP-1.3.1 Direction Composer
### WP-1.3.2 Exact target breadcrumb
### WP-1.3.3 Typed owning submit operation
### WP-1.3.4 Owning result states
### WP-1.3.5 Stale/ambiguous target revalidation
### WP-1.3.6 Ambiguous-write reconciliation

## STG-1.4 — Side Panel core

```text
header
scope
Foreman
Direction
slots for Needs You / Working Now / Verified
Open Workforce
```

### MLG-1 accepted when

A user can reopen Chrome, restore/select exact Workstream, see its accountable Foreman, direct that exact scope, receive a truthful source-backed result, and recover from temporary disconnect without invented state.

---

# 5. MLG-2 — Working Now / People

**Outcome:** workforce members are legible by responsibility, not session/model noise.

## STG-2.1 — Canonical roster projection

### WP-2.1.1 Normalize Foreman/Manager/Worker/Specialist/Verifier source projections
### WP-2.1.2 Preserve assignment/authority/execution refs
### WP-2.1.3 No local roster authority

## STG-2.2 — Working Now

### WP-2.2.1 Side Panel rows
### WP-2.2.2 Workstream responsibility tree
### WP-2.2.3 State/freshness mapping

## STG-2.3 — People index/detail

### WP-2.3.1 People index
### WP-2.3.2 Useful filters
### WP-2.3.3 Person detail
### WP-2.3.4 Progressive authority/execution detail

### MLG-2 accepted when

User can answer who is accountable, who is working, what each owns, reporting relationship, execution location, and recent proof without reading raw sessions.

---

# 6. MLG-3 — Needs You

**Outcome:** human attention is reserved for real human-value boundaries.

## STG-3.1 — Attention source

### WP-3.1.1 Consume `operator.attention.v1` or exact transitional adapter
### WP-3.1.2 Preserve source refs/revision/expiry
### WP-3.1.3 Filter to allowed human-value classes

## STG-3.2 — Side Panel Needs You

### WP-3.2.1 Highest-value active items
### WP-3.2.2 View all
### WP-3.2.3 Exclude routine activity noise

## STG-3.3 — Attention detail/action

### WP-3.3.1 What / why / context / consequence
### WP-3.3.2 Revalidate before consequential action
### WP-3.3.3 Source-owned actions
### WP-3.3.4 Presenter seen/snooze/hide separate from source resolution

### MLG-3 accepted when

A real clarification/approval/auth/takeover boundary can be resolved from Workforce exactly once at the canonical source while routine agent activity stays out of Needs You.

---

# 7. MLG-4 — Trajectory + work progression

**Outcome:** Workforce exposes whole-mission coverage and the current executable frontier without becoming another plan authority.

## STG-4.1 — Source trajectory

### WP-4.1.1 Consume source-owned Full/Medium/Short projection or implement smallest required Focusa projection upstream
### WP-4.1.2 Preserve HLT/MLG/STG/Waypoint/Workset/CallGraph/Workpoint links
### WP-4.1.3 Keep unresolved requirements explicit

## STG-4.2 — Coverage depth

### WP-4.2.1 Full
### WP-4.2.2 Medium
### WP-4.2.3 Short
### WP-4.2.4 Omitted-coverage disclosure

## STG-4.3 — Presentation depth

### WP-4.3.1 Human: Mission / Current / Parallel / Next
### WP-4.3.2 Operations: dependencies / actors / acceptance / proof
### WP-4.3.3 Technical: exact graph / attempt / session / ref details

## STG-4.4 — Lifecycle visibility

### WP-4.4.1 Source lifecycle labels
### WP-4.4.2 VERIFY AGAINST SPECS
### WP-4.4.3 Evidence-triggered REFINE
### WP-4.4.4 Unknown remains Unknown

### MLG-4 accepted when

Full accounts for all accepted branches/dispositions; Medium/Short are projections of the same truth; nearest Workpoint and ultimate accepted outcome are distinct; branch completion cannot masquerade as whole-project completion.

---

# 8. MLG-5 — Evidence / closure

**Outcome:** consequential “done” is causally inspectable.

## STG-5.1 — Proof-state projection

### WP-5.1.1 Shared proof vocabulary
### WP-5.1.2 Evidence list/cards
### WP-5.1.3 Verified Recently

## STG-5.2 — Evidence detail

### WP-5.2.1 Provenance
### WP-5.2.2 Work/actor links
### WP-5.2.3 Verification history
### WP-5.2.4 Corrections/revocations

## STG-5.3 — Closure chain

### WP-5.3.1 Execution → Evidence
### WP-5.3.2 Evidence → verification
### WP-5.3.3 Verification → settlement/Receipt
### WP-5.3.4 Optional accepted-outcome/W.I.N.S. ref

### MLG-5 accepted when

User can distinguish claim from verification and inspect why an important result is trusted without Workforce owning Evidence, settlement, or outcomes.

---

# 9. MLG-6 — UIAI / browser execution

**Outcome:** computer work is visible in workforce context without recreating Cockpit.

## STG-6.1 — Execution projection

### WP-6.1.1 Worker → exact UIAI context
### WP-6.1.2 Active execution cue
### WP-6.1.3 Watch deep link

## STG-6.2 — Takeover

### WP-6.2.1 Auth/takeover attention
### WP-6.2.2 Exact UIAI handoff
### WP-6.2.3 Return location
### WP-6.2.4 Reobserve/reconcile before autonomous continuation

## STG-6.3 — Page context

Implement only actions backed by real owners:

### WP-6.3.1 Ask Foreman about page
### WP-6.3.2 Send page
### WP-6.3.3 Create work from selection
### WP-6.3.4 Capture Evidence candidate
### WP-6.3.5 Open in UIAI

### MLG-6 accepted when

User can see which work uses which execution context, watch/take over exact execution, return to the same Workstream, and continue only after source reconciliation.

---

# 10. MLG-7 — Fleet / topology / capacity

**Outcome:** distributed execution is understandable without making infrastructure the primary mental model.

## STG-7.1 — Fleet projection

### WP-7.1.1 Multi-environment aggregation
### WP-7.1.2 Typed refs prevent collisions
### WP-7.1.3 No reducer merge

## STG-7.2 — Topology

### WP-7.2.1 Organizational body groups
### WP-7.2.2 Health/busy/current Workstreams
### WP-7.2.3 Technical detail on demand

## STG-7.3 — Capacity posture

### WP-7.3.1 Resource pressure
### WP-7.3.2 Contextual cloud/Agent Computer recommendation
### WP-7.3.3 Placement handoff only through real owner operation

### MLG-7 accepted when

One owner lens can show multiple authorized environments/bodies with exact source identity, no state bleed, quiet federation posture, and non-authoritative capacity options.

---

# 11. MLG-8 — Complete surfaces / accessibility

**Outcome:** all Workforce surfaces form one coherent operational product.

## STG-8.1 — Full Workforce

### WP-8.1.1 Overview
### WP-8.1.2 Work index/detail
### WP-8.1.3 People index/detail
### WP-8.1.4 Evidence index/detail
### WP-8.1.5 Topology
### WP-8.1.6 Audit
### WP-8.1.7 Settings

## STG-8.2 — Start Page

### WP-8.2.1 Concise orientation
### WP-8.2.2 Current focus
### WP-8.2.3 Needs You / Working / Verified summary
### WP-8.2.4 Continue exact Workstream
### WP-8.2.5 Preserve public-demo behavior

## STG-8.3 — Wall

### WP-8.3.1 Read-only current focus
### WP-8.3.2 Active workforce
### WP-8.3.3 Attention / verified / freshness

## STG-8.4 — Visual/accessibility completion

### WP-8.4.1 Doc-13 visual system
### WP-8.4.2 Responsive behavior
### WP-8.4.3 Keyboard/focus
### WP-8.4.4 Reduced motion
### WP-8.4.5 WCAG 2.2 AA

Reference captures are optional implementation aids, not required artifacts unless they expose a visual regression better than running-browser inspection.

### MLG-8 accepted when

Side Panel, Full Workforce, Start Page, and Wall share the same semantic/visual system, cover material non-happy states, and remain usable on Chromebook-class layouts.

---

# 12. MLG-9 — Voice / Radar / contextual expansion

**Outcome:** higher-leverage interactions extend existing contracts rather than create side systems.

## STG-9.1 — Voice

### WP-9.1.1 Mic affordance only when adapter exists
### WP-9.1.2 Workstream/Foreman routing
### WP-9.1.3 Ambiguity clarification
### WP-9.1.4 Same Direction result semantics

## STG-9.2 — Radar

### WP-9.2.1 Relevant Workstream Signals/Episodes
### WP-9.2.2 Human-needed signal → Attention
### WP-9.2.3 Foreman response through owning Focusa path

## STG-9.3 — Contextual expansion

### WP-9.3.1 UIAI need
### WP-9.3.2 Capacity need
### WP-9.3.3 Draftee role gap
### WP-9.3.4 Federation opportunity posture

Recommendations remain non-authoritative.

### MLG-9 accepted when

Voice/Radar reuse existing source identity/authority semantics and expansion recommendations never grant entitlement or authority.

---

# 13. MLG-10 — Production acceptance / migration / deployment

**Outcome:** redesigned product replaces current UI safely in real browser/runtime use.

## STG-10.1 — Regression/migration

### WP-10.1.1 Preserve stable extension ID
### WP-10.1.2 Preserve pairing/storage compatibility or migrate intentionally
### WP-10.1.3 Preserve public demo
### WP-10.1.4 Compare baseline only where changed behavior could regress

## STG-10.2 — Representative browser acceptance

Use the smallest set of doc-11 journeys that exercises changed integrated behavior. Before final release, cover the complete critical journey set once.

Material failure cases include:

```text
stale consequential source
lost/ambiguous response
service-worker suspension
connection/auth revocation
incompatible schema
UIAI unavailable
environment ID collision
unverified completion claim
```

Do not rerun every case after unrelated edits.

## STG-10.3 — Performance

Targets:

```text
Side Panel local shell meaningful <500ms on target Chromebook with local cached assets
local interaction response <100ms excluding source/network operation
no high-frequency polling where event source exists
no heavyweight graph dependency on Side Panel unless actually required
```

## STG-10.4 — Release

```text
main green
→ meaningful Chromebook dogfood
→ explicit wfx veragensia
→ atomic stage/promote
→ verify changed live journey
→ rollback on material regression
```

### MLG-10 accepted when

Real user journeys work through the normal deployment path, rollback remains available, and no required HLT branch is hidden by successful deployment.

---

# 14. Dependency graph

```text
MLG-0
  ↓
MLG-1
  ├─→ MLG-2
  ├─→ MLG-3
  └─→ MLG-4
        ↓
      MLG-5

MLG-2 ─┐
MLG-3 ─┼─→ MLG-6
MLG-5 ─┘

MLG-1 + MLG-2 + MLG-4
          ↓
        MLG-7

MLG-1..7
   ↓
 MLG-8
   ↓
 MLG-9
   ↓
 MLG-10
```

Parallelize independent ready work. Do not parallelize through unresolved shared contract assumptions.

---

# 15. Full / Medium / Short

## Full

Complete accounting of HLT-WF-001: the HLT and desired end state (§1), all required
MLG/STG branches with dispositions (§2 and its subtrees), accepted requirements and
their families (§16, `docs/10`), cross-branch dependencies (all `SEC-*`, `CORE-*`),
the owning operations each branch consumes (§3 STG-0.1), and the upstream
dependencies that are not yet provided (§17). Completed, active, ready, blocked and
unresolved scope are all visible above; nothing is silently omitted.

Per #618, complete coverage and per-frontier readiness are separate checks: Full
coverage here means every branch has an owner, a disposition and a path; it does not
mean distant branches are ready to execute.

## Medium

Current subtree: **MLG-0 accepted → MLG-1 (Workstream + Foreman + Direction)**,
retaining HLT ancestry and showing:

```text
acceptance (docs/10)   WF-SCP environment/scope, WF-FOR foreman, WF-DIR direction
owner operations       project/* · trajectory/view · workpoint/* · work-loop/status
                       silent-sessions/* · roles/profiles (see src/lib/owner-contracts.mjs)
dependencies           SEC (scoped reads/writes, no fabricated authority),
                       NFR (MV3 build identity, honest degraded states)
active graph           Workforce full page (Svelte 5 + Vite) over the shared runtime client
Workpoints             WP-0.1.1 done · STG-0.2 done · STG-0.3 active · WP-1.1.x/WP-1.2.x/WP-1.3.x
cross-branch prereqs   MLG-6 session instance (unblocks Direction end-to-end)
                       UP-01 Foreman contract (blocks the real Foreman card)
```

`MLG-1`, `MLG-2`, `MLG-4`, `MLG-5`, and `MLG-6` together form the production-grade
core release surface; `MLG-3`/`MLG-7` inherit their gaps and `MLG-9` is unresolved.
Coverage omitted from this Medium view: MLG-8/9/10 detail and the full requirement
table — expand in §16 and `docs/10`.

## Short

The current executable slice, with retained ancestry:

```text
HLT-WF-001 → MLG-0 (accepted) → MLG-1 → STG-1.3 (Direction) → WP-1.3.3 (typed submit)
```

```text
exact gap            Direction is implemented and governed, but no owner silent-session
                     instance exists on the dev device, so there is no exact target
                     (session_id + run_id + generation) to address it to.
owner evidence       GET /v1/silent-sessions → data: [] ; owner tables
                     runtime_silent_sessions = 0 rows, runs = 0, leases = 0, approvals = 0.
                     Capability is present (profiles "Local Pi RPC session in an isolated
                     worktree", preset "conservative", preflight/create/start/steer/approvals).
frontier node        WP-1.3.3 (typed owning submit) — blocked only by target existence
nearest ready        WP-6.x session create→preflight→start (MLG-6 partial) feeding WP-1.3.3
preconditions        orientation packet scope (project_root + continuity_id),
                     write authority (satisfied: developer_full; tokenless loopback proven),
                     durable idempotency (satisfied: chrome.storage intent store)
evidence required    owner create/start receipt with the exact session/run target, then the
                     steer receipt + canonical re-read
material rollback    cancel the created session through its owning operation; no local
                     canonical state exists to roll back
advancement          Direction submits to a real target and the owner's canonical re-read
                     reflects the new run state, verified live in the browser
```

Coverage omitted from this Short view: every branch outside MLG-1 STG-1.3 and the
MLG-6 subset above. This is a current-path summary, not a Full ladder.

# 16. Requirement-family coverage

| MLG | Requirement families |
|---|---|
| 0 | WF-NFR, WF-SCP foundation |
| 1 | WF-SCP, WF-FOR, WF-DIR, WF-SUR-001 |
| 2 | WF-PEO |
| 3 | WF-ATT |
| 4 | WF-WRK |
| 5 | WF-EVD |
| 6 | WF-UIAI, WF-BRW |
| 7 | WF-FLT, WF-FED |
| 8 | WF-SUR, accessibility/responsive WF-NFR |
| 9 | WF-VOI, contextual expansion |
| 10 | release-critical WF-NFR + whole-project acceptance |

This table is for coverage orientation only. Commits/PRs do not need ceremonial requirement-ID annotation.

---

# 17. Known upstream blockers — verified status

Verified 2026-09-16 against the running daemon (0.9.194-dev) and the owning source.
An upstream gap blocks only its dependents; independence is preserved per branch.

```text
UP-01  Foreman binding/status        OPEN     No `/v1/foreman*` route in the running binary
                                              or the owning route table; Spec 182 has no
                                              daemon operation. Closest real surface is the
                                              workstream-scoped role-profile list (empty).
                                              → Workforce renders the gap and must not fabricate.
UP-02  Full/Medium/Short trajectory  DEFECT   Storage and projection disagree in daemon
                                              0.9.194-dev. Observed 2026-09-16 for scope
                                              project_root=<workforce repo>, continuity_id=workforce-build:
                                              · `trajectory/define-goal` + `trajectory/checkpoint`
                                                return `canonical: true` and persist a full ladder in
                                                `$FOCUSA_HOME/trajectory-ledger/<scope>/events.jsonl`
                                                — 28 events, levels hlt=2 mlg=2 stg=2 waypoint=20
                                                current_state=2, authority=canonical_explicit,
                                                hlt_version=5 (plus 2 HLT-ledger records).
                                              · the same daemon's `trajectory/view` then reports
                                                `status: not_found`, `hlt_status: missing_required`,
                                                `HLT_IMPASSE: no committed project HLT exists`,
                                                `definition_status: unclear`, `checkpoint_count: 0`,
                                                `durable_lifecycle.canonical: false`.
                                              · the CLI repair path is unusable: `focusa trajectory
                                                define-goal` requires `--lifecycle-action` and then
                                                rejects it ("supported by install, update, and
                                                uninstall").
                                              Consequence: an HLT/Ladder that is committed in the
                                              owner's own ledger is invisible to the owner's
                                              projection, so MLG-4 cannot consume it and any
                                              surface reading the projection under-reports truth.
                                              Owner-level item: fix the projection/read path (or the
                                              commitment gate) in Focusa; Workforce must keep
                                              rendering the gap and must not synthesize ladder values.
                                              Anchor that DOES hold: `workpoint/checkpoint` reports
                                              canonical and `trajectory/view` reconciliation returns
                                              `surface_states.workpoint = canonical`.
UP-03  operator.attention.v1         OPEN     No attention/approval-list operation. Approval
                                              operations exist only per silent session.
UP-04  closure / W.I.N.S. cross-ref   PARTIAL  `/v1/outcomes/{claim,resolve,correct,dispute}` and
                                              `work-items/closure/*` exist; cross-ref to W.I.N.S.
                                              acceptance is unverified.
UP-05  UIAI surface-handoff          UNKNOWN  Exact handoff contract not yet inspected; UIAI
                                              remains execution/takeover owner.
UP-06  fleet / presence              OPEN     No fleet/presence projection; `instances/list`
                                              is remote-stream gated. Workforce shows only
                                              locally paired environments and their health.
UP-07  voice / Radar                 LATER    Operations not inspected; MLG-9 stays unresolved
                                              pending an owner scope decision.
```

Resolution rule for each: inspect owner → use the real operation; else implement the
smallest correct owning operation → verify the owner boundary → return to Workforce.
Never bypass the owner inside the extension.

# 18. Stop / refine

Stop an affected Workpoint only for a real boundary:

```text
scoped outcome accepted
actual dependency block
owner decision materially required
authority missing/revoked
ambiguous consequential effect
owning contract genuinely missing
verification disproves assumption
explicit owner pause/stop/scope change
```

On refinement, invalidate only affected downstream assumptions. Preserve unrelated valid work and continue from the nearest ready frontier.

---

# 19. Whole-project acceptance

Before settling HLT-WF-001, establish in running reality that:

```text
canonical ownership is preserved
accepted requirements are implemented/dispositioned
all four surfaces function coherently
Workstream/Foreman/Direction are real
Needs You is real
Full/Medium/Short trajectory is real
People responsibility is real
Evidence/closure is real
UIAI handoff/takeover is real
multi-environment state does not bleed
stale/offline/reconcile behavior is truthful
accessibility/responsive behavior is usable
MV3 identity/build remain valid
Chromebook dogfood succeeds
explicit Veragensia promotion succeeds
rollback remains available
```

Use existing evidence and the smallest additional checks needed to establish these. Do not create a separate final proof-management project.
---

# 20. Build-agent mission run (current)

The build agent runs the same pattern on itself, per #618: one closed loop, staged
lifecycle, explicit posture, and an exact nearest ready Workpoint.

```text
Prepare   → read AGENTS.md, docs/15, docs/14 frontier; inspect real source + owner contracts
Act       → implement the largest safe useful increment in Workforce
Reconcile → run the cheapest real check that can expose a material defect
            (focused test · live owner contract check · rendered browser behaviour)
Advance   → re-read this trajectory, update dispositions, continue to the nearest
            ready node (or record the exact owner-level blocker)
```

Current run position:

```text
lifecycle stage   IMPLEMENT (MLG-6 subset feeding MLG-1 STG-1.3 VERIFY-OUTCOME)
operational mode  Walking (bounded increments inside an authorized mission)
run status        active
autonomy policy   permitted continuous execution within resolved product boundaries
trajectory depth  Short (this section is compact and discloses omissions above)
```

Work completed in the current run (evidence-backed):

```text
WP-0.1.1  owner contract resolution            src/lib/owner-contracts.mjs + tests
STG-0.2   Svelte 5 + minimal Vite/MV3, page     dist/workforce.html, hashed bundles
STG-0.2.3 shared runtime client + live stream   src/lib/workforce-client.mjs
STG-0.3   partial: tokens/state components      src/workforce/*
MLG-1     environment, project discovery/selection, Workstream axes, Foreman gap card,
          frontier, roster, Direction composer, session capability display
DELIVERY  live build loop + visible build stamp; staged refresh deploys; CI green
```

Nearest ready next action: **wire orientation → session create/preflight/start → steer**
so Direction converges on a real owner target, then return to MLG-1 STG-1.3 for
VERIFY-OUTCOME on the live browser surface.
