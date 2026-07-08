# D-306B — Belief Engine Intro Static Output Preview

**Scope:** Frontend (`public/apps/humanx-belief-engine/index.html`) + tests + docs
**Status:** LIVE (pending owner deploy)
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 24 → 44 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at implementation:** `0a54f93` (D-306A)

---

## D-306A Finding Addressed

D-306A's product pass found that Belief Engine's safety framing is already strong — "not a diagnosis," "mirror not a verdict," a bridge script that deliberately excludes raw free-text from the HumanX payload — with **zero safety-boundary violations**. The one real gap: a cold visitor is asked to invest 10–12 minutes across 77 statements with no visible preview of what the output looks like, the same shape of problem D-300A found (and D-300B fixed) on Home. D-306B implements the recommended fix: one small, static, clearly-labeled example preview on the Belief Engine intro screen.

---

## Implementation

**File changed:** `public/apps/humanx-belief-engine/index.html` only.

**Placement:** A new `<section class="panel compact-panel">` was inserted inside `#screen-intro`, directly after the `intro-stats` block (77 Statements / 19 Dimensions / 15 Archetypes / 36 Contradictions Checked) and directly before the `Begin Mapping` button (`onclick="startQuiz()"`) — i.e. the last thing a visitor sees before the CTA, and unambiguously before the 77-statement flow begins.

**Exact preview label:** `Example — not your result`

**Exact preview copy added:**

| Element | Text |
|---|---|
| Title | `Example — not your result` |
| Intro line | `After the questions, Belief Engine gives you a mirror-style snapshot like this.` |
| Mini-snapshot label | `Profile Snapshot` |
| Row 1 | `Strong signal: You prefer beliefs that can be tested.` |
| Row 2 | `Pressure check: Notice where social pressure makes a belief harder to question.` |
| Row 3 | `Next step: Turn one belief into a clearer claim before treating it as true.` |
| Boundary line | `This is not a diagnosis, verdict, or proof — it is a reflection aid.` |

All copy matches the task's suggested wording exactly — no rewording.

**No CSS changes.** The card reuses the existing `.panel`/`.compact-panel` classes already defined in this file's `<style>` block (used elsewhere for results-screen cards), plus inline styles matching the exact ad hoc pattern this file already uses for small muted text (e.g. the existing `.results-framing` paragraphs). No new class was added, and `public/styles.css` (the separate main-app stylesheet) was not touched.

---

## Placement Before the 77-Statement Flow

The preview sits inside the intro screen (`#screen-intro`), positioned in the HTML before the `Begin Mapping` button's `onclick="startQuiz()"` handler. A visitor cannot reach the questionnaire without scrolling past (or already having seen) the preview first. Verified by a dedicated static-check assertion comparing string indices: `screen-intro` position < preview position < `startQuiz()` position.

---

## Static-Only Behavior (Verified)

- No `<button>` element inside the preview
- No `onclick` handler inside the preview (no interactivity of any kind)
- No `fetch(` call inside the preview
- No `localStorage` or `sessionStorage` reference inside the preview
- No reference to `/api/belief-promote`, `/api/claims`, `/api/truths`, `/api/runpack`, `promoteBelief`, or `generateRunPack` inside the preview
- The preview is plain, inert markup — a heading, three paragraphs, and a `<ul>` of three illustrative lines

**Consequence:** the preview cannot send anything to HumanX, cannot create a Claim, Truth, or RunPack, and cannot save or persist anything. It has no behavior at all — it is read-only illustrative text.

---

## No Diagnosis / Proof / Verdict Claim

The preview's own boundary line — `"This is not a diagnosis, verdict, or proof — it is a reflection aid."` — states the same boundary already established elsewhere in the file (intro: `"No diagnosis."`; results: `"Use it as a mirror, not a verdict."`). Both of those pre-existing lines were left untouched and are now covered by new regression tests (see below) so they cannot regress silently in a future change.

---

## No Backend/Schema/API/Storage Changes

