# D-166A — Sensitive Metadata Exposure Audit

**Date:** 2026-06-25
**Scope:** Audit only. No code, route, or admin/owner-token behavior was changed.
**Baseline:** 1215/24/57

---

## Executive Summary

HumanX's current sensitive-metadata exposure posture is broadly sound. The most sensitive fields (admin token values, owner token values, invite code list, user email of other users, `is_admin`) are either not returned at all by public routes or are correctly scoped to the authenticated owner. The review queue and inspect panel do expose `user_id` and `normalized_claim`, but both are behind `requireAdmin` gating. A data-export endpoint returns full own-user data including `is_shadow_banned` — this is the user's own data and a GDPR-aligned design choice, but deserves documentation.

**No immediate catastrophic secret leak was found. No code changes are made in this patch.**

---

## Exposure Surface Definitions

| Surface | Description |
|---|---|
| **S1 — Public unauthenticated** | `/api/health`, `/api/version`, `/api/u/:slug`, public study pages, browse/claims |
| **S2 — Logged-in own private** | `/api/me`, `/api/my-humanx`, `/api/my-humanx/export` |
| **S3 — Admin-only review** | `/api/review`, `/api/review/decision`, `/api/review/cleanup`, `/api/review/duplicate`, `/api/review/similar`, `/api/auth/invite/*` |
| **S4 — Docs / checkpoints** | `docs/` files including live verify docs |
| **S5 — Console / logging** | `console.log` in `src/worker.js`; frontend has zero `console.*` calls |

---

## Exposure Matrix

| Field | S1 Public | S2 Own | S3 Admin | S4 Docs | S5 Console | Verdict |
|---|---|---|---|---|---|---|
| Admin token value | ✗ | ✗ | ✗ | ✗ | ✗ | OK |
| Owner token value | ✗ | ✗ | ✗ | ✗ | ✗ | OK |
| Invite code values (list) | ✗ | ✗ | ✓ admin-create only | ✗ | ✗ | OK — intentional |
| User `id` (own) | ✗ | ✓ own | ✓ admin inspect | ✗ | ✗ | OK — own is expected |
| User `id` (other user) | ✗ | ✗ | ✓ admin inspect | ✗ | ✗ | Acceptable — admin context |
| User `email` (own) | ✗ | ✓ verified users only | ✗ | ✗ | ✗ | OK — own, conditional |
| User `email` (other user) | ✗ | ✗ | ✗ | ✗ | ✗ | OK |
| `is_admin` | ✗ | ✗ | ✗ | ✗ | ✗ | OK — intentionally omitted |
| `is_shadow_banned` | ✗ | ✓ own export | ✗ | ✗ | ✗ | Questionable — see F-04 |
| `normalized_claim` | ✗ | ✗ | ✓ admin inspect (truncated) | ✗ | ✗ | Acceptable — admin context |
| `damage` (claims) | ✗ | ✗ | ✓ via `c.*` wildcard | ✗ | ✗ | Acceptable — admin context |
| `evidence.body` | ✗ | ✓ own export | ✓ admin inspect | ✗ | ✗ | OK — body omitted from public profile |
| `pressure_points.body` | ✗ | ✓ own export | ✓ admin inspect | ✗ | ✗ | OK — body omitted from public profile |
| `dimensions_json` | ✗ | ✓ own dashboard | ✗ | ✗ | ✗ | OK — own private |
| `raw_json` | ✗ | ✗ | ✗ | ✗ | ✗ | OK — explicitly excluded |
| `stress_points_json` | ✗ | ✗ | ✗ | ✗ | ✗ | OK — explicitly excluded |
| `contradictions_json` | ✗ | ✓ own dashboard (summary only) | ✗ | ✗ | ✗ | OK — full text excluded |
| Owner token telemetry uid suffix | ✗ | ✗ | ✗ | ✗ | ✓ last 6 chars | Acceptable — see F-05 |

---

## Findings

### F-01 — `c.*` wildcard in `reviewQueue` returns `normalized_claim` and `damage`

**File/function:** `src/worker.js` → `reviewQueue()` — claims SELECT uses `c.*`

**What:** The claims query uses `SELECT 'claim' AS target_type, c.*` which returns every column in the `claims` table, including `normalized_claim` (internal dedup key) and `damage` (an internal classification string added in a prior migration).

