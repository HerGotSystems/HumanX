# D-92G — Admin Truth Artefact Cleanup UI

**Date:** 2026-06-08
**Branch:** `fix/d92g-admin-truth-artefact-cleanup-ui`
**Scope:** Frontend-only (`public/app-v10.js`, `public/styles.css`)
**Static baseline after:** 235 / 24 / 39

---

## Why Manual Curl Failed (D-92F)

D-92F documented exact curl commands to reject and archive the 5 confirmed artefact truths. Manual execution was blocked by:
- `jq` not installed on the user's system
- Commands easy to mistype (two sequential POST calls per target, 10 total)
- No confirmation before mutation
- No visible feedback on which items succeeded or failed
- No native browser UX — curl is a power-tool workflow, not an operator workflow

The five public Truth artefacts remained on the live Truths page.

---

## What D-92G Does

Adds a safe, admin-only **"archive artefact"** button to Truth cards that already show the `? ARTEFACT` badge. When the admin token is present and a card is flagged as an artefact, a small orange button appears below the ID line. Clicking it:

1. Checks `adminToken()` — stops with a toast if absent
2. Shows a browser `confirm()` dialog with the exact statement and ID
3. POSTs `reviewDecision → rejected` for that exact ID
4. POSTs `reviewCleanup → junk_override:true` for that exact ID
5. Toasts `Truth artefact archived`
6. Re-renders the Truths page (the card disappears)

---

## Safety Gates

| Gate | Implementation |
|------|---------------|
| Admin token required | `if(!adminToken()){toast('Admin token required');return;}` |
| Explicit confirmation | `confirm('Archive this Truth artefact?\\n\\n"${statement}"\\nID: ${id}\\n\\nThis will reject then archive it.')` |
| Exact clicked ID only | `id` comes from `t.id` in `truthCard(t)` — the specific card's data |
| Artefact flag required | Button only rendered when `isAdmin && artifact` both true |
| Admin mode required | Button only rendered when `isAdmin` (i.e. `adminToken()` truthy) |
| No automatic cleanup | No code runs on page load; button must be clicked |
| No bulk cleanup | No loop over `truths` array; one button per card |
| No hardcoded IDs | Function takes `id` param; no specific IDs embedded |
| Failure is toasted | `catch(e){toast(e.message||'Archive failed')}` — backend errors surface as toasts |

---

## Normal Public Behaviour Unchanged

- Users without an admin token see the existing `id: …last8chars` short ID line
- The `? ARTEFACT` badge remains (advisory, visible to all)
- No card is hidden or auto-removed on page load
- No button is rendered without `adminToken()` returning a truthy value

---

## What Was Added

### `public/app-v10.js`

**New function `archiveTruthArtefact(id)`** (after `copyTruthId`):
- Looks up `statement` from module-level `truths` array by ID (avoids onclick string escaping issues)
- Calls `confirm()` with full statement + ID
- POST 1: `/api/review/decision` with `{targetType:'truth', targetId:id, decision:'rejected'}`
- POST 2: `/api/review/cleanup` with `{target_type:'truth', target_id:id, junk_override:true, reason:'Admin UI artefact cleanup'}`
- Calls `renderTruths()` on success

**`truthCard` update:**
- Added `const canAdminArchiveArtifact = isAdmin && artifact` (computed inline)
- When true, renders: `<p class="small truth-admin-actions"><button class="btn-mini btn-archive-artifact" onclick="archiveTruthArtefact('${esc(t.id)}')" title="Reject and archive this artefact">archive artefact</button></p>`
- Placed between the ID line and the main "Pressure-test as Claim" actions div

**`window.archiveTruthArtefact` exposed** — required for inline onclick handler to work.

### `public/styles.css`

```css
.truth-admin-actions{margin:3px 0 0;display:flex;gap:5px;flex-wrap:wrap}
.btn-archive-artifact{font-size:9px;padding:1px 6px;border-radius:3px;cursor:pointer;opacity:.6;background:transparent;border:1px solid #ff6b3533;color:#ff6b35cc;line-height:1.5}
.btn-archive-artifact:hover{opacity:1;border-color:#ff6b35;background:#ff6b3511}
```

Small, orange-tinted, subtle — clearly admin-only, clearly destructive, not mistakable for a public action.

---

## Hardening Smoke Tests (Section 36 — 15 new tests, 220→235)

| # | Test |
|---|------|
| 1 | `archiveTruthArtefact` helper exists |
| 2 | Helper uses `adminToken()` |
| 3 | Helper uses `confirm(` |
| 4 | Helper POSTs to `/api/review/decision` |
| 5 | Helper POSTs to `/api/review/cleanup` |
| 6 | Payload includes `targetType:'truth'` |
| 7 | Payload includes `target_type:'truth'` |
| 8 | Payload includes `junk_override:true` |
| 9 | Payload includes reason string |
| 10 | `window.archiveTruthArtefact` exposed |
| 11 | `btn-archive-artifact` class in JS |
| 12 | `truthCard` gates button on `isAdmin&&artifact` |
| 13 | No bulk cleanup (`truths.forEach` absent; `truths.map` callback does not call archive) |
| 14 | No hardcoded artefact IDs in `archiveTruthArtefact` function |
| 15 | `btn-archive-artifact` CSS rule in styles.css |

Also updated: D-92E test `no cleanup/archive/reject call added to truthCard` → `D-92E/G: truthCard does not call review APIs directly` (now checks for `api(` / `reviewDecision` / `reviewCleanup` direct calls, not for the `archiveTruthArtefact` helper delegation).

---

## Operator Workflow

1. Enter admin token in Review tab → "Load Queue" (this saves token to localStorage)
2. Switch to Truths tab
3. Cards flagged `? ARTEFACT` now show a small orange **"archive artefact"** button (admin mode only)
4. For each artefact to remove:
   - Click **"archive artefact"**
   - Confirm the dialog (shows exact statement + ID)
   - Toast: "Truth artefact archived"
   - Card disappears from the list on reload

**Five confirmed artefacts to process:**

| Statement | ID |
|-----------|-----|
| gfsdhdfhdfhdfhgdfa | `tru_8dda0954d7b14910bb` |
| Blablabla | `tru_2544a80a73034a6a95` |
| SMALL INDEFERENT TRUTH | `tru_67ae90e56f7449ee85` |
| Statement | `tru_5fe9ce641c634fcba5` |
| Slogan | `tru_a3ecc8ef96104c6ebe` |

**Do NOT touch:** Belief Engine Profile — Stoic Atheism (`tru_53ee59f3fa4247f4be`) — `isTruthArtifact` should not flag it, so no archive button should appear on that card. If it does appear (unexpected), do not click it — report for policy review.

---

## No Code Changes to Worker or D1

This is a pure frontend change. The existing `reviewDecision` and `reviewCleanup` endpoints already support `targetType:'truth'` and `junk_override:true`. No schema changes, no Worker changes, no Wrangler.

---

## Next Step (D-92H)

User clicks the five "archive artefact" buttons in the live Truths admin view, confirms each dialog, and verifies the five cards disappear. Report results back. Then update `docs/D92F_ARCHIVE_PUBLIC_TRUTH_ARTEFACTS_RESULT.md` Section G with confirmed outcomes.
