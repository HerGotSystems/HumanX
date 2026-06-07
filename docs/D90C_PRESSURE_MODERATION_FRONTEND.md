# D-90C — Pressure Point Moderation Frontend

**Branch:** `feature/d90c-pressure-moderation-frontend`
**Stacked on:** `feature/d90b-pressure-moderation-backend`
**PR:** pending (DO NOT MERGE — stacked on D-90B and requires production D1 migration 0009 before Worker deploy)
**Date:** 2026-06-08

---

## ⚠️ DO NOT MERGE / DEPLOY BEFORE PRODUCTION D1 MIGRATION

This PR is stacked on `feature/d90b-pressure-moderation-backend`. Both D-90B and D-90C must be reviewed before either is merged. Required deployment sequence:

1. D-90B backend PR merged to `main`
2. D-90C frontend PR merged to `main`
3. D-90E: production D1 migration 0009 applied (explicit per-session approval required)
4. Worker deployed to production

---

## What Changed

### `public/app-v10.js`

#### A. `addCaseItem` — submission toast

**Before:** `'Attack / pressure attached to selected claim.'`
**After:** `'Pressure point submitted for review.'`

Makes clear to the user that pressure is not immediately public — it enters the moderation queue.

#### B. `reviewCard` — pressure item rendering

Added `isPressure` variable alongside `isTruth` and `isEvidence`.

- **Badge colour:** `b-orange` (new CSS class — distinctive orange for Pressure items)
- **Title:** `item.title || 'Pressure Point'`
- **Meta parts:** `severity x/5`, submitter handle, parent claim snippet
- **Card modifier class:** `review-card-pressure` (new CSS class — subtle orange left-border tint)
- **Quality hints:** skipped for pressure (`&&!isPressure` guard)

#### C. `renderReviewInspectPanel` — pressure inspect fields

Added `isPressure` detection and a dedicated branch for pressure items:

| Field | Source |
|-------|--------|
| Title | `item.title` |
| Body | `item.body` |
| Severity | `item.severity` + `/5` |
| Parent Claim | `item.parent_claim` |
| Claim ID | `item.claim_id` |
| Submitted By | `item.handle` |
| Review State | badge (`b-green`/`b-yellow`/`b-red`) |
| Report Count | `item.report_count` (if > 0) |

**Study button:** uses `item.claim_id` → `openReviewClaimStudy` opens the parent claim (same as evidence inspect behaviour).

**Duplicate controls (`dupSection`):** hidden for pressure. `canMarkDup` and `dupSection` now guard on `!isPressure` in addition to `!isTruth && !isEvidence`.

**Quality hints (`qhintsHtml`):** hidden for pressure (same guard updated).

**Badge colours:** All three badge occurrences in the inspect panel updated to include `isPressure ? 'b-orange'` branch.

**`nearDup`:** set to `null` for pressure (no similar-claim advisory applicable).

#### D. `applyReviewFilter` — pressure filter + quality exclusion

- Added dedicated `pressure` filter branch:
  ```js
  if (f === 'pressure') return list.filter(i => (...) === 'pressure');
  ```
- `quality` filter: `tp === 'pressure'` now also returns `false` (pressure items never have claim quality hints).

#### E. `renderReviewFilterBar` — Pressure chip

- Added `pressure` count to the `counts` object:
  ```js
  pressure: list.filter(i => (...) === 'pressure').length
  ```
- Added `['pressure', 'Pressure']` to the `defs` chip array (placed after `~Quality`, before `Dupes`).

#### F. `renderReviewAuditSummary` — Pressure stat

- Added `pressureCount` computation:
  ```js
  const pressureCount = items.filter(i => (...) === 'pressure').length;
  ```
- Added `{ label: 'Pressure', n: pressureCount, cls: 'orange' }` to the `stats` array.

### `public/styles.css`

#### New: `.b-orange`

```css
.b-orange { color: #ff9a3c; border-color: #ff9a3c66 }
```

Orange badge for Pressure items. Distinct from `b-yellow` (truths / pending state) and `b-purple` (evidence). Colour `#ff9a3c` chosen to be visually accessible and clearly distinct from existing badge palette.

#### New: `.review-card-pressure`

