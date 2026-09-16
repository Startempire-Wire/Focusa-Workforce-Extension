# Focusa Workforce — Product Requirements and Proof Matrix

**Status:** CURRENT implementation authority for accepted product requirements  
**Parent:** `08-workforce-redesign-blueprint.md`  
**Trajectory consumer:** `14-workforce-full-trajectory.md`  
**Rule:** every implementation node MUST map upward to one or more requirement IDs; every accepted requirement MUST map downward to implementation or an explicit unresolved dependency.

This document closes the Strategy and Scope planes for the Workforce redesign and provides the requirement/proof spine required for a Focusa-style Full Trajectory.

---

## 1. Product objective

Deliver a production-grade browser-resident Workforce experience in which an authorized human can understand, direct, collaborate with, intervene in, and verify a Focusa-governed agent organization without managing low-level agent machinery.

The product must remain a projection/intent client over canonical owners. It MUST NOT become a second work authority, approval store, evidence ledger, entitlement system, credential vault, federation authority, or runtime scheduler.

---

## 2. Primary actors

### WF-ACTOR-01 — Canonical Owner
The owner can inspect and operate all Workforce capabilities allowed by current product/runtime authority.

### WF-ACTOR-02 — Delegated Human
A delegated human can operate only within explicit current owner-granted scope. The UI must not imply co-ownership or architecture authority.

### WF-ACTOR-03 — Operating Partner
The customer-named partner (Wirebot implementation family) may project owner-level context and exact handoffs into Workforce but is not the Workstream Foreman.

### WF-ACTOR-04 — Foreman
The Focusa Workstream-responsible role projection is the accountable operational intelligence for one exact Workstream.

### WF-ACTOR-05 — Workforce Member
Manager, worker, verifier or specialist shown as a bounded responsibility-bearing actor under Focusa-owned assignment/authority.

---

## 3. Strategy requirements

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-STR-001 | A returning user understands the active objective, responsible Foreman, meaningful active work, blockers, owner attention, proof and freshness within one primary view. | Browser acceptance with representative live data; no developer/runtime terminology required for basic orientation. |
| WF-STR-002 | Routine autonomous work proceeds without requiring the user to repeatedly say “continue.” | Representative run continues after an ordinary completed node until accepted completion or a genuine scoped boundary. |
| WF-STR-003 | Human attention is reserved for judgment, authority, truth, authentication, intervention and meaningful exceptions. | Routine agent starts/tool events do not populate Needs You. |
| WF-STR-004 | Product truth is evidence-backed; completion language never exceeds current proof. | Claimed/unverified work remains visibly distinct from verified/settled work. |
| WF-STR-005 | Workforce remains useful in private Sovereign deployments with no federation. | Full core workflow works with network posture Private/offline. |
| WF-STR-006 | Adjacent ecosystem capabilities can be surfaced contextually without turning Workforce into a storefront. | UIAI/capacity/Draftee/network suggestions appear only from relevant posture; recommendation does not mutate entitlement/authority. |
| WF-STR-007 | Customer-facing Operating Partner identity is white-labelable without changing protocol identity or work state. | Rename/display change does not alter partner refs, Workstreams, Foremen or evidence. |

---

## 4. Environment, identity and scope

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-SCP-001 | User can pair/connect an authorized Focusa environment using existing pairing semantics. | Existing pairing regression tests + browser pairing journey. |
| WF-SCP-002 | User can see connection health/freshness without mistaking stale data for current truth. | Fresh/Stale/Unknown/Unavailable/Incompatible states render correctly. |
| WF-SCP-003 | User can select Project/Workstream; mutations always target the exact selected canonical scope. | Mutation request contains exact current refs; wrong/stale scope is rejected. |
| WF-SCP-004 | Multi-environment use preserves source domain/environment/daemon/tenant refs for every projected entity. | Collision fixture with equal bare IDs from two environments renders distinctly. |
| WF-SCP-005 | Bare IDs are never assumed globally unique. | Cross-product/environment ref validation tests. |
| WF-SCP-006 | A customer-named partner such as Spock is projected separately from Foreman and worker identity. | UI identity fixture; partner rename does not affect Foreman identity. |
| WF-SCP-007 | Delegated humans are rendered/authorized as bounded operational principals, not owners. | Denial test when delegated principal attempts operation outside grant. |