**Who can see it:** Admin only — `reviewQueue()` calls `requireAdmin()` as its first operation. Not visible on any public or own-user surface.

**Verdict:** Acceptable in current form. `normalized_claim` and `damage` are internal admin signals intentionally shown in the inspect panel (`renderReviewInspectPanel` correctly labels `normalized_claim` as "Admin-only dedup key"). However, `c.*` is fragile — any new column added to `claims` is silently included in the admin queue payload.

**Recommended D-166B action:** Consider switching `reviewQueue` claims SELECT to an explicit column list, or add a smoke test asserting that no new sensitive column (e.g., `hashed_fingerprint`, future `email_hint`) is silently included.

---

### F-02 — `user_id` shown in admin inspect panel

**File/function:** `public/app-v10.js` → `renderReviewInspectPanel()` — renders `item.user_id` as "User ID" field

**What:** The inspect panel shows the submitter's internal user ID (a UUID-like string, e.g. `usr_abc123`).

**Who can see it:** Admin only. `renderReviewInspectPanel()` is only called from within `renderReviewList()`, which is only called from `renderReview()`, which requires a valid admin token to load. The review queue API (`/api/review`) itself requires `requireAdmin`.

**Verdict:** Acceptable. Submitter identity is a legitimate admin moderation signal. The `handle` (pseudonym) is also shown, providing context without requiring the ID, but the ID is useful for cross-referencing reports.

**Recommended D-166B action:** No change required. Document that `user_id` in the inspect panel is intentional admin context, not a public exposure.

---

### F-03 — Invite code returned in plaintext to admin on creation

**File/function:** `src/worker.js` → `createInviteCode()` — returns `{ ok: true, code, invite }` including the raw `code` string

**What:** The `/api/auth/invite/create` endpoint is admin-gated (`requireAdmin` check before the handler). It returns the newly created invite code in the response body so the admin can share it.

**Who can see it:** Admin only (requires valid `x-humanx-admin` header).

**Verdict:** Acceptable and intentional. The whole point of `createInviteCode` is to generate and return the code to the admin. The code is not stored in any client-side log and is only displayed in the `adminInviteResult` div inside the admin-gated review panel. No issue here.

**Recommended D-166B action:** None. Existing smoke tests already assert invite codes are not exposed outside admin-gated context.

---

### F-04 — `is_shadow_banned` returned in `/api/my-humanx/export`

**File/function:** `src/worker.js` → `exportMyHumanX()` — `users` SELECT includes `is_shadow_banned`

**What:** The data export includes `is_shadow_banned` in the `user` object. A shadow-banned user who downloads their data will see `is_shadow_banned: 1`.

**Who can see it:** Own user only (`requireUser` gating). Not visible publicly or to other users.

**Verdict:** Questionable but defensible. From a GDPR/data-portability perspective, returning all fields that pertain to the user's own account is correct — the user has a right to know their account status. However, shadow-ban mechanisms typically depend on the banned user not knowing they are banned (so they do not change behaviour). Exposing this flag in export undermines the shadow-ban's effectiveness.

**Recommended D-166B action:** Either (a) omit `is_shadow_banned` from the export's `user` object, or (b) document the deliberate design decision to include it. The `/api/me` and `/api/my-humanx` routes already return `is_shadow_banned` in the non-export dashboard (`getMe`, `myHumanX`), so the export is consistent with existing policy — this may be an intentional tradeoff.

---

### F-05 — Owner-token telemetry logs last 6 chars of user ID

**File/function:** `src/worker.js` → `logOwnerTokenTelemetry()` — `console.log(`[owner-token] route=${routeName} status=${status} uid_suffix=…`)`

**What:** Every call to owner-token telemetry emits a Cloudflare Worker log line containing the last 6 characters of the user ID. This is intentionally a suffix, not the full ID.

**Who can see it:** Owner terminal / Cloudflare dashboard only. Not visible to users or admins.

**Verdict:** Acceptable. The 6-char suffix was deliberately chosen (D-146B) to allow correlation without full ID disclosure. Not a public exposure.

**Recommended D-166B action:** None.

---

### F-06 — `/api/me` and `/api/my-humanx` return `is_shadow_banned` to own user (non-export)

**File/function:** `src/worker.js` → `getMe()` and `myHumanX()` — both SELECT `is_shadow_banned` and return it in the `user` object

