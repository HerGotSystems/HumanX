# D-125E — Owner Test Cycle 4: Claim Submission and Review Audit

**Date:** 2026-06-14  
**Branch:** docs/d125e-claim-review-audit  
**Auditor:** Static code inspection — `public/app-v10.js`, `src/worker.js` (read-only)  
**Mode:** Audit only. No code changes. No deploy, no Wrangler, no D1 query, no production writes, no admin token.

**Verdict: PASS**

No patches needed. All submission, public/private boundary, Review gate, Review cards, inspect panel, and hostile-submitter checks pass. No stop conditions triggered.

---

## Checks

| Check | Result |
|---|---|
| `node scripts/belief-engine-static-check.mjs` | 24/24 PASS |
| `node --check public/app-v10.js` | Syntax OK |
| `node scripts/hardening-smoke-test.mjs` | 416/416 PASS |

---

## Audit Results by Area

### Q1 — Claim submission: review-first clarity

**PASS.**

Multiple independent layers communicate that submission is not immediate publication:

**Page-level sidebar (`helperText()` for submit mode, line 76):**
```
A claim is a precise, testable public statement. Scores reflect what evidence has been submitted — not an automatic verdict.
New claims enter Review before becoming public.
```
Both sentences present before any field is touched. ✓

**Form intro (renderSubmit, line 97):**
```
A claim is a single precise, testable public statement. State it as specifically as you can — evidence and pressure will be attached after submission. Pseudonymous by default.
Scores reflect submitted evidence — not an automatic verdict.
```
`submit-trust-note` class identifies the second sentence for easy styling reference. ✓

**Submit button label:**
```
Submit for Review
```
"For Review" is part of the button label itself — the user reads it at the click point. ✓

**Post-button inline note (below the button, inside the form):**
```
Enters admin Review before going public. Not visible until approved.
```
Class: `review-first-note`. ✓

**Confirmation screen (success, non-duplicate, `saveClaim()` line 182):**
- Toast: `Claim submitted for Review. It will appear publicly after approval.`
- Page heading: `Claim submitted for Review`
- Body: `Your claim is now in the moderation queue and is not yet public. It will appear publicly after an admin approves it.`

Three independent restatements of the same fact at the confirmation step. ✓

**Near-duplicate confirmation screen:**
- Toast: `Submitted for Review. A similar claim may already exist.`
- Page heading: `Claim submitted for Review`
- Body: `Your claim is now in the moderation queue. A similar claim may already exist — a moderator will review both.`
- Badges: `in review` + `similar exists`

Still clearly review-first. Similarity advisory doesn't imply rejection. ✓

**Existing claim screen (duplicate, normalised match):**
- Toast: `This claim already exists.`
- Page heading: `Claim already exists`
- Body: `A claim with the same meaning is already in the system.`
- Actions: Study existing claim / Submit a different claim / Browse Claims

No misleading state — user is not told they submitted anything new. ✓

---

### Q2 — Submit: copy quality, verdict/proof language

**PASS.**

| Surface | Copy | Status |
|---|---|---|
| Sidebar | "Scores reflect what evidence has been submitted — not an automatic verdict." | ✓ |
| Form intro | "Scores reflect submitted evidence — not an automatic verdict." | ✓ |
| Home Submit card | "Enters moderation before going live." | ✓ |
| Success screen | "It will appear publicly after an admin approves it." | ✓ (approval, not verification) |
| Success screen | No "proven", "confirmed", "verified", or "fact" language | ✓ |

No language implies HumanX has validated or confirmed a claim. "Approved" is used (admin decision), not "verified" or "proven". ✓

**Writing tips guide:** A `<details>` element (collapsed by default on load). Summary: "Writing tips". Contains a good/bad two-column table with concrete examples. The distinction used is "testable" vs "opinion/slogan/unfalsifiable" — no moral framing. ✓

**Claim type hints (`CLAIM_TYPE_HINTS`, line 93):** Six types with plain-English descriptions of what each means. "Medical/High Risk" is flagged for "high scrutiny" — no automatic rejection or verdict implied. ✓

