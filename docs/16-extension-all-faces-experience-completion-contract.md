# Focusa Workforce — All-Faces JJG Experience Completion Contract

**Status:** CURRENT cross-surface completeness authority  
**Applies to:** every user-visible face, entry, handoff and degraded state  
**Construction layout:** `docs/17-workforce-layout-atlas.md`  
**Rule:** no visible face may require downstream product-design or information-architecture improvisation.

## 1. JJG five-plane invariant

Focusa Workforce uses Jesse James Garrett's five planes as a completion test, not as five separate deliverables per screen.

```text
Strategy  → user needs + product objective
Scope     → required content/functions + exclusions
Structure → information architecture + interaction flows
Skeleton  → interface/navigation/information design
Surface   → visual/sensory system
```

Canonical authorities:

```text
Strategy  → docs/00 + docs/08 + docs/10
Scope     → docs/10 + this document's face inventory
Structure → docs/11 + binding decisions in this document
Skeleton  → docs/12 + docs/17
Surface   → docs/13 + docs/17
```

`docs/17` pins major geometry, region order, emphasis, responsive collapse order and state replacement. The builder owns implementation mechanics, not layout or IA invention.

If older wording in `docs/11` or `docs/12` presents several optional face/layout choices, the explicit closure decisions in this document and `docs/17` control.

---

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

---

## 3. Canonical face inventory and addressability

| Face | Canonical entry/address | Dominant job | Layout |
|---|---|---|---|
| Toolbar/action | extension icon / `Alt+Shift+F` | open current-context collaboration | docs/17 §2 |
| Side Panel | `sidepanel.html` | collaborate with current Workstream | docs/17 §3 |
| Private Start Page | Chrome new tab → `startpage.html` | rapid orientation and return | docs/17 §4 |
| Public Start Page | `startpage.html?public-work=1` | curated public understanding | docs/17 §5 |
| Full Workforce shell | `workforce.html#/overview` | deep operational environment | docs/17 §6 |
| Overview | `#/overview` | workforce-wide orientation | docs/17 §7 |
| Work index | `#/work` | browse governed Workstreams | docs/17 §8 |
| Work detail | `#/work/detail?env=<key>&ref=<typed-ref>` | operate exact Workstream | docs/17 §9 |
| People index | `#/people` | browse accountability/responsibility | docs/17 §10 |
| Person detail | `#/people/detail?env=<key>&ref=<typed-ref>` | inspect one accountable role/worker | docs/17 §10 |
| Needs You index | `#/needs-you` | owner/delegated-human attention queue | docs/17 §11 |
| Needs You detail | `#/needs-you/detail?env=<key>&ref=<typed-ref>` | make one source-owned human decision | docs/17 §11 |
| Evidence index | `#/evidence` | proof/closure inspection | docs/17 §12 |
| Evidence detail | `#/evidence/detail?env=<key>&ref=<typed-ref>` | inspect one claim/proof chain | docs/17 §12 |
| Topology | `#/topology` | understand execution placement | docs/17 §13 |
| Audit | `#/audit` | causal operational history | docs/17 §14 |
| Settings | `#/settings` | extension preferences | docs/17 §15 |
| Connections/Pairing | `#/settings?section=connections` | authorize/select environments | docs/17 §15 |
| Wall | `wall.html` / `Alt+Shift+W` | ambient organizational awareness | docs/17 §16 |
| Page-context flow | explicit capture/send from Side Panel or Full Workforce | bind current browser context to governed work | docs/17 §17 |
| Deep-link/handoff ingress | typed ref/handoff | land on exact context without rediscovery | docs/17 §18 |
| Degraded/recovery states | cross-cutting | preserve truth under uncertainty | docs/17 §19 |

`Needs You` is addressable but is **not** a primary navigation item. It opens from the header/context rail, Start Page, Side Panel, Overview and scoped Workstream contexts.

Connections remain a Settings section, not a new top-level route.

No additional top-level face is implied.

---

## 4. JJG closure matrix

A check means the decision is owned by the referenced blueprint; it does not imply a separate document for every cell.

