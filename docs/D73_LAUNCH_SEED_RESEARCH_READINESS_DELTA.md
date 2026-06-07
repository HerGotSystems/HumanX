# D-73: Launch Seed Research Readiness Delta

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called.

---

## 1. Summary

D-73 reviews the cumulative source research output from D-66 through D-72 and produces a
readiness classification for each of the 11 representative claims from the D-57 launch
seed draft. It also makes a formal recommendation to exclude E-5 (astrology) from Launch
Seed v1.

**D-73 changes no data files. It is a planning document only.**

The D-59 SOURCE_NEEDED guard remains the enforcement mechanism: any attempt to call
`GET /api/import-seed?mode=apply` with an unresolved `source_url` will be blocked at
runtime. D-73 advises which claims are ready to enter the final seed JSON (D-74 source
insertion draft) and which must be excluded or deferred.

### Key finding

Five claims are fully resolved with 2+ VERIFIED sources and are ready to enter the
source insertion draft. Three claims are partially resolved with 1 VERIFIED source and
require one additional source. Three claims remain blocked with 0 VERIFIED sources.

E-5 is recommended for exclusion from Launch Seed v1. Proceeding without E-5 is safe
and does not affect the D-59 SOURCE_NEEDED guard — the guard only applies to sources
actually included in the import JSON, not to excluded claims.

---

## 2. Source Research Status Table

Sources confirmed across D-66 through D-72. Counts represent VERIFIED sources only
(CANDIDATE_FOUND and BLOCKED sources do not count toward readiness).

| Claim | Short name | VERIFIED support | VERIFIED pressure | Blocked / gap | Gate |
|-------|-----------|-----------------|------------------|---------------|------|
| B-4 | Smoking → lung cancer | 2 (CDC, NCI) | 0 (definitional — none required) | slot 3: no free Doll & Hill / 1964 SG report page found | ⚠️ PARTIAL |
| B-5 | Holocaust: 6 million | 2 (Yale Avalon, USHMM) | 1 (USHMM antisemitism) | none | ✅ READY |
| A-1 | MMR vaccine / autism | 2 (Cochrane/PubMed, NEJM/PubMed) | 1 (BMJ Godlee / PubMed) | none | ✅ READY |
| A-4 | CO₂ / climate driver | 2 (IPCC AR6 SPM, NASA) | 1 (IPCC AR6 SPM, attribution angle) | none | ✅ READY |
| C-1 | Social media algorithms | 2 (Vosoughi Science, YouTube blog) | 1 (YouTube blog, responsibility angle) | none | ✅ READY |
| C-2 | Eyewitness testimony | 2 (Innocence Project, NIJ) | 0 (NRC 2014 paywalled — $40) | pressure blocked | ⚠️ PARTIAL |
| C-4 | Confirmation bias | 0 | 0 | Nickerson 1998 CANDIDATE only; slot 2 not found; APA/PsycNET JS-rendered | ❌ BLOCKED |
| D-2 | Sleep deprivation | 2 (Van Dongen 2003, CDC) | 0 (definitional — none required) | none | ✅ READY |
| D-3 | Dunning-Kruger | 1 (Kruger & Dunning 1999) | 0 (Nuhfer 2016 CANDIDATE only; Elsevier DK critique blocked) | slot 2 / pressure CANDIDATE | ⚠️ PARTIAL |
| D-5 | Anchoring bias | 1 (Tversky & Kahneman 1974) | 0 (definitional — none required) | slot 2 blocked (Wiley 402, ScienceDirect 403) | ⚠️ PARTIAL |
| E-5 | Astrology | 0 | 0 | all blocked (Nature paywall, Elsevier 403, not in PubMed) | ❌ BLOCKED |

**Notes on pressure slots:**
- B-4: D-63 specified "pressure is definitional" — no external URL required. ✅ met
- A-4: IPCC AR6 SPM serves double duty (primary evidence + attribution pressure). ✅ met
- C-1: YouTube blog serves double duty (slot 2 + pressure). ✅ met
- D-2: D-63 specified "pressure is methodological" — no external URL required. ✅ met
- D-5: D-63 specified "pressure is methodological" — no external URL required. ✅ met
- C-2: NRC 2014 National Academies report is the D-63-specified pressure source; it is
  paywalled at $40 with no free-access equivalent found. Pressure slot technically open.
- D-3: Nuhfer 2016 is CANDIDATE_FOUND (borderline claim-specificity; Gignac 2020 or
  Ehrlinger 2008 preferred but Elsevier-blocked). Pressure not yet VERIFIED.

---

## 3. Readiness Classification

