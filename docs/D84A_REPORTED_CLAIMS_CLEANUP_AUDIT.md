# D-84A: Reported Claims Cleanup Audit

Date: 2026-06-07
Step: D-84A — read-only audit of non-seed review queue
Type: Read-only. Docs-only commit to main.
No moderation actions. No POST calls. No D1. No Wrangler. No destructive action.

---

## 1. Purpose

D-81 and D-82 noted 21 non-seed claims remaining in the review queue after launch seed
pack publication. D-84A audits those items in full so that a moderation plan (D-84B) and
subsequent per-item cleanup actions (D-84C+) can be planned and explicitly approved.

No cleanup is performed in this step.

---

## 2. Non-Mutation Statement

D-84A made no moderation decisions.
D-84A called no POST endpoints.
D-84A called no write routes.
D-84A made no D1 commands.
D-84A ran no Wrangler.
D-84A did not change any `review_state`, `report_count`, `status`, or any other field.
No DB row was modified during D-84A.
The admin token was used only for `GET /api/review` (read-only) and was not printed,
logged, or committed. The temp response file was deleted after reading.

---

## 3. Endpoints Used

| Endpoint | Type | Purpose |
|----------|------|---------|
| `GET /api/review` | Admin read-only | Full review queue — claims, evidence, truths, metadata |

No write endpoints called.

---

## 4. Queue Summary

`GET /api/review` response shape: `{ claims, truths, evidence, review, archived_claims, archived_truths, archived_total, duplicate_total }`

| Metric | Count |
|--------|-------|
| Total claims in queue | 21 |
| Seed claims in queue | 0 ✅ |
| Non-seed claims in queue | 21 |
| Evidence items in queue | 0 |
| Truths in queue | 0 |
| Archived claims (metadata) | 1 |
| Archived truths (metadata) | 0 |
| Duplicate-flagged claims (metadata) | 0 |

**By review_state breakdown (21 claims):**

| review_state | Count | Description |
|-------------|-------|-------------|
| `'public'` with `report_count > 0` | 5 | Live public claims that have been reported — still visible to users |
| `'review'` | 6 | Claims in moderation queue (never promoted or pending re-review) |
| `'rejected'` | 10 | Already rejected — not publicly visible, still appear in review queue |

**All 21 claims belong to a single user handle:** `usr_3c204c78f6fa49bfad`

---

## 5. All Non-Seed Queue Items

### 5A — Public Claims with Reports (review_state = 'public', report_count > 0)

These 5 claims are **currently visible to the public**. They have been reported at least once.

| # | id | Claim text | report_count | Reported reason | status | Created (ms) | Category |
|---|-----|-----------|:---:|:---:|:---:|:---:|:---:|
| 1 | `clm_6bd4e59efa2a44d1b2` | EVERYBODY IS IDIOT | 1 | `2` | Plausible | 1780612085771 | **A — obvious junk** |
| 2 | `clm_ba71db1962b8474bb7` | PEOPLE ARE STUPID | 1 | `del` | Plausible | 1780612114679 | **A — obvious junk** |
| 3 | `clm_eec72f024040428190` | Children should always obey adults | 1 | `2` | Proven | 1780391966515 | C — needs review |
| 4 | `clm_3905faadfa9c47159e` | DOCTRINE | 1 | `3` | Proven | 1780413440639 | **A — obvious junk** (single-word, all-caps) |
| 5 | `clm_af8da34be53b40f395` | Hard work always pays off | 1 | `BECAUSE I CANT SEE IT` | Plausible | 1780090105615 | B/C — debatable proverb; report reason is unhelpful |

**Notes on report reasons:** The `latest_report_reason` values appear to be either
report-type numeric codes (`2`, `3`, `5`) or free text (`del`, `BECAUSE I CANT SEE IT`).
Numeric codes likely map to internal report categories (e.g., 2 = spam/junk, 3 = offensive,
5 = misinformation). The exact mapping is not exposed by `GET /api/review`.

---

### 5B — Review-State Claims (review_state = 'review')

These 6 claims are **not publicly visible**. They are in the moderation queue.

