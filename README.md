# Focusa Workforce

**Focusa Workforce** is the browser-resident command surface for a human-owned agent workforce: a Chrome/Chromium extension for seeing agents, directing work, reviewing evidence, handling approvals, and staying attached to the same governed Focusa work across local and remote computers.

The product name remains **Workforce**. This repository is its canonical home.

> **The extension is a window, not the runtime.**

Agents, Workstreams, Workpoints, authority, Evidence, Receipts, conversation state, and durable execution live in the systems that already own them. Workforce projects that reality into the browser and gives the operator one fast, inspectable place to work with it.

---

## Status

This repository is being established as the canonical source and release home for the existing Focusa Workforce extension.

A real Workforce extension already exists and is deployed in the Veragensia public Agent Computer demo at `https://os.focusa.dev`. The current Veragensia deployment tooling builds that extension from a private Focusa worktree and loads the resulting `dist/` directory into Chromium. The source must be recovered/migrated into this repository without inventing or replacing it.

Until that source migration lands, this repository should be treated as the canonicalization point for:

- the Workforce product identity;
- the extension source once recovered;
- build/test/release automation;
- Chromebook installation artifacts;
- extension-specific contracts and documentation;
- the curated upstream architecture corpus that governs this surface.

Do **not** create a second competing Workforce implementation merely because the currently deployed source is not yet present here.

---

## What Workforce is

Workforce is the browser-facing operating surface for collaborating with agents as a real workforce rather than as isolated chat sessions.

Its job is to let the operator answer, at a glance:

- What projects and Workstreams are active?
- Which Foremen, managers, workers, browser agents, and background sessions are working?
- What is each one responsible for?
- What is happening now?
- What is blocked or waiting for me?
- What evidence exists that the work actually happened?
- Which actions require approval?
- Which machine or runtime is doing the work?
- Can this work move to a better execution venue?
- What should I direct next?

The browser is therefore a **workforce operations surface**, while the product remains **Focusa Workforce**. The term **Cockpit** remains reserved for UIAI Engine's execution-control surface.

```text
                         HUMAN
                           |
                    Focusa Workforce
               Chrome / Chromium extension
                           |
        +------------------+------------------+
        |                  |                  |
     Direction          Oversight          Evidence
   typed / voice      agents / graph     audit / receipts
        |                  |                  |
        +------------------+------------------+
                           |
                        FOCUSA
          scope · Workstreams · Workpoints
        Foreman · Radar · authority · proof
                           |
             +-------------+-------------+
             |                           |
        VERAGENSIA                    UIAI ENGINE
   placement / enforcement       browser/computer work
   local + cloud bodies          observation + proof
             |                           |
             +-------------+-------------+
                           |
             Pi · Silent Sessions · workers
             workcells · Agent Apps · browsers
```

---

## Body-independent by design

Workforce is not tied to the Chromebook, browser, or any single computer body.

The persistent agent/work relationship lives above hardware. A Chromebook, conventional Linux computer, Full Veragensia Agent Computer, cloud Agent Computer, mobile/wearable surface, or future robotic/humanoid body may expose different capabilities while the same Focusa Workstreams, Foremen, evidence, authority, and relationship continuity remain intact.

Canonical embodiment semantics live upstream in:

- Focusa Spec 153B — Agent Embodiment, Body Profiles, and Cross-Body Continuity Addendum;
- Veragensia Doc 201 — Agent Body Profiles, Embodiment, and Transfer Addendum;
- Wirebot App Doc 10 — Body-Independent Partner Continuity Addendum.

Workforce should project body/runtime state when useful, but it must not create another body identity, transfer, or authority system.
