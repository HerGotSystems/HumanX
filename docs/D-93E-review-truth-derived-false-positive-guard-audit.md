# D-93E — Review Truth-Derived Context False-Positive Guard Audit

**Date:** 2026-06-09  
**Mode:** AUDIT-FIRST — no backend/D1/Wrangler/live mutation performed during audit.  
**Baseline:** hardening-smoke-test 266 / belief-engine-static-check 24 / worker-route-static-check 39

---

## A. Files Inspected

| File | Purpose |
|---|---|
| `public/app-v10.js` | D-93D helpers, filter logic, badge rendering, inspect panel |
| `public/styles.css` | Badge CSS classes |
| `scripts/hardening-smoke-test.mjs` | Section 38 tests |
| `docs/D93D_REVIEW_TRUTH_DERIVED_CONTEXT.md` | D-93D implementation doc |
| `docs/D-93C-borderline-truth-derived-policy-audit.md` | Underlying policy |

---

## B. Current D-93D Behavior Summary

Three helpers added to `public/app-v10.js`:

### `isTruthDerivedClaim(item)`
```js
return String(item.type||'').toLowerCase()==='truth-derived'
  || String(item.claim_type||item.claimType||'').toLowerCase()==='truth-derived';
```
Pure type-field check. Uses backend-assigned `item.type` value `'Truth-Derived'` set by `truth-claim-bridge.js`. Not content-based. **Safe.**

### `isClaimCategoryEcho(item)` — **CONTAINS BUG**
```js
const cl = String(item.claim||'').trim().toLowerCase();
const ca = String(item.category||'').trim().toLowerCase();
if(!cl || !ca) return false;
return cl===ca || cl.includes(ca) || ca.includes(cl);
```
The `cl.includes(ca)` branch is too broad: if the category is a single common word (e.g., `"religion"`, `"science"`, `"trust"`, `"money"`, `"people"`, `"children"`) and that word appears anywhere in the claim, the function returns `true`. See Section C for full false-positive impact.

### `isLikelyBorderlineDerivedClaim(item)`
```js
if(!isTruthDerivedClaim(item)) return false;     // gate: Truth-Derived type only
if(isClaimCategoryEcho(item)) return true;        // inherits echo bug
const cl = String(item.claim||'').trim();
if(cl.length>=2&&cl.length<=40&&cl===cl.toUpperCase()&&/[A-Z]/.test(cl)) return true;
const es = item.evidence_score??item.evidenceScore??null;
return es!==null&&es<=10;
```
Three branches:
1. **Category-echo** — inherits the bug from `isClaimCategoryEcho`
2. **All-caps short phrase** — fires on stylised-but-real beliefs like `TRUST THE EXPERTS`, `GOD EXISTS`, `FREE WILL`
3. **Weak evidence (≤10)** — fires on any Truth-Derived claim with very low evidence

Crucially, the first gate (`!isTruthDerivedClaim(item)`) means this function never fires on user-submitted claims. All three branches are advisory-only and trigger no action. **Branches 2 and 3 are acceptable as-is.** Branch 1 inherits the echo bug.

---

## C. False-Positive Risk Assessment

### C.1 `isClaimCategoryEcho` — **HIGH-RISK FALSE POSITIVE**

Simulation results against protected beliefs with plausible single-word category values:

| Claim | Category (plausible) | `echo` result | Risk |
|---|---|---|---|
| My religion is the only true path | religion | **true** | FALSE POSITIVE |
| Science has proven it | science | **true** | FALSE POSITIVE |
| Trust the experts | trust | **true** | FALSE POSITIVE |
| Never trust the experts | trust | **true** | FALSE POSITIVE |
| Money is evil | money | **true** | FALSE POSITIVE |
| People are stupid | people | **true** | FALSE POSITIVE |
| Children should always obey adults | children | **true** | FALSE POSITIVE |
| SMALL INDEFERENT TRUTH | SMALL INDEFERENT TRUTH | true | CORRECT |
| People are stupid | People are stupid | true | CORRECT |

**Root cause:** `cl.includes(ca) || ca.includes(cl)` — substring matching fires when any category word appears anywhere in the claim string. In practice, category values for Truth-Derived claims are often single descriptive words (religion, ethics, epistemology, science, trust) that naturally appear in the claims they categorise.

**Impact in current deployment:** The `? borderline origin` and `⚠ category-echo` badges would appear on protected/sensitive beliefs if their Truth-Derived claims have single-word category fields derived from common content words. This does not trigger any action (advisory only), but it adds misleading advisory noise to real beliefs and risks reviewer bias toward unnecessarily cautious treatment.

**Fix required:** Tighten to exact equality only:
```js
return cl === ca;
```
Exact equality correctly identifies the actual bad case (`SMALL INDEFERENT TRUTH` where claim text == category) without firing on substring containment.

### C.2 `isLikelyBorderlineDerivedClaim` all-caps branch — **LOW RISK / ACCEPTABLE**

Fires on `TRUST THE EXPERTS`, `GOD EXISTS`, `FREE WILL` etc. when entered as Truth-Derived claims in all-caps. However:
- Only applies to Truth-Derived claims (backend-gated)
- Badge says `? borderline origin` with tooltip "Heuristic: may derive from a borderline Truth — advisory only"
- No action is triggered
- Wording is appropriately hedged

