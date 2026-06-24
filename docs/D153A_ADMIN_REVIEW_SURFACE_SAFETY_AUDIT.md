# D-153A — Admin / Review Surface Safety Audit

**Date:** 2026-06-24
**Scope:** Audit only. No code changes unless a trivially lockable bug is found. No migration. No `wrangler.toml`. No owner-token enforcement. No soft warning.

---

## 1. Admin-Gated Routes — Full Enumeration

All routes verified against `src/worker.js`. Every entry below calls `requireAdmin(request, env)` as its first action before any D1 query or response.

| Route | Method | Gate | Notes |
|---|---|---|---|
| `/api/debug` | GET | `requireAdmin` | Returns table counts + 5 recent claims. Leaks row counts and live claim text — intentional admin-only debug view |
| `/api/debug/owner-token-telemetry` | GET | `requireAdmin` | D-147B/D-149E. Returns sanitized aggregate telemetry only; `recent` rows use an explicit allowlist (route/status/uid_suffix/hash/created_at) — never raw token/uid/secret |
| `/api/seed` | GET | `requireAdmin` | Demo-data seeder. DB-empty guard preserved. Inserts as `review_state='public'` (demo-only) |
| `/api/import-seed` | GET | `requireAdmin` | Production seed importer. `mode` param validated (`dry-run` / `apply`) before any write |
| `/api/import-truths` | GET | `requireAdmin` | Truth seed importer. Same `mode` validation as `/api/import-seed` |
| `/api/auth/invite/create` | POST | `requireAdmin` | Mints single-use invite codes. Returns the code but never echoes the admin token |
| `/api/review` | GET | `requireAdmin` | Review queue. Returns non-public claims/truths/evidence/pressure. Gating confirmed in `reviewQueue()` body |
| `/api/review/decision` | POST | `requireAdmin` | Approves / rejects / re-queues items. Gating confirmed in `reviewDecision()` body |
| `/api/review/cleanup` | POST | `requireAdmin` | Archives rejected smoke/test artefacts only. Gating confirmed in `reviewCleanup()` body (line 760) |
| `/api/review/mark-duplicate` | POST | `requireAdmin` | Marks a claim as duplicate. Gating confirmed in `markDuplicate()` body |
| `/api/review/resolve-similar` | POST | `requireAdmin` | Clears `near_duplicate_of` advisory. Gating confirmed in `resolveSimilar()` body |

**Total admin-gated routes: 11.** No ungated admin routes found.

---

## 2. `requireAdmin` Implementation

```js
function requireAdmin(request, env) {
  const admin   = request.headers.get('x-humanx-admin') || '';
  const expected = env.HUMANX_ADMIN_TOKEN || '';
  if (!expected || !safeEqual(admin, expected)) return json({ error: 'ADMIN_REQUIRED' }, 403);
  return null;
}
```

- Uses `safeEqual` — constant-time comparison, no early exit. Timing-safe.
- Fails closed when `HUMANX_ADMIN_TOKEN` is unset (`!expected` short-circuits to 403 immediately).
- Returns `null` on success (caller checks `if (adminError) return adminError`).
- No token value is ever echoed in any admin response — confirmed across all 11 routes.

---

## 3. Review Route Gating Verdict

All five review routes (`/api/review`, `/api/review/decision`, `/api/review/cleanup`, `/api/review/mark-duplicate`, `/api/review/resolve-similar`) call `requireAdmin` as the **first statement** in their handler function body, before reading the request body or touching D1. Gating is correct and consistent.

`/api/truth-to-claim` is worth noting: it is a **public route** (requires `x-humanx-user` only) but accepts an optional `isAdmin` flag passed as `() => requireAdmin(request, env) === null`. This flag currently controls only whether the admin route hint is included in the response — it does not grant elevated write permissions. Non-admin callers receive the same write behaviour; the flag is read-only context. This is intentional and correctly scoped.

---

## 4. Intentionally Public Routes

The following routes are public by design and confirmed to have no admin gating:

| Route | Method | Auth | Intentional |
|---|---|---|---|
| `/api/health` | GET | None | Yes — service status probe |
| `/api/version` | GET | None | Yes — D-150A deployment provenance |
| `/api/claims` | GET | None | Yes — public claim listing, `review_state='public'` filter enforced |
| `/api/claims/:id` | GET | None | Yes — public claim detail, `review_state='public'` guard added D-38 |
| `/api/truths` | GET | None | Yes — public truth listing |
| `/api/u/:slug` | GET | None | Yes — public profile, `profile_public=1` guard enforced |
| `/u/:slug` | GET | None | Yes — server-rendered OG shell, same guard as `/api/u/:slug` |
| `/api/ai/analyse` | GET | None | Yes — intentionally disabled (returns 402 `RUNPACK_MODE`) |
| `/api/session` | POST | None | Yes — pseudonymous user bootstrap |
| `/api/auth/invite/redeem` | POST | None | Yes — rate-limited (8/hr/IP), single-use code required |

All of these return only public-state data. No `is_admin`, no `HUMANX_ADMIN_TOKEN`, no `owner_token`, no non-public row content is ever returned by any of these routes.

