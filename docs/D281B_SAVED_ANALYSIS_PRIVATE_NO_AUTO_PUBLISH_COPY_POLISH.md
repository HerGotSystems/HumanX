# D-281B — Saved Analysis Private / No-Auto-Publish Copy Polish

**Scope:** Frontend (`public/app-v10.js`) + tests + docs
**Status:** COMPLETE — owner deploy PASS (D-281C, 2026-07-02) — 25/25 live sanity PASS
**Branch:** main (direct commit)
**Baseline before:** 3298 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after:** 3317 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**New tests:** +19 (D-281B block)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D281B_SAVED_ANALYSIS_PRIVATE_NO_AUTO_PUBLISH_COPY_POLISH.md`, `docs/README.md`
**App changes:** `public/app-v10.js` — copy-only in `sectionAnalyses()` and `analysisItem()`
**CSS changes:** None
**Worker changes:** None — `src/worker.js` not modified
**Backend changes:** None — `src/analysis-results.js` not modified
**Schema/migration changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No — deployed (D-281C, 2026-07-02)
**Deployed Worker version:** not captured

---

## D-281A Findings Addressed

### F-1 MEDIUM — No-auto-publish copy absent from Study view Analysis panel

**Finding:** The explicit "Saving does not publish a truth automatically" copy existed only in the RunPack panel (`rp-return-next-step` in `renderExport()`). A user saving analysis via the Study view Analysis panel (`sectionAnalyses()`) saw only the milder "Save the result as one interpretation, not as a verdict" copy — not the explicit no-auto-publish statement.

**Fix:** Added a new `<p class="small ev-origin-note">` to `sectionAnalyses()` immediately before the textarea.

### F-2 LOW — Saved analysis card lacked explicit private/public-boundary label

**Finding:** `analysisItem()` said "not independent verification" but gave no explicit signal that the analysis is private to the owner and not visible to others.

**Fix:** Added a new `<p class="small ev-origin-note">` to `analysisItem()` immediately after the existing disclaimer.

---

## Exact Copy Added

### `sectionAnalyses()` (Study view Analysis form)

Added after existing `ev-origin-note` paragraph, before `<textarea id="analysisPaste"`:

```html
<p class="small ev-origin-note">Saving analysis does not publish a truth automatically — it only stores private analysis for this claim.</p>
```

### `analysisItem()` (saved analysis card)

Added after `"AI analysis of supplied HumanX packet — not independent verification."` line, before `${a.packetId?...}`:

```html
<p class="small ev-origin-note">Private analysis note — not public truth.</p>
```

---

## What Is Unchanged

| Item | Status |
|------|--------|
| `saveAnalysisResult()` route — posts only to `/api/analysis` | Unchanged |
| `saveAnalysisResult()` JSON.parse validation | Unchanged |
| `saveAnalysisResult()` field extraction | Unchanged |
| `saveAnalysisResult()` packet_id gating on `lastPacketClaimId===selected?.id` | Unchanged |
| `rp-return-next-step` copy in RunPack panel | Unchanged |
| `"Saving does not publish a truth automatically"` in RunPack panel | Unchanged |
| `analysisItem()` "not independent verification" disclaimer | Unchanged |
| `analysisItem()` `Saved from RunPack: ${esc(a.packetId)}` provenance line | Unchanged |
| `detectPacketStaleness()` — `claim updated since packet` | Unchanged |
| Stale threshold `3600000ms` | Unchanged |
| All D-271/D-272/D-274/D-275/D-277/D-279 locks | Preserved |

---

## No Backend / Schema / API / Storage Changes

- `src/analysis-results.js` — not modified
- `src/worker.js` — not modified
- `migrations/` — not modified
- `GET /api/claims/:id` — unchanged
- `POST /api/analysis` — unchanged

---

## No CSS Changes

- `public/styles.css` — not modified
- `public/index.html` — not modified
- Both new lines use existing `ev-origin-note` class only

---

## Smoke Test Changes

### New D-281B block (19 tests)

| # | Category | What is tested |
|---|----------|---------------|
| 1 | Copy | `sectionAnalyses` contains explicit no-auto-publish copy |
| 2 | Copy | `sectionAnalyses` no-auto-publish copy says saving analysis does not publish a truth |
| 3 | Copy | `sectionAnalyses` copy says it stores private analysis for the claim |
| 4 | Copy | `analysisItem` contains private-analysis note |
| 5 | Copy | `analysisItem` private note says not public truth |
| 6 | CSS | New copy uses existing `ev-origin-note` class only (no new CSS class) |
| 7 | CSS | `styles.css` not modified |
| 8 | Behavior | `saveAnalysisResult` posts only to `/api/analysis` |
| 9 | Behavior | `saveAnalysisResult` does not call Truth/review/publish routes |
| 10 | Public boundary | Public profile does not expose new no-auto-publish copy |
| 11 | Public boundary | Public profile does not expose saved analysis metadata |
| 12 | Public boundary | Public profile does not expose `not public truth` copy |
| 13 | D-271 lock | `rp-return-section` still present in `renderExport` |
| 14 | D-271 lock | `"Load AI Analysis Return"` still present |
| 15 | D-272 lock | `"Saving does not publish a truth automatically"` still in `rp-return-next-step` |
| 16 | D-274/D-279 lock | `"claim updated since packet"` still in `detectPacketStaleness` |
| 17 | D-275 lock | `packet_id` gated on `lastPacketClaimId===selected?.id` |
| 18 | D-277 lock | `analysisItem` still renders `Saved from RunPack:` provenance line |
| 19 | D-277 lock | Public profile does not expose `Saved from RunPack` |

D-93B allowlist updated at both occurrences: `3298 passed, 0 failed` → `3317 passed, 0 failed`.

---

## Checks Run

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3317 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## No-Touch Guarantees

- `public/styles.css` — not modified
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `src/analysis-results.js` — not modified
- `migrations/` — not modified
- `wrangler.toml` — not modified
- Review/moderation handlers — not modified
- Public profile rendering — not modified
- No `alignment_labels` — permanently blocked
- No `top_beliefs_json` in any public API

---

## D-281C — Live Closeout (2026-07-02)

**Owner deploy:** PASS — `npx wrangler deploy`
**Deployed Worker version:** not captured
**Live sanity:** PASS — 25/25

### Post-deploy static checks

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3317 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

### Live sanity results (25/25 PASS)

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Study/claim detail area opens without console-breaking errors | PASS |
| 3 | Existing claim can be selected | PASS |
| 4 | Saved analysis form still renders | PASS |
| 5 | New form copy: `Saving analysis does not publish a truth automatically — it only stores private analysis for this claim.` | PASS |
| 6 | Saved analysis still saves normally | PASS |
| 7 | `saveAnalysisResult()` still posts only to `/api/analysis` | PASS |
| 8 | Saving analysis does not create, submit, approve, or publish a Truth | PASS |
| 9 | Saved analysis cards still render | PASS |
| 10 | New card copy: `Private analysis note — not public truth.` | PASS |
| 11 | Existing saved-analysis disclaimer still appears | PASS |
| 12 | Saved-analysis provenance still appears when `packetId` exists: `Saved from RunPack: rp_...` | PASS |
| 13 | Saved-analysis provenance absent when `packetId` absent | PASS |
| 14 | Public profile `/u/:slug` does not expose private/no-auto-publish copy | PASS |
| 15 | Public profile `/u/:slug` does not expose `Saved from RunPack` | PASS |
| 16 | Public profile `/u/:slug` does not expose `packetId` | PASS |
| 17 | Public truth behavior unchanged | PASS |
| 18 | Review/moderation unchanged | PASS |
| 19 | AI-return import area still works (`rp-return-section`, `Load AI Analysis Return`, `rp-return-next-step`, `Saving does not publish a truth automatically`) | PASS |
| 20 | Parser behavior unchanged (`JSON.parse`, `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed`) | PASS |
| 21 | Stale detection still works: `claim updated since packet` | PASS |
| 22 | D-275 packet-ID save behavior still works | PASS |
| 23 | Drift/Belief expansion unaffected | PASS |
| 24 | No backend/API/schema/storage behavior changed | PASS |
| 25 | No console errors | PASS |
