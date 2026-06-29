# HumanX Project State Checkpoint

Last updated: 2026-06-29 after D-219A post-hardening checkpoint.
Previous checkpoint: 2026-06-08 after D-93B.

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

## Current HEAD

| Item | Value |
|------|-------|
| **Pre-D-219A stable HEAD** | `c4ba537` (D-218A Worker route warning audit) |
| **D-219A commit** | see `docs/README.md` after commit |

---

## Current baseline (as of D-219A)

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
| `hardening-smoke-test.mjs` | `2186 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (57 hard checks)` |

### Known warning (non-blocking)

```
WARN: /api/u/:slug — known parameterised route; implemented via regex in worker.js,
      not as a literal string (D-218A documented limitation)
```

**Classification:** Known false positive / static analysis limitation.
**Runtime impact:** None. Route implemented as `url.pathname.match(/^\/api\/u\/[^/]+$/)`.
**Reference:** `docs/D218A_WORKER_ROUTE_WARNING_AUDIT.md`.
**Rule:** New unknown parameterised routes emit a distinct "NEW parameterised route not in KNOWN_PARAM_ROUTES" warning that must be investigated before being added to the known set.

`MODULE_TYPELESS_PACKAGE_JSON` warning during hardening smoke is non-blocking (Node.js ecosystem warning unrelated to HumanX code).

---

## D-210 → D-218 hardening arc summary

This arc locked the Reflection Avatar as a permanent private feature and added a layered regression fence across the entire My HumanX / public profile boundary.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-210B | `233861b` | Feature | Private Reflection Avatar concept card — investigation habits only, no identity/rank/ideology |
| D-210C | `60ffdf8` | Live closeout | D-210B confirmed live |
| D-211A | `08db623` | Feature | Transparency disclosure — "How this is formed" `<details>` block; private note copy |
| D-212A | `5da4699` | Feature | localStorage hide/show — device-local only; `humanx.me.reflectionAvatar.hidden`; "Hide this" / "Show again" |
| D-212B | `6c86c37` | Live closeout | D-212A confirmed live |
| D-213A | `e9ecdc4` | Polish | Accessibility — `type="button"`, `aria-label`, `:focus-visible` rings, 32px touch targets |
| D-213B | `7ff1684` | Live closeout | D-213A confirmed live |
| D-214A | `814a627` | Regression lock | 55 tests — private boundary, public exclusion, backend/API exclusion, data minimization, copy guardrails, accessibility lock, deploy lock |
| D-215A | `a5eaa97` | Regression lock | 43 tests — private/public render separation, no localStorage/public coupling, backend/API boundary, forbidden wording, renderMeHtml wiring, deploy lock |
| D-216A | `93783d1` | Regression lock | 79 tests — positive allowlist (`PUBLIC_PROFILE_ALLOWED_MARKERS`) + denylist (`PUBLIC_PROFILE_PRIVATE_DENYLIST`); deny-by-default |
| D-217A | `5c8dbe2` | Maintainability | Structured comment index in `hardening-smoke-test.mjs`; 20 maintainability tests; navigation anchors |
| D-218A | `c4ba537` | Checker improvement | `KNOWN_PARAM_ROUTES` constant; distinct NEW-warning for unknown routes; 9 smoke tests; warning audit doc |

**Tests added in arc:** 55 + 43 + 79 + 20 + 9 = **206 new tests** (2186 total).
**Deploys required in arc:** 2 (D-212B, D-213B — owner manual terminal deploy from live closeout sessions).
**D-214A through D-218A:** Tests / docs / checker only — no deploy needed.

---

## Privacy / public boundary state

| Surface | State | Locked by |
|---------|-------|-----------|
| Reflection Avatar | **Private only** — called exclusively from `renderMeHtml` | D-214A |
| Transparency "How this is formed" | **Private only** — inside `meReflectionAvatarHtml` | D-214A / D-215A |
| Hide/show control | **Device-local only** — `localStorage`; never sent to backend | D-214A / D-215A |
| Public profile allowlist | **Active** — `PUBLIC_PROFILE_ALLOWED_MARKERS` / `PUBLIC_PROFILE_PRIVATE_DENYLIST` | D-216A |
| My HumanX private helpers | **Excluded from public render** — `meMirrorHtml`, `meBeliefReflectionHtml`, `meAccountCardHtml`, `meProfileSettingsHtml`, `meReflectionAvatarHtml` | D-215A |
| Public avatar / private preference exposure | **Blocked** — no backend field, no API route, no public render call | D-214A + D-215A + D-216A |
| `top_beliefs_json` | **Permanently private** — never in any public API response | D-216A |
| `alignment_labels` | **Permanently disabled** — never enabled in any UI | D-214A |