```css
.review-card-pressure {
  border-left: 3px solid #ff9a3caa;
  background: linear-gradient(180deg, rgba(255,154,60,.04), rgba(16,19,29,.86))
}
```

Subtle orange tint, matching the pattern of `review-card-truth` (amber) and `review-card-public` (green).

### `scripts/hardening-smoke-test.mjs`

Section 31 added: **15 new tests** covering all D-90C changes.

| Test | What it checks |
|------|----------------|
| `reviewCard defines isPressure variable` | `const isPressure=type==='pressure'` present |
| `reviewCard skips quality hints for pressure` | `&&!isPressure)?claimQualityHints(` present |
| `reviewCard uses b-orange badge for pressure` | `isPressure?'b-orange':` present |
| `reviewCard applies review-card-pressure class` | `pressureMod` variable and class present |
| `reviewCard pressure metaParts include severity` | `'severity '+(item.severity\|\|1)+'/5'` present |
| `renderReviewInspectPanel isPressure branch with fields` | `}else if(isPressure){` branch + Severity, Parent Claim, Claim ID fields |
| `renderReviewInspectPanel pressure Study button uses claim_id` | `isPressure?(item.claim_id?...openReviewClaimStudy` |
| `renderReviewInspectPanel canMarkDup excludes pressure` | `!isTruth&&!isEvidence&&!isPressure&&state` |
| `addCaseItem pressure toast updated` | `'Pressure point submitted for review.'` present, old toast absent |
| `applyReviewFilter has pressure filter` | `f==='pressure')return list.filter(...)==='pressure')` |
| `applyReviewFilter quality filter excludes pressure` | `tp==='pressure')return false;return claimQualityHints` |
| `renderReviewFilterBar has pressure chip and count` | `pressure:list.filter(...)` and `['pressure','Pressure']` |
| `renderReviewAuditSummary includes Pressure stat` | `{label:'Pressure',n:pressureCount,cls:'orange'}` |
| `CSS b-orange badge class exists` | `.b-orange{` in styles.css |
| `CSS review-card-pressure class exists` | `.review-card-pressure{` in styles.css |

D-43 test updated: `dupSection` guard pattern changed from `(!isTruth&&!isEvidence)?` to `(!isTruth&&!isEvidence&&!isPressure)?` (correct after pressure exclusion added).

### `docs/README.md`

Hardening count updated: **175 → 190** (175 baseline + 15 new Section 31 tests).

---

## Static Check Output

```
node --check src/worker.js          → syntax OK (exit 0)
node --check src/claim-scoring.js   → syntax OK (exit 0)
node --check public/app-v10.js      → syntax OK (exit 0)
hardening-smoke-test.mjs            → 190 passed, 0 failed
belief-engine-static-check.mjs      → 24 passed, 0 failed (24 hard checks)
worker-route-static-check.mjs       → 39 passed, 0 failed (39 hard checks)
```

Hardening count increased from **175 → 190** (+15 new tests in Section 31; D-43 test updated for pressure exclusion in dupSection guard).

---

## No Backend Changes

This PR is frontend-only (`public/app-v10.js`, `public/styles.css`). No changes to `src/worker.js`, `src/claim-scoring.js`, or any migration files.

---

## Future Steps

| Batch | Action | Gate |
|-------|--------|------|
| D-90D | Docs-only validation checkpoint | None — docs only |
| D-90E | Production D1 migration 0009 apply | **Explicit approval required** |
| Deploy | Worker deployed after D-90E confirms migration applied | After D-90E |
| D-90F | Manual live pressure lifecycle test | **Explicit approval required** |

---

## Files Changed

| File | Change |
|------|--------|
| `public/app-v10.js` | `reviewCard`, `renderReviewInspectPanel`, `applyReviewFilter`, `renderReviewFilterBar`, `renderReviewAuditSummary`, `addCaseItem` |
| `public/styles.css` | `.b-orange`, `.review-card-pressure` |
| `scripts/hardening-smoke-test.mjs` | Section 31 (+15 tests); D-43 dupSection guard updated |
| `docs/README.md` | Hardening count updated 175 → 190 |
| `docs/PROJECT_STATE.md` | D-90C entry added |
| `docs/D90C_PRESSURE_MODERATION_FRONTEND.md` | This file |
