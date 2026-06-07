# D-89B: Supporting Object Moderation and Ownership Audit

Date: 2026-06-07
Step: D-89B — supporting object moderation and ownership audit (read-only)
Type: Design/audit document. No code changes. No live calls. No D1 writes. No Wrangler. No POST.
Baseline commit: 27022b9 (post D-89A)

---

## 1. Supporting Object Inventory

| Object | Table | Create route/function | User required? | Rate limited? | Initial state | Public visibility | Affects score/export? | Current delete/retract? | Current review/moderation? |
|--------|-------|----------------------|---------------|--------------|--------------|------------------|----------------------|-----------------------|--------------------------|
| Pressure point | `pressure_points` | `POST /api/pressure` → `addPressure` | Yes (`requireUser`) | 20/hr per IP | N/A — no review_state | **Immediately public on claim detail** | **Yes — affects `recalcClaimScore` directly** | None | None |
| Home test | `home_tests` | `POST /api/tests` → `addHomeTest` | Yes (`requireUser`) | 20/hr per IP | N/A — no review_state | **Immediately public on claim detail** | No — not used in scoring | None | None |
| Analysis result | `analysis_results` | `POST /api/analysis` → `addAnalysisResult` | Yes (`requireUser`) | 20/hr per IP | N/A — no review_state | **Immediately public on claim detail** | No — not in `recalcClaimScore`, but included in RunPack payload | None | None |
| Claim vote | `claim_votes` | `POST /api/claim-vote` → `voteClaim` | Yes (`requireUser`) | 120/hr per user+IP | N/A | Public (aggregated belief_yes/no/uncertainty) | Partial — refreshes belief counts on claim, not part of claim status scoring | Can update vote (no delete) | Row dedup per user_id+claim_id |
| Evidence vote | `evidence_votes` | **No route** | N/A | N/A | N/A | Not accessible | No | N/A | N/A — schema-only |
| Truth vote | `truth_votes` | **No route** | N/A | N/A | N/A | Not accessible | No | N/A | N/A — schema-only |
| Report | `reports` | `POST /api/report` → `reportTarget` | Yes (`requireUser`) | 20/hr per IP | `status='open'` | Not public (admin-only via review queue) | Triggers `review_state='review'` on claims/evidence at 2+ reports | Never closed by user; closed by admin decision | Reports are admin-visible signals |
| Evidence claim link | `evidence_claim_links` | `POST /api/evidence-attach` → `attachEvidenceToClaim` | Yes (`requireUser`) | 20/hr per IP | N/A — no review_state | Visible if linked evidence is public | **Yes — `recalcClaimScore` called immediately on link** | None | None (moderation via evidence row only) |
| RunPack / aip_packet | `aip_packets` | `POST /api/runpack` → `createAipPacket` | None | None | N/A | Returned to caller only | No | N/A | Claim must be `public`; includes unmoderated pressure/tests/analyses |
| Belief snapshot | `belief_snapshots` | `POST /api/belief-snapshots` → `saveBeliefSnapshot` | Yes (`requireUser`) | None noted | N/A — private | **Not public** — per-user only, `requireUser` gate on GET | No | None | N/A — private |

---

## 2. Scope of the Problem

Four objects bypass review and are immediately public when a claim is public:
- **Pressure points** — affect score, visible on claim detail, included in RunPack
- **Home tests** — visible on claim detail, included in RunPack
- **Analysis results** — visible on claim detail, included in RunPack
- **Evidence claim links** — trigger `recalcClaimScore` on insert; visibility depends on linked evidence `review_state`

Two objects are schema-only with no routes: `evidence_votes`, `truth_votes`.

One object (belief snapshots) is private and requires no moderation.

---

## 3. Pressure Points Audit

### 3.1 Schema

From `migrations/0003_full_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS pressure_points (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  body TEXT,
  severity INTEGER DEFAULT 1,
  label TEXT,
  kind TEXT,
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_pressure_points_claim_id ON pressure_points (claim_id);
```

**Absent columns:** No `review_state`, no `report_count`, no `updated_at`.

### 3.2 Creation path (`addPressure`, `src/worker.js` line 83)

