# Focusa Workforce — Canonical Information Architecture Map

**Status:** CURRENT single-map authority for extension navigation and screen relationships  
**Purpose:** let humans and downstream builders understand the entire Workforce extension at a glance without reconstructing the IA from multiple documents.  
**Depends on:** `docs/10`, `docs/11`, `docs/12`, `docs/13`, `docs/16`, `docs/17`  
**Rule:** this map summarizes the accepted IA. If a conflict appears, `docs/16` closure decisions and the owning JJG-plane document control.

---

# 1. Product map in one view

```text
CHROME / BROWSER
│
├─ Toolbar action / Alt+Shift+F
│   └─ SIDE PANEL
│       ├─ Environment / freshness
│       ├─ Project / Workstream
│       ├─ Foreman
│       ├─ Direction
│       ├─ Needs You
│       ├─ Working Now
│       ├─ Verified Recently
│       ├─ Open Workforce ───────────────────────────────┐
│       ├─ Watch UIAI ───────────────────────────────┐   │
│       └─ Page Context subview                      │   │
│                                                   │   │
├─ Chrome New Tab                                   │   │
│   └─ PRIVATE START PAGE                           │   │
│       ├─ Current Workstream                       │   │
│       ├─ Continue ────────────────────────────────┼───┤
│       ├─ Needs You ───────────────────────────────┼───┤
│       ├─ Working Now                              │   │
│       ├─ Verified Recently                        │   │
│       └─ Open Workforce ──────────────────────────┼───┤
│                                                   │   │
├─ Public snapshot                                  │   │
│   └─ PUBLIC START PAGE                            │   │
│       ├─ Example mission                          │   │
│       ├─ Example workforce                        │   │
│       ├─ Example current work                     │   │
│       └─ Example proof                            │   │
│                                                   │   │
├─ Alt+Shift+W                                      │   │
│   └─ WALL                                         │   │
│       ├─ Current Focus                            │   │
│       ├─ Working Now                              │   │
│       ├─ Needs You                                │   │
│       ├─ Verified Recently                        │   │
│       └─ explicit item → Full Workforce ──────────┼───┤
│                                                   │   │
└─ Alt+Shift+K / direct extension URL               │   │
    └─ FULL WORKFORCE ◄─────────────────────────────┘   │
        │                                               │
        ├─ Overview                                     │
        │   ├─ Current Focus                            │
        │   ├─ Needs You                                │
        │   ├─ Working Now                              │
        │   ├─ Verified Recently                        │
        │   └─ Workstreams                              │
        │                                               │
        ├─ Work                                         │
        │   ├─ Work index                               │
        │   └─ Work detail                              │
        │       ├─ Foreman                              │
        │       ├─ Needs You                            │
        │       ├─ Direction                            │
        │       ├─ Trajectory                           │
        │       ├─ Working Now                          │
        │       ├─ Evidence                             │
        │       └─ Execution posture ───────────────┐   │
        │                                           │   │
        ├─ People                                   │   │
        │   ├─ People index                         │   │
        │   └─ Person detail                        │   │
        │                                           │   │
        ├─ Evidence                                 │   │
        │   ├─ Evidence index                       │   │
        │   └─ Evidence detail                      │   │
        │                                           │   │
        ├─ Topology                                 │   │
        │                                           │   │
        ├─ Audit                                    │   │
        │                                           │   │
        ├─ Settings                                 │   │
        │   └─ Connections / Pairing                │   │
        │                                           │   │
        └─ Needs You                                │   │
            ├─ Needs You index                      │   │
            └─ Needs You detail                     │   │
                                                    │   │
SPECIALIST / OWNED SURFACES                          │   │
│                                                   │   │
├─ UIAI exact execution / takeover ◄────────────────┘   │
│   └─ return → same Workforce Workstream/object ───────┘
│
└─ Other typed cross-product handoffs
    └─ return → exact originating Workforce context where still authorized
```

---

# 2. Top-level product faces

```text
START PAGE      = orient me
SIDE PANEL      = work with the current Workstream now
FULL WORKFORCE  = operate and inspect deeply
WALL            = understand the room at a glance
PUBLIC PAGE     = understand the product without private access
```

These are not responsive variants of one dashboard. Each has a distinct job.

---

# 3. Full Workforce navigation tree

```text
workforce.html
│
├─ #/overview
│
├─ #/work
│   └─ #/work/detail?env=<key>&ref=<typed-ref>
│
├─ #/people
│   └─ #/people/detail?env=<key>&ref=<typed-ref>
│
├─ #/evidence
│   └─ #/evidence/detail?env=<key>&ref=<typed-ref>
│
├─ #/topology
│
├─ #/audit
│
└─ #/settings
    └─ #/settings?section=connections

Addressable contextual route, not primary nav:

#/needs-you
└─ #/needs-you/detail?env=<key>&ref=<typed-ref>
```

Primary navigation order:

```text
Overview
Work
People
Evidence

Topology
Audit
Settings
```

`Needs You` is globally reachable but intentionally not a primary-nav destination. It enters from the places where human attention matters.

---

# 4. Global shell anatomy