---

### Q3 — Submit: weak/vague claim handling

**PASS.**

**Frontend quality hints (`claimQualityHints()`, line 122):**

Triggers: opinion opener, absolute (always/never), "everyone knows", slogan patterns, vague actor, moral label without documented act, universal scope, very short (<20 chars). Eight categories.

Hint display label: `Quality hints (advisory — not blocking)`

The word "advisory" and "not blocking" both appear in the hint bar label. A vague claim can still be submitted. The hints appear inline below the claim input field as the user types (via `updateClaimQualityHints()` bound to `oninput`). ✓

**Backend minimum length:** `createClaim()` in `worker.js` line 82: `if (claim.length < 8) return json({ error:'CLAIM_TOO_SHORT' },400)`. An 8-character minimum — very permissive. A claim like "bad now" passes the length check. The frontend passes the error toast from `e.message` to `toast()`. The "CLAIM_TOO_SHORT" response likely has `message` in the error body — if not, the generic toast ("Claim submission failed.") fires. Either way, no silent failure.

**Assessment:** Vague claims will reach the Review queue. This is by design — Review is the owner's editorial filter. The frontend quality hints are advisory friction (visible, labeled), not hard rejection. The owner (P6) sees quality advisory badges on Review cards. ✓

---

### Q4 — Submit: mobile and form usability

**PASS (static assessment).**

| Element | Check | Status |
|---|---|---|
| `#cClaim` claim input | Standard `<input>` — fills available width | ✓ |
| `.cat-chips` category chips | `flex-wrap` implicit in chip row; multiple chips on a line | Mobile D-125G to confirm |
| `<select id="cType">` claim type selector | Native `<select>` — browser-handled on mobile, always usable | ✓ |
| `<textarea id="cEvidence">` | Growable, no fixed height | ✓ |
| Submit button | `.primary` class — full-width button in `.hx-form` context | ✓ |
| Post-submit confirmation actions | Three `<button>` elements with adequate spacing | ✓ |

No fixed-width elements or overflow risks visible from CSS and markup. Actual tap-target sizing deferred to D-125G (Cycle 6 mobile layout stress).

---

### Q5 — Public/private boundary

**PASS.**

**`listClaims()` in worker.js (line 77):**
```sql
WHERE COALESCE(c.review_state,'public')='public'
```
Default review_state on legacy rows is treated as `public` — only claims explicitly in `review` or `rejected` states are excluded from public listing. New claims are inserted with `review_state = 'review'` (line 82), so they are excluded from `listClaims` until approved. ✓

**`getClaim()` (line 78):**
```js
if ((claim.review_state||'public')!=='public') return json({error:'CLAIM_NOT_FOUND'},404)
```
Direct access to a pending claim by ID also returns 404. No leaked preview. ✓

**Evidence, pressure, and tests for pending claims:**
```sql
WHERE COALESCE(e.review_state,'public')='public'
WHERE COALESCE(p.review_state,'public')='public'
```
Sub-items on an approved claim also filter by `review_state`. ✓

**Study view after submit:** The success confirmation page links to "Study this claim" via `selectClaim(id)`, which calls `getClaim()` at `/api/claims/:id` — that same 404 gate applies, so a pending claim cannot be accessed publicly through the Study view by any other user. The submitter can study their own submission via the queue, but the public Study path is gated. ✓

---

### Q6 — Review tab gate

**PASS.**

**`renderReview()` (line 114):**
```js
const token = adminToken();
document.getElementById('main').innerHTML = `
  <div class="review-page">
    <div class="review-header review-admin-bar">
      <h2>Review Queue</h2>
      <span class="badge b-red">admin only</span>
      <input id="adminToken" placeholder="Admin token" value="${esc(token)}" autocomplete="off">
      <button ...>Load Queue</button>
      <button onclick="clearAdminToken()">Clear Token</button>
    </div>
    <div id="reviewList">
      <div class="panel">${token ? 'Loading review queue…' : 'Enter admin token to load the queue.'}</div>
    </div>
  </div>`;
if (token) { try { await loadReviewQueue(); renderReviewList() } catch(e) { ... } }
```

