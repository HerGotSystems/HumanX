# D-83A: Scoring / Status Consistency Audit

Date: 2026-06-07
Step: D-83A — read-only code audit of recalcClaimScore behavior against seed editorial intent
Type: Docs-only audit. Direct main.
No status changed. No route writes. No D1. No Wrangler. No production mutations.

---

## 1. Purpose and Scope

D-81 flagged that `recalcClaimScore` overrides the editorially-assigned `status` field
on seed claims when evidence is promoted. Four of five seed claims exhibited status drift.
The most significant case is launch-A1 (MMR/autism): the seed editorial intent from D-76C
was `Strongly Supported` (to avoid overclaiming on a politically sensitive claim), but
the computed status is `Proven`.

D-83A audits:
- Where and how `recalcClaimScore` computes status
- The exact scoring thresholds
- Whether any editorial override mechanism exists
- Why each seed claim's status drifted as observed
- Architectural options for addressing the A1 divergence
- A concrete recommendation

**Scope:** Read-only code audit and docs. No code changes, no data changes.

---

## 2. Non-Mutation Statement

| Rule | Status |
|------|--------|
| No `status` changed on any claim | ✅ Confirmed |
| No route write called | ✅ Confirmed |
| No D1 direct commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| Static checks passed before writing | ✅ 119/24/39 |

---

## 3. Current Observed Status Drift (from D-81)

| seed_id | Imported status | Computed (public) status | Direction | Risk |
|---------|----------------|--------------------------|-----------|------|
| launch-B5 | Proven | Strongly Supported | ↓ softer | Low — "Strongly Supported" is accurate and defensible |
| launch-A1 | Strongly Supported | Proven | ↑ stronger | **Medium** — intentionally conservative label overridden |
| launch-A4 | Proven | Strongly Supported | ↓ softer | Low — "Strongly Supported" is accurate for consensus science |
| launch-C1 | Plausible | Plausible | — | None — no drift |
| launch-D2 | Proven | Strongly Supported | ↓ softer | Low — "Strongly Supported" is accurate |

