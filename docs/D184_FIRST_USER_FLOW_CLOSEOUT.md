# D-184 First-User Flow QA — Closeout

**Merged:** 2026-06-28  
**Patches:** D-184A through D-184G  
**Baseline at close:** 1525 / 24 / 57 (hardening / belief-engine / worker-route)

---

## What the series did

D-184A was a source-code walkthrough of the full first-time user journey — Home through
RunPack — producing a ranked list of 13 friction points. D-184B through D-184G addressed
the top friction points as targeted, isolated frontend fixes.

---

## QA source

`docs/D184A_FIRST_USER_FLOW_QA.md` — 13 friction points, severity ratings, mobile notes,
quick-fix table, and longer product ideas.

---

## Fixes completed

| Patch | Friction point | What changed |
|-------|---------------|--------------|
| D-184B | Study back label generic (F-1) | Added `lastModeBeforeStudy==='arena'` case → `← Back to Claims` |
| D-184B | Profile save toast stale (F-3) | `'Profile link foundation saved. Public page comes next.'` → `'Profile settings saved.'` |
| D-184B | Double-toast after voting (F-4) | Removed `toast('Study loaded')` from `selectClaim()` |
| D-184B | Investigation Board no subtitle (F-11) | Added subtitle: "Manage evidence, pressure, tests, and analysis for this claim." |
| D-184B | Home status shows 'offline' on load (F-10) | Changed fallback from `'offline'` → `'connecting…'` |
| D-184C | Mobile Study action access (F-6) | Added `+ Evidence / + Pressure / + Test` action row to Investigation Board heading; three scroll-and-focus dispatcher actions |
| D-184D | Arena filter invisible in main content (F-7) | Added filter-status hint in `renderArena()`: default guidance text or active-filter label with inline "Show all" reset |
| D-184E | Claim cards not clickable (F-8) | Full `<article>` card made clickable via `data-action="cardSelectClaim"`; keyboard support (Tab + Enter/Space); `cursor:pointer` and focus ring |
| D-184F | Start Here Step 2 no-op duplicate (F-2) | Description updated to clarify "go to Claims, then click a card"; button label "Open a Claim →" → "Browse Claims →" |
| D-184G | No Study → RunPack path (F-5) | Added quiet "Done adding evidence and pressure? [Create RunPack →]" CTA between Investigation Board and study grid |

---

## What did not change

- Backend routes, worker logic, or API shape
- Database schema or migrations
- Auth, sessions, or token handling
- Review / admin flow
- CSP or security headers
- Belief Engine file
- wrangler.toml

---

## Smoke-test adjustments

One stale fixed-size slice test updated in D-184D:

- `D-161B: graph stats wrapped in arena-stats-details` — widened from `idx+900` to `idx+1300`
  to account for the new `_fv / _sv / _hasFilter / _filterHint` variable block added before
  the `renderArena` template literal.

All other tests passed without change across all patches. Final baseline: **1525/24/57**.

---

## Remaining later ideas (from D-184A, not addressed)

1. **Guided onboarding overlay** — interactive step-by-step first-visit tour. D-183/D-184
   copy prepares the ground; an overlay would make it interactive.
2. **Mobile layout polish pass** — side panel drawer, card density controls, narrow-screen
   tightening across Truth cards and action rows. Planned as D-185A.
3. **Example claim templates** — pre-filled Builder Step 1 examples to lower blank-page
   friction. Noted in D-183G closeout.
4. **RunPack → Analysis closed loop** — after generating a RunPack and pasting AI output,
   auto-parse or guide the user through pasting JSON into the Analysis panel. Currently
   requires manual copy/paste with no status feedback.
5. **Optimistic vote update** — `voteClaim()` currently refetches the full claim on every
   vote, producing a visible delay. Optimistic counter update without full reload.

---

## Commit log

```
9d47156 D-184G — RunPack closed-loop CTA from Study
2ead74f D-184F — Start Here Step 2 action clarity
2437b10 D-184E — Claim card clickability quick fix
e03f517 D-184D — Arena filter visibility quick fix
cef1b05 D-184C — mobile Study action access quick fix
8826cc8 D-184B — First-user quick friction fixes (5 from D-184A QA)
f0e5bcd D-184A — First real user flow QA pass (doc only)
```
