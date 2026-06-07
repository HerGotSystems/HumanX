# D-85A: Public Demo Claims Audit

Date: 2026-06-07
Step: D-85A — read-only audit of 17 older public claims outside the 5 editorial launch seeds
Type: Read-only. Docs-only commit to main.
No moderation actions. No POST calls. No D1. No Wrangler.

---

## 1. Purpose

D-84M revealed that `GET /api/claims` returns 22 public claims — 5 editorial launch seeds
plus 17 older pre-D-84 claims. D-84's scope was the 21-item non-seed review queue. This
audit covers the 17 additional public claims that were outside D-84 scope, identifies
their origin, and produces a recommended cleanup plan.

---

## 2. Preflight Verification

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| git HEAD | 29b462d | 29b462d | ✅ |
| Working tree | clean | clean | ✅ |
| Total public claims | 22 | 22 | ✅ |
| Review queue total | 21 | 21 | ✅ |
| Review queue: rejected | 19 | 19 | ✅ |
| Review queue: review | 2 | 2 | ✅ |
| None of the 17 in review queue | — | confirmed (all inReviewQueue: false) | ✅ |

**Important:** None of the 17 older claims appear in `GET /api/review`. They are
public with `report_count=0`, so the review queue endpoint does not surface them. They
have never been moderated or reported — they were simply inserted as public at creation.

---

## 3. Editorial Launch Seed Verification

All 5 intended public claims confirmed present and untouched:

| seed_id | Claim (truncated) | status | statusLocked |
|---------|-------------------|--------|:---:|
| clm_seed_8e095b6f6d30 | The Holocaust resulted in the murder of approximately six million Jews… | Strongly Supported | false |
| clm_seed_55e17c22e13e | Large population studies and systematic reviews have not found evidence… | Strongly Supported | **true** (A1 lock) |
| clm_seed_c4e0335e7aae | Rising CO2 levels from human activity are the primary driver… | Strongly Supported | false |
| clm_seed_8ad9ff121579 | Online platform recommendation systems can use engagement signals… | Plausible | false |
| clm_seed_7fb1c24747c2 | Sleep deprivation significantly impairs cognitive performance… | Strongly Supported | false |

All 5 confirmed ✅. A1 status lock intact.

---

## 4. The 17 Older Public Claims — Full Audit

### Origin Classification

Three distinct origin groups are present:

| Group | Handle | ID pattern | Origin |
|-------|--------|------------|--------|
| **A** — Original demo seed pack | `humanx-seed` | `clm_seed_*` (short 12-char suffix) | Inserted by `GET /api/seed` or `GET /api/import-seed` during early development. These are the 4 original demo claims documented in D-54. |
| **B** — Early HX seed rows | `anon-o_seed` | `HX-000001` / `HX-000002` / `HX-000003` | Sequential IDs suggest a very early seed or migration script; the pattern predates the `makeId()` UUIDv4 scheme. Handle `anon-o_seed` is not a real user. |
| **C** — Test-account submissions | `anon-xksavy` / `anon-73d9y2` / `anon-ek3562` | `clm_*` standard UUIDs | Submitted via the claim form by development/test accounts. Inserted as `review_state='public'` before D-59 changed `importSeedData` to use `review_state='review'`. |

---

### Group A — Original Demo Seed Pack (4 claims, handle: `humanx-seed`)

These are the 4 original `importSeedData` claims documented in D-54 as "demo-only" or
"add-sources" candidates. They were inserted before D-59 added the `review_state='review'`
guard. Classified in D-54: flat earth and perpetual motion → `demo-only`;
moon landing and dream prediction → `add-sources` (launch-candidate after URLs added).

| # | id | Claim | status | evidenceScore | duplicateOf | D-54 classification |
|---|-----|-------|--------|:---:|:---:|:---:|
| 10 | `clm_seed_0f5608464fb5` | The Earth is flat | Plausible | 44 | HX-000001 | demo-only |
| 11 | `clm_seed_f5699c8aa3a4` | Humans landed on the Moon | Strongly Supported | 76 | HX-000002 | add-sources |
| 12 | `clm_seed_f4d482242f5f` | A dream predicted my future | Untestable | 24 | HX-000003 | demo-only |
| 13 | `clm_seed_8ce1875d322b` | Perpetual motion machines can produce free energy forever | Reality Collapse | 12 | null | demo-only |

**Notes:**
- Items 10–12 have `duplicateOf` pointing to the HX-000001/2/3 records — meaning
  `mark-duplicate` was called at some point (D-24E route), flagging these as duplicates
  of the older HX-000* originals. Despite having `duplicateOf` set, both the source and
  target are still `review_state='public'` — they appear to both be visible.