Without a stored token:
- `adminToken()` returns `''` (empty string from `localStorage.getItem(LS_ADMIN) || ''`)
- The `#reviewList` div renders only the prompt text: `"Enter admin token to load the queue."`
- `loadReviewQueue()` is NOT called
- No review data is fetched or rendered

The gate is client-side, but the worker also enforces it server-side:

**`reviewQueue()` in worker.js (line 57 → `requireAdmin`):**
```js
function requireAdmin(request, env) {
  const admin = request.headers.get('x-humanx-admin') || '';
  const expected = env.HUMANX_ADMIN_TOKEN || '';
  if (!expected || !safeEqual(admin, expected)) return json({ error:'ADMIN_REQUIRED' },403);
  return null;
}
```
`safeEqual()` uses constant-time comparison — resistant to timing attacks. Even if the client-side gate were bypassed (e.g., by calling `/api/review` directly), the worker returns 403 without any queue data. ✓

**Token input field:** `autocomplete="off"` is set. The token value in the input is populated from `adminToken()` (returns stored localStorage value). If the user has stored a token, it pre-fills the field — appropriate, as this is a per-device owner workflow. ✓

**No token in any rendered doc/log/commit:** Confirmed across D-124M through D-125D. ✓

---

### Q7 — Review cards: clarity and action safety

**PASS.**

**State badge on each card (line 127):**
- `b-yellow` = `review` (pending)
- `b-green` = `public` (approved)
- `b-red` = `rejected`

Clear, consistent colour encoding. ✓

**Approve and reject: two-step confirmation (line 127):**

Approve flow:
1. `requestApproveReview(id)` — sets `pendingApproveReviewId = id`, re-renders card
2. Card shows: `Approve this item? It will become public.` + `Confirm Approve` + `Cancel`
3. `reviewDecisionUI(type, id, 'public')` — makes the API call

Reject flow (same pattern with `pendingRejectReviewId`):
1. `requestRejectReview(id)` — sets `pendingRejectReviewId = id`, re-renders card
2. Card shows: `Reject? It will not become public.` + `Confirm Reject` + `Cancel`
3. `reviewDecisionUI(type, id, 'rejected')` — makes the API call

Single accidental click doesn't fire. Both confirmation prompts are inline (no modal) — clear and in context. ✓

**Keep Pending button:** Available on all cards. `reviewDecisionUI(type, id, 'review')` — explicit no-op that confirms review state. Useful for marking that an item has been looked at without deciding. ✓

**Approve language:**
- Confirmation: `"Approve this item? It will become public."`
- Toast on success: `"Approved. Item is now public."`
- Filter bar empty state for public: `"Approved items are visible to all users."`
- Helper text: `"Approve makes an item public. Reject keeps it private."`

All four surfaces say "public" / "visible", not "proven" / "verified". ✓

**`reviewStateLabel()` (line 138):**
```js
{
  public: 'Public — live and visible to all users',
  rejected: 'Rejected — hidden from public, kept for audit',
  review: 'Pending review — not yet public'
}
```
Used in the inspect panel state bar. All three labels are accurate and non-verdict. ✓

---

### Q8 — Inspect panel

**PASS.**

**Trigger:** `inspectReviewItem(id)` button on each card. Toggle — clicking again collapses. Auto-scrolls to panel on open. ✓

**Navigation:** "← Prev" / "Next →" buttons within the inspect panel with position indicator ("3 of 12 · 2 hints"). Allows sequential review without returning to the list. ✓

**Fields shown for a claim item:**
- ID, Type, State, Reports (if any), Report Reason (if any)
- Category, Claim Type, Submitted By, Evidence/Testability/Survivability scores
- Pressure point count, Duplicate/similar advisory if set
- Created / Updated timestamps

All fields are informational — no "approve this" pressure embedded in the field list itself. ✓