```
POST /api/pressure
  → requireUser (header check only)
  → safeRateLimit: pressure:{IP}, 20/hr
  → ensureUser (INSERT OR IGNORE into users)
  → INSERT INTO pressure_points (id, claim_id, user_id, title, body, severity, created_at)
  → recalcClaimScore(env, claimId)   ← IMMEDIATE score impact
  → returns { pressure: {...}, claim: {...} }
```

No review gate. No claim visibility check. A user can add pressure to a claim in any state including non-public claims (there is no guard that `claim.review_state='public'`).

### 3.3 Public visibility

**`GET /api/claims/:id` (`getClaim`, worker.js line 77):**
```sql
SELECT p.*, u.handle FROM pressure_points p
LEFT JOIN users u ON u.id=p.user_id
WHERE p.claim_id=? ORDER BY p.created_at DESC
```
No `review_state` filter. **All pressure points are returned immediately.**

### 3.4 Score impact (`recalcClaimScore`, `src/claim-scoring.js` line 9)

```sql
SELECT severity FROM pressure_points WHERE claim_id=?
```
No `review_state` filter. **All pressure points affect survivability and contradictions count**, regardless of any future review state.

Mechanism: `pressureSeverity = sum(severity) + pressureEvidenceRows.length`. Then:
```
survivability = clamp(avg - pressureSeverity * 1.8 + testability * 0.22, 0, 100)
contradictions = pressure_points.length + pressureEvidenceRows.length
```

High-severity pressure (severity 3–5) is disproportionately damaging to survivability. A single severity=5 pressure point deducts 9 survivability points directly.

### 3.5 RunPack inclusion (`claimDetail`, worker.js line 162)

```sql
SELECT id, created_at, title, body, severity FROM pressure_points WHERE claim_id=?
```
No `review_state` filter. **All pressure points are included in RunPacks** via `buildRunPack(detail, provenance)`.

### 3.6 Frontend render path

- `selectClaim(id)` → sets `selected.pressure = data.pressure`
- `renderStudy()` → renders `sectionPressure()`
- `sectionPressure()` renders all `selected.pressure` items, grouped by severity
- `firstPressure()` provides the "Claim Flow" section's attack preview
- Pressure items are displayed in the study view with title, severity chip, body text
- `runPackSummary()` shows `pressure_count` in the packet status bar

### 3.7 What adding `review_state` would require

**Schema migration (additive):**
```sql
-- PROPOSED FUTURE SQL — NOT RUN
ALTER TABLE pressure_points ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE pressure_points ADD COLUMN report_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_pressure_review_state ON pressure_points (review_state);
```

DEFAULT 'public' preserves all existing rows as public.

**Backend changes needed (not in this batch):**
1. `addPressure`: change INSERT to set `review_state='review'`
2. `getClaim`: add `AND COALESCE(p.review_state,'public')='public'` filter
3. `claimDetail` (RunPack): same filter
4. `recalcClaimScore`: same filter — this is the critical one for score integrity
5. `reviewDecision`: extend to accept `target_type='pressure'`
6. `reviewQueue`: extend to include pending pressure points

**Answer summary:**
- Immediately visible on public claim detail? **YES**
- Included in RunPack? **YES**
- Affects claim score? **YES — immediately and without filter**
- Schema has review_state? **NO**
- Severity of gap: **HIGH** — score can be manipulated by any user on any public claim

---

## 4. Home Tests Audit

### 4.1 Schema

From `migrations/0003_full_schema.sql` + `0005_add_home_tests_updated_at.sql`:

```sql
CREATE TABLE IF NOT EXISTS home_tests (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  safety_level TEXT DEFAULT 'low',
  difficulty TEXT DEFAULT 'easy',
  created_at INTEGER,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_home_tests_claim_id ON home_tests (claim_id);
CREATE INDEX IF NOT EXISTS idx_home_tests_created_at ON home_tests (created_at);
```

**Absent columns:** No `review_state`, no `report_count`.

### 4.2 Creation path (`addHomeTest`, worker.js line 84)

```
POST /api/tests
  → requireUser (header check only)
  → safeRateLimit: tests:{IP}, 20/hr
  → validates: claimId required, title ≥ 3 chars, instructions ≥ 8 chars
  → SELECT id FROM claims WHERE id=?  ← claim existence check only (no public state check)
  → ensureUser
  → INSERT INTO home_tests (...)
  → returns { ok:true, test:row, claim: claimOnly(claimId) }
```

