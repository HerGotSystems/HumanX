# D-175D — Public Abuse and Orphan-Row Guardrails Live Verification

**Date:** 2026-06-25
**Local commit:** 43659d3 (D-175C — Bump deploy metadata for D-175B)
**Patch commit verified:** 04ecc5e (D-175B — Patch public abuse orphan-row guardrails)
**Baseline:** 1322/24/57
**Type:** Live verification / documentation only. No code changes.

---

## Evidence Source

Owner-terminal production preflight run from `C:\Users\veltr\HumanX` against `https://humanx.rinkimirikata.com`. Output pasted by owner. Not run from Claude shell.

All throwaway live-verify user IDs and probe claim IDs are redacted from this document.

---

## Preflight Results

| Check | Result |
|---|---|
| `GET /api/health` — service live | `ok: true` |
| `GET /api/health` — mode | `d1-live` |
| `POST /api/session` — works | True |
| `POST /api/session` — exposes `is_admin` | False |
| `POST /api/session` — exposes `is_shadow_banned` | False |
| `POST /api/evidence` with nonexistent `claimId` — HTTP status | 404 |
| `POST /api/evidence` body match for `CLAIM_NOT_FOUND` | False (stream-reading artifact — see note) |
| `POST /api/pressure` with nonexistent `claimId` — HTTP status | 404 |
| `POST /api/pressure` body match for `CLAIM_NOT_FOUND` | False (stream-reading artifact — see note) |
| Frontend `app-v10.js` — admin token input is `type="password"` | True |
| Frontend `app-v10.js` — console logging present | False |
| `GET /api/review` without admin token — HTTP status | 403 |

---

## Notes on Evidence and Pressure Body-Match False Results

The body-match checks use `$_.Exception.Response.GetResponseStream()` after `Invoke-RestMethod` already consumed the response stream. This is the same stream-reading artifact observed in D-173D. The PowerShell body-match returns `False` because the stream has already been read, not because the response body lacks `CLAIM_NOT_FOUND`.

**The 404 status codes are load-bearing.** A 404 from `/api/evidence` and `/api/pressure` for a nonexistent `claimId` is precisely the behavior added by D-175B P2 and P3. Prior to D-175B, both routes would have accepted the request, called `ensureUser`, and inserted orphaned rows. The 404 confirms the claim existence check fired and rejected the request before any INSERT occurred.

The `CLAIM_NOT_FOUND` error token in the body is source/static-verified by D-175B tests:
- `D-175B: addEvidence rejects missing claim with CLAIM_NOT_FOUND` — passes at baseline 1322
- `D-175B: addPressure rejects missing claim with CLAIM_NOT_FOUND` — passes at baseline 1322

---

## Session Rate Limit — Live Behavior and Static Verification

The preflight makes one successful `POST /api/session` call. This confirms `/api/session` remains healthy after the P1 rate-limit addition. The 30/hr/IP threshold is not probed in production (hammering production to reach a rate-limit ceiling would create unnecessary load and data).

Session rate-limit behavior is source/static-verified by D-175B tests:
- `D-175B: /api/session applies safeRateLimit before readJson` — `safeRateLimit` call precedes `readJson` in `createOrGetUser`
- `D-175B: session rate-limit key is IP-scoped` — key is `session:${ip(request)}`
- `D-175B: session rate-limit is 30/hr/IP` — limit is `30, 3600000`
- `D-175B: session response does not expose IP or fingerprint` — SELECT omits `fingerprint_hash`; return is `json({ user, owner_token })` only

---

## What D-175D Does Not Claim

- Does not claim live body-content verification of `CLAIM_NOT_FOUND` error token (stream-reading artifact).
- Does not claim live verification of the 30/hr/IP rate-limit threshold on `/api/session`.
- Does not claim any admin token, owner token, invite code, or internal credential.
- Does not claim production verification from Claude shell.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement added or changed in D-175B through D-175D.

## No Admin/Review Route Semantics Changed

`/api/review/*` routes are untouched in D-175B through D-175D. The 403 without admin token confirms the gate is live in production.

---

## Recommended Next Step

D-176A or equivalent — next audit or feature cycle. D-175 chain (A through D) is complete.