- Item 13 (perpetual motion) has `status=Reality Collapse` — the only claim in the
  system with this status. Scoring artefact or early experimental label.
- `clm_seed_f5699c8aa3a4` ("Humans landed on the Moon") has `status=Strongly Supported`
  and `evidenceScore=76` — the scoring is plausible given D-54's note that moon landing
  was a `launch-candidate after URLs added`. It has been scored by attached evidence.
  However its handle is `humanx-seed` and it is a demo import, not an editorial launch.

---

### Group B — Early HX Seed Rows (3 claims, handle: `anon-o_seed`, ids: HX-000001/2/3)

Sequential integer-style IDs predate the current `makeId()` scheme. These appear to be
the earliest data in the system, likely from an initial manual seed or migration script.

| # | id | Claim | status | evidenceScore | duplicateOf | Notes |
|---|-----|-------|--------|:---:|:---:|:---:|
| 15 | `HX-000001` | The Earth is flat | **Strongly Supported** | 68 | null | status=Strongly Supported on a false claim is a critical scoring artifact — evidence attached without moderation |
| 16 | `HX-000002` | Humans landed on the Moon | **Weak Evidence** | 5 | null | status=Weak Evidence on a well-evidenced historical fact is a scoring artifact |
| 17 | `HX-000003` | A dream predicted my future | Untestable | 85 | null | evidenceScore=85 with status=Untestable — inconsistent; high score on an untestable claim |

**Critical flags:**
- `HX-000001` "The Earth is flat" has `status=Strongly Supported` — this is the most
  concerning item in the entire audit. A flat-earth claim labelled "Strongly Supported"
  is misleading and directly undermines platform credibility if any user sees it.
- `HX-000002` "Humans landed on the Moon" has `status=Weak Evidence` and
  `evidenceScore=5` — the opposite problem: a well-established historical fact labelled
  as weakly evidenced.
- Both scoring states appear to result from unmoderated or adversarial evidence being
  attached to these old seed claims before the evidence moderation stack (D-42B+) was
  in place.
- Handle `anon-o_seed` is not a real user account.

---

### Group C — Test-Account Submissions (10 claims, various handles)

Submitted via the claim form by development/test accounts during platform development.
All inserted as `review_state='public'` because the D-59 `review_state='review'` guard
had not yet been applied to regular claim submission (which uses `saveClaim`, not
`importSeedData` — `saveClaim` has always inserted as `review_state='review'` for new
claims; these predate that or were inserted differently).

| # | id | Claim | handle | status | evidenceScore | reportCount | Notes |
|---|-----|-------|--------|--------|:---:|:---:|:---:|
| 1 | `clm_97c7f7a525c54276bc` | You can be anything you want | anon-xksavy | Plausible | 24 | 0 | Motivational proverb; testable in principle |
| 2 | `clm_79f69a5075df45f181` | HOWGH test | anon-73d9y2 | Plausible | 48 | 0 | **Explicit test submission** — "HOWGH test"; 17 contradictions |
| 3 | `clm_3bc837c5d8a24cf9b5` | People are basically good | anon-xksavy | Plausible | 38 | 0 | Philosophical/empirical claim; debatable |
| 4 | `clm_4176a17d0a754b78aa` | Science has proven it | anon-xksavy | Plausible | 46 | 0 | Incomplete, not a claim — a fragment |
| 5 | `clm_6032e1bc88ff443587` | god exist | anon-xksavy | Untestable | 24 | 0 | Belief claim; grammatically informal; Untestable classification is correct |
| 6 | `clm_cdba3db932b84f279a` | People are stupid | anon-xksavy | **Proven** | 85 | 0 | **Scoring artifact** — status=Proven on insult/opinion claim |
| 7 | `clm_37d2e262976f46d2b4` | Money is evil | anon-xksavy | Weak Evidence | 8 | 0 | `duplicateOf: clm_5624bd2c8d9246598a`; older duplicate copy |
| 8 | `clm_5624bd2c8d9246598a` | Money is evil | anon-xksavy | Plausible | 64 | 0 | Source/original of the duplicate pair |
| 9 | `clm_6f14973b90ed48c3bb` | Everything happens for a reason | anon-xksavy | Plausible | 59 | 0 | Deterministic belief claim; debatable |
| 14 | `clm_8ad342e93c594f1082` | People are stupid - TEST | anon-ek3562 | Plausible | 42 | 0 | **Explicit test marker** in claim text |

**Key flags:**
- `clm_79f69a5075df45f181` ("HOWGH test") — explicit test submission, must be removed
- `clm_8ad342e93c594f1082` ("People are stupid - TEST") — explicit TEST marker in claim
  text; clearly a test submission; different handle (`anon-ek3562`)
- `clm_4176a17d0a754b78aa` ("Science has proven it") — not a claim, an incomplete
  fragment with no referent
