# D-268A — Claim / RunPack Flow Clarity Audit

**Scope:** Docs / audit only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3075 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn) (unchanged)
**Files changed:** `docs/D268A_CLAIM_RUNPACK_FLOW_CLARITY_AUDIT.md`, `docs/README.md`
**App changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Audit the current Claim / Investigation Packet / RunPack flow before making UI changes. Answer where the user may not understand what is loaded, what the AI should do with it, whether results are stale, and how returned AI analysis is parsed or stored.

---

## 1. Current Flow Inventory

The flow has six user-facing steps across two render surfaces (Study page and Investigation Packet / RunPack page).

### Step 1 — Claim load (`selectClaim`, line 453)

| Item | Detail |
|------|--------|
| Entry point | Any claim card in arena → `cardSelectClaim` → `selectClaim(id)` |
| API route | `GET /api/claims/:id` |
| State set | `selected` (claim + evidence[] + pressure[] + tests[] + analyses[] + lineage) |
| After | `renderStudy()` called |
| Visibility | Logged-in and guest users (claims tab) |

**No user-visible copy at this step.** The claim is silently loaded and Study view opens.

---

### Step 2 — Study view (`renderStudy`, line 456)

| Control | Class / data-action | What it does |
|---------|---------------------|-------------|
| Claim title | `h2` | Shows `cleanClaimLabel(selected.claim)` |
| Review status badge | `studyReviewBadge(selected)` | Shows pending/public/rejected state |
| Score meters | `.meters.wide` | Evidence / Testability / Survivability 0–100 |
| Vote buttons | `.vote.yes/.no/.unsure` | `voteClaim('believe'/'reject'/'unsure')` |
| **Build RunPack** button | `primary`, `data-action="generateRunPack"` | Calls `generateRunPack()` |
| RunPack CTA paragraph | `.study-runpack-cta` | "Done adding evidence and pressure? Create RunPack →" links to RunPack tab |
| Sidebar `#aip-status` | `.runpack-side-status` | Updated by `patchRunPackPanel()` |

**`patchRunPackPanel()` sidebar status copy (line 569):**
- No packet: `"Build an Investigation Packet, then copy it into any AI for pressure-testing."`
- Packet ready: `"RunPack ready — copy it here or open the RunPack tab for full JSON and download."`
- Fallback packet: `"⚠ Fallback RunPack — backend unavailable. Copy with caution."`

---

### Step 3 — Investigation Packet page (`renderExport`, line 452, mode `export`)

All controls on this page:

| Control | Class / data-action | Copy shown | What it does |
|---------|---------------------|------------|-------------|
| Claim context box | `.runpack-claim-ctx` | Active claim text + status badge | Display only |
| **`runPackSummary()`** | `.rp-summary` | Status chip + hint + counts | See detail below |
| 4-step workflow guide | `.rp-workflow-guide` | 1 Create packet → 2 Paste into AI → 3 Copy AI response → 4 Load below | Display only |
| Before-you-generate note | `.review-first-note` | "Before you generate: open the claim in Study mode and add evidence and pressure points first…" | Display only |
| **Create Investigation Packet** | `primary`, `data-action="generateRunPack"` | First build: "Create Investigation Packet" / Rebuild: "Recreate Packet" | `generateRunPack()` |
| **Copy Packet** | `data-action="copyAIP"` | "Copy Packet" | `copyAIP()` → clipboard |
| **Download Packet** | `data-action="downloadRunPack"` | "Download Packet" | `downloadRunPack()` → file |
| Copy/Download note | `.review-first-note` (second) | "Copy Packet — readable prompt for AI chat. Download Packet — JSON file for tools that accept file input." | Display only |
| Download all visible data toggle | `.runpack-visible-data-toggle` | "Download all visible data" / "Exports everything currently visible in your session…" | `downloadJSON()` |
| Output JSON details | `.rp-json-details` | collapsed: "Technical packet JSON" / open: shows raw JSON | Display only |
| **Load AI Analysis Return** | `.rp-return-section` | collapsed: "Load AI Analysis Return" | Opens paste textarea |
| AI return textarea | `#analysisPaste` | placeholder: "Paste the AI's JSON response here" | Input |
| **Save Analysis** | `primary`, `data-action="saveAnalysisResult"` | "Save Analysis" | `saveAnalysisResult()` |

**No-claim state copy:** "Open a claim from the Claims tab → enter Study mode → click Build RunPack. Then return here to copy or download the packet."

---

