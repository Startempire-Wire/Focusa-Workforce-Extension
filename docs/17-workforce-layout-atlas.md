# Focusa Workforce — Construction Layout Atlas

**Status:** CURRENT layout authority  
**Purpose:** remove layout invention from downstream implementation.  
**Use with:** `docs/11` Structure, `docs/12` Skeleton, `docs/13` Surface, `docs/16` all-faces coverage.  
**Rule:** preserve the geometry, hierarchy, collapse order and content priority below. Low-level CSS mechanics remain implementation discretion.

## 1. Global construction rules

```text
Desktop page max content width      1520px
Start Page max content width        1120px
Wall max content width              1600px
Full-page outer gutter              28px desktop / 24px tablet / 16px narrow
Primary section gap                 24px
Major section gap                   32px
Card gap                            12–16px
Standard card padding               16px
Major panel padding                 20–24px
```

Every screen has one visual answer to each question:

```text
Where am I?
What matters most?
What can I do next?
What needs me?
What can I trust?
```

Do not solve these with KPI grids. Use hierarchy, spacing and concise state.

### Shared priority order

When space becomes constrained, retain in this order:

```text
1. exact scope / current focus
2. human-required attention
3. primary action
4. current work / responsibility
5. verified state
6. secondary context
7. diagnostics / technical metadata
```

Diagnostics collapse first. Product truth never collapses behind machine trivia.

---

# 2. Chrome toolbar / keyboard entry

No popup UI.

```text
Toolbar click / Alt+Shift+F → Side Panel
Alt+Shift+W                 → Wall tab
Alt+Shift+K                 → Full Workforce tab
```

The destination itself owns all visual state. Entry never performs work.

---

# 3. Side Panel

## Target viewport

Designed first for **320–480px width** and variable browser height.

## Geometry

```text
┌──────────────────────────────┐
│ HEADER                 Fresh │  48–56px
│ Operator · Partner           │
├──────────────────────────────┤
│ PROJECT                      │
│ Workstream                ▾  │  52–64px
├──────────────────────────────┤
│ FOREMAN                      │
│ Name / accountable role     │
│ Objective                   │
│ Current frontier            │  104–132px
│ working · waiting · proof   │
├──────────────────────────────┤
│ Direct → Workstream/Foreman │
│ ┌──────────────────────────┐ │
│ │ Direct this Foreman…     │ │  52–140px
│ │                    mic ➜ │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ NEEDS YOU                 N │
│ item                        │
│ item                        │  variable; max 3
│ View all                    │
├──────────────────────────────┤
│ WORKING NOW                 │
│ role · work · state         │  max 5
│ role · work · state         │
├──────────────────────────────┤
│ VERIFIED RECENTLY           │
│ proof                       │  max 3
├──────────────────────────────┤
│ Open Workforce   Watch UIAI │  44–52px
└──────────────────────────────┘
```

Horizontal padding: 16px. Section separators may be whitespace or one subtle border; do not box every section.

### Height pressure

If viewport height is short:

```text
Direction + Needs You remain near top
Working Now stays available
Verified Recently compresses/collapses first
footer remains reachable, not necessarily sticky
```

No horizontal scrolling.

### Unpaired state

Replace everything below compact brand header with:

```text
Connect Focusa
Pair an environment to operate your workforce here.
[ Open pairing ]
```

Do not show empty workforce cards.

---

# 4. Private Start Page / Chrome new tab

## Product character

This is the calmest face in the extension. It should feel like **opening the door to a functioning organization**, not opening a monitoring dashboard.

No autofocus. No chat box. No raw endpoint. No dense nav.

## Desktop geometry — >= 900px

Container: max 1120px; centered. Top padding 48–64px.

```text
┌────────────────────────────────────────────────────────────────────┐
│ FOCUSA WORKFORCE                         ACME Private · ● Fresh     │  40px
│                                                                    │
│ CURRENT WORKSTREAM                                                 │  micro label
│ Login & Sessions                                                   │  28px title
│ Fix login regression and verify customer session behavior         │  max 2 lines
│ Customer testing · Foreman                                        │
│ Last verified: Login reproduced · 8m                              │
│                                                                    │
│ [ Continue ]    Needs You 2    Open Workforce                     │  40px actions
│                                                                    │
├─────────────────────────────────┬──────────────────────────────────┤
│ NEEDS YOU                       │ WORKING NOW                      │
│                                 │                                  │
│ Product truth                   │ Builder-2     Fixing login       │
│ Session behavior unclear        │ Verifier-1    Waiting            │
│                                 │ UIAI Chrome   Reproducing        │
│ UIAI authentication             │                                  │
│ Browser paused at MFA           │                                  │
│                                 │                                  │
│ Open Needs You →                │                                  │
├─────────────────────────────────┴──────────────────────────────────┤
│ VERIFIED RECENTLY                                                  │
│ ✓ Login reproduced        ✓ Focused regression tests              │
└────────────────────────────────────────────────────────────────────┘
```

