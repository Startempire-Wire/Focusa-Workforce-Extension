# Focusa Workforce — Product Requirements Register

**Status:** CURRENT accepted product scope  
**Parent:** `08-workforce-redesign-blueprint.md`  
**Trajectory consumer:** `14-workforce-full-trajectory.md`  
**Legacy filename note:** this file keeps its existing path for stable references; it is no longer a per-requirement proof matrix.

This register exists to prevent scope loss and implementation drift. It is **not** a ticket system, test quota, proof ledger, or reporting obligation.

## Execution law

Use requirement IDs when they materially help implementation, debugging, handoff, or coverage. Do not annotate every edit or maintain cosmetic traceability.

Verification is shared and risk-based:

```text
build the real behavior
→ verify the material acceptance condition
→ reuse valid existing evidence
→ continue
```

One browser journey, contract test, source revision, receipt, or focused check may satisfy many requirements. Do not create separate proof artifacts unless a material requirement cannot otherwise be established.

---

## 1. Product objective

Deliver a production-grade browser-resident Workforce experience in which an authorized human can understand, direct, collaborate with, intervene in, and verify a Focusa-governed agent organization without managing low-level agent machinery.

Workforce remains a projection/intent client over canonical owners. It MUST NOT become a second work authority, approval store, Evidence ledger, entitlement system, credential vault, federation authority, or runtime scheduler.

---

## 2. Primary actors

- **WF-ACTOR-01 — Canonical Owner:** root owner authority.
- **WF-ACTOR-02 — Delegated Human:** operates only inside explicit owner-granted scope.
- **WF-ACTOR-03 — Operating Partner:** customer-named Wirebot-family partner; not the Workstream Foreman.
- **WF-ACTOR-04 — Foreman:** accountable Focusa Workstream-responsible role projection.
- **WF-ACTOR-05 — Workforce Member:** bounded Manager, Worker, Specialist, or Verifier projected from Focusa-owned state.

---

## 3. Strategy

- **WF-STR-001:** A returning user can understand active objective, Foreman, meaningful work, blockers, human attention, proof, and freshness from the primary experience.
- **WF-STR-002:** Routine authorized work continues without repeated human “continue” prompts.
- **WF-STR-003:** Human attention is reserved for judgment, authority, truth, authentication, intervention, and meaningful exceptions.
- **WF-STR-004:** Completion language never exceeds current proof.
- **WF-STR-005:** Core Workforce remains fully useful in private/Sovereign operation with federation off.
- **WF-STR-006:** Adjacent ecosystem capabilities may be surfaced contextually without turning Workforce into a storefront or granting entitlement/authority.
- **WF-STR-007:** Customer-facing Operating Partner identity is white-labelable without changing protocol identity, Workstreams, Foremen, or Evidence.

---

## 4. Environment, identity, and scope

- **WF-SCP-001:** Pair/connect an authorized Focusa environment using existing pairing semantics.
- **WF-SCP-002:** Show truthful Fresh / Stale / Unknown / Unavailable / Incompatible posture.
- **WF-SCP-003:** Project/Workstream selection controls exact mutation scope.
- **WF-SCP-004:** Multi-environment projections retain source domain/environment/daemon/tenant identity.
- **WF-SCP-005:** Bare IDs are never assumed globally unique.
- **WF-SCP-006:** Customer-named Operating Partner identity is distinct from Foreman and worker identity.
- **WF-SCP-007:** Delegated humans remain bounded operational principals, not co-owners or architecture authorities.

---

## 5. Workstream and Foreman

- **WF-FOR-001:** Workstream is the primary operational context, not daemon/session/model.
- **WF-FOR-002:** The active Workstream resolves its exact Foreman projection; no client-global Foreman singleton.
- **WF-FOR-003:** Foreman presentation includes objective, current frontier/Workpoint, responsible people, meaningful recent Evidence, and freshness where source data exists.
- **WF-FOR-004:** Foreman identity survives model/session/body replacement.
- **WF-FOR-005:** Foreman status distinguishes observed, inferred, stale, unknown, and proven state.
- **WF-FOR-006:** Workforce never fabricates canonical Foreman state when the owning Focusa contract is missing.

---

## 6. Direction

