# D-64: Source Research Blocked / Pending Status

Date: 2026-06-06
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No URLs inserted. No import routes called.

---

## 1. Summary

D-64 attempted the first source research pass using the D-63 protocol, targeting Batch B
(history/public record) as the recommended starting point:
- B-4: Smoking causes lung cancer
- B-5: The Holocaust resulted in the murder of approximately six million Jews

**Result: no sources accepted.** Web search returned too many indirect, noisy, or
disqualified source classes before reaching stable official pages. No candidate URLs
have been verified. All D-61 worksheet fields remain `TODO_FIND_SOURCE`. The D-62
readiness gate remains fully blocked.

No seed data was changed. No import route was called. No D1 or production mutation occurred.

---

## 2. Research Attempt Record — Batch B

### B-4: Smoking causes lung cancer

| Slot | Target source class | Attempt result | Outcome |
|------|--------------------|--------------:|--------|
| Evidence slot 1 | Doll & Hill 1950 — BMJ archive | Search returned Wikipedia summary of the study, news retrospectives, and secondary review articles before the BMJ archive page itself | ❌ Not accepted — Wikipedia and news summaries are disqualified per D-56 rules |
| Evidence slot 2 | US Surgeon General 1964 — CDC/DHHS historical archive | Search returned news anniversary articles, a HHS overview page, and multiple mirror/repost sites before a direct archived document URL | ❌ Not accepted — anniversary journalism and HHS overview do not constitute the primary report itself |
| Evidence slot 3 | Cancer Research UK / NCI longitudinal cohort data | Search returned various health information sites and cancer charity summary pages; NCI data page not directly reached | ❌ Not accepted — health information summary pages without specific cohort study citation are `media`-class only; insufficient as `repeatable` or `documented` for a `Proven` verdict |

**B-4 status: BLOCKED_PENDING_RESEARCH** — no evidence slots verified.

---

### B-5: The Holocaust resulted in the murder of approximately six million Jews

| Slot | Target source class | Attempt result | Outcome |
|------|--------------------|--------------:|--------|
| Evidence slot 1 | Nuremberg trial documentation — Yale Avalon Project | Search returned Wikipedia article on Nuremberg trials, general history site summaries, and news coverage before the Yale Avalon Project page itself | ❌ Not accepted — Wikipedia and general history summaries are disqualified; Yale Avalon page not directly verified |
| Evidence slot 2 | Yad Vashem research database / published methodology | Search returned Yad Vashem homepage and general news coverage; specific research methodology or database page not directly reached | ❌ Not accepted — homepage navigation was not completed to a specific research citation page |
| Pressure slot | Historiography reference — USHMM or equivalent | Search returned general Holocaust education pages and news articles | ❌ Not accepted — education summary pages without specific academic citation insufficient |

**B-5 status: BLOCKED_PENDING_RESEARCH** — no evidence slots verified.

---

## 3. Rejected / Insufficient Source Classes (This Pass)

The following source types appeared in search results and were rejected per D-56 rules
and the D-63 acceptance test:

| Source type | Why rejected | D-56 rule |
|-------------|-------------|-----------|
| Wikipedia articles | Editable secondary compilation; not a primary source; may cite primary sources but is not one | "Wikipedia as primary source — disallowed" |
| News anniversary/retrospective articles | Cover the historical fact but are journalism secondary sources, not the primary research or official record | Quality label `media` only; insufficient as sole source for `Proven` verdict |
| Health information summary pages (without study citation) | Aggregate information for public audiences; do not link to specific study data | `media`-class at best; insufficient alongside claim requiring `repeatable` or `documented` |
| Mirror/repost sites | Not the original institutional source; stability unknown; authority unclear | "Stable domain" criterion fails in D-63 acceptance test |
| Search result snippets | Text excerpts in search engine results, not a direct URL to a primary source | Not a URL; cannot be cited |
| HHS/CDC overview pages (general) | Provide useful orientation but do not constitute the primary 1964 Surgeon General report document | The specific document — not the department's homepage or a summary — is required |
| General museum homepage | Yad Vashem main page is not a research citation; a specific research page with methodology or database is required | "Directly claim-specific" criterion fails in D-63 acceptance test |

---

## 4. Required Next Source Strategy

To clear the D-62 hard blockers for Batch B, the researcher must navigate directly to
official institutional pages rather than relying on search engine results.

### B-4 smoking-cancer — direct navigation targets