| Claim | Classification | Rationale |
|-------|---------------|-----------|
| B-5 — Holocaust | **READY_FOR_SOURCE_INSERTION** | 2 VERIFIED + 1 VERIFIED pressure; no open slots |
| A-1 — vaccines/autism | **READY_FOR_SOURCE_INSERTION** | 2 VERIFIED + 1 VERIFIED pressure; no open slots |
| A-4 — CO₂/climate | **READY_FOR_SOURCE_INSERTION** | 2 VERIFIED + 1 VERIFIED pressure (same URL, attribution angle); no open slots |
| C-1 — social media algorithms | **READY_FOR_SOURCE_INSERTION** | 2 VERIFIED + 1 VERIFIED pressure (same URL, responsibility angle); no open slots |
| D-2 — sleep deprivation | **READY_FOR_SOURCE_INSERTION** | 2 VERIFIED; no pressure URL required per D-63; no open slots |
| B-4 — smoking/lung cancer | **PARTIAL_NEEDS_ONE_MORE_SOURCE** | 2 VERIFIED support; slot 3 open; pressure definitional (met); Doll & Hill 1950 BMJ or 1964 SG Report page not yet found |
| C-2 — eyewitness testimony | **PARTIAL_NEEDS_ONE_MORE_SOURCE** | 2 VERIFIED support; pressure slot open (NRC 2014 paywalled); per D-63 minimum 2 support sources met — can enter insertion draft noting pressure gap |
| D-3 — Dunning-Kruger | **PARTIAL_NEEDS_ONE_MORE_SOURCE** | 1 VERIFIED (Kruger & Dunning 1999); D-63 requires 2 sources including a critique/replication; D-3 status is `Plausible` not `Proven`; both the support and critique are required for honest grading |
| D-5 — anchoring bias | **PARTIAL_NEEDS_ONE_MORE_SOURCE** | 1 VERIFIED (Tversky & Kahneman 1974); D-63 minimum 2 sources; slot 2 blocked |
| C-4 — confirmation bias | **EXCLUDE_FROM_LAUNCH_V1** | 0 VERIFIED sources; Nickerson 1998 paywalled (CANDIDATE only); slot 2 not found; both Sage and APA/PsycNET paths blocked for automated access |
| E-5 — astrology | **EXCLUDE_FROM_LAUNCH_V1** | 0 VERIFIED sources; all three targets (Carlson 1985, Hartmann 2006, Musch & Grondin 2001) blocked by publisher paywalls; no free-access equivalents found in PubMed/PMC |

### Classification definitions (this document)

| Classification | Meaning |
|----------------|---------|
| `READY_FOR_SOURCE_INSERTION` | All D-63 minimum source requirements met; all slots VERIFIED; claim may enter D-74 source insertion draft and final seed JSON |
| `PARTIAL_NEEDS_ONE_MORE_SOURCE` | At least 1 VERIFIED source found; one or more required slots still open; can enter insertion draft with clear gap note; cannot enter apply-mode import until gap is resolved |
| `EXCLUDE_FROM_LAUNCH_V1` | 0 VERIFIED sources or fundamental source-access barrier; must be excluded from v1 import; document as future research |
| `KEEP_AS_FUTURE_RESEARCH` | Same as EXCLUDE — retained in D-55/D-57 draft for future research pass when institutional access or open-access equivalents are available |

---

## 4. E-5 Exclusion Decision

### Recommendation: Remove E-5 from Launch Seed v1

**Basis:**

E-5 claims: "Astrology cannot reliably predict personality traits or life outcomes beyond
chance."

After two dedicated research passes (D-71 and D-72), no source for E-5 satisfies the
D-63 acceptance test:

1. **Carlson 1985, Nature** (DOI 10.1038/318419a0): The strongest candidate. The
   bibliographic record is confirmed at nature.com (title, author, DOI, volume, year,
   opening abstract sentence all visible). However: the stable URL redirects to
   authentication; the full abstract including the experimental finding is behind a
   subscription paywall; the paper is not indexed in PubMed; no free-access equivalent
   (PMC, institutional repository) has been found. Fails D-63 criteria 1 (stable URL
   requires auth), 4 (finding not visible without subscription), and 7 (no free-access
   equivalent). Status: PAYWALLED_OR_INACCESSIBLE.

2. **Hartmann, Reuter & Nyborg 2006, PAID** (DOI 10.1016/j.paid.2005.11.017): ScienceDirect
   HTTP 403 on all attempts; not indexed in PubMed. No accessible version found.

