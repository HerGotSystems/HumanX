# D-62: Final Launch Seed Pack Readiness Gate

Date: 2026-06-06
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No URLs inserted. No import route called.

---

## 1. Summary

| Batch | Output |
|-------|--------|
| D-55 | 25 launch claim drafts + 25 truth drafts; all `SOURCE_NEEDED` placeholders |
| D-56 | Source quality rules; per-claim research checklist |
| D-57 | JSON file shape + 12 representative draft claim/truth objects; all `SOURCE_NEEDED` |
| D-58 | Import route safety plan (Worker change) |
| D-59 | Import route hardening implemented + merged (PR #101) — dry-run default, `review_state='review'`, SOURCE_NEEDED guard |
| D-60 | Post-merge checkpoint — static baseline 119/24/39, Read Smoke green |
| D-61 | Source URL candidate worksheet — 18 evidence slots, 5 pressure slots, 12 truth rows; all `TODO_FIND_SOURCE` |
| **D-62** | **This document — readiness gate definition** |

D-62 defines the exact conditions that must be satisfied before the D-57 draft is
converted into real launch seed JSON and submitted to `GET /api/import-seed?mode=apply`.

**Nothing in D-62 triggers a write.** No URLs are inserted. No seed files are edited.
The SOURCE_NEEDED guard in `?mode=apply` technically enforces the gate at runtime;
D-62 defines the human-facing pre-flight checklist that must pass before that route
is called.

---

## 2. Hard Blockers

Any one of the following conditions prevents progression to final seed JSON
(`data/seed_claims_v2.json`) or to any import route call:

| # | Blocker | Current state |
|---|---------|--------------|
| HB-1 | Any `candidate_url` field is `TODO_FIND_SOURCE` | ❌ All 18 evidence slots are `TODO_FIND_SOURCE` |
| HB-2 | Any `verification_status` is not `VERIFIED` | ❌ All 18 slots are unverified |
| HB-3 | Any `source_url` in the final JSON is empty string `''` or contains `SOURCE_NEEDED` | ❌ Will be blocked by D-59 SOURCE_NEEDED guard at apply time |
| HB-4 | Any required `evidence_body` is missing or is a placeholder only | ❌ All evidence_body fields are drafts; content requires verification before finalising |
| HB-5 | Any required `reliability_score` is missing | ⚠️ Proposed scores are set in D-61; must be confirmed against actual source quality once URL is verified |
| HB-6 | Any `launch_blocker: true` evidence item has unresolved source | ❌ All items marked `launch_blocker: true` in D-57 have `SOURCE_NEEDED` |
| HB-7 | Any `Physical/Testable` claim is missing at least one pressure point | ⚠️ Pressure points are drafted; content review required |
| HB-8 | Any `needs-careful-framing` truth is missing origin label / framing decision | ⚠️ 3 truths flagged — framing decisions documented in D-61 Section 6; UI confirmation required before import |
| HB-9 | `review_state_intended` is not `'review'` for all claims and truths | ✅ D-59 enforces `review_state='review'` by default |
| HB-10 | D-59 import route hardening not merged | ✅ Merged PR #101, commit `1c32745` |

**Current overall gate status: ❌ BLOCKED** — HB-1 through HB-8 are unresolved.

---

## 3. Claim Readiness Checklist

Status definitions:

| Status | Meaning |
|--------|---------|
| `BLOCKED_PENDING_RESEARCH` | Source URLs not yet found/verified. Cannot proceed. |
| `SOURCES_FOUND` | Candidate URLs identified but not yet verified (link tested, content confirmed). |
| `SOURCES_VERIFIED` | All required URLs verified, evidence_body drafted, reliability_score confirmed. |
| `READY` | All gates pass; claim may enter final seed JSON. |

---

### A-1 — Vaccines cause autism

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (peer-reviewed meta-analysis) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (Lancet retraction / BMJ) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 2 drafted; content review on temporal-correlation framing | `BLOCKED_PENDING_RESEARCH` |
| Home test | n/a | N/A |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### A-4 — Human CO₂ as primary driver of global warming

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (IPCC AR6 SPM — official, free access) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (peer-reviewed attribution study) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 2 drafted; natural variation and feedback uncertainty | `BLOCKED_PENDING_RESEARCH` |
| Home test | Local temperature tracking — non-blocking description | ⚠️ Review wording before import |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### B-4 — Smoking causes lung cancer

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (Doll & Hill 1950 — BMJ archive) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (US Surgeon General 1964 — CDC/DHHS) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 3 | 1 VERIFIED URL (Cancer Research UK / NCI longitudinal data) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 1 drafted; population-level vs. individual certainty | `BLOCKED_PENDING_RESEARCH` |
| Home test | n/a | N/A |
| launch_blocker | All evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### B-5 — Holocaust: murder of approximately six million Jews

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (Nuremberg archive — Yale Avalon or equivalent) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (Yad Vashem database / methodology) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 1 drafted; denial-argument failure — framing review required | `BLOCKED_PENDING_RESEARCH` |
| Home test | n/a | N/A |
| Pressure source needed | Historiography reference (Lipstadt / USHMM) | `BLOCKED_PENDING_RESEARCH` |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED; pressure framing requires careful review |

---

### C-1 — Social media algorithms maximise engagement, not accuracy

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (WSJ Facebook Files / congressional testimony) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (peer-reviewed algorithm research paper) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 1 drafted; platform counter-argument; platform transparency report needed | `BLOCKED_PENDING_RESEARCH` |
| Home test | Observation protocol — non-blocking description | ⚠️ Review wording |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### C-2 — Eyewitness testimony is unreliable as sole evidence

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (Innocence Project exoneration data) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (Loftus false memory research) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 1 drafted; safeguards and conditions; NRC 2014 reference needed | `BLOCKED_PENDING_RESEARCH` |
| Home test | Change-blindness video — non-blocking description | ⚠️ Review wording |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### C-4 — Confirmation bias causes favouring of confirming information

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (Wason selection task — peer-reviewed) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (Nickerson 1998 Psychological Bulletin review) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 1 drafted; non-universality across topics and stakes | `BLOCKED_PENDING_RESEARCH` |
| Home test | Wason card flip observation — non-blocking description | ⚠️ Review wording |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### D-2 — Sleep deprivation impairs cognition comparably to alcohol

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (Van Dongen et al. 2003 sleep research) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (WHO / CDC sleep deprivation guidance) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 1 drafted; "comparable" precision — domain and threshold clarification | `BLOCKED_PENDING_RESEARCH` |
| Home test | Reaction-time observation — non-blocking description | ⚠️ Review wording |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### D-3 — Dunning-Kruger: low knowledge → overconfidence

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (Kruger & Dunning 1999 JPSP) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (critique / replication study) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 2 drafted; statistical artefact claim; expert overestimation outside domain | `BLOCKED_PENDING_RESEARCH` |
| Home test | Quiz estimation exercise — non-blocking description | ⚠️ Review wording |
| Status target | `Plausible` — honest given replication debates | ✅ Planned correctly |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### D-5 — Anchoring bias inflates estimates

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (Tversky & Kahneman 1974 Science) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (legal sentencing or pricing anchoring study) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 1 drafted; effect size variation by domain and expertise | `BLOCKED_PENDING_RESEARCH` |
| Home test | Numerical estimation exercise — non-blocking description | ⚠️ Review wording |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### E-5 — Astrology can predict personality traits

| Item | Requirement | Status |
|------|-------------|--------|
| Evidence slot 1 | 1 VERIFIED URL (Carlson 1985 double-blind study — Nature) | `BLOCKED_PENDING_RESEARCH` |
| Evidence slot 2 | 1 VERIFIED URL (birth-date / personality psychology study) | `BLOCKED_PENDING_RESEARCH` |
| Pressure points | 2 drafted; Barnum effect; school-entry cutoff season-of-birth study needed | `BLOCKED_PENDING_RESEARCH` |
| Home test | Sun-sign accuracy self-test — non-blocking description | ⚠️ Review wording |
| Status target | `Weak Evidence` — honest empirical verdict | ✅ Planned correctly |
| launch_blocker | Both evidence items are `launch_blocker: true` | ❌ |
| **Claim status** | | **BLOCKED_PENDING_RESEARCH** |
| Reason | All source_url fields are SOURCE_NEEDED | |

---

### Claim readiness summary

| Claim | Evidence slots | All VERIFIED | Pressure OK | Status |
|-------|---------------|-------------|-------------|--------|
| A-1 Vaccines-autism | 2 | ❌ | ❌ | BLOCKED |
| A-4 CO₂ climate driver | 2 | ❌ | ❌ | BLOCKED |
| B-4 Smoking-cancer | 3 | ❌ | ❌ | BLOCKED |
| B-5 Holocaust | 2 | ❌ | ❌ | BLOCKED |
| C-1 Social media algorithms | 2 | ❌ | ❌ | BLOCKED |
| C-2 Eyewitness testimony | 2 | ❌ | ❌ | BLOCKED |
| C-4 Confirmation bias | 2 | ❌ | ❌ | BLOCKED |
| D-2 Sleep deprivation | 2 | ❌ | ❌ | BLOCKED |
| D-3 Dunning-Kruger | 2 | ❌ | ❌ | BLOCKED |
| D-5 Anchoring bias | 2 | ❌ | ❌ | BLOCKED |
| E-5 Astrology personality | 2 | ❌ | ❌ | BLOCKED |

**Total: 0 / 11 claims ready. 18 evidence slots unverified.**

(Note: the 12th D-57 representative claim — A-1 counted twice above — is covered.
The full D-55 launch set has 25 claims; the checklist above covers the 11 representative
claims from D-57 that have detailed evidence slot structure. The remaining 14 D-55 claims
also require the same gate before inclusion in any import.)

---

## 4. Truth Readiness Checklist

Truth seeds do not require `source_url` in the importer schema. Their gate is framing
and UI readiness, not source URL verification.

| Truth | Framing needed | Source needed | UI dependency | Status |
|-------|---------------|--------------|--------------|--------|
| T1 — Internet truth | Origin label as common digital-era saying | No | None | `FRAMING_ONLY_PENDING` |
| T2 — News always true | Institutional trust claim label | No | None | `FRAMING_ONLY_PENDING` |
| T3 — News always lies | Counter-institutional; pair with T2 | No | None | `FRAMING_ONLY_PENDING` |
| T4 — Can't trust statistics | Anti-evidence dismissal label | No | None | `FRAMING_ONLY_PENDING` |
| T5 — Would know if lied to | Overconfidence claim label | No | None | `FRAMING_ONLY_PENDING` |
| T6 — Seeing is believing | Perception-as-authority label | No | None | `FRAMING_ONLY_PENDING` |
| T7 — Everyone knows that | Consensus-appeal label | No | None | `FRAMING_ONLY_PENDING` |
| T8 — Common sense | Anti-evidence dismissal label | No | None | `FRAMING_ONLY_PENDING` |
| T9 — Majority can't be wrong | Majority-appeal label | No | None | `FRAMING_ONLY_PENDING` |
| T10 — Nothing to hide/fear | **needs-careful-framing** — must not read as HumanX endorsing surveillance; origin label (political saying) required | Maybe — scholarly origin ref | Origin/category field visible in UI | `FRAMING_ONLY_PENDING` — import gated on UI origin display confirmation |
| T11 — Free speech no consequences | Legal/civic misapplication label | No | None | `FRAMING_ONLY_PENDING` |
| T12 — Success = hard work | Meritocracy claim label | No | None | `FRAMING_ONLY_PENDING` |

**Additional `needs-careful-framing` truths from D-55 (not in D-57 representative 12):**

| Truth | Gate |
|-------|------|
| "Democracy is the best system of government" | Import gated on visible origin label (Western political tradition) in UI; comparative claim must not appear as HumanX's position |
| "My religion is the only true path" | Import gated on visible religious-claim origin label in UI; do not import until frontend origin/category display is confirmed working for belief-category truths |

**Truth readiness summary:** 0 / 12 representative truths confirmed ready for import.
Gate: framing decisions are documented; import requires user confirmation that the
frontend correctly displays `origin` and `category` labels for each truth before the
Truths workspace makes them publicly visible.

---

## 5. Conversion Rules — Draft to Final JSON

When source research is complete and all readiness gates pass, the D-57 draft objects
must be converted to final import-ready JSON following these rules:

| Rule | Detail |
|------|--------|
| **Strip draft-only fields** | Remove `source_url_status`, `source_url_status`, `launch_priority`, `risk_level`, `source_status`, `notes`, `review_state_intended` before import. These are documentation fields not consumed by the importer. |
| **Replace all SOURCE_NEEDED** | Every `source_url` value must be a real, publicly accessible URL. No `SOURCE_NEEDED` string permitted. No empty string `''`. The D-59 SOURCE_NEEDED guard will block `?mode=apply` if either condition is present. |
| **source_domain must match URL** | The `source_domain` tracking field (draft-only) should be verified against the final URL before stripping. |
| **review_state_intended must be 'review'** | The D-59 importer enforces `review_state='review'` by default. Do not pass `'public'` or any other value explicitly unless a deliberate override is intended and approved. |
| **No launch_blocker: true item in final pack** | If any evidence item still has `launch_blocker: true` and its `source_url` is unresolved, that item must be either resolved or removed before creating the final JSON. |
| **No unverified claim enters final pack** | A claim with any unverified required evidence slot must not appear in the final JSON, even if other claims are ready. Either all required items are verified or the claim is excluded. |
| **evidence_body must be original, neutral text** | Body text should summarise what the source shows in plain English. It must not reproduce verbatim quotes at length (copyright), must not editorialize, and must not overstate the verdict. |
| **reliability_score must be consistent** | Assigned score must match the quality label per D-55 guidance: `repeatable` 80–90, `documented` 60–75, `media` 30–45, `testimony` 20–30. |
| **Claim IDs must not collide** | The `seed_id` prefix `launch-` distinguishes new seeds from existing demo seeds (`seed-`). Confirm no collision with existing DB rows before apply. |
| **Pressure and test objects stripped of draft notes** | `pressure[].body` and `tests[].instructions` must be final, complete text — not placeholders or research-notes. |

---

## 6. Pre-Import Dry-Run Gate

Before `GET /api/import-seed?mode=apply` or `GET /api/import-truths?mode=apply` is
called, all of the following must be confirmed — in this order:

| Step | Check | Who |
|------|-------|-----|
| 1 | D-59 import route hardening confirmed merged on main | ✅ Done — PR #101 |
| 2 | Final seed JSON (`data/seed_claims_v2.json`) reviewed by user — no SOURCE_NEEDED, no empty source_url | ❌ File does not exist yet |
| 3 | Explicit user approval obtained for this session's dry-run call | ❌ Not yet requested |
| 4 | `GET /api/import-seed?mode=dry-run` called with admin token | ❌ Not yet |
| 5 | Dry-run report reviewed — `would_create`, `would_skip`, `source_needed_blocked` counts examined | ❌ Not yet |
| 6 | `source_needed_blocked: 0` confirmed in dry-run output | ❌ Not yet |
| 7 | `would_create` counts match expected claim/evidence/pressure/test counts | ❌ Not yet |
| 8 | Explicit user approval obtained for this session's apply call | ❌ Not yet requested |
| 9 | `GET /api/import-seed?mode=apply` called with admin token | ❌ Not yet |
| 10 | Structured apply report reviewed — `created`, `skipped`, `ok: true` confirmed | ❌ Not yet |
| 11 | Admin Review queue checked — all new seeds visible in `review_state='review'` | ❌ Not yet |
| 12 | Admin moderation of new seeds — approve or keep in review as appropriate | ❌ Not yet |

**Any step failure halts the sequence.** Do not advance to apply after a dry-run failure.
Do not skip the dry-run step.

---

## 7. Future Path

| Batch | Type | Scope | Gate |
|-------|------|-------|------|
| **D-63** | Human research + docs | Source research execution — researcher finds, tests, and records real URLs for all 18 D-61 evidence slots (+ 5 pressure slots); results entered into D-61 worksheet or a companion research doc; no repo file edits to seed data | Human URL research |
| **D-64** | Docs-only | Final seed JSON pack — all TODO_FIND_SOURCE resolved; evidence_body text finalized; readiness gates checked; `data/seed_claims_v2.json` created or updated; still no import | D-63 complete |
| **D-65** | Admin action (gated) | Dry-run import plan — call `GET /api/import-seed?mode=dry-run` and `GET /api/import-truths?mode=dry-run`; review structured report; confirm counts; requires explicit per-session approval to call any import route | D-64 + explicit session approval |
| **D-66** | Admin action (gated) | Production apply — call `?mode=apply`; immediately moderate all new `review_state='review'` content in admin Review queue; requires separate explicit per-session D1/write approval | D-65 dry-run reviewed + explicit session approval |

---

## 8. Safety

| Rule | Status |
|------|--------|
| No D1 writes in D-62 | ✅ Confirmed |
| No seed file edits | ✅ Confirmed |
| No data imported | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No URLs fabricated | ✅ Confirmed — all source_url references remain SOURCE_NEEDED/TODO |
| No frontend changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No production mutations | ✅ Confirmed |

---

## D-62 Completion Record

| Item | Status |
|------|--------|
| Hard blocker list defined (HB-1 through HB-10) | ✅ |
| Current gate status: BLOCKED on HB-1 through HB-8 | ✅ |
| 11-claim readiness checklist with per-slot status | ✅ |
| Truth readiness checklist (12 truths + 2 extras) | ✅ |
| Draft-to-final JSON conversion rules (10 rules) | ✅ |
| Pre-import dry-run gate (12-step sequence) | ✅ |
| Future path D-63 → D-66 defined | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No URLs inserted | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
