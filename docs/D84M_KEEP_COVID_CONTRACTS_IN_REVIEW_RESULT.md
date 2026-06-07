# D-84M: Keep "UK government Covid vaccine contract terms" in Review — Result

Date: 2026-06-07
Step: D-84M — final D-84 sequence item, no-action disposition
Type: Read-only verification. Docs-only commit to main.
No POST. No moderation action. No D1. No Wrangler.

---

## 1. Decision

The user confirmed: keep `clm_13afcc7128054661a3`
("The UK government published Covid vaccine contract terms in 2021") in
`review_state='review'` with no moderation action.

Rationale (from D-84J-AUDIT):
- Potentially factual public-record claim (UK government did publish some Covid vaccine
  contract information in 2021 following FOI pressure)
- report_count: 0 — no user has reported it
- testability: 75 — correctly classified as Physical/Testable
- status: Plausible — internally consistent, not a scoring artifact
- From test/dev account, but qualitatively different from junk submissions
- Safest path: leave in review for future editorial consideration with sourced evidence

No POST call was made. `review_state` is unchanged.

---

## 2. Preflight Verification

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| git HEAD | 9a73feb | 9a73feb | ✅ |
| Working tree | clean | clean | ✅ |
| Queue by state: rejected | 19 | 19 | ✅ |
| Queue by state: review | 2 | 2 | ✅ |
| Queue by state: public | 0 | 0 | ✅ |
| Seed claims in queue | 0 | 0 | ✅ |

---

## 3. D-84M Target Confirmed

Confirmed via `GET /api/review` (read-only):

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
| id | `clm_13afcc7128054661a3` | `clm_13afcc7128054661a3` | ✅ |
| claim | "The UK government published Covid vaccine contract terms in 2021" | matches | ✅ |
| review_state | `review` | `review` | ✅ |
| report_count | 0 | 0 | ✅ |
| status | Plausible | Plausible | ✅ |
| testability | 75 | 75 | ✅ |

No action taken. State unchanged.

---

## 4. Remaining Review Queue Items

After the full D-84 sequence, the review queue contains exactly 2 non-seed,
non-rejected items in `review_state='review'`:

| id | Claim | report_count | Notes |
|----|-------|:---:|-------|
| `clm_af8da34be53b40f395` | Hard work always pays off | 0 | Returned to review in D-84K; plausible cultural claim |
| `clm_13afcc7128054661a3` | The UK government published Covid vaccine contract terms in 2021 | 0 | Kept in review D-84M; potentially factual |

Both are safe in review state — not publicly visible, not reported.

---

## 5. Public Feed State — Clarification

The `GET /api/claims` public feed contains **22 claims total**:

- **5 editorial launch seed claims** (D-77 through D-80G) — the intended public content
- **17 older pre-D-84-scope claims** — demo seeds and test data inserted before D-84
  was scoped (e.g. "The Earth is flat" demo, "People are stupid - TEST", old seed IDs
  beginning `clm_seed_0f5608464fb5` etc.). These were never in the 21-item D-84A
  review queue and were therefore out of D-84 scope.

**D-84 scope clarification:** D-84 targeted the **21 non-seed claims that appeared in
`GET /api/review`** (non-public OR reported). All 21 have been resolved:

| Disposition | Count | Items |
|-------------|:---:|-------|
| Rejected | 19 | All junk, artefacts, scoring-error claims |
| Returned to review | 1 | "Hard work always pays off" (D-84K) |
| Kept in review (no action) | 1 | "UK government Covid contracts" (D-84M) |

The 17 additional public claims visible in `GET /api/claims` are a separate body of
pre-existing data outside D-84 scope. A future cleanup task could address those if
desired.

---

## 6. D-84 Full Cleanup Scorecard

### Phase 1 — Review-state junk (4 items, all from test/dev account)

| Step | id | Claim | Action | Result |
|------|----|-------|--------|--------|
| D-84C | clm_2c1751dd6605412db2 | I am the best | rejected | ✅ |
| D-84D | clm_d1e4261798754199a6 | Belief Engine Profile — Stoic Atheism | rejected | ✅ |
| D-84E | clm_852333ac90654ab495 | everyone knows the government is hiding everything | rejected | ✅ |
| D-84F | clm_a51c7861a89945339b | GOD DONT EXIST | rejected | ✅ |

### Phase 2 — Public junk (3 items, all public with reports)

| Step | id | Claim | Action | Result |
|------|----|-------|--------|--------|
| D-84G | clm_6bd4e59efa2a44d1b2 | EVERYBODY IS IDIOT | rejected | ✅ |
| D-84H | clm_ba71db1962b8474bb7 | PEOPLE ARE STUPID | rejected | ✅ |
| D-84I | clm_3905faadfa9c47159e | DOCTRINE | rejected | ✅ |

### Phase 3 — Judgment calls (4 items)

| Step | id | Claim | Action | Result |
|------|----|-------|--------|--------|
| D-84J | clm_eec72f024040428190 | Children should always obey adults | rejected | ✅ |
| D-84K | clm_af8da34be53b40f395 | Hard work always pays off | returned to review | ✅ |
| D-84L | clm_ae59b53d5f4249f0b4 | Never trust the experts | rejected | ✅ |
| D-84M | clm_13afcc7128054661a3 | UK government Covid vaccine contracts | no action / keep review | ✅ |

### Pre-existing rejected (10 items — already rejected before D-84, unarchivable)

Remained rejected throughout. Cannot be archived via `reviewCleanup` — keyword guard
blocks all 10 (none contain "smoke", "test", "automated write", or "automated smoke").
Phase 4 archive remains blocked by code. A future code change would be needed to clear
these from the review queue display.

### Summary

| Metric | Value |
|--------|-------|
| Total D-84A queue items | 21 |
| Items actively moderated in D-84 | 11 (Phases 1–3) |
| Rejected in D-84 | 9 |
| Returned to review in D-84 | 1 |
| Kept in review (no action) in D-84 | 1 |
| Pre-existing rejected (unchanged) | 10 |
| Final queue: rejected | 19 |
| Final queue: review | 2 |
| Final queue: public (non-seed) | 0 |
| Public feed non-seed items in D-84 scope | 0 |

---

## 7. Non-Mutation Statement

D-84M made no moderation decisions.
No POST call was made.
No `review_state` was changed.
No D1 command was run.
No Wrangler was run.
Admin token used only for `GET /api/review` (read-only) and not printed, logged,
or committed. Temp files deleted after reading.

---

## D-84M Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at 9a73feb | ✅ |
| Working tree clean | ✅ |
| D-84M target confirmed: review_state=review, report_count=0 | ✅ |
| No POST call made | ✅ |
| No review_state changed | ✅ |
| Remaining review queue (2 items) confirmed | ✅ |
| Public feed scope clarification documented | ✅ |
| D-84 full cleanup scorecard recorded | ✅ |
| No D1 command run | ✅ |
| No Wrangler run | ✅ |
| Admin token not printed, logged, or committed | ✅ |
| Temp files deleted | ✅ |
| docs/D84M_KEEP_COVID_CONTRACTS_IN_REVIEW_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Static checks 127/24/39 confirmed | ✅ |
| Docs committed to main | ✅ |
