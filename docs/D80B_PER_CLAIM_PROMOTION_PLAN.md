# D-80B: Per-Claim Public Promotion Plan

Date: 2026-06-07
Step: D-80B (planning only — no promotion executed)
Type: Docs-only. Direct main.
No moderation decisions. No write routes. No D1. No Wrangler. No public promotion.

---

## 1. Purpose and Scope

D-80B documents the order, per-claim checks, and gate conditions for future deliberate
promotion of the 5 D-79B launch seed claims from `review_state = 'review'` to
`review_state = 'public'`.

**Scope:** Planning only. No moderation action is taken in this step.
**Out of scope:** Executing any promotion, calling any write route, touching D1 or Wrangler.

---

## 2. Non-Execution Statement

D-80B does not call `POST /api/review/decision`.
D-80B does not promote any claim or evidence item.
D-80B does not change any `review_state`.
D-80B does not touch D1.
D-80B does not run Wrangler.
D-80B does not make any item public.

No DB row was modified during D-80B.

---

## 3. Current Queue State

As confirmed by D-80A (`docs/D80_REVIEW_QUEUE_VERIFICATION.md`):

| Seed item | DB id | review_state | Public? |
|-----------|-------|--------------|---------|
| launch-B5 claim | `clm_seed_8e095b6f6d30` | `review` | No |
| launch-A1 claim | `clm_seed_55e17c22e13e` | `review` | No |
| launch-A4 claim | `clm_seed_c4e0335e7aae` | `review` | No |
| launch-C1 claim | `clm_seed_8ad9ff121579` | `review` | No |
| launch-D2 claim | `clm_seed_7fb1c24747c2` | `review` | No |
| 10 evidence items (across all 5 claims) | assigned at apply | `review` | No |
| 4 pressure rows (across 4 claims) | assigned at apply | (no column) | No — follow parent |

**Pressure point visibility note:** Pressure rows have no `review_state` column
(confirmed `src/importer.js` INSERT shape). They become visible in the UI only when
the parent claim is promoted to `review_state = 'public'`. No separate pressure promotion
step is required.

---

## 4. Moderation Mechanics (Confirmed from Code)

Promotion is done via `POST /api/review/decision` (admin-only, `src/worker.js` line 58).

**Request shape:**
```json
{
  "targetType": "claim",
  "targetId": "<db-claim-id>",
  "decision": "public"
}
```

For evidence:
```json
{
  "targetType": "evidence",
  "targetId": "<evidence-id>",
  "decision": "public"
}
```

**Allowed decisions:** `"public"`, `"review"`, `"rejected"` (confirmed `src/worker.js`
`reviewDecision` function).

**What promotion does (claim):**
- Sets `claims.review_state = 'public'`
- Resets `report_count = 0`
- Closes any open reports for this claim
- Returns the updated claim object

**What promotion does (evidence):**
- Sets `evidence.review_state = 'public'`
- Resets `report_count = 0`
- Closes any open reports for this evidence
- Triggers `recalcClaimScore` for the parent claim
- Returns the updated evidence object

**Claim and evidence are promoted separately.** Promoting a claim does not automatically
promote its evidence. Each evidence item must be explicitly promoted via its own
`targetId` call. A promoted claim with un-promoted evidence will show a public claim
with no visible evidence.

**Correct per-claim promotion sequence:**
1. Promote claim: `targetType: "claim"`, `targetId: "<claim-id>"`, `decision: "public"`
2. Promote each evidence item: `targetType: "evidence"`, `targetId: "<evidence-id>"`, `decision: "public"` — for each of the claim's evidence items

---

## 5. Proposed Promotion Order

Claims are ordered by risk level — lowest risk first. Each claim is a separate gated
step (D-80C through D-80G). All claims after D-80C require separate explicit approval.

| Step | seed_id | Claim | Risk | Status |
|------|---------|-------|------|--------|
| D-80C | `launch-D2` | Sleep deprivation / cognitive performance | Low | ⛔ BLOCKED |
| D-80D | `launch-A4` | CO2 / climate driver | Medium | ⛔ BLOCKED |
| D-80E | `launch-A1` | MMR vaccine / autism | High | ⛔ BLOCKED |
| D-80F | `launch-C1` | Platform recommendation systems | Medium | ⛔ BLOCKED |
| D-80G | `launch-B5` | Holocaust / six million | High | ⛔ BLOCKED |

