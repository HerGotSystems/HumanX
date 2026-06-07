# D-81: Final Launch Seed Pack Verification Checkpoint

Date: 2026-06-07
Step: D-81 — read-only verification of full seed pack public state
Type: Read-only. Docs-only commit to main.
No moderation actions. No POST calls. No D1. No Wrangler. No destructive action.

---

## 1. Purpose

D-81 confirms that all 5 D-76D approved launch seed claims, their 10 associated evidence
items, and their 4 pressure points are correctly published and publicly visible on
`humanx.rinkimirikata.com` following the D-80C through D-80G individual promotions.

This document serves as the authoritative final state record for the HumanX launch
seed pack publication sequence (D-77 through D-80G).

---

## 2. Non-Mutation Statement

D-81 made no moderation decisions.
D-81 called no `POST /api/review/decision` or any other write route.
D-81 did not change any `review_state`.
D-81 did not promote, reject, or archive any item.
D-81 did not touch D1 directly.
D-81 did not run Wrangler.
No DB row was modified during D-81.
The admin token was used only as a shell variable for `GET /api/review` and was not
printed, logged, or committed. All temp files were deleted after reading.

---

## 3. Verification Methods and Endpoints Used

| Endpoint | Type | Purpose |
|----------|------|---------|
| `GET /api/claims` | Public, no auth | Confirm all 5 seed claims in public feed |
| `GET /api/claims/<claim-id>` × 5 | Public, no auth | Confirm evidence attached and public per claim |
| `GET /api/review` | Admin read-only | Confirm no seed claims or evidence remain in review queue |

---

## 4. Public Claim Table

All 5 claims confirmed in public feed via `GET /api/claims`. All texts match exactly.

| seed_id | DB id | Claim text (abbreviated) | Stored status | Computed status | Public | Contradictions |
|---------|-------|--------------------------|---------------|-----------------|--------|----------------|
| launch-B5 | `clm_seed_8e095b6f6d30` | The Holocaust resulted in the murder of approximately six million Jews | Proven | Strongly Supported¹ | ✅ | 1 ✅ |
| launch-A1 | `clm_seed_55e17c22e13e` | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism | Strongly Supported | Proven² | ✅ | 1 ✅ |
| launch-A4 | `clm_seed_c4e0335e7aae` | Rising CO2 levels from human activity are the primary driver of observed global warming | Proven | Strongly Supported¹ | ✅ | 1 ✅ |
| launch-C1 | `clm_seed_8ad9ff121579` | Online platform recommendation systems can use engagement signals that influence which information spreads widely | Plausible | Plausible | ✅ | 1 ✅ |
| launch-D2 | `clm_seed_7fb1c24747c2` | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy | Proven | Strongly Supported¹ | ✅ | 0 ✅ |

**¹ Stored "Proven", computed "Strongly Supported"** — `recalcClaimScore` ran when evidence
was promoted and recalculated the `status` field from evidence reliability scores. In these
cases, the aggregate evidence score landed in the "Strongly Supported" band rather than
"Proven". Both are scientifically defensible for these claims. See Section 9.

**² Stored "Strongly Supported", computed "Proven"** — For launch-A1 (MMR), `recalcClaimScore`
computed a score that landed in the "Proven" band based on the evidence quality (Cochrane
systematic review 85, Madsen NEJM cohort study 84). The computed "Proven" is a stronger
label than the intentionally conservative "Strongly Supported" chosen in D-76C. See Section 9.

**Contradictions counts:**
- B5/A1/A4/C1 each show `contradictions: 1` — their pressure points are visible ✅
- D2 shows `contradictions: 0` — no pressure point was included in the seed data ✅

**Full exact claim texts (confirmed matching character-for-character):**

| seed_id | Full claim text |
|---------|-----------------|
| launch-B5 | The Holocaust resulted in the murder of approximately six million Jews |
| launch-A1 | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism |
| launch-A4 | Rising CO2 levels from human activity are the primary driver of observed global warming |
| launch-C1 | Online platform recommendation systems can use engagement signals that influence which information spreads widely |
| launch-D2 | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy |

---

## 5. Evidence Verification Table

All 10 evidence items confirmed public via `GET /api/claims/<id>` per-claim detail endpoint.

