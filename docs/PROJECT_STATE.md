# HumanX Project State Checkpoint

Last updated: 2026-06-29 after D-226A public profile milestone checkpoint.
Previous checkpoint: 2026-06-29 after D-219A post-hardening checkpoint.

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
| **Pre-D-226A stable HEAD** | `ad01e7d` (D-225A Public Profile polish regression lock) |
| **D-226A commit** | see `docs/README.md` after commit |

---

## Current baseline (as of D-226A)

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
| `hardening-smoke-test.mjs` | `2290 passed, 0 failed` |
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

**Tests added in arc:** 55 + 43 + 79 + 20 + 9 = **206 new tests** (2186 total after D-218A).
**Deploys required in arc:** 2 (D-212B, D-213B — owner manual terminal deploy from live closeout sessions).
**D-214A through D-218A:** Tests / docs / checker only — no deploy needed.

---

## D-220 → D-225 public profile polish arc summary

This arc delivered visual, accessibility, and UX improvements to the public profile page, all within the D-216A allowlist contract. All changes are confined to the public profile render surface; no new public data fields were introduced and no privacy boundary changes were made.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-220A | `03ff140` | Feature | Visual polish — counts card to top; `<details>` context block; `pp-item-actions` wrapper; truths empty state |
| D-220B | `9ba04ae` | Live closeout | D-220A confirmed live; 21-item sanity PASS |
| D-221A | `89ab5e1` | Polish | Accessibility — `.pp-item-actions .btn-mini:focus-visible` ring; mobile `min-height:44px` on claim action buttons |
| D-221B | `c31dc8f` | Live closeout | D-221A confirmed live; 20-item sanity PASS |
| D-222A | `b967601` | Feature | Copy link — `pp-copy-link` button in header for all visitors; `copyPublicProfileLink` updated to `window.location.href`; "Link copied" / "Copy failed — use browser address bar" |
| D-222B | `c019a23` | Live closeout | D-222A confirmed live; 24-item sanity PASS |
| D-223A | `23eea66` | Feature | Section nav — `<nav aria-label="Public profile sections">` with four anchor links; `id` attributes on all sections; pure HTML anchors |
| D-223B | `a5e6979` | Live closeout | D-223A confirmed live; 26-item sanity PASS |
| D-224A | `910b4db` | Feature | Empty states — `pp-empty-card` on snapshot/claims/truths; snapshot always emits `id="public-snapshot"`; Snapshot nav unconditional |
| D-224B | `053cc67` | Live closeout | D-224A confirmed live; 25-item sanity PASS |
| D-225A | `ad01e7d` | Regression lock | 13 cross-arc composite tests — page structure order, all CSS classes, copy-link contract, section nav, empty states, allowlist, privacy boundary, forbidden wording, accessibility, deploy integrity, empty-state copy, header button, README arc references |

**Tests added in arc:** 12 + 12 + 16 + 20 + 18 + 13 = **91 new tests** (2290 total after D-225A).
**Deploys required in arc:** 5 (D-220B, D-221B, D-222B, D-223B, D-224B — owner manual terminal deploy).
**D-225A:** Tests / docs only — no deploy needed.

---

## Public profile current behavior (post D-220→D-225)

| Feature | Behavior |
|---------|---------|
| Page structure | Header → Counts card → Section nav → Snapshot → Claims → Truths → Evidence → Pressure → About |
| Counts card | Public Activity badge row (Claims/Truths/Evidence/Pressure); always before snapshot |
| Section nav | `<nav aria-label="Public profile sections">` — four HTML anchor links; Snapshot always present; pure anchors, no JS |
| Copy profile link | `pp-copy-link` button in header for all visitors; `copyPublicProfileLink` uses `window.location.href`; no backend, no localStorage |
| Snapshot empty state | `pp-empty-card` with `id="public-snapshot"` always emitted; "No public snapshot shared yet." + "Public sections appear here when shared." |
| Claims empty state | `pp-empty-card` — "No public claims yet." |
| Truths empty state | `pp-empty-card` — "No public truths on this profile yet." |
| About/context block | Native `<details id="public-about"><summary>About this profile page</summary>` |
| Claim action buttons | `pp-item-actions` wrapper; `View in HumanX →`, `Copy link`; focus-visible ring; mobile `min-height:44px` |
| Public allowlist | `PUBLIC_PROFILE_ALLOWED_MARKERS` contract active — deny-by-default for new classes/copy |

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
| D-220→D-224 polish arc | **Locked** — cross-arc composite regression tests | D-225A |
| No new public data fields | **Confirmed** — D-220→D-225 arc introduced zero new API fields | D-225A |

---

## Deployment state

| Item | State |
|------|-------|
| D-220A | Owner deploy PASS — D-220B confirmed live |
| D-221A | Owner deploy PASS — D-221B confirmed live |
| D-222A | Owner deploy PASS — D-222B confirmed live |
| D-223A | Owner deploy PASS — D-223B confirmed live |
| D-224A | Owner deploy PASS — D-224B confirmed live |
| D-225A | Tests / docs only — **no deploy needed** |
| D-226A (this task) | Docs only — **no deploy needed** |
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

6. **D-225A regression lock** — any public profile change that modifies D-220→D-224 behavior must either leave all D-225A tests passing unchanged, or update the D-225A regression lock with explicit owner approval and a `D-225A/D-NNN` annotation on the modified test. Do not silently remove lock tests.

7. **D-216A public allowlist** — any new public profile class, text, or ID must be added to `PUBLIC_PROFILE_ALLOWED_MARKERS` with a comment and rationale before merge. Empty-state copy follows the same rule.

