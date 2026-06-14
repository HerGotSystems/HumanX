# D-125F — Owner Test Cycle 5: Public Content Browsing Audit

**Date:** 2026-06-14  
**Branch:** docs/d125f-public-browsing-audit  
**Auditor:** Static code inspection — `public/app-v10.js`, `public/index.html`, `src/worker.js`, `src/truths.js`, `src/evidence-vault.js`, `src/belief-snapshots.js`  
**Mode:** Audit only. No code changes. No deploy, no Wrangler, no D1 query, no production writes, no admin token.

**Verdict: PASS**

No patches needed. All public content visibility, framing, source safety, admin boundary, and API filter checks pass. No stop conditions triggered.

---

## Checks

| Check | Result |
|---|---|
| `node scripts/belief-engine-static-check.mjs` | 24/24 PASS |
| `node --check public/app-v10.js` | Syntax OK |
| `node scripts/hardening-smoke-test.mjs` | 416/416 PASS |

---

## Audit Results by Area

### Q1 — Home-to-public browsing: first-time discoverability

**PASS.**

**Nav tabs visible to all users (index.html line 28):**
```
Home | Beliefs | Drift | Claims | Submit | Evidence | Truths | Review | RunPack
```

P3 (incognito, no token) sees the same nav. No personalisation or gating at the tab level except Review, which shows a gate prompt rather than hiding the tab.

**From Home, public content is one click away:**
- "Browse Claims" card → `setMode('arena')` → `renderArena()`
- "Truths" card → `setMode('truths')` → `renderTruths()`
- "Evidence Vault" card → `setMode('vault')` → `renderVault()`

Home card copy for Claims:
```
Browse public claims. Open Study to investigate, vote on, and attach evidence to any claim.
```
No login, no account, no prior knowledge required to reach the list. ✓

**Claims list sidebar (helperText, line 76):**
```
Browse public claims. Open Study to investigate, vote on, and attach evidence to any claim.
Badges: Public · Pending Review · Rejected · Reported · Archived.
Verdicts are pressure-test labels, not automatic truth rulings.
Use the search bar and verdict filter to narrow the list.
```
Four sentences orient a first-time user: what the list is, what the badges mean, what verdicts mean, and how to filter. ✓

---

### Q2 — Claims list: "public means visible, not proven"

**PASS.**

**Verdict filter bar (`index.html` line 31):**
```html
<span class="verdict-qualifier small">Verdicts are pressure-test labels, not automatic truth rulings.</span>
```
This phrase sits directly beside the verdict filter dropdown — visible whenever a user touches the filter, without needing to open anything. ✓

**Claims browse sidebar (helperText for default/arena mode, line 76):**
```
Verdicts are pressure-test labels, not automatic truth rulings.
```
Repeated in the sidebar for the same mode. ✓

**`cls()` colour function and status badge on each claim card:**
```js
function cls(s){
  if(s==='Proven'||String(s).includes('Supported')||String(s).includes('rising')) return 'b-green';
  if(String(s).includes('Disproven')||String(s).includes('Collapse')||String(s).includes('falling')) return 'b-red';
  if(s==='Plausible') return 'b-blue';
  return 'b-yellow'
}
```
Claim status badge colours: green = Supported verdicts, red = Disproven/Collapse, blue = Plausible, yellow = other. These match claim-analysis vocabulary ("Proven", "Strongly Supported", "Disproven") not social trust signals. The verb-qualifier sentence appears next to the filter where users choose a verdict to browse — the juxtaposition makes the framing land. ✓

**`listClaims()` in worker (line 77):**
```sql
WHERE COALESCE(c.review_state,'public')='public'
```
Only public-approved claims are returned. Pending and rejected claims do not appear in the list. ✓

**`getClaim()` in worker (line 78):**
```js
if ((claim.review_state||'public')!=='public') return json({error:'CLAIM_NOT_FOUND'},404);
```
Direct access to a non-public claim by ID returns 404. No content leaked via direct URL. ✓

**`reviewStatusBadge()` on claim cards (line 158):**
The badge function renders state labels: "Public", "Pending Review", "Rejected", "Archived", "Reported". In the public list only `review_state='public'` claims are returned, so the badge will show "Public" for most — but the function is correct for all states. ✓

