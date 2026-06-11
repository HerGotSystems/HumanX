# D-109B — Orphan Legacy Frontend Bundle Cleanup

**Date:** 2026-06-10
**Scope:** Static asset cleanup — delete unused `public/app-v3.js`–`app-v9.js`; correct `PROJECT_INDEX.md`; add guard tests + docs. No Worker, no D1, no Wrangler.
**Static baseline:** 372 / 24 / 56 → **375 / 24 / 56**
**Audit basis:** D-109A orphan legacy frontend assets audit

---

## Files Removed (`git rm`)

| File | Status before |
|---|---|
| `public/app-v3.js` | orphaned — referenced nowhere |
| `public/app-v4.js` | orphaned — referenced nowhere |
| `public/app-v5.js` | orphaned — doc references only |
| `public/app-v6.js` | orphaned — doc references only |
| `public/app-v7.js` | orphaned — doc references only |
| `public/app-v8.js` | orphaned — doc references only + stale PROJECT_INDEX.md |
| `public/app-v9.js` | orphaned — stale PROJECT_INDEX.md only |

**Kept:** `public/app-v10.js` — the only bundle loaded by `public/index.html`.

---

## Why They Were Safe to Remove

Per the D-109A audit:
- `public/index.html` loads **only** `app-v10.js?v=5` — no served HTML loads v3–v9.
- `wrangler.toml` serves `./public` by path with **no explicit manifest**; `src/worker.js` references **no** bundle. Deleting files just 404s those paths — nothing to break.
- **No test** depends on v3–v9 (only `node --check public/app-v10.js`).
- Every removed bundle remains in **git history** — rollback/debug recoverable via `git show <rev>:public/app-v9.js`.
- The removed bundles carried the **pre-D-104B** unsanitised `href="${safe}"` source pattern; deleting them removes dead, vulnerable-pattern bytes from the edge and prevents future audit confusion (they were never executable — not a live vuln).

---

## Current Loaded Bundle

```html
<!-- public/index.html -->
<script src="/app-v10.js?v=5"></script>
```

`public/app-v10.js` is the single, current, sanitised frontend bundle.

---

## PROJECT_INDEX Correction

`PROJECT_INDEX.md` was stale — it claimed `index.html` loads `<script src="/app-v9.js?v=12">` and described "current UI" via `app-v9.js`. Corrected to:
- Current active frontend: `public/app-v10.js`
- `public/index.html` loads `<script src="/app-v10.js?v=5"></script>`
- A note that legacy `app-v3.js`–`app-v9.js` were removed as orphaned static assets in D-109B (preserved in git history)
- The "Current UI" line now references `app-v10.js`

---

## Guard Tests Added (Section 50 — 3 new tests, 372 → 375)

| # | Test |
|---|---|
| 50.1 | `public/index.html` loads `app-v10.js` |
| 50.2 | Orphan `app-v3..v9` bundles no longer exist (via `existsSync`) |
| 50.3 | No served HTML (`index.html`) references any `app-v3..v9` bundle |

`existsSync` was added to the hardening-smoke imports. README hardening count updated to 375.

---

## Confirmation

| Check | Status |
|---|---|
| No runtime code behavior change intended | ✅ — only dead, unloaded files removed; `app-v10.js` untouched |
| No backend/Worker/schema changes | ✅ |
| No D1/admin/token/live/deploy mutation | ✅ |
| Rollback available | ✅ — all removed bundles preserved in git history |
| Stale doc corrected | ✅ — `PROJECT_INDEX.md` now points at `app-v10.js` |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 372 passed, 0 failed | **375 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 56 passed | **56 passed** |
