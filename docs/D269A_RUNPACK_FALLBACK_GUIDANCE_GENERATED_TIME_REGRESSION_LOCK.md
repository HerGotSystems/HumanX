# D-269A — RunPack Fallback Guidance and Generated-Time Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3144 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D269A_RUNPACK_FALLBACK_GUIDANCE_GENERATED_TIME_REGRESSION_LOCK.md`, `docs/README.md`
**App changes:** None (`public/app-v10.js` not touched)
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Lock the D-268B/C RunPack fallback guidance and generated-time summary improvements so future Claim/RunPack clarity tasks cannot accidentally:

- Remove `instruction` or `output_contract` from the fallback packet
- Weaken the AI guidance copy (emotionally important warning, unpopular-claim warning, no-independent-verification warning, no-invented-evidence warning)
- Remove the `rpRelativeTime()` helper
- Remove the `rp-summary-generated` display row from `runPackSummary()`
- Change the stale warning chip or stale threshold
- Change AI-return import/parsing behavior
- Expose RunPack admin controls on public profile pages

---

## D-268A / B / C Summary

| Task | Type | What it did |
|------|------|-------------|
| D-268A | Audit | Full Claim/RunPack flow clarity audit. 7 friction findings. F-2 MEDIUM (fallback packet missing `instruction`/`output_contract`), F-1 MEDIUM (`generated_at` not shown in UI), F-3 MEDIUM (Load AI Analysis Return collapsed — deferred), F-4 LOW-MEDIUM (`source_snapshot_hash` not used in stale check — deferred), F-5 LOW (packet_id not stored with analysis — deferred). |
| D-268B | Frontend + tests | Fixed F-2 and F-1. Added `instruction` + `output_contract` to fallback packet. Added `rpRelativeTime()` helper. Added `rp-summary-generated` row to `runPackSummary()`. 25 new lock tests. Baseline 3075 → 3100. |
| D-268C | Live closeout | Owner deploy PASS (2026-07-01). 36/36 live sanity PASS. |
| D-269A | Regression lock | 44 new tests across 7 categories. Baseline 3100 → 3144. |

---

## What Is Now Locked

### Fallback Packet Guidance Fields

| Field | Lock |
|-------|------|
| `instruction` present in fallback packet | D-269A test 1 |
| `output_contract` present in fallback packet | D-269A test 2 |
| `instruction` tells AI to analyse claim using the packet | D-269A test 3 |
| `instruction` warns not to assume emotionally important claims are true | D-269A test 4 |
| `instruction` warns not to dismiss claims only because unpopular | D-269A test 5 |
| `instruction` warns not to claim independent verification | D-269A test 6 |
| `output_contract.verdict` present | D-269A test 7 |
| `output_contract.plain_language_summary` present | D-269A test 8 |
| `output_contract.evidence_score`, `.testability`, `.survivability` present | D-269A test 9 |
| `output_contract.strongest_support`, `.strongest_pressure`, `.missing_tests` present | D-269A test 10 |
| `output_contract.limitations`, `.ai_provenance_note` present | D-269A test 11 |
| `output_contract` warns not to invent evidence | D-269A test 12 |

### Generated-Time Summary

| Item | Lock |
|------|------|
| `rpRelativeTime()` helper defined | D-269A test 13 |
| `rpRelativeTime()` returns "just now" | D-269A test 14 |
| `rpRelativeTime()` returns "X min ago" | D-269A test 15 |
| `rpRelativeTime()` returns "Xh ago" | D-269A test 16 |
| `runPackSummary()` emits `rp-summary-generated` | D-269A test 17 |
| Generated-time row guarded by `lastPacketMeta.generated_at` | D-269A test 18 |
| Generated-time row calls `rpRelativeTime()` | D-269A test 19 |
| Generated-time row appears before `rp-status-chip` in render order | D-269A test 20 |

### Stale Behavior

| Item | Lock |
|------|------|
| Stale warning chip (`rp-status-warn` / `Possibly stale`) still in `runPackSummary()` | D-269A test 21 |
| `detectPacketStaleness()` still called in `runPackSummary()` | D-269A test 22 |
| Stale threshold at `3600000ms` (1h) | D-269A test 23 |
| `source_snapshot_hash` comparison not added (F-4 deferred) | D-269A test 24 |

### AI-Return / Import Behavior

| Item | Lock |
|------|------|
| "Load AI Analysis Return" section still present in `renderExport()` | D-269A test 25 |
| `saveAnalysisResult()` still uses `JSON.parse(text)` | D-269A test 26 |
| `saveAnalysisResult()` field extraction unchanged (`parsed.output \|\| parsed.result \|\| parsed.analysis \|\| parsed`) | D-269A test 27 |
| `saveAnalysisResult()` success toast copy unchanged | D-269A test 28 |
| `packet_id` advisory check still non-blocking toast (F-5 deferred) | D-269A test 29 |

