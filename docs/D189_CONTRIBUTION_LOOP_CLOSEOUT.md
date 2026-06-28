# D-189 — Contribution Loop Closeout

**Date:** 2026-06-28
**HEAD at closeout:** `046ba83`
**Baseline at closeout:** 1566/24/57 (+17 tests from D-189B/C)
**Patches:** D-189A (audit) · D-189B (quick fixes) · D-189C (reward/feedback microcopy)

---

## Summary

D-189 addressed the full contribution loop: the path from a user selecting a claim in Study to submitting evidence, pressure, tests, or analysis, and the signals they receive afterward. The series moved from audit → fixes → copy polish, with no backend changes and no new state.

---

## D-189A — Contribution loop audit

**Commit:** `c026cb7`
**Scope:** Source-code review only. No code changes.
**Deliverable:** `docs/D189A_CONTRIBUTION_LOOP_AUDIT.md`

### What worked before D-189

- Board re-renders after every contribution via `selectClaim()` — scores, casefile counts, and flow panel all update live with no stale UI
- The 4-pill argument flow panel (`sectionArgumentFlow`) gives users a mental model of what's expected even before they start
- `focusAddEvidence / focusAddPressure / focusAddTest` buttons in the Investigation Board header scroll and focus the correct form
- Quality dropdown gives contributors a way to type their source
- Empty states in all four board sections contain specific, actionable language

### 11 friction points identified

| # | Issue | Severity |
|---|-------|----------|
| F1 | Evidence toast said "attached" — implied immediacy for a review-gated item | High |
| F2 | Flow panel empty rows had text guidance but no actionable button | Medium |
| F3 | `focusAdd*` didn't open a collapsed `<details>` before focusing | Medium |
| F4 | Evidence/pressure share one form with no strong mode confirmation | Low |
| F5 | Pressure empty state mentioned "Rate severity 1–5" — field doesn't exist | Medium |
| F6 | Vote buttons show no active/selected state after voting | Low |
| F7 | No next-step nudge after contribution | Medium |
| F8 | Analysis flow is multi-step with no in-app state between steps | Low |
| F9 | Submit button said "Attach to Selected Claim" — developer language | Low |
| F10 | Score changes after contribution are silent — no delta signal | Low |
| F11 | RunPack CTA says "evidence and pressure" — doesn't mention tests | Low |

Quick fixes (QF1–QF5) covered F1, F2, F3, F5, F7, F9.

---

## D-189B — Quick fixes (5 of 5)

**Commit:** `19c7968`
**Files:** `public/app-v10.js`, `public/index.html`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**Tests added:** 9 (Section 102)

### QF1 — Evidence toast honest about review

`'Evidence attached to selected claim.'` → `'Evidence submitted for review. It will appear after approval.'`

Fixes F1. Evidence and pressure now both acknowledge the review queue before they affect the public record.

### QF2 — `focusAdd*` opens collapsed `<details>` before focusing

Added `const d=document.getElementById('eTitle')?.closest('details');if(d)d.open=true;` to both `focusAddEvidence` and `focusAddPressure` in `_D181B_ZERO_PARAM_ACTIONS`.

Fixes F3. Clicking `+ Evidence` or `+ Pressure` from a collapsed side panel no longer silently loses focus.

### QF3 — Pressure empty state copy corrected

Removed `"Rate severity 1–5 to show how much it damages the claim."` — that field does not exist.

Replaced with: `"Add pressure when a claim is vague, risky, overstated, socially loaded, or missing limits."`

Fixes F5.

### QF4 — Submit button label

`"Attach to Selected Claim"` → `"Add to Claim"` in `public/index.html`.

Fixes F9. More natural language.

### QF5 — Flow panel empty rows have actionable buttons

In `sectionArgumentFlow()`:
- Evidence empty: `'No support evidence attached yet. <button class="btn-mini" data-action="focusAddEvidence">+ Add evidence</button>'`
- Pressure empty: `'No pressure attached yet. <button class="btn-mini" data-action="focusAddPressure">+ Add pressure</button>'`

Fixes F2. Users see a clickable next step rather than a navigation instruction.

---

## D-189C — Reward/feedback microcopy

**Commit:** `046ba83`
**Files:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**Tests added:** 8 (Section 103)

### Toast audit before D-189C

| Contribution | Toast before | Honest? | Specific? |
|-------------|-------------|---------|-----------|
| Evidence | "Evidence submitted for review. It will appear after approval." | Yes (fixed D-189B) | Partial |
| Pressure | "Pressure point submitted for review." | Yes | Poor |
| Test | "Test added" | Yes | Poor |
| Analysis | "Analysis saved" | Yes | Poor |
| Vote | "Vote recorded" | Yes | Poor — doesn't say which vote |

### Changes

**Pressure toast** — consistent with evidence:

`'Pressure point submitted for review.'` → `'Pressure submitted for review. It will appear after approval.'`

