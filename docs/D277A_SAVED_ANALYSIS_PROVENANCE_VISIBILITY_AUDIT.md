# D-277A — Saved Analysis Provenance Visibility Audit

**Scope:** Audit only — docs only
**Status:** COMPLETE — no code changes, no deploy
**Branch:** main (direct commit)
**Baseline:** 3263 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn) — unchanged
**Files changed:** `docs/D277A_SAVED_ANALYSIS_PROVENANCE_VISIBILITY_AUDIT.md`, `docs/README.md`
**App changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Audit whether the RunPack provenance metadata now stored in `analysis_results.packet_id` (D-275D) should be visible in owner/private saved analysis views. Identify the smallest safe follow-up implementation if useful. Do not implement.

---

## Audit Findings

### Q1: Where are saved AI analysis results displayed in the current frontend?

Two locations:

**A. Study view — `sectionAnalyses()` in `public/app-v10.js` line 555**

The `analysis-panel` in `renderStudy()` calls `sectionAnalyses()`, which renders each saved analysis via `analysisItem(a)`. This panel is only visible in Study mode for authenticated users with access to the claim.

**B. Investigation Packet / RunPack panel — `renderExport()` line 452**

The `rp-return-section` contains the "Load AI Analysis Return" area (`sectionAnalyses()` is not called here — this is the *save* form, not the display). The count of saved analyses is shown in `runPackSummary()` as `<b>${an}</b> analyses`.

No other display surfaces were found.

---

### Q2: Does the owner/private claim detail route now receive `packetId` from `mapAnalysis()`?

**Yes.** `GET /api/claims/:id` calls `listAnalysisForClaim()`, which maps all rows through `mapAnalysis()`. As of D-275B, `mapAnalysis()` returns:

```javascript
packetId: a.packet_id || null,
```

Every analysis object in `selected.analyses` now carries `packetId`. Historical rows return `null`; new saves return the `rp_*` packet ID if one was stored.

---

### Q3: Where, if anywhere, is `packetId` currently rendered?

**Nowhere.** `analysisItem(a)` (line 466) renders:
- Verdict badge
- Source pill
- Legacy note (if applicable)
- Disclaimer: "AI analysis of supplied HumanX packet — not independent verification."
- Evidence/Test/Survive meters
- Plain language summary
- Collapsible Support / Pressure / Missing tests detail

`packetId` is received in the `a` object but **never read or rendered**. It is currently dead data in the frontend rendering layer.

---

### Q4: Is `packetId` exposed on public profile `/u/:slug`?

**No.** `loadPublicProfileSummary()` (`src/worker.js` line 589) returns only count aggregates — no analysis rows, no `packet_id`, no analysis fields of any kind. It never calls `listAnalysisForClaim()`. Confirmed in D-275C pre-merge review.

---

### Q5: Is `packetId` exposed in any public truth/profile UI?

**No.** The Truths panel (`renderTruths()`) renders truth cards only — no analysis data. The public profile frontend (`renderPublicProfile()`) uses `getPublicProfile()` which calls `loadPublicProfileSummary()` — count-only, as above. No truth UI reads `analysis_results` at all.

---

### Q6: Is `packetId` useful to show to the owner as provenance?

**Yes, marginally.** The `packetId` is an `rp_*`-format string that identifies the exact RunPack instance that was sent to the AI for this analysis. Surfacing it tells the owner:

1. **This analysis came from a tracked RunPack save** (not a manual paste from an unrelated session).
2. **It can be compared to future packets** — if the claim evidence has changed since, the stored ID belongs to a different snapshot generation.
3. **It provides audit trail linkage** — a future packet comparison feature could match stored `packet_id` values to detect analysis drift.

The value is primarily investigative-tool provenance, not end-user value. It is most useful for power users who track evidence evolution over time.

---

### Q7: Would showing `packetId` create any privacy/security issue?

**No.** `packet_id` is an opaque `rp_${claimId.slice(-6)}_${timestamp.toString(36)}` string. It contains:
- Last 6 chars of the claim ID (non-sensitive — claim IDs are public)
- A base-36 timestamp (non-sensitive)

No user PII, no session token, no authentication material. Displaying it in the owner-only Study view is safe. The field is already accessible to authenticated callers via `GET /api/claims/:id` — this would only make existing data visible in the UI.

---