- **WF-DIR-001:** User can direct the exact active Workstream/Foreman through the owning Focusa operation.
- **WF-DIR-002:** Direction target is visible before submission.
- **WF-DIR-003:** Render owning result states such as accepted, clarification, proposal, dispatched, blocked, denied, stale/revalidation, and unknown/reconciling where applicable.
- **WF-DIR-004:** Ordinary authorized directions do not add redundant confirmation ceremony.
- **WF-DIR-005:** Ambiguous scope requires clarification rather than global routing.
- **WF-DIR-006:** Stale target revisions are revalidated before consequential mutation.
- **WF-DIR-007:** Voice/page/selection inputs reuse the same scoped Direction semantics.
- **WF-DIR-008:** Direction links to resulting work/Evidence where source refs exist; transcript is not project state.

---

## 7. Working Now / People

- **WF-PEO-001:** Roster is organized by responsibility and assignment, not model branding.
- **WF-PEO-002:** Foreman, Manager, Worker/Specialist, and Verifier distinctions are visible where source role data supports them.
- **WF-PEO-003:** Person detail may expose Workstream, responsibility, current work, execution context, authority posture, and recent Evidence without local canonical state.
- **WF-PEO-004:** Worker/session replacement does not imply loss of Workstream/Foreman continuity.
- **WF-PEO-005:** Workforce Composer/assignment data appears operationally only after canonical Focusa binding; the extension does not create a parallel roster authority.

---

## 8. Work progression and Trajectory

- **WF-WRK-001:** Trajectory coverage depth is separate from presentation depth.
- **WF-WRK-002:** Full projection accounts for the whole accepted outcome, required branches, acceptance, dependencies, current/ready/blocked/unresolved scope, and linked work/Evidence.
- **WF-WRK-003:** Medium projection shows the relevant substantial outcome/Workstream subtree with HLT ancestry and external/cross-branch prerequisites.
- **WF-WRK-004:** Short projection shows the exact executable slice, ancestry, gap, frontier/Workpoint, preconditions, evidence obligation, material rollback, and next advancement condition.
- **WF-WRK-005:** Human presentation explains Mission → Current → Parallel → Next without graph literacy.
- **WF-WRK-006:** Operations presentation exposes dependencies, actors, blockers, acceptance, and Evidence.
- **WF-WRK-007:** Technical presentation can expose exact graph/attempt/session/lease/generation/ref/receipt detail without becoming the default UI.
- **WF-WRK-008:** Source-supported lifecycle visibility includes PREPARE, DIAGNOSE, PLAN, SPECIFY, DECOMPOSE, VERIFY AGAINST SPECS, IMPLEMENT, DEPLOY, VERIFY OUTCOME, and evidence-triggered REFINE.
- **WF-WRK-009:** Completed branch/Workpoint never implies whole accepted outcome completion while required scope remains.
- **WF-WRK-010:** Unknown distant details remain explicit unresolved requirements rather than fabricated work.

---

## 9. Needs You / attention

- **WF-ATT-001:** Needs You contains only human-value attention: approval, owner truth, authentication, takeover, budget/resource exception, recovery, meaningful blocker, or high-value signal.
- **WF-ATT-002:** Attention presentation explains what, why now, context, consequence, current actions, source, and freshness/expiry where material.
- **WF-ATT-003:** Presenter seen/snooze/hide does not resolve the source-domain decision.
- **WF-ATT-004:** Consequential attention actions revalidate source revision/freshness immediately before mutation.
- **WF-ATT-005:** Multiple authorized presenters may project the same source attention without duplicate canonical resolution.
- **WF-ATT-006:** Resolved/cancelled/expired items leave active Needs You and may remain in history.

---

## 10. Evidence and closure

- **WF-EVD-001:** UI distinguishes Claimed, Observed, Supported, Verified, Settled, Unknown, and Stale.
- **WF-EVD-002:** Evidence detail preserves source refs/provenance.
- **WF-EVD-003:** Screenshot/tool success/agent assertion is never automatically an accepted outcome.
- **WF-EVD-004:** Workforce can project execution → Evidence → verification → settlement/Receipt → accepted outcome → optional W.I.N.S. without duplicating owner state.
- **WF-EVD-005:** User can inspect why a claim is or is not verified.
- **WF-EVD-006:** Corrections/revocations/staleness update displayed confidence.

---

## 11. UIAI integration

- **WF-UIAI-001:** Project bounded UIAI execution context for responsible worker/work.
- **WF-UIAI-002:** Watch opens the exact UIAI context through shared handoff semantics.
- **WF-UIAI-003:** Takeover remains UIAI-owned; Workforce does not duplicate control-lease state.
- **WF-UIAI-004:** Return from human takeover shows reconciliation/re-observation until source truth is restored.
- **WF-UIAI-005:** Unavailable/not-entitled/setup-required states are explicit and never imply permission.

