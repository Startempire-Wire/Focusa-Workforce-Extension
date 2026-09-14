# Focusa Workforce — Chromebook Install, Pairing, and Dogfood Runbook

**Target:** ChromeOS Chromebook used as a daily Focusa Workforce operations surface.  
**Goal:** install the real recovered extension immediately, pair it to a private Focusa environment, and use the Chromebook as a responsive workforce surface while heavyweight execution may run elsewhere.

---

## 0. Deployment profile

This runbook defines a **Chromebook Workforce profile**, not a Full Veragensia Agent Computer.

```text
ChromeOS
  |
  +-- Chrome / Chromium
  |     +-- Focusa Workforce extension
  |     +-- side panel
  |     +-- full Workforce page
  |     +-- optional start/new-tab page
  |
  +-- Crostini (optional but recommended)
        +-- Focusa CLI / daemon client
        +-- Pi reference harness
        +-- local bridge / telemetry
        +-- Tailscale/SSH tooling where configured

Remote/private environment
  +-- Focusa daemon(s)
  +-- agents / Silent Sessions
  +-- cloud Agent Computers / workcells
  +-- UIAI Engine
```

The Chromebook remains the human interaction surface even when heavy work executes remotely.

---

## 1. Build artifact required

After source recovery, CI/local build must produce a deterministic unpacked directory:

```text
dist/
```

and preferably a packaged release artifact:

```text
focusa-workforce-<version>.zip
SHA256SUMS
build-metadata.json
```

The manifest must be Manifest V3 compatible with the intended Chrome/Chromium version.

---

## 2. Immediate developer install

For rapid dogfood before store/distribution packaging:

1. Build the extension from the canonical repo.
2. Open Chrome extension management.
3. Enable Developer mode.
4. Choose **Load unpacked**.
5. Select the built `dist/` directory.
6. Pin Focusa Workforce to the toolbar if desired.
7. Open the extension and verify the version/build identifier.

Do not load an unknown copied `dist/` without matching source/provenance.

### Update during development

After rebuilding:

1. open extension management;
2. press reload on Focusa Workforce;
3. reopen side panel/full page if necessary;
4. verify the displayed build/revision changed;
5. confirm pairing/event reconnection without duplicate mutations.

---

## 3. Pairing a private Focusa environment

The first useful screen should be pairing, not an empty dashboard.

### Required flow

```text
Workforce opens
→ no paired daemon
→ Add Focusa environment
→ endpoint / discovery
→ pairing initiation
→ explicit device enrollment
→ scoped credential established
→ capability/version negotiation
→ initial snapshot
→ event stream connected
→ Workstream/Foreman view available
```

Pairing should clearly distinguish:

```text
This Chromebook / local
Private server
Cloud Agent Computer
Public demo
```

Public-demo identity/credentials must never be silently reused for private pairing.

---

## 4. Pairing acceptance checks

After pairing, verify:

- environment name/node identity is correct;
- auth state survives browser restart where intended;
- revocation invalidates the extension promptly;
- Focusa version/capability compatibility is visible;
- initial snapshot loads;
- event stream updates without polling spam;
- stale/disconnected posture is visible;
- the extension does not infer project scope solely from browser tab/folder/window state;
- current Workstream and Foreman are explicit.

---

## 5. Local Crostini bridge

Where useful, a small local bridge may expose only browser-safe, typed capabilities from Crostini.

Candidate capabilities:

```text
local Focusa health
Pi availability
local repository/project presence
resource posture
open local terminal/project
Tailscale/private endpoint discovery
```

The bridge must not become a generic arbitrary-shell endpoint.

Preferred transport where ChromeOS native messaging into Crostini is unavailable/unreliable:

```text
loopback-only authenticated HTTPS/WebSocket bridge
```

Requirements:

- bind loopback only;
- random/scoped authentication token or paired session;
- strict operation allowlist;
- origin validation;
- bounded request/response sizes;
- no raw shell command method;
- no ambient home-directory read API;
- no daemon database mutation.

---

## 6. Chromebook resource posture

Workforce should keep the Chromebook responsive.

Recommended local placement:

```text
Workforce UI
voice capture/transcription client where practical
Focusa/Pi interaction shell
light telemetry
normal browsing
```

Recommended remote placement:

```text
large builds/tests
multi-agent fanout
browser fleets
indexing
containers
large-memory workloads
long-running autonomous work
```

Projected resource posture should make this visible rather than surprising.

---

## 7. Tailscale/private networking

Where a private Focusa daemon or Agent Computer is reachable through Tailscale:

- use the private hostname/address exposed by the configured environment;
- do not expose raw daemon ports publicly merely for extension convenience;
- preserve Focusa pairing/auth even when transport itself is private;
- network reachability is not authorization.

The extension should not need to understand Tailscale internals beyond reaching the approved endpoint.

---

## 8. UIAI handoff

For an active browser/computer task:

```text
Workforce task/worker
→ Open execution
→ exact UIAI context / Cockpit
→ inspect / intervene / takeover
→ return/reconcile
→ Workforce status/evidence refresh
```

Do not open a generic UIAI homepage when an exact execution context exists.

---

## 9. Voice dogfood

Initial Chromebook voice slice:

1. operator invokes voice/PTT;
2. visible listening state;
3. transcript streams into Direction Bar;
4. operator may correct transcript;
5. exact Workstream/Foreman scope visible;
6. submit through normal Direction operation;
7. resulting work/event/evidence appears normally.

No separate voice command authority path.

---

## 10. Daily dogfood checklist

Each day, prove at least one complete loop:

```text
open Workforce
→ orient
→ direct exact Foreman
→ worker executes
→ inspect progress
→ intervene/approve if needed
→ inspect Evidence
→ verify outcome
→ close/reopen browser
→ continuity remains correct
```

Also record:

- extension memory footprint;
- ChromeOS/Crostini pressure incidents;
- reconnect defects;
- stale-state defects;
- scope confusion;
- duplicate dispatches;
- UIAI handoff failures;
- approval/evidence ambiguity;
- voice friction.

Dogfood findings should become issues/tasks, not undocumented local fixes.

---

## 11. Failure behavior

### Focusa unavailable

Show stale cached projection and reconnect controls. Do not queue arbitrary mutations.

### Network unavailable

Remain useful for bounded cached inspection. Mark all remote state stale.

### Crostini unavailable

Remote paired Focusa environments should still work if independently reachable.

### UIAI unavailable

Workforce remains usable for non-UIAI work; exact execution surface shows unavailable/degraded.

### Browser restart

Rehydrate paired metadata, obtain fresh snapshot, resume event stream, and never replay uncertain mutations solely to reconstruct UI.

---

## 12. Release-channel progression

Recommended channels:

```text
local-dev
→ private-dogfood
→ demo
→ customer-preview
→ stable
```

The Chromebook should initially follow `private-dogfood`, allowing rapid iteration while keeping public demo/customer channels separately controlled.

---

## 13. Immediate acceptance

The Chromebook slice is useful when the operator can:

1. install the real canonical extension;
2. pair a private Focusa environment;
3. see exact Workstream + Foreman + workforce state;
4. issue one real direction;
5. observe worker progress;
6. inspect one real Evidence/Receipt result;
7. open an exact UIAI execution when applicable;
8. close/reopen Chrome without losing durable continuity;
9. keep the Chromebook responsive while heavy execution runs remotely.