| Evidence title | Source URL | Parent claim | Public |
|----------------|-----------|--------------|--------|
| Wannsee Protocol | https://avalon.law.yale.edu/imt/wannsee.asp | launch-B5 | ✅ |
| How Many People did the Nazis Murder? | https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution | launch-B5 | ✅ |
| Vaccines for measles, mumps and rubella in children | https://pubmed.ncbi.nlm.nih.gov/22336803/ | launch-A1 | ✅ |
| A population-based study of measles, mumps, and rubella vaccination and autism | https://pubmed.ncbi.nlm.nih.gov/12421889/ | launch-A1 | ✅ |
| Climate Change 2021: The Physical Science Basis — Summary for Policymakers | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ | launch-A4 | ✅ |
| The Causes of Climate Change | https://science.nasa.gov/climate-change/causes | launch-A4 | ✅ |
| The spread of true and false news online | https://pubmed.ncbi.nlm.nih.gov/29590045/ | launch-C1 | ✅ |
| On YouTube's recommendation system | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ | launch-C1 | ✅ |
| The Cumulative Cost of Additional Wakefulness: Dose-Response Effects… | https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117 | launch-D2 | ✅ |
| About Sleep | https://www.cdc.gov/sleep/about/index.html | launch-D2 | ✅ |

**Evidence IDs for reference:**

| Evidence id | Title | Parent |
|------------|-------|--------|
| `evd_4dadaaf88e1a42` | Wannsee Protocol | launch-B5 |
| `evd_acb865805d4a4a` | How Many People did the Nazis Murder? | launch-B5 |
| `evd_d685a866788942` | Vaccines for measles, mumps and rubella in children | launch-A1 |
| `evd_450723b824024c` | A population-based study of MMR vaccination and autism | launch-A1 |
| `evd_a7f3bd8a91204c` | Climate Change 2021 IPCC AR6 WG1 SPM | launch-A4 |
| `evd_573465cd124545` | The Causes of Climate Change (NASA) | launch-A4 |
| `evd_76673741550c44` | The spread of true and false news online | launch-C1 |
| `evd_904fd94e08554c` | On YouTube's recommendation system | launch-C1 |
| `evd_ac0a748135aa4e` | The Cumulative Cost of Additional Wakefulness (Van Dongen) | launch-D2 |
| `evd_8651fab094cc48` | About Sleep (CDC) | launch-D2 |

---

## 6. Review Queue Verification

Checked via `GET /api/review` (admin read-only).

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Seed claims remaining in queue | 0 | 0 | ✅ |
| Seed evidence remaining in queue | 0 | 0 | ✅ |
| Total claims in review queue | — | 21 | (non-seed only) |
| Total evidence in review queue | — | 0 | ✅ |

**Non-seed queue note:** 21 non-seed claims remain in the review queue. These are
pre-existing user-submitted claims, some of which are public items with reports
(5 reported public claims noted in D-80A, plus other unreported review-state items).
They are not part of the launch seed pack and are out of scope for D-81. Their
moderation is a separate optional step (D-84 placeholder added to PROJECT_STATE.md).

**All seed claim and evidence queue slots are empty.** The seed pack is fully out of the
review queue.

---

## 7. Pressure Point Visibility

Pressure points have no `review_state` column — they become visible when the parent claim
is promoted to public (confirmed from `src/importer.js` INSERT shape).

Visibility is inferred from the `contradictions` field on each public claim:

| seed_id | Pressure title | Expected contradictions | Actual contradictions | Visible |
|---------|---------------|------------------------|----------------------|---------|
| launch-B5 | Antisemitism: An Introduction (USHMM) | 1 | 1 | ✅ |
| launch-A1 | Wakefield's article linking MMR vaccine and autism was fraudulent (BMJ) | 1 | 1 | ✅ |
| launch-A4 | Climate Change 2021 SPM — Attribution section | 1 | 1 | ✅ |
| launch-C1 | On YouTube's recommendation system (responsibility framing) | 1 | 1 | ✅ |
| launch-D2 | (none in seed data) | 0 | 0 | ✅ |

---

## 8. Issues Found

### Issue 1 — Status recalculation by recalcClaimScore (non-critical)

`recalcClaimScore` runs automatically when evidence is promoted via `POST /api/review/decision`.
It overwrites the stored `status` field with a value derived from aggregate evidence reliability
scores. This produced the following divergences from seed-imported values:

| seed_id | Stored status | Computed status | Direction | Assessment |
|---------|---------------|-----------------|-----------|------------|
| launch-B5 | Proven | Strongly Supported | ↓ softer | Acceptable — "Strongly Supported" is defensible for a historical claim |
| launch-A1 | Strongly Supported | Proven | ↑ stronger | Notable — D-76C intentionally chose "Strongly Supported" to avoid overclaiming; computed "Proven" is stronger. See note below. |
| launch-A4 | Proven | Strongly Supported | ↓ softer | Acceptable — "Strongly Supported" is defensible for climate science |
| launch-C1 | Plausible | Plausible | — | No change ✅ |
| launch-D2 | Proven | Strongly Supported | ↓ softer | Acceptable — "Strongly Supported" is defensible for cognitive research |

**launch-A1 note:** The computed `Proven` for the MMR/autism claim is stronger than the
deliberately conservative `Strongly Supported` chosen in D-76C. The seed wording
"have not found evidence" was specifically drafted to avoid absolute overclaiming, and the
status `Strongly Supported` was chosen to match. The `recalcClaimScore` function does not
have awareness of this editorial intent — it derives status purely from numerical
evidence scores (Cochrane systematic review: 85, Madsen NEJM cohort: 84). The computed
"Proven" is not scientifically inaccurate given the evidence quality, but it is stronger
than intended. This is flagged as a potential D-83 scoring audit item.

**All other divergences are non-critical.** "Strongly Supported" vs "Proven" is a one-band
shift and does not make any claim less accurate or less defensible.

**This issue does not block launch.** All claims are correctly public with correct claim
texts, correct evidence, and correct pressure points.

---

## 9. Final Launch Seed Pack Status

**✅ FULLY PUBLIC / PASS**

| Item | Count | Public | Issues |
|------|-------|--------|--------|
| Launch seed claims | 5 / 5 | ✅ | None blocking |
| Launch seed evidence items | 10 / 10 | ✅ | None |
| Pressure points visible | 4 / 4 | ✅ | None |
| Seed claims in review queue | 0 | ✅ | None |
| Seed evidence in review queue | 0 | ✅ | None |
| Claim texts exact match | 5 / 5 | ✅ | None |
| Status recalculation | 4 / 5 diverged | ⚠️ noted | Non-critical — see Section 8 |
| Contradiction counts correct | 5 / 5 | ✅ | None |

The HumanX launch seed pack is fully public. The site has 27 total public claims
(5 seed claims + 22 pre-existing public user-submitted claims).

---

## 10. Next Recommended Gates

All items below are **optional** and **blocked** until explicitly instructed.

| Step | Description | Gate |
|------|-------------|------|
| D-82 | Public UX spot check — open `humanx.rinkimirikata.com` in browser, verify each seed claim page renders correctly, evidence appears attached, pressure points visible | ⛔ BLOCKED / optional |
| D-83 | Scoring / status consistency audit — review `recalcClaimScore` behavior for seed claims; consider whether `status` field on B5/A1/A4/D2 should be manually corrected or left as computed; document any corrections | ⛔ BLOCKED / optional — especially relevant for launch-A1 computed "Proven" vs intended "Strongly Supported" |
| D-84 | Pre-existing reported claims cleanup — 21 non-seed claims in review queue; 5 are reported public user-submitted claims; consider moderation or archival | ⛔ BLOCKED / optional |

No action is taken on any of these items in D-81.

---

## D-81 Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at D-80G commit (7f633b8) | ✅ |
| GET /api/claims called — all 5 seed claims confirmed public | ✅ |
| GET /api/claims/<id> × 5 — all 10 evidence items confirmed public and attached | ✅ |
| GET /api/review — 0 seed claims in queue, 0 seed evidence in queue | ✅ |
| All 5 claim texts match exactly | ✅ |
| Contradictions counts correct for all 5 claims | ✅ |
| Status recalculation documented and assessed | ✅ |
| No moderation action taken | ✅ |
| No POST call made | ✅ |
| No D1 direct commands | ✅ |
| No Wrangler | ✅ |
| Admin token not printed, logged, or committed | ✅ |
| Temp files deleted | ✅ |
| docs/D81_FINAL_LAUNCH_SEED_CHECKPOINT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
