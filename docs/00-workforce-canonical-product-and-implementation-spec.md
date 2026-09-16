# Focusa Workforce — Canonical Product and Implementation Spec

**Status:** CURRENT product architecture  
**Product:** Focusa Workforce  
**Canonical work authority:** Focusa  
**Portable ecosystem doctrine:** ADLBOS `CURRENT_ECOSYSTEM_ARCHITECTURE.md`  
**Partner/application counterpart:** `Startempire-Wire/Wirebot-App`

> **Focusa Workforce operates the workforce.**

Focusa Workforce is the browser-resident specialist operations surface through which an owner or Operating Partner observes, directs, intervenes in, and verifies a Focusa-governed agent workforce.

It is not the workforce runtime. It is not the customer's Chief of Staff. It is not UIAI Cockpit. It is not a second Focusa database. It is a projection and intent surface over canonical owners.

---

## 1. Product experience

The product should feel like the shared working environment where a human and their governed AI organization actually collaborate.

Within seconds it should answer:

```text
Who is working?
What are they doing?
What is the current objective?
What is blocked?
What genuinely needs me?
What has been proven?
Where is work executing?
What can I direct next?
```

The experience is not an agent-debug dashboard and not a stream of model chatter.

The primary operating loop is:

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

---

## 2. Ecosystem position

```text
CANONICAL OWNER PRINCIPAL
        ↓
OPERATING PARTNER / CHIEF OF STAFF
Wirebot implementation family
customer presentation may be "Spock", "Athena", etc.
        ↓ desired outcomes / bounded delegation
FOCUSA
Project · Workstream · Foreman · Workpoint · authority · Evidence
        ↓
FOCUSA WORKFORCE
live workforce operations
        ↓
workers / Pi / Silent Sessions / UIAI / Agent Computers
        ↓
Evidence / settlement
        ↓
accepted outcome / W.I.N.S.
```

Workforce must remain usable with any compatible Operating Partner presentation. It must never assume that the customer-facing partner is literally named `Wirebot`.

---

## 3. Owner, partner, Foreman, worker

These roles are different.

### Owner

The human/legal `CanonicalOwnerPrincipal` owns the deployment and root authority.

### Operating Partner / Chief of Staff

Wirebot architecture underneath; presentation may be customer-selected.

Portfolio altitude:

```text
What matters across life/business?
What deserves attention?
What should be delegated?
What capability or role is missing?
What outcome was accepted?
```

### Foreman

Persistent Workstream-responsible intelligence.

Workstream altitude:

```text
What is happening in this Workstream?
What is the current frontier?
Who should execute next?
What is blocked?
What satisfies acceptance?
```

### Manager / worker / verifier / specialist

Bounded execution roles underneath the Foreman according to current Focusa contracts.

The Chief of Staff is not a global Foreman. A Foreman does not inherit owner-wide partner context.

---

## 4. Workforce Composer versus Focusa Workforce

Wirebot's **Workforce Composer** designs and commissions the organization.

It answers:

```text
What role/team should exist?
Why?
What task packs/capabilities are required?
What data/budget/authority/supervisor are needed?
Should an existing worker or Draftee fill it?
```

Focusa Workforce answers:

```text
Who is working now?
On which Workstream?
What are they doing?
What is blocked?
What needs the owner?
What evidence exists?
Where is work running?
```

Canonical path:

```text
observed business/life need
→ Wirebot recommendation
→ Workforce Composer
→ CRIST / assignment packet
→ owner/governance acceptance
→ Focusa Workstream/Foreman/authority binding
→ Focusa Workforce
→ execution
→ Evidence / settlement
→ accepted outcome
```

Workforce MUST NOT create a parallel role/roster authority to make this flow easier to render.

---

## 5. Product surfaces

### 5.1 Side Panel — immediate collaboration

The side panel is the fast, contextual operating surface:

```text
[ Environment / health ]
[ Project / Workstream ]

Foreman
current objective / Workpoint / status

Direction Bar

Needs You

Working Now

Verified Recently

[ Open Workforce ]  [ Watch UIAI ]
```

It should support orientation, quick direction, owner responses, takeover links and confirmation of recent proof without becoming a tiny version of every full-app screen.

### 5.2 Full Workforce — deep operations

The full application is the specialist operations room:

- Workstream/Foreman context;
- workforce roster;
- active work/dependency progression;
- Needs You;
- Direction;
- Evidence / verification;
- task/work graph at progressive levels of detail;
- execution links to UIAI;
- fleet/body/topology posture;
- audit/history where useful.

### 5.3 Start Page — return/orientation

Optional return surface showing a calm briefing:

