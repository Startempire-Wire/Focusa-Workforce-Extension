# Focusa Workforce — Visual System and Reference Surfaces

**Status:** CURRENT Surface-plane authority  
**Depends on:** `12-workforce-screen-and-component-contract.md`  
**Design direction:** light-first, premium operational UI, “expensive calm”  
**Rule:** visual polish must clarify scope, responsibility, attention, proof and freshness; never decorate uncertainty into confidence.

---

## 1. Visual character

The product should feel:

```text
calm
precise
credible
modern
quietly powerful
human-operable
```

Avoid:

```text
neon AI aesthetic
gamer dashboard
terminal cosplay
robot cartoons
giant KPI tiles
gradient-heavy marketing UI
glassmorphism as default surface
constant animation
```

Reference quality: Google-clean information restraint + Linear-grade operational density, without copying either product.

---

## 2. Theme decision

### Primary shipped theme

**Light theme is the canonical redesign reference.**

Dark theme may be implemented after the light token system is correct; it must map the same semantic tokens rather than create a different visual language.

Browser/OS `prefers-color-scheme` may select dark only when the dark token set is complete. Until then use light consistently rather than ship an incomplete dark theme.

---

## 3. Typography

### Font stack

No remote font dependency.

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

If Inter is bundled locally by the build system, use it. Otherwise the system stack is accepted and must not block implementation.

### Type scale

```text
Display       28px / 34px / 650
Page title    24px / 30px / 650
Section       17px / 24px / 650
Card title    15px / 22px / 600
Body          14px / 21px / 450
Body strong   14px / 21px / 600
Small         12px / 18px / 500
Micro         11px / 16px / 600
```

Use tabular numerals for timestamps/counts where supported.

Uppercase is limited to short micro labels such as `FOREMAN`, `NEEDS YOU`, `VERIFIED`; letter-spacing `0.06em`.

Do not use all-caps for buttons, navigation or paragraphs.

---

## 4. Core color tokens — light

```text
--bg-app:             #F7F8FA
--bg-surface:         #FFFFFF
--bg-subtle:          #F2F4F7
--bg-hover:           #EEF1F5
--bg-selected:        #EAF2FF

--text-primary:       #17191C
--text-secondary:     #475467
--text-muted:         #667085
--text-disabled:      #98A2B3
--text-inverse:       #FFFFFF

--border-default:     #E4E7EC
--border-strong:      #D0D5DD
--border-focus:       #2563EB

--accent:             #2563EB
--accent-hover:       #1D4ED8
--accent-subtle:      #EAF2FF

--success:            #16794A
--success-subtle:     #EAF7F0
--warning:            #A15C00
--warning-subtle:     #FFF4E5
--danger:             #B42318
--danger-subtle:      #FDECEC
--info:               #175CD3
--info-subtle:        #EFF4FF
--violet:             #6941C6
--violet-subtle:      #F4F0FF
```

No primary gradient.

---

## 5. Semantic state tokens

### Freshness

```text
Fresh         success
Stale         warning
Unknown       muted
Unavailable   danger only when operationally blocking; otherwise muted
Incompatible  danger
Reconciling   info
```

### Work state

```text
Working       accent/info
Waiting       muted
Blocked       warning
Needs You     violet
Reconciling   info
Offline       muted
Failed        danger
```

### Proof states

```text
CLAIMED       text-muted + neutral outline
OBSERVED      info
SUPPORTED     violet
VERIFIED      success
SETTLED       #0F766E / subtle #E7F7F4
UNKNOWN       neutral
STALE         warning
```

Verified/Settled must not use the same appearance as ordinary “success toast.” They are durable trust states and need a quieter, more authoritative treatment.

---

## 6. Spacing

Base unit: 4px.

```text
4   micro
8   tight
12  compact
16  standard
20  roomy
24  section
32  major section
40  page rhythm
48  large separation
64  hero/major empty-state space only
```

Primary page horizontal gutter:

```text
<480px       16px
480–859px    20px
860–1179px   24px
1180px+      28px
```

Avoid cards nested inside cards with repeated 16px borders/padding. Use spacing and subtle separators first.

---

## 7. Radius and elevation

```text
--radius-sm:   8px
--radius-md:  12px
--radius-lg:  16px
--radius-pill: 999px
```

Use 12px for most cards/inputs, 16px for major grouped panels.

Shadows:

```text
Level 0  none
Level 1  0 1px 2px rgba(16,24,40,.05)
Level 2  0 4px 12px rgba(16,24,40,.08)
```

Default cards use border + Level 1 or no shadow.
Drawers/popovers may use Level 2.
No large blurry shadows.

---

## 8. Iconography

Use **Lucide** icon language where an icon package is introduced (`lucide-svelte` for Svelte UI).

Canonical size:

```text
16px inline
18px buttons/navigation
20px card/status feature
24px empty state
```

Stroke: default library stroke; do not mix filled icon families.

Icons never replace critical state text.

Suggested mappings:

```text
Workstream       GitBranch or Route
Foreman          BriefcaseBusiness or CircleUserRound
People           Users
Direction        SendHorizontal
Needs You        CircleAlert
Evidence         BadgeCheck
Topology         Network
UIAI/Watch       MonitorPlay
Takeover         Hand
Fresh            CircleCheck
Stale            ClockAlert
Reconcile        RefreshCw
```

Do not use robot-head icon as the universal agent identity.

---

## 9. Controls

### Button sizes

```text
Small     30px height / 12px text
Default   36px height / 14px text
Large     40px height / 14px text
```

### Button hierarchy

```text
Primary     solid accent
Secondary   white surface + strong border
Tertiary    transparent text/icon
Danger      danger only for destructive/consequential source action
```

One visually dominant primary action per local decision area.

### Inputs

Default 40px min height.
Direction composer grows from 44px to max ~140px before internal scrolling.

Focus ring:

```text
2px solid #2563EB
2px outer offset using app background
```

---

## 10. Cards and panels

### Standard operational card

```text
background: surface
border: 1px default
radius: 12px
padding: 16px
```

### Major panel

```text
radius: 16px
padding: 20–24px
```

### Selected Workstream

Use `bg-selected` plus a 2px accent inset/left indicator. Do not saturate the entire card blue.

### Attention card

Use a 3px semantic left indicator plus neutral surface. Violet is the default “human attention” semantic, not danger red.

### Evidence card

Proof state is visible via badge + one restrained semantic edge/accent. Do not flood entire card green.

---

## 11. Navigation visual contract

Primary nav uses icon + text at desktop.

Selected item:

```text
background: bg-selected
text: text-primary
icon: accent
font-weight: 600
```

Unselected:

```text
transparent
text-secondary
```

Hover uses `bg-hover`.

No heavy sidebar border; use one subtle vertical divider.

---

## 12. Direction visual contract

Direction is one of the strongest product controls.

Container:

```text
surface
1px border-strong when idle
2px border-focus when focused
12px radius
```

Top micro-row:

```text
Direct → <Workstream> / <Foreman>
```

Input row:

```text
textarea                     mic   send
```

Result appears immediately below in the same local context:

```text
Accepted
Clarification needed
Proposal created
Dispatched
Blocked
Denied
Reconciling
```

Do not create chat bubbles for routine Direction responses.

---

## 13. Foreman visual contract

Foreman card must feel accountable, not anthropomorphic.

```text
FOREMAN                                      Fresh
<Workstream/role display>
Objective text
Current frontier text

3 working · 1 waiting
Last verified: <proof>

Ask state     Why this path?
```

No avatar required. If identity art exists, use a small restrained mark, not a character illustration.

---

## 14. Work/Trajectory visual contract

### Depth controls

Two segmented controls:

```text
Full | Medium | Short
Human | Operations | Technical
```

These must be visually distinct groups with labels/tooltip so users do not confuse them.

### Human view

Use vertical narrative progression rather than node graph:

```text
Desired outcome
  ↓
Current
  ├─ Parallel
  ↓
Next

Blocked / unresolved
```

### Operations view

Use compact rows with dependency connectors and actor chips.

### Technical view

Use a pan/zoom graph only when graph density warrants it; otherwise expandable tree/list is preferred. The build agent must not introduce a graph library merely for visual novelty.

---

## 15. Proof visual language

### VERIFIED

```text
small success badge
strong title
supporting checks in neutral rows
```

Example:

```text
LOGIN REGRESSION                         VERIFIED

Implementation                          ✓
Focused tests                       18/18
Browser verification                UIAI
Independent review               Verifier

2 minutes ago                         Inspect
```

### UNVERIFIED/CLAIMED

Never use green checkmarks.

```text
DEPLOYMENT                              CLAIMED
Agent reports complete.
No external observation or settlement receipt.
```

---

## 16. Status chips

Height 22px; radius pill; 11–12px semibold.

Use background subtle + dark semantic text.

No more than 3 chips in a primary card. Additional metadata goes to detail.

---

## 17. Tables and dense data

Only Technical/Audit/advanced surfaces use tables.

```text
row height 40–44px
header 12px semibold
zebra striping: none
hover subtle
borders horizontal only
```

Use sticky header when >10 rows.

---

## 18. Motion

Durations:

```text
fast       120ms
standard   180ms
slow       260ms
```

Easing:

```text
standard: cubic-bezier(.2,.8,.2,1)
exit:     cubic-bezier(.4,0,1,1)
```

Allowed motion:

```text
drawer/overlay enter-exit
attention item insertion/removal
state badge transition
verification strengthening
reconciliation completion
```

No looping animation except a subtle indeterminate spinner for truly in-progress local fetch/reconcile.

With `prefers-reduced-motion: reduce`, transitions become instant or ≤80ms with no transform movement.

---

## 19. Toasts

Toasts are only for local interaction confirmation/error, not durable work state.

Use:

```text
Direction submitted
Copied reference
Local preference saved
```

Do not use toast as the only representation of:

```text
approval needed
work completed
verification failed
deployment status
```

