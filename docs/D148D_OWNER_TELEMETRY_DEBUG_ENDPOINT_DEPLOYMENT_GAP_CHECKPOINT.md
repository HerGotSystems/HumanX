# D-148D — Resolve Owner Telemetry Debug Endpoint Deployment Gap

**Date:** 2026-06-23
**Chain:** D-145A→C → D-146A→C → D-147A→C → D-148A→C (client hardening + live verification) → D-148D (this doc — investigate and resolve the `/api/debug/owner-token-telemetry` 404 found by D-148C)
**Scope:** Investigation + manual production deploy + partial live verification. No code changes (none were needed). No migration. No `wrangler.toml` change. No enforcement.

Verified against:
- `https://humanx.rinkimirikata.com`

---

## Summary

D-148C found `GET /api/debug/owner-token-telemetry` returning 404 in production, contradicting D-147C's earlier confirmation that the same endpoint returned working aggregate data. This checkpoint investigated the cause, found it was a deployment gap (not a code defect), and confirms the gap is now closed after a manual production deploy.

---

## Investigation

Local repo state was inspected before any deploy action:

| Check | Result |
|---|---|
| Route defined in `src/worker.js` | Present at `src/worker.js:39`, exact-match dispatch (`===`, not `startsWith`), cannot be shadowed by the `/api/debug` route above it |
| `ownerTokenTelemetryDebug()` | Present and correctly implemented — fails closed to empty results if the table is missing, never throws |
| `requireAdmin()` gate | Correctly called before `ownerTokenTelemetryDebug()` is invoked |
| `docs/API_ENDPOINT_INVENTORY.md` entry | Present (added in D-147B) |
| `worker-route-static-check.mjs` coverage | Present — dedicated admin-gating check for this exact route |
| `hardening-smoke-test.mjs` coverage | Present — dedicated test for admin-gating |
| `wrangler.toml` | Correct — `main = "src/worker.js"`, D1 binding present, no config defect |
| CI/CD deploy automation | None found — `.github/workflows/read-smoke.yml` is read-only smoke testing against the live URL; it never runs `wrangler deploy`. All production deploys in this repo are manual. |

**Conclusion before any deploy action:** the code was correct in every respect checked. Since there is no deploy automation and this entire D-145→D-148C chain had only ever been `git commit`ed (never deployed), the most likely explanation was that production was still running pre-D-147B code — i.e. a deployment gap, not a code defect. A `wrangler deploy --dry-run` was run first and completed cleanly (valid bindings, valid asset bundle), confirming the deploy itself was not blocked by any config issue.

---

## Resolution

`npx wrangler deploy` was run manually (outside this automated session, due to this session's environment having no outbound network access to Cloudflare's API) to bring production up to the currently committed code.

---

## Live Verification (Partial — Honestly Scoped)

| Check | Result |
|---|---|
| `GET /api/debug/owner-token-telemetry` no longer 404s | Confirmed |
| Endpoint is admin-gated | Confirmed — a placeholder/invalid admin token returned 403 |
| Authenticated admin request | Confirmed — the browser-stored admin token returned 200 with a sanitized response body |
| Aggregate `valid` count > 0 | **Not confirmed.** A console-side `valid_count` extraction attempt returned `null` — this reflects a gap in the verification method used (the extraction approach didn't successfully pull the count from the response shape), not a confirmed absence of `valid` entries in the response. |

No raw `owner_token` value, no `HUMANX_OWNER_SECRET` value, and no admin token value was printed, shared, or recorded as part of this verification or this document.

**What this checkpoint confirms:** the deployment gap is resolved — the route exists, is reachable, is correctly admin-gated, and returns 200 with sanitized data for an authenticated admin request.

**What this checkpoint does not confirm:** the actual aggregate `valid` count value. This is recorded honestly as unconfirmed rather than assumed to be > 0 (as D-147C had claimed) or assumed to be 0/empty.

---

## This Remains Advisory-Only — No Enforcement

This was a deploy/investigation checkpoint, not a behavioral change. Nothing about the enforcement posture changed:

- No route's response-shape, status-code, or rejection behavior was modified.
- `ownerTokenStatus()`'s result continues to be used for telemetry only.
- The deploy brought production up to already-committed, already-reviewed code (D-147A through D-148C) — it did not introduce new logic.

---

## Remaining Gap / Recommended Follow-Up

**Improve or debug the aggregate response shape / extraction method** so the `valid` count (and the other status/route counts) can actually be read and confirmed, rather than just confirming the endpoint responds with a 200. Two non-exclusive options for a follow-up checkpoint:

1. Re-attempt the live check with a more careful extraction of the JSON response body (e.g. reading `byStatus.valid` directly rather than whatever extraction approach returned `null` this time).
2. If the response shape itself is suspected to be the issue, compare it against `ownerTokenTelemetryDebug()`'s actual return shape (`{ ok, byStatus, byRoute, recent }`) to rule out a mismatch.

Until that follow-up happens, the aggregate-telemetry-driven review recommended since D-148A (informing any future enforcement-readiness decision) remains blocked on actually being able to read the numbers, even though the underlying data pipeline (route → telemetry write → table → admin endpoint) is now confirmed reachable end-to-end except for that final extraction step.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 993 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged from D-148C — this checkpoint made no code, migration, or test changes; the baseline was re-run and reconfirmed before this commit.