---

## 5. Workstream and Foreman

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-FOR-001 | Workstream is the primary operational context, not daemon/session/model. | Side panel/full app default to Workstream context. |
| WF-FOR-002 | Exactly one resolved Foreman projection is shown for the active Workstream unless Focusa explicitly reports another supported state. | Same Workstream resolves same Foreman binding across reload/runtime change. |
| WF-FOR-003 | Foreman card shows objective, current frontier/Workpoint, responsible people, last meaningful evidence and freshness. | Live fixture/adapter acceptance. |
| WF-FOR-004 | Foreman identity survives model/session/body changes. | Runtime switch fixture retains Foreman ref. |
| WF-FOR-005 | Foreman status answers distinguish observed/inferred/stale/unknown/proven state. | State-label tests + evidence refs where applicable. |
| WF-FOR-006 | Workforce never synthesizes a canonical Foreman from unrelated client-side projections if the owning Focusa contract is missing. | Missing-contract path renders Unsupported/Unavailable and names owning dependency. |

---

## 6. Direction

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-DIR-001 | User can type a direction to the exact active Workstream/Foreman. | End-to-end browser action reaches Focusa owning operation. |
| WF-DIR-002 | Direction target is always visible before submission. | UI shows Project/Workstream/Foreman target. |
| WF-DIR-003 | Direction result states include accepted, clarification required, proposal created, dispatched, blocked, denied and stale/revalidation required where produced by owning contracts. | Contract/state tests and browser rendering. |
| WF-DIR-004 | Ordinary authorized directions do not introduce redundant confirmation ceremony. | Low-consequence authorized fixture dispatches directly. |
| WF-DIR-005 | Ambiguous scope requires exact clarification rather than global routing. | Two plausible Workstreams fixture refuses mutation. |
| WF-DIR-006 | Stale target revisions cannot silently accept a consequential direction. | Stale revision fixture fails/revalidates before mutation. |
| WF-DIR-007 | Voice/page/selection inputs ultimately use the same scoped Direction semantics rather than separate action authorities. | Adapter contract tests when those modes ship. |
| WF-DIR-008 | Direction history links to resulting work/evidence where source contracts provide them; chat transcript is not the primary project state. | Result refs visible; reload derives state from Focusa. |

---

## 7. Working Now / People

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-PEO-001 | Roster is organized by responsibility and active assignment, not model branding. | Worker cards prioritize role/work; model one layer down. |
| WF-PEO-002 | Foreman, Manager, Worker, Specialist and Verifier roles are visually distinguishable where source role data supports them. | Role fixture coverage. |
| WF-PEO-003 | Each person card can expose Workstream, current work, parent responsibility, execution context, authority posture and recent proof without creating local canonical state. | Detail view sources every field. |
| WF-PEO-004 | Worker death/session replacement does not imply loss of Workstream/Foreman continuity. | Reconnect/replacement fixture. |
| WF-PEO-005 | Workforce Composer/private assignment data appears only after canonical Focusa binding; extension does not create a parallel roster authority. | No extension-local employee/assignment creation path. |

---

## 8. Work progression and Trajectory

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-WRK-001 | Work UI distinguishes trajectory coverage depth from presentation detail. | Full/Medium/Short × Human/Operations/Technical are independently selectable/projectable. |
| WF-WRK-002 | Full projection accounts for the whole accepted outcome, required branches, acceptance, dependencies, active/ready/blocked/unresolved scope and linked work/evidence. | Requirement coverage test against trajectory fixture. |
| WF-WRK-003 | Medium projection shows one substantial outcome/Workstream subtree with HLT ancestry and cross-branch/external dependencies. | Projection contract fixture. |
| WF-WRK-004 | Short projection shows exact current executable slice with ancestry, gap, frontier/Workpoint, preconditions, proof obligations, rollback where material and next advancement condition. | Projection contract fixture. |
| WF-WRK-005 | Human presentation explains Mission → Current → Parallel → Next without requiring graph literacy. | Usability/browser acceptance. |
| WF-WRK-006 | Operations presentation shows dependencies, responsible actors, blockers, acceptance and evidence. | Fixture acceptance. |
| WF-WRK-007 | Technical presentation can expose exact DAG/attempt/session/lease/generation/ref/receipt data without becoming the default UI. | Technical drilldown acceptance. |
| WF-WRK-008 | Work lifecycle visibly supports PREPARE, DIAGNOSE, PLAN, SPECIFY, DECOMPOSE, VERIFY AGAINST SPECS, IMPLEMENT, DEPLOY, VERIFY OUTCOME and evidence-triggered REFINE when Focusa source data supports them. | Lifecycle projection tests; no duplicate workflow state in extension. |
| WF-WRK-009 | A completed branch never implies the accepted whole outcome is complete while required scope remains unresolved. | Negative completion fixture. |
| WF-WRK-010 | Unknown distant details remain explicit unresolved requirements rather than fabricated work. | Full trajectory fixture with unresolved dependency. |