| Face | Strategy | Scope | Structure | Skeleton | Surface/Layout |
|---|---|---|---|---|---|
| Toolbar/action | ✓ docs/16 §2 | ✓ docs/16 §3 | ✓ docs/11 + 16 | ✓ docs/17 §2 | ✓ Chrome + docs/13 |
| Side Panel | ✓ | ✓ docs/10/16 | ✓ docs/11 | ✓ docs/12 §2 | ✓ docs/13 §22 + 17 §3 |
| Private Start Page | ✓ | ✓ docs/10/16 | ✓ docs/11 §19 | ✓ docs/17 §4 | ✓ docs/13 + 17 §4 |
| Public Start Page | ✓ | ✓ docs/16 | ✓ public/private split | ✓ docs/17 §5 | ✓ docs/13 + 17 §5 |
| Full shell | ✓ | ✓ docs/10 | ✓ docs/11 §3–4 | ✓ docs/12 + 17 §6 | ✓ docs/13 + 17 §6 |
| Overview | ✓ | ✓ | ✓ docs/11 §8 | ✓ docs/12 §3 | ✓ docs/13 + 17 §7 |
| Work index | ✓ | ✓ | ✓ docs/11 §9.1 | ✓ docs/12 §4 | ✓ docs/13 + 17 §8 |
| Work detail | ✓ | ✓ | ✓ docs/11 §9–12 | ✓ docs/12 §5 | ✓ docs/13 + 17 §9 |
| People index/detail | ✓ | ✓ | ✓ docs/11 §15 | ✓ docs/12 §6–7 | ✓ docs/13 + 17 §10 |
| Needs You index/detail | ✓ | ✓ | ✓ docs/11 §13 + this doc | ✓ docs/12 §8 + 17 §11 | ✓ docs/13 + 17 §11 |
| Evidence index/detail | ✓ | ✓ | ✓ docs/11 §16 | ✓ docs/12 §9 | ✓ docs/13 + 17 §12 |
| Topology | ✓ | ✓ | ✓ docs/11 §17 | ✓ docs/12 §10 | ✓ docs/13 + 17 §13 |
| Audit | ✓ | ✓ | ✓ docs/11 §18 | ✓ docs/12 §11 | ✓ docs/13 + 17 §14 |
| Settings/Connections | ✓ | ✓ | ✓ docs/11 scope/recovery + this doc | ✓ docs/12 §12 + 17 §15 | ✓ docs/13 + 17 §15 |
| Wall | ✓ | ✓ docs/10/16 | ✓ docs/11 §20 | ✓ docs/17 §16 | ✓ docs/13 + 17 §16 |
| Page context | ✓ | ✓ docs/10 §14 | ✓ docs/11 §21 | ✓ docs/17 §17 | ✓ docs/13 + 17 §17 |
| Deep-link ingress | ✓ | ✓ | ✓ docs/11 §3/24/25 | ✓ docs/17 §18 | ✓ docs/13 + 17 §18 |
| Recovery/degraded | ✓ | ✓ | ✓ docs/11 §22–25 | ✓ docs/12 §13 + 17 §19 | ✓ docs/13 semantic states |

There are no `TBD` cells in the accepted current scope.

---

## 5. Binding closure decisions

These remove the remaining choices that were previously left open in lower-plane documents.

### 5.1 Needs You

```text
canonical list route    #/needs-you
canonical detail route  #/needs-you/detail?env=<key>&ref=<typed-ref>
primary nav item        no
entry                    header/context rail/Start Page/Side Panel/Overview/Work detail
```

On wide Full Workforce, the route may visually use the context-rail/drawer language from the design system, but URL/history/addressability remain canonical. A builder does not choose between "screen or drawer" semantics.

### 5.2 Connections

Connections live at:

```text
#/settings?section=connections
```

Unpaired entry may route directly there. Successful pairing continues to Workstream restoration/selection and then `#/overview`; it does not terminate on a success screen.

### 5.3 Page-context presentation

The container is fixed by origin:

```text
Side Panel      → full-height Side Panel subview below the product header; Back restores prior panel state
Full Workforce  → right-side context drawer, 420px target / 480px max; <900px becomes full-width sheet
```

It is never a modal dialog and never a new top-level route.

### 5.4 Work index

Use grouped **rows/list**, always. Do not switch to card mosaics for small Workstream counts.

### 5.5 Work detail responsibility view

Use the responsibility tree as the canonical `Working Now` representation. No list/tree toggle belongs to the current HLT.

### 5.6 Overview greeting

Do not add a time-of-day greeting. The page begins with `Workforce` / current operational context. This avoids decorative copy competing with Current Focus.

### 5.7 Voice affordance

Show a microphone control only when the canonical voice adapter is actually available and enabled for the current scope. Otherwise omit it entirely; do not render a dead placeholder.

### 5.8 Command palette / search shortcuts

A global command palette is not part of the current HLT. Do not add `Cmd/Ctrl+K` merely because an earlier Skeleton note called it optional.

`/` may focus the existing local search control on Work, People, Evidence or Audit list faces. It does not imply a new global-search product.

### 5.9 Side Panel Direction placement

Direction remains in normal document flow directly below Foreman. It is not sticky in the current design.

### 5.10 Topology ordering

Canonical group order:

```text
Interactive
Browser execution
Compute
Other bodies
```

This is the order used in both IA and layout.

---

## 6. Shared semantic hierarchy

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

---

## 7. Space-pressure law

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

---

## 8. State law

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

---

## 9. Handoff law

A face may hand off to another surface when depth or ownership changes, but must preserve exact context wherever possible.

```text
Start Page → exact Workstream
Side Panel → exact Full Workforce context
Workforce → exact UIAI execution
handoff return → same Workstream/object when still authorized
```

Navigation never carries reusable credentials or cached authority.

---

## 10. Responsive closure law

Responsive behavior is part of Skeleton/Surface completion, not implementation polish.

For every applicable face the blueprint owns:

```text
breakpoint/collapse behavior
stacking order
what compresses/disappears first
narrow-list transformation
short-height behavior where relevant
zoom/reflow behavior
long-content overflow behavior
drawer/sheet transformation
focus return across overlays
state placement after reflow
```

Canonical authority: `docs/17 §21`.

A builder may implement those rules with CSS Grid/Flex/container logic of its choice, but may not decide a different responsive hierarchy.

---

## 11. JJG completion test

A face is not complete until all five planes are resolved and a user can encounter materially applicable states without the implementation inventing:

```text
why the face exists
what belongs on it
how it is reached and left
where information lives
major region order
primary action
navigation behavior
column/stack hierarchy
responsive collapse order
visual emphasis
failure-state placement
handoff destination
```

The final test is:

> Can a competent builder implement every visible face without making a new user-experience, information-architecture, navigation, or foundational visual-design decision?

For the accepted current Workforce scope, the blueprint answer is **yes**. If implementation reality invalidates one of these decisions, update the owning blueprint deliberately rather than silently designing a different product during construction.
