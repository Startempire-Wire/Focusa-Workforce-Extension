# Focusa Workforce — Full Trajectory

**Status:** CURRENT trajectory authority for redesign execution  
**Trajectory model:** aligned with Focusa issue #618 principles  
**Requirements authority:** `10-workforce-product-requirements-and-proof-matrix.md`  
**Experience authorities:** `11`, `12`, `13`  
**Implementation baseline:** `baseline/pre-redesign-2026-09-15`

This is one connected project trajectory. `Full`, `Medium`, and `Short` are projections of this same truth, not separate plans.

---

# 1. HLT — High-Level Trajectory

## HLT-WF-001

**Deliver a production-grade Focusa Workforce browser experience that makes a Focusa-governed AI organization continuously understandable, steerable, collaborative, evidence-backed and operable across browser surfaces without creating duplicate canonical authority.**

### Desired end state

An authorized owner/delegated human can:

```text
open Chrome
→ immediately understand current workforce state
→ select/restore exact Workstream
→ interact with accountable Foreman
→ direct work without unnecessary ceremony
→ see who is doing what and why
→ respond only when human judgment/authority is required
→ watch/take over UIAI execution when needed
→ inspect Full/Medium/Short trajectory truth
→ distinguish claimed work from verified/settled work
→ recover cleanly from stale/offline/restart conditions
→ move across authorized environments without state bleed
→ use a sleek, consistent, accessible light-first UI
→ close the browser while work continues canonically in Focusa
```

### Whole-project acceptance

The HLT is accepted only when all required MLG branches below are accepted or explicitly owner-dispositioned out of scope.

A green build, one working surface, one finished slice, or one successful deployment does **not** settle this HLT while required branches remain unresolved.

---

# 2. MLG map

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

`MLG-9` may be delivered after the first production-grade core release only if the owner explicitly scopes the release that way. It remains part of this accepted HLT unless scope changes.

---

# 3. MLG-0 — Canonical contracts + implementation foundation

**Outcome:** the extension has a safe shared UI/runtime foundation and consumes real owning contracts rather than inventing client authority.

## STG-0.1 — Resolve current Focusa operation truth

### WP-0.1.1 Inspect generated/current Focusa contracts

Required inspection:

```text
Workstream listing/resolution
Foreman binding/status/hydration
Direction/steer/proposal operation
Trajectory projection
attention/approval projection
Evidence/settlement projection
UIAI execution refs
presence/fleet projections
```

**Decision rule:**

```text
operation exists → consume it
semantically equivalent operation exists → thin provenance-preserving adapter
owning operation missing → implement smallest Focusa-owned operation first
```

**Forbidden:** client synthesis of a canonical Foreman/Trajectory/approval from unrelated endpoints.

**Reqs:** WF-FOR-006, WF-DIR-001, WF-WRK-001..010  
**Proof:** source links + generated schema/route + focused contract test.

## STG-0.2 — Introduce presentation build architecture

### WP-0.2.1 Add Svelte 5 + Vite-compatible extension bundling

Constraints:

```text
JavaScript + JSDoc
no SvelteKit
MV3 valid
no remote script/font runtime dependency
preserve stable extension ID
preserve public demo path
preserve sidepanel/startpage/wall entry behavior
```

### WP-0.2.2 Add `workforce.html` full-page entry

Hash routes per `11-workforce-experience-architecture-and-stateflow.md`.

### WP-0.2.3 Shared UI projection/runtime client

Owns only:

```text
connection selection
selected Workstream local preference
query orchestration
surface event subscription
cache freshness metadata
presenter-local state
```

Does not own Focusa state.

**Reqs:** WF-NFR-001..006, WF-SUR-001..005  
**Proof:** build, manifest validation, browser load, service-worker suspension test.

## STG-0.3 — Shared tokens/component foundation

### WP-0.3.1 Implement visual tokens from doc 13
### WP-0.3.2 Implement shared state components
### WP-0.3.3 Add Lucide-Svelte only if icons are needed in first slice

**Reqs:** WF-NFR-008..010  
**Proof:** token snapshot/a11y baseline.

### MLG-0 acceptance

- real owning operations identified or exact missing-operation blockers created;
- Svelte/Vite build produces valid unpacked MV3 extension;
- old proven core libs remain usable;
- Full Workforce entry loads;
- shared tokens/state primitives work;
- no canonical state duplicated.

---