### Step 4 — RunPack status summary (`runPackSummary`, line 451)

The most detailed status display. Shows 5 distinct states:

| State | Chip label | Chip class | Hint copy |
|-------|-----------|------------|-----------|
| No packet | `No packet yet` | `rp-status-idle` | "Click Create Investigation Packet to build the bundle." |
| Different claim | `Built for different claim` | `rp-status-warn` | "This packet was built for a different claim. Rebuild to update." |
| Fallback packet | `Fallback packet` | `rp-status-warn` | "Generated locally — backend evidence and lineage may be incomplete." |
| Stale | `Possibly stale — {reasons}` | `rp-status-warn` | "Rebuild the packet to capture the latest evidence and pressure." |
| Ready | `Packet ready · send to AI` | `rp-status-ready` | "Copy or download below, paste into any AI, then import the result." |

Counts row always shows: **N evidence · N pressure · N tests · N analyses**

---

### Step 5 — Packet generation (`generateRunPack`, line 567)

| Item | Detail |
|------|--------|
| API route | `POST /api/runpack` (alias: `/api/aip`) |
| Request body | `{claimId: selected.id}` |
| On success | Sets `lastPacket` (JSON string), `lastPacketIsFallback=false`, `lastPacketClaimId`, `lastPacketMeta` |
| On failure | Generates local fallback packet (from cached `selected`) with `is_fallback:true` |
| Sidebar update | `#aip-status` text changed to "RunPack ready…" |
| Toast | "RunPack ready — copy it into your AI" |
| Public gate | Worker blocks non-public claims: `if (reviewState !== 'public') return 404` |

---

### Step 6 — AI return paste and save (`saveAnalysisResult`, line 572)

| Item | Detail |
|------|--------|
| Input | `#analysisPaste` textarea |
| Parse | `JSON.parse(text)` — failure: toast "Paste valid JSON first" |
| Packet mismatch | If `parsed.packet_id !== lastPacket.packet_id` → advisory toast only (not blocking) |
| Result extraction | `parsed.output || parsed.result || parsed.analysis || parsed` |
| API route | `POST /api/analysis` with `{claimId, source:'runpack-user', raw: result}` |
| On success | Clears textarea, toast "Analysis saved — verdict shown in the Analysis section.", reloads claim via `selectClaim()` |
| On failure | toast with server error message |
| Authentication | `requireUser` — must be logged in |

---

## 2. Current Packet Contents

### Backend packet (`buildRunPack`, worker.js line 994)

The packet produced by `POST /api/runpack` includes:

| Field | Value / source |
|-------|----------------|
| `packet_id` | `makeId('rp')` — unique per build |
| `runpack_version` | `'1.2'` |
| `generated_at` | `new Date().toISOString()` — ISO 8601 UTC |
| `source_claim_id` | `claimId` (the claim being packed) |
| `source_snapshot_hash` | `workerSnapshotHash(detail)` — hash of current content |
| `evidence_count` | count of evidence items |
| `pressure_count` | count of pressure items |
| `test_count` | count of test items |
| `humanx_worker_version` | `'v1'` |
| `is_fallback` | `false` |
| `legacy_aip_version` | `'1.1'` |
| `aip_version` | `'1.1'` |
| `packet_type` | `'runpack_task'` |
| `app` | `'HumanX'` |
| `mode` | `'claim-pressure-analysis'` |
| `no_owner_api_used` | `true` |
| `instruction` | Full AI instruction string (do not claim verification, distinguish source types, etc.) |
| `output_contract` | Schema: verdict enum, evidence_score, testability, survivability, strongest_support, strongest_pressure, missing_tests, plain_language_summary, ai_provenance_note, source_type_note |
| `payload` | `safeRunPackClaimBackend(detail.claim)` + evidence + pressure + tests from DB |

Packet is also stored in `aip_packets` table (`INSERT INTO aip_packets`).

### Fallback packet (frontend `generateRunPack`, line 567)

Built from `selected` state when backend is unavailable:

| Field | Same as backend? | Notes |
|-------|-----------------|-------|
| `packet_id` | ❌ (frontend `generatePacketId`) | Different format: `rp_{short}_{ts36}` |
| `runpack_version` | ✓ `'1.2'` | |
| `generated_at` | ✓ ISO UTC | |
| `source_claim_id` | ✓ | |
| `source_snapshot_hash` | ❌ (frontend `simpleClaimHash`) | Simpler hash — id + updated_at + counts |
| `is_fallback` | `true` | |
| `legacy_aip_version` | ✓ `'1.1'` | |
| `aip_version` | ✓ `'1.1'` | |
| `packet_type` | ✓ `'runpack_task'` | |
| `app` | ✓ `'HumanX'` | |
| `mode` | ✓ `'claim-pressure-analysis'` | |
| `no_owner_api_used` | ✓ `true` | |
| `instruction` | ❌ **MISSING** | Not included in fallback |
| `output_contract` | ❌ **MISSING** | Not included in fallback |
| `payload` | `safeRunPackClaim(selected)` | From cached `selected`, not fresh DB query |

**Key gap: fallback packet omits `instruction` and `output_contract`** — the AI has no guidance on what to do or what format to return.

---

## 3. Current User Clarity Assessment

| Question | Current state | Gap |
|----------|--------------|-----|
| Which claim is loaded? | Shown in `.runpack-claim-ctx` (claim text + status badge) | None — clear |
| Which claim was the packet built for? | `runPackSummary()` warns "Built for different claim" if mismatch | Generated-for claim name not shown — only mismatch state |
| When was the packet generated? | Internal `generated_at` field; stale check fires if >1h | **Gap: no readable timestamp shown; user can't see "built 5 minutes ago"** |
| Is the packet stale? | `detectPacketStaleness()` checks counts + age >1h; warns in chip | Count-based — content edits don't trigger |
| What should the AI do? | `instruction` field inside packet JSON | Only visible if user opens "Technical packet JSON" — not in UI copy |
| Where to paste AI output? | "Load AI Analysis Return" `<details>` — collapsed by default | **Gap: collapsed, easy to miss; label "Load AI Analysis Return" may not be obvious** |
| Was AI output parsed successfully? | Toast "Analysis saved" or "Paste valid JSON first" | Adequate |
| Where is the analysis stored? | Backend `analysis_results` table, visible in Study → Analysis section | Clear once saved |
| Does AI analysis change public state? | No — stays in Study until admin review; copy says "not independent verification" | Adequately disclaimed |
| What next after packet generation? | Status chip "Packet ready · send to AI" + workflow guide | Adequate |

---

## 4. Current Stale / Mismatch Behavior

### What exists

`detectPacketStaleness()` (line 566) — called inside `runPackSummary()`:

| Check | Source | Trigger |
|-------|--------|---------|
| Evidence count changed | `meta.evidence_count` vs `(selected.evidence||[]).length` | Any evidence add/remove |
| Pressure count changed | `meta.pressure_count` vs `(selected.pressure||[]).length` | Any pressure add/remove |
| Test count changed | `meta.test_count` vs `(selected.tests||[]).length` | Any test add/remove |
| Age > 1 hour | `Date.now() - new Date(meta.generated_at).getTime() > 3600000` | Packet is >1h old |

Returns null if fresh, or a joined string of warning reasons (displayed in stale chip).

### What is missing

- `source_snapshot_hash` is **stored** in the packet but **never compared** in stale detection. Only counts and age are checked. If evidence titles/bodies are edited without changing count, no stale warning fires.
- No exact generated-at timestamp is shown to the user in the UI. The only staleness signal is "packet is Nh old" when age >1 hour.
- No claim update_at comparison — if the claim text itself changes after packet build, no stale warning fires.

### Cross-claim mismatch

`runPackSummary()` detects `lastPacketClaimId !== selected.id` → warns "Built for different claim". This is session-only state; navigating away and back resets `lastPacket` implicitly (packet state is session-local).

---

## 5. Current AI-Return Parsing Behavior

### What exists (`saveAnalysisResult`, line 572)

**Input format accepted:** Any JSON with at least one of: `verdict`, `evidence_score` / `evidenceScore`, `testability`, `survivability`, `strongest_support`, `strongest_pressure`, `missing_tests`, `plain_language_summary`.

**Parser entry point:** `saveAnalysisResult()` registered in `_D181B_ZERO_PARAM_ACTIONS`.

**Parse sequence:**

1. Read `#analysisPaste` textarea value
2. `JSON.parse(text)` — if fails: toast "Paste valid JSON first", return
3. Optional `packet_id` mismatch advisory toast (non-blocking)
4. Extract: `parsed.output || parsed.result || parsed.analysis || parsed`
5. POST to `/api/analysis`
6. Server validates fields, stores in `analysis_results`
7. On success: clear textarea, reload claim, toast "Analysis saved — verdict shown in the Analysis section."
8. On failure: toast server error

