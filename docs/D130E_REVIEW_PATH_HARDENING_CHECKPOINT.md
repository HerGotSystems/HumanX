# D-130E — Review Path Hardening Checkpoint

**Date:** 2026-06-15
**Chain:** D-130A → D-130B → D-130C → D-130D → D-130E (this doc)
**Scope:** Hardening, docs, and tests only. No D1 schema changes. No frontend layout changes. No route or response shape changes. The only runtime change is the safe `whyUserThinksThis` fallback fix in D-130C.

---

## Summary of the D-130 Chain

### D-130A — Read-only production hardening audit
Full audit of Admin Review and Claim Builder path across `public/app-v10.js`, `public/styles.css`, `src/worker.js`, `src/claim-builder-contexts.js`, and `scripts/hardening-smoke-test.mjs`. No FAIL items. Nine areas checked (frontend assumptions, API route match, builder context write/read, moderation actions, XSS/escaping, D1 assumptions, test coverage, mobile CSS, stale docs). Found three actionable WARNs addressed in D-130B/C/D; remaining WARNs are by-design or cosmetic (see below).

### D-130B — Review queue cap behaviour comment + tests
Added an inline comment to `reviewQueue()` in `src/worker.js` explaining:
- Each source query (claims, truths, evidence, pressure) is individually capped at `LIMIT 100`
- Combined array is globally sorted descending by `updated_at` (falls back to `created_at` — evidence rows always use `created_at` because the evidence table has no `updated_at` column)
- Final `.slice(0,100)` is intentional — keeps payload small; older items are reachable via type-specific filters on the frontend
Added 5 smoke tests (Section 46) verifying the cap/sort/slice behaviour and that no new `/api/review/*` route was introduced.

### D-130C — Builder context `why`-field hardening
Fixed a latent typo in `cleanClaimBuilderContext()` in `src/claim-builder-contexts.js`:
- Added correct camelCase `raw.whyUserThinksThis` as the primary fallback before the legacy typo `raw.whyUserThinkThis` (missing `s`)
- Both fallbacks retained for backward compatibility; existing frontend sends `why` which hits the fourth fallback — behaviour unchanged in production
- Added inline comment on `final_claim` explaining that `finalClaim` currently mirrors `draftClaim` (no separate finalization step exists yet); retained for schema/API compatibility
Added 7 smoke tests (Section 47) verifying all four fallbacks, correct ordering, comment presence, and that `mapClaimBuilderContext` still returns the correct `whyUserThinksThis` key.

### D-130D — Review escaping regression tests
Added 7 smoke tests (Section 48) locking down the existing correct escaping behaviour in the review path:
- `resolveSimilarUI`: `esc(nearDup)` present; raw `${nearDup}` interpolation absent
- `renderReviewInspectContext`: `esc(k)`/`esc(v)` on all row pairs; `esc(String(f))` on each builder flag; `esc(trunc(...))` on builder rawText/original
- `reviewCard`: `esc(item.latest_report_reason)` present; raw interpolation absent
No runtime code was changed — all tests passed against the existing implementation.

---

## Files Touched Across D-130

| File | Change |
|------|--------|
| `src/worker.js` | D-130B: inline comment in `reviewQueue()` |
| `src/claim-builder-contexts.js` | D-130C: `whyUserThinksThis` fallback prepended; `finalClaim` comment added |
| `scripts/hardening-smoke-test.mjs` | D-130B/C/D: Sections 46/47/48 (+19 tests); `cbcSrc` source loader added |
| `docs/D130E_REVIEW_PATH_HARDENING_CHECKPOINT.md` | D-130E: this doc |
| `docs/README.md` | D-130E: ⭐ CURRENT pointer + smoke count updated |

**Not changed:** `public/app-v10.js`, `public/styles.css`, any Worker route, any D1 schema or migration, any public-facing page.

---

## Final Test Baseline

```
node --check public/app-v10.js              → SYNTAX OK
node scripts/hardening-smoke-test.mjs       → 498 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed
```

---

## Remaining Known WARNs (by design or cosmetic)

| Warn | Area | Status |
|------|------|--------|
| Combined review queue slices to 100 | `src/worker.js/reviewQueue` | **By design** — now documented with inline comment (D-130B) |
| Evidence rows sort by `created_at` (no `updated_at` column) | `src/worker.js/reviewQueue` | **By design** — pre-existing schema limitation; now documented (D-130B) |
| `finalClaim` mirrors `draftClaim` (no separate finalization step) | `src/claim-builder-contexts.js` | **Known limitation** — now documented with inline comment (D-130C); no consumer relies on them differing |
| `.review-overview-strip` pills dense on 375px mobile | `public/styles.css` | **Cosmetic / admin-only** — flex-wrap provides reflow; no fix needed |
| `.layout` 280px fixed casefile column tight on 600–700px | `public/styles.css` | **Cosmetic / admin-only** — no change needed |
| `markDuplicate` silently only handles claims | `src/worker.js` | **Acceptable** — frontend already guards the button behind `!isTruth&&!isEvidence&&!isPressure`; documented in D-130A |

---

## What Was NOT Changed in D-130

- No D1 schema changes
- No migration files created or applied
- No Worker route added, modified, or removed
- No frontend layout or behaviour changed
- No public-facing page affected
- No auth/token logic changed
- No scoring logic changed

---

## Owner Smoke Checklist

Run after `npx wrangler deploy` if deploying D-130C (`whyUserThinksThis` fix is the only runtime change — it is backward-safe and affects new structured builder context submissions only).

- [ ] Open production site — public pages load normally
  - https://humanx.rinkimirikata.com
  - https://humanx.veltrusky-michal.workers.dev
- [ ] Open Admin Review, enter token → queue loads
- [ ] Inspect a claim with Claim Builder context → right panel shows structured builder section (why/scope/falsifier still visible)
- [ ] Inspect an item without builder context → right panel shows no-builder-context placeholder
- [ ] Approve / Keep Pending / Reject an item → queue refreshes, page stays near the moderated card
- [ ] Mark Duplicate on a claim item → modal appears, can enter target ID, confirm works
- [ ] Open a public claim page → loads correctly
- [ ] Open a public study/truth page → loads correctly

---

## Deploy Command

```
npx wrangler deploy
```

No D1 migration required.

---

## Production URLs

- https://humanx.rinkimirikata.com
- https://humanx.veltrusky-michal.workers.dev
