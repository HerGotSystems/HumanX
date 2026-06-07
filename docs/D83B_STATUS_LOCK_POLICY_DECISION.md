# D-83B: Status Lock Policy Decision

Date: 2026-06-07
Step: D-83B — docs-only policy decision following D-83A scoring/status audit
Type: Docs-only. Direct main.
No code changes. No DB migration. No route calls. No D1. No Wrangler. No status correction.

---

## 1. Purpose

D-83A confirmed that `recalcClaimScore` unconditionally overwrites `claims.status` with
an algorithm-derived value on every trigger. No editorial override mechanism exists.
The primary concern is launch-A1 (MMR/autism): D-76C deliberately chose
"Strongly Supported" to avoid overclaiming on a politically sensitive claim, but
`recalcClaimScore` computes "Proven" based on the high quality of the evidence
(two `repeatable`-tier studies: avg=85, survivability=87 — both Proven thresholds met).

D-83B records the accepted policy decision and defines the intended implementation
shape for D-83C (branch + PR) and D-83D (production correction after code support).

---

## 2. Non-Execution Statement

D-83B makes no code changes.
D-83B makes no DB migrations.
D-83B calls no routes.
D-83B makes no D1 direct commands.
D-83B runs no Wrangler.
D-83B makes no status correction to any claim.
D-83B does not lock any claim.
No DB row was modified during D-83B.

---

## 3. D-83A Findings Summary

### 3.1 — Confirmed architecture

- **File:** `src/claim-scoring.js`
- **Function:** `recalcClaimScore(env, claimId)`
- **Behavior:** Always executes `UPDATE claims SET evidence_score=?, survivability=?, contradictions=?, status=?, updated_at=? WHERE id=?`
- **No guard:** No `status_locked` flag. No `editorial_status` field. No per-claim override mechanism of any kind.
- **Triggers:** `addEvidence`, `addPressure`, `createClaim` (with initial evidence), `reportTarget` (on evidence), `reviewDecision` (evidence), `linkEvidenceToClaim`

### 3.2 — Observed drift table

| seed_id | Imported status | Computed status | Direction | Risk |
|---------|----------------|-----------------|-----------|------|
| launch-B5 | Proven | Strongly Supported | ↓ softer | Low |
| **launch-A1** | **Strongly Supported** | **Proven** | **↑ stronger** | **Medium** |
| launch-A4 | Proven | Strongly Supported | ↓ softer | Low |
| launch-C1 | Plausible | Plausible | — | None |
| launch-D2 | Proven | Strongly Supported | ↓ softer | Low |

### 3.3 — Root cause for A1

Both A1 evidence items are `quality: 'repeatable'` (Cochrane systematic review,
Madsen NEJM cohort) → avg=85. Pressure severity=5 → survivability=87. Both
`Proven` gates clear: avg≥80 ✅ and survivability≥75 ✅. The algorithm is not wrong —
it is accurately reflecting evidence quality. The tension is that D-76C applied
editorial caution at the claim label level (not the evidence quality level),
and there is currently no way to preserve that decision across `recalcClaimScore` runs.

---

## 4. Accepted Decision: Option 4 — status_locked boolean

**Decision:** Implement a `status_locked` boolean column on the `claims` table.

When `status_locked = true`, `recalcClaimScore` must not overwrite `claims.status`.
All other computed fields (`evidence_score`, `survivability`, `contradictions`,
`updated_at`) continue to be updated normally.

When `status_locked = false` or `NULL` (the default for all existing claims and
all future user-submitted claims), `recalcClaimScore` behavior is unchanged.

**Initial application:** Lock only launch-A1 (`clm_seed_55e17c22e13e`) at
`Strongly Supported`. All other seed claims and all user-submitted claims are
left unlocked.

---

## 5. Rejected Alternatives

### 5.1 — Option 1: Accept computed status as canonical