**Fields extracted by backend (`addAnalysisResult`):**

| Field | Source |
|-------|--------|
| `verdict` | `analysis.verdict` |
| `evidence_score` | `analysis.evidence_score ?? analysis.evidenceScore` |
| `testability` | `analysis.testability` |
| `survivability` | `analysis.survivability` |
| `strongest_support` | `analysis.strongest_support ?? analysis.strongestSupport` |
| `strongest_pressure` | `analysis.strongest_pressure ?? analysis.strongestPressure` |
| `missing_tests` | `analysis.missing_tests ?? analysis.missingTests` |
| `plain_language_summary` | `analysis.plain_language_summary ?? analysis.plainLanguageSummary` |
| `raw_json` | Full `analysis` object serialized |

**Error handling:**

| Case | Behavior |
|------|---------|
| Invalid JSON | Toast "Paste valid JSON first" — user can retry |
| No meaningful fields | Backend returns `ANALYSIS_SHAPE_REQUIRED` (400) |
| Claim not found | Backend returns `CLAIM_NOT_FOUND` (404) |
| Rate limited | Backend `RATE_LIMIT_UNAVAILABLE` (via `safeRateLimit`, 20/hr/IP) |
| Not logged in | Backend `requireUser` fails |
| Packet ID mismatch | Advisory toast only — save proceeds normally |

**Not stored:** `packet_id` from the AI response, `generated_at` of the original packet, per-analysis packet linkage.

---

## 6. Friction / Risk Findings

### F-1 — Generated-at not shown in readable form (MEDIUM)

**What:** `generated_at` is stored inside `lastPacket` JSON (ISO 8601 UTC) and used internally by `detectPacketStaleness()` for the >1h age check. The stale chip does show "packet is Nh old" once >1 hour has passed. But there is no "Generated 3 minutes ago" display before the 1-hour threshold. The user cannot tell whether they just built the packet or it is from 55 minutes ago.

**Location:** `runPackSummary` (line 451), `detectPacketStaleness` (line 566).

**Impact:** If the user builds a packet, adds evidence, then comes back to the RunPack tab within an hour, they see "Packet ready · send to AI" with no indication that the counts they see are now stale — the count-based check fires, but they don't know the exact build time.

**Fix:** Add a human-readable "Generated X ago" or "Generated at HH:MM" to the `rp-summary-status` row. Data is already in `lastPacketMeta.generated_at` or parseable from `lastPacket`.

---

### F-2 — Fallback packet omits `instruction` and `output_contract` (MEDIUM)

**What:** When the backend is unavailable, `generateRunPack()` builds a local fallback packet. The fallback includes provenance fields and `payload` but does **not** include `instruction` (the AI guidance text) or `output_contract` (the expected response schema). Without these, the AI user gets a raw data dump with no instructions.

**Location:** `generateRunPack` (line 567), compare with `buildRunPack` (worker.js line 994).

**Impact:** Fallback packets are functional data bundles but are less usable by an AI that needs the instruction prompt. The warning banner is shown ("⚠ Fallback RunPack") but the missing fields are not called out.

**Fix:** Add `instruction` and `output_contract` to the fallback packet build (frontend-only, no backend needed).

---

### F-3 — "Load AI Analysis Return" section is collapsed (MEDIUM)

**What:** After generating a packet, copying it, and getting AI output, the user must return to the RunPack page and manually expand the `<details class="rp-return-section">` to find the paste textarea. The summary label reads "Load AI Analysis Return" which is step 4 of a 4-step workflow but is visually easy to miss below the packet JSON details.

**Location:** `renderExport` (line 452) — `rp-return-section` `<details>`.

**Impact:** New users who complete the workflow may not easily find where to paste the AI result. The 4-step workflow guide points to "4 Load below" which corresponds to this collapsed section.

**Fix (for D-268B):** Auto-expand the "Load AI Analysis Return" section if a packet is ready and no analysis has been saved for this claim yet. Or place the section more prominently above the packet JSON details.

---

### F-4 — `source_snapshot_hash` not used in stale check (LOW-MEDIUM)

**What:** Both the backend and frontend generate a `source_snapshot_hash` and include it in the packet. `detectPacketStaleness()` checks counts and age but never compares `meta.source_snapshot_hash` to a current hash of the loaded claim. If evidence body text is edited (without changing count), no stale warning fires.

**Location:** `detectPacketStaleness` (line 566), `simpleClaimHash` (line 564), `buildProvenanceMeta` (line 565).