---

## 6. Per-Claim Promotion Details

---

### 6.1 — D-80C: launch-D2 — Sleep Deprivation (FIRST / LOWEST RISK)

| Field | Value |
|-------|-------|
| seed_id | `launch-D2` |
| DB claim id | `clm_seed_7fb1c24747c2` |
| Claim text | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy |
| Status | Proven |
| Evidence count | 2 |
| Pressure count | 0 |
| Risk level | **Low** |

**Evidence items to promote (2):**
1. "The Cumulative Cost of Additional Wakefulness…" — Van Dongen et al., SLEEP 2003 — `https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117`
2. "About Sleep" — CDC — `https://www.cdc.gov/sleep/about/index.html`

**Risk note:** Scientific consensus claim. Non-partisan. Widely accepted. No attached
pressure points (none were in the seed data). Lowest controversy of the 5 launch claims.
Safest first promotion.

**Pre-promotion checks:**
- [ ] Confirm claim text in Review UI matches exactly: "Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy"
- [ ] Confirm 2 evidence items are attached, both at `review_state = 'review'`
- [ ] Confirm evidence titles match: Van Dongen SLEEP 2003 and CDC About Sleep
- [ ] Confirm source URLs are correct (no blank, no SOURCE_NEEDED)
- [ ] Confirm status is "Proven"
- [ ] Confirm `user_id = usr_seed_system` (not a user-submitted claim)

**Promotion sequence for D-80C:**
1. Promote claim `clm_seed_7fb1c24747c2` → `decision: "public"`
2. Promote evidence 1 (Van Dongen) → `decision: "public"`
3. Promote evidence 2 (CDC About Sleep) → `decision: "public"`
4. Verify claim appears in public feed (`GET /api/claims`)
5. Verify evidence visible on claim page

> ⛔ **BLOCKED until user explicitly approves promotion of claim `launch-D2` (`clm_seed_7fb1c24747c2`) in the same session as the promotion call.**

---

### 6.2 — D-80D: launch-A4 — CO2 / Climate (SECOND)

| Field | Value |
|-------|-------|
| seed_id | `launch-A4` |
| DB claim id | `clm_seed_c4e0335e7aae` |
| Claim text | Rising CO2 levels from human activity are the primary driver of observed global warming |
| Status | Proven |
| Evidence count | 2 |
| Pressure count | 1 |
| Risk level | **Medium** |

**Evidence items to promote (2):**
1. "Climate Change 2021: The Physical Science Basis — Summary for Policymakers" — IPCC AR6 WG1 — `https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/`
2. "The Causes of Climate Change" — NASA — `https://science.nasa.gov/climate-change/causes`

**Pressure items (1, no promotion needed — follows parent):**
1. "Climate Change 2021: The Physical Science Basis — Summary for Policymakers (Attribution section)"

**Risk note:** Scientific consensus claim with intergovernmental and NASA sources.
Climate claims can attract political friction but the evidence is institutional and
verifiable. Pressure point (IPCC attribution section) provides the natural challenge.
Status "Proven" is defensible with these sources.

**Pre-promotion checks:**
- [ ] Confirm claim text matches exactly
- [ ] Confirm 2 evidence items at `review_state = 'review'`
- [ ] Confirm IPCC and NASA source URLs are correct
- [ ] Confirm 1 pressure point is attached
- [ ] Confirm status is "Proven"

> ⛔ **BLOCKED until user explicitly approves promotion of claim `launch-A4` (`clm_seed_c4e0335e7aae`). Requires separate approval from D-80C.**

---

### 6.3 — D-80E: launch-A1 — MMR Vaccine / Autism (THIRD)

| Field | Value |
|-------|-------|
| seed_id | `launch-A1` |
| DB claim id | `clm_seed_55e17c22e13e` |
| Claim text | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism |
| Status | Strongly Supported |
| Evidence count | 2 |
| Pressure count | 1 |
| Risk level | **High** |

**Evidence items to promote (2):**
1. "Vaccines for measles, mumps and rubella in children" — Cochrane/Demicheli 2012 — `https://pubmed.ncbi.nlm.nih.gov/22336803/`
2. "A population-based study of measles, mumps, and rubella vaccination and autism" — Madsen et al. NEJM 2002 — `https://pubmed.ncbi.nlm.nih.gov/12421889/`

