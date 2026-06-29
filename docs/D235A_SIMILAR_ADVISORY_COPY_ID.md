# D-235A — Similar Advisory Copy ID

**Scope:** App + CSS + tests + docs
**Status:** COMPLETE — D-235B live sanity PASS
**Baseline:** 2467 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D235A_SIMILAR_ADVISORY_COPY_ID.md`, `docs/README.md`
**App UI changes:** Yes — Copy ID button + code element in inspect panel Similar claim advisory field
**CSS changes:** Yes — `.review-similar-copy-btn`, `.review-similar-id-code`
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes — owner deploy complete (D-235B)

---

## Purpose

Make the raw similar-claim ID in the review inspect panel easy to copy with one click, without adding backend lookup, canonical/merge behavior, or new data fields. Addresses the remaining friction from D-233A F-2: even with the improved "Possible related claim:" label from D-234A, the moderator still needs to manually select a `clm_...` ID string to copy it for use in `markDuplicateUI`. The "Copy ID" button removes that friction.

---

## User-visible behavior

### Before

```
Possible related claim:  clm_abc123 ↗
```
Moderator had to manually select and copy the ID string.

### After

```
Possible related claim:  clm_abc123   ↗ Study   [Copy ID]
```

- `clm_abc123` is shown in a `<code class="review-similar-id-code">` element with `user-select:all` — clicking once selects the full ID
- `↗ Study` opens Study View for the related claim (unchanged functionality, new label text)
- `[Copy ID]` button copies just the raw claim ID string to the clipboard via `navigator.clipboard.writeText`

### Success

Toast: **"ID copied"**

### Failure (clipboard unavailable)

Toast: **"Copy failed — select the ID manually"**

No alert, no modal, no redirect.

---

## Accessibility behavior

- `[Copy ID]` uses `type="button"` — not a submit button, no form interaction
- Button label "Copy ID" is unambiguous
- `user-select:all` on the `<code>` element enables single-click selection as a fallback
- `.review-similar-copy-btn:hover` provides a visible focus/hover state change
- Mobile touch target is reasonable (matches existing `btn-mini` size family)
- No focus stealing — toast is a passive notification

---

## Implementation

### New helper function: `copySimilarClaimId(id)`

```js
function copySimilarClaimId(id){
  if(!id)return;
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(id)
      .then(()=>toast('ID copied'))
      .catch(()=>toast('Copy failed — select the ID manually'))
  }else{
    toast('Copy failed — select the ID manually')
  }
}
```

Properties:
- Guards against empty/null id: `if(!id)return`
- Uses optional chaining `navigator.clipboard?.writeText` — safe on browsers without Clipboard API
- Copies only the `id` argument — not `window.location.href`, not a URL
- `.catch()` handles clipboard permission denial
- No `localStorage`, no `fetch`, no `api()`, no analytics, no backend
- Exposed on `window.copySimilarClaimId` for use in `onclick` attributes

### Inspect panel field change

Old (`Similar claim (advisory)` field value):
```html
<span class="review-similar-id">
  Possible related claim:
  <button class="btn-link-small" onclick="openReviewClaimStudy('{id}')" title="Open in Study View">
    {id} ↗
  </button>
</span>
```

New:
```html
<span class="review-similar-id">
  Possible related claim:
  <code class="review-similar-id-code">{id}</code>
  <button class="btn-link-small" onclick="openReviewClaimStudy('{id}')" title="Open in Study View">↗ Study</button>
  <button type="button" class="review-similar-copy-btn" onclick="copySimilarClaimId('{id}')" title="Copy ID to clipboard">Copy ID</button>
