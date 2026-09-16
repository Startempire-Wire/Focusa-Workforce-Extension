# Focusa Workforce — Slice 1 Implementation Brief

**Slice:** Workstream + Foreman + Direction  
**Status:** READY  
**Parent:** `08-workforce-redesign-blueprint.md`

> **Make the extension feel like operating a real Focusa workforce for the first time.**

## Outcome

A user can:

```text
open the browser
→ connect/restore an authorized Focusa environment
→ select or restore an exact Workstream
→ see its accountable Foreman and current objective/frontier
→ direct that Foreman in natural language
→ receive the real Focusa result
→ survive reload/reconnect without invented state
```

That is Slice 1. Everything else serves this outcome.

## Canonical boundary

Focusa owns:

```text
Project
Workstream
Foreman binding
Workpoint/frontier
Direction/steer semantics
work authority
Evidence
```

Workforce owns only the browser projection, selection preference and typed intent UI.

Do not invent a client-side Foreman, reducer, work state, approval state or convenient endpoint.

## First move: resolve real Focusa source truth

Inspect current generated/routes/contracts for the semantics needed by this slice:

```text
Workstream list/resolution
Foreman resolve/view/status/hydration or equivalent
Direction / steer / proposal operation
objective/frontier projection
freshness/revision
```

Then:

```text
owning operation exists
→ use it

equivalent owning operation exists
→ add the thinnest adapter preserving provenance

operation genuinely missing
→ implement the smallest correct owning Focusa operation
→ return to Workforce immediately
```

Do not let discovery expand into a broad Focusa redesign.

## Existing core

Reuse sound current primitives where useful:

```text
api-client
contracts
pairing
projections
reconnect
storage
validation
orchestration/orientation where applicable
```

Preserve their behavior, not necessarily their current file structure.

Refactor when it makes the working slice simpler or removes duplication.

## UI implementation

Use:

```text
Svelte 5
minimal Vite/MV3 bundling
JavaScript + JSDoc
```

No SvelteKit.

Do not replace the entire extension pipeline at once. Add only enough bundling/runtime structure to ship the real slice cleanly.

A reasonable shape is:

```text
shared Workforce client/projection layer
→ Side Panel
→ minimal Full Workforce page
```

Exact internal component/file organization is the build agent's decision.

## Selection

The extension may persist only presentation context such as:

```text
environmentRef
projectRef
workstreamRef
foremanRef
```

Selection is not authority.

On reconnect or before consequential mutation, revalidate current source scope/freshness as needed.

Typed/source-qualified refs prevent cross-environment collisions.

## Side Panel target

Primary hierarchy:

```text
Operator / environment + freshness
Project / Workstream
Foreman
objective + current frontier
Direction
latest meaningful proof cue
Open Workforce
```

Do not lead with daemon URLs, model names, session IDs or process machinery.

Implement the visual system from doc 13 without treating example pixels as sacred.

## Foreman

Show source-backed:

```text
identity/role
Workstream
objective
current frontier/Workpoint
freshness
latest meaningful Evidence cue when available
```

If the owning Foreman projection is unavailable, show that truth. Do not relabel a Silent Session or worker as the Foreman.

## Direction

The user always sees the target scope before submission.

Direction uses the real owning Focusa operation and returns whatever owning result state actually exists, such as:

```text
accepted
dispatched
clarification required
proposal created
blocked
denied
stale/revalidation required
outcome unknown / reconciling
```

Do not create local work state after submission.

If a response is ambiguous because transport failed after submission, reconcile before retry instead of blindly replaying the mutation.

## Freshness and reconnect

The UI may cache bounded projections for continuity, but cached state never becomes current authority.

On reconnect:

```text
resolve current source
→ compare source revision/identity
→ reconcile selected scope
→ refresh projection
→ enable consequential mutation when current scope is known
```

Do not imply that work stopped merely because the extension disconnected or MV3 suspended.

Real-time streaming is optional for Slice 1. Correct source truth beats visual liveliness.

## Full Workforce page

Keep the first full-page surface intentionally narrow:

```text
Workstreams
selected Workstream
Foreman
objective/frontier
Direction
freshness/source posture
```

Do not build later slices merely to fill space.

## Public demo

Fixture/snapshot data may demonstrate the UI, but private customer/daemon data must never enter the public build.

Mutating actions are disabled or unmistakably simulated unless an isolated demo backend exists.

## Implementation freedom

The agent may freely:

```text
batch the UI/runtime work
choose component boundaries
choose store organization
refactor existing presentation code
change the order of implementation
combine several Workpoints into one coherent pass
add focused tests while fixing behavior
```

Do not stop for design approval on ordinary reversible engineering choices.

## Minimum sufficient verification

Slice 1 is proven when the real connected journey works and material failure risks touched by the implementation are covered.

At minimum, establish in running reality:

```text
real environment + Workstream resolves
real Foreman/equivalent owning projection renders
Direction reaches exact real scope
source-backed result is shown
reload restores valid selection
connection loss/recovery does not invent or duplicate effects
MV3 build/permissions remain valid
```

Use the cheapest evidence that establishes those facts. Existing tests may be reused. Add a focused regression test for concrete bugs or dangerous boundary behavior discovered during implementation.

Do not create a separate proof package.

## Exit

Slice 1 is done when this works as one coherent experience:

```text
exact Workstream
+ accountable Foreman
+ current objective/frontier
+ human Direction
+ real Focusa operation
+ honest result/reconciliation
+ resilient scope continuity
```

Then continue directly into the next ready trajectory work. Do not stop merely because the slice boundary was crossed.