*Rejected for A1.* "Proven" is not scientifically inaccurate, but accepting it for
launch-A1 abandons a deliberate editorial judgment made in D-76C for a politically
sensitive claim. The case for "Strongly Supported" on a claim about a contested vaccine
topic is a reasonable communications policy, independent of evidence quality.

*Accepted for B5, A4, D2.* The downward drift (Proven → Strongly Supported) on these
claims is low-risk. "Strongly Supported" is defensible in all three cases. No correction
is planned for B5, A4, or D2. These claims are left unlocked.

### 5.2 — Option 2: Adjust scoring thresholds

*Rejected.* Raising the `avg >= 80` threshold for "Proven" (e.g., to `avg >= 87`)
would fix A1 but would be a global change affecting all user-submitted claims that
have legitimately reached "Proven" status. Threshold changes should require a
comprehensive evidence base, not a targeted fix for one seed claim.

### 5.3 — Option 3: editorial_status / computed_status column split

*Rejected for now.* A two-column split is architecturally clean but requires
schema migration, API changes, frontend changes, and importer changes. It is
more work than Option 4 for the current use case (one claim needing a locked label).
May be reconsidered if the number of editorially-locked claims grows significantly.

### 5.4 — Option 5: One-off D1 correction without code support

*Rejected.* Any direct `UPDATE claims SET status='Strongly Supported' WHERE id='clm_seed_55e17c22e13e'`
would be silently reversed by the next `recalcClaimScore` trigger on that claim
(e.g., if a user adds evidence, files a report, or votes on evidence). This is not
a durable fix and would create a confusing support scenario where the label appears
correct then unexpectedly reverts. D-83A explicitly recommended against this option.

---

## 6. Policy Rules

1. `claims.status` remains the single public display label for claim confidence.
2. `recalcClaimScore` continues to compute `evidence_score`, `survivability`,
   `contradictions`, and `updated_at` on every trigger regardless of lock state.
3. When `claims.status_locked = 0` (or NULL): `recalcClaimScore` may update `claims.status`.
   This is the default for all claims. Behavior is unchanged from current.
4. When `claims.status_locked = 1`: `recalcClaimScore` must NOT update `claims.status`.
   The existing status value is preserved across all future recalculation triggers.
5. `status_locked` should be used sparingly. It is not a general-purpose editorial tool.
   It is a specific guard for cases where the editorial label and the computed label
   are intentionally different and the editorial label must be preserved.
6. `status_locked` should not be exposed to non-admin users. No public-facing indication
   that a claim's status is locked is required in the initial implementation.
7. Scoring thresholds in `verdict()` are not changed by this policy decision.

---

## 7. Initial Rollout Scope

| Phase | Step | Scope |
|-------|------|-------|
| D-83C | Branch + PR — migrate `status_locked` column, update `recalcClaimScore`, add static test coverage | Code/schema only. No production apply yet. |
| D-83D | Production apply — set `status_locked = 1` and `status = 'Strongly Supported'` on launch-A1 (`clm_seed_55e17c22e13e`) only | Requires explicit write approval in the same session as execution. |

No other claims will be locked during initial rollout. Launch-B5, launch-A4, and
launch-D2 remain unlocked (their computed "Strongly Supported" is acceptable).
Launch-C1 is already at the intended "Plausible" (no drift, no lock needed).

---

## 8. Data Model Proposal

### Column definition (SQLite / D1)

```sql
ALTER TABLE claims ADD COLUMN status_locked INTEGER NOT NULL DEFAULT 0;
```

SQLite has no native BOOLEAN type. `INTEGER DEFAULT 0` is the idiomatic equivalent.
Values: `0` = not locked (recalcClaimScore may update status), `1` = locked.

### Migration strategy

- The `ALTER TABLE ... ADD COLUMN` with a `DEFAULT 0` does not require a data migration.
  All existing rows get `status_locked = 0` automatically.
- No index needed (looked up with `SELECT * FROM claims WHERE id=?`).
- The `recalcClaimScore` query already reads the full claim row:
  `SELECT type, testability FROM claims WHERE id=?`
  This query should be extended to also select `status_locked`:
  `SELECT type, testability, status_locked FROM claims WHERE id=?`