---

## 9. Needs You / attention

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-ATT-001 | Needs You contains only human-value attention classes: approval, owner truth, authentication, takeover, budget/resource exception, recovery, meaningful blocker or high-value signal. | Filtering tests. |
| WF-ATT-002 | Every attention card shows what, why now, context, consequence, actions, source, freshness and expiry where applicable. | Component contract/browser acceptance. |
| WF-ATT-003 | Workforce presenter acknowledgement/snooze/hide never resolves the source-domain decision. | Negative source-resolution test. |
| WF-ATT-004 | Consequential attention actions revalidate source revision/freshness immediately before mutation. | Stale attention fixture. |
| WF-ATT-005 | Same source attention can be surfaced by another authorized presenter without duplication of canonical resolution. | Shared attention-ref test. |
| WF-ATT-006 | Resolved/cancelled/expired source items leave active Needs You and remain available in history where appropriate. | State transition test. |

---

## 10. Evidence and closure

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-EVD-001 | UI distinguishes Claimed, Observed, Supported, Verified, Settled, Unknown and Stale. | Visual/state snapshot tests. |
| WF-EVD-002 | Evidence detail retains source refs and provenance. | Evidence fixture. |
| WF-EVD-003 | Screenshot/tool success/agent assertion is never automatically presented as accepted outcome. | Negative evidence test. |
| WF-EVD-004 | Closure chain can project execution → Evidence → verification → settlement/Receipt → accepted outcome → optional W.I.N.S. projection without duplicating owner state. | Cross-ref fixture. |
| WF-EVD-005 | User can inspect why a claim is considered verified or not verified. | Evidence detail browser flow. |
| WF-EVD-006 | Corrections/revocations/staleness update displayed confidence rather than leaving stale proof visually final. | Correction fixture. |

---

## 11. UIAI integration

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-UIAI-001 | Workforce projects bounded UIAI execution context for the responsible worker/work. | Exact execution ref visible. |
| WF-UIAI-002 | Watch opens the exact UIAI context using the shared handoff contract. | Deep-link/handoff acceptance. |
| WF-UIAI-003 | Takeover is performed by UIAI authority, not reimplemented in Workforce. | No duplicate lease/control state; integration test. |
| WF-UIAI-004 | After human takeover/return, Workforce can show reconciling/re-observing until current source truth is restored. | Takeover-return fixture. |
| WF-UIAI-005 | UIAI unavailable/not entitled/setup-required states are explicit and do not imply permission. | Capability posture fixtures. |

---

## 12. Fleet / topology / capacity

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-FLT-001 | One Operator's environments/daemons/bodies are called fleet/aggregation, never sovereign federation. | Copy/static contract test. |
| WF-FLT-002 | Primary topology uses organizational language; technical body/runtime details are progressive disclosure. | Browser review. |
| WF-FLT-003 | Source placement/body/resource posture remains exact and inspectable. | Multi-node fixture. |
| WF-FLT-004 | Capacity recommendation does not itself move work or grant resources. | Recommendation-only negative test. |
| WF-FLT-005 | When an owning placement operation exists and authority allows it, move/placement preserves Workstream continuity and exact correlation. | Later integration acceptance. |

---

## 13. Federation / ecosystem expansion

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-FED-001 | Private/Sovereign core functions with federation disabled. | Offline/private journey. |
| WF-FED-002 | Federation posture is a projection only; Workforce does not become the network application. | No federation authority/store in extension. |
| WF-FED-003 | Federation never implies ambient access to private memory, Workstreams, files, credentials, owner authority or UIAI control. | Negative isolation fixtures when federation ships. |
| WF-FED-004 | Contextual expansion cards distinguish supported, entitled, activated/connected, authorized, available/healthy and consented-for-effect. | Capability posture component tests. |

