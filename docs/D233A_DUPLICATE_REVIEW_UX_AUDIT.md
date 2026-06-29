# D-233A — Duplicate Review UX Audit

**Scope:** Docs + optional tiny smoke tests
**Status:** COMPLETE — no deploy needed
**Baseline:** 2403 passed / 0 failed (pre-audit) → see hardening smoke after any tests added
**Files changed:** `docs/D233A_DUPLICATE_REVIEW_UX_AUDIT.md`, `docs/README.md`, optionally `scripts/hardening-smoke-test.mjs`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** No

---

## Purpose

Audit the current duplicate/near-duplicate handling in the review queue before making any UI or moderation changes. Answers: what data exists, how it is displayed, what actions are available, what friction exists, and what safe next slices look like.

---

## 1. Current duplicate data surface

### Two distinct concepts

| Field | Source | Semantics |
|-------|--------|-----------|
| `near_duplicate_of` | Backend — `meaningMatch()` on `createClaim` | Advisory similarity signal. Set automatically when new claim scores ≥ 0.65 cosine similarity against existing claims. Does not change state. Can be dismissed. |
| `duplicate_of` (alias `duplicateOf`) | Backend — set by `POST /api/review/mark-duplicate` | Explicit moderator decision. Marks the canonical target. Source claim preserved — no delete, no merge. |
| `normalized_claim` | Backend — stored normalized dedup key | Admin-only dedup key; shown in inspect panel for audit purposes. |
| `review_state === 'duplicate'` | Backend | A possible review state value. Seen in `TRUTH_CLAIM_STATE_BADGES` constants on the Truths page. Used for `review-card-duplicate` CSS class on review cards. |

### Client-side vs backend

- `near_duplicate_of` — set by backend during claim creation via `meaningMatch`; received as a field in the review queue API response. Not calculated client-side.
- `duplicate_of` — set by backend on `POST /api/review/mark-duplicate`; received in subsequent `loadReviewQueue()` response.
- The `meaningMatch` similarity algorithm (stopword normalisation, contraction expansion, suffix stripping, negation-polarity guard) runs entirely on the backend/worker.

### Advisory vs decision-affecting

- `near_duplicate_of`: **advisory only** — does not block moderation; normal Approve/Keep/Reject actions remain fully available; advisory can be dismissed without moderation decision.
- `duplicate_of`: **moderator decision** — sets the canonical target and puts claim in a `duplicate`-like state. Irreversible from the UI (no un-duplicate action exists).

---

## 2. Current UI display

### Card-level (`reviewCard`)

| Signal | Display mechanism |
|--------|-----------------|
| `near_duplicate_of` set | `~similar` badge (`b-similar` class) in card head; `review-card-similar` CSS class on article (amber-ish left border) |
| `duplicate_of` set | `rc-chip-dup` chip ("dup") in the chips row below the head; `title` attribute shows `duplicate of {id}` |
| `review_state === 'duplicate'` | `review-card-duplicate` CSS class on article; state badge shows `duplicate` |
| Filter bar chip | `~Similar` chip (by `near_duplicate_of` only); `Dupes` chip (by `duplicate_of` OR `near_duplicate_of`) |
| Sort option | `~Similar first` sort — similar-flagged items float to top |

**What the card does NOT show:**
- Claim text of the similar/canonical claim
- Similarity score or how close the match is
- Any side-by-side comparison
- Whether the similar claim is public, in review, or rejected

### Inspect panel (`renderReviewInspectPanel`)

| Element | Location | Content |
|---------|---------|---------|
| Advisory note banner | Above fields, below state bar | `~similar` badge + "This claim was automatically flagged as similar to an existing claim. This is advisory — no automatic merge or action has occurred. Use Approve, Keep Pending, or Reject as normal." (only shown when `near_duplicate_of` set) |
| `Similar claim (advisory)` field | In fields list | Raw `near_duplicate_of` ID rendered as a clickable button → `openReviewClaimStudy(nearDupId)` with ↗ icon |
| `Duplicate Of` field | In fields list | Raw `duplicate_of` ID as plain text (no link) |
| `Normalized Key` field | In fields list | Truncated `normalized_claim` in `<code>` with "Admin-only dedup key" title |
| `Mark Duplicate...` button | In `dupSection` (actions area) | Opens `markDuplicateUI` modal — available when claim type is claim and state is not `archived` or `duplicate` |
| `Dismiss ~Similar` button | In `dupSection` (actions area) | Opens `resolveSimilarUI` modal — only shown when `near_duplicate_of` is set |

