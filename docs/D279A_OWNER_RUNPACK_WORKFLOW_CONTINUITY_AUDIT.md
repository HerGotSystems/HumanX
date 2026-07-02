# D-279A — Owner RunPack Workflow Continuity Audit

**Scope:** Audit only — docs only
**Status:** COMPLETE — no code changes, no deploy
**Branch:** main (direct commit)
**Baseline:** 3288 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn) — unchanged
**Files changed:** `docs/D279A_OWNER_RUNPACK_WORKFLOW_CONTINUITY_AUDIT.md`, `docs/README.md`
**App changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Audit the full owner/private RunPack workflow now that F-3 (AI-return import), F-4 (stale detection), F-5 (packet-ID storage), and D-277 (saved-analysis provenance visibility) are all live. Identify whether any gap remains, and determine the smallest safe next improvement.

---

## Current Workflow Map

The owner workflow as implemented:

| Step | Location | Mechanism |
|------|----------|-----------|
| 1. Select/load claim | Claims tab → Study mode | `selectClaim(id)` → `renderStudy()` |
| 2. Generate RunPack | Study header "Build RunPack" or Export tab | `generateRunPack()` → `lastPacket`, `lastPacketMeta`, `lastPacketClaimId` |
| 3. See generated-time summary | RunPack summary row | `rpRelativeTime(lastPacketMeta.generated_at)` in `runPackSummary()` |
| 4. See stale warnings | RunPack status chip | `detectPacketStaleness()` → `rp-status-warn` chip + hint |
| 5. Copy/download packet | Export tab buttons | `copyAIP()` / `downloadRunPack()` |
| 6. Send to AI | User action (external) | No app involvement |
| 7. Return to HumanX | — | — |
| 8. `Load AI Analysis Return` auto-expanded | Export tab `rp-return-section` | `lastPacket && lastPacketClaimId === selected?.id` attribute |
| 9. Paste AI/JSON return | `analysisPaste` textarea | `JSON.parse(text)` validation |
| 10. Save analysis | `Save Analysis` button | `saveAnalysisResult()` → POST `/api/analysis` with `packet_id` |
| 11. `packet_id` preserved | D1 `analysis_results.packet_id` | `cleanText(body.packet_id, 80)` in `addAnalysisResult()` |
| 12. Reload and display | `selectClaim()` re-fetch | `sectionAnalyses()` → `analysisItem()` per saved result |
| 13. Owner/private provenance | `analysisItem()` | `a.packetId ? <p>Saved from RunPack: ${esc(a.packetId)}</p> : ''` |
| 14. Public surfaces unaffected | `renderPublicProfileHtml`, `truthCard()` | Never call `listAnalysisForClaim()` or `analysisItem()` |

---

## Audit Questions

### Q1: Is the owner workflow logically complete from packet generation to saved analysis provenance?

**Yes — logically complete.** Every link in the chain is implemented:
- Packet generation stores `packet_id` and `source_snapshot_hash` in the session
- Stale detection fires before the user sends the packet
- AI-return import section auto-expands when the correct packet is loaded
- Saving stores `packet_id` and reloads the claim
- Saved analysis displays verdict, scores, summary, and provenance line

No structural gap exists in the workflow. The workflow now has a clear beginning (generate), middle (send → import), and end (save → display provenance).

---

### Q2: Is there any remaining confusing step where the user might not know what to do next?

**Minor friction remains at one transition:** after step 6 (send to AI), the user must navigate back to the Export tab and find the `Load AI Analysis Return` section. The section auto-expands only if `lastPacket && lastPacketClaimId === selected?.id` — which is correct, but if the user navigated away and back (e.g., went to Claims tab to re-select the claim, triggering a page reload), `lastPacket` survives in JS memory but `lastPacketClaimId === selected?.id` must re-match.

This is not a bug — it is working as designed. The user who keeps the claim selected and returns to the Export tab will see the section auto-expanded. The friction is low. No immediate fix needed.

**One edge case:** if the user generates a packet in the Study panel (via "Build RunPack"), then navigates to the Export tab, they see `rp-return-section` auto-expanded and the workflow guide. Both the Study `analysisPaste` textarea and the Export `analysisPaste` textarea independently trigger `saveAnalysisResult()`. This is a duplicate entry point — both work correctly — but the user may not know which one to use. The Study panel's section says "Click Build RunPack in the claim header → paste into any AI → paste the JSON result here." The Export tab has the full workflow guide and is the primary surface.