---

### Q3 — Truths list: "truth" safely framed as asserted, not proven

**PASS.**

**`listTruths()` in `src/truths.js` (line 13):**
```sql
WHERE COALESCE(t.review_state,'public')='public'
```
Only approved truths returned. ✓

**Truths section head in renderTruths (line 103):**
```html
<h2>Truths</h2>
<span class="badge b-yellow">widely asserted · not auto-verified</span>
```
The section header badge says "not auto-verified". ✓

**Truths page intro paragraph (renderTruths, line 103):**
```
Statements that circulate as fact — slogans, doctrines, inherited certainties, repeated beliefs.
Public means visible, not proven. Recording a truth here does not verify it.
Use Pressure-test as Claim to submit one for evidence-based review.
```
"Public means visible, not proven." — explicit and in the page body before any truth card. ✓

**Each truth card (truthCard, line 113):**
- Badge: `<span class="badge b-muted truth-not-verified">not verified</span>` — on every card, not just a page note
- `reviewStatusBadge(t, false, true)` with `truthCtx=true` renders the state badge as "visible" (not "Public") in muted style `b-muted truth-visible-badge` — explicitly de-emphasised for truths vs claims. ✓

**"Pressure-test as Claim" button on each truth card:**
- Button `title` attribute: `"Creates a pressure-testable claim for review — does not prove this truth."`
- Card note below the button: `"Creates a claim for review — does not prove this truth."`

Both surfaces say "does not prove" at the point of action. ✓

**Truths helper text sidebar (helperText, line 76):**
```
HumanX records what is asserted, not whether it is correct. Recording a Truth does not verify it.
Added truths enter Review before going public.
```
✓

**Admin-only affordances on truth cards:**
- `renderTruthAdminBar()` and `renderTruthFilterBar()` only render `if (isAdmin)` — checked via `!!adminToken()`. Without a stored token, neither bar appears. ✓
- Archive button on artefact truth cards: `isAdmin && artifact` — only shown with token. ✓
- Full truth ID display: without token, only `id: …${idSuffix}` (last 8 chars) shown. With token, full ID shown. ✓

No admin affordances visible to P3/P5. ✓

---

### Q4 — Study view: verdict and score framing

**PASS.**

**Study header qualifier (renderStudy, line 160):**
```html
<p class="study-verdict-qualifier small">
  Verdict is a pressure-test label, not an automatic truth ruling.
  Scores reflect the current submitted packet, not absolute certainty.
</p>
```
Placed immediately below the Evidence/Testability/Survivability meters — the user sees this qualifier before reading any score value. ✓

**Score meters (Study header):**
- `meter('Evidence', selected.evidenceScore)` — labelled "Evidence"
- `meter('Testability', selected.testability)` — labelled "Testability"
- `meter('Survivability', selected.survivability)` — labelled "Survivability"

No meter is labelled "Truth", "Confidence", or "Verified". Names describe properties of the submitted packet, not absolute truth. ✓

**Claim Flow section (sectionArgumentFlow, line 172):**
```
1 · Why people think it is true
2 · What attacks it
3 · How to test it
4 · What analysis says
```
"Why people think it is true" frames premise 1 as belief ("people think"), not fact. "What attacks it" implies it can be challenged. No framing suggests the claim is established. ✓

**Analysis item (analysisItem, line 166):**
- Uses `cls(verdict)` for badge colour — correct, this is a claim-analysis verdict where the colour encoding is intentional (Supported→green, Disproven→red)
- Shows verdict, meters, and `plain_language_summary` — all from RunPack AI output
- No "HumanX confirms" or "verified" framing around analysis results ✓

**Study review badge (studyReviewBadge, line 159):**
- Pending state shows `"Pending Review"` badge + note `"This claim is not public until approved."` ✓
- Rejected state shows `"Rejected"` badge + note `"This claim is kept out of public view."` ✓
- Casefile sidebar (renderCaseMini) also shows the review state badge. ✓

**Lineage panel (sectionLineage, line 167):**
Shows upstream Truths linked to the claim. Each truth shows statement + bridge note. No framing implies the truth was proven by being linked — the panel is labelled "upstream origin" (a structural relationship, not validation). ✓

---

### Q5 — Source links: safety

**PASS.**