Desktop:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Operator / Partner    Project / Workstream breadcrumb      Fresh  │
├──────────────┬────────────────────────────────────┬─────────────────┤
│ PRIMARY NAV  │ MAIN                               │ CONTEXT RAIL    │
│              │                                    │                 │
│ Overview     │ route-specific content             │ Needs You       │
│ Work         │                                    │ Verified        │
│ People       │                                    │ Source posture  │
│ Evidence     │                                    │                 │
│              │                                    │                 │
│ Topology     │                                    │                 │
│ Audit        │                                    │                 │
│ Settings     │                                    │                 │
└──────────────┴────────────────────────────────────┴─────────────────┘
```

Responsive:

```text
>=1180px  full nav + main + context rail
860–1179  compact nav rail + main; context becomes drawer
<860px    compact header/navigation + single-column main; detail/context in drawers/sheets
```

---

# 5. Screen-to-screen task flows

## A. Return and continue

```text
New Tab
→ Start Page
→ Current Workstream
→ Continue
→ Full Workforce / exact Work detail
```

## B. Quick browser collaboration

```text
Toolbar / Alt+Shift+F
→ Side Panel
→ exact Workstream
→ Direction
→ source result
→ updated Workstream projection
```

## C. Human attention

```text
Start Page / Side Panel / Overview / Work detail / context rail
→ Needs You item
→ #/needs-you/detail
→ refresh source state
→ source-owned action
→ reconcile
→ return to originating context
```

## D. UIAI takeover

```text
Needs You
→ exact UIAI context
→ human control
→ return control
→ UIAI re-observes/reconciles
→ Focusa continuation eligible
→ Workforce returns to same Workstream/object
```

## E. Verify work

```text
Work detail / Verified Recently
→ Evidence detail
→ claim
→ supporting evidence
→ verification
→ settlement / Receipt
→ accepted outcome ref where present
```

## F. Page context

```text
Current browser page
→ explicit Page Context action
→ current page/selection summary
→ exact Workstream + Foreman
→ choose admitted intent
→ owning operation
→ result
```

Presentation container:

```text
Side Panel origin      → Side Panel subview
Full Workforce origin  → 420px right drawer; <900px full-width sheet
```

## G. Environment recovery

```text
connection unavailable/stale
→ preserve safe last-confirmed orientation
→ reconnect
→ authenticate
→ restore exact environment
→ restore valid Workstream
→ reconcile pending ambiguity
→ enable mutation only when current authority is confirmed
```

---

# 6. Screen information hierarchy

## Start Page

```text
1 Current Workstream
2 Continue
3 Needs You
4 Working Now
5 Verified Recently
6 Open Workforce
```

## Side Panel

```text
1 Environment / freshness
2 Project / Workstream
3 Foreman / objective / frontier
4 Direction
5 Needs You
6 Working Now
7 Verified Recently
8 Full Workforce / UIAI handoff
```

## Overview

```text
1 Current Focus
2 Needs You
3 Working Now
4 Verified Recently
5 Workstreams
6 Capacity/topology exception only when meaningful
```

## Work detail

```text
1 Project / Workstream / objective / lifecycle / freshness
2 Foreman + scoped Needs You
3 Direction
4 Trajectory
5 Working Now
6 Evidence
7 Execution posture
```

## People

```text
Foremen
→ Managers
→ Workers / Specialists
→ Verifiers
```

Person detail:

```text
Identity / role
→ Current responsibility
→ Workstream relationship
→ Current work
→ Authority/capability
→ Execution/body
→ Evidence
→ Audit/history
```

## Evidence

```text
Needs verification
→ Recently verified
→ Settled
→ Stale/corrected
```

Evidence detail:

```text
Claim/outcome
→ Proof state
→ Supporting evidence
→ Provenance
→ Related work/actor
→ Verification history
→ Settlement/Receipt
→ Corrections/revocations
→ Accepted outcome ref
```

## Topology

```text
Interactive
→ Browser execution
→ Compute
→ Other bodies
```

## Audit

```text
meaningful causal event
→ actor
→ Workstream/context
→ result/proof cue
→ technical detail only on demand
```

---

# 7. Global state overlay

Every applicable face uses the same state model:

```text
loading
ready-empty
ready
stale
partial/degraded
unauthenticated
forbidden
unsupported/incompatible
unavailable
reconciling
```

Placement rules:

```text
Stale        banner below surface header; keep last-confirmed state
Reconciling  inline at affected object/action
Forbidden    replace only protected region when possible
Incompatible affected region + route to diagnostics/connections
Unavailable  keep safe last-known state where possible
Empty        only when source positively confirms no items
```

---

# 8. Cross-face context model

Canonical scope:

```text
Environment
→ Project
→ Workstream
→ Foreman / work / actor / Evidence object
```

A route never silently changes canonical Focusa scope.

Context transport may carry:

```text
env
ref
intent
return
```

It never carries reusable authority credentials.

---

# 9. JJG plane map

```text
STRATEGY
Why Workforce exists; user/operator needs; product objectives
→ docs/00 + docs/08 + docs/10

SCOPE
What functions/content each face admits or excludes
→ docs/10 + docs/16

STRUCTURE
Information architecture, routes, stateflows, cross-surface navigation, returns
→ docs/11 + docs/16 + this map

SKELETON
Exact screen anatomy, component hierarchy, controls, responsive behavior
→ docs/12 + docs/17

SURFACE
Typography, color, spacing, semantic styling, density, motion, reference compositions
→ docs/13 + docs/17
```

This document does not replace those authorities; it shows how they fit into one coherent product.

---

# 10. Builder boundary

The downstream builder may decide:

```text
component/file boundaries
CSS Grid vs Flex implementation
state/store organization
internal function names
adapter mechanics
ordinary refactors
performance fixes
focused test organization
```

The builder does not decide:

```text
what screens exist
route hierarchy
screen-vs-drawer semantics
primary navigation
information hierarchy
major region order
primary action placement
responsive collapse order
what each face is for
handoff destinations
failure-state meaning/placement
visual semantics
```

If a real upstream contract makes this IA impossible, change the blueprint deliberately. Do not silently improvise a different product.
