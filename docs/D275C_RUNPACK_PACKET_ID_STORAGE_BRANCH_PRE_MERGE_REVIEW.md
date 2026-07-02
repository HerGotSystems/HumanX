# D-275C — RunPack Packet-ID Storage Branch Pre-Merge Review

**Scope:** Docs / review only — no code changes
**Status:** COMPLETE — no blocker found — branch is safe and ready for owner approval
**Branch reviewed:** `d275b-runpack-packet-id-storage`
**Branch HEAD:** `a219896`
**Main HEAD at time of review:** `9095a55` (D-275A)
**Baseline:** 3263 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn) — confirmed unchanged
**Files changed in this task:** `docs/D275C_RUNPACK_PACKET_ID_STORAGE_BRANCH_PRE_MERGE_REVIEW.md`, `docs/README.md`
**Code changes:** None — no blocker found requiring code fix
**Deploy needed:** No — review task only
**Migration applied:** No

---

## Review Verdict

**SAFE. No blocker. Ready for owner-approval merge/migration/deploy sequence.**

The branch is additive, surgical, and correctly coordinated across migration, backend handler, and frontend. All D-271/D-272/D-274 locks are preserved. No public profile exposure. No Review/moderation impact. No Drift/Belief expansion impact. All checks pass.

---

## Checklist Results

### 1. Branch is based after `9095a55`

**PASS.** `git log --oneline -5` confirms the branch HEAD `a219896` (D-275B) sits directly on top of `9095a55` (D-275A). No unexpected commits in between.

### 2. Main has not been modified

**PASS.** `git diff --stat main...HEAD` shows exactly 6 files changed — the D-275B branch files only. `main` remains at `9095a55`.

### 3. Migration is additive only

**PASS.** `migrations/0017_analysis_results_packet_id.sql` contains exactly:

```sql
ALTER TABLE analysis_results ADD COLUMN packet_id TEXT;
```

- No `DROP TABLE`
- No `DROP COLUMN`
- No `RENAME TABLE`
- No destructive change
- Column type is `TEXT` — nullable by SQLite default
- Existing rows will receive `packet_id = NULL` — correct

### 4. Migration file created but not applied live

**PASS.** No `wrangler d1 migrations apply` was run. No Wrangler commands of any kind. The file exists on the branch only. Applying it to live D1 requires explicit owner action.

### 5. Backend accepts optional `packet_id`

**PASS.** `src/analysis-results.js` line 22:

```javascript
const packetId = cleanText(body.packet_id || '', 80) || null;
```

`body.packet_id` is read after `body` is already parsed. When absent, `body.packet_id || ''` evaluates to `''`, `cleanText('', 80)` returns `''`, and `'' || null` gives `null`. The field is fully optional — existing callers that omit it get `packet_id = NULL` stored, which is correct.

### 6. Backend uses `cleanText(..., 80)`, not `cleanId()`

**PASS.** Line 22 uses `cleanText(body.packet_id || '', 80)`. `cleanId` is imported (line 2) but is only used for `claimId` (line 6). `cleanId` is not applied to `packet_id` anywhere in `analysis-results.js`.

### 7. Underscores in `rp_*` packet IDs are preserved

**PASS.** `cleanText` does not strip underscores — it caps length and strips control characters/HTML, but preserves the full character set of `rp_abc123_lc2x9k`-format IDs. `cleanId` was correctly avoided.

### 8. Backend stores `packet_id` in the analysis result write path

**PASS.** `src/analysis-results.js` lines 44–66: `packet_id` is in the INSERT column list (14th column, before `created_at`) and `packetId` is bound as the 14th positional argument. The column order and bind count match (15 `?` placeholders, 15 `.bind()` arguments).

**Bind count verified:**
```
id, claimId, userId, source, verdict, evidenceScore, testability, survivability,
asArray(strongestSupport), asArray(strongestPressure), asArray(missingTests),
plainLanguageSummary, analysis, packetId, now
```
= 15 arguments. INSERT has 15 columns. **Correct.**

### 9. Existing saves still work when `packet_id` is absent

**PASS.** The field is nullable in the schema and defaults to `null` in the handler when `body.packet_id` is absent. The `hasMeaningfulAnalysis` check is unchanged — it does not require `packet_id`. No existing behavior is altered.

### 10. `mapAnalysis()` return does not expose `packet_id` to public profile routes

**PASS.** `mapAnalysis()` now returns `packetId: a.packet_id || null`. Confirmed call sites in `src/worker.js`:

| Call site | Route | Auth required | Exposed publicly? |
|-----------|-------|---------------|-------------------|
| `listAnalysisForClaim` in `getClaim()` (line 888) | `GET /api/claims/:id` | No explicit auth, but only returns `public` review_state claims | Returns full `analyses` array including `packetId` — available to any authed viewer of a public claim |
| `listAnalysisForClaim` in `claimDetail()` (line 988) | Used by `createClaim`, `addAnalysisResult`, `createAipPacket` | All authenticated or internal | Not a read-public surface |

**`GET /api/claims/:id` does include `analyses` in its response, including the new `packetId` field.** This route is not auth-gated — any client can read it for a `public` claim. However, `packet_id` values are non-sensitive identifiers (`rp_*` format) with no personal or auth information. There is no privacy concern with this exposure. The public profile HTML route (`/u/:slug` and `GET /api/u/:slug`) never calls `listAnalysisForClaim` — confirmed from `loadPublicProfileSummary()` (line 590+): it queries only counts of claims/truths/evidence/pressure, not `analysis_results`.

**Conclusion: `packetId` will be visible in `GET /api/claims/:id` responses alongside existing analysis fields. This is appropriate — it is a claim metadata identifier, not sensitive data.**

### 11. Frontend reads packet ID from parsed `lastPacket`, not from AI return JSON

**PASS.** `public/app-v10.js` line 573:

```javascript
const _rppid = (lastPacket && lastPacketClaimId === selected?.id)
  ? (() => { try { return JSON.parse(lastPacket).packet_id || null } catch(e) { return null } })()
  : null;
```

Source is `JSON.parse(lastPacket).packet_id` — the current session packet, generated by `generateRunPack()`. The AI return JSON `parsed.packet_id` is only used in the advisory mismatch toast (earlier in the same function) and is never forwarded to the API. Correct.

### 12. Frontend only sends `packet_id` when `lastPacketClaimId === selected?.id`

**PASS.** The gate `lastPacket && lastPacketClaimId === selected?.id` matches the existing auto-expand gate and "Recreate Packet" gate. If the gate is false (no packet in session, or packet was built for a different claim), `_rppid = null` and the POST body includes `packet_id: null`. The backend stores `NULL`. No stale cross-claim packet ID can be forwarded.

### 13. Frontend still posts only to `/api/analysis`

**PASS.** The `await api('/api/analysis', ...)` call target is unchanged. No new routes added.

### 14. Parser behavior unchanged

**PASS.**
- `JSON.parse(text)` — still the primary parser (try/catch on line 573)
- `parsed.output || parsed.result || parsed.analysis || parsed` — still the field extraction fallback chain

Both confirmed present in the `saveAnalysisResult` function body.

### 15. Success/failure toasts unchanged

**PASS.**
- Success: `toast('Analysis saved — verdict shown in the Analysis section.')` — unchanged
- Failure: `toast(e.message || 'Could not save analysis')` — unchanged
- Parse failure: `return toast('Paste valid JSON first')` — unchanged
- Advisory: `toast('Advisory: AI return packet_id does not match current packet...')` — unchanged

### 16. D-271/D-272 AI-return import locks preserved

**PASS.** Confirmed present in `public/app-v10.js`:

| Lock | Status |
|------|--------|
| `rp-return-section` | Present in `renderExport()` |
| `Load AI Analysis Return` | Present in `renderExport()` |
| Auto-expand: `lastPacket&&lastPacketClaimId===selected?.id` | Unchanged in `renderExport()` |
| `rp-return-next-step` | Present in `renderExport()` |
| Paste AI/JSON guidance | Present in `rp-return-next-step` |
| `Saving does not publish a truth automatically` | Present in `rp-return-next-step` |

None of these are inside `saveAnalysisResult()` — they are in a separate render function and are untouched.

### 17. D-274 stale detection locks preserved

**PASS.** Confirmed present in `detectPacketStaleness()`:

| Lock | Status |
|------|--------|
| `source_snapshot_hash` check | Present |
| `simpleClaimHash(selected)` | Present |
| `'source snapshot changed'` pushed to `w[]` | Present |
| Stale threshold `3600000` | Present |

### 18. Review/moderation behavior unchanged

**PASS.** `requestApproveReview`, `requestRejectReview`, `cancelApproveReview`, `cancelRejectReview`, `reviewDecisionUI`, `inspectReviewItem` — all confirmed still defined in `public/app-v10.js`. None are referenced in the D-275B changes.

