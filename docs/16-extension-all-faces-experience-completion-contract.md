# Focusa Workforce — All-Faces Experience Completion Contract

**Status:** CURRENT cross-surface UX completion authority  
**Applies to:** every user-facing face, entry point, transition and degraded state in the Focusa Workforce Chrome extension  
**Extends:** `docs/10`, `docs/11`, `docs/12`, `docs/13`  
**Rule:** no visible face of the extension may be left for the build agent to product-design during implementation.

---

## 1. Completion invariant

The extension is not UX-complete merely because the Side Panel and Full Workforce page are designed.

Every face that a user can encounter MUST be resolved through the applicable five UX planes:

```text
Strategy  — why this face exists and the user need it serves
Scope     — what information/actions belong here and what does not
Structure — entry, navigation, state transitions, handoffs and return behavior
Skeleton  — exact information/action hierarchy and non-happy states
Surface   — visual hierarchy, density, typography, semantic styling and motion
```

A face may reuse a global decision rather than repeat it, but it may not depend on the build agent inventing foundational behavior, hierarchy or visual semantics.

The build agent retains ordinary engineering discretion inside these resolved boundaries.

---

## 2. Canonical face inventory

The current extension has these product faces. Treat all of them as first-class UX responsibilities.

| Face | Entry | Primary job | Mutation posture |
|---|---|---|---|
| Chrome toolbar action | extension action / `Alt+Shift+F` | fastest browser-resident entry | none itself; opens Side Panel |
| Side Panel | `sidepanel.html` | immediate Workstream collaboration while browsing | scoped mutations |
| Private Start Page | Chrome new tab → `startpage.html` | calm return/orientation | navigation + safe local presentation only |
| Public Start Page | `startpage.html?public-work=1` / public-newtab build | curated public demonstration | read only |
| Full Workforce | `workforce.html` | deep workforce operations | scoped mutations |
| Full Workforce — Pairing/Connections | full-page pre-operational state/settings | connect/select authorized Focusa environments | pairing/connection operations only |
| Full Workforce — Overview | `#/overview` | workforce orientation | contextual navigation/actions |
| Full Workforce — Work | `#/work`, `#/work/detail` | exact Workstream operation | scoped mutations |
| Full Workforce — People | `#/people`, `#/people/detail` | responsibility/accountability inspection | source-owned actions only |
| Full Workforce — Needs You | contextual list/drawer/detail | human-value attention and decisions | source-owned actions |
| Full Workforce — Evidence | `#/evidence`, `#/evidence/detail` | proof/verification/closure inspection | source-owned verification actions only |
| Full Workforce — Topology | `#/topology` | bodies/runtime/placement understanding | inspect/handoff; no local infra authority |
| Full Workforce — Audit | `#/audit` | meaningful causal history | read-oriented |
| Full Workforce — Settings | `#/settings` | extension presentation/connections/preferences | bounded extension/local settings + owning connection ops |
| Wall | `wall.html` / `Alt+Shift+W` | ambient situational awareness | read only |
| Page-context/orientation flow | explicit active-tab action from Workforce UI | bring current browser context into exact governed work | only through owning operations |
| Keyboard entry flows | `Alt+Shift+F/W/K` | fast deterministic navigation | navigation only |
| Cross-product/deep-link ingress | typed internal/handoff refs | enter exact object/context without rediscovery | action only after source revalidation |
| Cross-cutting recovery states | any face | truthful handling of stale/offline/forbidden/unsupported/reconciling state | fail safe |

No new top-level face is implied by this document.

---

# 3. Global experience law

## 3.1 One product, different altitudes

The faces are different windows onto the same governed workforce, not separate mini-products.

```text
Start Page   = orient me
Side Panel   = let me work with the current Workstream now
Full page    = let me operate and inspect deeply
Wall         = let me understand the room at a glance
Public page  = let an outsider understand the product without private access
```

Do not make all faces contain the same widgets at different sizes.