Does not call `recalcClaimScore`. No review gate. No claim visibility check.

### 4.3 Public visibility

**`getClaim` (worker.js line 77):**
```sql
SELECT t.*, u.handle FROM home_tests t
LEFT JOIN users u ON u.id=t.user_id
WHERE t.claim_id=? ORDER BY t.created_at DESC
```
No filter. **All home tests are immediately visible.**

### 4.4 Score impact

`recalcClaimScore` does **not** query `home_tests`. Home tests do **not** affect claim score directly. However, they are included in `claimDetail` for RunPack, so they influence the AI analysis payload.

### 4.5 RunPack inclusion (`claimDetail`, worker.js line 162)

```sql
SELECT id, updated_at, created_at, title, instructions, safety_level, difficulty
FROM home_tests WHERE claim_id=? ORDER BY created_at DESC
```
No filter. **All home tests are included in RunPacks.**

Implication: a user could add a fabricated "test" with misleading instructions into a RunPack, influencing AI analysis without any moderation gate.

### 4.6 Frontend render path

- `selectClaim(id)` → `selected.tests = data.tests`
- `renderStudy()` → `sectionTests()`
- `sectionTests()` renders all tests with title, instructions, safety level, difficulty
- `firstTest()` contributes to "Claim Flow" step 3 ("How to test it")
- `runPackSummary()` shows `test_count`

### 4.7 What adding `review_state` would require

**Schema migration (additive):**
```sql
-- PROPOSED FUTURE SQL — NOT RUN
ALTER TABLE home_tests ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE home_tests ADD COLUMN report_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_home_tests_review_state ON home_tests (review_state);
```

**Backend changes (not in this batch):**
1. `addHomeTest`: set `review_state='review'` at insert
2. `getClaim`: add `AND COALESCE(t.review_state,'public')='public'` filter
3. `claimDetail` (RunPack): same filter
4. `reviewDecision`: extend to accept `target_type='test'`
5. `reviewQueue`: extend to include pending tests

**Answer summary:**
- Immediately visible on public claim detail? **YES**
- Included in RunPack? **YES**
- Affects claim score? **NO**
- Schema has review_state? **NO**
- Severity of gap: **MEDIUM** — no score manipulation possible, but RunPack content can be polluted

---

## 5. Analysis Results Audit

### 5.1 Schema

From `migrations/0003_full_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS analysis_results (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  source TEXT,
  verdict TEXT,
  evidence_score INTEGER DEFAULT 0,
  testability INTEGER DEFAULT 0,
  survivability INTEGER DEFAULT 0,
  strongest_support_json TEXT,
  strongest_pressure_json TEXT,
  missing_tests_json TEXT,
  plain_language_summary TEXT,
  raw_json TEXT,
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_analysis_results_claim_id ON analysis_results (claim_id);
```

**Absent columns:** No `review_state`, no `report_count`.

### 5.2 Creation path (`addAnalysisResult`, `src/analysis-results.js`)

```
POST /api/analysis
  → requireUser
  → safeRateLimit: analysis:{IP}, 20/hr
  → validates: claimId required, claim must exist (any state — no public check)
  → validates analysis shape (at least one meaningful field)
  → INSERT INTO analysis_results (...)
  → returns { ok:true, analysis: mapAnalysis(row) }
```

No review gate. Claim does not need to be public for analysis to be submitted against it.

### 5.3 Public visibility

**`listAnalysisForClaim` (`src/analysis-results.js` line 70):**
```sql
SELECT a.*, u.handle FROM analysis_results a
LEFT JOIN users u ON u.id=a.user_id
WHERE a.claim_id=? ORDER BY a.created_at DESC
```
No filter. **All analyses for a claim are immediately publicly visible** via `GET /api/claims/:id`.

Note: `getClaim` checks claim is public before returning claim detail. But all analyses on a public claim are returned without moderation.

### 5.4 Score impact

`recalcClaimScore` does **not** read from `analysis_results`. Analysis results do **not** affect the stored claim score directly.

However, `buildRunPack` passes the full `claimDetail.analyses` array into the RunPack payload. A user's analysis (potentially from a malicious AI response) is bundled into the next RunPack generated, influencing whatever AI receives it.

