# D-84B: Per-Item Cleanup Plan — Non-Seed Review Queue

Date: 2026-06-07
Step: D-84B — docs-only per-item moderation plan for non-seed review queue
Type: Docs-only. Direct main.
No moderation actions. No POST calls. No D1. No Wrangler. No destructive action.

---

## 1. Purpose

D-84A identified 21 non-seed claims in the review queue, all from test/dev account
`usr_3c204c78f6fa49bfad`. D-84B documents the exact moderation sequence — one item per
gate — so that D-84C and later steps can each execute exactly one approved action.

No cleanup is performed in this step.

---

## 2. Non-Execution Statement

D-84B makes no moderation decisions.
D-84B calls no POST endpoints.
D-84B calls no write routes.
D-84B makes no D1 commands.
D-84B runs no Wrangler.
D-84B does not change any `review_state`, `report_count`, `status`, or any other field.
No DB row was modified during D-84B.

---

## 3. Current Queue State (from D-84A)

| Group | Count |
|-------|-------|
| Total non-seed claims in queue | 21 |
| `public` + `report_count > 0` (live, reported) | 5 |
| `review_state = 'review'` (not public) | 6 |
| `review_state = 'rejected'` (not public, already actioned) | 10 |
| All belong to | `usr_3c204c78f6fa49bfad` |

---

## 4. Available Moderation Mechanics

### 4.1 — `POST /api/review/decision` (admin)

Body: `{ targetType: 'claim', targetId: '<id>', decision: 'public'|'review'|'rejected' }`

Effect when `decision = 'rejected'`:
- Sets `claims.review_state = 'rejected'`
- Sets `claims.report_count = 0`
- Closes all open `reports` rows for this claim
- Claim disappears from `GET /api/claims` public feed immediately
- Claim remains in `GET /api/review` queue (as a rejected item)

Works on any claim regardless of current `review_state`. Can reject a public claim,
a review-state claim, or re-reject an already-rejected claim (idempotent).

### 4.2 — `POST /api/review/cleanup` (admin)

Body: `{ target_type: 'claim', target_id: '<id>' }`

Effect: Sets `review_state = 'archived'` — removes item from the review queue view.

**Critical constraint:** The route checks the claim text for test-artefact keywords:
```
text.includes('smoke') || /\btest\b/.test(text) ||
text.includes('automated write') || text.includes('automated smoke')
```
If the claim text does not contain any of these keywords, the route returns:
```json
{ "error": "CLEANUP_REQUIRES_TEST_ARTEFACT" }
```

**Also requires:** `review_state = 'rejected'` before archiving. Items in `'review'` or
`'public'` state must first be rejected via `reviewDecision`, then archived via `reviewCleanup`.

**Phase 4 implication:** Most of the 10 already-rejected items do NOT contain "smoke",
"test", "automated write", or "automated smoke". The `reviewCleanup` route will refuse
to archive them. These items cannot currently be removed from the review queue view through
any available API route. They are already rejected (not public) — this is a cosmetic queue
pollution issue only, not a content visibility risk. See Section 9.

---

## 5. Planned Cleanup Sequence

### Phase 1 — Review-state junk (not public, safe to reject)

These items are in `review_state = 'review'` — never promoted, not visible to users.
Rejection removes them from the moderation workload and keeps the queue clean.

---

#### D-84C — FIRST CLEANUP ACTION (one item)

| Field | Value |
|-------|-------|
| **id** | `clm_2c1751dd6605412db2` |
| **Claim text** | I am the best |
| **Current state** | `review_state = 'review'` |
| **Public visibility** | ❌ Not public |
| **report_count** | 0 |
| **Proposed action** | Reject |
| **Rationale** | Personal/non-verifiable claim. Not a factual assertion about the world. Cannot be supported by evidence. Classic junk submission. |
| **Risk** | Very low — not public, no reports, single-token personal claim |
| **POST body** | `{ "targetType": "claim", "targetId": "clm_2c1751dd6605412db2", "decision": "rejected" }` |
| **Approval phrase** | `EXPLICIT USER APPROVAL: The user approves D-84C only: reject clm_2c1751dd6605412db2 — "I am the best".` |
| **Stop condition** | If preflight GET shows `review_state != 'review'`, stop and report |

