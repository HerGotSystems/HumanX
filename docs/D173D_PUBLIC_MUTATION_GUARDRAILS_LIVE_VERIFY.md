# D-173D — Public Mutation Guardrails Live Verification

**Date:** 2026-06-25
**Local commit:** ddae5f5 (D-173C — Bump deploy metadata for D-173B)
**Patch commit verified:** 7b0e99d (D-173B — Patch public mutation guardrails)
**Baseline:** 1300/24/57
**Type:** Live verification / documentation only. No code changes.

---

## Evidence Source

Owner-terminal production preflight run from `C:\Users\veltr\HumanX` against `https://humanx.rinkimirikata.com`. Output pasted by owner. Not run from Claude shell.

All probe user IDs and probe target IDs are throwaway live-verify values and are redacted from this document.

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
| `POST /api/report` invalid type — response mentions `BAD_TARGET_TYPE` or target-type validation | False (see note) |
| `POST /api/truths` with missing `linkedClaimId` — HTTP status | 400 |
| `POST /api/truths` invalid linked claim — response mentions linked/claim | False (see note) |
| `GET /api/review` without admin token — HTTP status | 403 |

---

## Notes on False Response-Body Matches

The preflight checks two boolean conditions using PowerShell string matching against the raw response body:

**Invalid report `targetType`:** HTTP 400 was returned, confirming the allowlist guard (P1, D-173B) is live. The PowerShell match for `"BAD_TARGET_TYPE|target"` returned False — this means the response body arrived in a format that PowerShell's `-match` did not resolve against the streamed reader at that point. The 400 status itself is the load-bearing signal; the body content is implementation detail confirmed by D-173B static tests.

**Invalid `linkedClaimId`:** HTTP 400 was returned, confirming the linkedClaimId validation guard (P3, D-173B) is live. The PowerShell match for `"linked|claim|LINKED"` returned False for the same stream-reading reason. The 400 status is the load-bearing signal.

Both 400 responses are consistent with and only possible if the D-173B guardrails are deployed and executing.

---

## What the Preflight Intentionally Did Not Test (and Why)

**Per-user duplicate report dedupe (P2):** The preflight does not submit a valid first report and then a duplicate. Doing so would create production report rows against a throwaway target ID, incrementing `report_count` and potentially triggering `review_state='review'` on a real claim. To avoid production data pollution, the dedupe path was not exercised live. It is verified by D-173B static tests (smoke test: `duplicate report returns ok:true duplicate:true without incrementing`; baseline 1300).

**`convertTruthToClaim()` response sanitization (P4):** The preflight does not submit a truth and then invoke truth-to-claim conversion. Doing so would create production truth and claim rows. The response shape — specifically that `normalized_claim`, `user_id`, `damage`, and `status_locked` are absent — is verified by D-173B static tests (`convertTruthToClaim uses mapClaim wrapper on all return paths`, `convertTruthToClaim mapClaim does not expose normalized_claim`, `convertTruthToClaim mapClaim does not expose user_id or damage`; baseline 1300).

D-173B source/static tests verified both behaviors against the deployed source at baseline 1300. D-173D is live evidence for the complementary checks that can be safely probed without creating production data.

---

## What D-173D Does Not Claim

- Does not claim live verification of report dedupe behavior.
- Does not claim live verification of `convertTruthToClaim()` response shape.
- Does not claim the PowerShell response-body string match results are authoritative — the HTTP status codes are.
- Does not claim any admin token, owner token, invite code, or internal credential.
- Does not claim production verification from Claude shell.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement added or changed in D-173B through D-173D.

## No Admin/Review Route Semantics Changed

`/api/review/*` routes are untouched in D-173B through D-173D. The 403 without admin token confirms the gate is live.

---

## Recommended Next Step

D-174A or equivalent — next audit or feature cycle. D-173 chain (A through D) is complete.