Additionally, the `lineage.analysisCount` counter is derived from `analyses.length` — publicly visible in the study view.

### 5.5 RunPack inclusion

`buildRunPack(detail, provenance)` takes `detail` from `claimDetail(env, claimId)`. `claimDetail` calls `listAnalysisForClaim` with no filter. **All analysis results are bundled into RunPacks.**

### 5.6 Appropriate model for analyses

Analysis results occupy a special position: they are the **output of a RunPack workflow** that is explicitly user-driven. The design intent is:
1. User gets a public RunPack
2. User runs it through their own AI
3. User pastes AI response back via the "Load AI Analysis Return" form
4. Analysis is saved and shown on the public claim

This means analyses are always user-attributed external AI outputs, not first-party content. The risk profile differs from pressure points (which directly affect score):
- Misleading analyses don't change the stored score
- They do influence next-round AI analysis via RunPack contamination
- They are user-handle-attributed and visible

**Recommended model:** Keep analyses private-until-promoted (per-user, not globally visible) OR apply a weak review gate with auto-approval for analyses from known good sources. Full review overhead may be disproportionate to risk.

**Answer summary:**
- Publicly visible on claim detail? **YES — immediately**
- Included in RunPack? **YES**
- Affects claim score? **NO (not in recalcClaimScore)**
- Schema has review_state? **NO**
- Severity of gap: **LOW-MEDIUM** — no direct score impact; RunPack poisoning is the primary concern

---

## 6. Votes Audit

### 6.1 Claim votes

**Schema (`claim_votes`):**
```sql
CREATE TABLE IF NOT EXISTS claim_votes (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_votes_unique ON claim_votes (claim_id, user_id);
```

**Deduplication:** YES — enforced at two levels:
1. Runtime check in `voteClaim` (`src/votes.js` line 17): `SELECT id FROM claim_votes WHERE claim_id=? AND user_id=?`. If row exists, `UPDATE` (change vote); else `INSERT`.
2. Unique index `idx_claim_votes_unique` on `(claim_id, user_id)` — DB-level enforcement. `INSERT` on duplicate would fail at the DB layer even if the runtime check had a race.

**Per-user protection:** Vote is tied to `user_id`, which is the localStorage UUID. One `user_id` can only hold one vote per claim (updatable).

**localStorage bypass:** A user who clears localStorage gets a new UUID. The new UUID is not constrained to the old one. A new `POST /api/session` creates a new user row. The user can then vote again from their new identity. **There is no device-level or IP-level vote dedup.** The unique constraint protects against accidental double-vote from the same session, not deliberate identity cycling.

**Rate limit:** 120/hr per `vote:{userId}:{ip}` — this is per user+IP combination, not purely per IP. Cycling userId bypasses the userId part of the rate key but the IP portion remains. 120/hr per identity is generous.

**Score impact:** `refreshClaimVoteCounts` updates `belief_yes`, `belief_no`, `uncertainty` on the claim. These are displayed in the study view and included in `mapClaim`. They are **not** used in `recalcClaimScore` (which only uses evidence quality and pressure severity). Belief counts are social signal, not claim status scoring.

**Evidence and truth votes (`evidence_votes`, `truth_votes`):**
- Tables are defined in schema with identical structure to `claim_votes`
- `UNIQUE INDEX` exists for each: `idx_claim_votes_unique` equivalents not confirmed in schema for evidence/truth votes — schema has no unique index listed for these
- **No routes exist in `src/worker.js` for these tables**
- The `debugState` function counts them (`evidence_votes`, `truth_votes` in its table list)
- They are never populated by any current user action
- These are schema-reserved, not implemented

**Safest vote dedup implementation:**
The current runtime check (`SELECT ... WHERE claim_id=? AND user_id=?` → UPDATE or INSERT) combined with the DB unique index is already correct for session-stable identities. It is sufficient for the current pre-launch phase.

For stronger protection against identity cycling, options are:
- IP-based vote limit (would break legitimate multi-user networks)
- Device fingerprint binding (complex, privacy-sensitive, fingerprint_hash column exists but unused)
- Rate-limiting new user creation (currently unlimited)

**Does vote dedup need a migration or PR?** No — the unique index already exists in the schema (`idx_claim_votes_unique`). The runtime check in `votes.js` is correct. **This is already handled correctly for the current model.** No action required for launch.

