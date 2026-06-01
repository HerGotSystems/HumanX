# Belief Engine Static Check — Usage Guide

## 1. Purpose

This document explains how to safely run `scripts/belief-engine-static-check.mjs` —
the local static integrity check for the HumanX Belief Engine. It covers what the
script checks, what it does not check, how to invoke it, what a known-good result looks
like, and when to run it.

The script makes no network calls, causes no mutations, and does not require any
credentials or infrastructure access. It is safe to run at any time.

---

## 2. What the Script Checks

The script reads local frontend files as plain text and asserts that the following
markers are present and intact:

**Route and link markers:**
- Main app nav (`public/index.html`) contains `tab-belief` — the Beliefs tab element.
- Main app nav links to `/apps/humanx-belief-engine/` as the Belief Engine destination.
- `public/app-v10.js` home tile also links to `/apps/humanx-belief-engine/`.

**Drift full-profile classifier:**
- `public/app-v10.js` contains the `isFullBeliefProfile` function.
- The function includes at least one of the expected marker strings:
  `standalone-humanx-belief-engine`, `humanx-belief-engine`, `Belief Engine Profile`.

**Belief Engine content markers (`public/apps/humanx-belief-engine/index.html`):**
- `"Belief Engine"` identity marker in the page (title or heading).
- Questionnaire dimension markers: `"Reality & Existence"`, `"Truth & Evidence"`,
  `"Authority & Order"` (confirming questionnaire content is present).
- Result/profile section markers: `"Your Belief Architecture"`, `"Profile Snapshot"`.
- `humanx-bridge.js` is referenced via a `<script src>` tag.

**Bridge file markers (`public/apps/humanx-belief-engine/humanx-bridge.js`):**
- File exists and is readable.
- Contains the bridge/profile marker strings:
  `standalone-humanx-belief-engine`, `humanx-belief-engine`,
  `Belief Engine Profile`, `/api/belief-snapshots`.

**Security / accidental exposure checks:**
- Belief Engine HTML does not contain obvious API key markers:
  `sk-ant-`, `sk-proj-`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `Bearer `.
- Belief Engine HTML does not contain direct Anthropic or OpenAI provider endpoint URLs:
  `api.anthropic.com`, `api.openai.com`.

---

## 3. What the Script Does Not Check

- **Questionnaire completion** — no browser interaction is simulated; the script cannot
  verify that a user can navigate through all 77 statements.
- **Scoring correctness** — dimension weights, `CHOICE_SCALE`, `stabilityScore`,
  `opennessScore`, and `pressureScore` formulas are not exercised. See
  `docs/BELIEF_ENGINE_SCORING_NOTES.md` and `docs/BELIEF_ENGINE_TEST_PLAN.md`.
- **Contradiction logic** — no belief profiles are generated or compared.
- **Mobile layout** — no viewport simulation or CSS check is performed.
- **Live bridge POST** — the actual `POST /api/belief-snapshots` request is not sent;
  only the `<script src>` tag and bridge file marker strings are confirmed.
- **Saved profile appearing in Drift** — the live API round-trip from bridge to Drift
  display is not tested.
- **Backend or D1 behaviour** — no Worker routes are called; no database is touched.
- **Production deployment state** — the script reads local files only; it does not
  confirm that the live deployed Worker or frontend matches the local files.

---

## 4. How to Run

```
node scripts/belief-engine-static-check.mjs
```

No arguments. No environment variables. No gates. Safe to run from the repo root at any
time without side effects.

**Node version:** Node 18 or later (uses `fs/promises`).

---

## 5. Expected Known-Good Result

The last confirmed known-good result as of 2026-06-01:

```
Belief Engine Static Check
--------------------------
  PASS: public/index.html exists and is readable
  PASS: public/app-v10.js exists and is readable
  PASS: public/apps/humanx-belief-engine/index.html exists and is readable
  PASS: public/apps/humanx-belief-engine/humanx-bridge.js exists and is readable
  PASS: main app nav contains tab-belief
  PASS: main app nav links to /apps/humanx-belief-engine/
  PASS: app-v10.js Drift classifier contains expected full-profile marker string(s)
  PASS: app-v10.js contains isFullBeliefProfile function
  PASS: app-v10.js home tile links to /apps/humanx-belief-engine/
  PASS: Belief Engine HTML contains "Belief Engine" identity marker
  PASS: Belief Engine HTML contains questionnaire marker: "Reality & Existence"
  PASS: Belief Engine HTML contains questionnaire marker: "Truth & Evidence"
  PASS: Belief Engine HTML contains questionnaire marker: "Authority & Order"
  PASS: Belief Engine HTML contains result marker: "Your Belief Architecture"
  PASS: Belief Engine HTML contains result marker: "Profile Snapshot"
  PASS: Belief Engine HTML references humanx-bridge.js via script tag
  PASS: Belief Engine HTML does not contain API key marker: "sk-ant-"
  PASS: Belief Engine HTML does not contain API key marker: "sk-proj-"
  PASS: Belief Engine HTML does not contain API key marker: "ANTHROPIC_API_KEY"
  PASS: Belief Engine HTML does not contain API key marker: "OPENAI_API_KEY"
  PASS: Belief Engine HTML does not contain API key marker: "Bearer "
  PASS: Belief Engine HTML does not contain provider API URL: "api.anthropic.com"
  PASS: Belief Engine HTML does not contain provider API URL: "api.openai.com"
  PASS: humanx-bridge.js contains bridge/profile marker(s): "standalone-humanx-belief-engine", "humanx-belief-engine", "Belief Engine Profile", "/api/belief-snapshots"
--------------------------
  24 passed, 0 failed (24 hard checks)

  All hard checks passed.
```

**Exit code:** `0`

Full result record: `docs/BELIEF_ENGINE_STATIC_CHECK_RESULT.md`

---

## 6. Safety

| Property | Value |
|---|---|
| File access | Local reads only — `public/` files |
| Network calls | None |
| Production calls | None |
| D1 / Wrangler | Not used |
| Mutations | None — script is entirely read-only |
| Profile generation | None — no Belief Engine JS is executed |
| Admin token | Not required |
| Manual QA replacement | No — this does not replace `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` or browser-based Belief Engine QA |

---

## 7. When to Run

Run this check **before and after** any of the following changes:

- Any change to Belief Engine scoring logic, dimension weights, or `CHOICE_SCALE` in
  `public/apps/humanx-belief-engine/index.html`.
- Any change to contradiction rules or `isFullBeliefProfile` classification logic.
- Any change to the result or profile section UI in the Belief Engine.
- Any change to `public/apps/humanx-belief-engine/humanx-bridge.js` — particularly
  the `source`, `engineVersion`, or `label` payload fields.
- Any change to the Drift classification function in `public/app-v10.js`.
- Any file move, rename, or route/link change involving the Belief Engine path
  (`/apps/humanx-belief-engine/`).

All 24 hard checks must pass both before and after the change. A pre-change PASS
establishes the baseline; a post-change PASS confirms the structural markers survived.

---

## 8. Stop Conditions

Stop work and investigate before continuing if any of the following occur:

- **Any hard FAIL** — a marker the script expected to find is absent. The affected
  file and missing marker are printed clearly; resolve the failure before committing.
- **Bridge file missing unexpectedly** — `humanx-bridge.js` is referenced by the HTML
  but absent on disk; this is a packaging failure that must be resolved before any
  Belief Engine change.
- **Profile marker strings missing from bridge file** — `standalone-humanx-belief-engine`,
  `humanx-belief-engine`, `Belief Engine Profile`, or `/api/belief-snapshots` absent
  from `humanx-bridge.js`; the bridge payload fields that `isFullBeliefProfile` depends
  on may have changed.
- **Direct provider URL appears in Belief Engine frontend** — any `api.anthropic.com`
  or `api.openai.com` string found in the HTML is a hard FAIL and must be investigated
  immediately.
- **Frontend API key/secret marker appears** — any `sk-ant-`, `sk-proj-`,
  `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `Bearer ` string in the Belief Engine HTML
  is a hard FAIL; stop, do not commit, investigate the source.
- **Route or link to Belief Engine is broken** — `tab-belief` or
  `/apps/humanx-belief-engine/` missing from the main app; the Belief Engine would be
  unreachable from the main UI.
- **Any proposed fix requires Worker or D1 changes** — static check failures are always
  frontend file issues; if a fix seems to require touching `src/worker.js` or running
  Wrangler/D1, stop and re-evaluate.
