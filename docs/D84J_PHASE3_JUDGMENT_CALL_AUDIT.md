# D-84J-AUDIT: Phase 3 Judgment Call Audit

Date: 2026-06-07
Step: D-84J-AUDIT — read-only audit of four remaining Phase 3 non-seed queue items
Type: Read-only. Docs-only commit to main.
No moderation actions. No POST calls. No D1. No Wrangler.

---

## 1. Purpose

Phase 1 and Phase 2 of the D-84B cleanup plan are complete. Seven items have been
rejected (D-84C through D-84I). Four items remain. All four are judgment calls —
they are not automatic junk, and each requires individual human consideration before
any action is taken. This audit documents the full state of each item and a
recommended classification.

No moderation decisions are made here. All four items are unchanged.

---

## 2. Preflight Verification

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| git HEAD | 32cf61c | 32cf61c | ✅ |
| Working tree | clean | clean | ✅ |
| Queue: rejected | 17 | 17 | ✅ |
| Queue: public | 2 | 2 | ✅ |
| Queue: review | 2 | 2 | ✅ |
| Evidence items in queue | 0 | 0 | ✅ |
| Seed claims in queue | 0 | 0 | ✅ |
| Total public claims (feed) | 24 | 24 | ✅ |

---

## 3. Item-by-Item Audit

### Item 1 — clm_eec72f024040428190

| Field | Value |
|-------|-------|
| id | `clm_eec72f024040428190` |
| Claim text | Children should always obey adults |
| review_state | `public` |
| In public feed | Yes (confirmed via GET /api/claims) |
| report_count | 1 |
| latest_report_reason | `2` (numeric report code — likely spam/junk or inappropriate) |
| category | family |
| type | Truth-Derived |
| status | **Proven** |
| evidence_score | 85 |
| survivability | 94 |
| testability | 50 |
| contradictions | 1 |
| beliefYes / beliefNo / uncertainty | 1 / 0 / 0 |
| user_id | `usr_3c204c78f6fa49bfad` (test/dev account) |
| near_duplicate_of | null |
| duplicate_of | null |
| status_locked | 0 |

**Analysis:**

This claim is a prescriptive social norm statement, not a falsifiable factual claim in
the narrow sense. However it is testable in principle — child psychology and developmental
science have studied compliance, autonomy, and harm outcomes extensively. The claim as
written ("always obey") is an absolute that most child development research would
contradict (unconditional obedience is associated with harm outcomes; developmentally
appropriate autonomy is associated with better outcomes). The testability score of 50
is consistent with a borderline-testable framing.

**Status concern:** `status=Proven` with `evidenceScore=85` is almost certainly a
scoring artifact — the test/dev account likely attached low-quality or circular evidence.
The claim text and testability score do not support "Proven". If this claim were to be
promoted intentionally, the status would need investigation and likely a rewrite/edit
before promotion.

**Report:** report_count=1, reason code `2`. Platform is correctly flagging this.

**From account:** Same test/dev account as all other queue items (`usr_3c204c78f6fa49bfad`).
This was not a considered submission of a debated social claim — it is a test artefact
from the development account, submitted in the same batch as "EVERYBODY IS IDIOT" and
"PEOPLE ARE STUPID".

**Classification: REJECT**