| # | id | Claim text | report_count | status | Created (ms) | Category |
|---|-----|-----------|:---:|:---:|:---:|:---:|
| 6 | `clm_13afcc7128054661a3` | The UK government published Covid vaccine contract terms in 2021 | 0 | Plausible | 1780672628819 | C — factual claim, needs sourcing check |
| 7 | `clm_852333ac90654ab495` | everyone knows the government is hiding everything | 0 | Plausible | 1780672596450 | B — vague conspiracy framing; testable in principle but unfalsifiable as written |
| 8 | `clm_a51c7861a89945339b` | GOD DONT EXIST | 0 | Untestable | 1780609756807 | B — Untestable classification is correct; claim is valid type but informally written |
| 9 | `clm_2c1751dd6605412db2` | I am the best | 0 | Plausible | 1780594726829 | **A — personal/non-verifiable, junk** |
| 10 | `clm_ae59b53d5f4249f0b4` | Never trust the experts | 2 | Proven | 1780357211548 | B — anti-expertise framing, debatable; `status=Proven` is almost certainly scoring error; 2 reports |
| 11 | `clm_d1e4261798754199a6` | Belief Engine Profile — Stoic Atheism | 0 | Plausible | 1780426392624 | **A — test artifact from Belief Engine** |

**Item 10 note:** `Never trust the experts` has `report_count = 2` (first auto-escalation
threshold in the current system is 2 — see `reportTarget` in `src/worker.js`). Status
`Proven` on this claim is very likely a scoring artifact from low-quality evidence being
attached without proper moderation. This item is in `review_state='review'` and not public.

**Item 11 note:** `Belief Engine Profile — Stoic Atheism` is clearly a test artifact
produced by the Belief Engine → Send to HumanX flow during development. It should not
be promoted to public. Candidate for rejection.

---

### 5C — Rejected Claims (review_state = 'rejected')

These 10 claims are **not publicly visible** and have already been rejected by a prior
moderation action. They appear in the review queue endpoint because `GET /api/review`
includes all non-archived queue items regardless of state.

| # | id | Claim text | report_count | Created (ms) | Notes |
|---|-----|-----------|:---:|:---:|:---:|
| 12 | `clm_9c6e0a3aa9924c4e95` | MONEY IS NO GOOD | 0 | 1780612194742 | Junk; already rejected |
| 13 | `clm_1695187b3d6140b88b` | Blablablabla | 0 | 1780509158812 | Gibberish; already rejected |
| 14 | `clm_b3dd4907cb744831b1` | God doesnt exist | 0 | 1780507909821 | Informal; already rejected |
| 15 | `clm_180a9127f4ac4b5281` | Trust the experts | 0 | 1780085197358 | Ambiguous; already rejected |
| 16 | `clm_93b05946babe4e7487` | dont trust expert | 0 | 1780609955961 | Duplicate sentiment of item 15; already rejected |
| 17 | `clm_d02ac47783d0423c93` | gfsdhdfhfdhdfhdfhgdfa | 0 | 1780517651515 | Keyboard smash; already rejected |
| 18 | `clm_da3304ebdfe44e7e8f` | mOON LANDING | 0 | 1780595036860 | Single-phrase, garbled; already rejected |
| 19 | `clm_cca7de1026f043f5bb` | Human really landed on Moon | 0 | 1780595164015 | Informal; already rejected |
| 20 | `clm_721b8ea6de01457ab4` | Humans didnt land on moon | 0 | 1780595245934 | Conspiracy framing; already rejected |
| 21 | `clm_697a5babed9a4332b4` | We never went to space | 0 | 1780595455750 | Conspiracy framing; already rejected |

Rejected claims require no further moderation action — they are already non-public.
They could optionally be archived to remove them from the review queue view.

---

## 6. Cleanup Categories Summary

| Category | Count | Description | Priority |
|----------|-------|-------------|----------|
| **A — Obvious junk/spam/test** | 7 | All-caps, single words, gibberish, test artifacts, personal/non-verifiable | High — safe to reject/keep-rejected |
| **B — Edgy but arguably valid** | 3 | Debatable claims, conspiracy framing, informal religion/belief claims | Medium — needs human judgment |
| **C — Needs manual review** | 3 | Factual claim with potential validity, reported public content, proverb | Medium — research before acting |
| **D — Reported public items** | 5 | All 5 public+reported items overlap with A/B/C above | Varies |
| **E — Already rejected** | 10 | No action needed; optionally archive | Low |

**Category A items (7):**
- `clm_6bd4e59efa2a44d1b2` EVERYBODY IS IDIOT (public, reported)
- `clm_ba71db1962b8474bb7` PEOPLE ARE STUPID (public, reported)
- `clm_3905faadfa9c47159e` DOCTRINE (public, reported)
- `clm_2c1751dd6605412db2` I am the best (review)
- `clm_d1e4261798754199a6` Belief Engine Profile — Stoic Atheism (review)
- 2 keyboard-smash/gibberish claims already in rejected state (12, 17 above)

**Category C — requiring most care:**
- `clm_eec72f024040428190` Children should always obey adults — reported public claim; content is contentious but not necessarily invalid as a sociological claim to be examined
- `clm_13afcc7128054661a3` The UK government published Covid vaccine contract terms in 2021 — potentially factual; needs source verification
- `clm_ae59b53d5f4249f0b4` Never trust the experts — 2 reports, `review_state=review`, `status=Proven` (scoring error); needs careful review before any decision

