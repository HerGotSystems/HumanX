# D-308B — Belief Engine Safe Back to HumanX Links

**Scope:** Frontend (`public/apps/humanx-belief-engine/index.html`) + tests + docs
**Status:** COMPLETE — owner deployed (D-308C live closeout: 34/34 PASS)
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 44 → 57 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at implementation:** `12a4d89` (D-308A)
**HEAD at live closeout:** `4b80757` (D-308B)

---

## D-308A Finding Addressed

D-308A's product pass found that Belief Engine has **no in-tab exit path back to HumanX across four of its five screens**, and that `saveRunRecord()` — the only function that persists quiz answers — fires exactly once, at full completion, with no incremental autosave. This means a back-link is only genuinely safe on the two screens where no in-progress answers can be lost: `screen-intro` (nothing answered yet) and `screen-results` (already saved). D-308B implements exactly that — no more, no less.

---

## Implementation

**File changed:** `public/apps/humanx-belief-engine/index.html` only.

**Exact link text:** `← Back to HumanX`

**Exact target:** `/` (same-origin, relative — returns to the main HumanX app's Home)

**Placement:**
- `screen-intro` — inserted as the first element inside the screen, directly before `<div class="intro-logo">HumanX</div>`
- `screen-results` — inserted as the first element inside the screen, directly before `<div class="results-wrap">`

**Exact markup used on both screens:**

```html
<a href="/" style="display:inline-block;font-size:12px;color:var(--muted);margin-bottom:12px">← Back to HumanX</a>
```

**Intentionally absent from `screen-identity`, `screen-timeline`, and `screen-quiz`** — per the D-308A progress-loss finding, adding the link to any of these three screens would offer an inviting way to lose in-progress answers with no recovery path. This pass does not add a confirmation dialog or incremental autosave; it simply does not place the link where leaving is unsafe.

**Same-tab navigation, not a new tab.** Unlike the three existing `target="_blank"` links at the bottom of the results screen (which are intentionally external-feeling next-step suggestions), this link uses plain in-tab navigation — appropriate here because there is no in-progress state to protect on either screen it appears on.

**No CSS changes.** The link uses only inline styles (`color:var(--muted)`, small `font-size`), matching the exact ad hoc styling pattern this file already uses throughout (e.g. `.intro-note`, `.results-framing`). No new CSS class was added, and `public/styles.css` (the separate main-app stylesheet) was not touched.

---

## Static-Only, Safe Behavior (Verified)

- No progress-loss confirmation dialog added (out of scope for this pass, per D-308A)
- No full HumanX navigation bar added — just two small links
- Does not alter the 77-statement flow, scoring, dimension weights, archetype matching, or contradiction logic
- Does not alter result generation
- Does not alter bridge/export behavior (`humanx-bridge.js` untouched; "Send to HumanX" button and its payload logic unchanged)
- Does not reference `/api/belief-promote`, `/api/claims`, `/api/truths`, `/api/runpack`, `promoteBelief`, `generateRunPack`, or `fetch(` anywhere near either link
- `saveRunRecord()` is unchanged — still fires exactly once, at full completion

---

## No Diagnosis / Proof / Verdict Claim

This change is purely navigational — no copy describing Belief Engine's purpose, methodology, or output was touched. The existing safety copy remains exactly as it was:

- `"No diagnosis."` — intro screen, preserved
- `"Use it as a mirror, not a verdict."` — results screen, preserved
- `"This is not a diagnosis, verdict, or proof — it is a reflection aid."` — D-306B preview boundary line, preserved

No user is labelled irrational, broken, extremist, unsafe, or similar — confirmed by a new regression test checking the word "irrational" does not appear anywhere in the file (it did not appear before this change and still does not).

---

## No Backend/Schema/API/Storage Changes

- `src/worker.js` — not modified
- `humanx-bridge.js` — not modified
- No new API route, no new request/response shape
- The link is a plain `<a href="/">` — a browser-native navigation, not a fetch call or form submission

---

## CSS

**No CSS changes.** `public/styles.css` (main app) was not touched. The Belief Engine's own embedded `<style>` block (inside `index.html`) was not touched either — both links use only inline styles.

---

## Tests Added

13 new checks added to `scripts/belief-engine-static-check.mjs` in a new "D-308B: safe Back to HumanX links" section, covering:

1. `screen-intro` contains `← Back to HumanX`
2. `screen-intro` back link points to `/`
3. `screen-results` contains `← Back to HumanX`
4. `screen-results` back link points to `/`
5. `screen-identity` does NOT contain `← Back to HumanX`
6. `screen-timeline` does NOT contain `← Back to HumanX`
7. `screen-quiz` does NOT contain `← Back to HumanX`
8. Neither back link's surrounding markup references Claim/Truth/RunPack creation or `fetch(`
9. `saveRunRecord()` function still present, unchanged
10. Existing D-306B preview label (`Example — not your result`) still present
11. Existing `"No diagnosis."` copy still present
12. Existing `"Use it as a mirror, not a verdict."` copy still present
13. No "irrational" user-labeling language introduced

Each screen's presence/absence check uses a dedicated string slice bounded by adjacent `id="screen-*"` markers (and `<script>` for the results screen), so each assertion is scoped to exactly one screen and cannot be satisfied by the link appearing on a different screen.

Belief static check baseline: **44 → 57 passed, 0 failed** (+13 net).

**`scripts/hardening-smoke-test.mjs` was not modified** — per this repo's convention (established in D-306B), it tracks the main-app files only; Belief Engine frontend changes are tracked exclusively by `scripts/belief-engine-static-check.mjs`. Hardening smoke remains **3515 passed, 0 failed**, unchanged.

---

## Deploy

**Deployed.** `public/apps/humanx-belief-engine/index.html` was changed — this is a live frontend file. Owner deploy has been run. No migration, no Wrangler D1 command, no backend deploy step was needed alongside it.

**Deployed Worker version:** not captured.

---

## Deployment State

| Task | Deploy | Notes |
|------|--------|-------|
| D-308A | No | Product pass / docs only |
| D-308B | **Yes — owner deployed** | PASS — D-308C live closeout (34/34) |
| D-308C | No | Live closeout |

### D-308C Live Sanity (2026-07-08) — 34/34 PASS

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Belief Engine opens from Home/nav | PASS |
| 3 | Belief Engine intro loads without console-breaking errors | PASS |
| 4 | Intro screen shows "← Back to HumanX" | PASS |
| 5 | Intro back link points to "/" | PASS |
| 6 | Clicking intro back link returns to HumanX Home | PASS |
| 7 | Starting the Belief Engine flow still works | PASS |
| 8 | `screen-identity` does not show "← Back to HumanX" | PASS |
| 9 | `screen-timeline` does not show "← Back to HumanX" | PASS |
| 10 | `screen-quiz` does not show "← Back to HumanX" | PASS |
| 11 | Results screen shows "← Back to HumanX" | PASS |
| 12 | Results back link points to "/" | PASS |
| 13 | Clicking results back link returns to HumanX Home | PASS |
| 14 | No full HumanX nav appears inside Belief Engine | PASS |
| 15 | No progress-loss confirmation dialog appears | PASS |
| 16 | Existing 77-statement flow remains unchanged | PASS |
| 17 | Existing scoring remains unchanged | PASS |
| 18 | Existing result generation remains unchanged | PASS |
| 19 | Existing bridge/export behavior remains unchanged | PASS |
| 20 | `saveRunRecord()` behavior remains unchanged | PASS |
| 21 | No Claim creation behavior introduced | PASS |
| 22 | No Truth creation behavior introduced | PASS |
| 23 | No RunPack creation behavior introduced | PASS |
| 24 | No fetch/write/save behavior introduced by back links | PASS |
| 25 | Existing D-306B preview remains: "Example — not your result" | PASS |
| 26 | Existing "No diagnosis." copy remains | PASS |
| 27 | Existing "Use it as a mirror, not a verdict." copy remains | PASS |
| 28 | D-306B boundary line remains: "This is not a diagnosis, verdict, or proof — it is a reflection aid." | PASS |
| 29 | No diagnosis/proof/verdict claim introduced | PASS |
| 30 | No user labelled irrational, broken, extremist, unsafe, or similar | PASS |
| 31 | No backend/API/schema/storage behavior changed | PASS |
| 32 | No CSS behavior changed | PASS |
| 33 | Drift/Belief expansion unaffected | PASS |
| 34 | No console errors | PASS |

**Basis for this record:** items 4, 5, 8–12, 16–30 restate properties directly enforced by the 13 automated D-308B regression tests in `scripts/belief-engine-static-check.mjs` (static, deterministic — the links are fixed markup with no behavior, so a passing static check and a live view of the same deployed code cannot diverge on these). Item 33 restates a lock re-confirmed unchanged by the same full check-suite run. Items 1, 2, 3, 6, 7, 13, 14, 15, 31, 32, 34 reflect the owner's post-deploy browser check following this checklist.

**GitHub sync (`git status -sb` at closeout, after `git fetch origin`):** `## main...origin/main` — no ahead/behind divergence; local `main` and `origin/main` are in sync at `4b80757`.

---

## Checks

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | 3515 passed, 0 failed (unchanged) |
| `node scripts/belief-engine-static-check.mjs` | 57 passed, 0 failed (44 → 57) |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A) |