---

## 9. Code Behavior Proposal

### `src/claim-scoring.js` — proposed change (implementation in D-83C)

**Current (line 10):**
```js
const claim = await env.DB.prepare(`SELECT type,testability FROM claims WHERE id=?`).bind(claimId).first();
```

**Proposed:**
```js
const claim = await env.DB.prepare(`SELECT type,testability,status_locked FROM claims WHERE id=?`).bind(claimId).first();
```

**Current (lines 23–25):**
```js
await env.DB.prepare(`UPDATE claims SET evidence_score=?, survivability=?, contradictions=?, status=?, updated_at=? WHERE id=?`)
  .bind(avg, survivability, contradictions, status, Date.now(), claimId)
  .run();
```

**Proposed (pseudocode — exact implementation in D-83C branch):**
```js
if (claim?.status_locked) {
  // Preserve existing status; update computed fields only
  await env.DB.prepare(`UPDATE claims SET evidence_score=?, survivability=?, contradictions=?, updated_at=? WHERE id=?`)
    .bind(avg, survivability, contradictions, Date.now(), claimId)
    .run();
} else {
  // Original behavior — update everything including status
  await env.DB.prepare(`UPDATE claims SET evidence_score=?, survivability=?, contradictions=?, status=?, updated_at=? WHERE id=?`)
    .bind(avg, survivability, contradictions, status, Date.now(), claimId)
    .run();
}
```

**Return value:** `recalcClaimScore` currently returns `{ evidenceScore, survivability, contradictions, status, testability }`.
When locked, the returned `status` should reflect the preserved value from the DB,
not the computed `verdict()` result. Or it may return the computed value with a
`statusLocked: true` flag. Exact return shape to be decided in D-83C branch.

---

## 10. API / Admin UI Note

The initial `status_locked` implementation is intended to be backend-only.
No immediate changes to the admin Review UI, the public claim detail API response,
or the `GET /api/claims` response are required.

Future optional enhancements (not part of D-83C):
- Admin Review UI could display a lock indicator on locked claims
- `mapClaim()` in `src/worker.js` could expose `statusLocked: true` in the API response
  to allow the frontend to display a locked indicator
- The importer (`src/importer.js`) could accept a `status_locked` field from seed data
  to enable future seed claims to be imported with a lock already set

None of these are required for the initial implementation.

---

## 11. Gate

**D-83B is complete. No change to code, DB, or production has been made.**

| Step | Status |
|------|--------|
| D-83A — scoring audit | ✅ COMPLETE |
| D-83B — policy decision | ✅ COMPLETE (this doc) |
| D-83C — branch + PR: `status_locked` column, `recalcClaimScore` guard, static test | ⛔ BLOCKED — requires explicit instruction to begin implementation |
| D-83D — production apply: set `status_locked=1` + `status='Strongly Supported'` on `clm_seed_55e17c22e13e` only | ⛔ BLOCKED — requires D-83C merged AND explicit write approval in same session |

No correction will be made until D-83C and D-83D are explicitly approved in separate sessions.

---

## D-83B Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at D-83A commit (671075f) | ✅ |
| D-83A findings summarized | ✅ |
| Accepted decision (Option 4 status_locked) recorded | ✅ |
| Rejected alternatives documented with reasoning | ✅ |
| Policy rules listed | ✅ |
| Initial rollout scope defined (A1 only) | ✅ |
| Data model proposal (SQLite INTEGER DEFAULT 0) included | ✅ |
| Code behavior proposal (pseudocode) included | ✅ |
| API/admin UI note included | ✅ |
| D-83C and D-83D gates defined | ✅ |
| No code changes | ✅ |
| No DB migration | ✅ |
| No route calls | ✅ |
| No D1 direct commands | ✅ |
| No Wrangler | ✅ |
| No status correction | ✅ |
| docs/D83B_STATUS_LOCK_POLICY_DECISION.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