### Audit summary (`renderReviewAuditSummary`)

| Stat | Definition |
|------|-----------|
| `~Similar` | Count of items with `near_duplicate_of` set |
| `Dupes` | Count of items with `duplicate_of` OR `near_duplicate_of` set (union) |

### Filter help text

- `~Similar` filter help: "Claims with similar wording to an existing claim. Advisory only — no automatic action."
- `Dupes` filter help: "Items with a duplicate_of or near_duplicate_of relationship set. Includes near-similar flagged items."

---

## 3. Current actions

### Actions available when `near_duplicate_of` is set

| Action | Where | Effect |
|--------|-------|--------|
| Approve | Card + inspect panel | Publishes claim; advisory not cleared automatically |
| Keep Pending | Card + inspect panel | No state change |
| Reject | Card + inspect panel | Rejects claim; advisory not cleared automatically |
| Dismiss ~Similar | Inspect panel dupSection | Modal → `POST /api/review/resolve-similar` → clears `near_duplicate_of`; claim stays in Review |
| Open Study View ↗ | Inspect panel | `openReviewClaimStudy(nearDupId)` → navigates to Study View for the similar claim |

### Actions available when `duplicate_of` is NOT set (any claim)

| Action | Where | Effect |
|--------|-------|--------|
| Mark Duplicate... | Inspect panel dupSection | Modal → type canonical target ID → `POST /api/review/mark-duplicate` → sets `duplicate_of`; source preserved |

### What does NOT exist

- No merge action
- No "un-duplicate" action
- No canonical claim search/lookup within the modal
- No side-by-side comparison UI
- No bulk duplicate resolution
- No auto-advance after duplicate actions

---

## 4. Friction findings

### F-1: `markDuplicateUI` requires manually typing the canonical ID

The "Mark Duplicate..." modal asks for a `clm_...` ID. The moderator must already know or have copied the target claim ID before opening the modal. There is no search, no suggestion, no lookup. If the similar claim is shown in the `Similar claim (advisory)` field, the moderator must copy that ID first — but the field only shows it as a button that navigates away.

**Impact:** High. Moderator must context-switch out of the review queue to find the canonical ID.

### F-2: Similar/duplicate field shows raw ID, not claim text

The `Similar claim (advisory)` field and the `Duplicate Of` field both show raw claim IDs (`clm_abc123...`). The moderator cannot read the similar claim's text without navigating to Study View. There is no claim title, no text preview, no state label.

**Impact:** High. The advisory is present but provides no context about what the similar claim says.

### F-3: `openReviewClaimStudy` navigates away from the review queue

Clicking the ↗ link in `Similar claim (advisory)` calls `openReviewClaimStudy(nearDupId)` which switches `mode` to `arena` (Study View). The review context is saved in `lastInspectedReviewItemId` and `lastModeBeforeStudy`, but returning to the review queue and the inspected item requires a manual back-button click. The path back is not prominent.

**Impact:** Medium. Context switching is disorienting for queue-speed moderation.

### F-4: `resolveSimilarUI` modal shows ID, not claim text

The Dismiss ~Similar modal says: "Dismiss the similarity advisory linking this claim to `clm_abc123`." The moderator sees the raw ID, not the claim text. They must remember or re-check what that ID corresponds to.

**Impact:** Medium. Hard to confirm which advisory you are dismissing.

### F-5: `Dupes` filter conflates advisory and explicit duplicate

`applyReviewFilter` for `'duplicate'` returns items with `duplicate_of` OR `near_duplicate_of`. Advisory similarity signals (`near_duplicate_of`) and explicit moderator decisions (`duplicate_of`) are merged into one filter. A moderator looking for "items I explicitly marked as duplicate" cannot distinguish them from "items with auto-detected similarity."

**Impact:** Low-medium. Could mislead moderators about the meaning of the filter count.

### F-6: `resolveSimilarUI` does not restore scroll position

After dismissing a similar advisory, the modal calls `loadReviewQueue()` then `renderReviewList()` without `scrollToReviewAnchor(claimId)` or `withReviewScrollPreserved`. The page jumps to the top after the modal closes, unlike `markDuplicateUI` which does call `scrollToReviewAnchor(claimId)` after success.

**Impact:** Low. Scroll jumps are jarring during high-volume review, but the behavior is recoverable.

### F-7: No distinction between "exact" and "near" similarity