**Finding F-1 (minor, informational):** Two independent `analysisPaste` save forms exist — one in `sectionAnalyses()` (Study view) and one in `renderExport()` (Export tab). Both call `saveAnalysisResult()`. They are functionally identical and both work correctly. No UX confusion has been reported, and the Study form has its own micro-CTA. This is not a blocking issue but could be noted for future consolidation if confusion is observed.

---

### Q3: Is the stale-warning language clear enough for ordinary users?

**Mostly yes, with one opaque warning.** The stale warnings produced by `detectPacketStaleness()` are:

| Warning | Clarity |
|---------|---------|
| `evidence count changed` | Clear — self-explanatory |
| `pressure count changed` | Clear — self-explanatory |
| `test count changed` | Clear — self-explanatory |
| `packet is Nh old` | Clear — time is concrete |
| `source snapshot changed` | **Opaque** — most users will not know what "source snapshot" means |

`source snapshot changed` refers to a change in `simpleClaimHash(selected)` vs `meta.source_snapshot_hash` — i.e., the claim's evidence/pressure/test count or `updated_at` has changed since the packet was built. This is a meaningful signal but the terminology is technical/internal.

**Finding F-2 (minor, copy):** `source snapshot changed` is not user-facing friendly. A clearer label would be `claim data changed` or `claim updated since packet was built`. This is a frontend-only copy fix confined to `detectPacketStaleness()`. It requires no backend/schema change. However, `source snapshot changed` is regression-locked in D-274B, D-275B, and D-277B tests — any rename must update those tests.

---

### Q4: Is the `source snapshot changed` warning visible in the right place?

**Yes.** The stale status appears as `Possibly stale — source snapshot changed` in the `rp-status-chip` chip inside `runPackSummary()`, which renders on the Export tab immediately above the action buttons. The chip is styled with `rp-status-warn` (amber). The hint text reads: `Rebuild the packet to capture the latest evidence and pressure.`

Placement is correct — visible before the user copies or downloads the packet. No placement issue.

---

### Q5: Is the saved-analysis provenance line useful enough as-is?

**Yes, for its current purpose.** It gives the owner a non-null reference to the packet that produced a given saved analysis result. For power users tracking evidence evolution over time, this is meaningful. For casual owners with one or two saved results, it is ignorable (small, `ev-origin-note` style).

No enhancement needed at this time.

---

### Q6: Should the UI show a stronger "this analysis came from an older packet" warning beside saved analyses?

**Not at this time.** The current provenance line (`Saved from RunPack: rp_...`) records the originating packet ID. A "stale analysis" warning beside saved analyses would require comparing the stored `packet_id`'s `source_snapshot_hash` against the current claim state — which would require storing the snapshot hash on the analysis result row (a new column), not just the packet ID. That is a meaningful scope expansion (backend/schema/migration) and is not warranted by current UX friction.

The packet-level stale warning in `runPackSummary()` already tells the owner their loaded packet may be outdated before they paste the return. That is the right moment for the warning — pre-save, not post-save.

**Finding F-3 (future lane, backend-required):** A per-analysis "based on outdated packet" badge would require a new `analysis_results.source_snapshot_hash` column and join logic. Audit-first if this becomes desired. Not recommended for D-279B.

---

### Q7: Is there any risk that users think saving analysis publishes a truth?

**Risk is mitigated, not eliminated.** Two independent disclosures address this:

1. In `renderExport()` → `rp-return-section`:
   > `Saving does not publish a truth automatically — it only loads analysis for this claim.`

2. In `sectionAnalyses()` (Study view):
   > `The AI reads the evidence you submitted — not independent external sources. Save the result as one interpretation, not as a verdict. Do not treat it as verification unless external sources are independently checked.`

3. In `analysisItem()`:
   > `AI analysis of supplied HumanX packet — not independent verification.`

These are consistent and layered. The risk of misunderstanding is low. No additional warning needed.

---

### Q8: Is there any duplicate or conflicting guidance around AI-return import?

**Minor:** The advisory toast in `saveAnalysisResult()` reads:
> `Advisory: AI return packet_id does not match current packet — analysis may be from an earlier build.`

