# D-43: Evidence Review Frontend Polish

Date: 2026-06-06
Branch: direct main (frontend-only change)
Status: Complete. Commit: `ui: support evidence review items`

---

## Purpose

D-42B (merged PR #98) added evidence items to the admin Review queue with
`target_type='evidence'`. Before D-43, evidence cards rendered with placeholder
text ("Claim", "—") and exposed claim-specific controls (Mark Duplicate, Dismiss
~Similar, Open Study View using evidence ID) that are meaningless or harmful for
evidence items.

D-43 makes evidence items fully usable in the admin Review UI.

---

## Changes — `public/app-v10.js`

### `reviewCard(item)`

- Added `const isEvidence = type === 'evidence'` after `isTruth` declaration
- Title: `isEvidence ? (item.title||'Evidence') : isTruth ? ... : item.claim`
- Type badge: `isEvidence ? 'b-purple' : isTruth ? 'b-yellow' : 'b-blue'`
- `scoreHint`: evidence uses `item.stance || 'evidence'` instead of `evidence_score`
- `metaParts`: evidence shows `[item.stance, item.quality]` instead of category/status/score
- `qhints`: `(!isTruth && !isEvidence)` — quality hints are claim-only

### `renderReviewInspectPanel(item)`

- Added `const isEvidence = type === 'evidence'` after `isTruth` declaration
- Title: same three-way logic as `reviewCard`
- Type badge in fields row: `isEvidence ? 'b-purple' : ...`
- Type badge in panel header: `isEvidence ? 'b-purple' : ...`
- Evidence-specific fields block added before the `isTruth` branch:
  title, body, stance, quality, source_url (as clickable link), parent_claim, claim_id
- `nearDup`: forced to `null` for evidence (evidence has no `near_duplicate_of`)
- `studyBtn`: evidence links to parent claim via `item.claim_id`, not the evidence ID
- `dupSection`: `(!isTruth && !isEvidence)` — Mark Duplicate and Dismiss ~Similar
  are claim-only controls; hidden for evidence
- `qhints`: `(!isTruth && !isEvidence)` — quality hints are claim-only

### `reviewDecisionUI(targetType, targetId, decision)`

- Added `item.title` to the label fallback chain:
  `item.statement || item.claim || item.title || targetId`

### `applyReviewFilter(list)` — quality filter

- Changed `if(tp === 'truth') return false` →
  `if(tp === 'truth' || tp === 'evidence') return false`
- Evidence items are not evaluated for claim quality hints

### `renderReviewFilterBar(list)` — quality count

- Same fix: evidence excluded from quality chip count

---

## Changes — `public/styles.css`

Added `.b-purple` badge class (after `.b-quality`):

```css
.b-purple{color:var(--purple);border-color:#a066ff66}
```

Uses the existing `--purple` CSS variable already defined in the root theme.
Evidence items in the review queue now show a distinct purple type badge,
separate from claim (blue) and truth (yellow).

---

## Changes — `scripts/hardening-smoke-test.mjs`

Added section 24 with 2 checks (108 → 110):

1. `reviewCard handles target_type 'evidence' — isEvidence branch present (D-43)`
   - Checks `const isEvidence=type==='evidence';` is present in app source
   - Checks `isEvidence?(item.title||'Evidence')` title logic is present

2. `renderReviewInspectPanel hides duplicate controls for evidence (D-43)`
   - Checks `(!isTruth&&!isEvidence)?((canMarkDup?` dupSection guard
   - Checks `isEvidence?(item.claim_id?` studyBtn evidence branch

Self-reference updated: `108 passed, 0 failed` → `110 passed, 0 failed`

---

## Evidence item shape in review queue (from D-42B)

```js
{
  target_type: 'evidence',
  id,
  claim_id,
  title,
  body,
  source_url,
  stance,
  quality,
  review_state,
  report_count,
  created_at,
  parent_claim,         // from JOIN claims c ON c.id = e.claim_id
  latest_report_reason  // from correlated subquery on reports
}
```

Fields absent on evidence (present on claims): `claim`, `category`, `status`,
`near_duplicate_of`, `evidence_score`, `testability`, `survivability`,
`contradictions`, `duplicate_of`, `handle`, `type`.

---

## What is NOT changed

- `src/worker.js` — no backend changes
- No D1 commands or migrations
- No new API routes
- `requestRejectReview` / `cancelRejectReview` — type-agnostic, no changes needed
- Approve / Keep Pending / Reject decision flow — calls `reviewDecisionUI` which
  already passes `targetType` through to the backend; backend D-42B supports
  `targetType='evidence'`

---

## Static checks

| Check | Before | After |
|-------|--------|-------|
| `hardening-smoke-test.mjs` | 108 passed | 110 passed |
| `belief-engine-static-check.mjs` | 24 passed | 24 passed (unchanged) |
| `worker-route-static-check.mjs` | 39 passed | 39 passed (unchanged) |
| `node --check public/app-v10.js` | exit 0 | exit 0 |
| `node --check src/worker.js` | exit 0 | exit 0 |

---

## D-43 completion record

| Item | Status |
|------|--------|
| `reviewCard` — isEvidence + title + badge + metaParts + qhints | ✅ Done |
| `renderReviewInspectPanel` — isEvidence + evidence fields + studyBtn + dupSection + qhints | ✅ Done |
| `reviewDecisionUI` — item.title fallback | ✅ Done |
| `applyReviewFilter` — quality filter skips evidence | ✅ Done |
| `renderReviewFilterBar` — quality count skips evidence | ✅ Done |
| `.b-purple` CSS class | ✅ Done |
| Section 24 hardening checks (+2, 108→110) | ✅ Done |
| `docs/README.md` count updated to 110 | ✅ Done |
| `docs/PROJECT_STATE.md` updated | ✅ Done |
| No Worker changes | ✅ Confirmed |
| No D1 commands or migrations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