**Risk:** Minor reviewer nudge toward skepticism on legitimate all-caps stylised beliefs. Acceptable given clear "Heuristic/Advisory" wording.

### C.3 `isLikelyBorderlineDerivedClaim` weak-evidence branch (≤10) — **LOW RISK / ACCEPTABLE**

Many real beliefs, including "Money is evil" with low initial evidence scores, would fire. However:
- Again, only applies to Truth-Derived claims (backend-gated)
- Advisory-only badge
- Reviewer is still required to make the actual decision

**Risk:** Acceptable. Low evidence is a legitimate advisory signal on derived claims.

### C.4 Non-Truth-Derived claims — **SAFE**

`isLikelyBorderlineDerivedClaim` returns `false` immediately for any non-Truth-Derived claim. User-submitted claims are unaffected by all three D-93D helpers regardless of content.

---

## D. Wording Risk Assessment

| Location | Wording | Assessment |
|---|---|---|
| `truth-derived` badge label | `truth-derived` | Neutral. Describes origin, not quality. ✓ |
| `category-echo` badge label | `category-echo` | Describes the structural pattern, not a judgement. ✓ |
| `category-echo` tooltip | "Category echoes claim text — do not approve without checking parent Truth" | "do not approve without checking" is slightly directive but appropriate for a moderation helper. ✓ |
| `? borderline origin` badge label | `? borderline origin` | Leading `?` marks it advisory. "origin" clarifies it describes the source, not the claim itself. ✓ |
| `? borderline origin` tooltip | "Heuristic: may derive from a borderline Truth — advisory only" | Correctly hedged. ✓ |
| Origin Path inspect row | "created via Pressure-test as Claim from a public Truth" | Factual description. ✓ |
| Review Advisory inspect row | "⚠ category-echo — Category matches claim text. Check parent Truth before approving." | Appropriate. ✓ |
| Borderline Hint inspect row | "Heuristic: source Truth may be borderline. Advisory — confirm via Truths page." | Correctly hedged. ✓ |
| No "artefact" wording | — | Confirmed: "artefact" does not appear in any D-93D badge or inspect row. ✓ |
| No "junk"/"garbage" wording | — | Confirmed: none. ✓ |
| No "delete"/"archive" button | — | Confirmed: no action buttons added. ✓ |

Wording is acceptable as-is, subject to the echo bug fix.

---

## E. Test Coverage Assessment

### Existing Section 38 tests (12 tests)

| Test | What it checks | Gap? |
|---|---|---|
| 38.1 `isTruthDerivedClaim` defined | Presence | OK |
| 38.2 detects Truth-Derived string | Basic detection | OK |
| 38.3 `isClaimCategoryEcho` defined | Presence | OK |
| 38.4 references claim and category | Fields used | **Weak** — does not verify exact-match behavior |
| 38.5 `isLikelyBorderlineDerivedClaim` defined | Presence | OK |
| 38.6–38.8 badge class references | Presence in code | OK |
| 38.9 filter branch | Presence | OK |
| 38.10 filter chip | Presence | OK |
| 38.11–38.12 CSS rules | Presence | OK |

**Gap:** No test asserts that `isClaimCategoryEcho` does **not** fire on substring-only matches. After the fix, a regression-guard test is needed.

**Gap:** No test asserts that `isLikelyBorderlineDerivedClaim` is gated by `isTruthDerivedClaim` (the key safety property — non-Truth-Derived claims must not be flagged).

---

## F. Recommendation

### **Small patch required** — tighten `isClaimCategoryEcho` to exact equality

**Exact change in `public/app-v10.js`:**

```js
// BEFORE (buggy):
function isClaimCategoryEcho(item){
  const cl=String(item.claim||'').trim().toLowerCase();
  const ca=String(item.category||'').trim().toLowerCase();
  if(!cl||!ca)return false;
  return cl===ca||cl.includes(ca)||ca.includes(cl);
}

// AFTER (fixed):
function isClaimCategoryEcho(item){
  const cl=String(item.claim||'').trim().toLowerCase();
  const ca=String(item.category||'').trim().toLowerCase();
  if(!cl||!ca)return false;
  return cl===ca;
}
```

No other logic changes required. The exact-match case still correctly catches `SMALL INDEFERENT TRUTH` (claim === category).

**Additional test changes in `scripts/hardening-smoke-test.mjs`:**
- Replace test 38.4 (which only checks field references) with a test that verifies exact-match behavior: echo fires when claim === category, does NOT fire on substring-only match.
- Add test 38.13: `isLikelyBorderlineDerivedClaim` is gated — does not fire on non-Truth-Derived item.

**Total test count after patch:** 266 (no change — test 38.4 replaced, one new test added = 267)

Wait — current count is 266. Replacing 38.4 keeps 266. Adding 38.13 makes 267. So README updates to 267.

---

## G. No Mutation Confirmation

> No database mutation was performed during this audit.  
> No curl commands executed.  
> No Worker endpoints called.  
> No D1 queries run.  
> No Wrangler commands run.  
> No cleanup performed.  
> `tru_67ae90e56f7449ee85` and `clm_30889d651e3b4b2cb6` are unchanged.

---

## H. Static Check Results (post-audit, pre-patch)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | 266 passed, 0 failed |
| `node scripts/belief-engine-static-check.mjs` | All hard checks passed |
| `node scripts/worker-route-static-check.mjs` | All hard checks passed |