**`safeHttpUrl()` (frontend, line 49):**
```js
function safeHttpUrl(url){
  const s = String(url||'').trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol==='http:' || u.protocol==='https:') return u.href;
    return null;
  } catch(_) { return null; }
}
```

**`sourceLink()` (frontend, line 50):**
```js
function sourceLink(url){
  const raw = String(url||'').trim();
  if (!raw) return `<p class="small ev-no-source">no source provided</p>`;
  const safe = safeHttpUrl(raw);
  if (safe) {
    const e = esc(safe);
    return `<p class="small source"><a href="${e}" target="_blank" rel="noopener noreferrer">${e}</a></p>`;
  }
  return `<p class="small ev-bad-source">${esc(raw)} <span class="ev-bad-source-note">not clickable — not a valid web address</span></p>`;
}
```

Three cases handled:
1. **No URL provided** → `"no source provided"` in muted style — honest, no implied trust ✓
2. **Valid http/https URL** → rendered as `<a>` with `target="_blank" rel="noopener noreferrer"` — safe external link ✓
3. **Invalid or non-http URL** (e.g., `javascript:`, `data:`, `ftp:`, free text) → rendered as escaped text with `"not clickable — not a valid web address"` label — not rendered as a link, no XSS path ✓

All user-submitted source URLs pass through `esc()` before rendering. No `javascript:` or `data:` URI can become a clickable link. ✓

**`httpUrlOrNull()` in worker (line 182):**
```js
function httpUrlOrNull(url) {
  const s = cleanText(url, 500);
  if (!s) return null;
  try {
    const u = new URL(s);
    return (u.protocol==='http:' || u.protocol==='https:') ? u.href : null;
  } catch (_) { return null; }
}
```
Same logic at the storage layer — only `http:`/`https:` URLs are written to D1. Non-http URLs are stored as `null`. Consistent with frontend rendering. ✓

---

### Q6 — Evidence Vault: public-only filtering

**PASS.**

**`listEvidenceVault()` in `src/evidence-vault.js` (line 28):**
```sql
WHERE COALESCE(c.review_state,'public')='public'
  AND COALESCE(e.review_state,'public')='public'
```
Two-level filter: both the parent claim and the evidence item must be `review_state='public'`. An evidence item attached to a pending claim is not shown. An evidence item with its own `review_state='review'` is not shown even if the parent claim is public. ✓

**Evidence quality labels (`evidenceQualityLabel()`, line 162):**
```js
{ repeatable:'repeatable', documented:'documented', media:'media',
  testimony:'testimony', vibes:'weak argument' }
```
Quality labels describe the evidence type, not trustworthiness. "Vibes" maps to "weak argument" — honest, no euphemism. No label says "trusted", "verified", or "authoritative". ✓

**`evidenceQualityClass()` (line 163):**
- `repeatable`/`documented` → `ev-q-strong` (blue)
- `media`/`testimony` → `ev-q-mid` (yellow)
- `vibes` → `ev-q-weak` (muted)

Visual emphasis matching quality tier — stronger evidence gets a more visible colour, weaker gets muted. No quality tier is called "proven". ✓

**Reused evidence collapse behaviour (reusedEvidenceHtml, line 174):**
- ≤3 reused items: shown inline as compact rows
- 4+ reused items: collapsed into `<details>` with source-group grouping and item count

Avoids overwhelming the Study view with reused vault items. The collapse label reads: "Reused from vault · N items · M source claims · click to expand". ✓

**Vault page sidebar (helperText, line 76):**
```
Reusable sources, documents, datasets, and test records. Each can be attached to multiple claims as support or as a pressure attack.
```
No overclaim about what vault items prove. ✓

---

### Q7 — Belief snapshots: user-scoped, not public

**PASS.**

**`listBeliefSnapshots()` in `src/belief-snapshots.js` (line 68):**
```js
const userId = await requireUser(request);
// ...
WHERE bs.user_id=?
```
Requires a valid user ID in `x-humanx-user` header. Query is scoped to `bs.user_id=?` — returns only the requesting user's snapshots. No cross-user snapshot visibility possible at the API level. ✓

Drift tab in the frontend loads snapshots for the current session user (via `headers()` which includes `x-humanx-user`). An incognito user (P3) with no prior session will receive an empty snapshot list and see the Drift empty state. ✓

