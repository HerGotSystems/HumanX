# D-271A — RunPack AI-Return Import Visibility Polish

**Scope:** Frontend (`public/app-v10.js`) + tests + docs
**Status:** COMPLETE — owner deploy PASS (D-271B, 2026-07-01) — 32/32 live sanity PASS
**Baseline before:** 3144 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after:** 3171 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D271A_RUNPACK_AI_RETURN_IMPORT_VISIBILITY_POLISH.md`, `docs/README.md`
**App changes:** `public/app-v10.js` line 452 (`renderExport()`) only
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No — deployed (D-271B)

---

## Purpose

Addresses D-268A finding F-3: "Load AI Analysis Return" section in the Investigation Packet page (`renderExport()`) was always collapsed, making it easy to miss after generating a RunPack.

---

## Changes

### `public/app-v10.js` — line 452 (`renderExport()`)

**Two changes in `rp-return-section`:**

1. **Conditional `open` attribute** — `<details class="rp-return-section">` now auto-expands when a matching packet is loaded for the current claim:
   ```
   Before: <details class="rp-return-section">
   After:  <details class="rp-return-section"${lastPacket&&lastPacketClaimId===selected?.id?' open':''}>
   ```
   Condition: `lastPacket && lastPacketClaimId === selected?.id` — same gate used elsewhere in `renderExport()` to show "Recreate Packet" vs "Create Investigation Packet". This means the section is open immediately after packet generation and stays open on re-render while the packet is still loaded for that claim.

2. **Next-step copy** — replaced the generic Paste instruction with a class-anchored, actionable paragraph:
   ```
   Before: <p class="small">Paste the JSON result from your AI here to save it as a structured analysis for this claim.</p>
   After:  <p class="small rp-return-next-step">After your AI analyses the packet, paste its JSON response here. Saving does not publish a truth automatically — it only loads analysis for this claim.</p>
   ```
   The new copy:
   - Is actionable ("After your AI analyses the packet…")
   - Explicitly disclaims auto-publish ("Saving does not publish a truth automatically")
   - Clarifies scope ("it only loads analysis for this claim")
   - Carries `rp-return-next-step` class for test anchoring

No CSS changes needed — `open` is HTML-native, `rp-return-next-step` inherits `.small` styling.

---

## Deferred (still deferred after D-271A)

| Finding | Reason deferred |
|---------|----------------|
| F-4 — `source_snapshot_hash` stale check | Count-based check handles common case |
| F-5 — `packet_id` not stored with analysis | Requires backend schema decision |

---

## Tests Added (D-271A block — 27 tests)

| # | Category | What it checks |
|---|----------|---------------|
| 1 | Visibility | `Load AI Analysis Return` still in `renderExport` |
| 2 | Visibility | Conditional `open` attribute present on `rp-return-section` |
| 3 | Copy | `rp-return-next-step` class present |
| 4 | Copy | Next-step copy tells user to paste AI/JSON response |
| 5 | Copy | Next-step copy states saving does not publish a truth automatically |
| 6 | Provenance | `ev-origin-note` provenance copy unchanged |
| 7 | Structure | `analysisPaste` textarea still present |
| 8 | Structure | `Save Analysis` button still present |
| 9 | Parser lock | `saveAnalysisResult` still validates with `JSON.parse` |
| 10 | Parser lock | Field extraction (`parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed`) unchanged |
| 11 | Parser lock | Parse failure toast unchanged |
| 12 | Parser lock | Success toast unchanged |
| 13 | Privacy | `saveAnalysisResult` posts to `/api/analysis` only |
| 14 | D-268B lock | `rp-summary-generated` still in `runPackSummary` |
| 15 | D-268B lock | Fallback `instruction` still present |
| 16 | D-268B lock | Fallback `output_contract` still present |
| 17 | D-269A lock | Stale warning chip still in `runPackSummary` |
| 18 | D-269A lock | Stale threshold unchanged at `3600000ms` |
| 19 | D-269A lock | `source_snapshot_hash` not added (F-4 deferred) |
| 20 | Moderation | `requestApproveReview` still defined |
| 21 | Privacy | `rp-return-section` not in `renderPublicProfileHtml` |
| 22 | Privacy | `rp-return-next-step` not in `renderPublicProfileHtml` |
| 23 | Integrity | `belief-drift-expansion.js` not modified |
| 24 | Integrity | `worker.js` not modified |
| 25 | Integrity | `index.html` not modified |
| 26 | Integrity | `styles.css` not modified |
| 27 | F-5 deferred | `packet_id` advisory check still non-blocking |

---

## Behavior Guarantees Preserved

| Item | Status |
|------|--------|
| `selectClaim` | Unchanged |
| `saveAnalysisResult` parser | Unchanged — `JSON.parse`, field extraction, toasts |
| `packet_id` advisory check | Non-blocking toast — unchanged (F-5 deferred) |
| Public truth state | No change — posts to `/api/analysis` only |
| Review queue / moderation | Unchanged |
| `requestApproveReview` / `requestRejectReview` | Still defined |
| `renderPublicProfileHtml` | `rp-return-section` and `rp-return-next-step` absent |
| `runPackSummary` | Unchanged except `rp-return-section` not in it — it's in `renderExport` |
| `rpRelativeTime` | Unchanged |
| `detectPacketStaleness` | Unchanged (3600000ms threshold) |
| Fallback `instruction` + `output_contract` | Unchanged (D-268B) |
| Drift/Belief expansion files | Not touched |
| `src/worker.js` | Not touched |
| `public/index.html` | Not touched |
| `public/styles.css` | Not touched |
| No backend/API/migration/schema/CSP changes | Confirmed |

---

## No-Touch Guarantees

- `selectClaim`, `studyFromVault`, `attachEvidencePrompt` — not touched
- `inspectReviewItem`, `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`, `cancelApproveReview`, `cancelRejectReview` — not touched
- `public/belief-drift-expansion.js` — not touched
- `public/index.html` — not touched
- `public/styles.css` — not touched
- `src/worker.js` — not touched
- `wrangler.toml` — not touched
- No `alignment_labels` — permanently blocked
- No `top_beliefs_json` in any public API

---

## D-271B — Live Closeout (2026-07-01)

**Owner deploy:** PASS
**Live RunPack AI-return import visibility sanity:** PASS — 32/32

### Post-deploy static checks

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3171 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

### Live sanity results (32/32 PASS)

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opened after deploy | PASS |
| 2 | Claim/RunPack area opens without console-breaking errors | PASS |
| 3 | Existing claim can be loaded | PASS |
| 4 | RunPack/Investigation Packet can be generated or displayed | PASS |
| 5 | When a matching RunPack is loaded, "Load AI Analysis Return" is visible/expanded | PASS |
| 6 | AI-return section does not require user to notice and manually open a hidden collapsed section | PASS |
| 7 | New next-step copy appears near the import area | PASS |
| 8 | New copy tells the user to paste the AI/JSON return | PASS |
| 9 | New copy clearly says it does not publish a truth automatically | PASS |
| 10 | Import textarea/input still appears | PASS |
| 11 | Existing accepted input format unchanged | PASS |
| 12 | Parser behavior unchanged | PASS |
| 13 | Parse success behavior unchanged | PASS |
| 14 | Parse failure behavior unchanged | PASS |
| 15 | `saveAnalysisResult` behavior unchanged | PASS |
| 16 | Public truth state unchanged | PASS |
| 17 | Review queue behavior unchanged | PASS |
| 18 | Review/moderation behavior unchanged | PASS |
| 19 | Generated-time summary still appears when `generated_at` exists | PASS |
| 20 | Generated-time copy still human-readable | PASS |
| 21 | Fallback packet `instruction` still present | PASS |
| 22 | Fallback packet `output_contract` still present | PASS |
| 23 | Stale warning still appears when packet is stale | PASS |
| 24 | Stale threshold behavior unchanged | PASS |
| 25 | F-4 snapshot-hash stale detection still deferred | PASS |
| 26 | F-5 packet-ID storage still deferred | PASS |
| 27 | Packet copy/download behavior unchanged | PASS |
| 28 | Backend RunPack generation unchanged | PASS |
| 29 | Public profile pages unaffected | PASS |
| 30 | Drift/Belief expansion surfaces still load normally | PASS |
| 31 | No backend/API behavior changed | PASS |
| 32 | No console errors | PASS |

### Confirmed guarantees (post-deploy)

- `rp-return-section` auto-expands when matching RunPack loaded: `lastPacket && lastPacketClaimId === selected?.id`
- `rp-return-next-step` copy present and visible
- Copy tells user to paste AI/JSON return
- Copy states "Saving does not publish a truth automatically"
- `saveAnalysisResult` JSON.parse validation unchanged
- `saveAnalysisResult` field extraction unchanged (`parsed.output||parsed.result||parsed.analysis||parsed`)
- `saveAnalysisResult` parse failure toast unchanged ("Paste valid JSON first")
- `saveAnalysisResult` success toast unchanged ("Analysis saved")
- `saveAnalysisResult` posts to `/api/analysis` only — public truth state unchanged
- Review/moderation unchanged — `requestApproveReview` / `requestRejectReview` untouched
- `rp-summary-generated` still emitted by `runPackSummary`
- Fallback `instruction` preserved (emotionally-important/unpopular/no-independent-verification warnings)
- Fallback `output_contract` preserved (all 10 fields + no-invent-evidence warning)
- Stale warning chip preserved; threshold `3600000ms` unchanged
- F-4 (`source_snapshot_hash` stale) remains deferred
- F-5 (`packet_id` storage) remains deferred
- `rp-return-section` and `rp-return-next-step` absent from `renderPublicProfileHtml`
- `public/belief-drift-expansion.js` unchanged
- `src/worker.js` unchanged
- `public/index.html` unchanged
- `public/styles.css` unchanged
- No backend/API/migration/schema/CSP/external asset changes