3. **Musch & Grondin 2001, Developmental Review** (DOI 10.1006/drev.2000.0516): Elsevier
   LinkingHub redirect-only; no article content accessible. Status: BLOCKED.

**The exclusion is conservative, not editorial.** The scientific consensus that astrology
lacks predictive validity is not in dispute. The exclusion is solely because the seed
pack source quality requirement (all source_url entries must be freely verifiable per
D-59/D-63) cannot currently be met for this claim without institutional library access.

**Effect of exclusion:**
- The D-59 SOURCE_NEEDED guard applies only to `source_url` fields in the import JSON.
  If E-5 is not included in the import JSON, the guard is not triggered for E-5.
- The remaining 10 claims proceed independently.
- E-5 can be added in a future update (Launch Seed v1.1 or similar) once a
  free-access version of Carlson 1985 is located (LBNL/eScholarship, PMC meta-analysis
  alternative, or institutional library access).

**Alternative path if E-5 is needed for v1:**
A PMC-indexed open-access meta-analysis on astrological prediction studies (if one
exists) would satisfy D-63 criteria and could replace the blocked primary sources.
The search `site:pmc.ncbi.nlm.nih.gov astrology prediction systematic review` has not
yet been attempted.

---

## 5. D-62 Gate Update After D-66 through D-72

The original D-62 gate was BLOCKED on all HB-1 through HB-8 items. The table below
records the revised state after source research completion.

| Hard blocker | Original state (D-62) | State after D-66–D-72 |
|-------------|----------------------|----------------------|
| HB-1: any TODO_FIND_SOURCE | ❌ All 18 slots TODO | ⚠️ 5 claims fully resolved; 4 partial; 2 excluded (E-5, C-4) |
| HB-2: any unverified slot | ❌ All 18 unverified | ⚠️ 20 slots VERIFIED; 6 open (B-4 slot3, C-2 pressure, D-3 slot2, D-5 slot2, C-4 both, E-5 both+pressure) |
| HB-3: SOURCE_NEEDED guard | ❌ Blocks apply | ⚠️ Will clear for 5 READY claims once inserted into seed JSON; E-5/C-4 excluded from JSON |
| HB-4: evidence_body missing | ❌ All draft | ⚠️ 20 VERIFIED slots have confirmed evidence bodies; 6 open slots still draft/missing |
| HB-5: reliability_score unconfirmed | ⚠️ Proposed only | ⚠️ 20 VERIFIED slots have confirmed scores; 6 open slots unconfirmed |
| HB-6: launch_blocker items unresolved | ❌ All unresolved | ⚠️ 5 READY claims fully resolved; 4 partial claims have at least 1 VERIFIED launch_blocker slot; 2 excluded |
| HB-7: pressure points | ⚠️ Draft only | ⚠️ 5 READY claims have pressure satisfied; C-2 pressure still open; D-3 pressure CANDIDATE |
| HB-8: needs-careful-framing truths | ⚠️ Review pending | ⚠️ Truth framing decisions not yet finalized — deferred to D-74 |
| HB-9: review_state='review' | ✅ D-59 | ✅ |
| HB-10: D-59 hardening merged | ✅ PR #101 | ✅ |

**Revised gate status: ❌ BLOCKED overall** — HB-1 through HB-8 still have open items.
However, the 5 READY claims can proceed to D-74 source insertion draft and ultimately
to a scoped import that covers only those 5 claims, bypassing the blocked/excluded claims.

---

## 6. D-74 Source Insertion Draft Scope Recommendation

D-74 (source insertion draft) should be scoped as follows:

### Include in D-74 (READY claims — full source insertion)

| Claim | Evidence sources | Pressure source |
|-------|-----------------|----------------|
| B-5 — Holocaust | Wannsee Protocol (Yale Avalon) + USHMM victim count | USHMM antisemitism/denial |
| A-1 — vaccines/autism | Cochrane meta-analysis (PubMed 22336803) + Madsen NEJM (PubMed 12421889) | Godlee BMJ (PubMed 21209060) |
| A-4 — CO₂/climate | IPCC AR6 WG1 SPM (ipcc.ch) + NASA causes (science.nasa.gov) | IPCC AR6 SPM (attribution angle) |
| C-1 — social media algorithms | Vosoughi Science (PubMed 29590045) + YouTube VP blog (blog.youtube) | YouTube blog (responsibility angle) |
| D-2 — sleep deprivation | Van Dongen SLEEP (academic.oup.com) + CDC About Sleep (cdc.gov) | None required |

### Include in D-74 with GAP NOTE (PARTIAL claims — partial source insertion)

