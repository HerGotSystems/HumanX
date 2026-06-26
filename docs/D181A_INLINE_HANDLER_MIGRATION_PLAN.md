# D-181A — Inline Handler Inventory and Event Binding Migration Plan

**Date:** 2026-06-26
**Type:** Analysis only. No runtime changes. No deploy.
**Baseline:** 1366/24/57
**Purpose:** Catalogue all inline event handlers and inline styles in the HumanX SPA and belief engine. Establish a safe removal path for the `unsafe-inline` dependencies in the deployed CSP.

---

## Safety Constraints

- No runtime code changed in this task.
- No CSP tightening applied.
- No migration.
- No auth/token/review logic touched.
- Admin token not referenced.

---

## Context

D-179B deployed a permissive CSP on public HTML responses with `'unsafe-inline'` retained in both `script-src` and `style-src`. D-179A audit documented that removing `'unsafe-inline'` requires migrating inline handlers and inline styles. This document is the roadmap for that work.

---

## Files in Scope

| File | Role | Served by |
|---|---|---|
| `public/app-v10.js` | Main SPA — all HTML built via template literals, inserted via `innerHTML` | Worker static + public profile shell |
| `public/apps/humanx-belief-engine/index.html` | Standalone belief engine | Static file serving — NOT via Worker HTML injection |
| `public/apps/humanx-belief-engine/humanx-bridge.js` | Bridge between belief engine and HumanX API | Static file, loaded by index.html |

**Scope note:** The CSP added in D-179B applies only to `renderPublicProfileShell()` — the `/u/:slug` route. The main SPA index.html and belief engine are served via separate paths. If CSP is to be tightened further, each HTML document needs its own header.

---

## Part 1 — app-v10.js (Main SPA)

### 1.1 Inline Event Handler Count

| Event type | Lines containing pattern | Notes |
|---|---|---|
| `onclick=` | 47 lines | Most lines contain multiple handlers in template literals |
| `oninput=` | 2 lines | Live-update handlers |
| `onchange=` | 3 lines | Select/checkbox change handlers |
| **Total handler-bearing lines** | **52** | |
| **Estimated individual attributes** | **~130** | Many template literals contain 5–15 handlers per line |

All event handlers are written as HTML attributes inside JavaScript template literals that are assigned to `element.innerHTML`. The browser's HTML parser applies CSP to these strings identically to static HTML — `onclick=` in innerHTML is blocked by `script-src` without `'unsafe-inline'`.

### 1.2 Inline Style Count

| Pattern | Lines | Notes |
|---|---|---|
| `style="..."` static values | ~18 lines | `display:none`, `margin-top`, `grid-column`, `width:100%`, etc. |
| `style="${...}"` dynamic values | ~7 lines | Computed styles; most critical are meter bar widths |
| **Total** | **25 lines** | Matches D-179A audit count |

---

### 1.3 Handler Categories

#### Category A — Simple zero-parameter handlers
**Count:** ~30 handlers
**Risk:** LOW
**Migration path:** `querySelector` + `addEventListener('click', fn)` after innerHTML assignment, or element creation pattern.

These handlers call a named function with no arguments, and appear on a single static element per render cycle:

| Handler | Location | Notes |
|---|---|---|
| `saveAdminTokenAndLoadReview()` | `renderReview()` (line 300) | Load Queue button |
| `clearAdminToken()` | `renderReview()` (line 300) | Clear Token button |
| `backToArena()` | `renderStudy()` (line 358) | Back button in study view |
| `generateRunPack()` | `renderStudy()`, `renderExport()` | Two separate buttons |
| `copyAIP()` | Study side panel | |
| `downloadRunPack()` | `renderExport()` | |
| `downloadJSON()` | `renderExport()` | |
| `builderNext(1)` | `renderBuilderStep1()` (line 156) | Fixed arg — effectively zero-param |
| `builderNext(2)` | `renderBuilderStep2()` (line 157) | Same |
| `builderBack()` | Steps 2 and 3 | Back button |
| `saveProfileSettingsUI()` | `meProfileSettingsHtml()` (line 246) | Save button |
| `meCopyProfileLink()` | `meProfileSettingsHtml()` (line 246) | Copy link button |
| `exportMyHumanXData()` | `meAccountCardHtml()` (line 215) | Export button |
| `toggleReviewAudit()` | `renderReviewAuditSummary()` (line 336) | Audit toggle |
| `addCaseItem()` | Study side panel | Side panel attachment |
| `addHomeTestUI()` | `sectionTests()` (line 376) | Add test button |
| `redeemInviteUI()` | `accountPanelHtml()` (line 116) | Redeem button |
| `createInviteCodeUI()` | `renderAdminInvitePanel()` (line 305) | Create invite button |
| `submitBuilderClaim()` | Steps 2 and 3 | |
| `submitBuilderTruth()` | Steps 2 and 3 | |
| `submitTruth()` | `renderTruths()` (line 176) | |
| `voteClaim('believe')` | `renderStudy()` (line 358) | Fixed string arg |
| `voteClaim('reject')` | Same | |
| `voteClaim('unsure')` | Same | |
| `cancelApproveReview()` | `reviewCard()`, inspect panel | |
| `cancelRejectReview()` | Same | |
| `cancelCleanupReview()` | Inspect panel | |
| `closeAttachModal()` | `attachEvidencePrompt()` (line 349) | |
| `saveAnalysisResult()` | `sectionAnalyses()`, `renderExport()` | Two buttons |
| `meShareSnapshotUI(null)` | `meBeliefSnapshotsHtml()` (line 281) | "Do not share" radio |
| `toggleAccountPanel()` | `accountPanelHtml()` (line 116) | Close button in panel |
| `location.href='/apps/humanx-belief-engine/'` | Multiple places | Navigation — can become `a[href]` or `button[data-href]` |