**Test toast** — confirms immediate visibility (tests are not review-gated):

`'Test added'` → `'Test added — now visible in the Tests section.'`

**Analysis toast** — confirms immediate visibility:

`'Analysis saved'` → `'Analysis saved — verdict shown in the Analysis section.'`

**Vote toast** — confirms specific vote cast:

`'Vote recorded'` → `'Vote recorded: Believe.'` / `'Vote recorded: Reject.'` / `'Vote recorded: Unsure.'`

Uses `vote` parameter already passed to `voteClaim(vote)`.

**Next-action inline hint** — after `addCaseItem()` succeeds, the `evidence-attach-note` paragraph below the submit button briefly (4 seconds) shows a kind-specific nudge:

- Evidence: `'Submitted. Next: does anything challenge this claim? Switch to Attack above.'`
- Pressure: `'Submitted. More pressure makes the study more complete.'`

Restores automatically via `setTimeout`. No new state, no persistent UI.

---

## Final contribution loop state (post D-189A/B/C)

### Per-contribution signals

| Contribution | Review-gated? | Toast | Inline hint |
|-------------|--------------|-------|-------------|
| Evidence | Yes | "Evidence submitted for review. It will appear after approval." | Next-action nudge for 4s after form clears |
| Pressure | Yes | "Pressure submitted for review. It will appear after approval." | Next-action nudge for 4s after form clears |
| Test | No | "Test added — now visible in the Tests section." | — |
| Analysis | No | "Analysis saved — verdict shown in the Analysis section." | — |
| Vote | No | "Vote recorded: Believe." / "Reject." / "Unsure." | — |

### Loop entry/exit

| Entry | Mechanism |
|-------|-----------|
| Arena card click | `selectClaim(id)` → `renderStudy()` |
| My HumanX "Open Study →" | `openMyClaimStudy(id)` |
| Public profile "View in HumanX →" | `openPublicProfileClaimStudy(id)` |
| Direct URL `/c/:id` | Boot auto-calls `selectClaim(id)` |

All entries reach the same `renderStudy()` output.

| After contribution | What user sees |
|-------------------|---------------|
| Casefile sidebar | Count badges update immediately (N evidence · N pressure · N tests · N analysis) |
| Score meters | Re-render silently — all three meters reflect new state |
| Flow panel | First item of each type updates; empty-slot buttons remain for missing types |
| Board grid | Evidence / Pressure / Tests / Analysis sections re-render with latest counts |
| Toast | Honest, specific confirmation with Review status where applicable |
| Inline hint | 4-second next-action nudge in side panel (evidence and pressure only) |

### Side panel behavior

| Action | Result |
|--------|--------|
| Click `+ Evidence` | Dropdown set to support, `<details>` forced open if collapsed, title input focused |
| Click `+ Pressure` | Dropdown set to attack, `<details>` forced open if collapsed, title input focused |
| Submit "Add to Claim" | Form clears, toast shows, inline hint shows for 4s, board re-renders |
| Flow panel `+ Add evidence` | Same as `+ Evidence` button above |
| Flow panel `+ Add pressure` | Same as `+ Pressure` button above |

---

## What remains for later

| Item | Friction addressed | Effort | Notes |
|------|--------------------|--------|-------|
| Contribution counters / badges in My HumanX | F10 — no sense of contribution history | Medium | "You've added 7 pieces of evidence" |
| Pending-review queue for own submissions | F1 residual — user can't see their own items until approved | Medium | Requires per-user review filter |
| Inline mobile add forms | F4 residual — mode switch confusing on small screens | Medium | Separate evidence/pressure entry on mobile |
| Post-submit "view contribution" anchor | F7 residual — no link from toast to the submitted item | Low-Medium | Requires item ID returned from API |
| Score delta feedback | F10 — score changes are silent | Medium | Requires pre-contribution score snapshot |
| Active vote indicator | F6 — user can't see current vote on re-render | Low | CSS class on button matching stored vote |
| Analysis status indicator | F8 — no in-app state for "RunPack built, waiting for AI" | Medium | `sessionStorage` RunPack state flag |
| RunPack CTA mentions tests | F11 — "evidence and pressure" only | Trivial | One string change in `study-runpack-cta` |

---

## Files changed across D-189

| File | Change |
|------|--------|
| `public/app-v10.js` | QF1–QF3, QF5 (D-189B); toast overhaul + next-action hint (D-189C) |
| `public/index.html` | QF4 button label (D-189B) |
| `scripts/hardening-smoke-test.mjs` | Section 102 (9 tests, D-189B); Section 103 (8 tests, D-189C); allowlist updates |
| `docs/D189A_CONTRIBUTION_LOOP_AUDIT.md` | Full audit (D-189A) |
| `docs/D189_CONTRIBUTION_LOOP_CLOSEOUT.md` | This file (D-189D) |
| `docs/README.md` | Baseline updated each patch |