### Claim / RunPack Behavior

| Item | Lock |
|------|------|
| `generateRunPack()` still defined | D-269A test 30 |
| `generateRunPack()` still calls `POST /api/runpack` | D-269A test 31 |
| Fallback still sets `is_fallback:true` | D-269A test 32 |
| Fallback still uses `safeRunPackClaim(selected)` for payload (D-171B lock) | D-269A test 33 |
| Copy Packet / Download Packet buttons still in `renderExport()` | D-269A test 34 |
| `saveAnalysisResult()` posts to `/api/analysis` only (no public truth state change) | D-269A test 35 |

### Boundary / Public Profile

| Item | Lock |
|------|------|
| `generateRunPack` absent from `renderPublicProfileHtml` | D-269A test 36 |
| `saveAnalysisResult` absent from `renderPublicProfileHtml` | D-269A test 37 |
| `belief-drift-expansion.js` not modified by D-269A | D-269A test 38 |
| `worker.js` not modified by D-269A | D-269A test 39 |

### Deploy Integrity

| Item | Lock |
|------|------|
| `app-v10.js` not modified by D-269A | D-269A test 40 |
| `styles.css` not modified by D-269A | D-269A test 41 |
| `index.html` not modified by D-269A | D-269A test 42 |
| `requestApproveReview` still defined (moderation unchanged) | D-269A test 43 |
| `runPackSummary()` evidence/pressure/tests counts row still present | D-269A test 44 |

---

## Exact Copy / Field Guarantees

**`instruction` must contain:**
- Reference to analysing the claim using the packet
- "emotionally important" (do not assume claim is true because emotionally important)
- "unpopular" (do not dismiss claim only because unpopular)
- "independent verification" or "independent research" (do not claim to have conducted it)

**`output_contract` must contain:**
- `verdict`
- `plain_language_summary`
- `evidence_score`
- `testability`
- `survivability`
- `strongest_support`
- `strongest_pressure`
- `missing_tests`
- `limitations`
- `ai_provenance_note`
- "invent" (do not invent evidence not present in the packet)

**`rpRelativeTime()` output values:**
- `just now` (< 60 000 ms)
- `X min ago` (< 3 600 000 ms)
- `Xh ago` (< 86 400 000 ms)
- `Xd ago` (≥ 86 400 000 ms)

**`rp-summary-generated` class:** class name used for generated-time row — must not be renamed without updating tests.

**Stale threshold:** `3600000` ms — do not change without explicit owner approval and a new task.

---

## Deferred Findings (remain deferred after D-269A)

| Finding | State |
|---------|-------|
| F-3 — "Load AI Analysis Return" collapsed | Deferred — auto-expand may cause UI noise |
| F-4 — `source_snapshot_hash` not used in stale check | Deferred — count-based check handles common case |
| F-5 — `packet_id` not stored with analysis | Deferred — requires backend schema migration |

---

## Behavior Guarantees Preserved

| Item | Status |
|------|--------|
| Claim loading (`selectClaim`) | Unchanged |
| Backend RunPack generation (`POST /api/runpack`) | Unchanged |
| Fallback packet only adds guidance fields | `instruction` + `output_contract` added; all other fields unchanged |
| `safeRunPackClaim(selected)` payload | Unchanged (D-171B lock) |
| Copy Packet / Download Packet | Unchanged |
| `saveAnalysisResult()` parse/validate/extract | Unchanged |
| AI-return import success/failure copy | Unchanged |
| Public truth state | No change |
| Review queue / moderation | No change |
| `requestApproveReview` / `requestRejectReview` | Still defined and unchanged |
| Public profile | `generateRunPack` + `saveAnalysisResult` absent from `renderPublicProfileHtml` |
| Drift/Belief expansion files | Not touched |
| `src/worker.js` | Not touched |
| `public/index.html` | Not touched |
| `public/styles.css` | Not touched |
| No backend/API/migration/schema/CSP/external asset changes | Confirmed |

---

## Tests Added (44 new — `scripts/hardening-smoke-test.mjs`)

New baseline: **3144 passed, 0 failed** (was 3100).

### Category 1 — Fallback guidance lock (12 tests)

| # | Test |
|---|------|
| 1 | Fallback RunPack still includes `instruction` field |
| 2 | Fallback RunPack still includes `output_contract` field |
| 3 | Instruction still tells AI to analyse claim using the packet |
| 4 | Instruction still warns not to assume emotionally important claims are true |
| 5 | Instruction still warns not to dismiss claims only because unpopular |
| 6 | Instruction still warns not to claim independent verification |
| 7 | `output_contract` still includes `verdict` |
| 8 | `output_contract` still includes `plain_language_summary` |
| 9 | `output_contract` still includes `evidence_score`, `testability`, `survivability` |
| 10 | `output_contract` still includes `strongest_support`, `strongest_pressure`, `missing_tests` |
| 11 | `output_contract` still includes `limitations`, `ai_provenance_note` |
| 12 | `output_contract` still warns not to invent evidence |