---

## Deployment state

| Item | State |
|------|-------|
| Last deploy that changed app / CSS | D-213B — owner manually deployed; confirmed live |
| D-214A through D-218A | Tests / docs / checker only — **no deploy needed** |
| D-219A (this task) | Docs only — **no deploy needed** |
| **Current deploy needed** | **No** |

CC session wrangler deploy always fails (VPN/proxy/certificate issue). All deploys require owner manual terminal execution. This is expected and permanent.

---

## Worker warning state

| Warning | Count | Status |
|---------|-------|--------|
| Known: `/api/u/:slug` parameterised route | 1 | Documented — `D218A_WORKER_ROUTE_WARNING_AUDIT.md` |
| Unknown warnings | 0 | Any new unknown parameterised route emits a distinct "NEW parameterised route" message |

**Rule:** Do not hide new warnings behind the known `/api/u/:slug` warning. Any new WARN text not matching the exact known-warn string must be investigated immediately.

---

## Safe next-work rules

1. **Reflection Avatar public exposure** — requires new spec + explicit owner approval before any implementation.

2. **New public profile fields** — any new field in `getPublicProfile` response or `renderPublicProfileHtml` must be named in docs, added to `PUBLIC_PROFILE_ALLOWED_MARKERS` with a test, and explicitly approved by owner.

3. **D-214 / D-215 / D-216 privacy locks** — do not loosen or remove tests without a new spec document, explicit owner approval, and updated README.

4. **Live PASS gating** — do not mark live closeout (D-xxxB) as PASS without owner manual deploy + browser sanity check. Static checks passing locally ≠ live PASS.

5. **Worker route warnings** — new parameterised routes must be confirmed in `worker.js`, added to `KNOWN_PARAM_ROUTES`, and documented in `D218A_WORKER_ROUTE_WARNING_AUDIT.md`.

6. **Hard security rules (permanent):**
   - Do NOT touch `selectClaim`, `studyFromVault`, `attachEvidencePrompt`
   - Do NOT touch Review decision handlers: `inspectReviewItem`, `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`, `cancelApproveReview`, `cancelRejectReview`
   - Do NOT touch belief engine file unless for copy-level safety fixes
   - No CSP tightening
   - No backend/auth/token changes beyond taxonomy work
   - No wrangler.toml changes
   - No Review/admin logic changes
   - No public belief identity cards, no avatar generation, no ideology badges
   - `alignment_labels` must never be enabled in any UI — permanently blocked
   - `top_beliefs_json` must never be returned raw in any public API response

---

## Suggested next feature lanes

These are suggestions only. Do not start any until explicitly assigned.

| Lane | Notes |
|------|-------|
| Public profile polish | Visual layout, nav clarity, snapshot block UX — stays within `PUBLIC_PROFILE_ALLOWED_MARKERS` |
| My HumanX usability polish | Filter ergonomics, activity counts, account card clarity |
| Review / moderation ergonomics | Queue scanability, bulk actions, duplicate resolution UX |
| Claim / RunPack flow clarity | Investigation Packet workflow, AI-return parsing, stale detection |
| Search / navigation cleanup | Cross-workspace nav, back-button context, mode-aware sidebar |

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
| Migration 0007 applied — do not re-apply | `migrations/0007_add_evidence_review_state.sql` was applied manually via Cloudflare D1 Console on 2026-06-06 (D-42A). `evidence.review_state TEXT DEFAULT 'public'` and `evidence.report_count INTEGER DEFAULT 0` now exist in production. Both indexes confirmed present. Running the migration again will fail with "duplicate column name". Do not re-apply. Full record in `docs/D42A_EVIDENCE_MIGRATION_APPLY_RESULT.md`. |

---

