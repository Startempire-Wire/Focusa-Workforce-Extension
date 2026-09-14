# Focusa Workforce — Source Recovery and Migration Runbook

**Purpose:** recover the deployed Workforce extension source from the server-local Focusa worktree and make this repository the canonical implementation home without losing provenance or breaking the existing demo.

Known deployed-source path:

```text
/home/wirebot/focusa-piext-sync/apps/workforce-extension
```

Known stable deployed extension ID:

```text
ohfbbkpacpcapicpgplnnmifmlnmjggj
```

Known current deployment consumer:

```text
Veragensia public Agent Computer demo
https://os.focusa.dev
```

---

## 1. Rules

1. Do not create a parallel replacement before inspecting the deployed source.
2. Preserve commit provenance/history if the worktree points to recoverable Git objects.
3. Preserve the extension key/identity unless an intentional migration plan explicitly changes it.
4. Reproduce the currently deployed build before refactoring.
5. Make this repo the canonical source only after parity is proven.
6. Update Veragensia deployment tooling only after the new repo can produce the same valid artifact.
7. Never copy private demo/customer credentials into this repo.

---

## 2. Server-agent recovery procedure

Run on the server that owns `/home/wirebot/focusa-piext-sync`.

### 2.1 Inventory the worktree

```bash
set -euo pipefail

cd /home/wirebot/focusa-piext-sync
printf '\n== root ==\n'
pwd
printf '\n== git status ==\n'
git status --short --branch
printf '\n== remotes ==\n'
git remote -v
printf '\n== HEAD ==\n'
git rev-parse HEAD
printf '\n== branch ==\n'
git branch --show-current || true
printf '\n== worktrees ==\n'
git worktree list --porcelain
printf '\n== extension tree ==\n'
find apps/workforce-extension -maxdepth 3 -type f | sort
```

Record the output in a migration note. Redact secrets/tokens.

### 2.2 Determine whether history exists

```bash
git log --all --oneline --decorate -- apps/workforce-extension | head -100

git rev-list --all --objects \
  | grep ' apps/workforce-extension/' \
  | head -200
```

If commits exist, capture the earliest/latest relevant commits and branch/ref ancestry.

### 2.3 Inspect implementation identity

From `apps/workforce-extension`, record:

- `manifest.json` / generated manifest;
- extension name/version;
- permissions/host permissions;
- background/service worker entry;
- side-panel/start-page/options entries;
- public key if used to preserve extension ID;
- build script;
- package manager / lockfile;
- source framework;
- environment variables;
- build output path;
- existing tests;
- Focusa API/event endpoints consumed;
- UIAI integration points;
- new-tab/start-page behavior;
- any hard-coded demo URLs/credentials that must be removed.

Do not paste secrets into the report.

### 2.4 Build the exact current source

Use the repository's existing build instructions first.

Known Veragensia tooling expects a path compatible with:

```text
apps/workforce-extension/scripts/build.mjs
```

and build output compatible with:

```text
dist/
```

Known demo build uses:

```text
FOCUSA_PUBLIC_NEWTAB=1
```

Do not infer that this flag belongs in private builds.

### 2.5 Fingerprint the artifact

```bash
find apps/workforce-extension/dist -type f -print0 \
  | sort -z \
  | xargs -0 sha256sum \
  > /tmp/workforce-dist.sha256

sha256sum /tmp/workforce-dist.sha256
```

If the live demo artifact can be safely fingerprinted through existing deployment tooling, compare it without exposing private files.

---

## 3. Migration choices

### Preferred: history-preserving extraction

If the extension has meaningful history in the Focusa object graph, extract it with `git filter-repo` or subtree tooling into a temporary migration repo, then push the resulting history into `Startempire-Wire/Focusa-Workforce-Extension`.

Example shape only; adapt to actual Git state:

```bash
git clone --no-local /home/wirebot/focusa-piext-sync /tmp/workforce-migrate
cd /tmp/workforce-migrate

git filter-repo \
  --path apps/workforce-extension/ \
  --path-rename apps/workforce-extension/:
```

Then inspect history and push only after confirming it does not carry unrelated/private content.

### Fallback: provenance-preserving source import

If no recoverable history exists:

1. copy the complete extension tree into the canonical repo;
2. add `docs/migration/source-provenance.md` containing:
   - source path;
   - source Focusa HEAD;
   - source worktree status;
   - artifact checksum;
   - migration date;
   - known deployed extension ID;
3. commit as a single explicit migration commit.

---

## 4. Required cleanup during migration

Do not refactor feature behavior until parity is proven, but remove/replace any repository-unsafe state:

- secrets/tokens;
- private API keys;
- machine-specific absolute paths;
- customer identifiers;
- public-demo credentials;
- server-local deployment assumptions.

Replace with documented environment/build configuration.

---

## 5. Parity gate

Before this repo becomes the canonical build source, prove:

```text
manifest valid
same intended extension identity
same expected entry surfaces
same startpage/new-tab behavior for demo profile
same Focusa connection behavior
same build output structure
same Veragensia demo activation path
no leaked secret/private state
```

Capture results under:

```text
docs/migration/parity-report.md
```

---

## 6. Cutover

After parity passes:

1. tag/import the recovered baseline here;
2. make new development occur only in this repo;
3. update Veragensia deployment tooling to clone/check out this repo or consume a versioned release artifact;
4. stop building from `/home/wirebot/focusa-piext-sync/apps/workforce-extension`;
5. keep the old worktree read-only temporarily for rollback/provenance;
6. remove it only after multiple successful release cycles and explicit approval.

Desired deployment relationship:

```text
Focusa-Workforce-Extension
        |
        +-- CI build/test
        +-- versioned artifact
                 |
                 +-- Chromebook private channel
                 +-- Veragensia demo channel
                 +-- future customer channels
```

---

## 7. Handoff prompt for the infrastructure-aware server build agent

```text
Recover and migrate the existing deployed Focusa Workforce Chrome/Chromium extension into the canonical GitHub repo Startempire-Wire/Focusa-Workforce-Extension.

The live source is believed to be /home/wirebot/focusa-piext-sync/apps/workforce-extension and Veragensia currently builds/deploys its dist/ to the os.focusa.dev Agent Computer demo. Preserve the existing extension identity ohfbbkpacpcapicpgplnnmifmlnmjggj if the current implementation is intentionally keyed that way.

Follow docs/01-source-recovery-and-migration-runbook.md in the new repo. First inventory Git ancestry/worktree/remotes and extension source. Prefer history-preserving extraction if actual commit history exists. Otherwise perform a provenance-documented source import. Reproduce the exact current build before refactoring. Never copy credentials, private tokens, customer data, or server-local secrets.

Produce:
1. recovered source in the new canonical repo;
2. source provenance report;
3. current feature/entrypoint inventory;
4. exact build instructions;
5. parity report against the currently deployed demo artifact/behavior;
6. proposed Veragensia deploy-script patch to consume this repo/versioned artifact instead of the old local worktree.

Do not redesign the extension during recovery. Parity first. Once parity is proven, continue against docs/00-workforce-canonical-product-and-implementation-spec.md.
```