Reasoning:
- Prescriptive absolute ("always obey") is not a well-formed testable factual claim
- Submitted by the test/dev account in the same session as obvious junk
- `status=Proven` is a scoring artifact — the claim has not been editorially reviewed
- Has been user-reported (reason 2)
- If a genuine, carefully-framed version of this debate were submitted (e.g. "Studies
  show unconditional child obedience is associated with adverse developmental outcomes")
  it could be a legitimate claim — but this version is not that

---

### Item 2 — clm_af8da34be53b40f395

| Field | Value |
|-------|-------|
| id | `clm_af8da34be53b40f395` |
| Claim text | Hard work always pays off |
| review_state | `public` |
| In public feed | Yes (confirmed via GET /api/claims) |
| report_count | 1 |
| latest_report_reason | `BECAUSE I CANT SEE IT` (free-text, unhelpful) |
| category | culture |
| type | Truth-Derived |
| status | Plausible |
| evidence_score | 62 |
| survivability | 73 |
| testability | 50 |
| contradictions | 0 |
| beliefYes / beliefNo / uncertainty | 1 / 0 / 0 |
| user_id | `usr_3c204c78f6fa49bfad` (test/dev account) |
| near_duplicate_of | null |
| duplicate_of | null |
| status_locked | 0 |

**Analysis:**

This is a common cultural proverb. Unlike the previous item, it is not obviously
harmful or insult-like. The claim is testable in principle: economic mobility research,
studies on meritocracy, and labour economics could speak to it. "Always pays off" is an
absolute that research would challenge (structural barriers, luck, inherited advantage
are documented), making this an interesting claim for the platform to host if it were
submitted intentionally.

**Status concern:** `status=Plausible` with `evidenceScore=62` is within a plausible
range and does not indicate a scoring artifact. The scoring here is internally consistent.

**Report:** report_count=1, but reason is `BECAUSE I CANT SEE IT` — clearly a frustrated
personal remark rather than a considered moderation report. This report alone does not
constitute evidence the claim is harmful or invalid.

**From account:** Same test/dev account. However, this is one of the older submissions
(created 1780090105615 — significantly earlier than the obvious junk batch). It may have
been submitted during early platform testing rather than in the same junk-submission
session as "EVERYBODY IS IDIOT".

**Classification: RETURN TO REVIEW (weakly) — or KEEP PUBLIC**

Reasoning:
- The claim text, while a cliché, is a meaningful cultural belief that the platform could
  legitimately host for pressure-testing
- `status=Plausible` and `evidenceScore=62` are not alarming
- The report reason is not substantive
- The submission predates the obvious junk batch by a significant margin
- The strongest argument against: it came from the test/dev account, and the platform
  currently only has 5 editorial launch-seed public claims; having a test-account proverb
  alongside them is messy

**Recommendation:** Return to review rather than reject. This is the one Phase 3 item
most likely to have value as a legitimate claim type. If the platform later has a clear
path for claims from the general public (not just the seed pack), this could be promoted
again after proper editorial review. Rejecting it permanently would be premature.

**Caveat:** If the user prefers a clean public feed with only seed-pack claims for now,
rejection is also defensible. Neither outcome is wrong.

---

### Item 3 — clm_ae59b53d5f4249f0b4

| Field | Value |
|-------|-------|
| id | `clm_ae59b53d5f4249f0b4` |
| Claim text | Never trust the experts |
| review_state | `review` (not public) |
| In public feed | No |
| report_count | 2 |
| latest_report_reason | `5` (numeric code) |
| category | institution |
| type | Truth-Derived |
| status | **Proven** |
| evidence_score | 85 |
| survivability | 96 |
| testability | 50 |
| contradictions | 0 |
| beliefYes / beliefNo / uncertainty | 0 / 0 / 0 |
| user_id | `usr_3c204c78f6fa49bfad` (test/dev account) |
| near_duplicate_of | null |
| duplicate_of | null |
| status_locked | 0 |

**Analysis:**

`report_count=2` has met the auto-escalation threshold that puts a claim into
`review_state='review'` — this claim was escalated automatically and has never been
publicly visible since escalation. This is the scoring system working correctly.

**Status concern:** `status=Proven` with `evidenceScore=85`, `survivability=96`, and
`contradictions=0` is a clear scoring artifact. The claim "Never trust the experts"
is an absolute anti-expertise statement. It has zero contradictions in the scoring
system despite no evidence having survived peer pressure — this almost certainly means
attached evidence was not properly reviewed (or consisted of low-quality corroborating
sources from the test account). A `Proven` status on this claim would be highly
misleading to any user who saw it.

**Content:** The claim is epistemically problematic as an absolute ("never trust") but
is arguably testable in principle. Research on expert disagreement, conflicts of
interest, institutional bias, and expert failure exists. A carefully-framed version
("Experts are sometimes wrong" or "Institutional biases can affect expert consensus
in specific fields") could be a legitimate claim. This version is not that.

**Classification: REJECT**

Reasoning:
- `status=Proven` is a scoring artifact; this claim should never be promoted with that
  status label
- report_count=2 already triggered the auto-escalation review gate correctly
- Anti-expertise absolute framing ("never trust") is not a testable factual claim
- From test/dev account, same user as all other queue items
- Even if the status were corrected, this version is too sweeping to be useful

---

### Item 4 — clm_13afcc7128054661a3

| Field | Value |
|-------|-------|
| id | `clm_13afcc7128054661a3` |
| Claim text | The UK government published Covid vaccine contract terms in 2021 |
| review_state | `review` (not public) |
| In public feed | No |
| report_count | 0 |
| latest_report_reason | null |
| category | Politics |
| type | Physical/Testable |
| status | Plausible |
| evidence_score | 24 |
| survivability | 41 |
| testability | 75 |
| contradictions | 0 |
| beliefYes / beliefNo / uncertainty | 1 / 0 / 0 |
| user_id | `usr_3c204c78f6fa49bfad` (test/dev account) |
| near_duplicate_of | null |
| duplicate_of | null |
| status_locked | 0 |

**Analysis:**

This is a factual historical claim about a verifiable public record event. The UK
government did publish information about Covid vaccine contracts in 2021, though the
completeness and timing of that disclosure was contested (some terms remained redacted
for commercial confidentiality). The claim as written is broadly accurate in that
published disclosures did occur, but the precise scope ("contract terms") may be
contested depending on which documents are referenced.

**No report.** This item has no reports. It entered review state as a new submission and
has simply never been moderated.

**Status and scoring:** `status=Plausible`, `evidenceScore=24`, `testability=75` — these
are low-confidence scores with no attached evidence having been reviewed. The `Plausible`
label and low evidence score correctly reflect the state: this is a testable claim with
no verified evidence attached yet.

**Account:** Same test/dev account. However, this is qualitatively different from the
other items — it is a recognisable type of claim the platform is designed to host
(verifiable public-record facts about government actions).

**Classification: NEEDS FACTUAL RESEARCH BEFORE DECISION**

Reasoning:
- The claim appears broadly factual (the UK government did release some Covid contract
  information in 2021, specifically after Freedom of Information pressure and legal
  challenges — e.g. Mishcon de Reya FOI case)
- It has not been reported, has a sensible type classification (Physical/Testable), and
  a testability score of 75
- The weakest argument for keeping: it came from a test/dev account and has never had
  editorial review or sourced evidence attached
- The strongest argument for keeping: it is a legitimate form of claim that could serve
  as a demonstration of the platform's value if properly sourced
- Recommended path: leave in review state. Do not reject. If sourced evidence is later
  attached and the claim text is verified, it could be promoted. If the platform is
  cleaned to test-account-only for now, it could be rejected without prejudice.
- Do NOT promote to public without at least one verified source attached

**Safest action: take no action on this item until a sourcing decision is made.**

---

## 4. Classification Summary

| Item | Claim | State | Classification | Confidence |
|------|-------|-------|---------------|-----------|
| clm_eec72f024040428190 | Children should always obey adults | public | **REJECT** | High |
| clm_af8da34be53b40f395 | Hard work always pays off | public | **RETURN TO REVIEW** | Medium (or keep public) |
| clm_ae59b53d5f4249f0b4 | Never trust the experts | review | **REJECT** | High |
| clm_13afcc7128054661a3 | UK government Covid vaccine contract terms | review | **NEEDS RESEARCH** | High (keep in review) |

---

## 5. Scoring Artifact Flag

Two items carry `status=Proven` that is almost certainly a scoring artifact:

| Claim | status | evidenceScore | Why it's likely an artifact |
|-------|--------|:---:|---|
| Children should always obey adults | Proven | 85 | Absolute prescriptive claim; testability=50; test-account evidence likely circular or low-quality |
| Never trust the experts | Proven | 85 | Anti-expertise absolute; contradictions=0 despite no peer-reviewed evidence; report_count=2 already flagged it |

Neither has `status_locked=1`. If either claim were to be returned to review or kept in
review, the `Proven` label would not be visible to the public (both would be non-public).
Rejecting them removes the concern entirely.

---

## 6. Recommended Next Single Action

**Reject `clm_eec72f024040428190` ("Children should always obey adults").**

Rationale for choosing this as the first:
- It is currently **public** (visible to users)
- `status=Proven` is a scoring artifact that is misleading
- It has been user-reported
- The absolute prescriptive framing ("always obey") is not a well-formed testable claim
- It came from the test/dev account in what appears to be the same junk-submission period
  as "EVERYBODY IS IDIOT" and "PEOPLE ARE STUPID" (same bulk-submission pattern)
- Rejecting it reduces the non-seed public feed from 2 items → 1 item

Requires explicit same-session approval:
> `EXPLICIT USER APPROVAL: The user approves D-84J only: reject clm_eec72f024040428190 — "Children should always obey adults".`

---

## 7. Proposed Disposition for All Four Items

| Step | Claim | Proposed action | Requires approval |
|------|-------|----------------|------------------|
| D-84J | Children should always obey adults | Reject | ✅ explicit approval per item |
| D-84K | Hard work always pays off | Return to review (or keep public) | ✅ explicit approval per item |
| D-84L | Never trust the experts | Reject | ✅ explicit approval per item |
| D-84M | UK government Covid vaccine contract terms | No action (keep in review) | ✅ explicit decision per item |

**Phase 3 is the end of the cleanup scope.** After Phase 3, the only remaining items
are the 17 already-rejected claims (Phase 4 archive — blocked by `reviewCleanup`
keyword guard) and the 2 review-state items that survive judgment (D-84M at minimum).

---

## 8. Non-Mutation Statement

D-84J-AUDIT made no moderation decisions.
No POST call was made.
No `review_state` was changed.
No D1 command was run.
No Wrangler was run.
The admin token was used only for `GET /api/review` (read-only) and was not printed,
logged, or committed.
Temp files deleted after reading.

---

## D-84J-AUDIT Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at 32cf61c | ✅ |
| Working tree clean | ✅ |
| GET /api/review — 4 Phase 3 items fully inspected | ✅ |
| GET /api/claims — public feed cross-checked for 2 public items | ✅ |
| All four items classified with reasoning | ✅ |
| Scoring artifacts identified on 2 items | ✅ |
| Recommended next single action identified | ✅ |
| No POST call made | ✅ |
| No review_state changed | ✅ |
| No D1 command run | ✅ |
| No Wrangler run | ✅ |
| Admin token not printed, logged, or committed | ✅ |
| Temp files deleted | ✅ |
| docs/D84J_PHASE3_JUDGMENT_CALL_AUDIT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Static checks 127/24/39 confirmed | ✅ |
| Docs committed to main | ✅ |
