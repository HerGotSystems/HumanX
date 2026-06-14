# D-128F Review UI Structured Builder Context

**Date:** 2026-06-14
**Branch:** `fix/d128f-review-ui-structured-builder-context`
**Basis:** D-128E Frontend structured payload merged.

---

## Scope

Review inspect panel UI only. No Worker change. No backend endpoint change. No D1 schema change. No deploy.

---

## Files Changed

| File | Change |
|---|---|
| `public/app-v10.js` | `reviewBuilderContextHtml()` updated to prefer structured path |
| `public/styles.css` | Added `.review-builder-source-badge` rule |
| `docs/D128F_REVIEW_UI_STRUCTURED_BUILDER_CONTEXT.md` | This file |
| `docs/README.md` | Updated current status pointer |

No changes to: `src/worker.js`, `src/truths.js`, `src/claim-builder-contexts.js`, migrations, any backend endpoint.

---

## `reviewBuilderContextHtml(item)` — Updated Logic

**Before (D-127D only):** always ran `parseClaimBuilderContext()` on plain-text `initialEvidence`.

**After (D-128F):** structured-first with legacy fallback.

```
1. Check item.claimBuilderContext || item.claim_builder_context
   → present and has rawText → render structured path
2. Fall back to parseClaimBuilderContext(item.initialEvidence || ...)
   → if null → return ''
   → else render legacy path
```

Both paths render the same `.review-builder-context` panel shape. The only visual difference is the source badge appended to the header.

---

## Source Badge

Appended after the existing `<span class="small">submission context</span>` in `.review-builder-head`.

| Path | Badge |
|---|---|
| Structured (`item.claimBuilderContext`) | `<span class="badge b-green review-builder-source-badge">structured</span>` |
| Legacy (`parseClaimBuilderContext`) | `<span class="badge b-yellow review-builder-source-badge">legacy parsed</span>` |

CSS added to `public/styles.css`:

```css
.review-builder-source-badge{font-size:9px;letter-spacing:.06em;padding:1px 5px;border-radius:4px;margin-left:auto}
```

`margin-left:auto` pushes the badge to the right end of the flex `.review-builder-head` row.

---

## Structured Path Field Mapping

| Display label | Source field on `item.claimBuilderContext` |
|---|---|
| ORIGINAL USER TEXT | `rawText` |
| WHY USER THINKS THIS | `whyUserThinksThis` |
| SCOPE | `scope` |
| PRESSURE / FALSIFIER | `pressureOrFalsifier` |
| SYSTEM FLAGS | `systemFlags` (array → badge per entry) |

Fields with empty/falsy values are omitted (same behaviour as legacy path).

---

## Legacy Path

Unchanged from D-127D. Fields: `original`, `why`, `scope`, `falsifier`, `flags` (comma-separated string → split to badges).

---

## What Is NOT Done Yet

| Item | Task |
|---|---|
| Deploy (D-128C through D-128F) | D-128H — pending owner authorisation |

---

## Checks

```
node --check public/app-v10.js                →  syntax OK (exit 0)
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node scripts/worker-route-static-check.mjs    →  56 passed, 0 failed
```
