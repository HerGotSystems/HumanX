# D-76: Launch Seed Human Review Gate Status

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called. No executable JSON files created. No data/seed_claims_v2.json created.

---

## 1. Summary

D-76 records the current state of the launch seed human review gate.

**Gate status: BLOCKED — awaiting human review decisions.**

D-74 drafted 5 READY claims as non-executable source-inserted objects.
D-75 created the human review checklist for those 5 claims.
No human review decisions have been recorded.
Therefore `data/seed_claims_v2.json` must NOT be created and no import route may be called.

This document serves as a permanent record of the gate status at the time of writing.
When the human reviewer has completed the D-75 decision table, a subsequent D (D-77 or
a revised D-76B) will create the executable JSON file on a branch + PR.

---

## 2. Gate Sequence Recap

| D | Output | Status |
|---|--------|--------|
| D-57 | Launch seed JSON draft spec (claim object schema) | ✅ COMPLETE |
| D-58 | Seed import route safety plan | ✅ COMPLETE |
| D-59 | Seed import safety implementation (PR #101 merged) | ✅ COMPLETE |
| D-62 | Final launch seed readiness gate (HB-1 through HB-10) | ✅ COMPLETE |
| D-63 | Source research execution protocol | ✅ COMPLETE |
| D-66 | B-4 Batch B source research | ✅ COMPLETE |
| D-67 | B-5 Holocaust source research | ✅ COMPLETE |
| D-68 | Batch A (A-1 vaccines/autism, A-4 CO₂/climate) source research | ✅ COMPLETE |
| D-69 | Batch C (C-1 social media, C-2 eyewitness, C-4 blocked) source research | ✅ COMPLETE |
| D-70 | Batch D (D-2 sleep, D-3 Dunning-Kruger, D-5 anchoring) source research | ✅ COMPLETE |
| D-71 | E-5 astrology source research (blocked) | ✅ COMPLETE |
| D-72 | E-5 direct DOI capture attempt (still blocked) | ✅ COMPLETE |
| D-73 | Research readiness delta — 5 READY, 4 PARTIAL, 2 EXCLUDED | ✅ COMPLETE |
| D-74 | Source insertion draft — 5 READY claim objects drafted (non-executable) | ✅ COMPLETE |
| D-75 | Human review checklist — created; decision fields blank | ✅ COMPLETE |
| **D-76** | **Executable JSON file on branch + PR** | **⛔ BLOCKED — review not completed** |
| D-77 | Dry-run import (`?mode=dry-run`) | ⛔ NOT STARTED — gated on D-76 |
| D-78 | Production apply (`?mode=apply`) | ⛔ NOT STARTED — gated on D-77 |

---

## 3. Claims Requiring Human Review Decisions

Decisions must be recorded in **`docs/D75_LAUNCH_SEED_V1_HUMAN_REVIEW_CHECKLIST.md`
Section 5 (Decision Table)** before the executable JSON file may be created.

### 3.1 — READY claims (all 5 must be APPROVE_FOR_D76)

| # | Claim | seed_id | Current decision | Decision required |
|---|-------|---------|-----------------|-------------------|
| 1 | The Holocaust resulted in the murder of approximately six million Jews | `launch-B5` | _not recorded_ | APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES |
| 2 | The MMR vaccine does not cause autism | `launch-A1` | _not recorded_ | APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES |
| 3 | Rising CO₂ levels from human activity are the primary driver of observed global warming | `launch-A4` | _not recorded_ | APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES |
| 4 | Social media algorithms amplify certain content based on engagement signals, affecting which information spreads widely | `launch-C1` | _not recorded_ | APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES |
| 5 | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy | `launch-D2` | _not recorded_ | APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES |

### 3.2 — PARTIAL claims (only include in v1 if explicitly promoted)

| Claim | seed_id | Blocker | Decision required to promote |
|-------|---------|---------|------------------------------|
| Smoking tobacco causes lung cancer | `launch-B4` | Slot 3 not found | Explicit promotion with stated gap acceptance |
| Eyewitness testimony is less reliable than commonly assumed | `launch-C2` | Pressure slot paywalled | Explicit promotion with stated gap acceptance |
| People with lower competence in a domain tend to overestimate their own ability | `launch-D3` | Critique slot Elsevier-blocked; Nuhfer 2016 CANDIDATE only | Explicit promotion with Nuhfer CANDIDATE acceptance |
| People tend to rely too heavily on an initial piece of information when making decisions | `launch-D5` | Slot 2 blocked | Explicit promotion with stated gap acceptance |

### 3.3 — EXCLUDED v1 claims (no decision required; listed for completeness)

| Claim | seed_id | Reason |
|-------|---------|--------|
| People tend to search for and interpret evidence in ways that confirm their existing beliefs | `launch-C4` | 0 VERIFIED sources — all paths paywalled/JS-rendered |
| Astrology cannot reliably predict personality traits or life outcomes beyond chance | `launch-E5` | 0 VERIFIED sources — Nature/Elsevier paywall; not in PubMed |

---

## 4. D-76 Executable JSON Entry Criteria (Unchanged from D-75)

`data/seed_claims_v2.json` may only be created (on a branch + PR, never direct main) when
ALL of the following are true:

| # | Criterion | Required state |
|---|-----------|---------------|
| 1 | All 5 READY claims | All carry `APPROVE_FOR_D76` in D-75 Section 5 decision table |
| 2 | NEEDS_EDIT items | Zero — all corrections resolved and re-reviewed |
| 3 | PARTIAL promotions | Any PARTIAL claim entering v1 has an explicit promotion decision in D-75 Section 5 |
| 4 | Source URLs | All `source_url` values copied exactly from D-74 Section 3; no invention |
| 5 | Placeholders | Zero SOURCE_NEEDED / TODO / blank `source_url` in any claim being imported |
| 6 | D-59 guard | PR #101 confirmed still merged on main (static checks 119/24/39) |
| 7 | Import route | No import route called in the JSON-creation step |
| 8 | D1 | No D1 command issued in the JSON-creation step |
| 9 | Branch + PR | JSON file created on a branch + PR; no direct main commit |

**Current status of all 9 criteria:**

| # | Status |
|---|--------|
| 1 | ❌ — 0 of 5 READY claims have a recorded decision |
| 2 | ⚠️ — cannot evaluate until decisions are recorded |
| 3 | ⚠️ — no PARTIAL promotion decisions recorded |
| 4 | ✅ — D-74 Section 3 contains exact VERIFIED source_url values |
| 5 | ✅ — D-74 Section 3 contains no SOURCE_NEEDED placeholders |
| 6 | ✅ — PR #101 merged; static checks 119/24/39 confirmed |
| 7 | ✅ — no import route will be called in the JSON-creation step |
| 8 | ✅ — no D1 command will be issued in the JSON-creation step |
| 9 | ✅ — branch + PR required; direct main commit is prohibited |

**Gate clears when criteria 1 and 2 are satisfied.**

---

## 5. Source Reference Summary for READY Claims

For the human reviewer's convenience — all VERIFIED sources that will appear in
`data/seed_claims_v2.json` once approved. These are the exact values from D-74 Section 3.

### B-5 Holocaust (launch-B5)

| Slot | Title | Source URL | Score |
|------|-------|-----------|-------|
| Evidence 1 | Wannsee Protocol, Nuremberg Prosecution Document | https://avalon.law.yale.edu/imt/wannsee.asp | 85 |
| Evidence 2 | How Many People did the Nazis Murder? | https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution | 82 |
| Pressure | Antisemitism: An Introduction | https://encyclopedia.ushmm.org/content/en/article/antisemitism | 78 |

### A-1 MMR Vaccine / Autism (launch-A1)

| Slot | Title | Source URL | Score |
|------|-------|-----------|-------|
| Evidence 1 | Vaccines for measles, mumps and rubella in children (Cochrane, Demicheli 2012) | https://pubmed.ncbi.nlm.nih.gov/22336803/ | 85 |
| Evidence 2 | MMR Vaccination and Autism (Madsen et al., NEJM 2002) | https://pubmed.ncbi.nlm.nih.gov/12421889/ | 84 |
| Pressure | Wakefield's article linking MMR vaccine and autism was fraudulent (Godlee, BMJ 2011) | https://pubmed.ncbi.nlm.nih.gov/21209060/ | 72 |

Note: CDC autism page REJECTED (Nov 2025 policy reversal). Not present in any evidence object.

### A-4 CO₂ / Climate Driver (launch-A4)

| Slot | Title | Source URL | Score |
|------|-------|-----------|-------|
| Evidence 1 | IPCC Sixth Assessment Report WG1 Summary for Policymakers | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ | 90 |
| Evidence 2 | Causes of Climate Change | https://science.nasa.gov/climate-change/causes | 82 |
| Pressure | IPCC AR6 WG1 SPM (attribution angle) | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ | 90 |

### C-1 Social Media Algorithms (launch-C1)

| Slot | Title | Source URL | Score |
|------|-------|-----------|-------|
| Evidence 1 | The spread of true and false news online (Vosoughi et al., Science 2018) | https://pubmed.ncbi.nlm.nih.gov/29590045/ | 86 |
| Evidence 2 | On YouTube's recommendation system (YouTube VP Engineering blog, Sept 2021) | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ | 55 |
| Pressure | On YouTube's recommendation system (responsibility framing) | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ | 55 |

### D-2 Sleep Deprivation (launch-D2)

| Slot | Title | Source URL | Score |
|------|-------|-----------|-------|
| Evidence 1 | The Cumulative Cost of Additional Wakefulness (Van Dongen et al., SLEEP 2003) | https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117 | 87 |
| Evidence 2 | About Sleep | https://www.cdc.gov/sleep/about/index.html | 80 |
| Pressure | (none required — methodological) | — | — |

---

## 6. How to Unblock D-76

**Step 1.** Open `docs/D75_LAUNCH_SEED_V1_HUMAN_REVIEW_CHECKLIST.md`.

**Step 2.** Work through the per-claim checklist (Section 3) for each of the 5 READY claims.
Verify each row against the source URLs in Section 5 above. Mark ✅ or ❌ in the reviewer
result column. Record notes as needed.

**Step 3.** Work through the global checklist (Section 4 of D-75) covering G-1 through G-12.

**Step 4.** Record decisions in the D-75 Section 5 decision table — one of:
- `APPROVE_FOR_D76`
- `NEEDS_EDIT` (specify correction needed)
- `EXCLUDE_FROM_V1` (specify reason)
- `HOLD_FOR_MORE_SOURCES` (specify what is missing)

**Step 5.** Once all 5 READY claims carry `APPROVE_FOR_D76` (and any NEEDS_EDIT items are
resolved), notify the session. The next session will create `data/seed_claims_v2.json` on
a feature branch + PR.

**Step 6 (branch + PR).** `data/seed_claims_v2.json` is created from D-74 Section 3 objects.
No import route is called in this step.

**Step 7 (D-77, gated).** `GET /api/import-seed?mode=dry-run` is called. Requires explicit
per-session approval.

**Step 8 (D-78, gated).** `GET /api/import-seed?mode=apply` is called after dry-run review.
Requires separate explicit per-session D1/write approval.

---

## 7. Safety Boundaries

| Scope | No-cross line |
|-------|--------------|
| D-76 gate status (this document) | No file created, no route called, no D1 touched |
| D-76B (future — JSON file creation) | Branch + PR required; no import route; no Wrangler; no D1; no direct main commit |
| D-77 (future — dry-run) | Requires explicit per-session approval before route is called |
| D-78 (future — apply) | Requires separate explicit per-session D1/write approval |

---

## 8. Safety Confirmation

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed |
| No data/seed_claims_v2.json created | ✅ Confirmed |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| Static checks 119/24/39 | ✅ Confirmed |

---

## D-76 Completion Record

| Item | Status |
|------|--------|
| Gate sequence recap (D-57 through D-78) | ✅ |
| Claims requiring decisions — all 5 READY + 4 PARTIAL + 2 EXCLUDED listed | ✅ |
| Current decision state for all READY claims | ✅ — all recorded as "not recorded" |
| D-76 executable JSON entry criteria with current pass/fail | ✅ — criteria 1 and 2 blocking |
| Source reference summary for all 5 READY claims | ✅ |
| Step-by-step instructions to unblock D-76 | ✅ |
| Safety boundaries for D-76B through D-78 | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
