# D-268B — RunPack Fallback Guidance and Generated-Time Summary

**Scope:** Frontend + tests + docs
**Status:** COMPLETE — deploy needed (app-v10.js changed)
**Baseline:** 3100 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D268B_RUNPACK_FALLBACK_GUIDANCE_GENERATED_TIME_SUMMARY.md`, `docs/README.md`
**CSS changes:** None
**Worker changes:** None (`src/worker.js` not touched)
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes (public/app-v10.js changed)

---

## Purpose

Apply the two highest-value improvements identified in the D-268A Claim/RunPack flow clarity audit:

- **F-2 (MEDIUM):** Fallback packet omitted `instruction` and `output_contract` — the AI had no guidance when the backend was unavailable.
- **F-1 (MEDIUM):** `generated_at` timestamp was never shown in the UI; the user could not tell when the packet was built until the 1-hour stale threshold fired.

---

## D-268A Findings Addressed

### F-2 — Fallback packet missing AI guidance

**Before:** When `POST /api/runpack` failed, the frontend built a local fallback packet with provenance fields and `payload` only. No `instruction` or `output_contract` fields. An AI receiving the fallback had a raw data dump with no prompt guidance.

**After:** Fallback packet now includes:

- `instruction` — full AI guidance string consistent with HumanX claim-pressure-analysis intent
- `output_contract` — expected return schema for the AI response

Both fields are frontend-only additions. The backend `buildRunPack()` in `src/worker.js` is unchanged.

---

### F-1 — Generated-at not shown in UI

**Before:** `generated_at` ISO timestamp was stored in the packet but never displayed. The stale chip only showed "packet is Nh old" once >1 hour had elapsed. The user could not see freshness within the first hour.

**After:** `runPackSummary()` now renders a "Generated X ago" line via the new `rpRelativeTime()` helper when `lastPacketMeta.generated_at` exists.

---

## Exact Changes

### 1. New `rpRelativeTime(iso)` helper (`public/app-v10.js`, after `buildProvenanceMeta`)

```javascript
function rpRelativeTime(iso){
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return Math.floor(ms / 60000) + ' min ago';
  if (ms < 86400000) return Math.floor(ms / 3600000) + 'h ago';
  return Math.floor(ms / 86400000) + 'd ago'
}
```

Returns: `just now` | `12 min ago` | `2h ago` | `1d ago`

---

### 2. Generated-time display in `runPackSummary()` (`public/app-v10.js`, line 451)

Added between the counts row and the status chip row:

```html
${lastPacketMeta && lastPacketMeta.generated_at
  ? `<div class="rp-summary-generated small">Generated ${rpRelativeTime(lastPacketMeta.generated_at)}</div>`
  : ''}