### Q8: Should owner/private UI show a compact provenance line such as `Saved from RunPack: rp_...`?

**Yes, recommended — conditionally.** The recommended pattern for `analysisItem(a)`:

```
Saved from RunPack: rp_abc123_lc2x9k
```

As a `<p class="small ev-origin-note">` line, shown only when `a.packetId` is non-null. This is visually consistent with the existing disclaimer line (same class, same placement zone). It is compact, ignorable, and adds audit value without cluttering the card for historical analyses that have `packetId = null`.

---

### Q9: Should owner/private UI show packet provenance only when `packetId` exists?

**Yes, strictly conditional.** Historical analysis results (`packetId === null`) must not show any provenance line. The conditional must be:

```javascript
a.packetId ? `<p class="small ev-origin-note">Saved from RunPack: ${esc(a.packetId)}</p>` : ''
```

No fallback text, no empty placeholder. Null means the analysis predates F-5 storage — showing nothing is correct.

---

### Q10: Should public UI continue hiding packet provenance?

**Yes, absolutely.** Public profile, public truth cards, and all unauthenticated views must not expose `packet_id` or any RunPack provenance. This is consistent with D-275B regression locks (tests 13–15) confirming `packetId` is absent from `renderPublicProfileHtml`. No change needed or permitted.

---

### Q11: Would adding a private provenance line require backend changes, or can it be frontend-only?

**Frontend-only.** The backend already returns `packetId` in every analysis object from `GET /api/claims/:id` (`mapAnalysis()` — D-275B). No new route, no schema change, no new field. The frontend only needs to read `a.packetId` in `analysisItem()` and conditionally render a line. This is the same pattern as `a.plainLanguageSummary` or `a.source` — already present, just not displayed.

---

### Q12: Exact smallest safe D-277B implementation target

**File:** `public/app-v10.js` line 466 (`analysisItem()` function)

**Current return template (relevant excerpt):**
```javascript
<p class="small ev-origin-note">AI analysis of supplied HumanX packet — not independent verification.</p>
```

**Proposed change:** After the disclaimer `<p>`, add one conditional line:
```javascript
${a.packetId ? `<p class="small ev-origin-note">Saved from RunPack: ${esc(a.packetId)}</p>` : ''}
```

**Full insertion point:** Inside the `analysisItem()` return template, immediately after the `ev-origin-note` disclaimer paragraph and before the `<div class="meters">` block.

**No other file changes required.** No backend, no CSS, no worker, no migration, no test-file baseline changes beyond the new D-277B test block. `esc()` is already in scope — no new utility needed.

---

### Q13: Regression tests needed for D-277B (do not write yet)

The following test categories are needed in D-277B's smoke test block:

| # | Category | What to test |
|---|----------|-------------|
| 1 | Frontend | `analysisItem` renders `packetId` line when `packetId` is non-null |
| 2 | Frontend | `analysisItem` does not render provenance line when `packetId` is null |
| 3 | Frontend | Provenance line uses `ev-origin-note` class |
| 4 | Frontend | Provenance line is prefixed with `Saved from RunPack:` |
| 5 | Frontend | `esc()` is applied to `packetId` value (XSS guard) |
| 6 | Boundary | `renderPublicProfileHtml` does not contain `packet_id` or `packetId` (preserve D-275B lock) |
| 7 | Boundary | `renderPublicProfileHtml` does not contain `Saved from RunPack` |
| 8 | D-271 lock | `rp-return-section` auto-expand unchanged |
| 9 | D-271 lock | `Load AI Analysis Return` still present |
| 10 | D-274 lock | `source_snapshot_hash` check still in `detectPacketStaleness` |
| 11 | D-275 lock | `packet_id` in analysis INSERT still present |
| 12 | D-275 lock | `cleanText` (not `cleanId`) still used for packet ID sanitization |

Estimated baseline delta: +12 tests → 3263 + 12 = **3275 passed, 0 failed** (pending D-277B implementation).

---

### Q14: Review/moderation remains unaffected

**Confirmed.** The proposed change is isolated to `analysisItem()` in the Study view rendering path. Review queue rendering (`renderReview()`, `reviewCard()`, `renderReviewInspectPanel()`) never calls `analysisItem()` or `sectionAnalyses()`. No moderation route is affected.

---

### Q15: Public truth behavior remains unaffected