- `clm_cdba3db932b84f279a` ("People are stupid") — `status=Proven` with `evidenceScore=85`
  is a scoring artifact on an opinion/insult
- `clm_37d2e262976f46d2b4` ("Money is evil") — `duplicateOf` set to the other "Money is evil";
  both are public; the marked duplicate should probably be return-to-review or rejected

---

## 5. Classification Table

### Group A — Original Demo Seeds (handle: `humanx-seed`)

| # | id | Claim | Classification | Priority | Reason |
|---|-----|-------|---------------|:---:|------|
| 10 | clm_seed_0f5608464fb5 | The Earth is flat | **return to review** | Medium | demo-only; has `duplicateOf` HX-000001; duplicate of Group B entry |
| 11 | clm_seed_f5699c8aa3a4 | Humans landed on the Moon | **return to review** | Low | demo-only import; has `duplicateOf` HX-000002; duplicate of Group B entry; scoring is plausible but not editorially reviewed |
| 12 | clm_seed_f4d482242f5f | A dream predicted my future | **return to review** | Low | demo-only import; has `duplicateOf` HX-000003 |
| 13 | clm_seed_8ce1875d322b | Perpetual motion machines… | **return to review** | Low | demo-only; `status=Reality Collapse` is an artefact label |

### Group B — Early HX Seed Rows (handle: `anon-o_seed`)

| # | id | Claim | Classification | Priority | Reason |
|---|-----|-------|---------------|:---:|------|
| 15 | HX-000001 | The Earth is flat | **reject candidate — URGENT** | 🔴 HIGH | `status=Strongly Supported` on a false claim is a critical credibility risk; scoring artifact from unmoderated evidence; no real user handle |
| 16 | HX-000002 | Humans landed on the Moon | **needs scoring/status fix** | High | `status=Weak Evidence` / `evidenceScore=5` on a well-evidenced historical fact; inversely misleading; handle `anon-o_seed` is not real; however the claim text is correct — reject or fix |
| 17 | HX-000003 | A dream predicted my future | **return to review** | Medium | `evidenceScore=85` with `status=Untestable` is inconsistent; no real user handle |

### Group C — Test-Account Submissions (various handles)

| # | id | Claim | Classification | Priority | Reason |
|---|-----|-------|---------------|:---:|------|
| 1 | clm_97c7f7a525c54276bc | You can be anything you want | **return to review** | Low | Proverb; no obvious harm; test account; not editorially reviewed |
| 2 | clm_79f69a5075df45f181 | HOWGH test | **reject candidate** | 🔴 HIGH | Explicit test submission text; 17 contradictions; meaningless |
| 3 | clm_3bc837c5d8a24cf9b5 | People are basically good | **return to review** | Low | Philosophical claim; defensible but not editorially reviewed |
| 4 | clm_4176a17d0a754b78aa | Science has proven it | **reject candidate** | High | Not a claim — incomplete fragment with no referent |
| 5 | clm_6032e1bc88ff443587 | god exist | **return to review** | Low | Belief claim; informally written; Untestable classification is correct; not clearly harmful |
| 6 | clm_cdba3db932b84f279a | People are stupid | **reject candidate** | High | `status=Proven` scoring artifact; insult/opinion; no factual content |
| 7 | clm_37d2e262976f46d2b4 | Money is evil (duplicate) | **return to review** | Medium | Has `duplicateOf` set; older duplicate copy; both copies currently public |
| 8 | clm_5624bd2c8d9246598a | Money is evil (source) | **return to review** | Low | Cultural claim; debatable but not obviously harmful; not editorially reviewed |
| 9 | clm_6f14973b90ed48c3bb | Everything happens for a reason | **return to review** | Low | Deterministic belief; debatable; not editorially reviewed |
| 14 | clm_8ad342e93c594f1082 | People are stupid - TEST | **reject candidate** | 🔴 HIGH | Explicit "- TEST" marker in claim text; test account (`anon-ek3562`) |

---

## 6. Priority Summary

### 🔴 URGENT / HIGH — Reject or fix immediately

| id | Claim | Issue |
|----|-------|-------|
| `HX-000001` | The Earth is flat | **`status=Strongly Supported`** — critical credibility risk |
| `clm_79f69a5075df45f181` | HOWGH test | Explicit test text |
| `clm_8ad342e93c594f1082` | People are stupid - TEST | Explicit TEST marker |
| `HX-000002` | Humans landed on the Moon | `status=Weak Evidence` / `evidenceScore=5` — inversely misleading |
| `clm_4176a17d0a754b78aa` | Science has proven it | Not a claim — incomplete fragment |
| `clm_cdba3db932b84f279a` | People are stupid | `status=Proven` scoring artifact on insult |