```

Renders only when `lastPacketMeta` is set (i.e. after a packet has been generated in this session). Does not appear in idle state.

---

### 3. `instruction` + `output_contract` added to fallback packet in `generateRunPack()` (`public/app-v10.js`)

Added to the fallback packet spread after `no_owner_api_used:true`:

**`instruction` value:**
> "Analyse this claim using only the provided packet and your own reasoning. Identify what is strongly supported, plausible, contested, weak, untestable, or internally contradictory. Do not assume a claim is true because it is emotionally important. Do not dismiss a claim only because it is unpopular or challenges authority. Return structured analysis where possible. Do not claim independent verification — you are analysing a submitted packet, not conducting independent research."

**`output_contract` value:**
```json
{
  "verdict": "one of: Strongly Supported | Plausible | Contested | Weakly Supported | Untestable | Contradicted | Insufficient Evidence",
  "plain_language_summary": "string — what the evidence shows in plain terms",
  "evidence_score": "0-100 — how strongly the submitted evidence supports the claim",
  "testability": "0-100 — how testable the claim is given available methods",
  "survivability": "0-100 — how well the claim survives pressure and counter-evidence",
  "strongest_support": "array of key supporting points",
  "strongest_pressure": "array of key challenges or weaknesses",
  "missing_tests": "array of suggested tests or evidence gaps",
  "limitations": "string — what this analysis cannot determine from the packet alone",
  "ai_provenance_note": "string — note that this is AI analysis of a submitted packet, not independent verification",
  "note": "Do not invent evidence not present in the packet. Flag uncertainty clearly."
}
```

---

## Stale Warning Preserved

`detectPacketStaleness()` is unchanged. The existing stale warning logic remains:

- Evidence count changed → warns
- Pressure count changed → warns
- Test count changed → warns
- Age > 3600000ms (1h) → warns "packet is Nh old"

The `rp-status-warn / Possibly stale` chip is unchanged.

---

## Stale Threshold Unchanged

`detectPacketStaleness()` still uses `3600000` ms (1 hour) as the age threshold. D-268B does not change this.

---

## AI-Return Import (F-3) — Deferred

"Load AI Analysis Return" `<details>` remains collapsed by default. F-3 (auto-expand the section when a packet is ready and no analysis has been saved) is deferred to a future task. Auto-expand may require careful state-checking to avoid unwanted UI noise.

---

## Packet-ID Storage (F-5) — Deferred

`packet_id` from the AI return is still not stored alongside the saved analysis in the backend. F-5 is deferred because it requires a backend schema migration (`analysis_results` table) and API change — out of scope for this frontend-only task.

---

## Source-Snapshot-Hash Stale Check (F-4) — Deferred

`source_snapshot_hash` is still not compared in `detectPacketStaleness()`. F-4 remains deferred. The count-based check handles the most common change type (add/remove items). Content-only edits without count change are a rare case.

---

## Behavior Guarantees

| Item | Status |
|------|--------|
| Claim loading (`selectClaim`) | Unchanged |
| RunPack backend generation (`POST /api/runpack`) | Unchanged |
| RunPack fallback (now more informative) | `instruction` + `output_contract` added; `is_fallback:true` preserved |
| `safeRunPackClaim(selected)` for fallback payload | Unchanged (D-171B lock preserved) |
| Copy Packet / Download Packet buttons | Unchanged |
| `saveAnalysisResult()` AI return paste | Unchanged (JSON.parse, field extraction, advisory packet_id check) |
| `analysisItem()` verdict display | Unchanged |
| Public truth state | No change |
| Review queue / moderation | No change |
| Public profile | `generateRunPack` not in `renderPublicProfileHtml` — confirmed |
| Drift/Belief expansion files | Not touched |
| `src/worker.js` | Not touched |
| `public/index.html` | Not touched |
| `public/styles.css` | Not touched (no new CSS class needed — `rp-summary-generated` inherits `small` styling) |
| No backend/API/migration/schema/CSP/external asset changes | Confirmed |

---

## Tests Added (25 new — `scripts/hardening-smoke-test.mjs`)

New baseline: **3100 passed, 0 failed** (was 3075).

| # | Test |
|---|------|
| 1 | Fallback RunPack includes `instruction` field |
| 2 | Fallback RunPack includes `output_contract` field |
| 3 | Fallback instruction mentions claim-pressure analysis |
| 4 | Fallback instruction warns not to assume emotionally important claims are true |
| 5 | Fallback instruction warns not to dismiss claims only because unpopular |
| 6 | Fallback output_contract requires structured verdict and summary fields |
| 7 | Fallback output_contract warns not to invent evidence |
| 8 | Backend `buildRunPack` exists and is not affected by frontend fallback patch |
| 9 | `rpRelativeTime` helper is defined in `app-v10.js` |
| 10 | `rpRelativeTime` returns human-readable copy (just now / min ago / h ago) |
| 11 | `runPackSummary` emits `rp-summary-generated` element |
| 12 | `runPackSummary` calls `rpRelativeTime()` |
| 13 | `runPackSummary` still renders evidence/pressure/test counts row |
| 14 | Stale warning chip and `detectPacketStaleness` call preserved |
| 15 | `detectPacketStaleness` stale threshold unchanged at 3600000ms |
| 16 | `saveAnalysisResult` still validates with `JSON.parse` |
| 17 | `saveAnalysisResult` field extraction unchanged (`output || result || analysis`) |
| 18 | `saveAnalysisResult` posts to `/api/analysis`, not review/approve routes |
| 19 | `requestApproveReview` still defined separately from `saveAnalysisResult` |
| 20 | `generateRunPack` absent from `renderPublicProfileHtml` |
| 21 | `belief-drift-expansion.js` not modified by D-268B |
| 22 | `worker.js` not modified by D-268B |
| 23 | `index.html` not modified by D-268B |
| 24 | Fallback RunPack still sets `is_fallback:true` |
| 25 | Fallback RunPack still uses `safeRunPackClaim(selected)` for payload (D-171B lock) |

---

## Live Sanity Checklist (pending owner deploy)

After deploy, verify in browser:

| # | Check |
|---|-------|
| 1 | Open a public claim → enter Study mode → open RunPack tab |
| 2 | Click "Create Investigation Packet" (backend available) |
| 3 | Status chip shows "Packet ready · send to AI" |
| 4 | "Generated just now" appears below counts row |
| 5 | Wait 2 minutes — status still shows "Packet ready", counts row shows correct counts |
| 6 | "Generated X min ago" text updates correctly |
| 7 | Disable network (devtools) → recreate packet → verify fallback warning appears |
| 8 | Copy packet JSON → verify `instruction` field present in fallback |
| 9 | Verify `output_contract` field present in fallback |
| 10 | Verify `is_fallback: true` present in fallback |
| 11 | Re-enable network → rebuild packet → verify no fallback warning |
| 12 | Add evidence → stale warning fires correctly (count changed) |
| 13 | Stale chip still shows "Possibly stale — evidence count changed" |
| 14 | No changes to public profile, Review queue, or analysis display |
| 15 | "Load AI Analysis Return" section still collapsed (F-3 deferred) |

---

## Known-Warning State (unchanged)

`worker-route-static-check.mjs`: `57 passed, 0 failed / 1 known warn`

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## No-Touch Guarantees

- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `wrangler.toml` — not modified
- No backend/API/migration/schema/CSP changes
- No external asset changes
- No public profile changes
- No Review/moderation logic changes
