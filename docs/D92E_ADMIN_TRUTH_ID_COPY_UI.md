# D-92E — Admin Truth ID Copy UI

**Date:** 2026-06-08
**Branch:** `fix/d92e-admin-truth-id-copy`
**Scope:** Frontend-only (`public/app-v10.js`, `public/styles.css`)
**Static baseline after:** 220 / 24 / 39

---

## Why Exact IDs Are Needed

D-92C shipped truth cards with shortened ID suffixes (`id: …4c899d36`). This is readable but not actionable for cleanup:

- `reviewDecision` (`POST /api/review-decision`) requires the exact full `targetId`
- `reviewCleanup` (`POST /api/review-cleanup`) requires the exact full `targetId`
- The last-8-chars suffix is not unique enough to use as a lookup key safely
- DevTools `fetch('/api/truths?limit=100')` was unreliable — JSON blob hard to navigate, Console truncates large objects, no per-statement labelling

D-92D audit confirmed `t.id` is fully present in the frontend truth object and `adminToken()` is callable from `truthCard`. A frontend-only fix is sufficient.

---

## What Was Built

### Admin-only full ID display

When admin token is present in `localStorage` (i.e. the operator has entered their token in the Review tab), each truth card now shows:

```
[full truth ID in monospace code element]  [copy id button]
```

When no admin token is present (normal public user), behaviour is **unchanged** — card shows `id: …last8chars` exactly as before D-92E.

No mutation, no cleanup, no moderation action is performed. This is a read-only display change.

---

## No Cleanup Done

This batch is read/display only. No truth records were modified. No `reviewDecision` or `reviewCleanup` calls were made. The following cleanup candidates remain blocked until exact IDs are confirmed via the new copy UI:

| Statement | Signal |
|-----------|--------|
| `gfsdhdfhdfhdfhgdfa` | `? artefact` — keyboard mash |
| `Blablabla` | `? artefact` — repeated syllable |
| `SMALL INDEFERENT TRUTH` | Suspect origin |
| `Statement` | `? artefact` — single generic placeholder |
| `Slogan` | `? artefact` — single generic placeholder |
| `Belief Engine Profile — Stoic Atheism` | `personal belief` — policy decision pending |

---

## Changes Made

### `public/app-v10.js`

**New helper `copyTruthId(id)`** (added after `isTruthArtifact`, before `truthCard`):
```js
function copyTruthId(id){
  navigator.clipboard.writeText(id)
    .then(()=>toast('Truth ID copied'))
    .catch(()=>toast('Copy failed — select the ID manually'));
}
```
- Uses `navigator.clipboard.writeText` (modern async API)
- Falls back to a toast telling the operator to select manually if clipboard access is denied
- `toast()` is the existing app toast function

**`truthCard` updated** — added `isAdmin` check:
```js
const isAdmin = !!adminToken();
const idSuffix = t.id ? t.id.slice(-8) : '';
```

ID display block now branches on `isAdmin`:
- **Admin mode:** `<code class="truth-id-full">full-id-here</code> <button class="btn-copy-id" onclick="copyTruthId('...')">copy id</button>`
- **Normal mode:** `<p class="small truth-id-line">id: …last8chars</p>` (unchanged from D-92C)

**`window.copyTruthId` exposed** — added to the window assignments block so the inline `onclick` handler can call it.

### `public/styles.css`

Four new rules appended after `.truth-convert-note`:

```css
.truth-id-admin{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.truth-id-full{font-size:9px;opacity:.65;user-select:all;letter-spacing:.02em;font-family:monospace;word-break:break-all}
.btn-copy-id{font-size:9px;padding:1px 5px;border-radius:3px;cursor:pointer;opacity:.55;background:transparent;border:1px solid var(--muted);color:var(--muted);line-height:1.5}
.btn-copy-id:hover{opacity:1}
```

---

## Admin Operator Workflow (after this PR)

1. Open HumanX → Review tab
2. Enter admin token → Load Queue (token saved to `localStorage`)
3. Switch to Truths tab
4. Every truth card now shows the full truth ID in monospace + a "copy id" button
5. Click "copy id" on any target truth → clipboard contains exact full ID
6. Use that ID for cleanup in Review tab (Inspect → reject → archive)

No DevTools required. No JSON parsing. No ambiguity from shortened IDs.

---

## Hardening Smoke Tests (Section 35 — 8 new tests, 212→220)

| # | Test | Result |
|---|------|--------|
| 1 | `truthCard` calls `adminToken()` and uses `isAdmin` | PASS |
| 2 | `truth-id-full` class exists in app-v10.js | PASS |
| 3 | `btn-copy-id` class exists in app-v10.js | PASS |
| 4 | `navigator.clipboard.writeText` used in `copyTruthId` | PASS |
| 5 | `copyTruthId` defined and exposed on `window` | PASS |
| 6 | Short ID path (`slice(-8)`) still present for non-admin | PASS |
| 7 | `truth-id-full` and `btn-copy-id` CSS rules exist in styles.css | PASS |
| 8 | No cleanup/archive/reject call in `truthCard` | PASS |

Total: **220 passed, 0 failed**

---

## Safety Notes

- Truth IDs are opaque random strings — they do not expose user IDs, emails, or personal data
- Full IDs are hidden from public users; only visible when admin token is loaded
- The copy button only reads from the already-available `t.id` — no new API call
- `navigator.clipboard.writeText` is async; failure is caught and surfaced to the operator via toast
- No auto-cleanup, no auto-reject, no data mutation of any kind

---

## Next Batch: D-92F

**D-92F — Manual exact-ID inventory and cleanup**

After this PR ships:
1. Operator loads admin token, goes to Truths tab
2. Copies full IDs for each candidate artefact using the new copy button
3. Pastes IDs back into a cleanup batch prompt
4. D-92F executes targeted `reviewDecision` (→ rejected) + `reviewCleanup` (→ archived) for confirmed T6 artefacts only

Policy decision also required for `Belief Engine Profile — Stoic Atheism` (personal belief, not a safety/artefact cleanup — handle separately).