**Pressure items (1, no promotion needed — follows parent):**
1. "Wakefield's article linking MMR vaccine and autism was fraudulent" — Godlee BMJ 2011 — `https://pubmed.ncbi.nlm.nih.gov/21209060/`

**Risk note:** High-risk claim due to ongoing public controversy and historical
CDC/HHS policy volatility (noted in D-76B/D-76C review). The claim wording was
deliberately revised from the absolute "does not cause" to the evidence-based
"have not found evidence" (D-76C) to avoid overclaiming. Status "Strongly Supported"
(not "Proven") reflects the evidence-based framing. Both sources are PubMed-indexed
peer-reviewed studies. The pressure point (Wakefield BMJ fraud editorial) addresses
the primary counterargument directly. Verify current wording carefully before promoting.

**Pre-promotion checks:**
- [ ] Confirm claim text matches **exactly**: "Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism"
- [ ] Confirm status is "Strongly Supported" (not "Proven")
- [ ] Confirm 2 evidence items are PubMed links (22336803 and 12421889)
- [ ] Confirm pressure (Wakefield/BMJ, PubMed 21209060) is attached
- [ ] Consider current public/political environment before promoting

> ⛔ **BLOCKED until user explicitly approves promotion of claim `launch-A1` (`clm_seed_55e17c22e13e`). Requires separate approval from D-80D.**

---

### 6.4 — D-80F: launch-C1 — Platform Recommendation Systems (FOURTH)

| Field | Value |
|-------|-------|
| seed_id | `launch-C1` |
| DB claim id | `clm_seed_8ad9ff121579` |
| Claim text | Online platform recommendation systems can use engagement signals that influence which information spreads widely |
| Status | Plausible |
| Evidence count | 2 |
| Pressure count | 1 |
| Risk level | **Medium** |

**Evidence items to promote (2):**
1. "The spread of true and false news online" — Vosoughi et al. Science 2018 — `https://pubmed.ncbi.nlm.nih.gov/29590045/`
2. "On YouTube's recommendation system" — YouTube VP Engineering blog — `https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/`

**Pressure items (1, no promotion needed — follows parent):**
1. "On YouTube's recommendation system (responsibility framing)" — same blog post, counterargument angle

