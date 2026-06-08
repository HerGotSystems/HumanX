# D-92H — Truth Artefact Cleanup Live Outcome

**Date:** 2026-06-08
**Scope:** Docs-only. No code changes. No endpoint calls.
**Static baseline:** 235 / 24 / 39

---

## Why D-92G UI Was Needed

D-92F documented exact curl commands for rejecting and archiving the five confirmed artefact truths. Manual execution was blocked:

- `jq` was not installed on the user's system — command output would be raw JSON, hard to inspect
- Each artefact required two sequential POST calls (reject then archive), 10 total
- No confirmation before mutation — easy to misfire
- Admin token appeared in the curl command arguments, creating a logging/security risk
- No native feedback when something failed

D-92G was implemented first: a frontend-only "archive artefact" button in admin mode on Truth cards flagged `? ARTEFACT`. This provided a safe, confirmed, single-click path from the live browser.

---

## What Was Clicked

The D-92G UI was deployed to main and tested live. The operator:

1. Entered admin token in the Review tab → "Load Queue" (saves token to localStorage)
2. Switched to Truths tab
3. In admin mode, `? ARTEFACT` cards now showed a small orange "archive artefact" button
4. Clicked the button for each of the following cards:
   - **gfsdhdfhdfhdfhgdfa** (`tru_8dda0954d7b14910bb`)
   - **Blablabla** (`tru_2544a80a73034a6a95`)
   - **Statement** (`tru_5fe9ce641c634fcba5`)
   - **Slogan** (`tru_a3ecc8ef96104c6ebe`)
5. Each click showed a `confirm()` dialog: `Archive this Truth artefact? / "statement" / ID: tru_xxx / This will reject then archive it.`
6. User confirmed each dialog

---

## What Disappeared

After archiving and page reload, the following truths were no longer visible on the public Truths page:

| Statement | ID | Result |
|-----------|-----|--------|
| gfsdhdfhdfhdfhgdfa | tru_8dda0954d7b14910bb | ✅ Removed from public |
| Blablabla | tru_2544a80a73034a6a95 | ✅ Removed from public |
| Statement | tru_5fe9ce641c634fcba5 | ✅ Removed from public |
| Slogan | tru_a3ecc8ef96104c6ebe | ✅ Removed from public |

---

## What Remained

| Entry | ID | Status | Reason |
|-------|-----|--------|--------|
| SMALL INDEFERENT TRUTH | tru_67ae90e56f7449ee85 | ⚠️ Still visible | `isTruthArtifact` did not flag it — no "archive artefact" button appeared |
| Belief Engine Profile — Stoic Atheism | tru_53ee59f3fa4247f4be | ✅ Intentionally untouched | `personal belief` badge; no artefact flag; policy deferred |
| People are stupid | — | ✅ Intentionally untouched | Socially real belief |
| Money is evil | — | ✅ Intentionally untouched | Socially real belief |
| Trust the experts | — | ✅ Intentionally untouched | Socially real belief |
| Never trust the experts | — | ✅ Intentionally untouched | Socially real belief |
| Children should always obey adults | — | ✅ Intentionally untouched | Socially real belief |
| Science has proven it | — | ✅ Intentionally untouched | Socially real belief |
| My religion is the only true path | — | ✅ Intentionally untouched | Socially real belief |

---

## SMALL INDEFERENT TRUTH — Edge Case Analysis

**Why `isTruthArtifact` did not fire:**

The `isTruthArtifact` function (D-92C) detects:
1. Statement shorter than 4 chars — "SMALL INDEFERENT TRUTH" is 22 chars ❌
2. Single generic placeholder word (`statement`, `slogan`, etc.) — not a match ❌
3. Vowel ratio < 12% (keyboard mash) — "SMALL INDEFERENT TRUTH" has normal vowel ratio ❌
4. Repeated syllable pattern `(.{2,5})\1{2,}` — not a match ❌

The statement does not trigger any current artefact heuristic. It looks like a title-case placeholder phrase to a human, but the automated signals do not catch it.

**Why it was not force-cleaned anyway:**
- The hard rules for D-92G require the button to be visible only when `isTruthArtifact` fires
- No override/force path was added
- A human policy decision is needed: is this an artefact or a legitimate (if oddly phrased) truth submission?

**Recommendation:** Defer to a future classification pass. Do not add "SMALL INDEFERENT TRUTH" as a hardcoded exception. If this type of thing recurs, extend the artefact heuristic to detect all-caps multi-word phrases below a certain length (e.g., `isAllCaps && wordCount <= 4 && len <= 30`).

---

## Safety Judgement

- ✅ All four archived truths were unambiguous junk: keyboard mash, repeated syllable, generic single placeholder words
- ✅ Each was individually confirmed via `confirm()` dialog before any mutation
- ✅ Archiving was done by ID, not by text matching — no risk of catching similarly-named content
- ✅ No sensitive, socially real, or policy-contentious truths were touched
- ✅ Belief Engine profile (Stoic Atheism) was specifically protected and remains
- ⚠️ One borderline case (SMALL INDEFERENT TRUTH) remains visible — this is the correct outcome given the current artefact heuristic

---

## Recommendations

### 1. Rotate the admin token

During the D-92F curl attempt, the admin token may have been pasted into chat or visible in session context. **The admin token should be rotated** as a precautionary measure. This is independent of any code change — update the Cloudflare Worker secret and update localStorage in the browser with the new token.

**Priority: HIGH.** This is not a code change — it is a live operational action.

### 2. Leave SMALL INDEFERENT TRUTH for now

Do not force-clean it in D-92I. It is edge-case content that does not meet the current artefact signal bar. A future admin ergonomics pass (D-93) could introduce a weaker "admin-review only" lane for borderline cases.

### 3. Future D-93: Admin ergonomics polish

Suggested scope:
- All-caps multi-word short phrase detection in `isTruthArtifact` (catches "SMALL INDEFERENT TRUTH"-type entries)
- Or: a separate "mark for admin review" lane for borderline truths that are not public-safe but do not meet artefact threshold
- Admin filter chip on Truths page to show only artefact-flagged or admin-review-flagged cards
- Stoic Atheism policy decision: withdraw from public (set to `review`) without archiving

---

## Final Status

| Metric | Value |
|--------|-------|
| Target artefacts confirmed removed | 4 / 5 |
| Remaining edge case | SMALL INDEFERENT TRUTH (heuristic miss) |
| Sensitive/socially real truths touched | 0 |
| Stoic Atheism touched | No |
| Static baseline unchanged | 235 / 24 / 39 |
| Overall result | **PASS with one edge case** |
