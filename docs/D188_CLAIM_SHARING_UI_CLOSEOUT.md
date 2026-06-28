# D-188 — Claim Sharing UI Closeout

**Date:** 2026-06-28
**HEAD at closeout:** `2a090f0`
**Baseline at closeout:** 1549/24/57 (+12 tests from D-188B/C, 2 legacy fixes in D-188B0)
**Patches:** D-188A (audit) · D-188B0 (test cleanup) · D-188B (Study) · D-188C (Me + public profile)

---

## Summary

D-188 added in-app copy-link affordances for direct claim URLs (`/c/:id`, introduced in D-187B). Users can now copy a shareable claim link from three surfaces without leaving the app. No new backend logic, no new routes, no schema changes.

---

## D-188A — Audit

**Commit:** `04fa8ca`
**Scope:** Source-code review only. No code changes.

### Pre-existing copy/share inventory

| Function | URL built | Pattern |
|----------|-----------|---------|
| `copyPublicProfileLink(btn, slug)` | `/u/${slug}` | btn mutation + clipboard + execCommand fallback |
| `meCopyProfileLink()` | `/u/${slug}` | zero-param variant |
| `copyTruthId(id)` | raw ID only (not a URL) | toast |
| `copyAIP()` | RunPack text | toast |
| `copyAdminInviteCode(code)` | raw code | toast |

**Finding:** No `copyClaimLink` function existed. No `/c/:id` URL was exposed anywhere in the UI. Users who wanted to share a claim had to manually construct the URL.

### Recommended placement order

| Priority | Surface | Risk |
|----------|---------|------|
| P1 | Study view `study-actions` | Low — one function, one button |
| P2 | My HumanX public claims | Low — isolated function, isPublic guard |
| P2 | Public profile claim rows | Low — isolated function, all rows public |
| P3/defer | Arena `card()` | Medium — touches all card surfaces |
| P3/defer | RunPack export view | Low — second-order need |

---

## D-188B0 — Stale test cleanup

**Commit:** `e2e3cbe`
**Scope:** Smoke test only. No app code.

Two D-93B legacy tests maintained an OR-chain allowlist of historical README smoke counts. The list ended at `1525 passed, 0 failed` but the README was updated to `1537 passed, 0 failed` in D-187B. Fixed by appending `1537 passed, 0 failed` to both allowlists. Baseline restored to 1537/24/57.

---

## D-188B — Study view Copy link

**Commit:** `fdb9327`
**Files:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`
**Tests added:** 10 (Section 101)

### New function

```js
function copyClaimLink(btn, id) {
  const url = `${location.origin}/c/${encodeURIComponent(id||'')}`;
  btn.textContent = 'Copied!';
  btn.disabled = true;
  const reset = () => { btn.textContent = 'Copy link'; btn.disabled = false; };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(()=>setTimeout(reset, 1500)).catch(()=>reset());
  } else {
    try { /* execCommand fallback */ } catch(e) {}
    setTimeout(reset, 1500);
  }
}
```

Mirrors `copyPublicProfileLink` exactly. Uses `location.origin` (domain-agnostic). Button mutation pattern: "Copied!" for 1500 ms, then resets to "Copy link".

### Dispatch entry

```js
// added to _D181E_ID_ACTIONS
copyClaimLink: b => copyClaimLink(b, b.dataset.id)
```

### Study view button

Added next to "Build RunPack" in `study-actions`:
```html
<button class="btn-mini" data-action="copyClaimLink" data-id="${esc(selected.id)}">Copy link</button>
```

Result: Study header shows `[Build RunPack]  [Copy link]` at all screen sizes. At ≤900px the buttons wrap cleanly.

---

## D-188C — My HumanX + public profile claim rows

**Commit:** `2a090f0`
**Files:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`
**Tests added:** 2 new D-188C assertions (D-188B prohibitions converted to positive assertions)

### My HumanX claim rows

Added inside the existing `isPublic` guard in `meRecentClaimsHtml`:
```html
<button class="btn-mini" data-action="copyClaimLink" data-id="${esc(c.id)}">Copy link</button>
```
Appears after "Open Study →", before "Archive". Shown only when `review_state === 'public'`. Claims in review, rejected, or archived states show no copy button.

### Public profile claim rows

Added after "View in HumanX →" in `renderPublicProfileClaimsHtml`:
```html
<button class="btn-mini" data-action="copyClaimLink" data-id="${esc(c.id)}">Copy link</button>
```
All rows on a public profile are already public — no additional visibility guard needed.

No new function or dispatch entry — both reuse `copyClaimLink` and the `_D181E_ID_ACTIONS` entry from D-188B.

---

## Final sharing surface map

| Surface | Who uses it | Copy link present | Condition |
|---------|------------|-------------------|-----------|
| `/c/:id` direct URL | Anyone with the link | n/a — the URL itself | Server-rendered OG shell, SPA auto-opens Study |
| Study view header | Any visitor | **Yes** | Always when a claim is open |
| My HumanX — claim rows | Claim owner | **Yes** | `review_state = 'public'` only |
| Public profile — claim rows | Profile visitor | **Yes** | All rows (always public) |
| Arena claim cards | Any visitor | No — intentionally deferred | See below |
| RunPack export view | Any visitor | No — deferred | See below |
| Review/admin queue | Admin only | No — out of scope | — |

---

## What remains intentionally deferred

| Item | Reason deferred |
|------|----------------|
| Arena `card()` Copy link | `card()` is used across multiple surfaces (Arena, search results, review adjacent); adding a copy button to every card increases visual weight on an already dense grid; Study-mode copy covers the primary sharing use case |
| RunPack export view copy | Second-order need — the export flow is already copy-heavy; a direct-URL button is useful but not urgent |
| Native Web Share API (`navigator.share`) | Good for mobile sharing sheets; adds UX complexity; `navigator.clipboard` pattern is simpler and sufficient for v1 |
| Per-claim dynamic OG image | High effort — requires server-side image generation or Cloudflare Workers Images; static `og-default.png` is sufficient for initial sharing |
| Social debugger validation | Manual step — paste `/c/:id` into Twitter Card Validator and Facebook Debugger to confirm preview rendering; deferred until first sharing activity is observed |

---

## Files changed across D-188

| File | Change |
|------|--------|
| `public/app-v10.js` | `copyClaimLink()` + dispatch entry + Study button (D-188B); Me + public profile buttons (D-188C) |
| `scripts/hardening-smoke-test.mjs` | D-188B Section 101 (10 tests); D-188B0 allowlist fix; D-188C conversions + 2 new tests |
| `docs/D188A_CLAIM_SHARING_UI_AUDIT.md` | Audit + recommendations (D-188A) |
| `docs/D188_CLAIM_SHARING_UI_CLOSEOUT.md` | This file (D-188D) |
