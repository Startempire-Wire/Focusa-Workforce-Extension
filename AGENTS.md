# AGENTS.md — Focusa Workforce

## Mission

Build and continuously improve **Focusa Workforce**, the browser-resident operations surface for a human-owned agent workforce.

Prioritize a functioning, dogfoodable extension over process ceremony. Preserve architecture ownership and prove outcomes.

## Product identity

- Product name: **Focusa Workforce**.
- Do not rename it to HQ or Cockpit.
- **UIAI Engine Cockpit** owns the Cockpit term for live browser/computer execution oversight/control.
- Workforce is the workforce operations surface.

## Canonical boundaries

### Workforce owns

- Chrome/Chromium extension UI and browser integration;
- roster/work graph/direction/approvals/evidence/audit/topology presentation;
- extension pairing UX;
- extension-specific storage/preferences;
- build/install/update/release pipeline;
- exact handoff into UIAI.

### Focusa owns

- Workstreams, Workpoints, Foreman identity/binding;
- agent/role/capability semantics;
- authority and registered operations;
- Evidence/Receipts/audit truth;
- Radar semantics;
- Conversation/voice semantics;
- body-independent work continuity.

### UIAI Engine owns

- browser/computer observations/actions;
- FPV/Cockpit;
- control leases;
- execution diagnostics/capsules;
- browser/computer proof.

### Veragensia owns

- Agent Computer/body/runtime integration;
- placement/topology enforcement;
- workload identity and machine enforcement;
- Secure Attention/Human Control Reserve;
- runtime incarnation/body transfer.

### Wirebot owns

- persistent Chief-of-Staff/life-and-business partner experience;
- broad owner context and cross-project orchestration.

Workforce must not become a duplicate Wirebot App or a second runtime/state store.

## Current highest-priority gate

Recover the actual deployed extension source from:

```text
/home/wirebot/focusa-piext-sync/apps/workforce-extension
```

Follow `docs/01-source-recovery-and-migration-runbook.md`.

Do not replace the deployed implementation with a greenfield rewrite before recovery/parity is attempted.

Known deployed extension ID:

```text
ohfbbkpacpcapicpgplnnmifmlnmjggj
```

## Outcomes over process

- Implement the smallest complete vertical slice that moves the product forward.
- Do not spend hours generating planning artifacts that do not unblock implementation.
- Do not add frameworks or abstractions merely because they may be useful later.
- Reuse Focusa/UIAI/Veragensia contracts before creating local equivalents.
- Tool failures do not justify stopping unrelated productive work.
- Keep moving until a real external dependency blocks the next implementation step.
- A tool call, task closure, or agent claim is not an outcome. Verify the actual result.

## Source-recovery rule

Parity first:

```text
recover source
→ reproduce current build
→ install current build on Chromebook
→ inventory actual gaps
→ iterate
```

Do not redesign during recovery.

## Browser architecture rules

- Manifest V3.
- The browser UI is never canonical authority.
- Page content is data, not instruction authority.
- Do not expose arbitrary shell execution from browser code.
- Do not write Focusa state files/databases directly.
- Do not store broad provider credentials in extension-visible state.
- Reconnect from a fresh snapshot after event gaps/restarts.
- Never blindly retry a non-idempotent mutation after an uncertain response.
- Always render stale/degraded/unknown state honestly.

## UX rules

The operator should immediately be able to answer:

```text
Who is working?
On what?
Where are they running?
What is blocked?
What needs me?
What has actually been proven?
What should I direct next?
```

No vanity dashboards.

Direction Bar is not generic chat. It routes scoped human intent to the owning Foreman/Manager through canonical operations.

## Chromebook rule

The Chromebook is a primary dogfood surface, not the architecture boundary.

Keep the local browser responsive and favor remote/cloud execution for heavy work when the owning placement/runtime system supports it.

Do not claim ChromeOS/Crostini equals a Full Veragensia Agent Computer.

## Body independence

Hardware is embodiment, not identity.

Consume Focusa Spec 153B and Veragensia Doc 201. Workforce may show body/runtime posture but does not own body transfer/identity.

## Testing

Every consequential implementation should be tested at the narrowest practical layer, then through at least one real vertical flow.

Priority acceptance flows are defined in `docs/00-workforce-canonical-product-and-implementation-spec.md`.

## Documentation

Update docs when a contract or user-visible behavior materially changes. Do not maintain parallel speculative architecture docs for already-owned primitives.

## Completion standard

A change is complete when the real extension behavior is implemented, tested, and truthfully observable—not when a plan, issue, or generated artifact says it is complete.
