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

## Current state: source recovered, redesign unlocked

The migration is complete. This repository is now the authoritative Workforce source.

Recovered provenance and cutover proof live in `docs/migration/parity-report.md`. The pre-redesign reference point is preserved on:

```text
baseline/pre-redesign-2026-09-15
```

Known Veragensia extension ID:

```text
ohfbbkpacpcapicpgplnnmifmlnmjggj
```

Do **not** resume Workforce development in the old Focusa monorepo worktree at:

```text
/home/wirebot/focusa-piext-sync/apps/workforce-extension
```

That tree is provenance/rollback material only.

## Build-agent operating environment

The primary implementation agent may be running partly on the Chromebook and partly on cloud/server infrastructure. Treat these as one development topology, not competing sources of truth.

Canonical paths and flows:

```text
GitHub
Startempire-Wire/Focusa-Workforce-Extension
        |
        +--> Chromebook checkout (daily dogfood / UI work)
        |      ~/src/focusa-workforce-extension
        |      ~/.local/bin/wfx -> repo/scripts/wfx-deploy
        |
        +--> cloud/self-hosted CI runner (test/build)
        |
        +--> kh/OVH checkout
               /home/wirebot/focusa-workforce-extension
               |
               +--> Veragensia uiai-lab-push
                       |
                       +--> https://os.focusa.dev
```

The repo is authoritative. Local/browser profiles, tokens, credentials, public-work snapshots and operator state remain outside Git.

### Daily commands

```text
wfx test
wfx build
wfx brave | wfx chrome
wfx gh
wfx veragensia
```

`wfx gh` pushes code and triggers CI. It does **not** make the public demo live.

`wfx veragensia` is the explicit live-promotion boundary. It requires the cloud checkout to match the exact local HEAD and then invokes Veragensia's staged/checksummed/atomic/rollback-protected deployment pipeline.

Do not bypass this with ad-hoc copies into the live extension directory.

## Redesign rule

The product redesign may now proceed. Do not rewrite the proven integration core merely to adopt a new UI framework.

Preserve unless a concrete contract change requires otherwise:

- pairing and exact-origin permission flow;
- canonical API/schema validation;
- projection boundaries;
- SSE replay/cursor semantics;
- exact session/run/generation targeting;
- idempotency and approval binding;
- safe session preflight;
- public/private Work separation;
- least-privilege MV3 manifest behavior;
- explicit Veragensia promotion/rollback.

Prefer changing presentation and shared-client architecture around these primitives rather than replacing them.

Read `docs/07-pre-redesign-baseline-and-agent-handoff.md` before substantial redesign work.

## Outcomes over process

- Implement the smallest complete vertical slice that moves the product forward.
- Do not spend hours generating planning artifacts that do not unblock implementation.
- Do not add frameworks or abstractions merely because they may be useful later.
- Reuse Focusa/UIAI/Veragensia contracts before creating local equivalents.
- Tool failures do not justify stopping unrelated productive work.
- Keep moving until a real external dependency blocks the next implementation step.
- A tool call, task closure, or agent claim is not an outcome. Verify the actual result.

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

UI tests must test integration assumptions, not merely search for identifier strings. When a page imports a runtime primitive, tests should catch a missing import or duplicate bootstrap/binding path.

## Documentation

Update docs when a contract or user-visible behavior materially changes. Do not maintain parallel speculative architecture docs for already-owned primitives.

## Completion standard

A change is complete when the real extension behavior is implemented, tested, and truthfully observable—not when a plan, issue, or generated artifact says it is complete.