---

#### D-84D — SECOND CLEANUP ACTION (one item)

| Field | Value |
|-------|-------|
| **id** | `clm_d1e4261798754199a6` |
| **Claim text** | Belief Engine Profile — Stoic Atheism |
| **Current state** | `review_state = 'review'` |
| **Public visibility** | ❌ Not public |
| **report_count** | 0 |
| **Proposed action** | Reject |
| **Rationale** | Development artifact from Belief Engine → Send to HumanX flow. Text is a profile label, not a factual claim. Should never be promoted to public. |
| **Risk** | Very low — not public, no reports, clearly a dev artifact |
| **POST body** | `{ "targetType": "claim", "targetId": "clm_d1e4261798754199a6", "decision": "rejected" }` |
| **Approval phrase** | `EXPLICIT USER APPROVAL: The user approves D-84D only: reject clm_d1e4261798754199a6 — "Belief Engine Profile — Stoic Atheism".` |
| **Stop condition** | If preflight GET shows `review_state != 'review'`, stop and report |

---

#### D-84E — THIRD CLEANUP ACTION (one item)

| Field | Value |
|-------|-------|
| **id** | `clm_852333ac90654ab495` |
| **Claim text** | everyone knows the government is hiding everything |
| **Current state** | `review_state = 'review'` |
| **Public visibility** | ❌ Not public |
| **report_count** | 0 |
| **Proposed action** | Reject |
| **Rationale** | Unfalsifiable as written. "Everyone knows" is a vague epistemic appeal. "Everything" is an absolute that cannot be tested. No specific claim about any specific event. From test/dev account. |
| **Risk** | Low — not public, no reports. Marginal: the underlying concern (government concealment) could be valid for specific claims; this phrasing is too vague to be actionable |
| **POST body** | `{ "targetType": "claim", "targetId": "clm_852333ac90654ab495", "decision": "rejected" }` |
| **Approval phrase** | `EXPLICIT USER APPROVAL: The user approves D-84E only: reject clm_852333ac90654ab495 — "everyone knows the government is hiding everything".` |
| **Stop condition** | If preflight GET shows `review_state != 'review'`, stop and report |

---

#### D-84F — FOURTH CLEANUP ACTION (one item)

| Field | Value |
|-------|-------|
| **id** | `clm_a51c7861a89945339b` |
| **Claim text** | GOD DONT EXIST |
| **Current state** | `review_state = 'review'` |
| **Public visibility** | ❌ Not public |
| **report_count** | 0 |
| **Proposed action** | Reject |
| **Rationale** | The system correctly classified this as `Untestable`, which is the right algorithmic verdict for an existence-of-God claim. However, the claim is informally written (all-caps, grammatically incorrect), submitted by a test/dev account with no evidence attached, and is not useful as a launch-quality public claim. Reject on quality grounds, not on the merits of the theological position. |
| **Risk** | Low — not public, no reports. Note: the Untestable classification is correct; a properly written version of this claim ("The existence of a God is not supported by empirical evidence") could be valid for the platform. This specific submission is not that. |
| **POST body** | `{ "targetType": "claim", "targetId": "clm_a51c7861a89945339b", "decision": "rejected" }` |
| **Approval phrase** | `EXPLICIT USER APPROVAL: The user approves D-84F only: reject clm_a51c7861a89945339b — "GOD DONT EXIST".` |
| **Stop condition** | If preflight GET shows `review_state != 'review'`, stop and report |

---

### Phase 2 — Public junk (live, reported — highest user-facing risk)

These claims are currently **visible in the public claims feed** at
`https://humanx.rinkimirikata.com`. Each has been reported at least once. Rejecting
removes them from the public feed immediately.

---

#### D-84G — FIFTH CLEANUP ACTION (one item)