---

## 7. Reports Audit

### 7.1 Current implementation

**Schema (`reports`):**
```sql
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reporter_id TEXT,
  reason TEXT,
  status TEXT DEFAULT 'open',
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports (target_type, target_id, status);
```

**Creation (`reportTarget`, worker.js line 85):**
```
POST /api/report
  → requireUser
  → safeRateLimit: report:{IP}, 20/hr
  → INSERT INTO reports (id, target_type, target_id, reporter_id, reason, status='open', created_at)
  → if target_type='claim': UPDATE claims SET report_count+1
      and if report_count+1 >= 2: SET review_state='review'
  → if target_type='evidence': UPDATE evidence SET report_count+1
      and if report_count+1 >= 2: SET review_state='review'
  → returns { ok:true }
```

**Report closure:** When an admin makes a review decision on a claim/evidence/truth, all open reports against that target are closed:
- Claim rejected → reports set to `status='rejected'`
- Claim approved/moved to review → reports set to `status='closed'`

Reports are never deleted. The table is a permanent audit log.

**What `reportTarget` does NOT support:**
- `target_type='truth'`: truth report_count is not incremented (truth table has no `report_count` column in schema). The INSERT still fires but has no escalation effect.
- `target_type='pressure'`: no escalation logic
- `target_type='test'`: no escalation logic

### 7.2 Owner retraction-as-report feasibility

From D-89A, Option C was: user submits a report against their own claim with `reason='retraction request'`.

**Feasibility without schema change: YES.**

The `reportTarget` route does not check that `reporter_id != target owner`. Any user can report any target, including their own. The report appears in the admin review queue as an open report with the specified reason.

**What would the admin need to do:** Review the report, identify it as a retraction request, then call `reviewDecision` with `decision='rejected'` to hide the claim. The claim remains in the DB (no DELETE), moves to `review_state='rejected'`, and all open reports are closed.

**What this does NOT handle:**
- Retracting a claim already in `review` state: admin sees it in queue; user cannot force the action
- Retracting a public claim that has been cited in other claims' lineage
- UI path: no frontend UI for retraction requests currently

**Backend changes needed for retraction-as-report (Option C):**
1. No schema change
2. No backend code change — works with existing `POST /api/report`
3. Frontend change: add "Request retraction" button in the study view (not in this batch)
4. Admin UI: no change needed; retraction requests appear as reports in the review queue with the `reason` field

**How are reports currently surfaced to admin?** The `GET /api/review` query includes `latest_report_reason` for each item in the review queue. Items with `report_count > 0` are filterable in the review UI under the "Reported" filter chip.

---

## 8. Evidence Reuse Link Audit

### 8.1 Schema (`evidence_claim_links`)

```sql
CREATE TABLE IF NOT EXISTS evidence_claim_links (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  stance TEXT,
  link_note TEXT,
  created_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_claim_links_unique ON evidence_claim_links (evidence_id, claim_id);
```

**No `review_state` on the link row.** Unique constraint prevents the same evidence from being linked to the same claim twice.

### 8.2 Creation path (`attachEvidenceToClaim`, `src/evidence-reuse.js`)

```
POST /api/evidence-attach
  → requireUser
  → safeRateLimit: evidence-attach:{IP}, 20/hr
  → SELECT * FROM evidence WHERE id=?  ← evidence must exist
  → SELECT * FROM claims WHERE id=?    ← claim must exist (any state — no public check)
  → ensureUser
  → INSERT OR IGNORE INTO evidence_claim_links (id, evidence_id, claim_id, user_id, stance, link_note, created_at)
  → recalcClaimScore(env, claimId)   ← IMMEDIATE score impact if evidence is public
  → returns { ok, link, evidence, claim }
```

