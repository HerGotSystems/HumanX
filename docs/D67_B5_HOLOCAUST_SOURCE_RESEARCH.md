# D-67: B-5 Holocaust Source Research

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called.

---

## 1. Summary

D-65 specified direct official-source navigation targets for B-5 (Holocaust: "The Holocaust
resulted in the murder of approximately six million Jews"). D-67 records the results of
the B-5 source research pass.

**Result: two evidence slots VERIFIED and one pressure slot VERIFIED.**

- Wannsee Protocol — Yale Avalon Project `avalon.law.yale.edu` — VERIFIED (slot 1)
- USHMM "How Many People did the Nazis Murder?" — `encyclopedia.ushmm.org` — VERIFIED (slot 2)
- USHMM "Antisemitism: An Introduction" — `encyclopedia.ushmm.org` — VERIFIED (pressure slot)

Yad Vashem (`yadvashem.org`) returned HTTP 403 Forbidden on all attempted paths. The
D-65 target map specifies the USHMM "Documenting Numbers of Victims" article as the
alternative when Yad Vashem navigation is unavailable. That article (slot 2 above) was
successfully accessed and VERIFIED.

No seed files were edited. No import route was called. No D1 or production mutation
occurred. These source records are ready to be transferred into the D-61 worksheet when
the full pack is assembled.

---

## 2. Claim Record

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-B5` |
| exact claim | The Holocaust resulted in the murder of approximately six million Jews |
| D-55 short name | B-5 — Holocaust: six million |
| category | History / Public Record |
| type | Historical/Physical |
| status target | Proven |
| launch_blocker | yes — required before any apply call |

---

## 3. Accepted Source Records

### Source 1 — Wannsee Protocol (Yale Avalon Project)

| Field | Value |
|-------|-------|
| candidate_url | https://avalon.law.yale.edu/imt/wannsee.asp |
| citation_title | Wannsee Protocol |
| publisher / source_owner | Yale Law School Lillian Goldman Law Library — Avalon Project (hosting primary document) |
| source_domain | avalon.law.yale.edu |
| source_class | Official primary historical document — Nuremberg prosecution evidence |
| stance | support |
| quality | documented |
| reliability_score | 85 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | The Wannsee Protocol is a classified Nazi German government document dated January 20, 1942, recording a meeting of senior Nazi officials in Berlin at which the systematic organization of the "final solution of the Jewish question" was discussed and coordinated across Europe. The document lists an estimated 11 million Jews across European countries as the target population for this coordinated plan and was entered as prosecution evidence at the International Military Tribunal at Nuremberg. Yale Law School's Avalon Project hosts this document as a primary historical record, demonstrating the state-sponsored and systematically planned character of the genocide that resulted in the Holocaust. |
| pressure_note | Not used as primary pressure source. The planning scope (11 million targets) provides context for the scale of the systematic intent. |
| rejection_reason | N/A |
| citation_note | Fetched directly from avalon.law.yale.edu/imt/wannsee.asp. Listed under the IMT (International Military Tribunal) section of the Avalon Project, confirming it was entered as Nuremberg prosecution evidence. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (avalon.law.yale.edu) | ✅ Yale Law School Avalon Project — official academic institution |
| Author/institution/date visible | ✅ Document dated January 20, 1942; Nuremberg prosecution evidence; Yale Avalon hosting institution attributed |
| Content directly supports the specific claim | ✅ — Primary Nazi government document proving systematic, state-sponsored planning for genocide of all European Jews |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality (score 85 justified by primary document status and Yale institutional hosting) | ✅ |

---

### Source 2 — USHMM: How Many People did the Nazis Murder?

| Field | Value |
|-------|-------|
| candidate_url | https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution |
| citation_title | How Many People did the Nazis Murder? |
| publisher / source_owner | United States Holocaust Memorial Museum |
| source_domain | encyclopedia.ushmm.org |
| source_class | Official Holocaust research and memorial institution — Holocaust Encyclopedia |
| stance | support |
| quality | documented |
| reliability_score | 82 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | The United States Holocaust Memorial Museum states that the Nazis and their allies and collaborators killed six million Jewish people in the systematic, state-sponsored genocide now known as the Holocaust. The USHMM article explains that these figures derive from Nazi German documents and prewar and postwar demographic studies, and provides a breakdown showing approximately 2.7 million killed at dedicated killing centers, approximately 2 million in mass shooting operations, and between 800,000 and 1 million in ghettos and other camps. This is the established finding of the leading US federal Holocaust research and memorial institution, last updated September 26, 2023. |
| pressure_note | The methodology note ("Nazi German documents and prewar and postwar demographic studies") directly addresses revisionist pressure points that contest the six million figure. |
| rejection_reason | N/A |
| citation_note | Fetched directly from encyclopedia.ushmm.org. Title on the page is "How Many People did the Nazis Murder?" — the URL slug `documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution` is the legacy identifier for this article. Last edited: September 26, 2023. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (encyclopedia.ushmm.org) | ✅ United States Holocaust Memorial Museum |
| Author/institution/date visible | ✅ USHMM attribution; Last Edited: September 26, 2023 |
| Content directly supports the specific claim | ✅ — "six million Jewish people" stated explicitly; breakdown by killing method; sources cited |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality | ✅ |

---

## 4. Pressure Source Record

### Pressure Source — USHMM: Antisemitism: An Introduction

| Field | Value |
|-------|-------|
| candidate_url | https://encyclopedia.ushmm.org/content/en/article/antisemitism |
| citation_title | Antisemitism: An Introduction |
| publisher / source_owner | United States Holocaust Memorial Museum |
| source_domain | encyclopedia.ushmm.org |
| source_class | Official Holocaust research and memorial institution — Holocaust Encyclopedia |
| stance | support (pressure context: denial failure) |
| quality | documented |
| reliability_score | 78 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | The USHMM Holocaust Encyclopedia article on antisemitism includes a dedicated section titled "Holocaust Distortion and Denial as Forms of Antisemitism," defining Holocaust denial as any attempt to negate the established facts of the Nazi German genocide and Holocaust distortion as statements that misrepresent those established facts. The article notes that deniers falsely claim the Holocaust was invented or exaggerated and characterizes both denial and distortion as recognized contemporary forms of antisemitism. This source, last edited January 10, 2025, establishes that challenges to the established six million figure lack evidentiary basis and reflect ideological rather than historical methodology. |
| pressure_note | Primary use: pressure slot for B-5. The pressure point is the claim that the six million figure is contested by some historians. This source establishes that those challenges constitute denial/distortion rather than legitimate historiographic dispute. |
| rejection_reason | N/A |
| citation_note | Fetched directly from encyclopedia.ushmm.org. Article has a dedicated subsection "Holocaust Distortion and Denial as Forms of Antisemitism." Last edited: January 10, 2025. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (encyclopedia.ushmm.org) | ✅ United States Holocaust Memorial Museum |
| Author/institution/date visible | ✅ USHMM attribution; Last Edited: January 10, 2025 |
| Content directly supports the pressure context | ✅ — Section on Holocaust denial defines denial, characterizes it as antisemitism, and identifies the "invented or exaggerated" denial narrative |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality | ✅ |

---

## 5. Rejected / Inaccessible Sources (This Pass)

| Source | URL attempted | Outcome | Reason |
|--------|--------------|---------|--------|
| Yad Vashem — estimated deaths | yadvashem.org/holocaust/about/final-solution-beginning-end/estimated-deaths.html | HTTP 403 Forbidden | Yad Vashem blocks automated web fetchers; page is present but inaccessible to WebFetch; USHMM alternative used per D-65 fallback instruction |
| Yad Vashem — death toll | yadvashem.org/holocaust/about/fate-of-jews/death-toll.html | HTTP 403 Forbidden | Same — Yad Vashem server-side block on non-browser user-agents |
| USHMM — Holocaust Denial article | encyclopedia.ushmm.org/content/en/article/holocaust-denial | HTTP 404 Not Found | URL slug does not exist at this path; USHMM Antisemitism article used instead (also covers denial in a dedicated section) |
| USHMM — Denial of the Holocaust | encyclopedia.ushmm.org/content/en/article/denial-of-the-holocaust | HTTP 404 Not Found | URL slug does not exist; Antisemitism article alternative confirmed adequate |
| USHMM — Holocaust Denial and Minimization | ushmm.org/antisemitism/holocaust-denial-and-minimization | HTTP 500 Internal Server Error | Server error; Antisemitism encyclopedia article used instead |
| IMT Judgment table of contents | avalon.law.yale.edu/subject_menus/judcont.asp | HTTP 404 Not Found | URL has changed; Wannsee Protocol (also Nuremberg evidence) used for slot 1 |

**Note on Yad Vashem:** The institution's content is accessible through a standard browser but
blocks automated fetchers. When a human researcher navigates `yadvashem.org` directly and
finds a specific research page with victim count methodology, that page should be added as a
third B-5 evidence source and the D-61 worksheet updated. Yad Vashem status for B-5 slot 2
is CANDIDATE (institution confirmed, specific page not yet fetched). The USHMM source above
fulfils the slot 2 requirement for now and should not be displaced without a confirmed Yad
Vashem VERIFIED record.

---

## 6. D-61 Worksheet Update

The following changes are ready to be applied to the D-61 worksheet fields when the
full pack is assembled into final seed JSON (D-68):

| D-61 field | Previous value | New value |
|------------|---------------|-----------|
| `launch-B5` slot 1 `candidate_url` | TODO_FIND_SOURCE | https://avalon.law.yale.edu/imt/wannsee.asp |
| `launch-B5` slot 1 `citation_title` | (blank) | Wannsee Protocol |
| `launch-B5` slot 1 `source_domain` | (blank) | avalon.law.yale.edu |
| `launch-B5` slot 1 `access_date` | (blank) | 2026-06-07 |
| `launch-B5` slot 1 `evidence_body` | (placeholder) | (see Section 3 Source 1 evidence_body above) |
| `launch-B5` slot 1 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-B5` slot 2 `candidate_url` | TODO_FIND_SOURCE | https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution |
| `launch-B5` slot 2 `citation_title` | (blank) | How Many People did the Nazis Murder? |
| `launch-B5` slot 2 `source_domain` | (blank) | encyclopedia.ushmm.org |
| `launch-B5` slot 2 `access_date` | (blank) | 2026-06-07 |
| `launch-B5` slot 2 `evidence_body` | (placeholder) | (see Section 3 Source 2 evidence_body above) |
| `launch-B5` slot 2 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-B5` pressure `candidate_url` | TODO_FIND_SOURCE | https://encyclopedia.ushmm.org/content/en/article/antisemitism |
| `launch-B5` pressure `citation_title` | (blank) | Antisemitism: An Introduction |
| `launch-B5` pressure `source_domain` | (blank) | encyclopedia.ushmm.org |
| `launch-B5` pressure `access_date` | (blank) | 2026-06-07 |
| `launch-B5` pressure `evidence_body` | (placeholder) | (see Section 4 evidence_body above) |
| `launch-B5` pressure `verification_status` | TODO_FIND_SOURCE | VERIFIED |

Note: The D-61 worksheet file itself is not edited in D-67. The worksheet update table
above records the intended changes. The worksheet and the D-57 JSON draft will be updated
together in the source insertion draft batch (D-68), once sufficient sources are verified
across the full launch pack.

---

## 7. D-62 Gate Delta — Batch B Cumulative (D-66 + D-67)

| Hard blocker | D-66 state | D-67 state |
|-------------|-----------|-----------|
| HB-1 any TODO_FIND_SOURCE | ⚠️ B-4 slots 1–2 cleared; slot 3 + all B-5 + all other claims TODO | ⚠️ B-4 slots 1–2 VERIFIED; B-5 slots 1–2 and pressure VERIFIED; B-4 slot 3 still TODO; Batch A, C, D, E all TODO |
| HB-2 any unverified | ⚠️ B-4 slots 1–2 VERIFIED; rest unverified | ⚠️ B-4 slots 1–2 + B-5 slots 1–2 + B-5 pressure VERIFIED (5 of 18+ slots); rest unverified |
| HB-3 SOURCE_NEEDED blocks apply | ❌ Still blocks — other claims unverified | ❌ Still blocks — Batch A, C, D, E claims all unverified |
| HB-4 evidence_body missing | ⚠️ B-4 slots 1–2 complete | ⚠️ B-4 slots 1–2 + B-5 slots 1–2 + B-5 pressure complete; rest draft |
| HB-5 reliability_score unconfirmed | ⚠️ B-4 slots 1–2 confirmed | ⚠️ B-4 slots 1–2 + B-5 slots 1–2 + B-5 pressure confirmed |
| HB-6 launch_blocker: true | ❌ B-4 partially resolved | ⚠️ B-4 partially resolved; B-5 fully resolved (2 evidence + pressure) |
| HB-7 pressure point review | ⚠️ B-4 pressure confirmed definitional | ⚠️ B-4 pressure confirmed; B-5 pressure VERIFIED |
| HB-8 needs-careful-framing truths | ⚠️ Flagged | ⚠️ Unchanged — truth framing review pending |
| HB-9 review_state='review' enforced | ✅ D-59 merged | ✅ |
| HB-10 D-59 hardening merged | ✅ PR #101 | ✅ |

**Batch B status after D-67:**
- B-4: slots 1 and 2 VERIFIED; slot 3 (Doll & Hill / specific HHS 1964 document) still TODO_FIND_SOURCE
- B-5: slots 1 and 2 VERIFIED; pressure slot VERIFIED — **B-5 fully resolved**

**Overall gate status: ❌ BLOCKED** — Batch A (vaccines, climate), Batch C (algorithms,
eyewitness, confirmation bias), Batch D (sleep, Dunning-Kruger, anchoring), and Batch E
(astrology) all have zero verified sources. B-4 slot 3 remains open. HB-3 still blocks
any apply call.

---

## 8. Safety

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| No URLs fabricated — all sourced from WebFetch of official institutional pages | ✅ Confirmed |
| Rejected sources recorded with reasons | ✅ Confirmed |

---

## D-67 Completion Record

| Item | Status |
|------|--------|
| Claim B-5 record documented | ✅ |
| Source 1 (Wannsee Protocol / Yale Avalon) — full citation record, VERIFIED | ✅ |
| Source 2 (USHMM victim count) — full citation record, VERIFIED | ✅ |
| Pressure source (USHMM antisemitism/denial) — full citation record, VERIFIED | ✅ |
| D-63 acceptance test confirmed for all 3 sources | ✅ |
| Yad Vashem 403 block documented; alternative confirmed | ✅ |
| USHMM denial article 404 documented; alternative confirmed | ✅ |
| All rejected/inaccessible sources recorded with reason | ✅ |
| D-61 worksheet update table recorded | ✅ |
| D-62 gate delta for Batch B cumulative documented | ✅ |
| B-5 fully resolved (slots 1–2 + pressure) | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