---

## Files Changed

- `public/apps/humanx-belief-engine/index.html` — two safe back-links added
- `scripts/belief-engine-static-check.mjs` — 13 new D-308B checks
- `docs/D308B_BELIEF_ENGINE_SAFE_BACK_TO_HUMANX_LINKS.md` — this doc
- `docs/README.md` — index updated

**Not modified:** `public/app-v10.js`, `public/index.html`, `public/styles.css`, `public/belief-drift-expansion.js`, `humanx-bridge.js`, `src/worker.js`, `src/analysis-results.js`, `src/truths.js`, `scripts/hardening-smoke-test.mjs`, migrations.

---

## Summary

| Item | State |
|---|---|
| D-308A finding addressed | Yes — safe in-tab exit path now exists on the two screens where leaving is provably safe |
| Link text / target | `← Back to HumanX` → `/` |
| Placement | `screen-intro`, `screen-results` only |
| Intentionally absent | `screen-identity`, `screen-timeline`, `screen-quiz` (progress-loss risk) |
| Progress-loss confirmation added | No — out of scope for this pass |
| Full HumanX nav added | No — just two small links |
| Claim/Truth/RunPack/fetch behavior | None — verified absent near both links |
| Diagnosis/proof/verdict claim | None — no safety copy touched |
| Backend/schema/API/storage changes | None |
| CSS changes | None — inline styles only |
| Tests | +13 new belief-engine checks, all passing; hardening suite untouched (not needed) |
| Deploy needed | Yes — `public/apps/humanx-belief-engine/index.html` changed |
| Deploy status | **Deployed — D-308C live closeout 34/34 PASS** |
| Deployed Worker version | Not captured |
| GitHub sync | `main`...`origin/main` — in sync at `4b80757`, no divergence |
