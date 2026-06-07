# D-87C: Admin Review UI Spot-Check — Result

Date: 2026-06-07
Step: D-87C — manual admin review UI spot-check + CSS bug fix found during check
Type: Bug fix commit. Direct-main. No moderation actions. No D1. No Wrangler.

---

## Summary

D-87C was initiated as a manual browser spot-check of the D-87B review queue improvements.
During pre-check code review, a structural bug was found: the chip CSS introduced in D-87B
was placed inside `<noscript><style>` in `public/index.html`, making it unreachable for
all JS-enabled browsers (i.e., all real users).

The bug was fixed before any live UI check.

---

## Bug Found: CSS in Wrong Location

**Root cause:** The D-87B edit target was "before `</style>` (line 16)" in index.html.
Line 16 is inside the `<noscript>` fallback block's `<style>` tag, not a top-level `<style>`.
The CSS was inserted there, meaning it was only loaded when JavaScript is disabled.

**Effect:** All `.review-card-chips`, `.rc-chip`, `.rc-chip-origin-*`, `.rc-chip-dup`,
`.rc-chip-locked`, `.b-locked` rules were silently dead in normal use.
Chips still rendered in the DOM (JS correct) but had no styling — appearing as unstyled inline text.

**Fix:** Moved all 10 chip CSS rules to `public/styles.css`, appended after the existing
`@media(max-width:900px)` rule. Removed the misplaced block from index.html noscript.

---

## Files Changed

| File | Change |
|------|--------|
| `public/styles.css` | +12 lines — chip CSS rules appended |
| `public/index.html` | −10 lines — misplaced chip CSS removed from noscript block |

Net diff: 11 lines moved. No logic changes. No new rules added or removed.

---

## Static Checks After Fix

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | ✅ exit 0 |
| `scripts/hardening-smoke-test.mjs` | ✅ All hard checks passed |
| `scripts/belief-engine-static-check.mjs` | ✅ All hard checks passed |
| `scripts/worker-route-static-check.mjs` | ✅ All hard checks passed |

---

## Checklist (programmatic verification)

| # | Check | Result |
|---|-------|--------|
| 1 | `rc-chip` CSS present in `styles.css` | ✅ 7 occurrences |
| 2 | `rc-chip` CSS absent from `index.html` | ✅ 0 occurrences |
| 3 | `index.html` noscript block intact (text-only fallback) | ✅ |
| 4 | `app-v10.js` JS unchanged | ✅ |
| 5 | Static checks 127/24/39 | ✅ |
| 6 | No moderation POST issued | ✅ |
| 7 | No D1 writes | ✅ |
| 8 | Admin token not printed or committed | ✅ |

---

## Commit

`c6bb323` — "fix(D-87C): move chip CSS from noscript block to styles.css"
Pushed to `main` → live at `humanx.rinkimirikata.com` via Cloudflare Pages.

---

## Remaining Manual Verification

Chrome extension was unavailable for live screenshot verification. The following
items remain to be visually confirmed when the browser extension is next connected:

1. Card chip row renders with correct colours (origin/handle/dup/locked)
2. Filter chips "Dupes" and "Demo/Test" appear and filter correctly
3. Audit summary shows Demo/Test and Dupes stat cells
4. Inspect panel shows Status Lock and Origin fields
5. Existing filters (Pending/Public/Rejected/Reported/~Similar/~Quality/All) still work

No moderation action to be taken during that check.
