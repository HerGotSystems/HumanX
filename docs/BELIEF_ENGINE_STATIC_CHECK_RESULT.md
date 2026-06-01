# Belief Engine Static Check Result

## 1. Purpose

This file records the known-good result for the local static Belief Engine check run
by `scripts/belief-engine-static-check.mjs`. It establishes the baseline against which
future runs can be compared, and confirms that the core structural markers, nav links,
bridge references, and absence of frontend secrets/provider-call strings were all
verified before any Belief Engine change was made.

See `docs/BELIEF_ENGINE_STATIC_CHECK_SPEC.md` for the full specification.

---

## 2. Test Context

| Field | Value |
|---|---|
| Script | `scripts/belief-engine-static-check.mjs` |
| Date | 2026-06-01 |
| Check type | Local static file read — no execution of frontend JS |
| Files checked | `public/index.html`, `public/app-v10.js`, `public/apps/humanx-belief-engine/index.html`, `public/apps/humanx-belief-engine/humanx-bridge.js` |
| Network calls | None |
| Production calls | None |
| D1 / Wrangler | Not used |

---

## 3. Summary

| Metric | Value |
|---|---|
| Hard checks passed | **24** |
| Hard checks failed | **0** |
| Warnings | **0** |
| Exit code | **0** |

---

## 4. Confirmed Static Checks

- [x] `public/index.html` exists and is readable.
- [x] `public/app-v10.js` exists and is readable.
- [x] `public/apps/humanx-belief-engine/index.html` exists and is readable.
- [x] `public/apps/humanx-belief-engine/humanx-bridge.js` exists and is readable.
- [x] Main app nav contains `tab-belief`.
- [x] Main app nav links to `/apps/humanx-belief-engine/`.
- [x] `app-v10.js` Drift classifier contains expected full-profile marker string(s).
- [x] `app-v10.js` contains `isFullBeliefProfile` function.
- [x] `app-v10.js` home tile links to `/apps/humanx-belief-engine/`.
- [x] Belief Engine HTML contains `"Belief Engine"` identity marker.
- [x] Belief Engine HTML contains questionnaire marker: `"Reality & Existence"`.
- [x] Belief Engine HTML contains questionnaire marker: `"Truth & Evidence"`.
- [x] Belief Engine HTML contains questionnaire marker: `"Authority & Order"`.
- [x] Belief Engine HTML contains result marker: `"Your Belief Architecture"`.
- [x] Belief Engine HTML contains result marker: `"Profile Snapshot"`.
- [x] Belief Engine HTML references `humanx-bridge.js` via script tag.
- [x] Belief Engine HTML does not contain API key marker: `"sk-ant-"`.
- [x] Belief Engine HTML does not contain API key marker: `"sk-proj-"`.
- [x] Belief Engine HTML does not contain API key marker: `"ANTHROPIC_API_KEY"`.
- [x] Belief Engine HTML does not contain API key marker: `"OPENAI_API_KEY"`.
- [x] Belief Engine HTML does not contain API key marker: `"Bearer "`.
- [x] Belief Engine HTML does not contain provider API URL: `"api.anthropic.com"`.
- [x] Belief Engine HTML does not contain provider API URL: `"api.openai.com"`.
- [x] `humanx-bridge.js` contains all four bridge/profile markers: `"standalone-humanx-belief-engine"`, `"humanx-belief-engine"`, `"Belief Engine Profile"`, `"/api/belief-snapshots"`.

---

## 5. Safety Meaning

This result proves that:

- The core structural markers are intact: the main app nav links to the Belief Engine,
  the `isFullBeliefProfile` Drift classifier is present with its expected marker strings,
  the Belief Engine HTML has questionnaire and result section content, and
  `humanx-bridge.js` is referenced by a script tag and contains the four payload field
  strings the bridge uses.
- No obvious frontend API key strings or direct provider endpoint URLs (`api.anthropic.com`,
  `api.openai.com`) are present in the Belief Engine HTML.

This check is safe because it only reads local files. It makes no network calls, creates
no database rows, touches no live infrastructure, and does not execute any frontend
JavaScript.

---

## 6. What This Does Not Prove

- Does not prove a user can complete the questionnaire — no browser interaction was
  simulated.
- Does not prove scoring correctness — dimension weights, `CHOICE_SCALE`, and score
  formulas were not exercised; see `docs/BELIEF_ENGINE_SCORING_NOTES.md` and
  `docs/BELIEF_ENGINE_TEST_PLAN.md`.
- Does not prove contradiction logic — no profiles were generated or compared.
- Does not prove mobile layout — no viewport or CSS check was performed.
- Does not prove the bridge `POST /api/belief-snapshots` request succeeds — only the
  `<script src>` tag presence and the bridge file's marker strings were confirmed.
- Does not prove that Drift correctly receives or displays a saved full profile — the
  live API round-trip was not tested.
- Does not replace `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` or manual Belief Engine
  QA in a real browser.

---

## 7. Recommended Use

Run this check before and after any Belief Engine scoring, contradiction, UI, bridge,
or Drift-classification change:

```
node scripts/belief-engine-static-check.mjs
```

All 24 hard checks must pass before and after any such change. A failure in the
post-change run should block the commit until the broken marker is restored or the spec
is updated to reflect a deliberate structural change.

---

## 8. Maintenance Rule

Create a new dated result file or update this file only after an explicitly run local
static check. Do not estimate or backfill results. Each result must record the check
count, the date, and what was and was not confirmed.
