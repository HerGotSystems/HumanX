# D-177D — Frontend Modal HTML Contract Live Verification

**Date:** 2026-06-25
**Local commit:** 61b87f5 (D-177C — Bump deploy metadata for D-177B)
**Patch commit verified:** 5df55b1 (D-177B — Add frontend modal HTML safety contract)
**Baseline:** 1344/24/57
**Type:** Live verification / documentation only. No code changes.

---

## Evidence Source

Owner-terminal production preflight run from `C:\Users\veltr\HumanX` against `https://humanx.rinkimirikata.com`. Output pasted by owner. Not run from Claude shell.

Throwaway live-verify user ID is redacted from this document.

---

## Preflight Results

| Check | Result |
|---|---|
| `GET /api/health` — service live | `ok: true` |
| `GET /api/health` — mode | `d1-live` |
| `GET /app-v10.js` — reachable in production | True |
| `app-v10.js` — `hxModal` function present | True |
| `app-v10.js` — raw-HTML safety contract comment present | True |
| `app-v10.js` — admin token input is `type="password"` | True |
| `app-v10.js` — console logging present | False |
| `app-v10.js` — `safeHttpUrl` function present | True |
| `app-v10.js` — `toast()` uses `textContent` | True |
| `POST /api/session` — works | True |
| `POST /api/session` — exposes `is_admin` | False |
| `POST /api/session` — exposes `is_shadow_banned` | False |
| `GET /api/review` without admin token — HTTP status | 403 |

---

## What the Preflight Confirms

**D-177B comment is live in the deployed frontend:** The raw-HTML safety contract comment for `hxModal` (`"raw HTML"` and `esc` both matched) is present in the production `app-v10.js` bundle. The preflight does not dynamically exercise modal rendering or fuzz for XSS — D-177B was comment/contract-only and did not change runtime behavior. The check confirms source-level deployment only.

**Frontend safety properties unchanged from D-177A:** No console logging, admin token input remains masked (`type="password"`), `safeHttpUrl` is present, `toast()` uses `textContent`. These are source-level signal checks consistent with the static checks in D-177B tests.

**Session and review gate unchanged:** `/api/session` is healthy with clean field exposure; `/api/review` without admin returns 403.

---

## What the Preflight Intentionally Did Not Claim

**XSS dynamic testing:** D-177B was a comment-only patch. The preflight confirms the deployed source contains the contract comment. It does not claim that XSS vectors were dynamically exploited or fuzz-tested in production — that was not the scope of D-177B.

**Modal caller escaping verification at runtime:** That `markDuplicateUI` and `resolveSimilarUI` correctly escape user-controlled values is source/static-verified by D-177B tests at baseline 1344. It is not verified by this preflight.

---

## What D-177D Does Not Claim

- Does not claim live dynamic XSS testing was performed.
- Does not claim any admin token, owner token, invite code, SQL text, D1 internals, stack traces, or internal debug metadata.
- Does not claim production verification from Claude shell.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement added or changed in D-177B through D-177D.

## No Admin/Review Route Semantics Changed

`/api/review/*` routes are untouched. The 403 without admin token confirms the gate is live in production.

---

## Recommended Next Step

D-178A or equivalent — next audit or feature cycle. D-177 chain (A through D) is complete.