| Field | Value |
|-------|-------|
| **id** | `clm_6bd4e59efa2a44d1b2` |
| **Claim text** | EVERYBODY IS IDIOT |
| **Current state** | `review_state = 'public'`, `report_count = 1` |
| **Public visibility** | ✅ **CURRENTLY PUBLIC** |
| **Reported reason** | `2` (report type code) |
| **Proposed action** | Reject |
| **Rationale** | All-caps, grammatically incorrect, offensive, not a falsifiable factual claim. Reported. Should be removed from public feed. |
| **Risk** | Very low. User-facing improvement: removes offensive content from feed |
| **POST body** | `{ "targetType": "claim", "targetId": "clm_6bd4e59efa2a44d1b2", "decision": "rejected" }` |
| **Approval phrase** | `EXPLICIT USER APPROVAL: The user approves D-84G only: reject clm_6bd4e59efa2a44d1b2 — "EVERYBODY IS IDIOT".` |
| **Stop condition** | If preflight shows `review_state != 'public'`, stop and report |

---

#### D-84H — SIXTH CLEANUP ACTION (one item)

| Field | Value |
|-------|-------|
| **id** | `clm_ba71db1962b8474bb7` |
| **Claim text** | PEOPLE ARE STUPID |
| **Current state** | `review_state = 'public'`, `report_count = 1` |
| **Public visibility** | ✅ **CURRENTLY PUBLIC** |
| **Reported reason** | `del` |
| **Proposed action** | Reject |
| **Rationale** | All-caps, derogatory, not a falsifiable factual claim. Reported. Same account and pattern as "EVERYBODY IS IDIOT". |
| **Risk** | Very low |
| **POST body** | `{ "targetType": "claim", "targetId": "clm_ba71db1962b8474bb7", "decision": "rejected" }` |
| **Approval phrase** | `EXPLICIT USER APPROVAL: The user approves D-84H only: reject clm_ba71db1962b8474bb7 — "PEOPLE ARE STUPID".` |
| **Stop condition** | If preflight shows `review_state != 'public'`, stop and report |

---

#### D-84I — SEVENTH CLEANUP ACTION (one item)

| Field | Value |
|-------|-------|
| **id** | `clm_3905faadfa9c47159e` |
| **Claim text** | DOCTRINE |
| **Current state** | `review_state = 'public'`, `report_count = 1` |
| **Public visibility** | ✅ **CURRENTLY PUBLIC** |
| **Reported reason** | `3` |
| **Proposed action** | Reject |
| **Rationale** | Single-word submission. Not a claim — not a falsifiable assertion. All-caps. Reported. |
| **Risk** | Very low |
| **POST body** | `{ "targetType": "claim", "targetId": "clm_3905faadfa9c47159e", "decision": "rejected" }` |
| **Approval phrase** | `EXPLICIT USER APPROVAL: The user approves D-84I only: reject clm_3905faadfa9c47159e — "DOCTRINE".` |
| **Stop condition** | If preflight shows `review_state != 'public'`, stop and report |

---

### Phase 3 — Judgment calls (human decision required before any action)

These items require more consideration. No automatic rejection is proposed. Each must be
reviewed individually with explicit approval. They are listed here for planning purposes;
no approval phrase is defined yet pending human decision.

---

#### Item J — "Children should always obey adults"

| Field | Value |
|-------|-------|
| **id** | `clm_eec72f024040428190` |
| **Current state** | `review_state = 'public'`, `report_count = 1`, `status = Proven` |
| **Public visibility** | ✅ **CURRENTLY PUBLIC** |
| **Assessment** | A prescriptive moral claim about child-adult authority. The word "always" makes it an absolute universal, which `claimQualityHints` would flag (D-13). Status `Proven` is almost certainly a scoring artifact from unverified evidence. The claim is contentious but not inherently illegal or harmful — it reflects a social norm position that is testable (e.g., via developmental psychology research). Decision: reject on absolute-universal quality grounds, or keep in review pending proper evidence. |
| **Recommended action** | Reject (absolute universal framing, `status=Proven` scoring error, reported) — but requires explicit human approval |
| **Requires** | Explicit per-session approval with item id confirmed |

---

#### Item K — "Hard work always pays off"