---

#### Category B — Known-literal parameter chip handlers
**Count:** ~50 handler attributes (many in loops over known string sets)
**Risk:** LOW-MEDIUM
**Migration path:** `data-action` + `data-value` attributes + single delegated listener on each chip container.

These handlers pass a string literal (known at render time, not user data) as a parameter:

| Handler | Location | Parameters |
|---|---|---|
| `setMode('arena')`, `setMode('submit')`, etc. | `renderHome()` (line 136) | 8 known mode strings |
| `setReviewFilter('review')`, etc. | `renderReviewFilterBar()` (line 317) | 11 known filter strings |
| `meSetFilter('all')`, etc. | `meFilterBarHtml()` (line 214) | 6 known state strings |
| `setTruthAdminFilter('all')`, etc. | `renderTruthFilterBar()` (line 182) | 5 known filter strings |
| `builderSetCat('Medicine')`, etc. | `renderBuilderStep2()` (line 157) | 8 known category strings |
| `doAttachEvidence('support')` / `'pressure'` | `attachEvidencePrompt()` (line 349) | 2 fixed strings |

**Delegation example:**
```js
// Replace: <button onclick="setReviewFilter('${f}')">
// With:    <button data-filter="${f}">
// Then one listener:
container.addEventListener('click', e => {
  const f = e.target.closest('[data-filter]')?.dataset.filter;
  if (f) setReviewFilter(f);
});
```

---

#### Category C — ID-interpolated handlers (per-item cards)
**Count:** ~60–80 handler attributes
**Risk:** MEDIUM
**Migration path:** `data-id`, `data-action`, `data-type` attributes on each card + delegated listener on the grid/list container.

These handlers embed a dynamic ID (claim ID, review item ID, snapshot ID, etc.) from the rendered data:

| Handler | Location | Delegated container |
|---|---|---|
| `selectClaim('${c.id}')` | `card()` (line 150), post-submit screens | `#main` or grid container |
| `inspectReviewItem('${id}')` | `reviewCard()` (line 322) | `#reviewList` |
| `promoteBelief('${s.id}','truth'/'claim')` | `beliefSnapshotCard()` (line 142) | Drift/belief grid |
| `meArchiveItemUI('claim','${c.id}')` | `meRecentClaimsHtml()` (line 271) | `.me-item-list` |
| `meArchiveItemUI('truth','${t.id}')` | `meRecentTruthsHtml()` (line 272) | `.me-item-list` |
| `meArchiveItemUI('evidence','${e.id}')` | `meRecentEvidenceHtml()` (line 273) | `.me-item-list` |
| `meArchiveItemUI('pressure','${p.id}')` | `meRecentPressureHtml()` (line 274) | `.me-item-list` |
| `archiveTruthArtefact('${t.id}')` | `truthCard()` (line 193) | Truth grid |
| `copyTruthId('${t.id}')` | `truthCard()` (line 193) | Same |
| `openReviewClaimStudy('${id}')` | `renderReviewInspectPanel()` (line 340), inspect fields | `#reviewList` |
| `openMyClaimStudy('${c.id}')` | `meRecentClaimsHtml()` (line 271) | Me panel |
| `openPublicProfileClaimStudy('${c.id}')` | `renderPublicProfileClaimsHtml()` (line 252) | Public profile |
| `meToggleExpand('${key}')` | `meShowAllControl()` (line 213) | Me panel |
| `meShareSnapshotUI('${s.id}')` | `meBeliefSnapshotsHtml()` (line 281) | Snapshot list |
| `requestRejectReview('${id}')` | `reviewCard()` (line 322) | `#reviewList` |
| `requestApproveReview('${id}')` | `reviewCard()` (line 322) | `#reviewList` |
| `requestCleanupReview('${id}')` | Inspect panel (line 340) | `#reviewList` |
| `reviewDecisionUI('${type}','${id}','public'/'rejected'/'review')` | Multiple in inspect panel | `#reviewList` |
| `markDuplicateUI('${id}')` | Inspect panel (line 340) | `#reviewList` |
| `resolveSimilarUI('${id}')` | Inspect panel (line 340) | `#reviewList` |
| `reviewCleanupUI('${type}','${id}')` | Inspect panel (line 340) | `#reviewList` |
| `copyAdminInviteCode('${code}')` | `createInviteCodeUI()` (line 306) | `#adminInviteResult` |
| `studyFromVault('${g.claimId}')` | `vaultGroupsHtml()` (line 172) | Vault groups |
| `attachEvidencePrompt('${e.id}')` | `evidenceCard()` (line 174) | Vault grid |
| `ppToggleShowMore(this)` | `renderPublicProfileEvidenceHtml()` (line 254) | Profile section — `this` complicates delegation |
| `copyPublicProfileLink(this,'${p.slug}')` | `renderPublicProfileHtml()` (line 265) | `this` reference |
| `inspectReviewItem('${id}')` | Inspect panel nav prev/next (line 340) | `#reviewList` |