- current focus;
- active workers;
- meaningful changes;
- owner attention;
- verified recent outcomes;
- exact continuation entry points.

### 5.4 Wall / situational surface

Large-screen/read-only situational projection when useful. It must not become a separate operational authority.

---

## 6. Information hierarchy

Primary conceptual destinations:

```text
Overview / Today
Work
People
Evidence
```

Global/contextual capabilities:

```text
Needs You
Direction
Audit
Topology / Fleet
Settings
```

Approvals need not become a disconnected dashboard if they are represented correctly inside `Needs You` and their owning Focusa operation.

---

## 7. `Needs You`

This is a defining product experience.

Only items requiring human comparative advantage should enter it.

Examples:

```text
approval
owner truth / clarification
UIAI authentication/takeover
high-consequence decision
resource/budget exception
failed recovery
meaningful Radar signal
```

Do not fill it with routine activity such as agent starts/completions.

Use ADLBOS `operator.attention.v1` semantics. Every item retains its source-domain ref. Workforce projects and routes the decision; it does not manufacture duplicate approvals.

Wirebot App may show the same item's owner-wide projection.

---

## 8. Direction

Direction is one of the highest-value interactions.

Example:

> Prioritize the login regression. Keep the fix surgical and independently verify it before resuming styling.

The extension submits a typed intent to the exact Focusa environment/project/Workstream/Foreman context.

Direction is not generic chat. The response should remain connected to work state, consequences and evidence.

When the Foreman interprets a material directive, Workforce may show a concise execution interpretation:

```text
Priority
Login regression first

Approach
Reproduce → patch → focused tests → independent verification

Workers
Builder-2 · Verifier-1

Proceeding
```

Do not insert approval ceremony where current authority already permits the work.

---

## 9. Human-agent collaboration

Intervention should be natural and local to the work.

Examples:

```text
Foreman needs product truth
Which behavior is intentional?
[ answer ]
```

```text
UIAI needs authentication
[ Take control ]
```

```text
You: Do not rewrite the auth layer. Keep this surgical.
Foreman: Constraint updated.
```

The system should minimize babysitting while making human authority easy at the moments where it genuinely matters.

---

## 10. Evidence and trust

Workforce must visually distinguish activity from proof.

Preferred language:

```text
claimed
observed
supported
verified
settled
unknown
stale
```

Example:

```text
LOGIN REGRESSION

Implementation       ✓ Finished
Focused tests        ✓ 18 / 18
Browser verification ✓ UIAI
Independent review   ✓ Verifier

VERIFIED
[ Inspect evidence ]
```

Versus:

```text
DEPLOYMENT
Agent reports complete

UNVERIFIED
No external observation/receipt received.
```

Closure follows ADLBOS:

```text
execution
→ Focusa Evidence
→ verification / settlement
→ accepted outcome / W.I.N.S. where applicable
→ optional MeriFolio standing
```

Workforce never equates a screenshot or agent assertion with accepted business outcome.

---

## 11. UIAI integration

UIAI remains the browser/computer execution authority and detailed control surface.

Workforce renders bounded execution posture:

```text
Builder-2
Using UIAI
Chrome · Context 7
● Working
Last observation 2s ago
[ Watch ]
```

`Watch` / `Take control` opens the exact UIAI context through the shared surface-handoff contract.

Workforce does not reimplement Cockpit's browser automation, control leases, diagnostics or takeover machinery.

Human takeover must be followed by UIAI/Focusa reconciliation before autonomous continuation where required by owning contracts.

---

## 12. Fleet and topology

One Operator may use multiple Focusa daemons, machines, Agent Computers and cloud bodies.

Call this:

```text
fleet
multi-daemon aggregation
environment fleet
```

Reserve `federation` for communication between independently scoped sovereign Operators.

Workforce gives one owner lens while retaining source environment/daemon/body/runtime refs on every projection.

It must never silently merge canonical reducer state across environments.

---

## 13. Sovereign Operator deployments

Workforce is Operator-neutral.

A customer environment may present:

```text
ACME OPERATOR
Partner: Spock
Environment: Private Operator Deployment
Network: Private
```

or:

```text
VERIOUS OPERATOR
Partner: Wirebot
Network: Federated
```

Workforce does not need the customer-facing partner to be named Wirebot.

The partner profile is projected from the ADLBOS/Wirebot identity layer.

---

## 14. Optional federation and network opportunities

Startempire Wire federation is optional.

Workforce may quietly project network posture and relevant workforce-specific opportunities, but it is not the network application.

Examples:

```text
Network: Private
[ Explore federation ]
```

or:

```text
Network: Federated
2 capabilities shared
1 collaborative Workstream
```