---

## 12. Fleet / topology / capacity

- **WF-FLT-001:** One Operator's environments/daemons/bodies are fleet/aggregation, never sovereign federation.
- **WF-FLT-002:** Primary topology uses organizational language; technical body/runtime detail is progressive disclosure.
- **WF-FLT-003:** Source placement/body/resource posture remains exact and inspectable.
- **WF-FLT-004:** Capacity recommendation does not itself move work or grant resources.
- **WF-FLT-005:** When owning placement exists and authority allows it, placement preserves Workstream continuity and correlation.

---

## 13. Federation / ecosystem expansion

- **WF-FED-001:** Private/Sovereign core functions with federation disabled.
- **WF-FED-002:** Federation posture is projection only; Workforce does not become the network app or authority.
- **WF-FED-003:** Federation never implies ambient access to private memory, Workstreams, files, credentials, owner authority, or UIAI control.
- **WF-FED-004:** Expansion posture keeps supported, entitled, activated/connected, authorized, available/healthy, and consented-for-effect distinct.

---

## 14. Browser context and voice

- **WF-BRW-001:** Explicit page-context actions may Ask Foreman, Send page, Create work from selection, Capture Evidence candidate, and Open in UIAI only when owning operations exist.
- **WF-BRW-002:** Current-page access remains explicit/minimal via `activeTab`; no unnecessary persistent host permission.
- **WF-VOI-001:** Workstream-scoped voice direction uses the same exact Foreman/Direction contract.
- **WF-VOI-002:** Ambiguous voice scope requires clarification rather than global routing.

---

## 15. Surfaces

- **WF-SUR-001:** Side Panel optimizes immediate current-Workstream collaboration.
- **WF-SUR-002:** Full Workforce supports deep operations across Workstreams.
- **WF-SUR-003:** Start Page is a concise return/orientation surface, not widget landfill.
- **WF-SUR-004:** Wall is read-only ambient situational awareness.
- **WF-SUR-005:** Exact context survives valid navigation/handoff between Workforce and specialist surfaces.

---

## 16. Non-functional requirements

- **WF-NFR-001:** MV3 remains valid and stable extension identity is preserved unless deliberately migrated.
- **WF-NFR-002:** Existing pairing/orchestration/session/reconnect/projection safety semantics remain unless their owning contracts deliberately change.
- **WF-NFR-003:** Service-worker suspension does not destroy canonical continuity or event correctness.
- **WF-NFR-004:** Source revision/sequence/generation outranks wall-clock ordering across machines where available.
- **WF-NFR-005:** Unsupported consequential schema versions fail closed.
- **WF-NFR-006:** Ambiguous consequential writes reconcile before retry; no blind duplicate effects.
- **WF-NFR-007:** Reusable secrets never enter handoffs, URLs, Direction text, attention cache, Evidence, receipts, or repository files.
- **WF-NFR-008:** Light-first UI meets WCAG 2.2 AA contrast, keyboard navigation, and visible-focus requirements.
- **WF-NFR-009:** Side Panel works from 320px; Full Workforce works at Chromebook-class 1024px through large desktop.
- **WF-NFR-010:** Primary orientation does not depend on unnecessary animation and honors reduced motion.
- **WF-NFR-011:** Product remains truthful under offline/stale/degraded/partial state.
- **WF-NFR-012:** CI/build is green before promotion; live promotion remains explicit through the Veragensia path.

---

## 17. Accepted exclusions / non-goals

Do not add another:

```text
work/task database
agent identity authority
approval/attention authority
Evidence ledger
credential vault
UIAI Cockpit/control lease system
federation backend
generic transcript-as-project-state
global Foreman singleton
implicit entitlement authority
implicit production promotion
```

Model/provider identity is not worker identity.

---

## 18. Coverage invariant

The only required bookkeeping invariant is:

```text
accepted requirement
→ implemented, deliberately dispositioned, or explicitly unresolved

material implementation
→ traceable to accepted product intent when that traceability is actually useful
```

Do not maintain a parallel proof ledger. Do not require one test per requirement. Do not stop implementation to keep this register cosmetically synchronized.

At meaningful integration/release boundaries, confirm that accepted scope has not been silently dropped and whole-project completion is not inferred from one finished branch.