**Note on `this` references:** `ppToggleShowMore(this)` and `copyPublicProfileLink(this, ...)` pass the button element itself. In delegated handlers, `e.target.closest('button')` provides the same reference.

---

#### Category D — Computed/conditional onclick values
**Count:** 5–8 handler attributes
**Risk:** HIGH
**Migration path:** Move state tracking into JS; delegate based on JS state, not on HTML attribute.

These are the most structurally complex handlers — the handler body or function name is computed at render time from JS state:

**Example 1: `onclick="${claimMeta.btnAction}"`** (line 193, truthCard)
`claimMeta.btnAction` is a string like `"convertTruth('tru_xxx')"` or `"openTruthClaimStudy('clm_xxx')"`. The correct handler is computed by `truthClaimStateMeta()` based on linked claim state.

**Migration:** Store `data-truth-id` and `data-linked-claim-id` and `data-linked-state` on each truth card button. Delegate on truth grid; the handler reads current truth state from the data attributes and calls the right function.

**Example 2: `onclick="${isPendingApprove ? 'reviewDecisionUI(...)' : 'requestApproveReview(...)'}"` (line 340)**
This conditional is rendered into the HTML; if JS state (`pendingApproveReviewId`) matches the item, the button becomes a confirm button. The condition is re-evaluated on every `renderReviewList()` call.

**Migration:** `renderReviewList()` already re-renders completely on every state change. Replace the inline conditional with `data-action` that encodes the current state, read in the delegated handler.

---

#### Category E — oninput and onchange handlers
**Count:** 6 handler attributes
**Risk:** MEDIUM-HIGH
**Migration path:** `element.addEventListener('input'/'change', fn)` immediately after the containing `innerHTML` assignment.

| Handler | Element | Location |
|---|---|---|
| `oninput="builderLiveFlags()"` | `<textarea id="bRaw">` | `renderBuilderStep1()` (line 156) |
| `oninput="meUpdateProfilePreview()"` | `<input id="meProfileSlugInput">` | `meProfileSettingsHtml()` (line 246) |
| `oninput="meUpdateProfilePreview()"` | `<textarea id="meProfileBioInput">` | Same |
| `onchange="meUpdateProfilePreview()"` | `<input id="meProfilePublicToggle">` | Same |
| `onchange="builderSetType(this.value)"` | `<select id="bType">` | `renderBuilderStep2()` (line 157) |
| `onchange="setReviewSort(this.value)"` | `<select class="review-sort-select">` | `renderReviewFilterBar()` (line 317) |

**Post-render binding pattern:**
```js
// After: document.getElementById('main').innerHTML = html
document.getElementById('bRaw')?.addEventListener('input', builderLiveFlags);
document.getElementById('meProfileSlugInput')?.addEventListener('input', meUpdateProfilePreview);
```

`builderLiveFlags` fires on every keystroke — ensure it remains lightweight (it already is: pure flag computation, no API calls).

---

### 1.4 Inline Style Migration

#### Static inline styles (easy)
These can become CSS utility classes or element-specific CSS rules:

| Pattern | Count | Replacement |
|---|---|---|
| `style="display:none"` | ~5 | `.hidden { display:none }` class |
| `style="grid-column:1/-1"` | ~5 | `.grid-full { grid-column:1/-1 }` class |
| `style="margin-top:Npx"` | ~4 | Existing spacing classes or new `.mt-N` utilities |
| `style="width:100%;box-sizing:border-box;..."` | ~2 | Modal input CSS rule |
| `style="${canCopy?'':'display:none'}"` | 1 | Toggle a `.hidden` class in JS after render |

#### Dynamic inline styles (hardest)
The critical blocker is `meter()` and `deltaMeter()`:

```js
// Current (line 130):
function meter(n,v){
  v=Math.max(0,Math.min(100,Number(v||0)));
  return `....<div class="fill" style="width:${v}%"></div>...`
}
```

`style="width:${v}%"` is set dynamically for each meter bar. This is what forces `style-src 'unsafe-inline'`. The meter function is called in:
- Every claim card (`card()`, `reviewCard()`)
- Every belief snapshot card (`beliefSnapshotCard()`)
- Evidence vault cards
- Study view
- Public profile belief snapshot
- Me panel mirrors
- Drift panel

**Migration options for meter width:**

Option 1 — Post-render JS style assignment *(recommended)*:
```js
// meter() emits: <div class="fill" data-pct="${v}"></div>
// After innerHTML assignment:
el.querySelectorAll('.fill[data-pct]').forEach(b => {
  b.style.width = b.dataset.pct + '%';
});
```
This is NOT blocked by CSP — `element.style.width = '70%'` is a DOM API call, not an HTML attribute.

Option 2 — `<progress>` element:
```html
<progress value="${v}" max="100" class="meter-bar"></progress>
```
Native browser rendering; no inline style. Requires CSS to replace custom meter styling. Significant visual refactor.

Option 3 — CSS `width: var(--pct)` via inline custom property:
NOT viable — setting `style="--pct:70%"` IS an inline style attribute and IS still blocked by `style-src` without `unsafe-inline`. Custom properties on inline styles are not exempt.

**Recommendation:** Option 1 — a `patchMeterWidths(container)` function called after each innerHTML assignment. Low-risk, no visual change.

---

## Part 2 — humanx-belief-engine/index.html

### Scope

The belief engine is a standalone HTML page served from `/apps/humanx-belief-engine/`. It is **not** served by the Worker's `renderPublicProfileShell()`. It has its own HTML document and would need a separate CSP header if CSP is to be applied there.

### 2.1 Handler Count

| Pattern | Lines |
|---|---|
| `onclick=` (static HTML attributes) | 17 |
| `onclick=` in JS template literals | 7 |
| `oninput=` | 0 |
| `onchange=` | 0 |
| **Total** | **24 handler-bearing lines** |

Static HTML handlers (not in JS template literals):
- `startQuiz()`, `showResults()`, `clearSavedResults()`, `skipIdentity()`
- `setProfileMode('main'/'sandbox'/'anonymous')` — data attributes on `.mode-card` divs
- `confirmIdentity()`, `skipTimeline()`, `finishQuiz()`
- `prevCat()`, `nextCat()`
- `downloadShare()`, `copyShareText()`, `retake()`
- `closeInfo()`, info backdrop dismiss

These are straightforward — simpler than app-v10.js since they're static HTML attributes (not innerHTML injection).

### 2.2 Inline Script Block

Line 698 of `index.html` opens a large `<script>` block (~2000 lines of in-document JS). This is the **primary blocker for removing `script-src 'unsafe-inline'` from any CSP on the belief engine page**. The entire quiz logic is inline.

**Migration options:**
1. Extract to `humanx-belief-engine.js` external script file — large but clean
2. Hash-based `script-src` — compute SHA-256 of the script block; add `'sha256-...'` to CSP; do not use `'unsafe-inline'`. This removes the refactoring burden but requires updating the hash on every script change.

### 2.3 Inline Style Count

54 lines contain `style=` attributes — many with dynamic values computed in template literals. Separate audit needed if CSP is to be tightened on this page.

---

## Part 3 — Migration Phase Ordering

### Phase 1 — Cat B: Literal-param chip handlers
**Effort:** Low. **Risk:** Low.
Migrate filter chips (setReviewFilter, setMode, meSetFilter, setTruthAdminFilter, builderSetCat) to `data-action`/`data-value` + single delegated listener per chip bar. No ID interpolation; all parameters are known string literals.

