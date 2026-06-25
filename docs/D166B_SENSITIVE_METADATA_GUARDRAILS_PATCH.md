# D-166B — Sensitive Metadata Guardrails Patch

**Date:** 2026-06-25
**Scope:** `src/worker.js`, `scripts/hardening-smoke-test.mjs`. No frontend changes, no migration, no wrangler.toml, no owner-token work.

---

## What Changed

### 1. Review queue claims SELECT — explicit allowlist replaces `c.*`

**Before (D-166A finding F-01):**

```sql
SELECT 'claim' AS target_type, c.*, u.handle, … FROM claims c …
```

`c.*` returns every column in the `claims` table, including present columns (`normalized_claim`, `damage`, `supporters`, `challengers`, `belief_yes`, `belief_no`, `uncertainty`) and any column added by future migrations — silently.

**After:**

```sql
SELECT 'claim' AS target_type,
  c.id, c.user_id, c.claim, c.category, c.type, c.status,
  c.evidence_score, c.survivability, c.testability, c.contradictions, c.report_count,
  c.review_state, c.normalized_claim, c.duplicate_of, c.near_duplicate_of,
  c.damage, c.status_locked, c.archived_by_user, c.created_at, c.updated_at,
  u.handle, … FROM claims c …
```

**Why `c.*` was replaced:**

Any new column added to `claims` would silently appear in the admin review queue payload. The explicit list acts as a schema boundary: new columns are opt-in, not opt-out.

**Columns intentionally included in the explicit list:**

| Column | Reason included |
|---|---|
| `normalized_claim` | Admin dedup key — already shown as "Admin-only dedup key" in inspect panel |
| `damage` | Internal classification used by `reviewItemOriginLabel()` in the frontend |
| `near_duplicate_of` | Powers `~similar` badge in review card |
| `duplicate_of` | Admin duplicate management |
| `status_locked` | Shown as lock icon in review card |
| `archived_by_user` | Part of WHERE clause filter; also passed through to frontend for context |
| `user_id` | Shown in admin inspect panel as "User ID" — intentional admin moderation signal |

**Columns dropped from payload (previously included silently via `c.*`):**

`supporters`, `challengers`, `belief_yes`, `belief_no`, `uncertainty` — present in the `claims` table schema but never accessed by any review UI code.

---

### 2. `is_shadow_banned` removed from user-facing own-user responses

**Before (D-166A findings F-04/F-06):**

`is_shadow_banned` was included in the `users` SELECT in four places:
- `getMe()` — `/api/me`
- `myHumanX()` — `/api/my-humanx`
- `exportMyHumanX()` — `/api/my-humanx/export`
- `redeemInviteCode()` — `/api/auth/invite/redeem` (own user data returned on first login)

**After:**

`is_shadow_banned` removed from all four user-facing SELECT statements.

**Why removed:**

Shadow-ban effectiveness depends on the banned user not knowing they are banned so they do not change behaviour. Returning `is_shadow_banned: 1` in own-user responses — including the data export — undermined this. The field is purely an internal moderation signal and has no user-facing utility.

**What did not change:**

- The `is_shadow_banned` column was not dropped from the database.
- `requireUser()` still reads `is_shadow_banned` from the DB on every authenticated request and throws `USER_SHADOW_BANNED` if set — enforcement is unchanged.
- `ensureUser()` still reads and checks the field internally.
- The admin review panel does not expose `is_shadow_banned` (the review queue queries join `users` only for `handle` — never the users moderation flags).

---

## What Did Not Change

- No migration — no schema change, only query minimization
- No wrangler.toml
- No review route semantics — `requireAdmin` gating, decision types, cleanup gates, duplicate flow all unchanged
- No admin-token handling changes
- No frontend changes — `public/app-v10.js` not modified
- No owner-token work — D-149H hold remains in effect

---

## Smoke Tests

8 tests added/updated in this patch:

**New tests — Section 99:**

| Test | What it checks |
|---|---|
| `D-166B: reviewQueue claims SELECT does not use c.*` | `reviewQueue` function body does not contain `'claim' AS target_type, c.*` |
| `D-166B: reviewQueue claims SELECT does not include normalized_claim unless justified` | `c.*` absent; `c.normalized_claim` present (explicit, intentional) |
| `D-166B: /api/me getMe SELECT does not include is_shadow_banned` | `getMe` SELECT string excludes `is_shadow_banned` |
| `D-166B: /api/my-humanx myHumanX SELECT does not include is_shadow_banned` | `myHumanX` users SELECT string excludes `is_shadow_banned` |
| `D-166B: /api/my-humanx/export exportMyHumanX SELECT does not include is_shadow_banned` | `exportMyHumanX` users SELECT string excludes `is_shadow_banned` |
| `D-166B: shadow-ban enforcement code still present in requireUser` | `requireUser` still reads `is_shadow_banned` and throws `USER_SHADOW_BANNED` |
| `D-166B: review routes remain requireAdmin-gated after D-166B` | All 5 review functions still call `requireAdmin` first |
| `D-166B: no owner-token enforcement resumed` | `OWNER_TOKEN_REQUIRED`/`OWNER_TOKEN_INVALID` absent from worker |

**Pre-existing tests updated:**

- `D-136B: getMe returns the documented user field set` — updated expected field string to exclude `is_shadow_banned`; assertion now checks SELECT string (not full function body, which contains a comment mentioning `is_shadow_banned` as omitted)
- `D-138B: exportMyHumanX omits is_admin and admin-token material` — updated to also assert `is_shadow_banned` absent from SELECT string

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1223 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

Previous baseline was 1215. +8 net (7 new Section 99 tests; 2 pre-existing tests updated with tighter SELECT-string assertions that count as pass under new criteria).

---

## Recommended Next Step

D-166C: Bump deploy metadata to D-166B / current commit / 1223/24/57, then owner-terminal preflight and D-166D live verify.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.

---

## No Backend Route Semantics Changed Except Response Field Minimization

All changes in D-166B are response field minimization only:
- Review queue claims SELECT narrowed from `c.*` to an explicit allowlist — same rows returned, fewer columns
- User-facing `users` SELECT removes `is_shadow_banned` — same rows returned, one fewer column
- No route added, removed, or semantically changed
- No approval/reject/duplicate/cleanup behavior changed
- `requireAdmin` gating unchanged on all review routes