| Field | Value |
|-------|-------|
| **id** | `clm_af8da34be53b40f395` |
| **Current state** | `review_state = 'public'`, `report_count = 1`, `status = Plausible` |
| **Public visibility** | ✅ **CURRENTLY PUBLIC** |
| **Reported reason** | `BECAUSE I CANT SEE IT` |
| **Assessment** | A common proverb. The "always" makes it an absolute universal claim that is empirically testable and is in fact contested by economic research. The `status = Plausible` is arguably correct (the general claim has some truth, the absolute form is overstated). Report reason is unhelpful and subjective. Lower risk than the all-caps items. Could be kept in review for proper evidence submission, or rejected on absolute-universal quality grounds. |
| **Recommended action** | Reject (absolute-universal framing, from test account, lower-quality report reason) — but requires explicit human approval |
| **Requires** | Explicit per-session approval with item id confirmed |

---

#### Item L — "Never trust the experts"

| Field | Value |
|-------|-------|
| **id** | `clm_ae59b53d5f4249f0b4` |
| **Current state** | `review_state = 'review'` (not public), `report_count = 2`, `status = Proven` |
| **Public visibility** | ❌ Not public |
| **Assessment** | An anti-expertise universal claim. `report_count = 2` (auto-escalation threshold). `status = Proven` is a clear scoring error (no legitimate evidence could prove "never trust the experts" to `Proven` standard). In review state — not visible. Reject on absolute-universal framing + scoring error grounds. |
| **Recommended action** | Reject — but requires explicit human approval |
| **Requires** | Explicit per-session approval with item id confirmed |

---

#### Item M — "The UK government published Covid vaccine contract terms in 2021"

| Field | Value |
|-------|-------|
| **id** | `clm_13afcc7128054661a3` |
| **Current state** | `review_state = 'review'` (not public), `report_count = 0`, `status = Plausible` |
| **Public visibility** | ❌ Not public |
| **Assessment** | A specific, potentially factual claim. The UK government did publish partially redacted Advance Purchase Agreement information in 2021 under Freedom of Information pressure. This claim is testable and may be broadly accurate. It is not junk. It is in review state — not public. The `Plausible` status is plausible. This item should NOT be rejected without source verification. Options: (a) keep in review indefinitely, (b) reject with a note that the phrasing is too vague to verify, (c) promote if evidence can be attached. |
| **Recommended action** | Keep in review (do nothing) — or reject only if explicitly decided. No rejection without deliberate decision. |
| **Requires** | Explicit human decision before any action |

---

### Phase 4 — Already-rejected cleanup (optional, currently blocked by code)

The 10 already-rejected items could be archived to remove them from the review queue view.
**However:** The `POST /api/review/cleanup` route requires the claim text to contain
`"smoke"`, `"test"`, `"automated write"`, or `"automated smoke"`. None of the 10
already-rejected claims contain these keywords. The route will return
`{ "error": "CLEANUP_REQUIRES_TEST_ARTEFACT" }` for all of them.

**Consequence:** The 10 rejected items cannot currently be archived via the available API.
They will remain visible in the admin review queue (`GET /api/review`) but are not public
and require no content action. This is a cosmetic queue pollution issue only.

| # | id | Claim text | Archivable via current API |
|---|-----|-----------|:-:|
| 12 | `clm_9c6e0a3aa9924c4e95` | MONEY IS NO GOOD | ❌ no keyword match |
| 13 | `clm_1695187b3d6140b88b` | Blablablabla | ❌ no keyword match |
| 14 | `clm_b3dd4907cb744831b1` | God doesnt exist | ❌ no keyword match |
| 15 | `clm_180a9127f4ac4b5281` | Trust the experts | ❌ no keyword match |
| 16 | `clm_93b05946babe4e7487` | dont trust expert | ❌ no keyword match |
| 17 | `clm_d02ac47783d0423c93` | gfsdhdfhfdhdfhdfhgdfa | ❌ no keyword match |
| 18 | `clm_da3304ebdfe44e7e8f` | mOON LANDING | ❌ no keyword match |
| 19 | `clm_cca7de1026f043f5bb` | Human really landed on Moon | ❌ no keyword match |
| 20 | `clm_721b8ea6de01457ab4` | Humans didnt land on moon | ❌ no keyword match |
| 21 | `clm_697a5babed9a4332b4` | We never went to space | ❌ no keyword match |

**Optional future path:** Extend `reviewCleanup` to accept a broader artefact definition
(e.g., from test/dev account, or by admin explicit override), then archive these items.
This would be a code change (branch + PR) deferred to a future D step.

---

## 6. Full Cleanup Overview Table