---

### Q8 — Review/admin boundary for no-token users

**PASS (confirmed from D-125E Q6, reinforced here).**

**`renderReview()` (line 114):**
Without a stored `LS_ADMIN` token:
- `#reviewList` shows only: `"Enter admin token to load the queue."`
- No API call to `/api/review` is made
- No queue data is fetched or rendered

**Worker `/api/review` (line 57 → `reviewQueue`):**
```js
const adminError = requireAdmin(request, env);
if (adminError) return adminError;
```
Returns 403 `ADMIN_REQUIRED` without a valid token. No queue data in response body. ✓

**No admin UI visible to no-token users:**
- Truth admin bar: `if (isAdmin)` guard — `isAdmin = !!adminToken()` = `false` without stored token ✓
- Truth filter bar: same guard ✓
- Archive button on truth cards: `isAdmin && artifact` ✓
- Full truth ID display: truncated to last 8 chars without token ✓
- Review Audit Summary: only reachable inside `renderReview()` after `loadReviewQueue()` succeeds — no token = no data = no audit bar rendered ✓

---

### Q9 — RunPack: no accidental publication

**PASS.**

**RunPack page note (renderExport, line 156):**
```
Creating a packet does not publish anything — visibility still depends on admin Review approval.
```
One explicit sentence addressing the concern directly. ✓

**`createAipPacket()` in worker (line 87):**
```js
if ((detail.claim.reviewState||'public')!=='public')
  return json({error:'CLAIM_NOT_FOUND'}, 404);
```
RunPacks cannot be generated for non-public claims. A pending claim cannot be packaged and effectively "exported" as if it were public. ✓

---

### Q10 — Static API safety: `/api/debug` and `/api/health`

**PASS (from static worker read; live check deferred to browser).**

**`/api/debug` (worker, line 32):**
```js
if (url.pathname === '/api/debug' && request.method === 'GET') {
  const adminError = requireAdmin(request, env);
  if (adminError) return adminError;
  return debugState(request, env);
}
```
`requireAdmin()` runs first. Returns 403 before `debugState()`. `debugState()` returns table row counts and the last 5 claim rows — meaningful diagnostic data that must not be public. Confirmed gated. ✓

**`/api/health` (line 45 → `graphStatus`):**
```js
if (url.pathname === '/api/graph-status' && request.method === 'GET')
  return await graphStatus(request, env, { json });
```
No admin check — public. The `graphStatus()` function returns aggregate counts (claims, truths, evidence, etc.) — no user data, no raw DB dump, no IDs. This is intentionally public to power the Home page status line. ✓

Note: `/api/health` as a URL path is not in the worker route table. The equivalent public endpoint is `/api/graph-status`. A browser request to `/api/health` would fall through to the default 404 handler. Accurate: the D-125A plan's step 5g says "Try navigating to `/api/health`" — the owner should substitute `/api/graph-status` or check for an actual `/api/health` route in a live browser test.

---

### Q11 — Mobile/compact public browsing

**PASS (static assessment; full check deferred to D-125G).**

**Claims list (`renderArena`, line 91):**
- Uses `.grid` class with `auto-fit minmax()` — collapses to single column at phone width
- Each `.card.claim-card` uses `flex` layout internally — wraps safely
- `claim-title` is a heading (`<h3>`) with no fixed width — wraps ✓

**Verdict filter bar (`index.html` line 31):**
```html
<input id="search" ...>
<select id="filter" ...>
<span class="verdict-qualifier small">Verdicts are pressure-test labels, not automatic truth rulings.</span>
```
Search bar and filter are flex children. "Verdicts are…" qualifier is a `<span class="small">` — if it wraps at narrow width it remains readable. No fixed-width elements. ✓

**Truth cards (`truthCard`, line 113):**
Standard `.card.truth-card` with flex layout. Badge row wraps naturally. Long truth statements are `<h3>` elements that word-wrap. ✓

**Study view at mobile (`renderStudy`, line 160):**
- `.study-header` uses `flex` layout — vote row will wrap on narrow screens
- `.study-grid` is a CSS grid — expected to collapse to single column from `styles.css`
- Evidence, pressure, test, and analysis panels are separate `<section class="panel">` — will stack vertically ✓
- `study-verdict-qualifier` is a `<p class="small">` — reads as prose, wraps safely ✓