Those belong in durable surfaces.

---

## 20. Empty states

No illustrations required.

Use icon + concise title + one sentence + one action.

Examples:

```text
No active Workstreams
Focusa confirms no Workstreams are available in this environment.
[ Refresh ]
```

```text
Nothing needs you
Your workforce can continue without input right now.
```

Do not say “All caught up!” if the source is stale/unavailable.

---

## 21. Loading states

Use skeletons only when expected layout is known.

Do not skeleton-fill stale known data during background refresh; keep known data visible with Refreshing cue.

Initial app load may use:

```text
header skeleton
1–2 content blocks
```

Avoid full-page shimmer.

---

## 22. Reference Side Panel

Canonical light layout:

```text
┌────────────────────────────────┐
│ ACME                    ● Fresh│
│ Spock · Private                │
│                                │
│ Website Relaunch            ▾  │
│ Login & Sessions               │
├────────────────────────────────┤
│ FOREMAN                        │
│ Customer testing               │
│ Fix login regression first     │
│ 3 working · 1 waiting          │
│ Last verified  18/18 tests     │
│                                │
│ ┌────────────────────────────┐ │
│ │ Direct this Foreman…       │ │
│ │                      🎙  ➜ │ │
│ └────────────────────────────┘ │
├────────────────────────────────┤
│ NEEDS YOU                    2 │
│ ▌ Product truth                │
│   Session behavior unclear     │
│   [ Answer ]                   │
│                                │
│ ▌ UIAI authentication          │
│   Browser paused at MFA        │
│   [ Take control ]             │
├────────────────────────────────┤
│ WORKING NOW                    │
│ Builder-2        Fixing        │
│ Verifier-1       Waiting       │
│ UIAI Chrome      Reproducing   │
├────────────────────────────────┤
│ VERIFIED RECENTLY              │
│ ✓ Login reproduced             │
├────────────────────────────────┤
│ Open Workforce      Watch UIAI │
└────────────────────────────────┘
```

Whitespace and typography should create hierarchy; do not put boxes around every subsection.

---

## 23. Reference Full Workforce

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ACME / Website Relaunch / Login & Sessions            ● Fresh       │
├─────────────┬───────────────────────────────────────┬────────────────┤
│ Overview    │ Customer testing                      │ NEEDS YOU      │
│ Work        │ Fix login regression first            │ 2              │
│ People      │                                       │                │
│ Evidence    │ FOREMAN                               │ Product truth  │
│             │ 3 working · 1 waiting                 │ UIAI auth      │
│ Topology    │                                       │                │
│ Audit       │ [ Direct this Foreman…            ➜ ] │ VERIFIED       │
│ Settings    │                                       │ Login repro ✓  │
│             │ TRAJECTORY                            │ Tests 18/18 ✓  │
│             │ Full Medium [Short]                   │                │
│             │ [Human] Operations Technical          │                │
│             │                                       │                │
│             │ Current  Patch login regression       │                │
│             │ Parallel Verify session behavior      │                │
│             │ Next     Browser verification         │                │
│             │                                       │                │
│             │ WORKING NOW                           │                │
│             │ Builder-2 · Verifier-1 · UIAI Chrome │                │
└─────────────┴───────────────────────────────────────┴────────────────┘
```

---

## 24. Responsive/accessibility surface resilience

Surface styling must survive layout reflow rather than merely match desktop screenshots.

- Do not encode meaning by color alone; retain state text/icons/borders.
- Primary interactive targets on narrow/touch layouts should provide approximately 44px usable target size where practical.
- Long primary labels wrap; machine identifiers break safely only in technical/detail contexts.
- Visible focus must remain visible in normal, high-contrast and forced-color environments.
- Hover is enhancement only; required actions and state cannot depend on hover.
- At 200% browser/text zoom, typography may reflow but no required label, action, state or evidence cue may disappear.
- At 320 CSS px reflow width, ordinary product content has no page-level horizontal scroll.
- Technical two-dimensional content may use an internally scrollable/pannable region when unavoidable.
- Responsive stacking preserves semantic reading order; CSS visual reordering must not create a contradictory keyboard/screen-reader order.

---

## 25. Surface acceptance

Before calling the Surface plane resolved in implementation:

1. tokens exist in one shared CSS/token module;
2. Side Panel matches this hierarchy at 320–480px;
3. Full Workforce matches this hierarchy at 1024px and 1440px;
4. Needs You, Evidence, stale, incompatible and reconnect states use the semantic system above;
5. no screen introduces an unapproved visual pattern for canonical state;
6. keyboard focus and WCAG 2.2 AA contrast pass;
7. reduced motion is honored;
8. screenshots/reference snapshots are captured in tests or review artifacts for the core reference surfaces;
9. 320px reflow and 200% zoom preserve all required content/actions without page-level horizontal overflow;
10. long content, forced/high-contrast mode, and keyboard focus remain legible and usable;
11. responsive visual order matches semantic/keyboard reading order.

This visual system is the build target. Significant changes require updating this document rather than improvising screen-by-screen.