**Impact:** Minor — the most common change (adding/removing items) is caught by count checks. Edit-without-count-change is a less common case.

**Fix (if desired):** Compare `meta.source_snapshot_hash` against `simpleClaimHash(selected)` in stale detection. This is frontend-only.

---

### F-5 — Packet ID not linked to saved analysis (LOW)

**What:** `saveAnalysisResult()` does an advisory check: if `parsed.packet_id !== lastPacket.packet_id`, it fires a non-blocking advisory toast. However, the `packet_id` from the AI return is not stored alongside the saved analysis in the backend. This means there is no way to later trace "which packet build was this analysis for."

**Location:** `saveAnalysisResult` (line 572), `addAnalysisResult` (analysis-results.js line 1).

**Impact:** Low — provenance is approximate (the stored `source` field is `'runpack-user'`). No user-visible issue, but future traceability is limited.

**Fix (deferred):** Add `packet_id` column to `analysis_results` schema and pass it from frontend. Requires migration — defer.

---

### F-6 — "Technical packet JSON" label may confuse (LOW)

**What:** The collapsed output details block reads "Technical packet JSON" as its `<summary>` label. The primary actions are Copy Packet / Download Packet above it. The JSON toggle is intended as a fallback view, but the label "Technical packet JSON" may confuse users who expect to see their result here.

**Location:** `renderExport` (line 452) — `rp-json-details` `<summary>`.

**Impact:** Low — most users should use Copy/Download buttons. The collapse-by-default hides the raw JSON appropriately.

**Fix (optional):** No change needed — the existing button hierarchy handles this well. Low priority.

---

### F-7 — Packet not re-fetched on `selected` change within session (LOW)

**What:** `lastPacket`, `lastPacketClaimId`, and `lastPacketMeta` are session-global. If the user navigates to a different claim and comes back, `lastPacketClaimId !== selected.id` is caught by `runPackSummary()`. However, the user does NOT get an auto-prompt to regenerate — they see a warning chip but must manually click "Create Investigation Packet."

**Location:** `runPackSummary` (line 451), `renderExport` (line 452).

**Impact:** Low — the warning and the button label "Create Investigation Packet" (not "Recreate") are clear enough.

---

## 7. What Is Already Working Well

Before recommending changes, these existing strengths should be preserved:

| Feature | Location | Status |
|---------|----------|--------|
| 5-state `runPackSummary()` chip | line 451 | Well-designed — idle / different claim / fallback / stale / ready |
| Stale count detection | `detectPacketStaleness`, line 566 | Works for add/remove changes |
| 4-step workflow guide | `renderExport`, line 452 | Clear linear guidance |
| `instruction` field in packet | `buildRunPack`, worker.js | AI knows what to do — no ambiguity |
| `output_contract` field | `buildRunPack`, worker.js | AI knows what to return |
| Provenance note on analysis card | `analysisItem`, line 466 | "AI analysis of supplied HumanX packet — not independent verification." |
| Legacy verdict remapping | `LEGACY_VERDICT_MAP`, line 465 | Proven → Strongly Supported; no verdict inflation |
| Fallback packet warning | `renderExport`, line 452 | Clear `⚠ Fallback RunPack` banner |
| `JSON.parse` validation | `saveAnalysisResult`, line 572 | User gets clear "Paste valid JSON first" feedback |
| Packet-mismatch advisory | `saveAnalysisResult`, line 572 | Non-blocking, non-alarming advisory |
| `no_claim_state` guidance | `renderExport`, line 452 | Tells user how to start |
| Rate limiting on `/api/analysis` | `analysis-results.js` | 20/hr/IP |
| Public claim gate on runpack | worker.js line 897 | Non-public claims → 404, not packed |

---

## 8. Recommended D-268B Code Slice

**Recommendation:** D-268B — Fallback packet instruction fix + generated-at display

**Type:** Frontend-only. No backend/API/schema changes. No deploy to unlock UI improvements.

**Slice 1 (F-2, MEDIUM):** Add `instruction` and `output_contract` to the fallback packet generated in `generateRunPack()`. Both fields are already defined/available via `buildRunPack`-equivalent constants in frontend code. This makes fallback packets usable by AI.

**Slice 2 (F-1, MEDIUM):** Add a readable "Generated {age}" display to the `rp-summary-status` row in `runPackSummary()`. Use `lastPacketMeta.generated_at` (already set) or parse from `lastPacket`. Show relative time (e.g. "Generated just now", "Generated 12 min ago") when packet is fresh. This replaces the invisible 1-hour threshold with visible freshness context.