## 3.2 Shared semantics

All faces use the same meanings for:

```text
Workstream
Foreman
Needs You
Working / Waiting / Blocked / Reconciling
Claimed / Observed / Supported / Verified / Settled / Stale
Fresh / stale / unavailable / incompatible
Full / Medium / Short trajectory
Human / Operations / Technical presentation depth
```

## 3.3 Shared identity hierarchy

Primary presentation order where applicable:

```text
Operator / environment
Project / Workstream
Foreman / accountable role
work / worker / execution context
technical refs only on demand
```

Do not lead with daemon URLs, model names, session IDs or provider names.

## 3.4 Shared visual system

All extension-owned rendered faces use `docs/13` tokens and semantic language.

The Chrome toolbar/keyboard surfaces are Chrome-controlled entry affordances; they must still use the product's name/meaning consistently but are not expected to reproduce extension CSS.

## 3.5 Shared state classes

Every applicable face handles:

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

A surface may omit impossible classes, but it may not collapse distinct states into misleading “empty” or “failed” states.

---

# 4. Chrome toolbar action

## Strategy
Fastest possible way to bring Workforce into the current browsing context without navigating away.

## Scope

```text
click extension action → open Side Panel
Alt+Shift+F            → same outcome
```

No popup. No hidden orchestration. No mutation merely because the icon was clicked.

## Structure

```text
browser context
→ action click
→ Side Panel opens
→ restores current environment/Workstream if valid
→ otherwise shows the Side Panel's exact connection/scope state
```

## Skeleton / Surface
Chrome owns the action container. Workforce owns:

- product name/title: `Open Focusa Workforce`;
- product icon/brand asset where manifest packaging provides one;
- Side Panel state after entry.

The toolbar action must never open a different experience depending on hidden state.

---

# 5. Side Panel

`docs/12 §2` and `docs/13 §22` remain the detailed Skeleton/Surface authority.

## Strategy
Operate the currently relevant Workstream without leaving the browser task.

## Scope
The Side Panel contains only the highest-value current-context controls:

```text
environment + freshness
Project / Workstream
Foreman + objective/frontier
Direction
Needs You
Working Now
Verified Recently
Open Workforce / Watch UIAI when relevant
```

Deep topology, broad audit, dense trajectory graphs, configuration and organization-wide exploration belong in Full Workforce.

## Structure
Opening the panel restores the last valid Workstream per environment, then revalidates owner state before enabling consequential actions.

## Skeleton
Fixed vertical hierarchy:

```text
Header
Scope
Foreman
Direction
Needs You
Working Now
Verified Recently
Footer handoffs
```

At narrow heights, preserve Direction and Needs You before lower-priority recent history. Scrolling is vertical; no horizontal content rail.

## Surface
Use the canonical light-first operational system from `docs/13`. The panel should feel compact and calm, never like a compressed admin dashboard.

---

# 6. Private Start Page — canonical new-tab experience

This is a major product surface, not a status dump.

## Strategy
Each new tab gives the Operator immediate orientation with almost zero cognitive cost:

```text
What is currently in focus?
Does anything genuinely need me?
Who/what is working?
What was recently proven?
Where do I continue?
```

It must add value without making opening a new tab feel like entering an operations console.

## Scope

Include:

```text
brand / environment / freshness
current Workstream focus
objective + Foreman
Needs You summary
Working Now summary
Verified Recently summary
Continue current Workstream
Open Needs You
Open Workforce
```

Exclude:

```text
raw daemon URL as primary information
technical IDs
session-control buttons
trajectory graph
large audit feed
settings
pairing internals
KPI tiles
chat feed
```

The page performs no consequential work mutation.

## Structure

```text
new tab opens
→ restore active environment locally
→ refresh owner state
→ if exact Workstream remains valid, show it
→ if no Workstream but environment is valid, show Choose/Open Workforce
→ if no environment, show Pair Focusa
→ if stale/unavailable, preserve last-confirmed orientation with explicit state
```

