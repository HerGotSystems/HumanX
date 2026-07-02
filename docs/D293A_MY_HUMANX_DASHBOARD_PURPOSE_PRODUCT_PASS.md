# D-293A — My HumanX Dashboard Purpose Product Pass

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3405 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-293A:** `8286fb7` (D-292A)
**Files changed:** `docs/D293A_MY_HUMANX_DASHBOARD_PURPOSE_PRODUCT_PASS.md`, `docs/README.md`

---

## Purpose

Step back and assess My HumanX as a whole now that the post-submit Truth flow is working. The previous arc (D-291) fixed the most acute problem — Recent Truths was buried. This pass decides whether the dashboard is good enough to leave alone or whether one more targeted improvement would pay off.

---

## Current Page Layout (post D-291B)

`renderMeHtml()` renders in this order:

1. Section head: "My HumanX"
2. Privacy intro paragraph
3. **Account card** — verified/anonymous badge, name, email, handle, user ID, Export button
4. **Profile Settings** — public toggle, slug, bio, preview link, Save/Copy controls
5. **My Content** panel — `meCountsRow()` chips for Claims/Truths/Evidence/Pressure with per-state breakdowns
6. **Filter bar** — All / Public / Review / Rejected / Archived / Duplicate buttons
7. **Recent Truths** — with "Review: awaiting admin approval" explanation ← moved up D-291B
8. **Recent Claims** — with archive note
9. **Belief Snapshots** panel
10. **Belief Mirror** panel
11. **Belief Reflection** panel
12. **Reflection Avatar** panel
13. **Recent Evidence** panel
14. **Recent Pressure** panel

---

## 15 Product-Pass Questions

### Q1. What is My HumanX currently trying to be?

It is trying to be all of the following simultaneously:
- **Identity management surface** — Account card, Profile Settings, slug, bio, Export
- **Activity dashboard** — Recent items for all five content types
- **State tracker** — per-type per-state counts, filter bar for pending/rejected/archived items
- **Belief space** — Snapshots, Mirror, Reflection, Avatar

There is no explicit hierarchy between these roles. The page accumulates all of them as equal-weight panels.

---

### Q2. Is it mainly one thing or all of the above?

**All of the above — and that is the design.** My HumanX is the only private owner surface. It cannot be split across multiple pages without a navigation redesign. The page needs to serve all four roles because there is no other place for any of them.

The issue is not that the page tries to do too much — it is that the panels have historically been ordered by when they were added, not by what an owner needs first.

---

### Q3. What does an ordinary owner most need immediately after landing there?

Post-D-291B, the most common landing trigger is: owner just submitted a Truth → arrived via `renderMe()` + `tab-me`. In that case the owner wants to:

1. **Confirm their submission appeared** — "Recent Truths" is now first. ✓
2. **Understand what "Review" means** — Review explanation is now in the panel. ✓
3. **Know when it will go public** — explanation says "goes Public when approved." ✓

For a returning owner who has not just submitted, the most common need is:
1. **Check status of pending items** — filter bar + Recent Truths covers this. ✓
2. **See what is public vs pending vs rejected** — counts panel + per-state chips. ✓
3. **Edit profile** — Profile Settings is in the second block, reachable by scroll.

The post-submit case is well-served now. The returning-owner case is reasonably served. No acute gap.

---

### Q4. Is the current top area useful enough?

**Yes, with one caveat.** After D-291B, the functional order from the top is:
- Section head + privacy intro (orientation) ✓
- Account card (identity) ✓
- Profile Settings (identity management) — reasonably placed, most owners set this once
- My Content counts (state overview) ✓
- Filter bar (mode control) ✓
- Recent Truths (primary post-submit target) ✓

The caveat: Profile Settings is a relatively long panel that sits between the Account card and the counts/filter/activity area. For an owner who has already configured their profile, it is visual noise between identity and the action area. But it is not the dominant friction right now.

---

### Q5. Does the Account/Profile area take too much priority?

**Marginally.** Profile Settings is the second panel after the Account card. It contains: public toggle, slug field, bio field, profile preview link, Save button, Copy link button. On most visits this is not what the owner came to do.

However:
- It is set-once content. Owners who have configured it learn to scroll past it.
- It is not blocking the post-submit Truth flow (which lands at Recent Truths immediately after the filter bar).
- Collapsing it would be a real improvement but not urgent — the post-submit path scrolls directly to content, not from the top.

**Verdict:** Marginally too prominent. Would benefit from being collapsible, but this is a medium-priority cosmetic improvement, not a functional gap.

---

### Q6. Is Recent Truths now placed correctly?

**Yes.** Post-D-291B: immediately after the filter bar, first content panel. The post-submit confirmation is visible on arrival. The Review explanation is present. The yellow badge distinguishes pending from public. This is correct.

---

### Q7. Are Recent Claims still useful in the current position?

**Yes.** After Recent Truths. Claims are the primary input surface (Truths are derived from claims). An owner returning to manage their content will expect Claims to be high. Position 8 in the overall layout, position 2 in the activity panels — this is appropriate. The archive note is useful copy. No change needed.

---

### Q8. Are Belief Snapshots / Mirror / Reflection / Avatar useful where they are, or should they be secondary?

**They are in the right general area but consume a lot of vertical space for most ordinary owner visits.** These four panels (Snapshots, Mirror, Reflection, Avatar) appear after Recent Claims in the current layout. For an owner who:
- Just submitted a Truth → does not need them
- Returned to check their content status → does not need them
- Is actively exploring their belief space → does need them

