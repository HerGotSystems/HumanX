# D-174D — Home Test Raw-Row Response Patch Live Verification

**Date:** 2026-06-25
**Local commit:** cbfa26c (D-174C — Bump deploy metadata for D-174B)
**Patch commit verified:** ae6c7ea (D-174B — Patch home test raw-row response)
**Baseline:** 1308/24/57
**Type:** Live verification / documentation only. No code changes.

---

## Evidence Source

Owner-terminal production preflight run from `C:\Users\veltr\HumanX` against `https://humanx.rinkimirikata.com`. Output pasted by owner. Not run from Claude shell.

All probe user IDs are throwaway live-verify values and are redacted from this document.

---

## Preflight Results

| Check | Result |
|---|---|
| `GET /api/health` — service live | `ok: true` |
| `GET /api/health` — mode | `d1-live` |
| `POST /api/session` — works | True |
| `POST /api/session` — exposes `is_admin` | False |
| `POST /api/session` — exposes `is_shadow_banned` | False |
| Frontend `app-v10.js` — admin token input is `type="password"` | True |
| Frontend `app-v10.js` — console logging present | False |
| `GET /api/review` without admin token — HTTP status | 403 |

---

## What the Preflight Intentionally Did Not Test (and Why)

**`addHomeTest()` / `mapHomeTest()` response shape (D-174B P1):** The preflight does not submit a valid home test. Doing so would create a production `home_tests` row linked to a real claim, polluting production data. The mapper behavior — that `addHomeTest()` returns `test: mapHomeTest(row)` instead of `test: row`, and that `user_id` is excluded — is verified by D-174B static tests at baseline 1308:

- `D-174B: mapHomeTest mapper exists in worker` — `function mapHomeTest(` present
- `D-174B: addHomeTest response uses mapHomeTest instead of raw row` — `test:mapHomeTest(row)` present; `test:row` absent
- `D-174B: mapHomeTest does not expose user_id` — `user_id` absent from mapper body
- `D-174B: mapHomeTest does not expose email, is_admin, or is_shadow_banned` — sensitive fields absent
- `D-174B: mapHomeTest preserves expected product fields` — id, title, instructions, safety_level, difficulty, createdAt, handle all present

D-174D is live evidence for the complementary checks that can be safely probed without creating production data.

---

## What D-174D Does Not Claim

- Does not claim live verification of `mapHomeTest()` response shape.
- Does not claim live verification that `user_id` is absent from the production home test response.
- Does not claim any admin token, owner token, invite code, or internal credential.
- Does not claim production verification from Claude shell.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement added or changed in D-174B through D-174D.

## No Admin/Review Route Semantics Changed

`/api/review/*` routes are untouched in D-174B through D-174D. The 403 without admin token confirms the gate is live in production.

---

## Recommended Next Step

D-175A or equivalent — next audit or feature cycle. D-174 chain (A through D) is complete.