**Risk note:** Claim was narrowed in D-76C from "social media algorithms amplify" to
"online platform recommendation systems can use engagement signals that influence" to
avoid overbroad scope. Status "Plausible" is intentionally conservative. The evidence
is a high-quality Science paper and a first-party YouTube blog post. The pressure point
(same blog post, platform's responsibility framing) provides balance. Medium risk.

**Pre-promotion checks:**
- [ ] Confirm claim text matches exactly (narrowed wording — "can use engagement signals that influence")
- [ ] Confirm status is "Plausible"
- [ ] Confirm Vosoughi Science 2018 (PubMed 29590045) is present
- [ ] Confirm YouTube VP blog URL is correct
- [ ] Confirm pressure (responsibility framing, same blog URL) is attached

> ⛔ **BLOCKED until user explicitly approves promotion of claim `launch-C1` (`clm_seed_8ad9ff121579`). Requires separate approval from D-80E.**

---

### 6.5 — D-80G: launch-B5 — Holocaust (LAST / HIGHEST RISK)

| Field | Value |
|-------|-------|
| seed_id | `launch-B5` |
| DB claim id | `clm_seed_8e095b6f6d30` |
| Claim text | The Holocaust resulted in the murder of approximately six million Jews |
| Status | Proven |
| Evidence count | 2 |
| Pressure count | 1 |
| Risk level | **High** |

**Evidence items to promote (2):**
1. "Wannsee Protocol" — Yale Law School Avalon Project — `https://avalon.law.yale.edu/imt/wannsee.asp`
2. "How Many People did the Nazis Murder?" — USHMM Encyclopedia — `https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution`

**Pressure items (1, no promotion needed — follows parent):**
1. "Antisemitism: An Introduction" — USHMM Encyclopedia — `https://encyclopedia.ushmm.org/content/en/article/antisemitism`

**Risk note:** Highest-sensitivity claim. Historically and morally significant. Holocaust
denial is a known attack vector — the pressure point (USHMM antisemitism article defining
denial/distortion as antisemitism) directly addresses this. Both evidence sources are
major institutional records (Yale Avalon/Nuremberg prosecution evidence; USHMM). Status
"Proven" is appropriate and defensible. Promote last to allow the platform to establish
a track record with lower-risk claims first. Verify current environment before promoting.

**Pre-promotion checks:**
- [ ] Confirm claim text matches exactly
- [ ] Confirm Yale Avalon Wannsee Protocol URL is correct and accessible
- [ ] Confirm USHMM evidence URL is correct
- [ ] Confirm USHMM pressure (antisemitism/denial framing) is attached
- [ ] Status "Proven" confirmed
- [ ] Consider whether lower-risk claims are already public and stable before promoting this one

> ⛔ **BLOCKED until user explicitly approves promotion of claim `launch-B5` (`clm_seed_8e095b6f6d30`). Requires separate approval from D-80F. Recommend promoting last.**

---

## 7. Required Capture After Each Future Promotion

After each future D-80C through D-80G promotion, record and paste back:

| Field | What to verify |
|-------|---------------|
| HTTP status of decision call | Must be `200` |
| `ok` | Must be `true` |
| `decision` | Must be `"public"` |
| `targetType` | `"claim"` or `"evidence"` as appropriate |
| `item.reviewState` (claim) or `item.review_state` (evidence) | Must be `"public"` |
| Public feed visible? | Check `GET /api/claims` — claim should appear |
| Evidence visible on claim? | Check claim detail — evidence should show |
| Score recalculation triggered? | Evidence promotion triggers `recalcClaimScore` — score field may update |
| Any unexpected field? | Paste full response if anything unexpected |

---

## 8. Failure Handling

| Condition | Action |
|-----------|--------|
| HTTP status not 200 | Stop. Paste full response. Do not retry promotion. |
| `ok: false` | Stop. Check `error` field. |
| `item.reviewState` is not `"public"` after promotion | Stop. Do not promote next item. Investigate. |
| Evidence missing from claim after claim promotion | Stop. Promote each evidence item individually before verifying. |
| Wrong source URL visible in public feed | Stop. Do not promote further claims. |
| Claim appears in public feed with no evidence | Stop. Ensure evidence is promoted before considering claim fully live. |
| Any unexpected `warnings` or error key | Paste in full. Review before proceeding. |

---

## 9. Gate — D-80C First Promotion Remains Blocked

**Only `launch-D2` is recommended for the first promotion step (D-80C).**

All other claims (D-80D through D-80G) remain blocked after D-80C is executed.
Each requires a separate explicit approval in the same session as the promotion call.

| Step | Claim | Gate |
|------|-------|------|
| D-80C | `launch-D2` sleep deprivation | ⛔ BLOCKED — requires explicit approval |
| D-80D | `launch-A4` CO2/climate | ⛔ BLOCKED — separate approval after D-80C |
| D-80E | `launch-A1` MMR/autism | ⛔ BLOCKED — separate approval after D-80D |
| D-80F | `launch-C1` recommendation systems | ⛔ BLOCKED — separate approval after D-80E |
| D-80G | `launch-B5` Holocaust | ⛔ BLOCKED — separate approval after D-80F; promote last |

**No step auto-unlocks the next.** Each step requires an independent explicit approval.

---

## 10. Safety Confirmation

| Rule | Status |
|------|--------|
| No moderation decision made | ✅ Confirmed |
| No `review_state` changed | ✅ Confirmed |
| No claim promoted | ✅ Confirmed |
| No evidence promoted | ✅ Confirmed |
| No write route called | ✅ Confirmed |
| No D1 direct commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No bulk or scripted promotion | ✅ Confirmed |
| No public promotion | ✅ Confirmed |

---

## D-80B Completion Record

| Item | Status |
|------|--------|
| Purpose and scope documented | ✅ |
| Non-execution statement included | ✅ |
| Current queue state documented | ✅ |
| Moderation mechanics confirmed from code | ✅ |
| Proposed promotion order (5 steps) defined | ✅ |
| Per-claim details for all 5 claims | ✅ |
| Evidence items listed with source URLs for each claim | ✅ |
| Pressure items noted for each claim | ✅ |
| Risk notes included for each claim | ✅ |
| Pre-promotion checklist per claim | ✅ |
| Each claim marked BLOCKED with gate condition | ✅ |
| Required capture fields after each promotion | ✅ |
| Failure handling table | ✅ |
| Gate table — D-80C through D-80G all BLOCKED | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No moderation/write route/D1/Wrangler/promotion executed | ✅ |