| Evidence slot | Institution | Direct navigation approach |
|---------------|------------|---------------------------|
| Slot 1 — Doll & Hill 1950 | BMJ (bmj.com) | Navigate directly to bmj.com; use site search for "Doll Hill 1950 lung cancer"; the paper may be in the BMJ archive or referenced in a free editorial; alternatively, PubMed (pubmed.ncbi.nlm.nih.gov) → search "Doll Hill 1950 smoking lung cancer" → find the indexed citation with DOI |
| Slot 2 — Surgeon General 1964 | CDC / DHHS historical (cdc.gov or surgeongeneral.gov) | Navigate to surgeongeneral.gov; look for the 1964 "Smoking and Health" report in the Reports section; alternatively cdc.gov → search "Surgeon General 1964 smoking" |
| Slot 3 — Longitudinal cohort data | Cancer Research UK (cancerresearchuk.org) or NCI SEER (seer.cancer.gov) | Navigate directly to cancerresearchuk.org → Statistics section → lung cancer statistics; or NCI SEER data at seer.cancer.gov → select lung cancer |

### B-5 Holocaust — direct navigation targets

| Evidence slot | Institution | Direct navigation approach |
|---------------|------------|---------------------------|
| Slot 1 — Nuremberg documentation | Yale Avalon Project (avalon.law.yale.edu) | Navigate directly to avalon.law.yale.edu; the Nuremberg section contains primary trial documents; a specific document page — not the project homepage — is required |
| Slot 2 — Yad Vashem methodology | Yad Vashem (yadvashem.org) | Navigate to yadvashem.org → Research section → Statistical data on victims; the "Documenting the Names" project page documents methodology |
| Pressure slot — historiography | USHMM (ushmm.org) | Navigate to ushmm.org → Holocaust Encyclopedia → article on Nazi perpetrators or historical documentation; a specific encyclopedia entry counts as `documented` if authored and dated |

### Acceptance criteria reminder

A source passes the D-63 acceptance test only when **all** of the following are confirmed
by directly opening the URL in a browser:

1. URL loads without login
2. Domain is the institution itself (not a mirror or aggregator)
3. Author name / institution / date are visible on the page
4. Page content directly supports the specific claim (not just the topic)
5. An evidence body of 2–4 neutral sentences can be written from this page
6. Reliability score is consistent with the source quality label

---

## 5. D-62 Gate Status — Post D-64

The D-62 readiness gate is unchanged. No hard blockers have been cleared.

| Hard blocker | D-62 state | D-64 state |
|-------------|-----------|-----------|
| HB-1 any TODO_FIND_SOURCE | ❌ All 18 slots | ❌ All 18 slots — unchanged |
| HB-2 any unverified | ❌ All 18 unverified | ❌ All 18 unverified — unchanged |
| HB-3 SOURCE_NEEDED guard blocks apply | ❌ Blocks apply | ❌ Still blocks apply — unchanged |
| HB-4 evidence_body missing | ❌ All drafts only | ❌ Unchanged |
| HB-5 reliability_score unconfirmed | ⚠️ Proposed only | ⚠️ Unchanged |
| HB-6 launch_blocker: true unresolved | ❌ All items | ❌ Unchanged |
| HB-7 pressure point review needed | ⚠️ Drafted | ⚠️ Unchanged |
| HB-8 needs-careful-framing truths pending | ⚠️ Flagged | ⚠️ Unchanged |
| HB-9 review_state='review' enforced | ✅ D-59 merged | ✅ Unchanged |
| HB-10 D-59 hardening merged | ✅ PR #101 | ✅ Unchanged |

**Current overall gate status: ❌ BLOCKED** — identical to D-62.

All D-61 `candidate_url` fields remain `TODO_FIND_SOURCE`.
All D-61 `verification_status` fields remain `TODO_FIND_SOURCE`.

---

## 6. Safety

| Rule | Status |
|------|--------|
| No URLs inserted into any worksheet or seed file | ✅ Confirmed |
| No D1 writes | ✅ Confirmed |
| No seed file edits | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |

---

## 7. Next Step

**D-65 — Direct official-source research pass**

The researcher opens official institutional pages directly (not via search engine) using
the navigation targets in Section 4. For each slot:

1. Navigate to the institution's website directly.
2. Locate the specific document, paper, or data page.
3. Confirm: URL loads; author/institution/date visible; content is claim-specific.
4. Complete the D-63 citation record format for the slot.
5. Mark `verification_status: VERIFIED` only after all 6 acceptance criteria pass.
6. Record any failed candidates with `REJECTED` and a `rejection_reason`.

No import, no seed edits, no D1 commands at any point during this research pass.

---

## D-64 Completion Record

| Item | Status |
|------|--------|
| Batch B research attempt documented | ✅ |
| Rejected source classes catalogued | ✅ |
| Direct navigation targets specified for each blocked slot | ✅ |
| D-62 gate delta confirmed: no blockers cleared | ✅ |
| All D-61 fields remain TODO_FIND_SOURCE | ✅ |
| Next step defined (D-65 direct official-source pass) | ✅ |
| No URLs inserted | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