- `src/worker.js` — not modified
- `humanx-bridge.js` — not modified (bridge payload, data-minimization logic, and "Send to HumanX" behavior are all unchanged)
- No new API route, no new request/response shape
- The 77-statement flow, scoring, dimension weights, archetype matching, and contradiction logic — all unchanged
- `public/app-v10.js`, `public/index.html`, `public/styles.css` — not modified

---

## CSS

**No CSS changes.** `public/styles.css` (main app) was not touched. The Belief Engine's own embedded `<style>` block (inside `index.html`) was not touched either — the preview reuses `.panel`/`.compact-panel`, which already existed, plus inline styles.

---

## Tests Added

20 new checks added to `scripts/belief-engine-static-check.mjs` in a new "D-306B: intro static output preview" section, covering:

1. Preview label `Example — not your result` present
2. Preview intro line present
3. `Profile Snapshot` mini-snapshot label present
4–9. All three example rows present (`Strong signal` / copy, `Pressure check` / copy, `Next step` / copy)
10. Boundary line `not a diagnosis, verdict, or proof` present
11. Preview appears inside `#screen-intro`, before `onclick="startQuiz()"`
12. No `<button>` inside the preview
13. No `fetch(` inside the preview
14. No `onclick` inside the preview
15. No `localStorage` inside the preview
16. No `sessionStorage` inside the preview
17. No Claim/Truth/RunPack creation markers inside the preview
18. Existing `"No diagnosis."` intro copy still present
19. Existing `"Use it as a mirror, not a verdict."` results copy still present
20. Existing `77`-statement marker still present

Belief static check baseline: **24 → 44 passed, 0 failed** (+20 net).

**`scripts/hardening-smoke-test.mjs` was not modified.** Per this repo's convention, `hardening-smoke-test.mjs` tracks `public/app-v10.js`/`public/index.html`/`public/styles.css`/`src/worker.js` changes; Belief Engine frontend changes are tracked exclusively by `scripts/belief-engine-static-check.mjs`. Since D-306B touches only the standalone Belief Engine file, no hardening-suite update was needed or made. Hardening smoke remains **3515 passed, 0 failed**, unchanged.

---

## Deploy

**Deploy needed.** `public/apps/humanx-belief-engine/index.html` was changed — this is a live frontend file (served as a static asset alongside the rest of `public/`). Owner deploy required before this reaches production. No migration, no Wrangler D1 command, no backend deploy step needed alongside it.

---

## Checks

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | 3515 passed, 0 failed (unchanged) |
| `node scripts/belief-engine-static-check.mjs` | 44 passed, 0 failed (24 → 44) |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A) |

---

## Files Changed

- `public/apps/humanx-belief-engine/index.html` — intro-screen preview card added
- `scripts/belief-engine-static-check.mjs` — 20 new D-306B checks
- `docs/D306B_BELIEF_ENGINE_INTRO_STATIC_OUTPUT_PREVIEW.md` — this doc
- `docs/README.md` — index updated

**Not modified:** `public/app-v10.js`, `public/index.html`, `public/styles.css`, `public/belief-drift-expansion.js`, `humanx-bridge.js`, `src/worker.js`, `src/analysis-results.js`, `src/truths.js`, `scripts/hardening-smoke-test.mjs`, migrations.

---

## Summary

| Item | State |
|---|---|
| D-306A finding addressed | Yes — visitors now see an example before committing to the 77-statement flow |
| Placement | Inside intro screen, after stats, before "Begin Mapping" |
| Static only | Yes — no button/onclick/fetch/localStorage/sessionStorage |
| Claim/Truth/RunPack creation | Impossible — preview is inert text |
| Diagnosis/proof/verdict claim | None — explicit boundary line matches existing safety language |
| Backend/schema/API/storage changes | None |
| CSS changes | None — existing `.panel`/`.compact-panel` classes reused |
| Tests | +20 new belief-engine checks, all passing; hardening suite untouched (not needed) |
| Deploy needed | Yes — `public/apps/humanx-belief-engine/index.html` changed |