### Grid

```text
Header                      1 column
Current Workstream hero     1 column
Summary region              2 columns: 1fr 1fr; gap 24px
Verified Recently           1 column
```

Hero and summary regions should be separated primarily by whitespace. Use at most one major enclosing surface around Current Workstream; the page must not become a stack of equally weighted cards.

### Content caps

```text
Needs You                   2 highest-value items + link
Working Now                 4 rows
Verified Recently           3 items
Objective                   max 2 lines
Foreman/frontier metadata   max 1 concise line each
```

### Primary action

`Continue` is the only filled/accent primary button.

`Needs You N` and `Open Workforce` are secondary/tertiary actions.

## Medium — 600–899px

Same hierarchy. Summary remains 2 columns when each can retain >=260px; otherwise stack.

## Narrow — <600px

```text
Brand + freshness
Current Workstream
[ Continue ]
Needs You N · Open Workforce
Needs You
Working Now
Verified Recently
```

All actions full-width only when necessary below ~420px.

## State replacements

### Unpaired

```text
FOCUSA WORKFORCE

Your workforce is not connected on this device.
Pair a Focusa environment to make this new tab your operating return point.

[ Pair Focusa ]
```

Centered vertically within upper 60% of viewport. No empty sections below.

### Connected, no Workstream

```text
ACME Private · Fresh

No Workstream selected
Choose the work you want this browser to return to.

[ Choose Workstream ]   Open Workforce
```

### No Needs You

Keep summary area balanced:

```text
NEEDS YOU
Nothing needs you right now.
Your workforce can continue without input.
```

Never use celebratory “all caught up” language if freshness is not confirmed.

### Stale

One full-width subtle warning above Current Workstream:

```text
Last confirmed 14m ago. Current work may have changed.   Refresh
```

Keep last-confirmed content visible. Navigation remains enabled. Consequential action is absent from Start Page anyway.

### Unavailable

Keep last-known orientation if present and label source unavailable. If no known state, show one honest unavailable panel + `Open Workforce`.

## Visual specifics

```text
Background         --bg-app
Hero title         Display 28/34/650
Workstream label   Micro uppercase
Objective          Body / text-secondary
Summary headings   Small or Micro semibold
Current hero       surface or mostly open canvas, not a marketing hero
Needs You accent   violet semantic edge/text only
Verified accent    quiet success/settled treatment
```

Build stamp/debug identity: footer/advanced meta only. Never next to the primary brand.

---

# 5. Public Start Page / public Work snapshot

Container: max 1120px; centered; 48–64px top padding.

```text
Brand                                      PUBLIC SNAPSHOT · date

Example mission / current focus
One-sentence explanation

WORKFORCE                     CURRENT WORK
roles / accountability        active example progression

PROOF
2–4 curated Evidence/verified examples

What Focusa Workforce is / safe public CTA if already owned
```

Never reuse authenticated controls. Never display private environment language such as “Needs You” as if actionable. A public item may explain that an operator intervention occurred, but cannot render the private action control.

Snapshot failure replaces the body with:

```text
Public snapshot unavailable
This demo could not load its curated checkpoint.
```

Never fall through to private mode.

---

# 6. Full Workforce shell

## Desktop — >=1180px

Viewport-filling application.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ HEADER  Operator · Environment / Project / Workstream       Fresh  │  56–64
├──────────────┬──────────────────────────────────────┬────────────────┤
│ NAV          │ MAIN                                 │ CONTEXT RAIL   │
│ 208–224px    │ minmax(0,1fr)                       │ 288–320px      │
│              │                                      │                │
│ Overview     │ route content                        │ Needs You      │
│ Work         │                                      │ Verified       │
│ People       │                                      │ source posture │
│ Evidence     │                                      │ contextual     │
│              │                                      │ only           │
│ Topology     │                                      │                │
│ Audit        │                                      │                │
│ Settings     │                                      │                │
└──────────────┴──────────────────────────────────────┴────────────────┘
```

Outer application has no arbitrary centered marketing-page max width; the MAIN region may constrain prose/detail sections internally.

## 860–1179px

```text
Header
64px icon/nav rail | Main
Context rail becomes drawer
```

## <860px

```text
Header
compact navigation trigger
Main single column
context / detail in drawers
```

No desktop three-column shell squeezed onto narrow screens.

---

# 7. Full Workforce — Overview

Desktop main content:

```text
┌──────────────────────────────────────┬──────────────────────────┐
│ CURRENT FOCUS                        │ NEEDS YOU                │
│ Workstream / objective / Foreman     │ top 3                    │
│ frontier / proof                     │                          │
│ [ Continue ]                         │                          │
├──────────────────────────────────────┼──────────────────────────┤
│ WORKING NOW                          │ VERIFIED RECENTLY        │
│ responsibility summary               │ proof summary            │
├──────────────────────────────────────┴──────────────────────────┤
│ WORKSTREAMS                                                     │
│ rows / grouped by Project                                      │
├─────────────────────────────────────────────────────────────────┤
│ CAPACITY / TOPOLOGY EXCEPTION — only when meaningful           │
└─────────────────────────────────────────────────────────────────┘
```

Main grid ratio ~1.6fr : 1fr. On <900px stack in the same order.

No generic dashboard metrics above Current Focus.

---

# 8. Full Workforce — Work index

```text
WORK                                   Search       Filters

