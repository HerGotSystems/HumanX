# D-108A — Final Source-Safety Regression Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 372 / belief-engine-static-check 24 / worker-route-static-check 56

Final regression sweep across the repo for any source/url/citation render or persistence path that bypasses the safe helpers (`sourceLink` → `safeHttpUrl` on the frontend, `httpUrlOrNull` on the Worker).

---

## A. Files Read / Searched

- `git grep` for `href=` across all `public/*.js` + `public/*.html` + `public/apps/**`
- `git grep` for `source_url` / `sourceUrl` / `source` / `citation` / `url` across `src/` and live frontend
- `public/app-v10.js` — `evidenceCard`, `evidenceItem`, `reusedItemCompact`, `renderReviewInspectPanel`, `sourceLink`, `safeHttpUrl`, `addCaseItem`, `downloadRunPack`, `renderHome`
- `src/worker.js` — `addEvidence` (`/api/evidence`), `insertEvidence`, `reviewQueue`, `claimDetail`, `claimLineage`, `buildRunPack`/`createAipPacket`
- `src/belief-bridge.js`, `src/evidence-vault.js`, `src/importer.js`, `src/seed-data.js`

---

## B. Raw `href` Inventory

### Frontend (live app — `app-v10.js`)
**Exactly one `href=` construction in the entire file:**

| # | Location | Value | Classification |
|---|---|---|---|
| 1 | `sourceLink` safe branch | `href="${e}"` where `e = esc(safeHttpUrl(raw))` | ✅ **sanitised** — only reached when `safeHttpUrl` approved an http/https scheme; escaped |

Plus `downloadRunPack`: `a.href = URL.createObjectURL(blob)` — a property assignment to a local blob URL for file download; not user-controlled, not the `href="` injection pattern. ✅ safe.

### `index.html`
| href | Classification |
|---|---|
| `/styles.css?v=10` | ✅ static internal asset |
| `https://humanx.rinkimirikata.com` (noscript) | ✅ static, hardcoded |

### Belief Engine (`public/apps/humanx-belief-engine/index.html`)
No `href=` matches — self-contained SPA using buttons/JS navigation. ✅

### Stale orphan files (see Finding D.1)
`public/app-v5.js`–`app-v9.js` contain `href="${safe}"` (the **pre-D-104B** unsanitised pattern). **Not referenced by any HTML** (`index.html` loads only `app-v10.js`).

**Conclusion:** the live app has a single, sanitised source `href` path. No user-controlled value reaches an `href` outside `sourceLink`/`safeHttpUrl`.

---

## C. Source-like Field Inventory (render paths)

| Render path | File:fn | Uses safe helper? |
|---|---|---|
| Vault evidence card | `app-v10.js` `evidenceCard` | ✅ `sourceLink(e.sourceUrl||e.source_url)` |
| Study evidence row | `app-v10.js` `evidenceItem` | ✅ `sourceLink(e.source_url||e.sourceUrl)` |
| Reused compact row | `app-v10.js` `reusedItemCompact` | ✅ `sourceLink(e.source_url||e.sourceUrl)` |
| **Admin Review inspect** | `app-v10.js` `renderReviewInspectPanel` | ✅ `sourceLink(item.source_url)` (D-107B) |

**All four evidence-source render paths route through `sourceLink`.** No divergent render path remains.

---

## D. Backend Write-Path Confirmation

| Write path | File | source_url value | Verdict |
|---|---|---|---|
| `POST /api/evidence` (`addEvidence`) | `worker.js:83` | `httpUrlOrNull(body.sourceUrl)` | ✅ validated (D-104F) |
| `insertEvidence` (shared insert) | `worker.js:161` | binds the value passed by caller | ✅ callers validate (see below) |
| Belief promote → evidence | `belief-bridge.js:132` | **literal `''`** ("Belief snapshot origin", auto-generated; no user URL) | ✅ no user-controlled URL |
| Seed import | `importer.js` | owner-controlled seed JSON + SOURCE_NEEDED presence guard | ✅ lower-risk, documented; not user input |
| Seed data | `seed-data.js` | hardcoded owner `https://…` URLs | ✅ static, owner-controlled |
| Pressure (`/api/pressure`) | `worker.js` | **no `source_url` column** | ✅ no source write path |

**The only user-controlled source-URL persistence path is `/api/evidence`, and it is validated by `httpUrlOrNull`.** The second evidence INSERT (belief-bridge) writes an empty string — not a gap. Importer/seed are owner-controlled.

