# D-183 Onboarding Clarity Series — Closeout

**Merged:** 2026-06-28  
**Patches:** D-183A through D-183F  
**Baseline at close:** 1525 / 24 / 57 (hardening / belief-engine / worker-route)

---

## What the series did

Six consecutive frontend-only patches that added compact helper copy and
empty-state guidance across every major screen in HumanX. No backend, no
auth/token changes, no migrations, no logic changes, no CSP tightening.

---

## Screens improved

| Patch | Screen | Primary change |
|-------|--------|---------------|
| D-183A | Home | 4-step "Start here" numbered strip before the Actions grid |
| D-183B | Claim Builder | Guide box in Step 1 (what makes a useful claim); field notes in Steps 2 and 3; "what happens next" note before submit |
| D-183C | Study / Arena | Expanded Evidence, Pressure, Tests section descriptions; richer empty states; Tests hint note |
| D-183D | RunPack / Export | Intro clarifies Copy (prompt for AI chat) vs Download (JSON); "before you generate" tip; button legend |
| D-183E | Truths / Drift | Drift intro paragraph; Truth vs Claim clarifier; Add Truth form guidance; empty-state no longer references hidden form |
| D-183F | My HumanX / Profile | Page intro (private-by-default); Export button note; public profile clarifier; Archive-meaning note in Recent Claims |

---

## What changed in each category

**First-use guidance added:**
- Home: numbered four-step strip pointing to Browse, Investigate, Submit, RunPack
- Drift: main-content intro explaining what Drift is and the two snapshot types
- My HumanX: page-level intro before the account card

**Compact helper copy added:**
- Builder Step 1: what a useful claim looks like (falsifiable, specific, not a question)
- Builder Step 2: category guidance
- Builder Step 3: what happens after submit
- Truths: Truth vs Claim distinction; Add Truth form guidance
- RunPack: AIP vs JSON format distinction

**Empty-state clarity improved:**
- Evidence panel: expanded description; richer hint when empty
- Pressure panel: severity rating guidance
- Tests panel: what makes a good test; hint note under the Add Test button
- Truths empty state: no longer says "form above" (form is in a `<details>`)
- Drift empty states: intact; context now set by the new intro paragraph

**Confirmed no changes to:**
- All submission, voting, and evidence logic
- All backend routes and handlers
- All Review decision paths
- All auth/token handling
- Belief Engine file
- Data model or scoring
- CSP, wrangler.toml, migrations

---

## Smoke-test adjustments

Six stale fixed-size slice tests updated across D-183B, D-183E, and D-183F
(the new text pushed existing content past old char-count cutoffs). Each
update widened the slice or switched to a function-match regex; no test
semantics changed.

---

## Remaining product work (not in scope, possible next)

1. **Guided tour / onboarding overlay** — a step-by-step overlay on first
   login that walks the user through claim → evidence → RunPack. The D-183
   copy prepares the ground; an overlay would make it interactive.

2. **Claim and Truth templates / examples** — pre-filled example claims to
   lower the blank-page friction when a user opens the Builder for the
   first time.

3. **Better mobile polish** — the Start Here strip collapses to 2-col at
   700 px and 1-col at 400 px, but several helper paragraphs could be
   tightened or collapsed on small screens for readability.

4. **Drift onboarding path** — users who have never opened the Belief
   Engine have nothing in Drift. A clearer call-to-action at the top of
   Drift pointing to the Belief Engine would close the loop.

---

## Commit log

```
1b9b83b D-183F — Me / Profile clarity pass
79091c1 D-183E — Truths / Drift clarity pass
b5c8d4b D-183D — RunPack / Export clarity pass
7c43abd D-183C — Study/Arena first-use clarity pass
2fb68ad D-183B — Claim Builder first-use clarity pass
38c6f68 D-183A — Add Start here onboarding strip to Home screen
```