This fires only when the pasted JSON has a `packet_id` field that differs from the loaded `lastPacket`'s `packet_id`. It is non-blocking. The toast is useful for power users but may be confusing for ordinary users who won't know what "packet_id" is.

**Finding F-4 (minor, copy):** The advisory toast references `packet_id` directly — a technical internal field. A more user-facing version would be: `Advisory: AI response was built from a different packet — analysis may not reflect current evidence.` This is frontend-only and confined to `saveAnalysisResult()`.

---

### Q9: Does the owner/private flow remain separate from Review/moderation?

**Yes, confirmed.** `saveAnalysisResult()` posts to `/api/analysis` only. It never calls `/api/review/decision`, `requestApproveReview()`, or `requestRejectReview()`. Analysis save does not change `review_state` on the claim. The Review queue is driven by `loadReviewQueue()` and `renderReview()` — entirely separate rendering paths with no overlap.

---

### Q10: Does public profile `/u/:slug` remain separate from owner/private analysis metadata?

**Yes, confirmed.** `loadPublicProfileSummary()` uses count-only queries (`publicContentCount()`). It never calls `listAnalysisForClaim()`. The frontend `renderPublicProfileHtml` (called from the Belief Engine or public profile page) never calls `sectionAnalyses()` or `analysisItem()`. D-277B regression tests 8–9 lock this boundary.

---

### Q11: Does the workflow need a frontend-only copy/wording polish next?

**Yes — one clear candidate.** F-2 and F-4 above both identify copy changes that would reduce jargon for ordinary users:

- **F-2:** `source snapshot changed` → something like `claim data changed` (in `detectPacketStaleness()`)
- **F-4:** Advisory toast `packet_id does not match` → plain-English version (in `saveAnalysisResult()`)

Both are frontend-only and require no backend/schema changes. Both require updating the regression tests that lock the current wording. F-2 requires updating the D-274B, D-275B, and D-277B smoke tests that assert `source snapshot changed`.

**F-2 is the stronger candidate** — stale warnings are the primary user-facing signal in the workflow. The advisory toast (F-4) is secondary and fires rarely.

---

### Q12: Does the workflow need a backend/storage change next?

**No backend change is needed for the immediate next step.** F-3 (per-analysis stale badge) is the only backend-requiring finding, and it is not warranted by current UX friction. All other findings are copy-level or frontend-only.

---

### Q13: Smallest safe D-279B candidate

**Recommended: F-2 — rename `source snapshot changed` to clearer user-facing language.**

Specifically: change the string pushed in `detectPacketStaleness()` from `'source snapshot changed'` to `'claim data changed since packet was built'` (or shorter: `'claim updated since packet'`).