Project A
┌──────────────────────────────────────────────────────────────┐
│ Workstream     Objective      Foreman   State   Needs You   │
│ ...                                                        │
└──────────────────────────────────────────────────────────────┘

Project B
...
```

Use list/rows rather than a mosaic of large cards when >4 Workstreams. Cards are acceptable for <=4 if density remains consistent.

No percent-complete unless the source owns a legitimate denominator.

---

# 9. Full Workforce — Work detail

This is the deepest primary operations face.

```text
┌──────────────────────────────────────────────────────────────────┐
│ Project / Workstream          Lifecycle · Fresh                  │
│ Objective                    Full Medium Short | H O T           │
├──────────────────────────────────────┬───────────────────────────┤
│ FOREMAN                              │ NEEDS YOU                 │
│ accountable role                    │ scoped attention          │
│ objective / frontier / proof        │                           │
├──────────────────────────────────────┴───────────────────────────┤
│ Direct → Workstream / Foreman                                   │
│ [ Direction composer....................................... ➜ ] │
├──────────────────────────────────────────────────────────────────┤
│ TRAJECTORY                                                      │
│ desired outcome → current → parallel → next → unresolved        │
├──────────────────────────────────────────────────────────────────┤
│ WORKING NOW                                                     │
│ responsibility tree                                             │
├──────────────────────────────────────┬───────────────────────────┤
│ EVIDENCE                              │ EXECUTION POSTURE         │
│ current-frontier proof                │ bodies / UIAI / exceptions│
└──────────────────────────────────────┴───────────────────────────┘
```

At <1100px the final two-column sections stack. Direction never disappears below the trajectory.

---

# 10. Full Workforce — People

## Index

```text
PEOPLE                       Workstream · State · Location filters

FOREMEN
person row

MANAGERS
person row

WORKERS / SPECIALISTS
person row

VERIFIERS
person row
```

Rows prioritize:

```text
identity/role | current responsibility | Workstream | state | last proof
```

Execution location is secondary.

## Detail

```text
Name / role / state                         Workstream
Current responsibility
Current work

ROLE & REPORTING            AUTHORITY / CAPABILITY

EXECUTION / BODY            RECENT EVIDENCE

Activity / Audit links
```

On narrow layouts, preserve Current responsibility first.

---

# 11. Full Workforce — Needs You

## Index/drawer

Max readable width 760–900px even when opened in full page.

```text
NEEDS YOU

NOW
Attention card
Attention card

SOON / EXPIRING
Attention card

SNOOZED
collapsed by default

RECENTLY RESOLVED
collapsed / secondary
```

## Detail

```text
What needs you
Why now
Context breadcrumb

Decision context / evidence
Consequence of each allowed action

Source state / freshness

[ secondary ]                         [ PRIMARY SOURCE ACTION ]
```

Do not bury action consequence below logs.

---

# 12. Full Workforce — Evidence

## Index

```text
EVIDENCE                       Workstream · State · Source filters

Needs verification
items

Recently verified
items

Settled
items

Stale / corrected
items
```

## Detail

Max readable width 1000px.

```text
Claim / outcome                           PROOF STATE
Verification summary

SUPPORTING EVIDENCE
artifacts / observations

PROVENANCE                 RELATED WORK / ACTOR

VERIFICATION HISTORY

SETTLEMENT / RECEIPT
CORRECTION / REVOCATION
ACCEPTED OUTCOME link if present
```

---

# 13. Full Workforce — Topology

```text
TOPOLOGY

INTERACTIVE
body cards

BROWSER EXECUTION
body cards

COMPUTE
body cards

OTHER BODIES
body cards
```

Body card is compact:

```text
friendly name
role in workforce
health · busy/available
current Workstreams
exception only when meaningful
```

Technical detail opens drawer. Do not put CPU/RAM at headline level unless resource pressure is the reason the user is here.

---

# 14. Full Workforce — Audit

```text
AUDIT              Workstream · Event class · Actor · Time filters