---

## 14. Browser context and voice

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-BRW-001 | Explicit page-context actions can Ask Foreman, Send page, Create work from selection, Capture Evidence candidate and Open in UIAI when owning operations exist. | Per-action browser acceptance. |
| WF-BRW-002 | Current-page access remains explicit/minimal and uses `activeTab`; no unnecessary persistent host permissions. | Manifest/build tests. |
| WF-VOI-001 | Workstream-scoped voice direction resolves through the same exact Foreman/Direction contract. | Voice adapter acceptance when implemented. |
| WF-VOI-002 | Ambiguous voice Workstream scope asks for clarification instead of routing globally. | Multi-workstream voice fixture. |

---

## 15. Surface requirements

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-SUR-001 | Side Panel is optimized for immediate current-Workstream collaboration. | Side-panel acceptance suite. |
| WF-SUR-002 | Full Workforce supports deep operations across Workstreams. | Full-page browser suite. |
| WF-SUR-003 | Start Page is a concise return/orientation surface, not configurable widget landfill. | Start-page acceptance. |
| WF-SUR-004 | Wall is read-only ambient situational awareness. | Mutation controls absent; wall tests. |
| WF-SUR-005 | Exact context survives valid navigation/handoff between Workforce surfaces and specialist surfaces. | Deep-link roundtrip test. |

---

## 16. Non-functional requirements

| ID | Requirement | Acceptance / proof |
|---|---|---|
| WF-NFR-001 | MV3 extension remains valid and preserves stable extension identity unless deliberately migrated. | Build/manifest gate. |
| WF-NFR-002 | Existing pairing/orchestration/session/reconnect/projection safety semantics are preserved unless owning contracts deliberately change. | Existing regression suite + new integration tests. |
| WF-NFR-003 | Service-worker suspension does not destroy canonical UI state or event correctness. | suspend/reload acceptance. |
| WF-NFR-004 | UI uses source revision/sequence/generation where available; wall clocks do not establish causal order across machines. | ordering fixtures. |
| WF-NFR-005 | Unsupported consequential schema versions fail closed. | version compatibility test. |
| WF-NFR-006 | Ambiguous consequential writes reconcile before retry; no blind duplicate effects. | lost-response fixture. |
| WF-NFR-007 | Reusable secrets never appear in handoffs, URLs, Direction text, attention cache, Evidence or receipts. | secret leakage tests. |
| WF-NFR-008 | Light-first UI meets WCAG 2.2 AA contrast, keyboard navigation and visible focus requirements. | automated a11y + keyboard acceptance. |
| WF-NFR-009 | Side Panel is usable from 320px width; Full Workforce supports 1024px Chromebook-class layout through large desktop. | responsive browser matrix. |
| WF-NFR-010 | Primary orientation content is available without unnecessary animation and supports reduced motion. | reduced-motion test. |
| WF-NFR-011 | Product remains truthful under offline/stale/degraded/partial state. | failure-mode browser suite. |
| WF-NFR-012 | CI/build is green before promotion; live promotion remains explicit through documented Veragensia path. | CI + release gate. |

---

## 17. Accepted exclusions / non-goals

These are not missing features:

```text
- another canonical work/task database
- another agent identity authority
- another approval/attention authority
- another Evidence ledger
- another credential vault
- another UIAI Cockpit/control lease system
- another federation backend
- a generic chat transcript as the project state
- automatic entitlement creation from UI availability
- global Foreman singleton
- model/provider identity as the worker identity
- implicit production promotion on every main push
```

---

## 18. Requirement coverage invariant

Before a release slice is admitted:

1. every requirement in its scope has one implementation/disposition node;
2. every implementation node cites one or more requirement IDs;
3. every consequential requirement names the owning system/operation;
4. every acceptance condition names evidence/proof expected;
5. unresolved upstream contracts are explicit blocking/refinement nodes;
6. no accepted requirement is silently deferred by calling it “future” or “optional” unless the owner actually changed scope.

This matrix is the accepted scope authority for the redesign unless a later owner-approved document explicitly supersedes a requirement.