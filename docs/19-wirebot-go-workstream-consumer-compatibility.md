# Wirebot Go consumer adapter — reuse the WorkforceSnapshot, do not fork Workforce

**Status:** proposed integration supplement, read-only. Exact owner verification remains the responsibility of the Focusa/Core source adapter, not this client mapper.

The [canonical WorkforceSnapshot](05-extension-runtime-data-and-integration-contracts.md) already includes `workstreams`, `foremen`, `agents`, `work`, `attention`, `evidence`, `topology`, snapshot revision/freshness. The extension is a projection/intent client, not the authority for any of them. UIAI retains EPWA delivery/artifact authority and Focusa retains Workstream, review, completion and settlement.

`src/lib/go-read-projection.mjs` is a small bounded **pure projection** suitable for source contract regression. It accepts an already authorized WorkforceSnapshot and an exact `projectRef / workstreamRef / continuityId` selection; returns `wirebot.go.workstream_surface.v1` with no extra powers. It never contacts local Focusa or UIAI directly and never supplies a Go access token or URL. A consumer must not treat possession of this JSON as permission; each Go read is reauthorized in the owner adapter.

The mapper intentionally excludes agents/evidence belonging to other Workstreams and marks unknown delivery/review/settlement postures separately. The Go consumer may show the refs + freshness, but **never infer success** from an EPWA publication. No copied full MV3 application, no new Go Composer or independent Focusa/Workforce source.

**Blocked before production:** Focusa must offer an authoritative scoped evidence read (existing `evidence-trail.mjs` is a reference-only stopgap), Core must establish same-owner Go admission, and the UIAI EPWA source owner must confirm safe viewer handoffs. This commit is neither a backend bridge nor a live customer projection.

Test: `node --test tests/go-read-projection.test.mjs`.

Related: [Focusa Project Foreman spec 182](https://github.com/Startempire-Wire/focusa/blob/main/docs/182-focusa-project-foreman-workstream-intelligence-projection-spec.md); [EPWA state invariants](https://github.com/WPUIAI/uiai-engine/blob/main/docs/106o-uiai-evidence-pwa-autonomous-work-state-substrate-invariant.md); Wirebot Go Spec 49.