This is a single string change in one function in `public/app-v10.js`. No backend, no schema, no CSS. However, it requires updating all regression tests that assert the old string — currently 4 tests in D-274B block, 2 in D-275B block, and 2 in D-277B block (total ~8 test assertions). The D-93B baseline will not change (string replacement in smoke tests doesn't add new `test()` calls, only changes assertion strings inside existing tests).

**Alternative (also viable):** Fix the advisory toast language (F-4) instead — simpler, no locked tests need updating. But F-2 is higher-value since stale warnings are pre-action signals visible to all owners.

---

### Q14: D-279B classification

**Frontend-only** — no backend/schema/API/migration changes required.

If the test wording updates are included, this is:
- `public/app-v10.js` — one string change in `detectPacketStaleness()`
- `scripts/hardening-smoke-test.mjs` — update ~8 existing test assertion strings (no new `test()` calls, no baseline count change)
- Docs + README

The D-93B baseline count will **not change** — the existing `test()` calls remain, only their inner `assert.ok` string patterns change. The hardening smoke baseline stays at `3288 passed, 0 failed`.

---

### Q15: Regression tests needed for D-279B

The following **existing tests** need their assertion strings updated (not new tests — count stays 3288):

| Test file | Block | Test label | Change needed |
|-----------|-------|-----------|---------------|
| `hardening-smoke-test.mjs` | D-274B | `detectPacketStaleness pushes "source snapshot changed"` | Update to new string |
| `hardening-smoke-test.mjs` | D-274B | any assert checking `'source snapshot changed'` | Update to new string |
| `hardening-smoke-test.mjs` | D-275B | `D-275B: detectPacketStaleness pushes "source snapshot changed"` | Update to new string |
| `hardening-smoke-test.mjs` | D-277B | `D-277B [D-274 lock]: detectPacketStaleness still pushes "source snapshot changed"` | Update to new string |

New tests needed (new `test()` calls, will increase baseline):
1. `detectPacketStaleness` pushes new user-facing stale string (new string present)
2. Old `source snapshot changed` string is no longer present in `detectPacketStaleness` (confirm removal)
3. Stale chip `rp-status-warn` still renders for stale status (behavior unchanged)

Estimated baseline delta: +2 to +3 tests → 3288 + 2 or 3 = **3290 or 3291 passed, 0 failed** (pending D-279B implementation and exact test count).

---

## Lock Confirmation

### D-271/D-272 AI-return import visibility locks — unchanged

| Lock | Confirmed |
|------|-----------|
| `rp-return-section` | Present |
| `Load AI Analysis Return` | Present |
| auto-expand: `lastPacket&&lastPacketClaimId===selected?.id` | Present |
| `rp-return-next-step` | Present |
| `Saving does not publish a truth automatically` | Present |
| `JSON.parse(text)` validation | Present |
| `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` | Present |
| `saveAnalysisResult()` posts only to `/api/analysis` | Confirmed |

### D-274 stale detection locks — unchanged

| Lock | Confirmed |
|------|-----------|
| `detectPacketStaleness()` checks `meta.source_snapshot_hash` | Present |
| Compares `simpleClaimHash(selected)` | Present |
| Pushes `source snapshot changed` | Present (candidate for D-279B rename) |
| Threshold `3600000ms` | Present |
| Generated-time stale warning | Present |
| Count-change stale checks | Present |

### D-275 packet-ID storage locks — unchanged

| Lock | Confirmed |
|------|-----------|
| `analysis_results.packet_id` live | Applied D-275D |
| `/api/analysis` accepts optional `packet_id` | Confirmed |
| `cleanText(..., 80)` not `cleanId()` | Confirmed |
| `rp_*` underscore preserved | Confirmed |
| `saveAnalysisResult()` sends from matching `lastPacket` | Confirmed |
| Gate: `lastPacketClaimId===selected?.id` | Confirmed |
| Missing `packet_id` allowed | Confirmed |

### D-277 provenance visibility locks — unchanged

| Lock | Confirmed |
|------|-----------|
| `analysisItem()` renders line only when `a.packetId` non-null | Confirmed |
| `small ev-origin-note` classes | Confirmed |
| `esc(a.packetId)` applied | Confirmed |
| No line when `a.packetId` absent | Confirmed |
| `renderPublicProfileHtml` excludes `Saved from RunPack` | Regression-locked |

---

## Summary

| Question | Answer |
|----------|--------|
| Workflow logically complete? | **Yes** |
| Confusing steps? | Minor — two `analysisPaste` entry points (F-1, informational) |
| Stale warning clarity? | `source snapshot changed` is opaque (F-2) |
| Warning placement correct? | **Yes** |
| Provenance line useful? | **Yes — as-is** |
| Stronger stale-analysis warning beside saved results? | Not needed — backend-required, not warranted (F-3) |
| No-publish confusion risk? | Low — three layers of disclosure |
| Duplicate/conflicting guidance? | Advisory toast uses jargon (F-4, minor) |
| Owner flow separate from Review? | **Yes, confirmed** |
| Public profile separate? | **Yes, confirmed** |
| Frontend-only copy polish needed? | **Yes — F-2 is the recommended candidate** |
| Backend/storage change needed? | **No** |
| Recommended D-279B? | **Yes — rename `source snapshot changed` in `detectPacketStaleness()`** |
| D-279B classification | **Frontend-only** |
| Regression tests needed | ~8 existing assertion updates + 2–3 new test calls |

---

## No-Touch Confirmation

- `scripts/hardening-smoke-test.mjs` — not modified in D-279A
- `public/app-v10.js` — not modified in D-279A
- `public/styles.css` — not modified in D-279A
- `public/index.html` — not modified in D-279A
- `public/belief-drift-expansion.js` — not modified in D-279A
- `src/worker.js` — not modified in D-279A
- `src/analysis-results.js` — not modified in D-279A
- `migrations/` — not modified in D-279A
- All backend/API/auth/review/public-profile/CSP files — not modified in D-279A