Do not steal keyboard focus from the browser/omnibox with an autofocus input. Opening a new tab must remain fast and non-disruptive.

## Skeleton

Desktop/tablet hierarchy:

```text
┌─────────────────────────────────────────────────────────────┐
│ Focusa Workforce                         Environment · Fresh │
│ build/debug identity only on demand                        │
├─────────────────────────────────────────────────────────────┤
│ CURRENT WORKSTREAM                                          │
│ Login & Sessions                                            │
│ Fix login regression and verify customer session behavior  │
│ Foreman: Customer testing                                   │
│ Last verified: Login reproduced                             │
│                                                             │
│ [ Continue ]   Needs You 2   Open Workforce                 │
├──────────────────────────────┬──────────────────────────────┤
│ NEEDS YOU                    │ WORKING NOW                  │
│ Product truth               │ Builder-2 · Fixing           │
│ UIAI authentication         │ Verifier-1 · Waiting         │
│ [ Open Needs You ]          │ UIAI Chrome · Reproducing    │
├──────────────────────────────┴──────────────────────────────┤
│ VERIFIED RECENTLY                                           │
│ ✓ Login reproduced     ✓ Focused tests verified            │
└─────────────────────────────────────────────────────────────┘
```

At narrow widths the two middle columns stack:

```text
Current Workstream
Actions
Needs You
Working Now
Verified Recently
```

### Empty/unpaired

```text
Focusa Workforce
Your workforce is not connected on this device.
Pair a Focusa environment to make this new tab your operating return point.
[ Pair Focusa ]
```

No setup form on the Start Page; hand off to Full Workforce pairing.

### Environment connected, no active Workstream

```text
Environment connected
No Workstream is selected.
[ Choose Workstream ]   [ Open Workforce ]
```

### Stale
Keep last-confirmed useful data visible under a single clear stale banner. Disable anything that would depend on current authority. Navigation remains available.

## Surface

- maximum content width: ~1100px;
- generous top whitespace, not a dense dashboard;
- one dominant title/focus area;
- no more than three compact summary regions beneath it;
- no base URL in the primary orientation card;
- `Needs You` uses violet semantic accent, not alarm red;
- `Verified Recently` uses quiet proof styling;
- build stamp belongs in subtle debug/meta treatment, not brand hierarchy;
- no continuous motion or live-feed jitter.

---

# 7. Public Start Page / public Work view

## Strategy
Explain the product through a curated, dated, read-only checkpoint without exposing any private Operator state.

## Scope
Public snapshot only. It must not read:

```text
paired connections
private Workstreams
notifications
layout preferences
tokens/secrets
private browser context
```

## Structure

```text
public-work=1
→ load bundled/served curated snapshot
→ render read-only product state
→ clearly identify snapshot freshness/date
→ optional safe public navigation only
```

Failure to load snapshot renders an honest public-unavailable state, never private fallback.

## Skeleton

```text
Brand / public-demo label
Snapshot date + read-only posture
Current example mission/focus
Example workforce/roles
Example current work
Example evidence/proof
Product explanation / appropriate public CTA if already owned elsewhere
```

## Surface
Use the same product visual language but slightly more explanatory spacing. Never make the public demo look like a live authenticated Operator environment.

---

# 8. Full Workforce shell

`docs/11`, `docs/12` and `docs/13` remain detailed authorities.

## Strategy
Deep operational environment for understanding and steering the workforce across Workstreams.

## Scope

```text
Overview
Work
People
Evidence
Topology
Audit
Settings
Needs You contextual/global access
Pairing/Connections when needed
```

## Structure
Stable shell:

```text
operator/environment/scope header
primary navigation
main content
context rail/drawer when useful
```

## Surface
Do not turn every route into a separate visual product. Shared shell, spacing, navigation, semantic states and component language remain stable.

---