# 4. MLG-1 — Workstream + Foreman + Direction

**Outcome:** Workforce feels like operating a responsible organization, not observing sessions.

## STG-1.1 — Environment + Workstream scope

### WP-1.1.1 Connection/env selector
### WP-1.1.2 Project/Workstream list
### WP-1.1.3 Persist last valid scope per environment
### WP-1.1.4 Exact scope/freshness guards

**Reqs:** WF-SCP-001..007  
**Proof:** multi-environment collision fixture, restore/revoke tests.

## STG-1.2 — Foreman projection

### WP-1.2.1 Resolve exact Foreman for selected Workstream
### WP-1.2.2 Foreman card
### WP-1.2.3 objective/frontier/proof/freshness rendering
### WP-1.2.4 unsupported/missing owning contract state

**Reqs:** WF-FOR-001..006  
**Proof:** same Foreman ref across reload/runtime switch; distinct refs across Workstreams.

## STG-1.3 — Direction

### WP-1.3.1 Direction Composer
### WP-1.3.2 exact target breadcrumb
### WP-1.3.3 typed submit operation
### WP-1.3.4 render all owning result states
### WP-1.3.5 stale/ambiguous target revalidation
### WP-1.3.6 ambiguous write reconciliation

**Reqs:** WF-DIR-001..008  
**Proof:** accepted, clarification, denied, stale and lost-response cases.

## STG-1.4 — Side Panel core composition

Implement first canonical Side Panel from doc 13 with:

```text
header
scope
Foreman
Direction
placeholder slots for Needs You / Working Now / Verified
footer Open Workforce
```

### MLG-1 acceptance

User can reopen Chrome, restore/select a Workstream, see the same accountable Foreman, submit a direction to exact scope, receive a truthful source-backed result and recover from temporary disconnect without state invention.

---

# 5. MLG-2 — Working Now / People / responsibility

**Outcome:** the workforce is legible as responsibility-bearing people/roles, not session/process noise.

## STG-2.1 — Canonical roster projection

### WP-2.1.1 Normalize Foreman/Manager/Worker/Specialist/Verifier source projections
### WP-2.1.2 preserve assignment/authority/execution refs
### WP-2.1.3 no local roster authority

## STG-2.2 — Working Now

### WP-2.2.1 Side Panel rows
### WP-2.2.2 Workstream responsibility tree
### WP-2.2.3 state/freshness mapping

## STG-2.3 — People index/detail

### WP-2.3.1 People index route
### WP-2.3.2 filters
### WP-2.3.3 Person detail
### WP-2.3.4 authority/execution progressive disclosure

**Reqs:** WF-PEO-001..005  
**Proof:** role fixtures, replacement/session-death continuity, no model-first identity.

### MLG-2 acceptance

User can answer who is accountable, who is working, what each person owns, who they report to, where they execute and what proof they last produced without reading raw sessions.

---

# 6. MLG-3 — Needs You / human intervention

**Outcome:** one truthful workforce-scoped attention experience for decisions only humans should handle.

## STG-3.1 — Attention adapter

### WP-3.1.1 Consume `operator.attention.v1` or exact transitional adapter
### WP-3.1.2 source refs/revisions/expiry
### WP-3.1.3 filter allowed classes

## STG-3.2 — Side Panel Needs You

### WP-3.2.1 top 3 cards
### WP-3.2.2 View all
### WP-3.2.3 no routine activity noise

## STG-3.3 — Attention detail/actions

### WP-3.3.1 what/why/context/consequence
### WP-3.3.2 revalidate before consequential action
### WP-3.3.3 source-owned actions
### WP-3.3.4 local seen/snooze/hide independent from source resolution

**Reqs:** WF-ATT-001..006  
**Proof:** stale source, presenter-ack-only, resolved-from-other-surface, expired item tests.

### MLG-3 acceptance

Owner/delegate can resolve a real clarification/approval/auth/takeover boundary from Workforce and the canonical source resolves once; routine activity never competes for attention.

---

# 7. MLG-4 — Trajectory + work progression

**Outcome:** Workforce exposes the complete work mission and current executable frontier in the issue-#618 spirit without maintaining a second plan.

## STG-4.1 — Trajectory source adapter

### WP-4.1.1 Consume source-owned Full/Medium/Short projection or implement smallest required Focusa projection upstream
### WP-4.1.2 preserve HLT/MLG/STG/Waypoint/Workset/CallGraph/Workpoint links
### WP-4.1.3 unresolved requirements remain explicit

