# D-312B — Belief Engine Export & Share Drift/Review Copy

**Scope:** Frontend (`public/apps/humanx-belief-engine/index.html`) + tests + docs
**Status:** LIVE (pending owner deploy)
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 78 → 104 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at implementation:** `0e50a22` (D-312A)

---

## D-312A Finding Addressed

D-312A's product pass found that the static "Export & Share" paragraph on the Belief Engine results page said the snapshot saves "to your **session**" — vague, and inconsistent with the rest of the app's vocabulary, which correctly uses **Drift** as the actual named destination (confirmed by `humanx-bridge.js`'s own injected note and post-click alert, both of which already say "Drift"). The paragraph also never mentioned Review at all, even though D-310B's Review sentence exists elsewhere on the same page, in an unrelated section ("What to Test Next," about converting a belief into a claim — not about the snapshot-save action). D-312B closes both gaps in the one static paragraph, without touching `humanx-bridge.js`.

---

## Implementation

**File changed:** `public/apps/humanx-belief-engine/index.html` only.

**Exact copy changed:**

| | Text |
|---|---|
| Before | `Download or copy your pressure map. "Send to HumanX" saves a snapshot to your session — it does not publish anything automatically.` |
| After | `Download or copy your pressure map. "Send to HumanX" saves a snapshot to your Drift — it does not publish anything automatically. Saving to Drift does not publish a Truth; any public display still waits for Review.` |

**Changes made:**
1. `"to your session"` → `"to your Drift"` — replaces vague destination wording with the app's actual named feature, matching `humanx-bridge.js`'s own injected note and post-click alert
2. Added one new sentence: `"Saving to Drift does not publish a Truth; any public display still waits for Review."` — a Review-gate reinforcement, worded differently from the D-310B sentence so the two don't read as duplicates

**Placement:** The edit is entirely inside the existing static `<p>` in the "Export & Share" `<section>` — no new element, card, or section was added.

---

## No New Card, No Results-Link Changes, No Bridge Changes

- **No new card added.** A regression test confirms `"Export &amp; Share"` appears exactly once in the file.
- **The three "What to Test Next" links are unchanged** — same targets, same `target="_blank"`, same order, same count.
- **`humanx-bridge.js` was not touched.** Regression tests confirm the bridge file still contains its pre-existing injected-note text (`"for your own review only"`) and its pre-existing `"Saved:"` list, unchanged — this is the closest static proof available that the file's content is identical to before this task, without a hash comparison.

---

## No Claim/Truth/RunPack Creation, No Fetch/Write/Save Behavior

The changed text is plain static copy — no link, no button, no `onclick`, no script reference. A regression test scans the exact new sentence text for `/api/belief-promote`, `/api/claims`, `/api/truths`, `/api/runpack`, `promoteBelief`, `generateRunPack`, `fetch(`, `localStorage`, and `sessionStorage` — none are present.

---

## No Backend/Schema/API/Storage Changes

- `src/worker.js` — not modified
- `humanx-bridge.js` — not modified
- No new API route, no new request/response shape
- The 77-statement flow, scoring, dimension weights, archetype matching, contradiction logic, and result generation — all unchanged

---

## Safety Copy Preserved

- `"No diagnosis."` — preserved
- `"Use it as a mirror, not a verdict."` — preserved
- D-306B boundary line: `"This is not a diagnosis, verdict, or proof — it is a reflection aid."` — preserved
- D-306B preview label `"Example — not your result"` — preserved
- D-310B Review handoff sentence (`"If you turn one belief into a HumanX claim, public display still waits for Review — admin approval, not automatic proof."`) — preserved, unchanged
- D-308B `← Back to HumanX` links — preserved on `screen-intro`/`screen-results`, confirmed still absent from `screen-identity`/`screen-timeline`/`screen-quiz`

The new sentence itself does not describe Belief Engine as diagnosis, proof, or verdict; does not imply the snapshot is public Truth; and does not imply Review is proof or verification — confirmed by regression tests scanning the new text for `"is proof"` and `"verified"`.

---

## CSS

**No CSS changes.** The edit is a text-only change inside an existing `<p>` element that already had its styling. No new class, no inline style change.

---

## Tests Added

26 new checks added to `scripts/belief-engine-static-check.mjs` in a new "D-312B: Export & Share Drift/Review copy" section, covering:

1. Export & Share copy contains the updated Drift/Review paragraph (exact text)
2. Copy mentions "Drift" as the save destination
3. Vague "your session" wording removed from the whole file
4. Copy mentions "Review"
5. Copy says saving does not publish a Truth
6. Copy does not claim Review is proof
7. Copy does not claim Review is verification
8. The change appears inside the existing Export & Share section (between the heading and the actions row)
9. "Export & Share" appears exactly once (no duplicate card)
10–12. All three existing "What to Test Next" links (`#claims`, `#submit`, `#truths`) preserved
13. Existing bridge/export script reference preserved
14–15. `humanx-bridge.js` still contains its pre-existing injected-note text and "Saved:" list, unchanged
16. No Claim/Truth/RunPack creation or fetch/write/save behavior in the new text
17. Existing D-310B Review handoff sentence preserved verbatim
18–22. Existing D-308B back links preserved on intro/results, confirmed still absent from identity/timeline/quiz
23. Existing D-306B preview label preserved
24. Existing `"No diagnosis."` copy preserved
25. Existing `"Use it as a mirror, not a verdict."` copy preserved
26. Existing D-306B boundary line preserved

Belief static check baseline: **78 → 104 passed, 0 failed** (+26 net).

**`scripts/hardening-smoke-test.mjs` was not modified** — per this repo's established convention, it tracks the main-app files only; Belief Engine frontend changes are tracked exclusively by `scripts/belief-engine-static-check.mjs`. Hardening smoke remains **3515 passed, 0 failed**, unchanged.

---

## Deploy

**Deploy needed.** `public/apps/humanx-belief-engine/index.html` was changed — this is a live frontend file. Owner deploy required before this reaches production. No migration, no Wrangler D1 command, no backend deploy step needed alongside it.

---

## Checks

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | 3515 passed, 0 failed (unchanged) |
| `node scripts/belief-engine-static-check.mjs` | 104 passed, 0 failed (78 → 104) |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A) |