# 9. Full Workforce — Pairing / Connections face

This face was previously under-specified and is now explicit.

## Strategy
Get the user from “extension installed” to “authorized environment usable” with confidence and minimal technical burden.

## Scope

Include:

```text
existing paired environments
current/last-connected posture
Pair new Focusa
base URL only where required for connection setup
friendly environment label
pairing code / awaiting approval state
retry/check state
remove/disconnect locally where supported
connection health / incompatible state
```

Exclude raw tokens, secret material and daemon internals not needed for connection.

## Structure

```text
No connection
→ Pair new Focusa
→ enter supported endpoint + friendly label
→ pairing request
→ awaiting approval + code
→ check/reconcile
→ paired
→ environment selected
→ refresh owner state
→ choose/restore Workstream
```

Failure preserves entered non-secret configuration and explains the failure class. A timeout does not imply pairing was rejected if outcome is unknown.

## Skeleton

```text
Connections

Your environments
[ ACME Private     Fresh / last seen ... ]
[ Local Dev        Offline / last seen ... ]

Pair another Focusa
Environment label  [____________]
Focusa address     [____________]
[ Start pairing ]

PAIRING
Code  4H7K-2P
Approve this request in Focusa.
[ Check again ]  [ Cancel ]
```

On success, collapse setup details and move the user into useful operation rather than leaving them on a success screen.

## Surface
Connection setup is calm and utilitarian. Pairing codes are large/readable monospace. Secret/token values are never rendered.

---

# 10. Full Workforce route faces

The route-level Skeleton/Surface contracts in `docs/12`/`docs/13` remain authoritative. The following ensures no route is treated as “generic content.”

## Overview

**Job:** workforce-wide orientation.  
**Primary hierarchy:** Current Focus → Needs You → Working Now → Verified Recently → Workstreams → conditional capacity exception.  
**Primary action:** Continue exact Workstream.

## Work index/detail

**Job:** move from organization-wide work to exact Workstream operating context.  
**Primary hierarchy:** Workstream identity/objective → Foreman → Direction → trajectory/frontier → Working Now → Needs You → Evidence → execution posture.

## People index/detail

**Job:** answer accountability/responsibility before infrastructure/model trivia.  
**Primary hierarchy:** Foremen → Managers → Workers/Specialists → Verifiers. Person detail begins with role/responsibility, then authority/execution/proof.

## Needs You

**Job:** one coherent human-value queue.  
**Primary hierarchy:** What needs you → why now → exact context → consequence → current source state → allowed source action.  
Presenter snooze/hide is separate from source resolution.

## Evidence

**Job:** make consequential claims inspectable.  
**Primary hierarchy:** claim/outcome → proof state → supporting evidence → source/provenance → related work/actor → verification → settlement/correction.

## Topology

**Job:** explain where work runs without turning infrastructure into the main mental model.  
**Primary hierarchy:** body/runtime role → health/availability → current Workstreams → exception → technical detail on demand.

## Audit

**Job:** meaningful causal history.  
**Default events:** direction, delegation changes, human attention resolution, takeover/return, verification/settlement, recovery/correction and authority/scope changes relevant to work. Raw event verbosity is secondary.

## Settings

**Job:** extension presentation, connection and browser-context preferences.  
Do not silently become a credential vault, authority editor or federation admin console.

---

# 11. Wall — ambient organization face

## Strategy
Let an Operator glance at a dedicated screen and understand the live organization without interacting with it.

## Scope

Include only:

```text
Operator / environment / freshness
Current Focus / most important Workstream
Working Now
Needs You summary
Verified Recently
high-value blocked/health exception
```

Exclude:

```text
Direction composer
session controls
approval buttons
dense audit
settings
raw topology tables
pairing forms
```

## Structure

```text
open wall
→ select/restore intended environment
→ live read projection
→ update from owner events
→ stale if stream/source ages out
→ unavailable if source cannot be confirmed
```

