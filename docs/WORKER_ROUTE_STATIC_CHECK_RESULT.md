# Worker Route Static Check Result

## 1. Purpose

This file records the local static route/docs consistency check result for the HumanX
Worker API routes. It confirms that the route strings in `src/worker.js` and the
documented paths in `docs/API_ENDPOINT_INVENTORY.md` are aligned for all high-risk and
public-write routes.

See `docs/WORKER_ROUTE_STATIC_CHECK_SPEC.md` for the full specification.

---

## 2. Test Context

| Field | Value |
|---|---|
| Script | `scripts/worker-route-static-check.mjs` |
| Date | 2026-06-01 |
| Check type | Local static file check — no Worker execution |
| Files checked | `src/worker.js`, `docs/API_ENDPOINT_INVENTORY.md`, `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` |
| Network calls | None |
| Production calls | None |
| D1 / Wrangler | Not used |

---

## 3. Background

The first run of `scripts/worker-route-static-check.mjs` found a real documentation
gap: `/api/claim-vote` was present in `src/worker.js` and in
`docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` but absent from
`docs/API_ENDPOINT_INVENTORY.md`. The script correctly produced 2 hard failures.

The gap was fixed by adding the `/api/claim-vote` row to `docs/API_ENDPOINT_INVENTORY.md`
with facts confirmed directly from `src/votes.js` (tables, rate limit, vote values,
upsert pattern, response shape).

This result file records the post-fix run, which passed with no hard failures and no
warnings.

---

## 4. Summary

| Metric | Value |
|---|---|
| Hard checks passed | **35** |
| Hard checks failed | **0** |
| Warnings | **0** |
| Exit code | **0** |

---

## 5. Confirmed Checks

- [x] `src/worker.js` exists and is readable.
- [x] `docs/API_ENDPOINT_INVENTORY.md` exists and is readable.
- [x] `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` exists and is readable.
- [x] 25 route strings extracted from `src/worker.js`.
- [x] 26 route paths extracted from `docs/API_ENDPOINT_INVENTORY.md` (includes `/api/claims/:id` parameterised route).
- [x] 18 route paths extracted from `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`.
- [x] No routes in code but absent from inventory.
- [x] No routes in inventory but absent from code (the `/api/claims/:id` parameterised variant is matched via its base `/api/claims`).
- [x] All 11 high-risk routes present in code and inventory:
  - `/api/claims`
  - `/api/claim-vote` ← previously missing; now documented
  - `/api/evidence`
  - `/api/evidence-attach`
  - `/api/truths`
  - `/api/truth-to-claim`
  - `/api/belief-snapshots`
  - `/api/belief-promote`
  - `/api/review`
  - `/api/review/decision`
  - `/api/ai/analyse`
- [x] All 18 public-write risk map routes represented in inventory.

---

## 6. Warnings

No warnings on this run. The `/api/claims/:id` parameterised docs-only entry that
appeared in earlier testing was resolved by the base-path matching logic in the script
(`/api/claims/:id` base collapses to `/api/claims`, which is present in the worker
routing block).

---

## 7. What This Proves

- Worker route strings in `src/worker.js` and documented paths in
  `docs/API_ENDPOINT_INVENTORY.md` are currently aligned for all high-risk and
  public-write routes.
- `docs/API_ENDPOINT_INVENTORY.md` now includes `/api/claim-vote` with accurate facts
  from `src/votes.js`.
- `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` and `docs/API_ENDPOINT_INVENTORY.md` cover
  the same set of public-write routes with no drift.
- The check is local, static, and non-mutating — no infrastructure was involved.

---

## 8. What This Does Not Prove

- Does not prove endpoint behaviour — rate limits, auth enforcement, response shapes,
  and D1 write correctness were not exercised.
- Does not prove response shapes match what `public/app-v10.js` expects — that requires
  live smoke testing and manual QA.
- Does not prove the live deployment matches `src/worker.js` — local files only were
  read.
- Does not prove D1 schema is current — no database was queried.
- Does not prove rate limit behaviour — the rate limit values are documented but not
  tested by this script.
- Does not prove admin token behaviour — no admin routes were called.
- Does not prove frontend integration — no browser or API calls were made.
- Does not replace `scripts/read-endpoint-smoke-test.mjs` or
  `scripts/write-endpoint-smoke-test.mjs` as live behaviour checks.

---

## 9. Recommended Use

Run this check before and after any of the following:

- Any Worker route addition, removal, or rename in `src/worker.js`.
- Any update to `docs/API_ENDPOINT_INVENTORY.md`.
- Any update to `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`.
- Any Worker modular split step that moves route handling to a new module.

```
node scripts/worker-route-static-check.mjs
```

All 35 hard checks must pass. A failure means the Worker code and docs have drifted —
resolve the gap before any further routing or endpoint change.
