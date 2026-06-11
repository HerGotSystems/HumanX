# D-109A — Orphan Legacy Frontend Asset Cleanup Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no cleanup, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 372 / belief-engine-static-check 24 / worker-route-static-check 56

Confirms whether `public/app-v5.js`–`app-v9.js` (and the adjacent `app-v3.js`/`app-v4.js`) are truly orphaned and safe to delete in a follow-up cleanup (D-109B).

---

## A. Files Searched

- `git ls-files` for all `public/app-v*.js`
- `git grep -nIE "app-v[3-9]\.js"` repo-wide (HTML, docs, tests, scripts, worker)
- `public/index.html` script tag
- All `*.html` files repo-wide (which bundle each loads)
- `wrangler.toml` (asset serving config)
- `src/worker.js` (asset manifest / bundle references)
- `scripts/*` (test dependencies)

---

## B. Legacy Bundles Present

`git ls-files` shows **seven** versioned bundles tracked under `public/`:

```
public/app-v3.js   public/app-v4.js   public/app-v5.js   public/app-v6.js
public/app-v7.js   public/app-v8.js   public/app-v9.js   public/app-v10.js  ← current
```

The task scope is v5–v9; the audit also covers v3/v4, which are in the identical orphaned state.

---

## C. What Actually Loads

| Loader | Bundle loaded |
|---|---|
| `public/index.html:37` | **`app-v10.js?v=5`** — the only `<script>` in the served app |
| `public/apps/humanx-belief-engine/index.html` | no `app-v*` script (self-contained) |
| `arena/index.html`, `index.html`, `meta-tags.html` (repo root) | no `app-v*` script — and **outside `public/`**, so not served by the Worker (assets dir = `./public`) |

**Only `app-v10.js` is loaded/executed.** None of v3–v9 is referenced by any served HTML.

---

## D. Reference Sweep (every mention of app-v5..v9)

| Location | Nature | Live load? |
|---|---|---|
| `PROJECT_INDEX.md:46,52,85` | **Stale doc** — claims `index.html currently loads <script src="/app-v9.js?v=12">` | ❌ incorrect/outdated (real loader is `app-v10.js?v=5`) |
| `docs/D-108A-*.md` | The audit finding that flagged them | n/a |
| `docs/README.md` | D-108A checkpoint summary | n/a |

- `app-v3.js` / `app-v4.js`: referenced **nowhere**.
- No `*.html`, test script, `wrangler.toml`, or `src/worker.js` references any of v3–v9.

---

## E. Orphan Status Per File

| File | Loaded by HTML? | Referenced (non-doc)? | Orphan? | Safe to delete? |
|---|---|---|---|---|
| `public/app-v3.js` | ❌ | ❌ | ✅ yes | ✅ yes |
| `public/app-v4.js` | ❌ | ❌ | ✅ yes | ✅ yes |
| `public/app-v5.js` | ❌ | ❌ (doc only) | ✅ yes | ✅ yes |
| `public/app-v6.js` | ❌ | ❌ (doc only) | ✅ yes | ✅ yes |
| `public/app-v7.js` | ❌ | ❌ (doc only) | ✅ yes | ✅ yes |
| `public/app-v8.js` | ❌ | ❌ (doc only) | ✅ yes | ✅ yes |
| `public/app-v9.js` | ❌ | ❌ (stale PROJECT_INDEX.md only) | ✅ yes | ✅ yes |
| `public/app-v10.js` | ✅ `index.html` | ✅ many docs | **NO — current, keep** | ❌ do not delete |

All of v3–v9 are **orphaned**. They are served as static assets (reachable at e.g. `/app-v9.js`) but executed by nothing.

---

## F. Asset / Worker / Manifest Dependency

- `wrangler.toml`: `assets = { directory = "./public", binding = "ASSETS" }` — Cloudflare serves every file under `public/` by path; there is **no explicit manifest** listing individual bundles. Deleting files simply makes those paths 404 — no manifest to break.
- `src/worker.js`: **zero** references to any `app-v*` bundle. The Worker does not hard-code or expect any specific asset filename.
- **No test depends on v3–v9.** The only bundle a check touches is `node --check public/app-v10.js` (README known-good checks).

Deleting v3–v9 has no effect on the Worker, the asset binding, or any static check.

---

## G. Rollback / Debug History

- Every legacy bundle remains in **git history**; deletion from the working tree does not lose them — they are recoverable via `git show <rev>:public/app-v9.js` or checkout.
- There is no runtime rollback mechanism that points at the old paths (only `index.html`'s single `app-v10.js` tag), so removing the working-tree copies does not affect any rollback path.

---

## H. Findings

### F.1 — CONFIRMED: app-v3..v9 are orphaned and safe to delete
No served HTML loads them; no worker/test/manifest references them; git history preserves them. Deleting them removes dead bytes from the edge and eliminates the pre-D-104B unsanitised `href="${safe}"` pattern they carry (a hygiene/audit-confusion risk, not a live vuln — they cannot execute).

### F.2 — STALE DOC: `PROJECT_INDEX.md` incorrectly says `app-v9.js` is the loaded script
`PROJECT_INDEX.md` states `index.html currently loads <script src="/app-v9.js?v=12">`. This is **wrong** — `public/index.html` loads `app-v10.js?v=5`. This is a documentation-accuracy bug **independent of cleanup**, and it **must** be corrected as part of D-109B (otherwise deleting app-v9.js leaves a doc referencing a deleted, mis-described file).

---

## I. D-109B Deletion Recommendation

**RECOMMENDED.** Delete `public/app-v3.js` through `public/app-v9.js` (7 files: v3–v9), keep `app-v10.js`.

Suggested D-109B scope (cleanup task, branch + PR):
1. `git rm public/app-v3.js public/app-v4.js public/app-v5.js public/app-v6.js public/app-v7.js public/app-v8.js public/app-v9.js`
2. **Fix `PROJECT_INDEX.md`** to reflect the real loader (`app-v10.js?v=5`) — required, not optional (F.2).
3. Run the three static checks (counts must stay 372/24/56 — none reference the bundles).
4. Optionally add a hardening guard: `public/index.html` loads `app-v10.js` and no `app-v[3-9].js` file is tracked.
5. Record the cleanup in README/docs.

### Risks (all LOW)
| Risk | Assessment |
|---|---|
| Breaking the live app | None — `index.html` loads only `app-v10.js`; v3–v9 are not executed |
| Worker / asset manifest breakage | None — no manifest; worker references no bundle |
| Losing debug/rollback history | None — preserved in git history |
| Stale external bookmark to `/app-v9.js` | Negligible — would 404; nothing in-app links there |
| Doc drift | Mitigated by the required `PROJECT_INDEX.md` fix |

### Scope note
This audit performed **no deletion** (mode is audit-only). D-109B should be a small **cleanup** task explicitly authorised, since the standing rule is "no cleanup" without explicit request.

---

## J. No Mutation Confirmation

> No files were deleted or modified except this audit doc (created on commit by the follow-up checkpoint step, not by this audit's analysis).
> No Wrangler, D1, backend, schema, admin, token, or live mutation was performed.

---

## K. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **372 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