### Phase 2 — Cat A: Zero-parameter handlers
**Effort:** Low. **Risk:** Low.
Replace with `querySelector` + `addEventListener` calls added to each render function after `innerHTML` assignment. Can be done function by function without touching other handlers.

### Phase 3 — Cat C: ID-interpolated card handlers
**Effort:** High. **Risk:** Medium.
Add `data-id`, `data-action`, `data-type` attributes to all dynamically-generated card and list-item templates. Add delegated listeners to stable container elements (`#main`, `#reviewList`, etc.). This is the largest migration block — ~60 handler attributes across 15+ render functions.

### Phase 4 — Cat E: oninput/onchange handlers
**Effort:** Low-medium. **Risk:** Medium-high (live-update timing).
Post-render `addEventListener('input'/'change', fn)` binding. Requires a helper to ensure bindings are reattached after each re-render. Risk: if innerHTML is rewritten without re-binding, the live update breaks silently.

### Phase 5 — Cat D: Computed/conditional onclick
**Effort:** High. **Risk:** High.
Refactor `truthCard()` to use `data-truth-id` + `data-linked-claim-id` + `data-linked-state`. Refactor review inspect panel to store approve/reject state in JS, not in HTML attributes.

### Phase 6 — Inline style removal
**Effort:** Medium. **Risk:** Medium.
Add `patchMeterWidths(container)` function for meter/deltaMeter bars. Replace static `style=` values with CSS classes. Call patch function after every `innerHTML` assignment that produces meters.

---

## Part 4 — Prerequisites Before Removing unsafe-inline

### To remove `script-src 'unsafe-inline'` from app-v10.js CSP:
Phases 1–5 complete (all ~130 inline event handler attributes gone from all innerHTML strings).

**Estimated handler count to eliminate:** ~130 individual handler attributes across 52 handler-bearing lines.

### To remove `style-src 'unsafe-inline'` from app-v10.js CSP:
Phase 6 complete (meter() bars no longer use `style="width:${v}%"`; all static inline styles converted to CSS classes).

**Estimated inline style count to eliminate:** 25 lines; critical path is `meter()` + `deltaMeter()`.

### For belief engine (`/apps/humanx-belief-engine/index.html`):
Separate chain. Requires:
- Extract or hash the inline `<script>` block (primary blocker for script-src)
- Migrate 24 inline event handler attributes
- Migrate 54 inline style attributes
- Add CSP header to the belief engine HTML response (not currently served via Worker injection)

---

## Part 5 — Risk Assessment by Area

| Area | Handlers | Risk | Notes |
|---|---|---|---|
| Review filter chips | ~11 | Low | Known strings, single container |
| Me panel filter chips | ~6 | Low | Same pattern |
| Mode nav chips (renderHome) | ~8 | Low | Same pattern |
| Category chips (builder) | ~8 | Low | Same pattern |
| Zero-param buttons | ~30 | Low | Static targets; safe to add listeners post-render |
| Claim cards (selectClaim) | ~6 | Medium | Rendered in loop; delegation straightforward |
| Review cards (inspect/reject/approve) | ~25 | Medium | Complex card logic; delegation needs type+id |
| Me panel item rows (archive) | ~8 | Medium | Per-item; delegation on `.me-item-list` |
| Truth cards (archive/copy/convert) | ~6 | Medium | Per-item; delegation on truth grid |
| Profile snapshot handlers | ~4 | Medium | |
| oninput live-update handlers | 3 | Medium-high | Timing risk on re-render |
| Computed onclick (truthCard, review inspect) | ~6 | High | State must move from HTML to JS |
| meter() inline width | everywhere | High | Most widely used function; post-render patch needed |
| Belief engine inline `<script>` | 1 block | High | ~2000 lines; extract or hash |

---

## Part 6 — What D-181A Does Not Claim

- Does not claim all handlers have been counted exactly — some template literals contain variable numbers of handlers based on runtime state.
- Does not claim migration is low-risk overall — Phases 3–6 require careful per-function testing.
- Does not claim CSP tightening should happen in one patch — each phase is a separate chain.
- Does not recommend a specific D-181B patch scope — that decision belongs to the owner.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.

---

## Recommended Next Steps

After owner reviews this inventory:

- **D-181B:** Phase 1 + Phase 2 (chip delegation + zero-param handlers) — low risk, large handler count reduction, no visual change
- **D-181C:** Phase 3 (ID-interpolated card handlers) — bulk of the migration; requires per-function review
- **D-181D:** Phase 4 + 5 (live-update and computed handlers) — complete inline handler removal
- **D-181E:** Phase 6 (inline style migration; meter post-render patch) — unblocks style-src removal
- **D-182A:** Belief engine CSP audit (separate chain — different HTML document)