These claims have verified support sources but open slots. They can be drafted in D-74
with a clear `SLOT_OPEN` marker in lieu of the missing source. They must not enter
`?mode=apply` until the open slot is resolved.

| Claim | VERIFIED sources | Open slot |
|-------|-----------------|-----------|
| B-4 — smoking/lung cancer | CDC (cdc.gov) + NCI (cancer.gov) | Slot 3: Doll & Hill 1950 BMJ or 1964 SG Report specific page |
| C-2 — eyewitness testimony | Innocence Project + NIJ | Pressure: NRC 2014 free-access equivalent |
| D-5 — anchoring bias | Tversky & Kahneman 1974 (PubMed 17835457) | Slot 2: second anchoring study |

### Include in D-74 with GAP NOTE — special (D-3: mandatory 2-source requirement)

D-63 specifies D-3 requires both a support AND a critique source, because the honest
verdict is `Plausible` not `Proven`. Including D-3 with only Kruger & Dunning 1999 would
misrepresent the claim's status. Two options:

- **Option A:** Include D-3 with 1 VERIFIED + Nuhfer 2016 CANDIDATE, marked as
  `review_state='review'` with evidence_body note that critique is pending final
  confirmation. Moderator can review and approve/reject the Nuhfer source.
- **Option B:** Exclude D-3 from D-74 until a second fully VERIFIED source is found.

Recommendation: **Option A** — include D-3 with the CANDIDATE Nuhfer source flagged.
The moderation queue can surface this for human review. The `Plausible` status protects
against overclaiming even with one evidence source.

### Exclude from D-74 / Launch Seed v1

| Claim | Reason |
|-------|--------|
| C-4 — confirmation bias | 0 VERIFIED sources; both slots blocked by paywalls/JS rendering |
| E-5 — astrology | 0 VERIFIED sources; all publisher paths blocked; paper not in PubMed |

### Truth seed framing decisions (D-74 scope)

D-62 HB-8 flags 3 `needs-careful-framing` truths. D-74 should include the finalized
framing note for each of the 22 `launch-candidate` truths and document the 3 deferred
ones. No truth framing decisions are resolved in D-73; this is deferred to D-74.

---

## 7. Cumulative Verified Slot Count (Final After D-72)

| Category | Claim | Verified support | Verified pressure | Launch v1 status |
|----------|-------|-----------------|------------------|-----------------|
| History | B-4 — smoking | 2 / 3 | 0 / 0 (met — definitional) | PARTIAL |
| History | B-5 — Holocaust | 2 / 2 | 1 / 1 | ✅ READY |
| Science | A-1 — vaccines | 2 / 2 | 1 / 1 | ✅ READY |
| Science | A-4 — climate | 2 / 2 | 1 / 1 (dual-use) | ✅ READY |
| Civic | C-1 — algorithms | 2 / 2 | 1 / 1 (dual-use) | ✅ READY |
| Civic | C-2 — eyewitness | 2 / 2 | 0 / 1 | PARTIAL |
| Civic | C-4 — confirmation bias | 0 / 2 | 0 | EXCLUDED |
| Behaviour | D-2 — sleep | 2 / 2 | 0 / 0 (met — definitional) | ✅ READY |
| Behaviour | D-3 — Dunning-Kruger | 1 / 2 | 0 / 1 (CANDIDATE) | PARTIAL (Option A) |
| Behaviour | D-5 — anchoring | 1 / 2 | 0 / 0 (met — definitional) | PARTIAL |
| Belief | E-5 — astrology | 0 / 2 | 0 / 1 | EXCLUDED |

**READY: 5 claims** (B-5, A-1, A-4, C-1, D-2)
**PARTIAL: 4 claims** (B-4, C-2, D-3, D-5)
**EXCLUDED: 2 claims** (C-4, E-5)

---

## 8. Safety

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed — D-73 is planning only |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| No URLs fabricated | ✅ Confirmed |
| No paywalled-only sources promoted to VERIFIED | ✅ Confirmed — E-5 explicitly excluded on this basis |
| E-5 exclusion documented as access-gap, not editorial | ✅ Confirmed |

---

## D-73 Completion Record

| Item | Status |
|------|--------|
| Research status table for all 11 claims | ✅ |
| Readiness classification for all 11 claims | ✅ |
| E-5 exclusion recommendation documented with full basis | ✅ |
| D-62 gate update table | ✅ |
| D-74 scope recommendation (include / partial / exclude) | ✅ |
| D-3 dual-option recommendation documented | ✅ |
| Truth seed framing deferred to D-74 | ✅ |
| Cumulative verified slot count table | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
