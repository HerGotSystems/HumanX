# D-127C Builder Truth Route Save

**Date:** 2026-06-14
**Branch:** `fix/d127c-builder-truth-route-save`
**Basis:** D-127B Claim Builder Client Prototype (PR #173, merge `bd7b206`).

---

## Scope

Wire up the Truth route button in the Claim Builder so it posts to the existing `/api/truths` endpoint. No backend changes, no schema changes, no D1 queries, no Wrangler, no deploy.

---

## Files Changed

| File | Change |
|---|---|
| `public/app-v10.js` | `renderBuilderStep2` truth-route note adds real button; `renderBuilderStep3` becomes route-aware; `submitBuilderTruth()` added; `window.submitBuilderTruth` export added |
| `public/styles.css` | `.builder-route-actions` and `.builder-truth-note` added |
| `docs/D127C_BUILDER_TRUTH_ROUTE_SAVE.md` | This file |
| `docs/README.md` | Updated current status pointer |

No changes to: worker, D1 schema, migrations, Belief Engine SPA, bridge payload, review/admin permission model, public write guardrails, RunPack flow.

---

## What Changed

### Step 2 — Truth-route note now has a real action button

When `claimBuilderRoute()` returns `'truth'`, the route note now includes:

```html
<div class="builder-route-actions">
  <button class="primary" onclick="submitBuilderTruth()">Save as Truth for Review</button>
</div>
```

Users can save immediately from Step 2 without proceeding to Step 3.

---

### Step 3 — Route-aware DECISION row and actions

`renderBuilderStep3()` now calls `claimBuilderRoute(_bs.flags)`:

**Truth route** (`route === 'truth'`):
- DECISION row shows both `looks like a Truth` and `Claim route available` badges
- `.builder-truth-note`: "Truth route records the original assertion for Review. It does not verify it as fact. You can also submit the cleaned claim instead."
- Actions: Back · **Save as Truth for Review** · Submit Claim for Review

**Claim route** (default):
- DECISION row shows `Submit as Claim for Review` badge (unchanged from D-127B)
- `.review-first-note`: "Enters admin Review before going public. Not visible until approved."
- Actions: Back · **Submit Claim for Review**

---

### `submitBuilderTruth()`

New async function. Uses `_bs.raw` (original user input) as the statement — Truth preserves the raw assertion, not the cleaned draft.

POST body to `/api/truths`:
```json
{
  "statement": "<_bs.raw>",
  "category": "<_bs.category or 'general'>",
  "origin": "Claim Builder raw thought",
  "truthType": "personal-belief" | "common",
  "confidenceLabel": "claimed"
}
```

`truthType`:
- `'personal-belief'` when route is `'truth'` (more truth-route flags than claim flags — input reads like a belief/value)
- `'common'` otherwise

On success: resets `_bs`, calls `loadGraphStatus()` + `renderTruths()`, shows toast "Saved as Truth for Review. It will appear publicly after approval."

Error translations:
- `TRUTH_TOO_SHORT` → "Truth statement is too short. Add a little more detail before submitting."
- `RATE_LIMITED` → "Too many submissions. Try again in about an hour."
- Fallback → raw error message or "Truth submission failed."

Review-first guaranteed — the existing `/api/truths` endpoint inserts with `review_state='review'`.

---

### `window.submitBuilderTruth` export

Added to line 215 exports alongside `submitBuilderClaim`.

---

### CSS additions (`styles.css`)

Two new rules after `.builder-route-truth`:

```css
.builder-route-actions{margin:6px 0 10px}
.builder-truth-note{color:var(--muted);font-style:italic;margin:6px 0 10px}
```

---

## Explicit No-Change Confirmations

| Area | Status |
|---|---|
| Worker (`src/worker.js`) | Not touched |
| D1 schema / migrations | Not touched |
| `/api/truths` endpoint | Used as-is; no changes |
| `/api/claims` endpoint | Not touched |
| Belief Engine SPA | Not touched |
| Bridge payload | Not touched |
| Review/admin permission model | Not touched |
| Public write guardrails | Not touched |
| RunPack flow | Not touched |
| `submitBuilderClaim()` | Unchanged |
| Review-first publication | Unchanged — `/api/truths` inserts with `review_state='review'` |

---

## Checks

```
node --check public/app-v10.js                →  syntax OK (exit 0)
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
node scripts/worker-route-static-check.mjs    →  56 passed, 0 failed
```

---

## Deploy Note

**Deploy required** (frontend assets changed). No worker or D1 changes — a standard `wrangler deploy` after this PR merges is sufficient.
