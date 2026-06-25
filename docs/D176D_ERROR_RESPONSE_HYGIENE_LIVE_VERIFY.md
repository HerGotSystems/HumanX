# D-176D — Error Response Hygiene Live Verification

**Date:** 2026-06-25
**Local commit:** 0764412 (D-176C — Bump deploy metadata for D-176B)
**Patch commit verified:** b65f935 (D-176B — Patch error response hygiene)
**Baseline:** 1335/24/57
**Type:** Live verification / documentation only. No code changes.

---

## Evidence Source

Owner-terminal production preflight run from `C:\Users\veltr\HumanX` against `https://humanx.rinkimirikata.com`. Output pasted by owner. Not run from Claude shell.

All throwaway live-verify user IDs, probe claim IDs, and probe target IDs are redacted from this document.

---

## Preflight Results

| Check | Result |
|---|---|
| `GET /api/health` — service live | `ok: true` |
| `GET /api/health` — mode | `d1-live` |
| `POST /api/session` — works | True |
| `POST /api/session` — exposes `is_admin` | False |
| `POST /api/session` — exposes `is_shadow_banned` | False |
| `POST /api/report` with invalid `targetType` — HTTP status | 400 |
| `POST /api/evidence` with nonexistent `claimId` — HTTP status | 404 |
| Frontend `app-v10.js` — admin token input is `type="password"` | True |
| Frontend `app-v10.js` — console logging present | False |
| `GET /api/review` without admin token — HTTP status | 403 |

---

## What the Preflight Confirms

**Known validation errors remain safe and non-500:** An invalid `targetType` on `POST /api/report` returns 400, and a nonexistent `claimId` on `POST /api/evidence` returns 404. These are the same deliberate validation error paths that D-176B did not change — confirming that the error hygiene patches did not disturb existing 400/404 behavior.

**Session, frontend, and review gate unchanged:** `/api/session` is healthy with clean field exposure; admin token input is masked; no console logging; `/api/review` without admin returns 403.

---

## What the Preflight Intentionally Did Not Test (and Why)

**Global 500 `INTERNAL_ERROR` behavior (D-176B P1):** The preflight does not deliberately trigger an unexpected DB error in production. Doing so could create inconsistent state or waste D1 write capacity. The patched behavior — that the global catch now returns `{ error:'INTERNAL_ERROR', message:'Unexpected server error.' }` instead of raw `err.message` — is source/static-verified by D-176B tests at baseline 1335:
- `D-176B: global catch 500 does not return raw err.message`
- `D-176B: global catch 500 returns INTERNAL_ERROR with generic message`
- `D-176B: global catch does not expose SQL or stack text publicly`

**`TRUTH_LINK_FAILED` generic message (D-176B P2):** Triggering this path requires a successful truth-to-claim conversion followed by a link-step DB failure — a compound rare condition. Source/static-verified by:
- `D-176B: TRUTH_LINK_FAILED does not return raw linkErr.message`
- `D-176B: TRUTH_LINK_FAILED preserves machine-readable error code`

**Builder context error (D-176B P3):** Requires `claim_builder` context submission followed by a builder-context INSERT failure. Source/static-verified by:
- `D-176B: builder context failure does not embed raw cbcErr.message`

**`safeAll` lineage error sanitization (D-176B P4):** Requires a DB error on the truth lineage query during a claim fetch. Source/static-verified by:
- `D-176B: safeAll lineage errors do not expose raw SQL error text`

---

## What D-176D Does Not Claim

- Does not claim live verification of the generic global 500 response body.
- Does not claim live verification that `TRUTH_LINK_FAILED`, builder context, or `safeAll` errors are sanitized in production.
- Does not claim any admin token, owner token, invite code, SQL text, D1 internals, stack traces, or internal credential.
- Does not claim production verification from Claude shell.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement added or changed in D-176B through D-176D.

## No Admin/Review Route Semantics Changed

`/api/review/*` routes are untouched in D-176B through D-176D. The 403 without admin token confirms the gate is live in production.

---

## Recommended Next Step

D-177A or equivalent — next audit or feature cycle. D-176 chain (A through D) is complete.