## Full batch history (A-2 → D-219A)

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
| D-23 | docs-only | Planning — D-23A: RunPack provenance; D-23B: investigation graph nav audit; D-23C: backend moderation tooling plan |
| D-24A | `4aef4e5` | Study navigation context preservation — added `lastModeBeforeStudy` and `lastInspectedReviewItemId` state; `setMode` resets origin on explicit nav; `studyFromVault` sets vault origin; `openReviewClaimStudy` sets review origin + saves inspected item ID; `backToArena` routes back to correct mode and restores `inspectedReviewItem` from queue; `renderStudy` shows context-aware back button |
| D-24B | `16fa131` | RunPack provenance Phase 1 — added `lastPacketMeta` state; `generatePacketId`, `simpleClaimHash`, `buildProvenanceMeta`, `detectPacketStaleness` helpers; all generated packets now include `packet_id`, `runpack_version:'1.2'`, `generated_at`, `source_claim_id`, `source_snapshot_hash`, `evidence_count`, `pressure_count`, `test_count`, `humanx_app_version`, `is_fallback`; `runPackSummary` shows advisory "Possibly stale" chip when counts or age drift; `saveAnalysisResult` shows non-blocking advisory toast on `packet_id` mismatch; no backend changes, no blocking logic, no schema migration |
| D-24F | docs+migration | Near-duplicate migration proposal — `migrations/0006_add_near_duplicate_of.sql` created; safe for fresh D1 rebuilds only; production must not reapply |
| D-24E | `5dc33e4` | Moderator duplicate resolution frontend controls — `renderReviewInspectPanel` gains `dupSection` with "Mark Duplicate..." and "Dismiss ~Similar" buttons; `markDuplicateUI`, `resolveSimilarUI` added; 4 new hardening smoke checks (91→95) |
| D-24D | `f2def3b` (PR #86) | Moderator duplicate-resolution backend routes — `POST /api/review/mark-duplicate` and `POST /api/review/resolve-similar`; `mapClaim` exposes `duplicateOf`; `reviewQueue` SQL excludes `review_state='duplicate'`; worker-route-static-check 35→39 hard checks |
| D-53 | docs-only | Launch seed data quality audit plan — seed inventory, classification framework, quality criteria, five proposed categories |
| D-54 | docs-only | Seed data inventory and classification — import routes confirmed; source URL coverage 0/7; claims and truths classified |
| D-55 | docs-only | Launch seed pack draft — 25 launch claims, 25 truth seed candidates across 5 categories |
| D-56 | docs-only | Launch seed source gathering checklist — acceptable source classes, per-category expectations, claim-by-claim checklist |
| D-57 | docs-only | Launch seed JSON draft — structural spec for `data/seed_claims_v2.json`; claim and truth object schemas |
| D-58 | docs-only | Seed import route safety plan — 10 risks documented; recommended future behaviour; D-59 implementation plan |
| D-210B | `233861b` | **[Arc start]** Private Reflection Avatar concept card — investigation habits only; private note; no identity/rank/ideology |
| D-210C | `60ffdf8` | Reflection Avatar live closeout — confirmed private; no public exposure |
| D-211A | `08db623` | Reflection Avatar transparency — "How this is formed" `<details>` block; copy guardrails |
| D-212A | `5da4699` | Reflection Avatar hide/show — localStorage-only; `humanx.me.reflectionAvatar.hidden`; "Hide this" / "Show again" |
| D-212B | `6c86c37` | D-212A live closeout — hide/show confirmed device-local; no backend |
| D-213A | `e9ecdc4` | Reflection Avatar accessibility — `type="button"`, `aria-label`, `:focus-visible`, 32px touch targets |
| D-213B | `7ff1684` | D-213A live closeout — keyboard nav and focus visible confirmed in production |
| D-214A | `814a627` | Reflection Avatar regression lock — 55 tests; private boundary, public exclusion, backend exclusion, data minimization, copy guardrails, accessibility lock, deploy lock |
| D-215A | `a5eaa97` | My HumanX privacy boundary lock — 43 tests; private/public render separation, no localStorage/public coupling, backend/API boundary, forbidden wording, renderMeHtml wiring, deploy lock |
| D-216A | `93783d1` | Public Profile allowlist contract — 79 tests; `PUBLIC_PROFILE_ALLOWED_MARKERS`, `PUBLIC_PROFILE_PRIVATE_DENYLIST`, deny-by-default rule |
| D-217A | `5c8dbe2` | Hardening smoke index — structured comment index in `hardening-smoke-test.mjs`; 20 maintainability tests; navigation anchors; rules for future slices |
| D-218A | `c4ba537` | Worker route warning audit — `KNOWN_PARAM_ROUTES`; distinct NEW-warning for unknown routes; 9 smoke tests; `D218A_WORKER_ROUTE_WARNING_AUDIT.md` |
| D-219A | TBD | **[Current]** Post-hardening checkpoint — `PROJECT_STATE.md` updated; `D219A_POST_HARDENING_CHECKPOINT.md` added; README updated; docs only; no deploy |