**Confirmed.** Truth cards (`truthCard()`) never read `analysis_results`. `renderTruths()` never calls `listAnalysisForClaim()` or `analysisItem()`. Public truth display is fully isolated from `packetId`.

---

### Q16: Drift/Belief expansion remains untouched

**Confirmed.** `public/belief-drift-expansion.js` is not involved in claim Study rendering, analysis display, or RunPack flows. The proposed D-277B change does not touch this file.

---

### Q17: Schema/API changes needed

**None.** `packetId` is already returned by `GET /api/claims/:id` via `mapAnalysis()` (D-275B). No new column, no new route, no migration needed. The D-277B implementation is purely additive frontend rendering of an already-available field.

---

## Existing Lock Confirmation

### D-271/D-272 AI-return import visibility locks

| Lock | Status |
|------|--------|
| `rp-return-section` auto-expand condition | `lastPacket&&lastPacketClaimId===selected?.id` — unchanged |
| `Load AI Analysis Return` | Present — unchanged |
| `rp-return-next-step` copy | Present — unchanged |
| No-auto-publish copy | Present — unchanged |
| `JSON.parse(text)` validation | Unchanged |
| `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` field extraction | Unchanged |
| `saveAnalysisResult` posts only to `/api/analysis` | Unchanged |

### D-274 snapshot-hash stale detection locks

| Lock | Status |
|------|--------|
| `detectPacketStaleness()` checks `meta.source_snapshot_hash` | Unchanged |
| Compares against `simpleClaimHash(selected)` | Unchanged |
| Returns `source snapshot changed` | Unchanged |
| Stale threshold `3600000ms` | Unchanged |
| Generated-time stale warning | Unchanged |
| Evidence/test count stale checks | Unchanged |

### D-275 packet-ID storage locks

| Lock | Status |
|------|--------|
| `analysis_results.packet_id` exists live | Applied D-275D |
| `/api/analysis` accepts optional `packet_id` | Unchanged |
| Backend uses `cleanText(..., 80)`, not `cleanId()` | Unchanged |
| `rp_*` underscore format preserved | Unchanged |
| `saveAnalysisResult()` sends `packet_id` from matching `lastPacket` | Unchanged |
| Frontend sends packet ID only when `lastPacketClaimId===selected?.id` | Unchanged |
| Missing `packet_id` remains allowed (null) | Unchanged |

---

## Summary and Recommended D-277B Target

| Question | Answer |
|----------|--------|
| Where are analyses displayed? | Study view `sectionAnalyses()` → `analysisItem()` (line 466) |
| Does `GET /api/claims/:id` return `packetId`? | **Yes** — since D-275B |
| Is `packetId` currently rendered anywhere? | **No** — received but not rendered |
| Is `packetId` exposed on public profile? | **No** — `loadPublicProfileSummary` never calls `listAnalysisForClaim` |
| Is `packetId` exposed in public truth UI? | **No** |
| Is showing `packetId` to owner useful? | **Yes** — audit trail for RunPack provenance |
| Privacy/security issue? | **None** — opaque timestamp+claimSlug string, no PII |
| Show compact provenance line? | **Yes** — `Saved from RunPack: rp_...` when non-null |
| Show only when `packetId` exists? | **Yes** — strictly conditional, null = no line |
| Public UI continues hiding provenance? | **Yes** — locked |
| Frontend-only? | **Yes** — no backend/schema/API changes needed |
| D-277B implementation target | `analysisItem()` line 466 — one conditional `<p>` insertion |
| Regression tests needed | ~12 tests; baseline delta 3263 → 3275 |
| Review/moderation affected? | **No** |
| Public truth behavior affected? | **No** |
| Drift/Belief expansion affected? | **No** |
| Schema/API changes needed? | **No** |

**D-277B is frontend-only and safe to implement.** Single-function change in `analysisItem()`. No backend, no migration, no CSS, no index.html. Estimated scope: 1 line added to the `analysisItem()` template, ~12 new smoke tests, README/docs update, direct-to-main commit. No deploy required beyond owner-initiated `wrangler deploy` (standard flow).

---

## No-Touch Confirmation

- `scripts/hardening-smoke-test.mjs` — not modified
- `public/app-v10.js` — not modified
- `public/styles.css` — not modified
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `src/analysis-results.js` — not modified
- `migrations/` — not modified
- All backend/API/auth/review/public-profile/CSP files — not modified
