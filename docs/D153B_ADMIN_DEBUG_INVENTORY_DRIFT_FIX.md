# D-153B — Fix Admin Debug Inventory Docs Drift

**Date:** 2026-06-24
**Scope:** Docs only. No code, no migration, no `wrangler.toml`, no auth change, no owner-token work.

---

## What Was Fixed

`docs/API_ENDPOINT_INVENTORY.md` incorrectly described `GET /api/debug` as:

> `Exposes full table inventory and live data. No admin token required — relies on obscurity only`

D-153A's audit confirmed `requireAdmin(request, env)` is called as the first statement in the `debugState` handler — unauthenticated calls return 403. The "relies on obscurity only" note was stale documentation from before admin gating was added.

**Changed to:**

> `Requires admin token (x-humanx-admin). Unauthenticated calls return 403. Returns live row counts for all tables and the 5 most recent claims (including items in non-public review_state) — admin-only debug view.`

The Visibility column was also updated from `Internal-ish` to `**Admin only** (D-153B)` to match the format used by every other admin-gated route in the table.

---

## No Code Change Required

The backend was already correct. This was purely a documentation drift — the inventory had not been updated when `requireAdmin` was added to `/api/debug`.

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1057 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged. This checkpoint made no code, migration, or test changes.