## STG-4.2 — Full/Medium/Short controls

### WP-4.2.1 Full projection
### WP-4.2.2 Medium projection
### WP-4.2.3 Short projection
### WP-4.2.4 omitted-coverage disclosure

## STG-4.3 — Human/Operations/Technical views

### WP-4.3.1 Human Mission/Current/Parallel/Next
### WP-4.3.2 Operations dependencies/actors/acceptance/proof
### WP-4.3.3 Technical exact graph/attempt/session/ref detail

## STG-4.4 — Lifecycle visibility

### WP-4.4.1 project lifecycle labels
### WP-4.4.2 VERIFY AGAINST SPECS projection
### WP-4.4.3 evidence-triggered REFINE projection
### WP-4.4.4 Unknown stage remains unknown

**Reqs:** WF-WRK-001..010  
**Proof:** coverage invariant fixture; branch-complete-but-HLT-incomplete negative test; unresolved unknown fixture.

### MLG-4 acceptance

Every accepted required branch is visible/dispositioned in Full; Medium and Short are projections of the same source truth; nearest Workpoint and ultimate accepted outcome are distinguishable; a local branch completion cannot look like whole-project completion.

---

# 8. MLG-5 — Evidence / verification / closure

**Outcome:** “done” becomes evidence-backed and causally inspectable.

## STG-5.1 — Proof-state projection

### WP-5.1.1 canonical state vocabulary
### WP-5.1.2 Evidence list/cards
### WP-5.1.3 recent Verified in Side Panel

## STG-5.2 — Evidence detail

### WP-5.2.1 provenance
### WP-5.2.2 work/actor links
### WP-5.2.3 verification history
### WP-5.2.4 corrections/revocations

## STG-5.3 — Closure chain

### WP-5.3.1 execution → Evidence
### WP-5.3.2 Evidence → verification
### WP-5.3.3 verification → settlement/Receipt
### WP-5.3.4 optional accepted outcome/W.I.N.S. ref

**Reqs:** WF-EVD-001..006  
**Proof:** unverified claim never green; correction downgrades visual state; settled ref trace.

### MLG-5 acceptance

User can inspect what proves an important result, distinguish claim from verification and see closure progression without Workforce owning any Evidence/settlement/outcome state.

---

# 9. MLG-6 — UIAI execution / takeover / browser context

**Outcome:** computer execution is visible in workforce context and handoff/takeover is seamless without recreating Cockpit.

## STG-6.1 — Execution projection

### WP-6.1.1 worker → UIAI context association
### WP-6.1.2 active context card/badge
### WP-6.1.3 Watch deep link

## STG-6.2 — Takeover

### WP-6.2.1 Attention item for auth/takeover
### WP-6.2.2 exact UIAI handoff
### WP-6.2.3 return location
### WP-6.2.4 reobserve/reconcile state

## STG-6.3 — Page context

### WP-6.3.1 Ask Foreman about page
### WP-6.3.2 Send page
### WP-6.3.3 Create work from selection
### WP-6.3.4 Evidence candidate
### WP-6.3.5 Open in UIAI

Only implement actions with real owning operations.

**Reqs:** WF-UIAI-001..005, WF-BRW-001..002  
**Proof:** exact deep-link roundtrip, takeover reconciliation, activeTab-only permission check.

### MLG-6 acceptance

User can understand which worker is using which computer context, watch or take over exact execution, return to the same Workstream and continue only after owning systems reconcile current state.

---

# 10. MLG-7 — Fleet / multi-environment / topology / capacity

**Outcome:** distributed workforce execution is understandable without exposing infrastructure as the primary mental model.

## STG-7.1 — Fleet projection

### WP-7.1.1 multi-environment aggregation
### WP-7.1.2 typed refs prevent ID collision
### WP-7.1.3 no reducer merge

## STG-7.2 — Topology screen

### WP-7.2.1 organizational body groups
### WP-7.2.2 health/busy/current Workstreams
### WP-7.2.3 technical detail drawer

## STG-7.3 — Capacity posture

### WP-7.3.1 resource pressure projection
### WP-7.3.2 contextual cloud/Agent Computer recommendation
### WP-7.3.3 placement handoff only when owner operation exists

**Reqs:** WF-FLT-001..005, WF-FED-001..004  
**Proof:** identical bare IDs across environments, private mode, resource recommendation no implicit mutation.