The four panels collectively represent a distinct mode of use (belief reflection) vs the five "Recent X" panels (content management). They are currently interleaved into the content management area rather than grouped below it.

**They are not wrong here, but they are not ideal.** A future pass could group all four belief panels below all five content panels, creating a clear structure: identity → content activity → belief space. This is a cosmetic improvement, not a functional gap.

---

### Q9. Does the page need a simple "What needs attention?" section?

**Not right now.** The closest thing already exists: the My Content counts panel with per-state chips (`Review: N`, `Rejected: N`, etc.) combined with the filter bar. Together they answer "what needs attention" without a dedicated section. A future task could surface a "You have 3 items awaiting Review" banner, but that would require reading from the counts and rendering a conditional callout — more complexity than it is worth at this point.

---

### Q10. Could a useful next step be frontend-only?

**Yes.** The clearest remaining improvement — making Profile Settings collapsible — is purely frontend. The data is already in `renderMeHtml()`; making the panel a `<details>` element (or adding a collapse button) requires no backend changes.

---

### Q11. Would any worthwhile next step require backend/API changes?

The "What needs attention?" callout idea would require no new backend data — the counts are already in `GET /api/my-humanx`. If ever desired, it is frontend-only too.

No worthwhile improvement in this pass requires a backend change.

---

### Q12. What is the smallest useful D-293B candidate?

**Make Profile Settings collapsible.**

Currently `meProfileSettingsHtml()` renders as an always-open panel between the Account card and the My Content counts. On most owner visits after initial setup, this panel is not needed and pushes the counts/filter/Recent Truths down the page.

Wrapping the editable fields (slug, bio, toggle, Save, Copy) inside a `<details>/<summary>` block — or adding a simple "Edit ▸ / ▾" toggle — would let returning owners skip past it without scrolling through the full form. The Account card (name, email, handle) would remain fully visible; only the edit controls would collapse.

**Expected implementation:** one change to `meProfileSettingsHtml()` in `public/app-v10.js`. No backend change. No CSS file changes required beyond possibly one or two lines if needed. The `<details>/<summary>` approach requires zero JS and zero CSS — pure HTML.

**Impact:** reduces the distance from page top to My Content counts and Recent Truths by approximately one panel height (~80–120px on a typical profile setup). Does not change post-submit owner flow (still lands at Recent Truths), but improves the returning-owner scroll experience.

---

### Q13. Classify D-293B

**Frontend-only.** One function change in `public/app-v10.js`. No backend, schema, API, migration, CSS, or Review changes required.

---

### Q14. Prefer one visible frontend-only improvement if there is a clear candidate

**Clear candidate: make Profile Settings collapsible.**

This is the single remaining improvement that most directly benefits the returning-owner experience without touching any sensitive boundary (Review gate, public profile, analysis/Truth pipeline, belief engine, backend).

The post-submit Truth flow is now well-served (D-291B/C). The next friction point is the always-open Profile Settings form taking space between the Account card and the active content area on every visit after initial setup.

---

### Q15. If the dashboard is good enough for now, say stop here.

**The dashboard is close to good enough, but one small improvement remains.** The page is functional and well-ordered as of D-291B. The post-submit Truth flow is fixed. The content activity area is clear. However, Profile Settings occupies significant visual space on every visit regardless of whether the owner intends to edit it.

**Recommendation: continue to D-293B** — make Profile Settings collapsible. This is a small, safe, frontend-only change with no behavioral risk. If the owner disagrees, the pass still serves as a useful baseline audit.

---

## Friction Summary

| # | Issue | Severity | Fixable without backend? |
|---|-------|----------|--------------------------|
| 1 | Profile Settings always-open form pushes counts/filter/Truths down by ~1–2 screen sections on returning visits | Medium — not blocking, but consistently low-value space on non-editing visits | Yes — `<details>/<summary>` or toggle in `meProfileSettingsHtml()` |
| 2 | Belief panels (Snapshots/Mirror/Reflection/Avatar) interleaved with content activity panels | Low — grouped well enough; only matters if belief space is rarely used | Yes — reorder in `renderMeHtml()` |
| 3 | No "items awaiting attention" summary callout | Low — covered by counts chips + filter bar | Frontend-only if desired |

Only friction #1 rises to D-293B candidacy. Items 2 and 3 do not need immediate attention.

---

## D-293B Candidate

**Make Profile Settings collapsible in `meProfileSettingsHtml()`.**

- **Scope:** `public/app-v10.js` — `meProfileSettingsHtml()` only.
- **Classification:** Frontend-only.
- **Risk:** Very low. Native `<details>/<summary>` is HTML-only; no JS state needed. Can default to closed or open based on whether slug is set (richer) or always default closed (simplest).
- **No backend/schema/API/CSS/migration/Review changes.**
- **Expected outcome:** Returning owners who have already configured their profile can scroll past a single closed summary line ("Profile Settings ▸") to reach My Content counts and Recent Truths without scrolling through the full slug/bio/toggle form.

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified in D-293A |
| `scripts/hardening-smoke-test.mjs` | Not modified in D-293A |
| `src/worker.js` | Not modified |
| All backend/schema/API/migration | No changes |

---

## Static Checks (D-293A)

Docs-only change — no code files modified. Baseline unchanged.

| Check | Expected |
|-------|----------|
| `hardening-smoke-test.mjs` | `3405 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (57 hard checks)` |