</span>
```

The ID is now in a `<code>` element (selectable) separate from the Study link. The ↗ Study link is updated to "↗ Study" label (was `{id} ↗`).

### CSS additions

```css
.review-similar-id-code{font-size:11px;color:var(--muted);user-select:all;cursor:text}
.review-similar-copy-btn{background:transparent;border:1px solid var(--line);color:var(--muted);font-size:11px;padding:2px 6px;border-radius:4px;cursor:pointer;line-height:1.3}
.review-similar-copy-btn:hover{color:var(--fg);border-color:var(--fg)}
```

---

## What did NOT change

- `near_duplicate_of` semantics: still advisory only
- `resolveSimilarUI` API route: `/api/review/resolve-similar` — unchanged
- `markDuplicateUI` API route: `/api/review/mark-duplicate` — unchanged
- `resolveSimilarUI` scroll behavior from D-233B: unchanged
- Advisory banner copy from D-234A: unchanged
- Normal moderation actions (Approve/Keep/Reject): unchanged
- `reviewCard` `~similar` badge: unchanged
- Public profile: unchanged
- Worker, CSP, backend, schema: all unchanged

---

## Tests added (19 new)

| Test | What it confirms |
|------|-----------------|
| `copySimilarClaimId function exists` | Helper present |
| `uses navigator.clipboard.writeText` | Safe clipboard API |
| `copies id argument, not location.href` | Only the ID string copied |
| `has try/catch or .catch failure handling` | Clipboard denial handled |
| `does not use localStorage` | No side-effect storage |
| `does not call fetch or api()` | No backend lookup |
| `guards against empty/null id` | `if(!id)return` guard |
| `has success toast copy ("ID copied")` | Success feedback |
| `has failure copy ("Copy failed")` | Failure feedback |
| `exposed on window` | Accessible from onclick |
| `inspect panel renders "Copy ID" button` | Button present |
| `Copy ID button is type="button"` | Accessibility |
| `Copy ID button calls copySimilarClaimId` | Wiring correct |
| `inspect panel shows raw ID in code element` | ID still visible |
| `review-similar-copy-btn CSS in styles.css` | CSS present |
| `review-similar-id-code CSS in styles.css` | CSS present |
| `resolveSimilarUI still posts to resolve-similar` | Route unchanged |
| `renderPublicProfileHtml excludes copy-btn classes` | No public exposure |
| `deploy integrity — worker.js unchanged` | Worker not modified |

**Hardening smoke:** 2467 passed / 0 failed (+19 new)

---

## Live sanity checklist — D-235B PASS

- [x] Deploy to production via owner terminal
- [x] Open Review queue — find a claim with `~similar` badge
- [x] Inspect the claim — advisory field shows `clm_abc123` in a code element
- [x] "↗ Study" link still works (opens Study View for the related claim)
- [x] "Copy ID" button visible next to the Study link
- [x] Click "Copy ID" — toast shows "ID copied"
- [x] Paste clipboard — confirms raw claim ID was copied (not URL, not full page)
- [x] Click the `clm_...` code element — whole ID selects in one click (`user-select:all`)
- [x] Advisory banner copy from D-234A still intact ("Similar claim advisory", "Review manually before deciding")
- [x] Dismiss ~Similar modal still works and still scrolls to anchor (D-233B parity)
- [x] Normal Approve/Keep/Reject actions unchanged
- [x] Mark Duplicate modal — can paste copied ID directly into the canonical target field
- [x] `~similar` badge on card unchanged
- [x] No console errors

**Live sanity result:** 14/14 PASS (D-235B, 2026-06-29)

---

## Confirmations

- **App changed:** Yes — `copySimilarClaimId` helper; Copy ID button + code element in inspect panel field
- **CSS changed:** Yes — `.review-similar-copy-btn`, `.review-similar-id-code`
- **Worker unchanged:** Confirmed
- **No new public data fields:** Confirmed
- **No backend/API lookup:** Confirmed — copies only the id string already present in the review queue data
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No duplicate/advisory semantics change:** Confirmed
- **No merge/canonical behavior added:** Confirmed
- **Raw ID remains visible:** Confirmed — in `<code class="review-similar-id-code">` element
- **No public profile exposure:** Confirmed
- **Deploy needed:** Yes — owner deploy complete (D-235B)
- **Owner deploy:** PASS
- **Live Copy ID sanity:** PASS — "Copy ID" button present, toast "ID copied" on success, clipboard contains only raw claim ID, `clm_...` code element single-click selectable
- **Clipboard copies only raw ID:** Confirmed — not URL, not page, not full advisory text
- **No navigation/queue mutation:** Confirmed — Copy ID does not navigate, approve, reject, keep, merge, or mark duplicate
- **Advisory-only semantics unchanged:** Confirmed
- **No backend/API lookup:** Confirmed
- **No merge/canonical behavior:** Confirmed
- **D-233B resolve-similar scroll:** Confirmed intact
- **D-234A similar advisory display:** Confirmed intact
- **Normal moderation actions (Approve/Keep/Reject):** Confirmed unchanged
- **No public profile exposure:** Confirmed
- **Hardening smoke:** 2467 passed / 0 failed
- **Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug` — D-218A documented)
- **D-235B live sanity:** 14/14 PASS
