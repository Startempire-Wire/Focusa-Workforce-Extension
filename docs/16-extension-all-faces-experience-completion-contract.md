# Focusa Workforce — All-Faces Experience Completion Contract

**Status:** CURRENT cross-surface completeness authority  
**Applies to:** every user-visible face, entry, handoff and degraded state  
**Construction layout:** `docs/17-workforce-layout-atlas.md`  
**Rule:** no visible face may require downstream product-design improvisation.

## 1. Five-plane invariant

Every applicable face is resolved through:

```text
Strategy  → docs/00 + docs/08 + docs/10
Scope     → docs/10
Structure → docs/11
Skeleton  → docs/12
Surface   → docs/13
Layout    → docs/17
```

`docs/17` pins major geometry, region order, emphasis, responsive collapse order and state replacement. The builder owns implementation mechanics, not layout invention.

## 2. Product law

```text
Start Page   = orient me
Side Panel   = work with the current Workstream now
Full page    = operate and inspect deeply
Wall         = understand the room at a glance
Public page  = understand the product without private access
```

One face, one dominant job. Do not clone the same dashboard into different sizes.

Global quality target:

```text
Optimal    least friction for the face's job
Beautiful  calm, premium, intentional
Logical    obvious hierarchy and next action
Succinct   only information that earns its place
```

## 3. Canonical face inventory

| Face | Entry | Dominant job | Detailed layout |
|---|---|---|---|
| Toolbar/action | extension icon / `Alt+Shift+F` | open current-context collaboration | docs/17 §2 |
| Side Panel | `sidepanel.html` | collaborate with current Workstream | docs/17 §3 |
| Private Start Page | Chrome new tab | rapid orientation and return | docs/17 §4 |
| Public Start Page | `?public-work=1` | curated public understanding | docs/17 §5 |
| Full Workforce shell | `workforce.html` | deep operational environment | docs/17 §6 |
| Overview | `#/overview` | workforce-wide orientation | docs/17 §7 |
| Work index | `#/work` | browse governed Workstreams | docs/17 §8 |
| Work detail | `#/work/detail` | operate exact Workstream | docs/17 §9 |
| People index/detail | `#/people*` | accountability/responsibility | docs/17 §10 |
| Needs You | contextual/global | human-value attention | docs/17 §11 |
| Evidence | `#/evidence*` | proof/closure inspection | docs/17 §12 |
| Topology | `#/topology` | understand execution placement | docs/17 §13 |
| Audit | `#/audit` | causal operational history | docs/17 §14 |
| Settings | `#/settings` | extension preferences/connections | docs/17 §15 |
| Pairing/Connections | Full Workforce settings/pre-op | authorize usable environments | docs/17 §15 |
| Wall | `wall.html` / `Alt+Shift+W` | ambient organizational awareness | docs/17 §16 |
| Page-context flow | explicit capture/send | bind current browser context to governed work | docs/17 §17 |
| Deep-link/handoff ingress | typed ref/handoff | land on exact context without rediscovery | docs/17 §18 |
| Degraded/recovery states | cross-cutting | preserve truth under uncertainty | docs/17 §19 |

No additional top-level face is implied.

## 4. Shared semantic hierarchy

Where applicable, present information in this order:

```text
Operator / environment
Project / Workstream
Foreman / accountable role
current work / human attention / proof
execution detail
technical refs on demand
```

Never lead with daemon URLs, model/provider names, session IDs or internal references.

Keep distinct:

```text
Fresh / stale / unavailable / incompatible / reconciling
Working / waiting / blocked / Needs You / offline
Claimed / observed / supported / verified / settled / stale
Full / Medium / Short trajectory
Human / Operations / Technical presentation depth
```

## 5. Space-pressure law

When space is limited, retain in this order:

```text
1 exact scope/current focus
2 human-required attention
3 primary action
4 current responsibility/work
5 verified state
6 secondary context
7 diagnostics/technical metadata
```

Diagnostics collapse first. Product truth never collapses behind machine trivia.

## 6. State law

Every applicable face distinguishes:

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

`Empty` means the source confirmed no items. Failed/unavailable reads are never rendered as empty.

Use `docs/17 §19` for placement of these states.

## 7. Handoff law

A face may hand off to another surface when depth or ownership changes, but must preserve exact context wherever possible.

```text
Start Page → exact Workstream
Side Panel → exact Full Workforce context
Workforce → exact UIAI execution
handoff return → same Workstream/object when still authorized
```

Navigation never carries reusable credentials or cached authority.

## 8. Implementation completion test

A face is not complete until a user can encounter all materially applicable states without the implementation inventing:

```text
why the face exists
what belongs on it
major region order
primary action
column/stack hierarchy
responsive collapse order
visual emphasis
failure-state placement
handoff destination
```

If a real implementation constraint invalidates one of those decisions, update the owning blueprint deliberately. Do not silently design a different product during construction.