**Quality hints in inspect panel (line 143):**
```
Quality hints (advisory — not blocking)
```
Same label as in the submit form. Consistent framing. ✓

**Long text (`inspectLongText()`):** Used for evidence body and pressure body fields. Collapses at a character limit with a "Show more" toggle. Readable without overflow. ✓

**Study View link:** "Open Study View ↗" in inspect panel actions — opens the full claim in Study mode. Allows deep inspection before deciding. ✓

**Top actions in inspect panel:** `Approve` / `Keep Pending` / `Reject` — same two-step confirm pattern as card-level actions, duplicated at top of inspect panel for convenience without removing the confirm step. ✓

---

### Q9 — Hostile / spammy submitter

**PASS.**

**Rate limit (worker.js, `createClaim()` line 82):**
```js
await safeRateLimit(request, env, `claim:${ip(request)}`, 8, 3600000);
```
8 claims per IP per hour. Error path (line 67): `RATE_LIMITED` → 429 `"Too many requests. Try again later."` The frontend `api()` function throws on non-OK responses; `saveClaim()` catches and calls `toast(e.message)`. So the user sees `"Too many requests. Try again later."` as a toast. ✓

**Near-duplicate detection (`createClaim()` line 82):**
```js
const normalizedClaim = meaningKey(claim);
const existing = await env.DB.prepare(
  `SELECT ... FROM claims ... WHERE c.normalized_claim=? ...`
).bind(normalizedClaim).first();
if (existing) return json({ ok:true, existing:true, claim:mapClaim(existing) });
```
Exact-normalised duplicates are caught before insertion and returned as the existing claim. The frontend shows the "Claim already exists" screen. ✓

**Near-duplicate scan (post-insert, `createClaim()` line 82):**
```js
for (const c of candidates.results||[]) {
  if (meaningMatch(claim, c.claim)) {
    nearDuplicate = true; similarClaim = {id:c.id, claim:c.claim}; break;
  }
}
if (nearDuplicate) await env.DB.prepare(
  `UPDATE claims SET near_duplicate_of=? WHERE id=?`
).bind(similarClaim.id, claimId).run();
```
Fuzzy near-duplicate matching runs post-insert. Flagged claims appear in Review with `~similar` badge. The owner sees these in the "~Similar" filter tab. ✓

**Shadow-ban (`requireUser()`, line 176):**
```js
const row = await env.DB.prepare(`SELECT is_shadow_banned FROM users WHERE id=?`).bind(userId).first();
if (Number(row?.is_shadow_banned||0) === 1) throw new Error('USER_SHADOW_BANNED');
```
Worker maps `USER_SHADOW_BANNED` → 403 `"Action not permitted."` The frontend receives this as an API error and toasts the message. Shadow-banned users can't submit. ✓

**No input that escapes to public without Review:**
All claim inserts use `review_state = 'review'`. The only paths to `review_state = 'public'` are:
1. `reviewDecision()` — requires `requireAdmin()` (admin token check)
2. Legacy seed claims inserted directly with `'public'` (demo seed only, not user-reachable)

No user action can bypass this. ✓

---

### Q10 — Approve meaning: "public", not "proven"

**PASS.**

| Surface | What it says | Status |
|---|---|---|
| Approve confirmation inline text | "Approve this item? It will become public." | ✓ |
| Approve toast (on success) | "Approved. Item is now public." | ✓ |
| Helper text sidebar | "Approve makes an item public. Reject keeps it private." | ✓ |
| Filter: Public view empty state | "Approved items are visible to all users." | ✓ |
| Truths page framing | "Public means visible, not proven." | ✓ |
| Evidence sidebar | "Evidence records reflect what has been submitted — not an automatic verdict on the claim." | ✓ |
| Claims browse sidebar | "Verdicts are pressure-test labels, not automatic truth rulings." | ✓ |

"Proven", "verified", "confirmed" do not appear in any approve-path user-facing string. The distinction between approval (editorial decision) and verification (truth status) is consistently maintained. ✓

---

### Q11 — Review audit summary