### MLG-7 acceptance

One owner lens can show multiple authorized environments/bodies with exact source truth, no state bleed, quiet federation posture and contextual capacity options.

---

# 11. MLG-8 — Complete surfaces / visual system / accessibility

**Outcome:** all four extension surfaces form one coherent premium UI and all required states are usable.

## STG-8.1 — Full Workforce screens

### WP-8.1.1 Overview
### WP-8.1.2 Work index/detail
### WP-8.1.3 People index/detail
### WP-8.1.4 Evidence index/detail
### WP-8.1.5 Topology
### WP-8.1.6 Audit
### WP-8.1.7 Settings

## STG-8.2 — Start Page redesign

### WP-8.2.1 concise return/orientation
### WP-8.2.2 current focus
### WP-8.2.3 Needs You/Working/Verified summary
### WP-8.2.4 continue exact Workstream
### WP-8.2.5 public-demo behavior preserved

## STG-8.3 — Wall redesign

### WP-8.3.1 read-only current focus
### WP-8.3.2 active workforce
### WP-8.3.3 attention/verified/freshness

## STG-8.4 — Surface implementation

### WP-8.4.1 exact tokens doc 13
### WP-8.4.2 responsive breakpoints
### WP-8.4.3 keyboard/focus
### WP-8.4.4 reduced motion
### WP-8.4.5 WCAG 2.2 AA
### WP-8.4.6 reference screenshots/snapshot review

**Reqs:** WF-SUR-001..005, WF-NFR-008..011  
**Proof:** browser viewport matrix, a11y checks, keyboard walkthrough, reference surface capture.

### MLG-8 acceptance

Side Panel, Full Workforce, Start Page and Wall all use the same semantic/visual system, cover required non-happy states and remain usable on Chromebook-class layouts without raw technical clutter.

---

# 12. MLG-9 — Voice / Radar / contextual expansion

**Outcome:** higher-leverage interactions extend the same contracts rather than adding side systems.

## STG-9.1 — Voice

### WP-9.1.1 mic affordance only when voice adapter available
### WP-9.1.2 Workstream/Foreman routing
### WP-9.1.3 ambiguity clarification
### WP-9.1.4 same Direction result states

## STG-9.2 — Radar

### WP-9.2.1 relevant Workstream Signals/Episodes
### WP-9.2.2 meaningful signal → Attention when human needed
### WP-9.2.3 Foreman can inspect/respond through owning Focusa path

## STG-9.3 — contextual expansion

### WP-9.3.1 UIAI need
### WP-9.3.2 capacity need
### WP-9.3.3 Draftee role gap
### WP-9.3.4 federation opportunity posture

Recommendation remains non-authoritative.

**Reqs:** WF-VOI-001..002, WF-STR-006, WF-FED-004  
**Proof:** same ref/authority semantics as typed path; no separate voice/radar authority.

### MLG-9 acceptance

Voice and Radar operate as alternative projections/routing inputs to existing Focusa/ADLBOS semantics, and expansion recommendations never create entitlement or authority.

---

# 13. MLG-10 — Production acceptance / migration / deployment

**Outcome:** redesigned product replaces current UI safely and is proven in actual browser/runtime use.

## STG-10.1 — Regression and migration

### WP-10.1.1 preserve stable extension ID
### WP-10.1.2 preserve pairing/storage compatibility or migrate explicitly
### WP-10.1.3 preserve public demo
### WP-10.1.4 old baseline behavior comparison

## STG-10.2 — Browser acceptance

Run representative journeys J1–J7 from doc 11 in Chromium/Chromebook.

Required failure cases:

```text
stale attention
stale Direction target
lost response
service-worker suspension
connection revoked
incompatible schema
UIAI unavailable
multi-environment ID collision
unverified completion claim
```

## STG-10.3 — Performance

Targets:

```text
Side Panel first meaningful local shell < 500ms after document load on target Chromebook when cached assets are local
interaction response to local UI < 100ms excluding source/network operation
no continuous high-frequency polling when event source exists
no large graph library loaded on Side Panel unless required
```

These are UI engineering targets, not guarantees about daemon/network latency.

## STG-10.4 — Release

```text
main green CI
→ Chromebook dogfood
→ explicit wfx veragensia
→ atomic stage/promote
→ verify extension ID
→ verify changed journeys
→ rollback on material regression
```