**What:** Same issue as F-04 but applies to the live dashboard response, not just export.

**Who can see it:** Own user only. Shown as-is in the API response; `meAccountCardHtml` in the frontend does not currently render `is_shadow_banned` in the UI — it's in the JSON but not displayed.

**Verdict:** Same tradeoff as F-04. The field is in the response JSON but not rendered in the UI, so the effective exposure is limited to users who inspect their own network responses.

**Recommended D-166B action:** Consistent with F-04. Either document the intentional inclusion or omit from all non-admin responses. No urgent change.

---

### F-07 — `raw_json`, `stress_points_json` excluded from all responses (positive finding)

**File/function:** `src/worker.js` → `myHumanX()` and `getPublicProfile()` — both have explicit comments noting exclusion

**What:** `raw_json` (full runpack answer blob) and `stress_points_json` are explicitly excluded from `myHumanX` (the owner dashboard) and from the public profile. The comment at `myHumanX()` reads: "The full answer-payload blob and the scenario-response blob are deliberately excluded".

**Who can see it:** No route returns these fields outside of the full export (F-04).

**Verdict:** Good. No action required.

---

### F-08 — Public profile (`/api/u/:slug`) omits `evidence.body`, `pressure_points.body`, `user_id`, `email`

**File/function:** `src/worker.js` → `getPublicProfile()` — explicit minimal column lists

**What:** The public profile SELECT for evidence uses `SELECT id, title, stance, quality, media_type, created_at` (body and source_url deliberately omitted). Pressure uses `SELECT id, title, severity, created_at` (body omitted). `user_id` and `email` are not included. The `loadPublicProfileSummary` helper comment explicitly states: "`userId` is included for getPublicProfile()'s own downstream queries — callers must never serialize it directly into a response."

**Verdict:** Good. No action required. The public profile is tight.

---

### F-09 — No `console.*` calls in `public/app-v10.js`

**File/function:** `public/app-v10.js`

**What:** Zero `console.log`, `console.warn`, or `console.error` calls in the entire frontend JS file.

**Verdict:** Good. No token or user data can leak through browser console.

---

### F-10 — Docs contain no pasted token or credential values (positive finding)

**File/function:** `docs/D163D_…`, `docs/D164D_…`, `docs/D165D_…`

**What:** All three recent live verify docs were scanned for:
- Invite code patterns (`inv_…`)
- Admin token patterns
- Owner token patterns
- Email addresses
- Bearer token patterns
- Cloudflare beacon `"token":` fields

None found. D-165D explicitly notes it omitted the Cloudflare beacon metadata line.

**Verdict:** Good. No action required.

---

## Public-Route Verdict

`/api/health` and `/api/version` return only operational metadata (no user data, no tokens). `/api/u/:slug` uses explicit minimal column lists and never returns `user_id`, `email`, `is_admin`, or internal fields. Public study/browse pages render only public-approved content via handle (pseudonym), not internal ID. **Public surface is clean.**

---

## Admin-Route Verdict

All five review routes (`reviewDecision`, `reviewCleanup`, `markDuplicate`, `resolveSimilar`, `reviewQueue`) call `requireAdmin` as their first operation. Invite creation is also admin-gated. The inspect panel shows `user_id` and `normalized_claim` — both intentional admin moderation signals. The `c.*` wildcard in `reviewQueue` is the one structural risk (F-01): future schema additions would silently appear in the admin payload. **Admin surface is functionally correct; one structural fragility noted (F-01).**

---

## Docs / Checkpoint Verdict

No token values, invite codes, emails, or internal debug data appear in any recently created doc. **Docs surface is clean.**

---

## Recommended D-166B Patch List

Priority order:

| # | Finding | Action | Priority |
|---|---|---|---|
| 1 | F-01 — `c.*` wildcard in `reviewQueue` | Explicit column list for claims SELECT (or add sentinel smoke test) | Medium |
| 2 | F-04/F-06 — `is_shadow_banned` in own responses | Decide and document: include (privacy-right) or omit (stealth-ban effectiveness) | Low |
| 3 | All others | No change needed — document positive findings | — |

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1215 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

No code was changed in this patch. Baseline unchanged.

---

## Explicit Confirmations

**Audit only; no backend behavior changed.** No route, admin-token handling, review logic, or any other code was modified in D-166A.

**No owner-token work resumed.** D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