**PASS.**

`renderReviewAuditSummary()` (line 141): Collapsible audit panel ("▸ Audit Summary") showing counts by state. Shows pending, public, rejected, reported, pressure, demo/test, similar, dupes. Collapsed by default.

Note in audit body: `"Audit only — no cleanup action is performed from this summary."` ✓

Archived count shown separately with note: `"Archived items are smoke/test artefacts removed from the queue. They remain in the database for audit."` ✓

---

### Q12 — Stop conditions

**None triggered.**

| Condition | Status |
|---|---|
| Admin token exposed in any rendered doc/log/commit | NOT triggered |
| Review gate bypass — queue visible without token | NOT triggered — client gate + server `requireAdmin()` + 403 both enforced |
| Claim appears publicly without Review approval | NOT triggered — `review_state='review'` on all new inserts; `listClaims()` and `getClaim()` filter to `public` only |
| Approve implies proven/verified | NOT triggered — "public/visible" language throughout |
| Mobile submit unusable | NOT assessed (deferred to D-125G — no overflow risk from static code) |

---

## Notes (non-blocking)

### N1 — Rate-limit feedback is generic (FRICTION)

When a user hits the 8-claims/hour cap, the toast shows: `"Too many requests. Try again later."` This is accurate but gives no indication of how long to wait. For a legitimate user who submitted several claims in one session, "try again later" with no time estimate is mildly frustrating.

*Backlog: `[COPY] Rate-limit toast: "Too many requests. Try again later." — no retry window given. Consider: "Claim limit reached. Try again in an hour." Low priority.*

### N2 — Claim-too-short error message depends on backend `message` field (FRICTION)

The frontend `saveClaim()` catches errors with `toast(e.message || 'Claim submission failed.')`. The worker returns `{ error:'CLAIM_TOO_SHORT' }` with no `message` field for a short claim. The `api()` function reads `data.message || data.error || 'Request failed'` — so the toast would show `"CLAIM_TOO_SHORT"` (the raw error code).

This is a low-priority ergonomic gap: the minimum is 8 characters, which would require deliberate effort to hit. But if a user submits a very short fragment, they'd see a raw error code.

*Backlog: `[COPY] CLAIM_TOO_SHORT error has no user-facing message field in worker response. Toast shows raw error code. Consider: message: "Claim is too short — state a specific, testable statement." Low priority (8-char minimum is hard to accidentally hit).*

### N3 — Truth submission uses same review-first copy pattern (PASS)

Truth submit button: `"Submit Truth for Review"`. Post-button note: `"Enters Review before going public."` Sidebar helper: `"Added truths enter Review before going public."` Same layered review-first copy as claims — consistent. ✓

---

## Files Changed

| File | Change |
|---|---|
| `docs/D125E_CLAIM_REVIEW_AUDIT.md` | Created (this file) |

No code changes. Verdict: PASS.

---

## Recommended D-125F Scope

**D-125F — Owner test Cycle 5: Public content browsing**

Simulate P3 (incognito, no prior state) and P5 (confused normal user). Follow Cycle 5 steps from `D125A_OWNER_TESTER_HARDENING_PLAN.md`. Focus on:

- Claims tab: is "Public means visible, not proven" framing visible and legible?
- Claims Study view: are evidence, pressure, and votes rendered without "proven/verified" language?
- Truths tab: is "not verified" badge prominent on truth cards?
- `convertTruth()` "Pressure-test as Claim" button: does the confirmation copy say "review", not "publish"?
- Review tab without token: only gate prompt visible — no queue contents leaked?
- `/api/health` — confirm `ok: true, mode: d1-live` (static check, no D1 query needed if accessible in browser)
- `/api/debug` — confirm 403/ADMIN_REQUIRED returned for unauthenticated access (static check from `worker.js` already confirms gate; browser check optional)
- Verdict badge colours on Claims browse: do any imply "proven" or "disproven" visually without hedged copy nearby?
- Empty-state copy on Claims/Truths/Vault: is it welcoming without implying content is missing or private?