---

## 5. Admin Token Frontend Handling

In `public/app-v10.js`:

- **Storage key:** `humanx_admin_token_v1` (constant `LS_ADMIN`).
- **Storage location:** `localStorage` only.
- **Read:** `adminToken()` reads `localStorage.getItem(LS_ADMIN) || ''`.
- **Set:** `saveAdminTokenAndLoadReview()` — user-triggered via the Review tab UI input. Writes value the user typed; does not generate or transmit it beyond the next API call.
- **Clear:** `clearAdminToken()` — removes key from `localStorage`.
- **Headers:** `adminHeaders()` returns `{ ...headers(), 'x-humanx-admin': adminToken() }`. Never independently constructed.
- **Logging:** No `console.log`, `console.warn`, or `console.error` call in `app-v10.js` references the admin token value. Confirmed by grep — zero hits.
- **Comment guard (line 62):** `// localStorage only — never logs or returns the token value.` — existing in-code reminder.

The admin token is handled correctly in the frontend. It is never logged, never placed in a URL query parameter, and never returned in an API response.

---

## 6. `is_admin` Field Exposure

The `users` table has an `is_admin` column. Checked all `SELECT` queries on `users`:

- `getMe()` — explicit column list: `id, handle, email, verified, verified_at, display_name, trust_score, strike_count, is_shadow_banned, created_at`. **`is_admin` omitted.** ✓
- `myHumanX()` — same explicit list, plus `profile_public, profile_slug, profile_bio`. **`is_admin` omitted.** ✓
- `exportMyHumanX()` — users row uses the same explicit column list. **`is_admin` omitted.** ✓ (Other tables use `SELECT *` but `users` row is explicit.)
- `redeemInviteCode()` — same explicit list. **`is_admin` omitted.** ✓
- `getPublicProfile()` — only `id, handle, display_name, profile_slug, profile_bio`. **`is_admin` omitted.** ✓
- `createOrGetUser()` / `POST /api/session` — response omits `is_admin` per comment at line 267. ✓

No route returns `is_admin` to any caller. The field is effectively private at the API layer.

---

## 7. Weak Spots / Risks

### W-1: `/api/debug` relies on obscurity only (low severity, known)

`GET /api/debug` is admin-gated, so it returns 403 to unauthenticated callers. However the API inventory notes it as "Internal-ish — relies on obscurity only" — this note is stale; the route is correctly `requireAdmin`-gated. The inventory doc should be updated to reflect this accurately. **Not a real vulnerability; docs drift only.**

### W-2: `exportMyHumanX` uses `SELECT *` on non-user tables (low severity, acceptable)

`exportMyHumanX()` uses `SELECT *` on `claims`, `truths`, `evidence`, `pressure_points`, `belief_snapshots`, `claim_votes`, `evidence_votes`, `truth_votes`, and `home_tests`. This is scoped to `WHERE user_id=?` (caller's own data only) and the intent is a full user data export. The `users` row itself uses an explicit column list. The risk is that a future schema addition to one of those tables (e.g. an internal audit flag) would be silently included in the export. This is a known design trade-off, not an active vulnerability.

### W-3: `GET /api/debug` exposes live claim text and table row counts (low severity, admin-only)

The `latest` array in `debugState()` returns the 5 most recent claims by `created_at DESC`, including items that may be in `review_state='review'` (not yet public). This is intentional for admin debugging but means the admin token holder can see pre-approval content via `/api/debug`. Already known; noted here for completeness.

### W-4: Review queue response includes full body/source_url for evidence under review (informational)

`reviewQueue()` returns `e.body` and `e.source_url` for evidence items, even those not yet approved. This is the correct behaviour for a moderation queue (the reviewer needs to see the content), but it means the admin token holder sees all pre-approval evidence text. Intentional; noted for completeness.

---

## 8. No New Tests Required

Existing smoke tests already lock:

- `requireAdmin` uses `safeEqual` and is fail-closed (D-106B, hardening-smoke-test.mjs Section 46).
- `/api/seed` calls `requireAdmin` before any DB write (Section 47).
- `/api/debug` is admin-gated (Section 46).
- No owner-token enforcement was added by any patch in this chain (D-147B, D-148A, D-149E, D-150A, D-151A, D-152A tests).
- Frontend `headers()` and `adminHeaders()` are structurally guarded (D-148A tests).

The audit found no gap that is not already covered by an existing test or that is trivially lockable without a design decision.

---

## 9. Owner-Token Work Status

Not resumed. Per D-149H, owner-token security work (enforcement, soft warnings) remains frozen until one of the D-149H thresholds (T1–T5) is met. Nothing in this audit changes that decision.

---

## 10. Recommended Next Patch

The only actionable finding requiring follow-up is **W-1** (docs drift in `API_ENDPOINT_INVENTORY.md`). The `/api/debug` entry currently says "No admin token required — relies on obscurity only" which is incorrect — it is `requireAdmin`-gated. This should be corrected in a docs-only patch.

Suggested: **D-153B** — correct the `/api/debug` inventory entry. No code change needed.

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1057 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged. No code, migration, or test changes were made in this audit.