### Category 2 — Generated-time summary lock (8 tests)

| # | Test |
|---|------|
| 13 | `rpRelativeTime` helper still defined |
| 14 | `rpRelativeTime` still returns "just now" for sub-60s |
| 15 | `rpRelativeTime` still returns "min ago" for sub-1h |
| 16 | `rpRelativeTime` still returns "h ago" for multi-hour |
| 17 | `runPackSummary` still emits `rp-summary-generated` |
| 18 | Generated-time row still guarded by `lastPacketMeta.generated_at` |
| 19 | Generated-time row still calls `rpRelativeTime()` |
| 20 | Generated-time row appears before status chip in render order |

### Category 3 — Stale behavior lock (4 tests)

| # | Test |
|---|------|
| 21 | Stale warning chip still present in `runPackSummary` |
| 22 | `detectPacketStaleness` still called in `runPackSummary` |
| 23 | Stale threshold still `3600000ms` |
| 24 | `source_snapshot_hash` comparison not added to `detectPacketStaleness` (F-4 deferred) |

### Category 4 — AI-return / import behavior lock (5 tests)

| # | Test |
|---|------|
| 25 | "Load AI Analysis Return" section still present |
| 26 | `saveAnalysisResult` still validates with `JSON.parse` |
| 27 | `saveAnalysisResult` field extraction unchanged |
| 28 | `saveAnalysisResult` success copy unchanged |
| 29 | `packet_id` advisory check still non-blocking (F-5 deferred) |

### Category 5 — Claim / RunPack behavior lock (6 tests)

| # | Test |
|---|------|
| 30 | `generateRunPack` still defined |
| 31 | `generateRunPack` still calls `POST /api/runpack` |
| 32 | Fallback still sets `is_fallback:true` |
| 33 | Fallback still uses `safeRunPackClaim(selected)` for payload (D-171B lock) |
| 34 | Copy Packet / Download Packet still present in `renderExport` |
| 35 | `saveAnalysisResult` posts to `/api/analysis` only (no public truth change) |

### Category 6 — Boundary lock (4 tests)

| # | Test |
|---|------|
| 36 | `generateRunPack` absent from `renderPublicProfileHtml` |
| 37 | `saveAnalysisResult` absent from `renderPublicProfileHtml` |
| 38 | `belief-drift-expansion.js` not modified by D-269A |
| 39 | `worker.js` not modified by D-269A |

### Category 7 — Deploy integrity lock (5 tests)

| # | Test |
|---|------|
| 40 | `app-v10.js` not modified by D-269A |
| 41 | `styles.css` not modified by D-269A |
| 42 | `index.html` not modified by D-269A |
| 43 | `requestApproveReview` still defined (moderation unchanged) |
| 44 | `runPackSummary` evidence/pressure/tests counts row still present |

---

## Public / Privacy Guarantees

- `generateRunPack`, `saveAnalysisResult`, `runPackSummary`, `renderExport` absent from `renderPublicProfileHtml`.
- RunPack generation still gated on public claims only (`POST /api/runpack` → worker returns 404 for non-public claims).
- No new public data fields introduced.
- `PUBLIC_PROFILE_ALLOWED_MARKERS` contract unchanged.

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` not touched by D-268A/B/C or D-269A. Confirmed by D-269A tests 38, 42.

---

## Worker Known-Warning State (unchanged)

`worker-route-static-check.mjs`: `57 passed, 0 failed / 1 known warn`

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## No-Touch Guarantees

- `public/app-v10.js` — not modified by D-269A
- `public/styles.css` — not modified by D-269A
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `wrangler.toml` — not modified
- No backend/API/migration/schema/CSP changes
- No external asset changes
- No public profile changes
- No Review/moderation logic changes

---

## Future Rule

Any future Claim/RunPack clarity task must preserve all 44 D-269A lock tests **or** update the affected tests with explicit owner approval in a new documented task explaining what changed and why.

Specifically prohibited without a new documented task:
- Removing `instruction` or `output_contract` from fallback packet
- Removing the emotionally-important, unpopular-claim, or no-independent-verification warnings from `instruction`
- Removing the no-invent-evidence warning from `output_contract`
- Removing `rpRelativeTime()` or renaming `rp-summary-generated`
- Moving the generated-time row to after the status chip
- Changing the stale threshold below 3600000ms
- Adding `source_snapshot_hash` stale detection without explicit owner approval (F-4 deferred)
- Adding `packet_id` storage without a backend schema task (F-5 deferred)
- Auto-expanding "Load AI Analysis Return" without a documented UI task (F-3 deferred)