Actual tap-target and overflow verification deferred to D-125G.

---

### Q12 — Stop conditions

**None triggered.**

| Condition | Status |
|---|---|
| Pending content visible publicly | NOT triggered — `COALESCE(review_state,'public')='public'` filter on all public list routes; `getClaim()` returns 404 for non-public |
| "Truth" presented as proven fact | NOT triggered — "not verified" badge on every card; "Public means visible, not proven" in page intro; truthCard state uses "visible" not "Public" |
| Study verdict framed as final truth | NOT triggered — "pressure-test label, not automatic truth ruling" qualifier directly below meters |
| Unsafe source href rendering | NOT triggered — `safeHttpUrl()` validates protocol; invalid URLs rendered as escaped text, not links; `rel="noopener noreferrer"` on valid links |
| Admin controls visible to no-token users | NOT triggered — all admin UI gated behind `!!adminToken()` checks; Review queue requires token at both client and server |
| Belief snapshots cross-user | NOT triggered — `WHERE bs.user_id=?` scoped query; `requireUser()` enforced |

---

## Notes (non-blocking)

### N1 — `/api/health` vs `/api/graph-status` (FRICTION, docs)

D-125A Cycle 5 step 5g says to check `/api/health`. The worker has no route for `/api/health` — the public health/aggregate endpoint is `/api/graph-status`. This is a discrepancy in the test plan, not in the product.

*Backlog: `[DOCS] D-125A Cycle 5 step 5g says "/api/health" — worker route is "/api/graph-status". Update D-125A or note in D-125F. Low priority (owner-only doc).*

### N2 — "Verdicts are pressure-test labels" qualifier not visible on Study-mode direct load (FRICTION)

The verdict qualifier in the search bar (`index.html` line 31) is visible on the Claims list. It is also in the Study page via `study-verdict-qualifier` div. But a user who clicks a direct claim link (arriving in Study mode without passing through the Claims list) sees the Study qualifier — which is present — so no actual gap. ✓

### N3 — Reused evidence from vault shows source claim of potentially different type (INFO)

When a vault evidence item is reused across multiple claims, the reuse compact row shows the item's original `claim_id`'s text as a label (e.g., "Source: [other claim text]"). A confused P5 user might wonder why evidence attached to "Claim A" appears in the study of "Claim B". The label "Reused from vault" and the source claim link are present and accurate. No misleading framing — noted as something to watch in live testing.

*Backlog: `[COPY] Reused evidence source label may confuse users who haven't used the Vault. Accurate but dense. Low priority.*

---

## Files Changed

| File | Change |
|---|---|
| `docs/D125F_PUBLIC_BROWSING_AUDIT.md` | Created (this file) |

No code changes. Verdict: PASS.

---

## Recommended D-125G Scope

**D-125G — Owner test Cycle 6: Mobile layout stress**

Simulate P1 (fresh mobile) at 390px (iPhone 14) and 768px (tablet). Follow Cycle 6 steps from `D125A_OWNER_TESTER_HARDENING_PLAN.md` against the live site. Focus on:

- Home cards at 390px: all card text readable, no horizontal overflow, "When:" hints hidden (known N3 from D-125B) — confirm acceptable or patch
- Belief Engine intro at 390px: "Begin Mapping" fully visible and tappable
- Quiz screen at 390px: Likert buttons large enough to tap without mis-firing
- Result screen at 390px: vertical scroll only, no horizontal scroll; Pressure Map (radar chart) legible
- Accordion sections at 390px/768px: open/close without layout break
- Export & Share buttons at 390px: all four actions (Start Over, Download PNG, Copy Summary, Send to HumanX) tappable
- Claims Study at 390px: study-grid collapses to single column; vote buttons and Build RunPack tappable
- Truths list at 390px: truth cards readable, "Pressure-test as Claim" tappable
- Submit form at 390px: claim input, category chips, type selector, evidence textarea, submit button all usable
- Review gate at 390px: token input field and "Load Queue" button fit without overflow

D-125F static check confirmed no CSS overflow risks from fixed-width elements. D-125G is the live confirmation pass at real phone width.