---

## E. Exports / RunPack / AI Output Assessment

- `buildRunPack`/`createAipPacket` build a JSON packet from `claimDetail` (which includes evidence `source_url`). If `source_url` is emitted, it appears as a **JSON string value** in a packet the user **copies or downloads** to paste into an external AI.
- The frontend **never renders packet `source_url` as an `href`** — confirmed: RunPack is handled by `copyAIP` / `downloadRunPack` (blob download), not HTML-rendered. The only packet-related `href` is the blob object URL.
- Stored `source_url` going forward is http/https only (D-104F), so new packets carry clean URLs anyway; any legacy value would be inert text inside JSON.

**Assessment: safe as data.** Future-consumer note: if HumanX ever renders packet contents as HTML (it does not today), that new render path would need to route source values through `sourceLink`. No action now.

---

## F. Test Coverage Review

| Locked by | What |
|---|---|
| Section 46 (D-104B) | `sourceLink` exists, `safeHttpUrl` http/https-only, unsafe → non-clickable text, anchor keeps rel/noopener |
| Section 49 (D-107B) | Review inspect uses `sourceLink`; no inline source `href`; quality via `evidenceQualityLabel` |
| worker-route Section (D-104F) | `httpUrlOrNull` shape; `/api/evidence` routes `body.sourceUrl` through it; no raw cleanText insert; pressure has no source_url |
| Section 47/48 (D-104F/D-106B) | both layers http/https-only; admin/debug hardening |

**Coverage gap (minor):** no single test asserts that **all** evidence render paths (`evidenceCard`, `evidenceItem`, `reusedItemCompact`) use `sourceLink` — they do, but only the Review inspect path is explicitly locked. A "no raw source href in app-v10.js" guard would lock the whole frontend in one assertion.

---

## G. Findings (Ranked by Severity)

### D.1 — LOW (hygiene, not a live vuln): orphaned stale frontend files contain the old unsanitised pattern
`public/app-v5.js` through `app-v9.js` are tracked and served as static assets, and contain the **pre-D-104B** `href="${safe}"` (raw `esc(url)`) source-rendering pattern. **No HTML loads them** — `index.html` loads only `app-v10.js?v=5` — so they **cannot execute** in the app and are not a live XSS path. Risks: (a) a future audit could mistake them for live code; (b) they ship dead, vulnerable-pattern bytes to the edge. Recommend deletion as a **cleanup** task (out of strict source-safety scope, and cleanup is explicitly disallowed in this audit's mode).

### Everything else — ✅ no findings
- Single sanitised `href` in live frontend; all four evidence render paths use `sourceLink`.
- Only user-controlled write path validated by `httpUrlOrNull`; belief-bridge writes `''`; pressure has no source column.
- RunPack source is data, never rendered as href.

---

## H. Is D-108B Needed?

**No — D-108B is NOT needed for source safety.**

Every live source-URL render path (vault, study, reused, admin Review) goes through `sourceLink` → `safeHttpUrl`; the only user-controlled persistence path (`/api/evidence`) goes through `httpUrlOrNull`; pressure has no source column; belief-bridge writes an empty string; importer/seed are owner-controlled. The live frontend contains exactly one `href` and it is sanitised. The source-safety chain (D-104B render + D-104F storage + D-107B Review) is complete and consistent with no remaining bypass.

### What already locks it
- `sourceLink`/`safeHttpUrl` http/https-only (Section 46)
- Review inspect via `sourceLink`, no inline href (Section 49)
- `/api/evidence` via `httpUrlOrNull`, pressure no source_url, both-layers http/https (Sections 47/48 + worker-route)

### Optional, non-blocking follow-ups (NOT required for safety)
| ID | Item | Type |
|---|---|---|
| OPT-1 | Delete orphaned `app-v5.js`–`app-v9.js` (dead files with old pattern) | cleanup (separate task) |
| OPT-2 | Add a one-line hardening guard: app-v10.js contains no `href="${esc(` with a source/url value (locks all frontend render paths in one assertion) | test hardening |
| OPT-3 | Read-only D1 legacy `source_url` audit (D-104E deferred) | informational; display already safe |

These are hygiene/lock-in, not security gaps. If the team wants the cleanest possible state, OPT-1 + OPT-2 could be a tiny **D-108B (cleanup + test-lock)** — but it is optional and carries no security urgency.

---

## I. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, admin/moderation, token-rotation, or live mutation was performed.
> No admin token was used. No exploit executed.

---

## J. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **372 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