Today
12:43  Direction accepted      Foreman / Login & Sessions   Accepted
12:40  Human takeover returned UIAI Chrome                  Reconciled
12:34  Evidence verified       Verifier-1                   Verified
```

Single vertical causal timeline. Technical raw events are a secondary verbosity mode, not a parallel default table.

---

# 15. Full Workforce — Settings / Connections

## Settings

Readable content width 900–1040px.

```text
SETTINGS
Connections
Appearance
Notifications
Browser & context permissions
Public demo / local behavior
Advanced / debug
```

Each section is a simple settings group, not a card dashboard.

## Connections / pairing

Desktop >=1000px:

```text
┌───────────────────────────────┬───────────────────────────────┐
│ YOUR ENVIRONMENTS             │ PAIR FOCUSA                  │
│ ACME Private        Fresh     │ Environment label            │
│ Local Dev           Offline   │ Focusa address               │
│                               │ [ Start pairing ]            │
│                               │                               │
│                               │ when pending:                 │
│                               │ PAIRING CODE                  │
│                               │ 4H7K-2P                       │
│                               │ Approve in Focusa             │
│                               │ [ Check again ] [ Cancel ]   │
└───────────────────────────────┴───────────────────────────────┘
```

Ratio ~1fr : 1fr. At <900px stack environments first, pairing second.

On successful pairing: select environment, refresh source, and route toward Workstream selection/Overview. Do not leave a static success card as the endpoint.

---

# 16. Wall

## Target

Dedicated tab/window, frequently visible from distance. Read only.

Desktop container max 1600px; 32–40px gutters.

```text
┌──────────────────────────────────────────────────────────────────┐
│ ACME · Focusa Workforce                                  ● Fresh│
├──────────────────────────────────────────────────────────────────┤
│ CURRENT FOCUS                                                     │
│ Login & Sessions                                                  │
│ Fix login regression first                                       │
│ Customer testing · Foreman                                       │
├─────────────────────────┬─────────────────────┬───────────────────┤
│ WORKING NOW             │ NEEDS YOU           │ VERIFIED RECENTLY │
│ 3 working               │ 2                   │ Login reproduced  │
│ Builder-2 · Fixing      │ Product truth       │ Tests verified    │
│ Verifier-1 · Waiting    │ UIAI auth           │                   │
├─────────────────────────┴─────────────────────┴───────────────────┤
│ EXCEPTION only if material: browser auth / capacity / outage      │
└──────────────────────────────────────────────────────────────────┘
```

Use larger type than Full Workforce:

```text
Current focus title       28–32px
Primary row titles        16–18px
Secondary                 13–15px
```

No tiny technical metadata. No scrolling log. If content overflows, summarize and hand off to Full Workforce.

At <900px: Current Focus → Needs You → Working Now → Verified; one column.

---

# 17. Page-context / orientation flow

This is an explicit transient face, preferably drawer/sheet inside Side Panel or Full Workforce.

```text
PAGE CONTEXT
<page title>
<origin hostname>
selected text summary if explicitly captured

Send to
Project / Workstream
Foreman

Choose intent
Ask Foreman about this page
Send page to Workstream
Create work from selection
Capture Evidence candidate
Open in UIAI

[ Cancel ]                              [ Continue ]
```

Only intents backed by owning operations are shown. No silent broad page capture.

If target scope becomes stale, replace the action area with scope revalidation/selection; never guess another Workstream.

---

# 18. Deep-link / handoff ingress

When an external/internal handoff opens Workforce:

```text
1. render shell immediately
2. show destination object skeleton
3. resolve environment + typed ref
4. revalidate scope/authority/freshness
5. render exact object
6. enable action only after current authorization
```

If ambiguous:

```text
Choose destination
<two or more exact candidates>
```

If revoked/forbidden:

```text
This handoff no longer grants access to this context.
[ Return ] [ Open Workforce ]
```

No credential is transported in the visible URL.

---

# 19. Cross-face degraded-state geometry

Do not redesign each screen for failures. Use these replacements consistently.

### Stale
One banner directly below the surface header; retain last-confirmed content.

### Reconciling
Inline state next to the affected object/action. Avoid blocking the entire application unless scope itself is unresolved.

### Forbidden
Replace only the protected content/action region when the rest of the surface remains valid.

### Incompatible
Show the unsupported source/schema in the affected region + route to Connections/diagnostics. No mutation.

### Unavailable
Retain last-known content if safe, label unavailable, offer Refresh/Open source where useful.

### Ready-empty
Use concise empty statement + one useful next action. Empty is never used when reading failed.

---

# 20. Layout acceptance invariant

The downstream builder may choose CSS Grid/Flex details, component boundaries and DOM implementation, but MUST NOT invent:

```text
primary region order
major column structure
relative emphasis
primary action placement
collapse/stack order
what disappears first under space pressure
which state replaces which region
which face owns which level of detail
```

If implementation constraints make one of those impossible, change this atlas deliberately rather than silently improvising a different product.