An explicit click may open exact Full Workforce context in another tab; the Wall itself never mutates.

## Skeleton

16:9 reference:

```text
┌────────────────────────────────────────────────────────────────────┐
│ FOCUSA WORKFORCE WALL     ACME · Private                ● LIVE     │
├────────────────────────────────────────────────────────────────────┤
│ CURRENT FOCUS                                                        │
│ Website Relaunch · Login & Sessions                                  │
│ Fix login regression first                                           │
│ Foreman: Customer testing                  Short: Browser verify next │
├────────────────────────┬────────────────────────┬─────────────────────┤
│ WORKING NOW            │ NEEDS YOU             │ VERIFIED RECENTLY   │
│ Builder-2   Fixing     │ Product truth         │ Login reproduced ✓  │
│ Verifier-1  Waiting    │ UIAI authentication   │ Tests 18/18 ✓       │
│ UIAI Chrome Reproduce  │                       │                     │
├────────────────────────┴────────────────────────┴─────────────────────┤
│ Exception only when material: 1 blocked / body unavailable / stale   │
└────────────────────────────────────────────────────────────────────┘
```

At smaller widths, stack Current Focus then a two-column/one-column summary. Wall must remain readable from several feet away; do not use dense 11px technical metadata.

## Surface

- larger typography than Full Workforce;
- low interaction chrome;
- strong spatial grouping, few borders;
- freshness always visible;
- subtle state transitions only;
- no animated “agent swarm”; no scrolling ticker;
- stale state dims/labels the whole live posture without erasing last-known information.

---

# 12. Page-context / active-tab orientation face

This is a contextual flow inside the Side Panel/Full Workforce, not a new global surface.

## Strategy
Turn the browser page the user is actually looking at into useful governed context without ambient browsing surveillance.

## Scope
Capture only after an explicit user action and only the minimum supported context:

```text
page URL/title
explicit selection or supported visible-page context when requested
exact target Workstream/Foreman
user-selected intent
```

Supported intent family only when backed by real owners:

```text
Ask Foreman about this page
Send page to Workstream
Create work from selection
Capture Evidence candidate
Open in UIAI
```

Existing session-orientation/preflight behavior may remain where still valid, but raw technical session-creation forms must not become the default user model if a higher-level governed operation exists.

## Structure

```text
explicit Use current page
→ capture minimal context
→ show exact target Workstream/Foreman
→ user chooses/enters intent
→ preview material target/effect if needed
→ owning operation
→ source-backed result
```

Changing tabs invalidates a stale capture before consequential submission unless the captured source itself is intentionally being sent by ref.

## Skeleton

```text
THIS PAGE
<title>
<origin/domain>

Send to
<Project / Workstream / Foreman>

[ Ask Foreman ] [ Create work ] [ More… ]
```

Technical URL/details are secondary. No automatic background capture indicator because no automatic capture should occur.

## Surface
Compact contextual card using neutral browser/document iconography. The user must be able to tell page context from canonical Workstream state.

---

# 13. Keyboard command faces

Current command contract:

```text
Alt+Shift+F  Side Panel
Alt+Shift+W  Wall
Alt+Shift+K  Full Workforce
```

## Strategy
Muscle-memory entry into the three operational altitudes.

## Structure
Each shortcut only navigates/opens; it never mutates workforce state. The opened face then performs its normal source revalidation.

## Surface
Where shortcuts are documented inside Settings/help text, use the user's platform notation and exact current assignment. Do not show a shortcut that the manifest/browser reports as unavailable or overridden.

---

# 14. Deep-link and specialist-handoff ingress

## Strategy
A user should land on the exact relevant object, not reopen a product and search manually.

## Structure

```text
incoming internal/handoff ref
→ validate schema/kind/version
→ resolve intended environment
→ verify owner/tenant/scope
→ refresh source revision
→ render exact target
→ enable actions only after current authority is confirmed
```