**Primary concern: launch-A1.** D-76C explicitly chose "Strongly Supported" over "Proven"
because the claim text is a careful hedge ("have not found evidence that the MMR vaccine
causes autism") and the claim subject has ongoing public controversy. The computed "Proven"
is not scientifically inaccurate, but it is stronger than intended.

---

## 4. Code Audit

### 4.1 — Where `recalcClaimScore` is defined

**File:** `src/claim-scoring.js` (46 lines)
**Exported function:** `recalcClaimScore(env, claimId)`

### 4.2 — Where it is triggered

| Call site | File | Trigger condition |
|-----------|------|------------------|
| `createClaim` | `src/worker.js` line ~81 | When `body.initialEvidence` is provided with a new claim |
| `addEvidence` | `src/worker.js` line ~82 | After every evidence item is added |
| `addPressure` | `src/worker.js` line ~83 | After every pressure point is added |
| `reportTarget` | `src/worker.js` line ~85 | When evidence reaches report_count ≥ 2 |
| `reviewDecision` (evidence) | `src/worker.js` line ~87 | **After evidence `review_state` is set** — including on promotion to `'public'` |
| `linkEvidenceToClaim` | `src/evidence-reuse.js` line 48 | After evidence is linked to an additional claim |

**The trigger relevant to seed promotion:** `reviewDecision` for `targetType: 'evidence'`
calls `recalcClaimScore(env, row.claim_id)` immediately after updating the evidence
`review_state`. This is why the status changed during D-80C through D-80G — every
evidence promotion call re-ran the scoring algorithm and overwrote `claims.status`.

### 4.3 — Full scoring algorithm (annotated)

**Source: `src/claim-scoring.js`**

```
Step 1 — Gather evidence
  SELECT quality, stance FROM evidence
  WHERE claim_id=? AND COALESCE(review_state,'public')='public'
  (also from evidence_claim_links for reused evidence)

Step 2 — Separate support vs. pressure-stance evidence
  supportRows = rows where stance != 'pressure'
  pressureEvidenceRows = rows where stance == 'pressure'

Step 3 — Compute average quality score
  qualities = supportRows.map(qualityScore)
  avg = Math.round(sum(qualities) / count)

Step 4 — qualityScore mapping (discrete tiers)
  'repeatable' → 85
  'documented' → 68
  'media'      → 38
  'testimony'  → 24
  'vibes'      → 8
  (unknown)    → 20

Step 5 — Compute pressure severity
  pressureSeverity = sum(pressure_points.severity) + pressureEvidenceRows.length

Step 6 — Read testability from claims table
  testability = Number(claim.testability || 50)
  NOTE: All seed claims were inserted with testability=null → defaults to 50

Step 7 — Compute survivability
  survivability = clamp(
    round(avg - pressureSeverity * 1.8 + testability * 0.22),
    0, 100
  )

Step 8 — verdict() function determines status
  if type.includes('Religious') || testability < 15 → 'Untestable'
  if avg >= 80 AND survivability >= 75             → 'Proven'
  if avg >= 65 AND survivability >= 55             → 'Strongly Supported'
  if avg <= 12 AND testability >= 80 AND cont >= 5 → 'Reality Collapse'
  if avg <= 22                                     → 'Weak Evidence'
  else                                             → 'Plausible'

Step 9 — Unconditional DB write
  UPDATE claims SET evidence_score=?, survivability=?, contradictions=?, status=?, updated_at=?
  WHERE id=?
```

**Critical observation: `recalcClaimScore` always overwrites `claims.status`.**
There is no editorial override, no `status_locked` flag, no `editorial_status` field,
no guard that preserves a manually-set status. Every call to `recalcClaimScore` —
from any trigger — unconditionally writes the algorithmically derived status into the
`claims.status` column.

### 4.4 — `verdict()` thresholds (complete)

```
Proven:            avg >= 80  AND  survivability >= 75
Strongly Supported: avg >= 65  AND  survivability >= 55
Reality Collapse:  avg <= 12  AND  testability >= 80  AND  contradictions >= 5
Weak Evidence:     avg <= 22
Plausible:         all other cases
Untestable:        type contains 'Religious'  OR  testability < 15
```

---

## 5. Per-Claim Score Analysis

All seed claims: `testability = Number(null || 50) = 50` (seed inserts `testability: null`)
All seed pressure points: `severity = 5` (from seed-data.js)

### 5.1 — launch-B5 (Holocaust)

| Variable | Value | Source |
|----------|-------|--------|
| Evidence qualities | documented (68), documented (68) | seed-data.js |
| avg | 68 | (68+68)/2 = 68 |
| pressureSeverity | 5 | 1 pressure × severity=5 |
| testability | 50 | null → 50 |
| survivability | 70 | round(68 − 9 + 11) = 70 |
| Proven gate | MISS | avg 68 < 80 |
| SS gate | PASS | avg 68 ≥ 65, surv 70 ≥ 55 |
| Computed status | **Strongly Supported** | |
| Stored/imported | Proven | |

**Assessment:** The Wannsee Protocol and USHMM evidence are both tagged `documented`
(institutional articles), not `repeatable` (peer-reviewed reproducible studies).
The `documented` quality tier (68) cannot reach the avg ≥ 80 threshold for "Proven"
regardless of survivability. For a `Historical/Physical` claim where repeatability
is not applicable, this is an artifact of the quality tier definitions — the evidence
is strong institutional documentation, but the `repeatable` tier was designed for
laboratory studies. The computed "Strongly Supported" is defensible and arguably
accurate. **Low risk. Acceptable. No correction urgently needed.**

### 5.2 — launch-A1 (MMR/autism) — PRIMARY CONCERN

| Variable | Value | Source |
|----------|-------|--------|
| Evidence qualities | repeatable (85), repeatable (85) | seed-data.js |
| avg | 85 | (85+85)/2 = 85 |
| pressureSeverity | 5 | 1 pressure × severity=5 |
| testability | 50 | null → 50 |
| survivability | 87 | round(85 − 9 + 11) = 87 |
| Proven gate | PASS | avg 85 ≥ 80 AND surv 87 ≥ 75 |
| Computed status | **Proven** | |
| Stored/imported | Strongly Supported | |

**Why it drifted:** Both evidence items are Cochrane systematic review (`quality: 'repeatable'`)
and large NEJM cohort study (`quality: 'repeatable'`). Two top-tier evidence items produce
avg=85, which clears the `avg >= 80` threshold for "Proven". The high-severity pressure
point (severity=5) reduces survivability to 87, but 87 still clears the survivability ≥ 75
gate. The algorithm correctly identifies the evidence as high-quality.

**The tension:** D-76C deliberately chose "Strongly Supported" because the claim text is a
careful hedge ("have not found evidence that the MMR vaccine causes autism") and the
subject carries ongoing political controversy. The intent was editorial caution, not
a judgment that the evidence quality is lower than top-tier. The evidence IS top-tier;
the conservatism was applied at the claim label level.

**Is "Proven" scientifically wrong?** No. The Cochrane review and the Madsen NEJM cohort
study are among the strongest evidence types in medicine. The scientific consensus is
strongly against the vaccines-autism hypothesis. "Proven" is not inaccurate.

**Is "Proven" a policy problem?** Possibly. A "Proven" label on a politically contested
claim may attract more friction than "Strongly Supported". D-76C's reasoning was valid
from a communications standpoint. **Medium risk. Policy decision needed.**

### 5.3 — launch-A4 (CO2/climate)

| Variable | Value | Source |
|----------|-------|--------|
| Evidence qualities | documented (68), documented (68) | seed-data.js |
| avg | 68 | (68+68)/2 = 68 |
| pressureSeverity | 5 | 1 pressure × severity=5 |
| testability | 50 | null → 50 |
| survivability | 70 | round(68 − 9 + 11) = 70 |
| Proven gate | MISS | avg 68 < 80 |
| Computed status | **Strongly Supported** | |
| Stored/imported | Proven | |

**Assessment:** IPCC AR6 WG1 SPM and NASA are both tagged `documented` (institutional
reference pages), not `repeatable` (primary research studies). Like B5, the `documented`
tier cannot reach avg ≥ 80 for "Proven". The computed "Strongly Supported" for the
consensus climate science position is defensible. If higher status is desired, the
evidence quality tags would need to be `repeatable` (more appropriate for synthesized
scientific reports backed by primary studies), which is an arguable judgment call.
**Low risk. Acceptable. No correction urgently needed.**

### 5.4 — launch-C1 (platform recommendation systems)

| Variable | Value | Source |
|----------|-------|--------|
| Evidence qualities | repeatable (85), testimony (24) | seed-data.js |
| avg | 55 | round((85+24)/2) = 55 |
| pressureSeverity | 5 | 1 pressure × severity=5 |
| testability | 50 | null → 50 |
| survivability | 57 | round(55 − 9 + 11) = 57 |
| Proven gate | MISS | avg 55 < 80 |
| SS gate | MISS | avg 55 < 65 |
| Computed status | **Plausible** | |
| Stored/imported | Plausible | |

**Assessment:** The YouTube VP Engineering blog post is tagged `testimony` (24), which
pulls the average far below the "Strongly Supported" threshold. This is intentional
and correct — a first-party platform statement is testimony-quality, not a
peer-reviewed study. The Vosoughi Science paper is correctly `repeatable` (85), but
one study plus one testimony cannot clear the avg ≥ 65 threshold. The "Plausible" status
exactly matches the editorial intent from D-76C. **No drift. No issue.**

### 5.5 — launch-D2 (sleep deprivation)

| Variable | Value | Source |
|----------|-------|--------|
| Evidence qualities | repeatable (85), documented (68) | seed-data.js |
| avg | 77 | round((85+68)/2) = 77 |
| pressureSeverity | 0 | no pressure points in seed |
| testability | 50 | null → 50 |
| survivability | 88 | round(77 − 0 + 11) = 88 |
| Proven gate | MISS | avg 77 < 80 |
| SS gate | PASS | avg 77 ≥ 65, surv 88 ≥ 55 |
| Computed status | **Strongly Supported** | |
| Stored/imported | Proven | |

**Assessment:** The Van Dongen SLEEP 2003 study (`repeatable`) and CDC About Sleep
(`documented`) produce avg=77, which falls just below the avg ≥ 80 threshold for
"Proven". The 3-point gap is entirely due to the CDC article being `documented` rather
than `repeatable`. If the CDC page were tagged `repeatable`, avg would be 85 and the
claim would compute as "Proven". The "Strongly Supported" result for sleep deprivation
research is conservative but defensible. **Low risk. Acceptable.**

---

## 6. Architectural Options

No implementation in D-83A. Options documented for D-83B policy decision.

---

### Option 1 — Accept computed status as canonical

Accept that `recalcClaimScore` determines all public `status` values. The seed-imported
status is treated as advisory only. "Strongly Supported" for B5/A4/D2 and "Proven" for A1
become the de-facto labels.

**Pros:** Consistent. No new architecture. Consistent with user-submitted claims behavior.
**Cons:** Ignores editorial intent. A1 "Proven" is stronger than D-76C intended.
**Work required:** None (this is the current state). Update docs only.

---

### Option 2 — Adjust `verdict()` thresholds only

Raise the `avg >= 80` threshold for "Proven" to a higher value (e.g., `avg >= 85`)
or raise the `survivability >= 75` threshold (e.g., `>= 80`).

**Effect on seed claims:**
- A1 (avg=85): raising threshold to `avg >= 87` would make A1 "Strongly Supported"
- D2 (avg=77): no change needed, already < 80
- B5/A4 (avg=68): no change, already far below threshold

**Pros:** Systemic fix. No new schema.
**Cons:** Changes behavior for all claims globally, not just seed. Raises the bar for
"Proven" across the entire system. Could demote user-submitted claims that reached
"Proven" through legitimate scoring. Would need test coverage update.
**Work required:** Branch + PR to `src/claim-scoring.js`. Update static tests.
`recalcClaimScore` re-run on affected claims or wait for next evidence change.

---

### Option 3 — Add `editorial_status` / `reviewed_status` column (separate from computed)

Add a new `editorial_status` column to the `claims` table. The seed importer (and admin
review decision flow) can set `editorial_status`. The public-facing `status` shown to
users pulls `COALESCE(editorial_status, status)` — i.e., editorial label takes precedence
if set, otherwise falls through to computed.

**Pros:** Cleanest separation of editorial intent and algorithmic computation. Does not
change scoring behavior. Allows per-claim override without altering thresholds.
**Cons:** Schema migration on D1 (new column). Frontend and API changes to read the
coalesced value. Importer update to set `editorial_status`. Most work of all options.
**Work required:** D1 schema migration, importer update, Worker/API update, frontend
update. Branch + PR. Explicit write approval for D1 migration.

---

### Option 4 — Add `status_locked` boolean flag

Add a `status_locked` column. When true, `recalcClaimScore` skips the
`UPDATE claims SET status=?` portion and only updates `evidence_score`, `survivability`,
`contradictions`. Admin (or seed import) sets `status_locked = true` on claims with
deliberate editorial status.

**Pros:** Minimal schema change (one boolean column). Preserves existing status field
semantics. `recalcClaimScore` behavior documented and predictable.
**Cons:** Schema migration on D1. Must update `recalcClaimScore` logic. Adds complexity
to scoring function. If evidence quality changes significantly, a locked status may
become misleading.
**Work required:** D1 schema migration, `claim-scoring.js` update, importer update.
Branch + PR. Explicit write approval.

---

### Option 5 — One-off correction for A1 only

Accept all status drift except A1. Make a targeted correction for A1 only via the
admin `POST /api/review/decision` route (which can set `review_state` but not `status`
directly) — or via a direct D1 write (`UPDATE claims SET status='Strongly Supported'
WHERE id='clm_seed_55e17c22e13e'`).

**Limitation:** Any future `recalcClaimScore` trigger on A1 (e.g., a user adds evidence
or a report is filed) would immediately overwrite the correction back to "Proven".
This fix is temporary unless combined with a locking mechanism.

**Pros:** Minimal immediate work. Targeted.
**Cons:** Not durable. The correction would be silently reversed by the next
`recalcClaimScore` call on that claim. Does not address systemic architecture gap.
**Work required:** D1 write (requires explicit write approval). Or D1 command during
a future session.

---

## 7. Recommendation

**Honest assessment:**

The status drift is caused by a design gap: `recalcClaimScore` was designed for
user-submitted claims where the seeded status is always `'Plausible'` (the new-claim
default, `src/worker.js` createClaim INSERT). The algorithm was never designed to
respect or preserve an editorially-assigned import status. This is not a bug in the
scoring algorithm — it is working as designed. The gap is that the system has no
concept of an editorial label separate from a computed label.

**For the four "Strongly Supported" drift cases (B5, A4, D2):** These are low-risk.
"Strongly Supported" is accurate and defensible for all three. Accepting Option 1
(computed as canonical) is reasonable for these. No correction needed.

**For launch-A1 (MMR/autism):** This is the only case requiring a policy decision.
"Proven" is not scientifically wrong, but it is stronger than D-76C intended for
a politically sensitive claim. The options are:

1. **Accept "Proven"** — simplest. Update the D-76C rationale to acknowledge that
   the evidence quality is "Proven"-tier by the algorithm, and that the editorial
   hedge was in the claim text (which remains exactly as written), not the status label.

2. **Option 4 (status_lock)** — add a `status_locked` flag to `recalcClaimScore`.
   This is the recommended architectural path if durable editorial control is desired.
   Requires a PR and D1 migration but is the cleanest long-term solution.

3. **Do not use Option 5 (one-off D1 write)** — not durable. Would silently revert
   on next evidence activity.

**Recommended sequence:**
- D-83B: Policy decision — accept "Proven" for A1 OR commit to Option 4 (status_lock)
- D-83C: If Option 4 chosen — branch + PR for `status_locked` column + importer update
  + `claim-scoring.js` guard + static test coverage

**Do not rush a write.** The current "Proven" label is not a correctness emergency.
The claim text itself remains carefully hedged. A poorly designed correction could
introduce a worse problem than leaving "Proven" as-is.

---

## 8. Gate

**D-83A is complete. No status changed. No writes made.**

| Step | Status |
|------|--------|
| D-83A — scoring/status audit | ✅ COMPLETE |
| D-83B — policy decision: accept "Proven" for A1 OR choose architectural option | ⛔ BLOCKED — requires explicit user instruction |
| D-83C — possible implementation/correction, branch + PR required for any code change; explicit write approval for any D1 correction | ⛔ BLOCKED — gated behind D-83B decision |

No correction will be made in D-83A or D-83B without explicit approval.
Any code change requires branch + PR. Any production status correction requires
explicit write approval with the correction method and target stated.

---

## Static Check Results (confirmed before and after writing)

| Check | Result |
|-------|--------|
| Hardening smoke test | 119 passed, 0 failed |
| Belief Engine static check | 24 passed, 0 failed |
| Worker route static check | 39 passed, 0 failed |

---

## D-83A Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at D-81 commit (40034b7) | ✅ |
| `src/claim-scoring.js` read — full algorithm documented | ✅ |
| `src/worker.js` read — all recalcClaimScore trigger sites identified | ✅ |
| `src/seed-data.js` read — actual quality values extracted | ✅ |
| Scoring simulation confirmed against all 5 D-81 observed values | ✅ |
| Per-claim analysis for all 5 seed claims | ✅ |
| Root cause of A1 drift identified and explained | ✅ |
| 5 architectural options documented | ✅ |
| Honest recommendation made | ✅ |
| No status changed | ✅ |
| No write route called | ✅ |
| No D1 direct commands | ✅ |
| No Wrangler | ✅ |
| Static checks 119/24/39 passed | ✅ |
| docs/D83A_SCORING_STATUS_CONSISTENCY_AUDIT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