---

## Files Changed

- `public/apps/humanx-belief-engine/index.html` — one paragraph tightened in the existing "Export & Share" section
- `scripts/belief-engine-static-check.mjs` — 26 new D-312B checks
- `docs/D312B_BELIEF_ENGINE_EXPORT_SHARE_DRIFT_REVIEW_COPY.md` — this doc
- `docs/README.md` — index updated

**Not modified:** `public/apps/humanx-belief-engine/humanx-bridge.js`, `public/app-v10.js`, `public/index.html`, `public/styles.css`, `public/belief-drift-expansion.js`, `src/worker.js`, `src/analysis-results.js`, `src/truths.js`, `scripts/hardening-smoke-test.mjs`, migrations.

---

## Summary

| Item | State |
|---|---|
| D-312A finding addressed | Yes — "Drift" replaces vague "session," and the paragraph now mentions Review |
| Exact copy | `"...saves a snapshot to your Drift — it does not publish anything automatically. Saving to Drift does not publish a Truth; any public display still waits for Review."` |
| Placement | Inside the existing "Export & Share" paragraph, no new card |
| Results links changed | No — all three preserved unchanged |
| `humanx-bridge.js` changed | No — untouched, confirmed by preserved-content tests |
| Claim/Truth/RunPack/fetch behavior | None — verified absent from the new text |
| Safety copy preserved | Yes — all pre-existing disclaimers confirmed unchanged |
| Backend/schema/API/storage changes | None |
| CSS changes | None |
| Tests | +26 new belief-engine checks, all passing; hardening suite untouched (not needed) |
| Deploy needed | Yes — `public/apps/humanx-belief-engine/index.html` changed |