**Reqs:** WF-NFR-001..012  
**Proof:** CI, browser report, deployment receipt/health checks.

### MLG-10 acceptance

The redesigned extension is running through the normal deployment path, real user journeys work, rollback remains available and no unresolved required branch is hidden by a successful deployment.

---

# 14. Cross-MLG dependency graph

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

Parallelization allowed:

```text
MLG-2, MLG-3 and early MLG-4 after stable MLG-1 contracts
MLG-5 after evidence contracts known
MLG-7 after typed multi-environment refs stable
visual implementation can progress alongside slices once component contracts are fixed
```

Do not parallelize against unresolved shared contract assumptions.

---

# 15. Full / Medium / Short projection rules

## Full

This entire document, with all required MLG/STG/WP branches and current disposition.

Full MUST expose:

```text
accepted
active
ready
blocked
unresolved upstream
verified
settled
out-of-scope by explicit owner change
```

## Medium

One MLG or substantial Workstream subtree with:

```text
HLT ancestry
its STGs/WPs
cross-MLG dependencies
acceptance
proof obligations
current frontier
```

## Short

The nearest executable slice:

```text
HLT ancestry
MLG/STG/WP ID
exact current gap
source files/contracts
preconditions
authority
implementation action
verification
rollback/reconcile if material
next advancement condition
```

The current Short trajectory at project start is:

```text
MLG-0 / STG-0.1 / WP-0.1.1
Inspect current Focusa generated/current contracts required by Slice 1.
```

After that inspection, the next Workpoint is chosen deterministically using STG-0.1 decision rule; no product-design improvisation is permitted.

---

# 16. Requirement coverage map

| MLG | Primary requirement families |
|---|---|
| 0 | WF-NFR, WF-SCP foundation |
| 1 | WF-SCP, WF-FOR, WF-DIR, WF-SUR-001 |
| 2 | WF-PEO |
| 3 | WF-ATT |
| 4 | WF-WRK |
| 5 | WF-EVD |
| 6 | WF-UIAI, WF-BRW |
| 7 | WF-FLT, WF-FED |
| 8 | WF-SUR, WF-NFR accessibility/responsive |
| 9 | WF-VOI, contextual expansion |
| 10 | all release-critical WF-NFR + whole-project acceptance |

No implementation PR/commit may be considered architecture-complete without citing the requirement IDs it satisfies.

---

# 17. Blocking upstream dependencies

These are known possible upstream blockers, not permission to improvise client authority:

```text
UP-01 Foreman operations may remain draft/unmounted
UP-02 trajectory Full/Medium/Short source projection may require Focusa implementation
UP-03 shared operator.attention.v1 may require adapter/implementation
UP-04 closure/W.I.N.S. cross-ref may not be end-to-end
UP-05 UIAI surface-handoff exact route/contract may need implementation alignment
UP-06 fleet/multi-environment projection may need Focusa/Veragensia adapter
UP-07 voice/Radar operations may remain later-stage contracts
```

For each:

```text
inspect owning product
→ consume existing operation if real
→ otherwise implement smallest owning operation
→ add proof
→ return to Workforce node
```

Do not bypass the owning product in the extension.

---

# 18. Stop / refine rules

A Workpoint may stop only for:

```text
accepted outcome for its scoped node
actual dependency block
owner input materially required
current authority missing/revoked
unsafe/ambiguous consequential effect
owning contract missing
verification disproves assumptions
explicit owner pause/stop/scope change
```

When verification exposes a gap:

```text
mark affected node REFINE
invalidate only affected downstream assumptions/evidence
preserve unrelated valid work
update requirement/proof linkage
continue from nearest valid frontier
```

Do not restart the whole redesign because one branch changed.

---

# 19. Whole-project proof matrix

Final acceptance must include evidence for:

```text
architecture ownership preserved
all accepted requirements dispositioned
all four surfaces functional
Workstream/Foreman/Direction real
Needs You real
Full/Medium/Short trajectory real
People responsibility real
Evidence/closure real
UIAI handoff/takeover real
multi-environment no state bleed
stale/offline/reconcile truthful
accessibility/responsive acceptance
stable MV3 identity/build
Chromebook dogfood
explicit Veragensia live promotion
rollback available
```

This trajectory is complete enough for a build agent to execute without making foundational product, UX, information-architecture or visual-system decisions. Source discovery and owning-contract implementation are engineering tasks governed by the decision rules above, not permission to redesign the product.