### Medium — Return to review (no urgency, not harmful)

| id | Claim | Notes |
|----|-------|-------|
| `HX-000003` | A dream predicted my future | Inconsistent scores |
| `clm_37d2e262976f46d2b4` | Money is evil (duplicate copy) | duplicateOf set |
| `clm_seed_0f5608464fb5` | The Earth is flat (demo) | Duplicate of HX-000001 |

### Low — Return to review (housekeeping)

`clm_seed_f5699c8aa3a4`, `clm_seed_f4d482242f5f`, `clm_seed_8ce1875d322b`,
`clm_97c7f7a525c54276bc`, `clm_3bc837c5d8a24cf9b5`, `clm_6032e1bc88ff443587`,
`clm_5624bd2c8d9246598a`, `clm_6f14973b90ed48c3bb`

---

## 7. Recommended D-85 Cleanup Plan

All moderation actions require explicit per-item approval. No bulk moderation.
Suggested sequence — most urgent first:

| Step | id | Claim | Proposed action | Priority |
|------|----|-------|----------------|:---:|
| D-85B | `HX-000001` | The Earth is flat | **reject** — status=Strongly Supported is platform-credibility critical | 🔴 |
| D-85C | `clm_79f69a5075df45f181` | HOWGH test | **reject** — explicit test submission | 🔴 |
| D-85D | `clm_8ad342e93c594f1082` | People are stupid - TEST | **reject** — explicit TEST marker | 🔴 |
| D-85E | `HX-000002` | Humans landed on the Moon | **reject** — status=Weak Evidence/score=5 is misleading; no real user; demo data | High |
| D-85F | `clm_4176a17d0a754b78aa` | Science has proven it | **reject** — incomplete fragment, not a claim | High |
| D-85G | `clm_cdba3db932b84f279a` | People are stupid | **reject** — Proven scoring artifact on insult | High |
| D-85H | `HX-000003` | A dream predicted my future | **return to review** — inconsistent scores | Medium |
| D-85I | `clm_37d2e262976f46d2b4` | Money is evil (duplicate) | **return to review** — duplicateOf already set | Medium |
| D-85J | `clm_seed_0f5608464fb5` | The Earth is flat (demo) | **return to review** — duplicate of HX-000001 | Medium |
| D-85K | `clm_seed_f5699c8aa3a4` | Humans landed on the Moon (demo) | **return to review** | Low |
| D-85L | `clm_seed_f4d482242f5f` | A dream predicted my future (demo) | **return to review** | Low |
| D-85M | `clm_seed_8ce1875d322b` | Perpetual motion machines… | **return to review** | Low |
| D-85N | `clm_97c7f7a525c54276bc` | You can be anything you want | **return to review** | Low |
| D-85O | `clm_3bc837c5d8a24cf9b5` | People are basically good | **return to review** | Low |
| D-85P | `clm_6032e1bc88ff443587` | god exist | **return to review** | Low |
| D-85Q | `clm_5624bd2c8d9246598a` | Money is evil (source) | **return to review** | Low |
| D-85R | `clm_6f14973b90ed48c3bb` | Everything happens for a reason | **return to review** | Low |

**Recommended next single action: D-85B — reject `HX-000001` ("The Earth is flat").**

Rationale: `status=Strongly Supported` on a demonstrably false claim is the highest-
priority credibility risk in the system. If any user visits the public claims feed, this
is the first item that undermines the platform's purpose.

Requires explicit approval:
> `EXPLICIT USER APPROVAL: The user approves D-85B only: reject HX-000001 — "The Earth is flat".`

---

## 8. Non-Mutation Statement

D-85A made no moderation decisions.
No POST call was made.
No `review_state` was changed.
No D1 command was run.
No Wrangler was run.
Admin token used only for `GET /api/review` (read-only). Not printed, logged, or committed.
Temp files deleted after reading.

---

## D-85A Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at 29b462d | ✅ |
| Working tree clean | ✅ |
| GET /api/claims — 22 claims retrieved and analysed | ✅ |
| GET /api/review — queue state confirmed | ✅ |
| 5 editorial launch seed claims verified untouched | ✅ |
| 17 older public claims fully audited | ✅ |
| 3 origin groups identified (demo-seed, HX-seed, test-account) | ✅ |
| All 17 classified with priority | ✅ |
| D-85 cleanup plan written | ✅ |
| No POST call made | ✅ |
| No review_state changed | ✅ |
| No D1 command run | ✅ |
| No Wrangler run | ✅ |
| Admin token not printed, logged, or committed | ✅ |
| Temp files deleted | ✅ |
| docs/D85A_PUBLIC_DEMO_CLAIMS_AUDIT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Static checks 127/24/39 confirmed | ✅ |
| Docs committed to main | ✅ |