If the environment is known but disconnected, show reconnect for that exact environment and preserve safe return intent.

If the target is stale/deleted/revoked, explain that state and preserve the nearest safe parent context where possible.

Never guess between multiple plausible targets.

## Skeleton
Invalid/stale ingress uses the normal page shell with a contextual state panel, not a generic browser error page.

---

# 15. Cross-cutting recovery/state presentation

These are part of every face's design, not implementation afterthoughts.

| State | Required meaning | Primary UX |
|---|---|---|
| loading | no confirmed result yet | bounded skeleton/spinner where structure known |
| ready-empty | source confirms zero items | exact empty explanation + useful next action |
| stale | prior truth exists but may have changed | keep prior truth + stale banner; gate mutations |
| degraded | some owners unavailable, useful independent state remains | show partial state + exact missing source |
| unauthenticated | connection/session identity must be restored | reconnect/sign-in path |
| forbidden | identity exists but lacks authority | explain scope boundary; no retry theater |
| unsupported/incompatible | required operation/schema absent | explain capability mismatch; do not fake fallback unless approved stopgap |
| unavailable | source cannot currently be reached/read | preserve safe last-known orientation if permitted |
| reconciling | a possibly-effectful action has unknown current disposition | show reconciling; do not label success/failure prematurely |

Every face must preserve the distinction between **nothing exists** and **we cannot currently know**.

---

# 16. Responsive and environment-specific behavior

## Side Panel
Designed first for ~320–480px width. Vertical hierarchy is sacred; secondary metadata collapses before primary controls.

## Private Start Page

```text
<600px   single column
600–899  single main column + compact summary groups
900px+   focus hero + two-column summary region
```

Max content width ~1100px.

## Full Workforce
Use `docs/12` breakpoints: compact nav/context drawer below desktop widths; do not squeeze the desktop three-region shell into Side Panel dimensions.

## Wall
Designed for 16:9 1080p first, then 720p and 4K scaling. Prefer fit-without-scroll for the primary ambient summary. If content exceeds space, summarize and deep-link rather than shrink typography to unreadable density.

## Public Start Page
Must remain understandable at normal laptop/mobile browser widths and must never reveal private-mode chrome or stale private cache during responsive changes.

---

# 17. Accessibility law for every face

Every extension-rendered face must provide:

```text
semantic landmarks/headings
keyboard reachability
visible focus
44px-ish consequence touch targets where practical
non-color-only status meaning
reduced-motion behavior
sufficient contrast
aria-live only for meaningful changing status
no focus theft during background refresh
no layout reordering underneath active input/approval
```

Wall is read-only but still needs meaningful DOM order for assistive access.

---

# 18. Build-agent implementation rule

When touching a face, the build agent must consult this document plus only the relevant owning detail:

```text
runtime/source semantics → docs/05
Structure                → docs/11
component anatomy        → docs/12
visual tokens/language   → docs/13
this face contract       → docs/16
```

Do **not** stop to manufacture a separate design artifact. Implement directly from these resolved contracts.

If running code predates this contract and differs materially, the contract is the target unless a newer owner-approved product decision explicitly supersedes it.

---

# 19. Extension-wide completion condition

The UX portion of HLT-WF-001 is not complete until all in-scope faces satisfy their resolved role and can be traversed as one coherent product:

```text
Toolbar → Side Panel
New Tab → Start Page → exact Workstream / Needs You / Full Workforce
Full Workforce → Work / People / Evidence / Topology / Audit / Settings
Any exact execution → UIAI handoff → safe return
Wall → ambient truth → exact inspection handoff
Explicit current page → exact Workstream operation
Keyboard commands → deterministic face
Public mode → public snapshot only
```

The standard is not “every screen exists.”

The standard is:

> **At no point should the Operator encounter a visible part of the extension whose purpose, content hierarchy, state behavior, handoff, responsive behavior or visual semantics had to be improvised by the implementation agent.**