Federation never gives remote participants ambient private memory, Workstreams, files, credentials, UIAI control or owner authority.

Wirebot/Startempire surfaces own the broader network relationship.

---

## 15. Capability and expansion posture

Workforce may expose adjacent capabilities contextually.

Keep distinct:

```text
supported
entitled
activated/connected
authorized
available/healthy
consented for this effect
```

Examples:

```text
Browser execution required.
UIAI Engine is available for this Operator but not entitled.
[ Learn about UIAI ]
```

```text
Current body is resource constrained.
Cloud Agent Computer capacity is available.
[ Review capacity ]
```

Such cards are recommendations, not grants or authority checks.

Avoid generic upgrade banners.

---

## 16. Draftees and MeriFolio

Draftees may supply public candidate/track-record information to the organization-composition flow.

A selected Draftee becomes a private Operator worker only through an explicit assignment/authority binding.

MeriFolio is a portable worker identity/trust/standing layer. It does not own local Focusa Workstreams or Workforce runtime state.

---

## 17. Shared ADLBOS contracts

Workforce consumes, rather than reinvents, these cross-product seam families:

```text
operator.partner_profile.v1
operator.surface_handoff.v1
operator.attention.v1
operator.correlation.v1
operator.capability_posture.v1
operator.closure.v1
```

They are reference envelopes, not a new backend.

Workforce-specific runtime contracts remain in `05-extension-runtime-data-and-integration-contracts.md`.

---

## 18. Browser role

Focusa Workforce is the primary specialist browser-resident **workforce** surface.

Browser context operations may include:

```text
Ask Foreman about this page
Send page to Foreman
Create work proposal from selection
Capture selection as Evidence candidate
Open page in UIAI
```

This makes Workforce a natural browser bridge for governed work without making it Wirebot itself.

A future separate Wirebot browser extension should exist only for truly non-overlapping owner/partner browser jobs after shared browser operations are evaluated.

---

## 19. Visual/product design law

The visual goal is **expensive calm**, not futuristic dashboard theater.

Principles:

- Google-clean restraint;
- strong typography and spacing;
- minimal chrome;
- information hierarchy over widget abundance;
- subtle motion that communicates real work changes;
- scarce saturated color;
- Evidence/attention/active work prioritized;
- contextual expansion rather than constant navigation;
- dense technical detail one layer down;
- accessible keyboard/touch/screen-reader behavior;
- honest stale/degraded/unknown states.

If a statistic, control or panel does not improve orientation, direction, intervention or confidence, it probably does not belong on the primary surface.

---

## 20. Architecture rules

1. The extension is a **projection and intent client**, not the runtime.
2. Agents/work continue when the browser closes.
3. Focusa remains canonical for governed work and Evidence.
4. Wirebot remains the Operating Partner/organization-design surface.
5. UIAI remains computer-execution authority.
6. Veragensia remains body/runtime authority.
7. Entitlement does not imply authority.
8. Federation does not imply ambient access.
9. Partner branding does not imply a new protocol identity.
10. Fleet aggregation does not imply shared reducer state.
11. First-party operations are structured/API-first; CUA is not normal cross-product integration.
12. Every actionable projection carries exact source refs and freshness.
13. No new task, approval, Evidence, memory or entitlement database is created inside the extension.

---

## 21. Redesign implementation direction

Preserve the existing proven core integration modules where sound:

```text
pairing
API client
contracts
orchestration
session creation
SSE / reconnect
projections
validation
```

Evolve the presentation/runtime architecture so multiple surfaces share one Workforce client/event/projection layer rather than each page independently maintaining its own daemon connectivity/state.

A Svelte 5 UI layer is appropriate for the redesign while keeping canonical work semantics outside presentation components.

Suggested vertical slices:

```text
1. Workstream + Foreman + Direction
2. Working Now / roster
3. Needs You
4. work progression / graph
5. Evidence / verified closure
6. UIAI execution / takeover
7. voice
8. fleet / topology
9. Radar
10. elastic capacity
```

Each slice must be useful end-to-end and preserve current deployment/rollback safety.

---

## 22. Acceptance

The redesign is architecturally successful when this journey works coherently:

```text
owner speaks/types to their Operating Partner
→ Wirebot delegates an accepted outcome
→ Focusa resolves Workstream/Foreman
→ Workforce shows live responsible organization
→ workers execute across Pi/UIAI/Agent Computers
→ Needs You interrupts only for genuine owner value
→ owner acts from Wirebot or Workforce
→ exact execution resumes/reconciles
→ Evidence verifies/settles the work
→ accepted outcome appears back at owner altitude
```

No manual scope rediscovery. No duplicate authority. No fake success. No product boundary collision.