---

## 7. Recommended Later Moderation Sequence

The following approach is recommended for D-84B/D-84C+ planning. All items to be handled
**one at a time with explicit per-item approval**. No bulk actions.

**Phase 1 — Low-risk rejections (review-state items only, not yet public):**
1. `clm_2c1751dd6605412db2` — "I am the best" → reject (personal/non-verifiable)
2. `clm_d1e4261798754199a6` — "Belief Engine Profile — Stoic Atheism" → reject (test artifact)
3. `clm_a51c7861a89945339b` — "GOD DONT EXIST" → reject or keep-review (Untestable is correct classification; could also just keep in review indefinitely)
4. `clm_852333ac90654ab495` — "everyone knows the government is hiding everything" → reject (unfalsifiable as written)

**Phase 2 — Reported public claims (visible to users, requires more care):**
5. `clm_6bd4e59efa2a44d1b2` — "EVERYBODY IS IDIOT" → reject (remove from public feed)
6. `clm_ba71db1962b8474bb7` — "PEOPLE ARE STUPID" → reject (remove from public feed)
7. `clm_3905faadfa9c47159e` — "DOCTRINE" → reject (single-word, not a claim)

**Phase 3 — Judgment calls (review with human decision):**
8. `clm_eec72f024040428190` — "Children should always obey adults" → keep review or reject; not clearly invalid but highly prescriptive and reported
9. `clm_af8da34be53b40f395` — "Hard work always pays off" → keep review or reject; common proverb, arguably testable but report reason unhelpful
10. `clm_ae59b53d5f4249f0b4` — "Never trust the experts" → reject (anti-expertise framing, 2 reports, scoring error)
11. `clm_13afcc7128054661a3` — UK government Covid contracts — verify factual basis before acting

**Phase 4 — Archive already-rejected (optional housekeeping):**
12–21. The 10 already-rejected items can optionally be archived to clean the review queue
display. `POST /api/review/cleanup` (admin route) or equivalent archival method. Requires
explicit approval.

---

## 8. Risks and Notes

| Risk | Detail |
|------|--------|
| All 21 items are from one user | `usr_3c204c78f6fa49bfad` is clearly a test/development account used before and during the launch seed sequence. Their submissions are uniformly low-quality. This reduces the risk of inadvertently rejecting genuine user content, but decisions should still be made per-item. |
| Reported public items are live | "EVERYBODY IS IDIOT", "PEOPLE ARE STUPID", "DOCTRINE" are currently visible in the public claims feed (`review_state='public'`). They have been reported. Rejecting them will remove them from the public feed. |
| "Children should always obey adults" | This is a reported public claim. It may be a test of the platform's content handling of contentious social norms. It is not illegal or clearly harmful, but is prescriptive. Human judgment required. |
| "Never trust the experts" — scoring error | `status=Proven` on this claim is almost certainly a scoring artifact. The claim is in review_state='review' (not public). Rejecting it is safe from a visibility standpoint. |
| UK government Covid vaccine contracts | This could be a testable factual claim. The UK government did publish redacted contract information in 2021. If the claim is broadly accurate, it may be a legitimate candidate for the review queue. Do not reject without verification. |
| Already-rejected items | No action required. Archiving is optional housekeeping only. |
| Do not promote anything | None of the queue items should be promoted to public as part of cleanup. |

---

## 9. Gate

| Step | Status |
|------|--------|
| D-84A — reported claims cleanup audit | ✅ COMPLETE (this doc) |
| D-84B — per-item moderation plan | ⛔ BLOCKED — define exactly which items to reject and in what order; docs-only |
| D-84C — first cleanup action | ⛔ BLOCKED — requires explicit same-session approval; one item at a time |

**D-84B and D-84C require explicit instruction.**
No moderation will be performed until D-84B is approved and a per-item plan is written.

---

## D-84A Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at D-82 commit (db744fb) | ✅ |
| GET /api/review called — 21 claims, 0 evidence, 0 truths | ✅ |
| 0 seed claims in queue confirmed | ✅ |
| All 21 items individually inspected and categorized | ✅ |
| Single-user account confirmed (test/dev account) | ✅ |
| Category A/B/C/D/E classification complete | ✅ |
| Moderation sequence recommended | ✅ |
| No moderation action taken | ✅ |
| No POST call made | ✅ |
| No D1 command run | ✅ |
| No Wrangler run | ✅ |
| Admin token not printed, logged, or committed | ✅ |
| Temp queue file deleted after reading | ✅ |
| docs/D84A_REPORTED_CLAIMS_CLEANUP_AUDIT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