All `near_duplicate_of` signals receive the same `~similar` label. There is no indication of whether the match is very close (threshold = 0.65 is the floor) or very strong. Moderators cannot prioritize by similarity confidence.

**Impact:** Low (no similarity score is stored in the data model, so this cannot be fixed without a schema change).

---

## 5. Safe next improvements

These are small, safe, frontend-only slices. None require backend/schema changes unless noted.

| Task | Description | Risk |
|------|-------------|------|
| D-233B | **`resolveSimilarUI` scroll fix** — add `scrollToReviewAnchor(claimId)` after success, matching `markDuplicateUI` pattern. Tiny, 1-line fix. | Very low |
| D-234A | **Similar claim text in inspect panel** — append truncated claim text to `Similar claim (advisory)` field. Requires checking if the text is in queue data or if a separate fetch is needed. If no text is available without a fetch, show ID + state label instead. Frontend only unless fetch needed. | Low |
| D-235A | **`markDuplicateUI` pre-populate from `near_duplicate_of`** — if `near_duplicate_of` is set on the item, pre-fill the canonical target ID field in the modal. Reduces manual typing for the common case. Frontend only (modal only). | Low |
| D-236A | **Duplicate UX regression lock** — smoke tests locking D-233B/D-234A/D-235A behavior once implemented. | None (tests only) |

Do not implement F-7 (similarity score display) — requires schema change and is out of scope.
Do not add side-by-side comparison — requires significant UI work and a new spec.
Do not change `Dupes` filter union behavior — low friction, not worth disruption.

---

## 6. Risk boundaries

- No duplicate semantics change in this audit.
- No merge/canonical behavior added or changed.
- No backend route changes.
- No data model / schema changes.
- No public profile exposure (duplicate advisory fields are admin-only).
- No moderation action name changes.
- `near_duplicate_of` remains advisory only — this audit does not propose making it blocking.
- `markDuplicateUI` and `resolveSimilarUI` functionality is unchanged.

---

## 7. Test recommendations (for future lock)

When a D-233B/D-234A/D-235A slice is implemented, add tests confirming:

1. `near_duplicate_of` advisory remains advisory — normal Approve/Keep/Reject still available when advisory is set
2. `duplicate_of` field not present in `renderPublicProfileHtml` output
3. `near_duplicate_of` field not present in `renderPublicProfileHtml` output
4. `markDuplicateUI` and `resolveSimilarUI` still present and still POST to the same routes
5. `openReviewClaimStudy` still saves `lastModeBeforeStudy` and `lastInspectedReviewItemId` (context preservation intact)
6. No new backend route added without spec (deploy integrity check)
7. Advisory copy ("automatically flagged", "advisory only", "no automatic merge") still present in inspect panel
8. `~Similar` filter still filters by `near_duplicate_of` only (not conflated with `duplicate_of`)

---

## Code surface summary

| Location | Duplicate-related code |
|---------|----------------------|
| `applyReviewFilter` | `'similar'` → `near_duplicate_of`; `'duplicate'` → `duplicate_of` OR `near_duplicate_of` |
| `applyReviewSort` | `'similar'` sort: items with `near_duplicate_of` float first |
| `reviewCard` | `review-card-similar` class; `~similar` badge; `rc-chip-dup` chip; `review-card-duplicate` class |
| `renderReviewFilterBar` | `~Similar` + `Dupes` filter chips; counts; `~Similar first` sort option |
| `renderReviewAuditSummary` | `~Similar` stat; `Dupes` stat |
| `renderReviewInspectPanel` | Advisory banner; `Similar claim (advisory)` field; `Duplicate Of` field; `Normalized Key` field; `Mark Duplicate...` + `Dismiss ~Similar` buttons |
| `markDuplicateUI` | Modal → `POST /api/review/mark-duplicate`; requires manual ID entry; calls `scrollToReviewAnchor` after success |
| `resolveSimilarUI` | Modal → `POST /api/review/resolve-similar`; shows ID not text; does NOT call `scrollToReviewAnchor` after success (F-6) |
| `openReviewClaimStudy` | Navigates to Study View; saves `lastModeBeforeStudy`/`lastInspectedReviewItemId` |
| `renderPublicProfileHtml` | No duplicate/advisory fields present (confirmed) |

---

## Confirmations

- **App/CSS unchanged:** Confirmed
- **Worker unchanged:** Confirmed
- **No moderation semantics change:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No public profile exposure:** Confirmed
- **Recommended next code slice:** D-233B — `resolveSimilarUI` scroll fix (lowest risk, highest friction-per-line ratio)