| D-step | id | Claim | State | Public | Action | Risk | Approval |
|--------|-----|-------|:-----:|:------:|--------|:----:|:--------:|
| D-84C | `clm_2c1751dd6605412db2` | I am the best | review | ❌ | Reject | Very low | Required |
| D-84D | `clm_d1e4261798754199a6` | Belief Engine Profile — Stoic Atheism | review | ❌ | Reject | Very low | Required |
| D-84E | `clm_852333ac90654ab495` | everyone knows the government is hiding everything | review | ❌ | Reject | Low | Required |
| D-84F | `clm_a51c7861a89945339b` | GOD DONT EXIST | review | ❌ | Reject | Low | Required |
| D-84G | `clm_6bd4e59efa2a44d1b2` | EVERYBODY IS IDIOT | public | ✅ | Reject | Very low | Required |
| D-84H | `clm_ba71db1962b8474bb7` | PEOPLE ARE STUPID | public | ✅ | Reject | Very low | Required |
| D-84I | `clm_3905faadfa9c47159e` | DOCTRINE | public | ✅ | Reject | Very low | Required |
| D-84J | `clm_eec72f024040428190` | Children should always obey adults | public | ✅ | Reject (judgment) | Low | Required + decision |
| D-84K | `clm_af8da34be53b40f395` | Hard work always pays off | public | ✅ | Reject (judgment) | Low | Required + decision |
| D-84L | `clm_ae59b53d5f4249f0b4` | Never trust the experts | review | ❌ | Reject (judgment) | Low | Required + decision |
| D-84M | `clm_13afcc7128054661a3` | UK government Covid contracts | review | ❌ | Keep/TBD | Low | Decision required |
| Phase 4 | 10 rejected items | (various) | rejected | ❌ | Archive (blocked by code) | Cosmetic | Future code change |

---

## 7. Failure Handling

For each cleanup action (D-84C and later):

| Scenario | Response |
|----------|----------|
| Preflight GET shows `review_state` different from expected | **STOP.** Report changed state. Do not proceed with the planned rejection. |
| POST returns `{ "error": "CLAIM_NOT_FOUND" }` | **STOP.** Claim may have been deleted or ID is wrong. |
| POST returns unexpected error | **STOP.** Report full error response. Do not retry without diagnosis. |
| `ok: false` or HTTP non-200 | **STOP.** |
| Changed rows ≠ 1 (if verifiable via follow-up GET) | Report discrepancy. |
| Any sign of affecting wrong claim | **STOP immediately.** |

Each action step must:
1. Confirm current state via `GET /api/review` or `GET /api/claims/<id>` before POST
2. Execute exactly one POST
3. Verify result via follow-up read
4. Document result before proceeding to next item

---

## 8. Gate

| Step | Status |
|------|--------|
| D-84A — audit | ✅ COMPLETE |
| D-84B — per-item plan | ✅ COMPLETE (this doc) |
| D-84C — reject `clm_2c1751dd6605412db2` | ⛔ BLOCKED — requires explicit approval |
| D-84D — reject `clm_d1e4261798754199a6` | ⛔ BLOCKED — requires D-84C complete + explicit approval |
| D-84E through D-84L | ⛔ BLOCKED — sequential, each requires prior step complete + explicit approval |
| D-84M — UK Covid contracts | ⛔ BLOCKED — pending human decision on keep/reject |
| Phase 4 archive (10 rejected) | ⛔ BLOCKED — requires code change to extend cleanup route |

**No cleanup will be performed until D-84C is explicitly approved.**

---

## D-84B Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at D-84A commit (e8eb7c4) | ✅ |
| `reviewDecision` route mechanics confirmed from source | ✅ |
| `reviewCleanup` route test-artefact guard confirmed from source | ✅ |
| Phase 4 archive limitation documented | ✅ |
| All 11 action items documented with id, text, state, rationale, POST body, approval phrase | ✅ |
| Phase 3 judgment calls documented without approval phrase pending human decision | ✅ |
| Failure handling defined | ✅ |
| No moderation action taken | ✅ |
| No POST call made | ✅ |
| No D1 command | ✅ |
| No Wrangler | ✅ |
| docs/D84B_PER_ITEM_CLEANUP_PLAN.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