**There is no check that the evidence being linked is public.** A user can link non-public (review/rejected) evidence to a claim. The link is created but the evidence will not appear in the claim detail (filtered by evidence's `review_state` in the query). However, `recalcClaimScore` IS called, which does filter by `evidence.review_state='public'`, so non-public evidence does not affect score through the link.

**Actual flow for link visibility:** When `getClaim` or `claimDetail` fetches reused evidence:
```sql
SELECT e.*, u.handle, l.stance AS linked_stance, l.link_note, 'reused' AS link_type
FROM evidence_claim_links l
JOIN evidence e ON e.id=l.evidence_id
LEFT JOIN users u ON u.id=e.user_id
WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'
```
**The filter is on the evidence row, not the link row.** If the evidence is public, the link is visible. If evidence is rejected/review, link is invisible.

### 8.3 Moderation flow for bad links

If existing public evidence is linked to a claim in a misleading way (wrong stance, false link_note):
- There is no mechanism to moderate or reject the link itself
- The only recourse is to report the underlying evidence, which moves it to review, which removes the link from visibility
- But that also removes the evidence from its original claim

**Recommendation: link-level review is NOT needed.** The current model is sufficient for launch:
- Evidence moderation gates the content
- The link itself carries only `stance` and `link_note` — these are metadata that cannot be reported independently
- If a link is abusive (wrong stance, misleading note), the admin can report/reject the underlying evidence OR this can be handled by a future admin-only link-delete route
- Adding `review_state` to `evidence_claim_links` would create a 4-way state problem (evidence state × link state) with unclear UX consequences

**Score impact summary:**
- `recalcClaimScore` uses `evidence_claim_links` via:
  ```sql
  SELECT e.quality, l.stance FROM evidence_claim_links l
  JOIN evidence e ON e.id=l.evidence_id
  WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'
  ```
  Filter is on evidence `review_state`. Only public evidence via links affects score. ✅

### 8.4 Link deduplication

`INSERT OR IGNORE INTO evidence_claim_links` + `UNIQUE INDEX idx_evidence_claim_links_unique ON (evidence_id, claim_id)` — one link per evidence-claim pair. The route then re-fetches the actual link id via `SELECT id FROM evidence_claim_links WHERE evidence_id=? AND claim_id=? LIMIT 1` to handle the `IGNORE` case. ✅

---

## 9. Ownership and Retraction Audit

| Object | Owner can see later? | Owner can retract? | If public + score/export affected, should owner remove be allowed? | Recommended launch policy |
|--------|---------------------|-------------------|-------------------------------------------------------------------|--------------------------|
| Pressure point | No — no per-user listing; visible in claim study | No | Dangerous — removal would retroactively change claim score. Should require admin mediation | No self-retraction. User can submit report on claim if they believe pressure is wrong. Admin-only removal via future admin route. |
| Home test | No — no per-user listing; visible in claim study | No | Lower risk — no score impact. Self-removal would reduce RunPack quality | No self-retraction for launch. Future: allow owner to delete their own test if claim is still in review |
| Analysis result | No — no per-user listing; visible in claim study | No | No direct score impact. RunPack contamination risk | No self-retraction for launch. Future: allow owner to mark their analysis as superseded |
| Claim vote | No listing — vote is anonymous aggregate | Can change vote (update), cannot delete | Vote is per-session identity; changing vote is sufficient | Allow vote update (already works). No delete needed. |
| Evidence vote | N/A — no route | N/A | N/A | Schema-only; not launched |
| Truth vote | N/A — no route | N/A | N/A | Schema-only; not launched |
| Report | No per-user listing | No | N/A — not public | No action needed. Reports are permanent audit trail. |
| Evidence claim link | No — no per-user listing | No | Removes evidence from claim score on delete | No self-retraction. Admin-only link management in future. |
| RunPack | No per-user listing | N/A — ephemeral (returned to caller, stored in DB as snapshot) | N/A | No action needed. RunPacks are point-in-time snapshots. |
| Belief snapshot | Yes — `GET /api/belief-snapshots` returns own snapshots | No | Private; not public | No change needed. |

**Pattern:** The ownership gap is structural. Because identity is ephemeral (localStorage UUID, no account), "owner" cannot be durably established. User can clear storage and lose access to their submissions. Self-retraction would require stable identity. **Ownership/retraction features are blocked on identity durability (D-89A §10, P3).**

---

## 10. Prioritised Implementation Plan

Ordered by risk, urgency, and schema complexity.

### Batch D-89C (P0 — no schema change, single PR)

**Shadow ban enforcement (P0 from D-89A):**
- 1 line in `requireUser`: check `is_shadow_banned` in users table
- Current: `requireUser` only checks header presence, returns `userId`
- Change: after reading userId from header, `SELECT is_shadow_banned FROM users WHERE id=?`. If `1`, throw `MISSING_PSEUDONYMOUS_USER` or new error `USER_SHADOW_BANNED`
- Cost: one DB read per user request (can be eliminated later with JWT or signed header)
- Risk: zero — shadow_banned users are currently 0 in production; enabling the check changes nothing until an admin sets the flag

**This is a standalone 1-line backend change → branch + PR → direct merge.**

### Batch D-89D (P1 — schema migration + PR)

**Pressure point `review_state` (highest urgency of §10):**
- Migration: `ALTER TABLE pressure_points ADD COLUMN review_state TEXT DEFAULT 'public'`
- Migration: `ALTER TABLE pressure_points ADD COLUMN report_count INTEGER DEFAULT 0`
- Backend: `addPressure` sets `review_state='review'`
- Backend: `getClaim`, `claimDetail`, `recalcClaimScore` add `review_state='public'` filter
- Backend: `reviewDecision` extends to accept `target_type='pressure'`
- Backend: `reviewQueue` returns pending pressure points
- This is the highest-impact gap: score manipulation via unmoderated pressure

**Requires:** branch + PR (schema migration + Worker changes in same commit).

### Batch D-89E (P1 — schema migration + PR, parallel with D-89D)

**Home test `review_state`:**
- Migration: `ALTER TABLE home_tests ADD COLUMN review_state TEXT DEFAULT 'public'`
- Backend: `addHomeTest` sets `review_state='review'`
- Backend: `getClaim`, `claimDetail` add `review_state='public'` filter
- Backend: `reviewDecision` extends to accept `target_type='test'`
- Backend: `reviewQueue` returns pending tests
- Lower urgency than pressure (no score impact), but RunPack contamination risk

**Requires:** branch + PR.

### Batch D-89F (P2 — docs + frontend only, direct main)

**Retraction-as-report UI:**
- No schema change, no backend change
- Frontend: add "Request retraction" button in study view (only shown for user's own claim; since identity is localStorage-based, check `user.id === selected.userId` or equivalent)
- UI copy: "Report this as retraction request — sends a moderation note to the admin"
- Calls existing `POST /api/report` with `reason='Retraction request from original submitter'`
- Admin docs note: retraction requests appear in the Reported filter

### Batch D-89G (P3 — deferred)

**Analysis result moderation:**
- Defer until pressure/test review is operational
- Decision: keep analyses per-user-private until promoted? Or full review queue?
- Recommended: add per-user filtering first (`WHERE user_id=?` option in `listAnalysisForClaim`) before adding review overhead

**Identity durability:**
- Deferred per D-89A. Blocks meaningful self-service retraction.

---

## 11. Proposed Future Migration SQL

**NOT RUN. Not in migrations directory. Text only.**

### Migration: add `review_state` and `report_count` to `pressure_points`

```sql
-- PROPOSED FUTURE SQL — NOT RUN
-- Purpose: Enable admin moderation of pressure points before they are
--          visible on public claims and included in RunPacks.
-- DEFAULT 'public' preserves all existing rows as publicly visible.
-- New inserts from Worker must set review_state='review' explicitly.
-- recalcClaimScore must add COALESCE(review_state,'public')='public' filter.

ALTER TABLE pressure_points ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE pressure_points ADD COLUMN report_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_pressure_review_state ON pressure_points (review_state);
CREATE INDEX IF NOT EXISTS idx_pressure_report_count ON pressure_points (report_count);
```

### Migration: add `review_state` and `report_count` to `home_tests`

```sql
-- PROPOSED FUTURE SQL — NOT RUN
-- Purpose: Enable admin moderation of home tests before they appear
--          on public claims and are included in RunPacks.
-- DEFAULT 'public' preserves all existing rows as publicly visible.

ALTER TABLE home_tests ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE home_tests ADD COLUMN report_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_home_tests_review_state ON home_tests (review_state);
```

### Migration: add `review_state` to `analysis_results` (deferred)

```sql
-- PROPOSED FUTURE SQL — NOT RUN — DEFERRED (P3)
-- Purpose: Per-user analysis isolation before global publication.
-- Alternatively: analysis results could use a visibility model (public/private/user-only)
-- rather than a full review queue model.

ALTER TABLE analysis_results ADD COLUMN review_state TEXT DEFAULT 'public';
CREATE INDEX IF NOT EXISTS idx_analysis_review_state ON analysis_results (review_state);
```

---

## 12. Risk Table

| Object | Launch risk | Abuse risk | Schema complexity | Urgency |
|--------|------------|-----------|------------------|---------|
| Pressure points | **HIGH** — score manipulation on any public claim | **HIGH** — severity=5 × N attacks available to any user | Low — 2 ADD COLUMN statements | **P1 — implement in D-89D** |
| Home tests | **MEDIUM** — RunPack contamination, misleading test content | **MEDIUM** — instructions can contain harmful content | Low — 2 ADD COLUMN statements | P1 — implement in D-89E |
| Analysis results | **MEDIUM** — RunPack contamination, claim analysis poisoning | **LOW-MEDIUM** — no score impact; rate-limited | Low — 1 ADD COLUMN | P3 — deferred |
| Claim votes | **LOW** — dedup already in place; only belief counts affected | **LOW-MEDIUM** — identity cycling bypass; rate limited | None — schema already has unique index | No action for launch |
| Evidence votes | **NONE** — no route | None | N/A | No action; defer to future feature |
| Truth votes | **NONE** — no route | None | N/A | No action; defer to future feature |
| Reports | **LOW** — correct escalation at 2+ reports; audit trail | **LOW** — 20/hr rate limit; auto-escalation is correct | None | No action needed |
| Evidence claim links | **LOW** — filter via evidence review_state is sufficient | **LOW** — unique constraint prevents spam | None | No action for launch |
| RunPack / aip_packets | **LOW** — claim must be public; snapshot-only | **LOW** — only a logged user can generate; downstream risk | None | No action (improves with pressure/test review) |
| Belief snapshots | **NONE** — private to user | None | None | No action needed |
| Shadow ban (users) | **HIGH** — banned users submit freely | **HIGH** | None — no schema change | **P0 — implement in D-89C** |

---

## 13. Files Inspected

| File | Purpose |
|------|---------|
| `src/worker.js` | All routes, addPressure, addHomeTest, addEvidence, reportTarget, voteClaim, getClaim, claimDetail, recalcClaimScore reference paths |
| `src/votes.js` | Full vote implementation including dedup logic and refreshClaimVoteCounts |
| `src/analysis-results.js` | Full addAnalysisResult and listAnalysisForClaim |
| `src/claim-scoring.js` | Full recalcClaimScore — confirmed no review_state filter on pressure_points |
| `src/evidence-reuse.js` | Full attachEvidenceToClaim |
| `public/app-v10.js` | Frontend render paths: sectionPressure, sectionTests, sectionAnalyses, voteClaim, addCaseItem, addHomeTestUI, saveAnalysisResult |
| `migrations/0001_init.sql` | Initial schema |
| `migrations/0003_full_schema.sql` | Full schema including all tables and indexes |
| `migrations/0005_add_home_tests_updated_at.sql` | home_tests updated_at |
| `migrations/0007_add_evidence_review_state.sql` | Evidence review_state migration (template for pressure/test migrations) |
| `migrations/0008_add_status_locked.sql` | status_locked pattern |
| `docs/D89A_PRODUCT_MODEL_AND_OWNERSHIP_AUDIT.md` | Prior audit results |

---

## 14. Static Check Results

All checks run at commit `27022b9` (D-89A baseline).

| Check | Expected | Result |
|-------|----------|--------|
| `node --check src/worker.js` | exit 0 | ✅ exit 0 |
| `node --check public/app-v10.js` | exit 0 | ✅ exit 0 |
| `scripts/hardening-smoke-test.mjs` | 147 passed | ✅ 147 passed, 0 failed |
| `scripts/belief-engine-static-check.mjs` | 24 passed | ✅ 24 passed, 0 failed |
| `scripts/worker-route-static-check.mjs` | 39 passed | ✅ 39 passed, 0 failed |

---

## 15. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| No Worker code changes | ✅ |
| No migration files created | ✅ (SQL in §11 is text-only, not in migrations/) |
| No POST made | ✅ |
| No D1 writes | ✅ |
| No Wrangler | ✅ |
| No moderation actions | ✅ |
| Admin token not printed or committed | ✅ |
| No Co-Authored-By | ✅ |
