# Focusa Workforce — Build, Release, and Continuous Delivery Contract

**Goal:** every accepted Workforce change produces a reproducible, attributable extension artifact that can be promoted independently to private dogfood, the Veragensia demo, customer preview, and stable channels.

---

## 0. Build law

```text
source commit
→ dependency lock
→ deterministic build
→ tests
→ manifest validation
→ packaged artifact
→ checksums / metadata
→ channel promotion
→ health/parity checks
```

A deployed `dist/` without traceable source commit and build metadata is not an acceptable release artifact.

---

## 1. Required source inputs

After migration, the repo must pin:

- package manager and lockfile;
- Node/runtime version;
- build command;
- manifest-generation inputs;
- extension public key/identity handling where applicable;
- compile-time environment schema;
- dependency versions;
- generated contract versions consumed from Focusa/UIAI/Veragensia.

Secrets never belong in build output or committed environment files.

---

## 2. Build profiles

At minimum:

```text
private
public_demo
```

Later:

```text
customer_preview
stable
```

Build profiles may change safe configuration such as default endpoint discovery, optional new-tab behavior, diagnostics, and release channel.

They MUST NOT change fundamental authority semantics.

Known public-demo behavior currently uses:

```text
FOCUSA_PUBLIC_NEWTAB=1
```

Treat that as a profile detail to verify during source recovery, not as a universal default.

---

## 3. Artifact contents

Release pipeline should produce:

```text
focusa-workforce-<version>-<channel>.zip
focusa-workforce-<version>-unpacked.tar.gz (optional)
SHA256SUMS
build-metadata.json
```

`build-metadata.json` should include:

```json
{
  "product": "focusa-workforce",
  "version": "...",
  "channel": "...",
  "source_commit": "...",
  "built_at": "...",
  "node_version": "...",
  "manifest_version": "...",
  "focusa_contract_ref": "...",
  "uiai_contract_ref": "..."
}
```

No secrets or private endpoint tokens.

---

## 4. CI gates

### Required on every pull request/change

```text
format/lint
unit tests
contract/schema tests
manifest validation
build
static secret scan
forbidden-private-data scan
```

### Required before dogfood promotion

```text
unpacked-extension smoke test
pairing client tests
snapshot/event reducer tests
freshness/stale-state tests
mutation retry/idempotency tests
```

### Required before demo/customer promotion

```text
browser integration tests
real daemon compatibility test against approved fixture/test environment
UIAI handoff test where available
upgrade test
artifact checksum/provenance
```

### Required before stable

```text
Chromebook acceptance
multi-daemon acceptance where supported
approval/evidence lineage acceptance
close/reopen continuity
rollback proof
```

---

## 5. Test layers

```text
unit
  pure reducers / parsers / scope / freshness / UI state

contract
  Focusa/UIAI/Veragensia schema compatibility

integration
  service worker ↔ daemon client ↔ event stream

browser
  MV3 runtime, side panel, extension pages, permissions

acceptance
  real user journeys on Chromebook/demo/private environments
```

Do not certify a runtime integration solely from mocks.

---

## 6. Release channels

### `private-dogfood`

Fastest channel. Intended for the owner's Chromebook/private machines.

May auto-promote from `main` after CI once source recovery is complete and the owner explicitly enables the channel.

### `demo`

Feeds `os.focusa.dev` or its deployment pipeline.

Promotion requires public-demo profile build and demo health/parity check.

### `customer-preview`

Versioned preview for selected private customer environments.

Never consume public-demo credentials/configuration.

### `stable`

Explicitly promoted release with rollback artifact retained.

---

## 7. Veragensia deployment cutover

Current anti-pattern:

```text
Veragensia deployment script
→ absolute server-local Focusa worktree
→ build dist/
→ deploy
```

Target:

```text
Workforce repo release
→ immutable artifact + checksum
→ Veragensia deployment
→ verify extension identity/version
→ activate
→ health check
```

Veragensia should consume a version/ref/artifact, not own Workforce source.

---

## 8. Chromebook delivery

Initial private dogfood may remain **Load unpacked** for speed.

Recommended progression:

```text
load-unpacked developer build
→ signed/private package or managed distribution
→ customer-preview distribution
→ stable distribution mechanism
```

The exact Chrome Web Store/private enterprise channel decision is deferred until account/distribution constraints are reviewed.

---

## 9. Extension identity

Known deployed extension ID:

```text
ohfbbkpacpcapicpgplnnmifmlnmjggj
```

Source recovery must determine how that ID is derived/preserved.

Rules:

- do not casually regenerate key material;
- do not commit private signing secrets;
- document the identity mechanism;
- intentional ID migration requires explicit compatibility/update plan.

---

## 10. Version compatibility

Workforce should know and report compatibility against:

- Focusa daemon/API contract version;
- relevant generated operation registry version;
- UIAI integration contract version;
- optional local bridge version;
- extension schema/storage version.

An incompatible backend should produce `incompatible`, not generic offline.

---

## 11. Browser-storage migrations

Every persistent extension-storage schema change requires:

- explicit schema version;
- forward migration;
- safe handling of unknown newer schema;
- test from prior supported versions;
- preservation of pairing metadata unless revocation/security requires otherwise;
- no silent transformation of canonical backend state.

---

## 12. Deployment verification

A channel promotion should verify at minimum:

```text
artifact checksum
manifest parses
expected extension ID where applicable
expected version/channel
extension page loads
service worker starts
pairing state readable
approved test daemon reachable where channel requires it
snapshot/events work
no obvious console/runtime fatal error
```

Demo deployment should also verify the expected startpage/new-tab behavior.

---

## 13. Rollback

Every promoted build retains the previous known-good artifact.

Rollback must be able to restore:

- prior extension package/build;
- compatible extension storage posture;
- prior demo deployment artifact.

Rollback of the extension does not roll back external work/actions already performed through Focusa/UIAI. Those remain subject to normal settlement/reconciliation.

---

## 14. Release evidence

Record per release:

```text
source commit
artifact hashes
CI result
contract versions
target channel
promotion actor/process
acceptance evidence
known limitations
rollback artifact
```

The extension UI should expose its version/build/channel for dogfood diagnostics.

---

## 15. Continuous-delivery principle

Move fast on the **surface**, not by weakening authority.

UI, navigation, visualization and interaction can iterate rapidly. Pairing, authority, credential custody, mutation semantics, Evidence truth, and UIAI control boundaries remain contract-driven.
