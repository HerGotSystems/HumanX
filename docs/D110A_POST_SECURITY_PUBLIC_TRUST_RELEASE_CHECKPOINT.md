# D-110A — Post-Security / Public-Trust Release Checkpoint

**Date:** 2026-06-10
**Mode:** Docs-only checkpoint — no code, no backend/D1/Wrangler/live mutation.

> ⭐ **START HERE** for any new session. This is the current release checkpoint after the D-103→D-109 evidence/source-safety, admin-hardening, and cleanup arcs. It supersedes D-105A (which covered only D-103/D-104). D-105A, D-108B, and D-109C remain valid historical records.

---

## A. Current State

| Field | Value |
|---|---|
| **Repo HEAD** | `50abf03` — D-109C record orphan frontend bundle cleanup deployment |
| **Latest deployed Worker** | `adb94a83-5f42-4c2f-85b6-c640dbc72265` (Wrangler 4.100.0) |
| **Worker / URL** | `humanx` · https://humanx.veltrusky-michal.workers.dev |
| **Static baseline** | **375 / 24 / 56** (hardening-smoke / belief-engine / worker-route — all pass) |
| **Served frontend** | `public/app-v10.js` only (loaded by `public/index.html?v=5`) |
| **Public asset count** | **8** (was 15 before D-109B removed the 7 orphan bundles) |

### Deployed Worker lineage (recent)
| Version | Shipped |
|---|---|
| `eb055ee3` | D-104B frontend source render sanitisation |
| `0bb54517` | D-104F Worker source storage validation |
| `019b929f` | D-106B/D admin + debug hardening |
| `d10c6a67` | D-107B Review inspect source sanitisation |
| `adb94a83` | D-109B orphan bundle cleanup (current) |

---

## B. Summary of Completed Arcs (D-103 → D-109)

| Arc | What shipped |
|---|---|
| **D-103** evidence quality/source clarity | `vibes`→"weak argument"; quality tiers strong/mid/weak/neutral; missing source → "no source provided" |
| **D-104** source URL security | Frontend `sourceLink` clickable only for http/https (else non-clickable text); Worker `/api/evidence` validates `sourceUrl` via `httpUrlOrNull` (invalid→null) |
| **D-106** admin/debug hardening | `.gitignore` for local env/secret files; `/api/debug` admin-gated; `requireAdmin` uses `safeEqual`; fail-closed on missing `HUMANX_ADMIN_TOKEN`; token rotation deferred |
| **D-107** Review inspect source sanitisation | Review inspect evidence Source uses shared `sourceLink`; no raw inline source href; Quality via `evidenceQualityLabel` |
| **D-108** final source-safety regression audit | Verdict: no code patch needed; `app-v10.js` source render path bypass-free; RunPack emits source URLs as JSON data only |
| **D-109** orphan bundle cleanup | Removed `app-v3.js`–`app-v9.js`; corrected `PROJECT_INDEX.md`; asset count 15→8 |

---

## C. Live Guarantees

- Source `href`s are **http/https-only** — both public Study and admin Review render via `sourceLink`→`safeHttpUrl`.
- Evidence **source absence is visible** ("no source provided"), not silently hidden.
- **Weak evidence is labelled "weak argument"** (not "fake") with tiered styling.
- **Review inspect uses the shared source sanitiser** — no separate unsafe render path.
- **Worker storage validates `sourceUrl`** on `/api/evidence` (`httpUrlOrNull`, coerce-to-null).
- **`/api/debug` is admin-gated**; `requireAdmin` is `safeEqual` + fail-closed.
- **Legacy orphan bundles removed** — only `app-v10.js` is served.

---

## D. Explicit Non-Goals / Intentionally Deferred

- ⏸ **Token rotation deferred** — `HUMANX_ADMIN_TOKEN` rotation is recommended (token material appeared in earlier chats) but not yet done; do when heavy work slows.
- ❌ No D1 cleanup/migration of legacy `source_url` rows (display is already safe).
- ❌ No source **verification** / "trusted source" badges.
- ❌ No domain blocklists/allowlists or link previews (SSRF risk).
- ❌ No full auth/session system — single-admin pseudonymous prototype model retained.

---

## E. Do-Not-Regress Rules

1. **Never render `source_url` (or any user URL) directly into an `href`.** All source rendering goes through `sourceLink` → `safeHttpUrl`.
2. **All evidence source storage goes through `httpUrlOrNull`** on the Worker (`/api/evidence`).
3. **Both layers stay http/https-only** for source URLs (frontend render + Worker storage).
4. **Do not re-add `app-v3.js`–`app-v9.js`** as served assets (guarded by hardening Section 50).
5. **Do not expose `/api/debug` publicly** — it must stay behind `requireAdmin`.
6. **Do not commit env/secret files** — `.gitignore` covers `.dev.vars`/`.env*`/keys/`secrets/`/`.wrangler/`.
7. **Never paste the admin token into chat, docs, or the repo** — rotation/secret handling is operator-local via `wrangler secret put`.
8. Source-presence ≠ reliability; weak ≠ fake; provided ≠ verified (wording discipline).

---

## F. Recommended Next Work

| Priority | Item | Type |
|---|---|---|
| When work slows | `HUMANX_ADMIN_TOKEN` rotation (procedure in `D106B_ADMIN_SECRET_HYGIENE_DEBUG_HARDENING.md`) | operational |
| Optional | Read-only legacy `source_url` D1 row audit (quantify pre-D-104F exposure; display already safe) | backend audit |
| Optional | Public UX / mobile-layout pass | frontend |
| Optional | Moderation queue ergonomic pass | frontend |
| Optional | Export / RunPack source-consumer audit (confirm downstream rendering of packet source URLs stays safe) | audit |

None are blocking; the platform is in a consistent, verified, deployed state.

---

## G. Confirmation

> Docs-only checkpoint. No deploy, no Wrangler, no D1, no admin/moderation action, no token rotation, no backend/schema change. No live data mutated. No admin token used.

---

## H. Static Check Results

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **375 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
