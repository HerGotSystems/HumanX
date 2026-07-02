# D-296A — My HumanX Profile Setup Nudge Checkpoint

**Scope:** Docs only (`docs/PROJECT_STATE.md`, `docs/README.md`, this file)
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3442 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD at checkpoint:** D-296A (closes D-295 arc)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D296A_MY_HUMANX_PROFILE_SETUP_NUDGE_CHECKPOINT.md`

---

## Arc Summary

| Task | Type | Result |
|------|------|--------|
| D-295A | Product pass (docs only) | 18 questions; general count-based strip ruled out; profile-setup nudge identified as the right intervention |
| D-295B | Implementation (frontend + tests) | `profileNudge` const in `renderMeHtml()`; condition `!profile_public && !profile_slug`; 18 new tests + 7 slice widenings; baseline 3424 → 3442 |
| D-295C | Live closeout | Owner deployed; 27/27 live sanity PASS; self-clearing behavior confirmed |
| D-296A | Checkpoint (docs only) | This task; `PROJECT_STATE.md` updated; safe-next rules 111–113 added |

---

## What D-295 Did

D-295A asked 18 questions about whether My HumanX needs a general "Needs attention" strip. The answer was no — `GET /api/my-humanx` data already surfaces all attention signals through the My Content panel, and a general strip would duplicate count badges already shown. The only genuinely new signal was whether the owner had ever configured a public profile (slug + public flag).

D-295B added a narrow, self-clearing nudge above the Account card:

```javascript
const profileNudge = (!u.profile_public && !u.profile_slug)
  ? `<p class="small" style="margin:0 0 12px;padding:8px 10px;border-left:3px solid var(--accent,#4a7cf6)">Set up your public profile: open Profile Settings, choose a slug, and switch your profile public when ready.</p>`
  : '';
```

The nudge disappears as soon as either `profile_slug` or `profile_public` is set — driven purely by the `GET /api/my-humanx` response, no JS state or localStorage.

---

## Invariants Preserved

| Invariant | Status |
|-----------|--------|
| Review gate: all Truth creation paths use `review_state='review'` | Unchanged |
| Yellow Review badge (`ME_STATE_CLR.review = 'b-yellow'`) | Unchanged |
| Post-submit navigation: `renderMe()` / `tab-me` / toast (D-285B) | Unchanged |
| `<details>/<summary>` Profile Settings (D-293B) | Unchanged |
| Recent Truths immediately after filter bar (D-291B) | Unchanged |
| No backend/API/schema/migration changes | Confirmed |
| No public profile `/u/:slug` changes | Confirmed |
| `profile_public` and `profile_slug` are not new fields — already in `GET /api/my-humanx` | Confirmed |

---

## Privacy Boundary Confirmation

The `profileNudge` const is rendered only inside `renderMeHtml()`, which is owner-private (served only to the authenticated session owner). It is not present in `renderPublicProfileHtml()`. The condition fields (`profile_public`, `profile_slug`) are already returned by the owner-gated `GET /api/my-humanx` endpoint — no new data is exposed. D-295B test 15 asserts that the public profile route does not reference `profileNudge`.

---

## Safe-Next Rules Added (111–113)

| Rule | Text |
|------|------|
| 111 | Profile setup nudge (`profileNudge`) is in `renderMeHtml()` only. Do not add nudge rendering to `renderPublicProfileHtml()` or any other public surface. |
| 112 | The nudge self-clears via `GET /api/my-humanx` re-fetch. Do not add a dismiss button, JS flag, or localStorage key to manage its visibility. |
| 113 | If a future audit proposes a general count-based "Needs attention" strip for My HumanX: revisit D-295A conclusion first. The decision was: no strip — My Content already shows counts; any new signal must be narrower than the existing panels. |

---

## Checks at D-296A

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | exit 0 |
| `hardening-smoke-test.mjs` | `3442 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 warn` |

---

## Deployment State at D-296A

| Task | Deploy | Result |
|------|--------|--------|
| D-295A | No | Product pass / docs only |
| D-295B | Yes — owner deployed | PASS — D-295C live closeout (27/27) |
| D-295C | No | Live closeout |
| D-296A | No | Checkpoint / docs only |

**Latest deployed Worker:** D-295C
