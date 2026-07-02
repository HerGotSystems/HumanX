# D-284A — Truth Drafting and Review Workflow Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3317 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-284A:** `e6ab0d0`
**Files changed:** `docs/D284A_TRUTH_DRAFTING_AND_REVIEW_WORKFLOW_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`

---

## Purpose

Closes the D-283 Truth drafting and review workflow audit arc. Records the audit conclusion, all guarantees, all no-touch locks, and the confirmed structural state of the Truth creation → Review gate as a single durable checkpoint. Future Truth workflow work starts from this document.

---

## D-283A Audit Conclusion

The Truth creation and Review gate are **structurally sound**.

- Three frontend creation paths all produce `review_state='review'`.
- No path creates a Truth with `review_state='public'` directly.
- Admin-only Review queue handles approval and rejection.
- No saved-analysis path connects to Truth submission.
- All UI copy accurately reflects the Review gate.
- One LOW finding (F-1): owner has no way to see their own pending-Review truths after submission. No immediate fix because a useful fix likely requires a backend query/API change.

---

## D-283 Guarantees (Live State)

### Truth creation paths

| Path | Frontend function | API call | `review_state` on creation |
|------|------------------|----------|-----------------------------|
| Truths view "Add a public Truth" form | `submitTruth()` | `POST /api/truths` | `'review'` |
| Claim Builder (step 3, route=`truth`) | `submitBuilderTruth()` | `POST /api/truths` | `'review'` |
| Drift/Belief snapshot promote | `promoteBelief(snapshotId, 'truth')` | `POST /api/belief-promote` | `'review'` |

**`convertTruth()` is NOT a Truth creation path.** It converts an existing Truth to a Claim via `POST /api/truth-to-claim`.

### Review gate

| Guarantee | Value |
|-----------|-------|
| New Truths always enter Review | Yes — `createTruth()` in `src/truths.js` inserts with `review_state='review'` |
| Truth can be directly created as public | No |
| Truth approval route | `POST /api/review/decision` with `decision='public'` — admin only |
| Truth rejection route | `POST /api/review/decision` with `decision='rejected'` — admin only |
| Archive route | `POST /api/review/decision` (reject) + `POST /api/review/cleanup` — admin only |
| Non-admin can approve/reject | No |
| Non-admin can see Review queue | No |

### Saved analysis ↔ Truth boundary

| Guarantee | Value |
|-----------|-------|
| `saveAnalysisResult()` route | Posts only to `POST /api/analysis` |
| Saving analysis creates a Truth | No |
| Saving analysis submits to Review | No |
| Saving analysis approves/publishes a Truth | No |
| Any UI path turns analysis into public Truth automatically | No |
| `sectionAnalyses()` no-auto-publish copy | `"Saving analysis does not publish a truth automatically — it only stores private analysis for this claim."` |
| `analysisItem()` private note | `"Private analysis note — not public truth."` |

### Copy accuracy

| Location | Copy | Accurate |
|----------|------|----------|
| `submitTruth()` toast | `"Truth submitted for Review. It will appear publicly after approval."` | Yes |
| `submitBuilderTruth()` toast | `"Saved as Truth for Review. It will appear publicly after approval."` | Yes |
| `promoteBelief('truth')` toast | `"Truth promoted to Review. It will appear publicly after approval."` | Yes |
| `renderTruths()` submit button | `"Submit Truth for Review"` | Yes |
| `renderTruths()` review note | `"Enters Review before going public."` | Yes |
| `helperText()` truths mode | `"Added truths enter Review before going public."` | Yes |

### LOW finding (F-1) — Owner pending-Review visibility

**Finding:** After submitting a Truth, the owner receives only a toast confirmation. No UI shows the owner their pending-Review truths. `GET /api/me` truths query filters to `review_state='public'` only. The Truths tab (`renderTruths`) shows only public truths to non-admins.

**Decision:** No immediate fix. A useful fix likely requires a backend query change (`review_state IN ('review', 'public')` filtered by `user_id`) and a new frontend render path for pending-status cards. This is backend/API branch-required and should be audited first.

---

## Future Truth Workflow Rules

