# HumanX Project State Checkpoint

Last updated: 2026-06-06 after D-26 manual live UI test plan.

---

## Identity

| Item | Value |
|------|-------|
| Live app | https://humanx.rinkimirikata.com |
| Repo | HerGotSystems/HumanX |
| Worker entry | `src/worker.js` |
| Frontend | `public/app-v10.js`, `public/styles.css`, `public/index.html` |
| Belief Engine | `public/apps/humanx-belief-engine/index.html` (standalone) |

---

## Known-good static checks

Run before and after any change. All must pass with exit 0.

```sh
node --check public/app-v10.js
node scripts/hardening-smoke-test.mjs
node scripts/belief-engine-static-check.mjs
node scripts/worker-route-static-check.mjs
```

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `95 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `39 passed, 0 failed (39 hard checks)` |

`MODULE_TYPELESS_PACKAGE_JSON` warning during hardening smoke is non-blocking.

---

## Current functional state

All flows confirmed working (code audit + static checks):

| Flow | State |
|------|-------|
| Submit Claim | → enters Review; exact duplicates return existing claim; near-duplicates submit with soft warning and `similar` badge in Review (D-10B/C/D) |
| Add Truth | → enters Review |
| Truth → Claim Review | converts truth to a pressure-testable claim in Review |
| Drift promote Truth | → enters Review |
| Drift promote Claim | → enters Review |
| Review approve / reject / keep | admin-only, all three paths functional |
| Review archive (cleanup) | admin-only, rejected smoke/test artefacts only |
| Evidence attach (side panel) | attaches to selected claim, recalculates score |
| Evidence Vault → Study Linked Claim | studyFromVault sets tab + mode correctly |
| Evidence Vault date display | shows `createdAt` from vault response (fixed B-3) |
| RunPack build / copy / download | functional; fallback pack generated locally if backend unreachable |
| Belief Engine → Send to HumanX | bridge sends snapshot via POST /api/belief-snapshots |
| Graph status box | live counts on Home, Claims, Truths, Vault |

---

## Backend / D1 safety rules

| Rule | Detail |
|------|--------|
| Do not rerun migration 0004 | `migrations/0004_unique_normalized_content.sql` already applied to production. Rerunning will fail. |
| Do not rerun migration 0005 | `migrations/0005_add_home_tests_updated_at.sql` was manually applied via Cloudflare D1 console. Do not rerun unless the target DB is confirmed missing `home_tests.updated_at`. |
| `claims.near_duplicate_of` is live | Column added manually via Cloudflare D1 dashboard (D-10A). `idx_claims_near_duplicate_of` index also applied. Do not attempt to re-add either. |
| Do not rerun migration 0006 against production | `migrations/0006_add_near_duplicate_of.sql` is for **fresh D1 rebuilds only**. Production already has the column and index. Applying on production will fail with "duplicate column" and "already exists" errors. Always run `PRAGMA table_info(claims)` to confirm `near_duplicate_of` is absent before executing. |
| No Wrangler / D1 commands | `wrangler d1 execute`, `wrangler deploy`, and all variants are off-limits unless the user explicitly requests them. |
| No live write smoke | `scripts/write-endpoint-smoke-test.mjs` requires explicit per-session user approval. Do not run routinely. |

---

## Batch history (A-2 → D-10D)

| Batch | Commit | Change |
|-------|--------|--------|
| A-2 | — | Home command center simplified — hero copy, pipeline banner, action cards |
| A-3 | — | Claims/Study workspace streamlined — card layout, Study sections, Claim Flow |
| A-4 | — | Review admin workspace + context panel deduplication |
| A-5 | — | Drift workspace streamlined — profile vs quick record split, drift compare panel |
| A-6 | — | Submit/Truth/Evidence input forms polished |
| A-7 | `15b654e` | Live visual QA fixes — spacing, badge alignment, empty states |
| B-1 | `d3c4f40` | Functional flow audit — fixed mode/tab wiring bugs in `promoteBelief`, `convertTruth`, `studyFromVault` |
| B-2 | `f073942` | Static checks added for navigation wiring (hardening smoke section 14) |
| B-3 | `d5a3207` | Frontend ↔ Worker contract audit — fixed Evidence Vault `createdAt` field mismatch in `evidenceCard` |
| B-4 | `6c8ffd7` | Static check added for Evidence Vault `createdAt` contract; hardening smoke 76 → 77 |
| B-5 | `52db796` | Read-only smoke attempted — all local static checks passed; live read smoke blocked by local environment (see Known limitations) |
| C-1 | `601d3d0` | Public clarity pass — README, noscript, Truths terminology, empty states, Home framing |
| C-2 | `33a9669` | Review queue admin scanability — filter chips, inspect panel, state labels, audit summary |
| C-3 | `f0f950f` | Study view clarity — Claim Flow section, investigation board headers, section purpose lines |
| C-4 | `6d65ad5` | Drift workspace scanability — full-profile vs quick-record split, drift compare, badge labels |
| C-5 | `8dde730` | Claims browser scanability — meter numeric values, pressure chip, Study Claim button, empty state CTA |
| C-6 | `d834379` | Truths workspace scanability — split badges, stats row (↻/⊘), linked-claim chip, amber left border |
| C-7 | `d6eb287` | Evidence Vault scanability — stance borders, split quality/media badges, claim block guard, reuse chip |
| C-8 | `41b5c17` | RunPack export clarity — three-state layout, claim context box, Browse Claims CTA, button tooltips |
| C-9 | `0563a94` | Submit and Add Truth form clarity — better placeholders, field-type labels, removed duplicate notes |
| C-10 | `87f7752` | Docs checkpoint — batch history A-2 → C-9, next-steps updated (pushed to origin) |
| C-11 | `b9918a0` | Modal hardening — replaced native `window.prompt` in report flow with `hxModal` in-app modal |
| D-1 | `53d3879` | Workspace-aware layout — sidebar context/casefile text now reflects the active mode in every workspace |
| D-2 | `437cbc3` | RunPack builder state — three-state layout (no claim / claim selected / pack generated) made explicit |
| D-3 | `e393512` | Evidence readability — JSON/object evidence body values rendered as readable text, not `[object Object]` |
| D-4 | — | Report reason visibility audit — confirmed `reports.reason` exists in schema; identified review queue gap |
| D-4B | `dd5a903` | Report reasons in review queue — correlated subquery adds `latest_report_reason` to both claims and truths queries; rendered in `reviewCard` and `renderReviewInspectPanel` (branch → PR #77 → merged) |
| D-5 | — | Claim normalization / intake audit — full audit of `renderSubmit`, `saveClaim`, `meaningKey`, duplicate detection; identified `data.existing` silent-lie bug and UX gaps |
| D-5B-1 | `5eb54d6` | Duplicate claim response fix — `saveClaim` now handles `data.existing: true` correctly; shows "already exists" panel with Study link instead of false "submitted for Review" |
| D-5C | `6ce3fb2` | Claim-writing guidance — collapsible writing-tips section (good/avoid examples), category suggestion chips, claim-type live hint below select |
| D-9A | `0430a88` | Reused-evidence compression — Study view collapses repeated evidence entries under a single source-claim header, eliminating redundant rows |
| D-9B | `7277f98` | Study evidence/pressure grouping — Study dock groups evidence and pressure blocks by linked claim for faster scanning |
| D-9B+ | `9044a07` | Evidence Vault grouping — Vault groups entries by linked claim with claim-level headers |
| D-9C | `1951f09` | Investigation Packet / RunPack workflow clarity — dock redesigned with explicit packet framing, AI-return parsing flow, and RunPack terminology consistency |
| D-10A | `579a783` | Near-duplicate migration plan — `docs/D10_NEAR_DUPLICATE_PLAN.md` created; manual D1 SQL documented; implementation plan for D-10B written |
| D-10B | `74b390c` (PR #78) | Near-duplicate suggestions Phase 1 — `meaningMatch` wired into `createClaim`; bounded 200-candidate scan; `near_duplicate_of` written on new claim only; `saveClaim` soft warning; `reviewCard` similar badge; inspect panel field |
| D-10C | `dcf4696` (PR #79) | Near-duplicate tuning — suffix normalisation (`-s`/`-ing`/`-ed`), contraction normalisation, additional stopwords; threshold 0.8 → 0.65; 10 new smoke checks (77 → 87) |
| D-10D | `dcf4696` | Negation/contradiction safety fix — contractions now normalise to `"not"` (not stripped); `"not"` kept as real token; negation-polarity guard in `meaningMatch`; min-overlap raised for 3-token claims; 2 new D-10D smoke checks (87 → 89) |
| D-11 | `1b41992` | Review moderation clarity — `~Similar` filter chip; amber `b-similar` badge; `review-card-similar` left-border; `~Similar` audit summary stat replaces always-zero Duplicates; `Similar claim (advisory)` inspect field label; advisory note banner in inspect panel; filter help and empty-state text for similar; no merge UI |
| D-11B | `b5fef36` | Fix review similar filter regression — `nearDup` was declared inside `else { }` block (D-11) but used in `return` template outside that scope; runtime `ReferenceError` silently broke all inspect, filter, and audit-toggle interactions; hoisted to function scope; 2 new smoke checks (89 → 91) |
| D-12 | `004f0b0` | Review queue scale/quality pass — sort controls (newest / oldest / reported first / ~similar first) added to filter bar; relative age display (`reviewAge`: "3d ago", "2h ago") replaces static date on review cards; no merge UI, no `duplicate_of` writes, no `review_state='duplicate'` |
| D-13 | `21e411a` | Advisory claim quality hints — frontend-only `claimQualityHints()` heuristic flags too-short, opinion-opener, absolute universal, common-knowledge, slogan/vague-framing, broad-actor, moral-label, and universal-scope patterns; live hints shown under claim input in Submit form; soft "needs sharpening" badge on Review cards; full hint list in Inspect panel; no blocking, no score changes, no backend/API changes |
| D-14 | `a12f394` | Review quality filter — `~Quality` filter chip and `~Quality first` sort option added to Review queue; both use `claimQualityHints()` to surface claims with advisory hints; chip count shown; help text and empty state added; advisory only — no blocking, no score changes, no backend/API changes |
| D-15 | `49db60b` | Review inspect navigation — position indicator (`N of M · X hints`) + Prev/Next buttons added below inspect panel close button; compact Approve/Keep Pending/Reject action bar added before the fields block; bottom action row preserved; no moderation behaviour changed; rejected: bulk actions, auto-advance, keyboard shortcuts, sticky panel, merge/suppress similar |
| D-16 | `5fd1b0a` | Study reused evidence compression — outer-collapse threshold lowered 10→4 (any 4+ reused items collapse into a closed `<details>` by default); ≤3 reused items switch from full `evidenceItem()` to compact rows inside `.reused-block`; `.study-sub-reused` styled muted/italic to read as secondary framing; D-16C (side panel grouping) deferred — patch functions use fragile selectors |
| D-17 | `77129c7` | Investigation Packet workflow clarity — compact 4-step workflow guide (Create → Paste into AI → Copy response → Load below) added above action buttons; "Download" → "Download Packet"; "Import AI analysis return" → "Load AI Analysis Return"; AI return textarea placeholder updated; ready-hint references "Create Investigation Packet"; raw JSON output wrapped in collapsible `<details class="rp-json-details">` labelled "Technical packet JSON" |
| D-18 | `9dd1668` | Study tool dock clarity — dock audit performed; safe text-only renames in `index.html`: "RunPack" section → "Investigation Packet", "Generate RunPack" → "Build RunPack", "Copy RunPack" → "Copy Packet"; CSS: Evidence & Pressure section head highlighted blue in study mode; patch functions unchanged; fragile selectors documented |
| D-19 | `18cf5c9` | Sidepanel patch stabilization — moved `#evidence-kind-hint`, `#evidence-attach-note`, `#runpack-side-note` from dynamic injection to static HTML; replaced `<pre id="aip">` with `<div id="aip-status">` (stable container); rewrote `patchRunPackPanel()` to target `#aip-status` directly (fixes re-render staleness bug) and removed dead textContent rename + fragile `querySelector('.actions')` injection; removed dead `getElementById('aip')` fallback from `generateRunPack()`; `patchEvidencePanel()` is now a graceful no-op |
| D-20 | `b2f53ee` | Study dock refinement — renamed "Evidence & Pressure" section to "Attach Evidence / Pressure" (D-20A); added static microcopy to Report section (D-20A); added `min-height:32px` to `.runpack-side-status` to prevent layout jump between states (D-20C); added `#side-tools .actions{flex-direction:column}` + `button{width:100%}` at `max-width:900px` for clean narrow-width stacking (D-20D); no IDs, function names, or JS logic changed |
| D-21 | docs-only | Visual QA audit of D-15 → D-20 — all five focus areas pass; no regressions found; no code changes; full checklist in `docs/D21_VISUAL_QA.md` |
| D-22 | docs-only | D-series stabilization release checkpoint — full D-1 → D-21 summary, safety boundaries recorded, known-good checks confirmed at 91/24/35; full release note in `docs/D22_D_SERIES_STABILIZATION_RELEASE.md` |
| D-23 | docs-only | Planning — D-23A: RunPack provenance (packet_id, generated_at, evidence count snapshot, stale detection, AI return linkage, v1.2 schema); D-23B: investigation graph nav audit (5 context-loss points, priority-ranked fixes, `lastModeBeforeStudy` approach); D-23C: backend moderation tooling plan (mark-duplicate, resolve-similar, hard constraints, D1 audit prerequisite) |
| D-24A | `4aef4e5` | Study navigation context preservation — added `lastModeBeforeStudy` and `lastInspectedReviewItemId` state; `setMode` resets origin on explicit nav; `studyFromVault` sets vault origin; `openReviewClaimStudy` sets review origin + saves inspected item ID; `backToArena` routes back to correct mode and restores `inspectedReviewItem` from queue; `renderStudy` shows context-aware back button ("← Back to Review" / "← Back to Vault" / "← Back"); no backend changes, no moderation behaviour changed |
| D-24B | `16fa131` | RunPack provenance Phase 1 — added `lastPacketMeta` state; `generatePacketId`, `simpleClaimHash`, `buildProvenanceMeta`, `detectPacketStaleness` helpers; all generated packets now include `packet_id`, `runpack_version:'1.2'`, `generated_at`, `source_claim_id`, `source_snapshot_hash`, `evidence_count`, `pressure_count`, `test_count`, `humanx_app_version`, `is_fallback`; `runPackSummary` shows advisory "Possibly stale" chip when counts or age drift; `saveAnalysisResult` shows non-blocking advisory toast on `packet_id` mismatch; no backend changes, no blocking logic, no schema migration |
| D-24F | docs+migration | Near-duplicate migration proposal — `migrations/0006_add_near_duplicate_of.sql` created: `ALTER TABLE claims ADD COLUMN near_duplicate_of TEXT` + `CREATE INDEX IF NOT EXISTS idx_claims_near_duplicate_of`; closes schema gap documented in D-24C; safe for fresh D1 rebuilds only; production must not reapply (column already exists — would fail with "duplicate column"); `PRAGMA table_info(claims)` guard documented; D-24C audit schema-gaps table updated to mark all three gaps as closed; Backend/D1 safety rule added to PROJECT_STATE.md; no code changes, no Wrangler, no D1 commands |
| D-24E | `5dc33e4` | Moderator duplicate resolution frontend controls — `renderReviewInspectPanel` gains `dupSection` with "Mark Duplicate..." and "Dismiss ~Similar" buttons for claim items; both are context-aware (markdup hidden for archived/duplicate state; resolvesim hidden when no advisory); `markDuplicateUI(claimId)` opens hxModal with target claim ID + optional reason input, calls `POST /api/review/mark-duplicate` via `adminHeaders()`, clears inspect panel and reloads queue on success; `resolveSimilarUI(claimId)` opens hxModal for confirm, calls `POST /api/review/resolve-similar`, reloads queue; both functions exposed on `window`; CSS adds muted purple (markdup) and muted steel-blue (resolvesim) button styles distinct from primary Approve/Reject; 4 new hardening smoke checks (91→95); no backend/D1/Worker/migration changes |
| D-24D | `f2def3b` (PR #86) | Moderator duplicate-resolution backend routes — `POST /api/review/mark-duplicate` (writes `duplicate_of` + `review_state='duplicate'`; validates both claims exist; rejects self-duplicates and ineligible sources; source preserved) and `POST /api/review/resolve-similar` (clears `near_duplicate_of`; no-op guard; returns previous value for audit); `mapClaim` now exposes `duplicateOf` field; `reviewQueue` SQL excludes `review_state='duplicate'` alongside `archived`; `duplicate_total` added to queue metadata; both routes added to `HIGH_RISK_ROUTES`; worker-route-static-check 35→39 hard checks; no migrations, no frontend changes |
| D-26 | docs-only | Manual live UI test plan — 10-section controlled test plan for D-24 moderation/provenance flows; covers read-only smoke, exact duplicate, near-duplicate advisory, review basic flow, duplicate-resolution (Mark Duplicate + Dismiss ~Similar), Study continuity (scroll + context restoration), RunPack provenance, safety cleanup, and overall pass/fail summary; `HX_TEST_D26_` naming convention for test data; full plan in `docs/D26_MANUAL_LIVE_UI_TEST_PLAN.md` |
| D-25 | docs-only | D-24 operational moderation checkpoint — full D-24A → D-24G summary; what is now operational vs advisory-only vs forbidden; static checks confirmed 95/24/39; manual/live testing deferred; safe-next-work documented; full record in `docs/D25_D24_OPERATIONAL_MODERATION_CHECKPOINT.md` |
| D-24G | `969dfea` | Claims/Arena scroll restoration — `lastArenaScrollTop` state variable saves `#main.scrollTop` in `selectClaim` when origin is arena; `backToArena` restores it immediately after `setMode('arena')` (synchronous render path, no rAF needed); null-guard on `#main`; 3 insertions, 2 deletions; all static checks held at 95/24/39 |
| D-24C | docs-only | Backend moderation D1 audit — confirmed `duplicate_of` in schema (unwritten); `near_duplicate_of` live but absent from migrations (schema gap documented); `review_state` constraint-free (TEXT, no CHECK); `'duplicate'` value exists in frontend but no backend write path; `reviewDecision` allowed set is `public/review/rejected` only; `reviewQueue` needs `'duplicate'` exclusion before implementation; safe 5-step implementation sequence documented; all constraints from D-23C confirmed intact; full findings in `docs/D24C_BACKEND_MODERATION_D1_AUDIT.md` |

---

## Known limitations

**Live read smoke from Windows sandbox may fail.**
`scripts/read-endpoint-smoke-test.mjs` uses Node.js `fetch`, which inherits the Windows `schannel` TLS library. In sandboxed or restricted environments `schannel` cannot reach CRL/OCSP revocation servers, producing `CRYPT_E_NO_REVOCATION_CHECK` and `fetch failed` for all HTTPS requests. This is a local TLS policy restriction, not an app failure. The live app is reachable (DNS resolves to Cloudflare). Run the live read smoke from a CI environment or a dev machine with unrestricted outbound TLS (e.g. GitHub Actions, WSL with curl's CA bundle).

---

## What is safe to do next

D-23 planning is complete. Three planning documents added:
- `docs/D23_RUNPACK_PROVENANCE_PLAN.md` — packet_id, generated_at, evidence count snapshot, stale detection, AI return linkage, v1.2 schema; Phase 1 frontend-only, Phase 2 worker branch+PR
- `docs/D23_INVESTIGATION_GRAPH_NAV_AUDIT.md` — 5 context-loss points identified and priority-ranked; `lastModeBeforeStudy` approach for back-navigation; scroll restoration plan
- `docs/D23_BACKEND_MODERATION_PLAN.md` — mark-duplicate and resolve-similar endpoints; hard constraints (no auto-dedup, no silent merge, ancestry preserved, admin-only, branch+PR required); D1 audit prerequisite documented

No code changes in D-23. Static checks held at 91/24/35.

Next work:

1. **Run D-26 manual test plan** — `docs/D26_MANUAL_LIVE_UI_TEST_PLAN.md` is ready. Execute when the user is ready to open a browser session against `humanx.rinkimirikata.com`. Use `HX_TEST_D26_` prefix for all test claims. Requires explicit per-session approval for any **[WRITE]** steps.
2. **RunPack provenance Phase 2** — worker-side `packet_id` generation (branch + PR); plan in `docs/D23_RUNPACK_PROVENANCE_PLAN.md`.
3. **Live read smoke** — `scripts/read-endpoint-smoke-test.mjs` from a non-Windows-sandbox environment (CI or WSL) to verify public endpoints without write risk.
4. **No live write smoke** without explicit per-session approval.
5. **D-24C schema gaps all closed** — All three gaps are resolved: `near_duplicate_of` migration (D-24F), `duplicate_of` in `mapClaim` (D-24D), `review_state='duplicate'` excluded from `reviewQueue` (D-24D). No outstanding schema debt.

**Do not:**
- Speculatively refactor `src/worker.js` routing without a written plan reviewed first.
- Rerun migration 0004, 0005, or re-add `near_duplicate_of` column/index (see Backend / D1 safety rules above).
- Run live write smoke tests without explicit per-session approval.
- Merge any backend duplicate/near-duplicate work directly to main — always use a branch and PR.
- Apply any D1 migration without explicit per-session user approval.