8. **Hard security rules (permanent):**
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
| Review / moderation ergonomics | Queue scanability, bulk actions, duplicate resolution UX |
| Claim / RunPack flow clarity | Investigation Packet workflow, AI-return parsing, stale detection |
| My HumanX private dashboard usability | Filter ergonomics, activity counts, account card clarity |
| Public profile microcopy polish | Small copy improvements within existing `PUBLIC_PROFILE_ALLOWED_MARKERS` contract |
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

## Full batch history (A-2 → D-226A)

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
| D-13 | `21e411a` | Advisory claim quality hints — frontend-only `claimQualityHints()` heuristic; live hints in Submit; soft "needs sharpening" badge on Review cards; full hint list in Inspect panel; no blocking, no score changes, no backend changes |
| D-14 | `a12f394` | Review quality filter — `~Quality` filter chip and `~Quality first` sort option; both use `claimQualityHints()`; advisory only |
| D-15 | `49db60b` | Review inspect navigation — position indicator + Prev/Next; compact action bar before fields; bottom row preserved |
| D-16 | `5fd1b0a` | Study reused evidence compression — outer-collapse threshold 10→4; ≤3 reused items use compact rows; `.study-sub-reused` styled muted |
| D-17 | `77129c7` | Investigation Packet workflow clarity — 4-step workflow guide; "Download Packet"; "Load AI Analysis Return"; raw JSON in collapsible details |
| D-18 | `9dd1668` | Study tool dock clarity — text-only renames in `index.html`; Evidence & Pressure section head highlighted blue in study mode |
| D-19 | `18cf5c9` | Sidepanel patch stabilization — static HTML elements moved out of dynamic injection; `patchRunPackPanel()` rewired to `#aip-status` |
| D-20 | `b2f53ee` | Study dock refinement — renamed sections; static microcopy; `min-height:32px` on `.runpack-side-status`; narrow-width stacking |
| D-21 | docs-only | Visual QA audit of D-15 → D-20 — all five focus areas pass; no regressions; no code changes |
| D-22 | docs-only | D-series stabilization release checkpoint — full D-1 → D-21 summary |
| D-23 | docs-only | Planning — D-23A: RunPack provenance; D-23B: investigation graph nav audit; D-23C: backend moderation tooling plan |
| D-24A | `4aef4e5` | Study navigation context preservation — `lastModeBeforeStudy`; `lastInspectedReviewItemId`; context-aware back button |
| D-24B | `16fa131` | RunPack provenance Phase 1 — `lastPacketMeta`; `packet_id`; `runpack_version:'1.2'`; staleness advisory; no backend |
| D-24F | docs+migration | Near-duplicate migration proposal — `migrations/0006_add_near_duplicate_of.sql`; safe for fresh D1 rebuilds only |
| D-24E | `5dc33e4` | Moderator duplicate resolution frontend controls — `markDuplicateUI`, `resolveSimilarUI`; 4 new smoke checks (91→95) |
| D-24D | `f2def3b` (PR #86) | Moderator duplicate-resolution backend routes — `POST /api/review/mark-duplicate`, `POST /api/review/resolve-similar`; worker-route-static-check 35→39 |
| D-53 | docs-only | Launch seed data quality audit plan |
| D-54 | docs-only | Seed data inventory and classification |
| D-55 | docs-only | Launch seed pack draft |
| D-56 | docs-only | Launch seed source gathering checklist |
| D-57 | docs-only | Launch seed JSON draft |
| D-58 | docs-only | Seed import route safety plan |
| D-210B | `233861b` | **[Arc start]** Private Reflection Avatar concept card |
| D-210C | `60ffdf8` | Reflection Avatar live closeout |
| D-211A | `08db623` | Reflection Avatar transparency disclosure |
| D-212A | `5da4699` | Reflection Avatar hide/show (localStorage-only) |
| D-212B | `6c86c37` | D-212A live closeout |
| D-213A | `e9ecdc4` | Reflection Avatar accessibility |
| D-213B | `7ff1684` | D-213A live closeout |
| D-214A | `814a627` | Reflection Avatar regression lock (55 tests) |
| D-215A | `a5eaa97` | My HumanX privacy boundary lock (43 tests) |
| D-216A | `93783d1` | Public Profile allowlist contract (79 tests) |
| D-217A | `5c8dbe2` | Hardening smoke index — structured comment index; 20 maintainability tests |
| D-218A | `c4ba537` | Worker route warning audit — `KNOWN_PARAM_ROUTES`; 9 smoke tests |
| D-219A | `<checkpoint>` | Post-hardening checkpoint — `PROJECT_STATE.md` updated; docs only |
| D-220A | `03ff140` | **[Arc start]** Public profile visual polish — counts top; `<details>`; `pp-item-actions`; truths empty state |
| D-220B | `9ba04ae` | D-220A live closeout — 21-item sanity PASS |
| D-221A | `89ab5e1` | Public profile accessibility — focus-visible; mobile touch targets |
| D-221B | `c31dc8f` | D-221A live closeout — 20-item sanity PASS |
| D-222A | `b967601` | Public profile copy link — `pp-copy-link`; `window.location.href`; "Link copied" |
| D-222B | `c019a23` | D-222A live closeout — 24-item sanity PASS |
| D-223A | `23eea66` | Public profile section nav — `<nav>`; four anchor links; section IDs |
| D-223B | `a5e6979` | D-223A live closeout — 26-item sanity PASS |
| D-224A | `910b4db` | Public profile empty states — `pp-empty-card`; snapshot id always; Snapshot nav unconditional |
| D-224B | `053cc67` | D-224A live closeout — 25-item sanity PASS |
| D-225A | `ad01e7d` | Public profile polish regression lock — 13 cross-arc composite tests; no deploy |
| D-226A | TBD | **[Current]** Public profile milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