| Rule | Rationale |
|------|-----------|
| Truth creation must continue to route through Review | All three creation paths produce `review_state='review'`; this gate must not be bypassed |
| Saved analysis must never auto-publish a Truth | `saveAnalysisResult()` must not call `POST /api/truths` or any approve/publish route without audit + owner approval |
| Owner pending-Review visibility likely needs backend/API audit before implementation | `GET /api/me` truths query currently filters to `public` only; changing this touches a backend query and requires branch/PR workflow |
| Any "analysis → Truth" workflow must be explicit draft/submission flow, not auto-publish | Any future affordance must be prefill-only, require explicit owner confirmation before `POST /api/truths`, and add public-boundary non-exposure tests |

---

## Preserved Previous Locks

### D-271/D-272 AI-return import visibility

| Lock | Value |
|------|-------|
| `rp-return-section` | Present in `renderExport()` |
| `Load AI Analysis Return` title | Present |
| Auto-expand condition | `lastPacket && lastPacketClaimId === selected?.id` |
| No-auto-publish guidance | `"Saving does not publish a truth automatically"` |
| `saveAnalysisResult()` JSON.parse validation | Preserved |
| `saveAnalysisResult()` field extraction | `parsed.output \|\| parsed.result \|\| parsed.analysis \|\| parsed` |
| `saveAnalysisResult()` route | Posts only to `/api/analysis` |

### D-274/D-279 stale detection

| Lock | Value |
|------|-------|
| `detectPacketStaleness()` check | `meta.source_snapshot_hash != null && simpleClaimHash(selected) !== meta.source_snapshot_hash` |
| Stale reason pushed | `'claim updated since packet'` |
| Stale threshold | `3600000ms` |
| Evidence/test/pressure count checks | Preserved |
| Generated-time stale check | Preserved |

### D-275 packet-ID storage

| Lock | Value |
|------|-------|
| `analysis_results.packet_id TEXT` live | Yes — nullable column; `0017` migration applied |
| `/api/analysis` accepts optional `packet_id` | Yes |
| Backend sanitizer | `cleanText(body.packet_id \|\| '', 80) \|\| null` — NOT `cleanId()` |
| `rp_*` underscore format | Preserved |
| `saveAnalysisResult()` sends `packet_id` from matching `lastPacket` | Preserved |
| Frontend gate | `lastPacketClaimId === selected?.id` |

### D-277/D-281 saved-analysis boundary

| Lock | Value |
|------|-------|
| Owner provenance line | `"Saved from RunPack: ${esc(a.packetId)}"` conditional on `a.packetId` |
| `sectionAnalyses()` no-auto-publish copy | `"Saving analysis does not publish a truth automatically — it only stores private analysis for this claim."` |
| `analysisItem()` private note | `"Private analysis note — not public truth."` |
| Public profile exposure of private/no-auto-publish copy | None |
| Public profile exposure of `Saved from RunPack` | None |
| Public profile exposure of `packetId` | None |

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |
| `scripts/hardening-smoke-test.mjs` | Not modified |
| Backend/API/schema/storage | No changes |
| Review/moderation handlers | Unchanged |
| Public profile `/u/:slug` | Unaffected |
| Drift/Belief expansion | Unaffected |

---

## Truth Drafting/Review Arc Completion State

| Item | Status |
|------|--------|
| Truth creation paths inventory | **COMPLETE** — D-283A; three paths confirmed, all produce `review_state='review'` |
| Review gate confirmation | **COMPLETE** — D-283A; admin-only, no bypass path exists |
| Saved analysis ↔ Truth boundary | **COMPLETE** — D-281B/C (copy) + D-283A (structural); boundary sound |
| Copy accuracy | **COMPLETE** — D-283A; all toast/button/helperText copy accurate |
| F-1 owner pending-Review visibility | **Deferred** — requires backend/API audit + branch/PR workflow |

Next Truth workflow work should be audit-first. Any owner pending-Review visibility work or analysis-assisted drafting must start with an audit task before any implementation.

---

## Static Checks (D-284A)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3317 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-283A | No | Audit / docs only |
| D-284A | No | Docs only |

**No deploy needed.** Baseline unchanged: 3317/0/24/57.