### 19. Public truth behavior unchanged

**PASS.** `saveAnalysisResult()` does not call `submitTruth`, `requestApproveReview`, or any public truth mutation. The `/api/analysis` route only writes to `analysis_results`. No truth state is changed.

### 20. Drift/Belief expansion files untouched

**PASS.**
- `public/belief-drift-expansion.js` — not in `git diff --stat main...HEAD`
- `public/index.html` — not in diff
- `public/styles.css` — not in diff

### 21. No Wrangler deploy or D1 migration apply command was run

**PASS.** Confirmed: no `wrangler deploy`, no `wrangler d1 migrations apply`, no `wrangler d1 execute` was run during D-275B or D-275C. The migration file is text only.

### 22. Merge/deploy/migration sequence identified

See **Owner-Approved Deployment Sequence** section below.

---

## Checks Run

| Check | Result |
|-------|--------|
| `git status --short` | clean — no uncommitted changes |
| `git branch --show-current` | `d275b-runpack-packet-id-storage` |
| `git log --oneline -5` | HEAD=`a219896` → `9095a55` → `e8639ab` → `470fec1` → `6c77650` |
| `git diff --stat main...HEAD` | 6 files, 436 insertions, 10 deletions — exactly D-275B files |
| `node --check public/app-v10.js` | exit 0 |
| `node --check src/worker.js` | exit 0 |
| `node --check src/analysis-results.js` | exit 0 |
| `hardening-smoke-test.mjs` | `3263 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Potential Notes (Non-Blockers)

### `packetId` now appears in `GET /api/claims/:id` response

`mapAnalysis()` now returns `packetId` in every analysis object. This is served by `GET /api/claims/:id` in the `analyses` array. This is **not a blocker** — `packet_id` is a non-sensitive metadata identifier with no personal or auth data. It was already echoed back to callers via the advisory mismatch toast in `saveAnalysisResult()`. The change simply makes it persistently queryable alongside the analysis result.

If the owner wants to restrict it to owner-only responses in a future task, that is a separate decision. It is not a correctness issue.

### `cleanText` preserves all printable characters including punctuation

`cleanText(body.packet_id || '', 80)` is safe for `rp_*` format IDs. If a malicious client submits a non-ID string, it will be stored but cannot cause SQL injection (parameterised query) and cannot cause XSS (not rendered in any HTML surface confirmed in this review).

---

## Owner-Approved Deployment Sequence

**Do NOT execute any of these steps without explicit owner approval.**

| Step | Action | Notes |
|------|--------|-------|
| 1 | Approve and merge branch `d275b-runpack-packet-id-storage` to `main` | Standard merge — no squash required |
| 2 | Apply D1 migration to live database | `ALTER TABLE analysis_results ADD COLUMN packet_id TEXT` via D1 console or Wrangler. Existing rows get `NULL` — no data loss. |
| 3 | Deploy Worker (includes updated `src/analysis-results.js`) | Migration must land before Worker deploy — Worker INSERT will fail if column doesn't exist |
| 4 | Deploy frontend (`public/app-v10.js`) | Can deploy with Worker in same deploy, or after. Frontend sending `packet_id: null` to old Worker is harmless (ignored). |
| 5 | Run post-deploy static checks | `hardening-smoke-test.mjs` → `3263 passed, 0 failed`; belief and route checks unchanged |
| 6 | Run live sanity | Verify: existing analysis saves still work; a new analysis save from a matching `lastPacket` includes `packet_id` in the stored result; no console errors; D-271/D-274 locks still visible |
| 7 | Close out with D-275D | Patch D-275B doc with live closeout section, update README, commit to main |

**Critical ordering constraint:** Step 2 (migration) must complete before Step 3 (Worker deploy). If the Worker is deployed before the migration, the INSERT will fail with `table analysis_results has no column named packet_id` on every `/api/analysis` POST.

---

## No-Touch Guarantees Confirmed

- `selectClaim`, `studyFromVault`, `attachEvidencePrompt` — not touched
- `inspectReviewItem`, `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`, `cancelApproveReview`, `cancelRejectReview` — not touched
- `public/belief-drift-expansion.js` — not touched
- `public/index.html` — not touched
- `public/styles.css` — not touched
- `src/worker.js` — not touched
- `wrangler.toml` — not touched
- No `alignment_labels` — permanently blocked
- No `top_beliefs_json` in any public API