**Slice 3 (F-3, LOW):** Consider auto-expanding "Load AI Analysis Return" when a packet is ready (`rp-status-ready`) and `selected.analyses.length === 0`. Small quality-of-life change.

**What D-268B must NOT do:**
- No backend/API/schema changes
- No moderation or Review queue changes
- No public profile changes
- No Drift/Belief expansion changes
- No changes to `saveAnalysisResult` parse logic (already adequate)
- No changes to `instruction` or `output_contract` field values (already correct)

**Alternative if F-2 is not owner priority:** D-268B — Generated-at display only (Slice 2 standalone). Minimal, safe, high-readability improvement.

---

## 9. Test Recommendations (for D-268B)

Future tests for when D-268B is implemented:

| # | Category | Test |
|---|----------|------|
| 1 | Fallback packet | Fallback packet includes `instruction` field |
| 2 | Fallback packet | Fallback packet includes `output_contract` field |
| 3 | Fallback packet | Fallback packet still includes `is_fallback: true` |
| 4 | Status summary | `runPackSummary` emits `.rp-summary` element |
| 5 | Status summary | `runPackSummary` emits `.rp-status-chip` element |
| 6 | Status summary | `runPackSummary` shows evidence/pressure/tests counts row |
| 7 | Status states | "No packet yet" idle state copy present |
| 8 | Status states | "Built for different claim" warn state copy present |
| 9 | Status states | "Fallback packet" warn state copy present |
| 10 | Status states | "Possibly stale" warn state copy present |
| 11 | Status states | "Packet ready · send to AI" ready state copy present |
| 12 | Generated-at | If added: generated-at display uses human-readable relative time |
| 13 | AI instruction | `instruction` present in backend packet |
| 14 | AI instruction | `output_contract` present in backend packet |
| 15 | Parsing | `saveAnalysisResult` is registered in `_D181B_ZERO_PARAM_ACTIONS` |
| 16 | Parsing | `analysisPaste` textarea ID present in `renderExport` output |
| 17 | Boundaries | `renderExport` / `runPackSummary` copy absent from `renderPublicProfileHtml` |
| 18 | Boundaries | `generateRunPack` absent from `renderPublicProfileHtml` |
| 19 | Boundaries | `saveAnalysisResult` absent from `renderPublicProfileHtml` |
| 20 | No truth changes | No auto-approve or state-change on analysis save |
| 21 | Verdict remapping | `LEGACY_VERDICT_MAP` contains `Proven` → `Strongly Supported` |
| 22 | Provenance note | `analysisItem` includes "not independent verification" copy |
| 23 | Worker boundary | `/api/ai/analyse` route still returns `RUNPACK_MODE` 402 |
| 24 | Deploy integrity | `app-v10.js` not changed by D-268A |
| 25 | Deploy integrity | `styles.css` not changed by D-268A |

---

## 10. Boundaries

- D-268A is audit / docs only. No frontend behavior change. No CSS change. No backend/API/schema changes.
- No public profile exposure — RunPack controls are internal-only.
- No Review moderation behavior changes.
- No Drift/Belief expansion changes.
- No live deploy needed.

---

## Public / Privacy Boundary

- `generateRunPack`, `saveAnalysisResult`, `runPackSummary`, `renderExport` are all absent from `renderPublicProfileHtml`.
- Public claim gate on `/api/runpack`: non-public claims return 404 — runpack content cannot be fetched for unpublished claims.
- Analysis results stored in `analysis_results` (backend) are visible in Study view to anyone who can load the claim. This is by design — analyses are user-contributed investigation material, not admin-only.
- `no_owner_api_used: true` and `no_claim_state` copy accurately reflect that the packet uses no Anthropic/AI API credits.

---

## Review Boundary

- RunPack generation does not interact with the Review queue.
- Saving an analysis result does not change `review_state` on claims or evidence.
- `addAnalysisResult` does not call any review decision route.
- The "Creating a packet does not publish anything — visibility still depends on admin Review approval." copy in `renderExport` is accurate and preserved.

---

## Drift / Belief Files Untouched

`public/belief-drift-expansion.js` and `public/index.html` not touched by D-268A.

---

## No Backend / API / Migration / Schema / CSP / External Asset Changes

D-268A is audit only. No code changed.

---

## Worker Known-Warning State (unchanged)

`57 passed, 0 failed / 1 known warn`
Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`
