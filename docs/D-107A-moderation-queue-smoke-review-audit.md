# D-107A — Moderation Queue Smoke Review Audit

**Date:** 2026-06-10
**Mode:** Static / read-only audit — no code changes, no admin token, no moderation action, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 362 / belief-engine-static-check 24 / worker-route-static-check 56

> ⚠ This audit surfaces a **residual admin-surface XSS gap** (Section D.1): the Review inspect panel renders evidence source URLs through its own unsanitised anchor, bypassing the D-104B `sourceLink` fix. Found by static reading only; no exploit run.

---

## A. Files Read

| File | Focus |
|---|---|
| `public/app-v10.js` | `renderReviewList`, `reviewCard`, `renderReviewInspectPanel`, `reviewDecisionUI`, `requestApproveReview`/`cancelApproveReview`, `requestRejectReview`, `inspectReviewItem`, `reviewStatusBadge`, `evidenceMeta`/`sourceLink`/`safeHttpUrl`, `reusedEvidenceHtml`/`reusedItemCompact`, `adminToken`/`adminHeaders`, `renderError` |
| `public/styles.css` | review card/panel/button/badge/evidence/source styles |
| `public/index.html` | review/admin shell |
| `scripts/hardening-smoke-test.mjs`, `scripts/worker-route-static-check.mjs` | review/source coverage |
| `docs/` | D95B, D96B, D-97A/B, D-103A/B, D-104A/B/F, D106F, D105A |

---

## B. Current Moderation / Review Flow Map

```
Admin → Review tab (mode=review, renderReview)
  "admin only" badge + token form (input value=esc(token), autocomplete=off)
  Load Queue → loadReviewQueue() → GET /api/review (requireAdmin → safeEqual, fail-closed)
  renderReviewList():
    renderReviewFilterBar (Pending/Public/Rejected/Reported/~Similar/~Quality/Pressure/Dupes/Demo-Test/Truth-Derived/All)
    renderReviewAuditSummary
    renderReviewInspectPanel(item)?   ← full-width, above grid
    reviewCard(item) × N

reviewCard (per item):
  badges: type, state, reports, ~similar, needs-sharpening, truth-derived, category-echo, ? borderline origin
  actions: [Inspect] [Approve→requestApproveReview (2-step)] [Keep Pending] [Reject→requestRejectReview (2-step)]
  Approve pending: "Approve this item? It will become public." [Confirm Approve][Cancel]

renderReviewInspectPanel:
  top-actions: [Approve (1-click, deliberate)] [Keep] [Reject 2-step]
  fields: ID/Type/State/Reports/(type-specific)/Origin Path/Review Advisory/Borderline Hint
  evidence-type fields: Title, Body, Stance, Quality, **Source (own anchor)**, Parent Claim
  bottom-actions: Approve / Keep / Reject / Archive / Mark Duplicate / Dismiss Similar / Study
  scrollIntoView('.review-inspect-panel') after open (D-95B)

reviewDecisionUI → POST /api/review/decision (admin) → reload + re-render
```

---

## C. Existing Safety Protections (verified present at HEAD `1e46615`) — 12/12 ✅

| Protection | Source | Status |
|---|---|---|
| Card-row Approve is 2-step (`requestApproveReview` + Confirm) | D-96B | ✅ |
| No one-click card-row Approve (raw direct call removed) | D-96B | ✅ |
| Inspect-panel Approve is deliberate (opened by intent) | D-95B/96B | ✅ |
| Reject is 2-step (`requestRejectReview`) | pre-existing | ✅ |
| Inspect `scrollIntoView` | D-95B | ✅ |
| truth-derived / category-echo / ? borderline-origin badges | D-93D/E | ✅ |
| `isClaimCategoryEcho` exact-equality (no false positives) | D-93E | ✅ |
| `reviewDecisionUI` clears pending approve/reject state | D-96B | ✅ |
| Admin auth: `requireAdmin` → `safeEqual`, fail-closed | D-106B | ✅ |
| `/api/debug` admin-gated | D-106B | ✅ |
| Generic `403 ADMIN_REQUIRED` (no detail/token leak) | pre-existing | ✅ |
| No token in console/URL/RunPack | D-106A | ✅ |

Admin token appears only in its own input `value` (admin's own browser, `autocomplete="off"`); not logged, not in errors. `renderError` is generic + has a Back-to-Home button (D-101B).

---

## D. Findings (Ranked by Severity)

### D.1 — HIGH (security, admin-surface): Review inspect panel renders source URLs through its own unsanitised anchor

In `renderReviewInspectPanel`, the evidence Source field is built directly:

```js
if (item.source_url) fields.push(['Source',
  `<a class="source" href="${esc(item.source_url)}" target="_blank" rel="noopener noreferrer">${esc(item.source_url)}</a>`]);
```

This puts `esc(item.source_url)` **straight into `href`** — the exact pattern D-104B fixed in `sourceLink`. The Review inspect panel does **not** call `sourceLink` / `safeHttpUrl`. `esc()` blocks attribute breakout but not scheme injection, so a `javascript:` / `data:` / `vbscript:` source URL renders as a **clickable link in the Review inspect panel** — and this is the surface a **moderator clicks while holding the admin token** (the precise admin-targeting XSS scenario D-104A raised).

**Reachability:**
- D-104F coerces non-http(s) source URLs to null on `/api/evidence` going forward, so *new* submissions can't carry a bad URL.
- **But** D-104B/D-104F explicitly did **not** clean pre-existing D1 rows (the mitigation was safe *display*). The public Study path is safe via `sourceLink`; **this Review path is not.** Any legacy unsafe `source_url` row surfaced in the Review queue would render a clickable malicious link to the admin.

**This is the headline finding.** The D-104 fixes covered the public render path and future storage, but missed this second render path on the admin surface. Likelihood depends on whether legacy bad rows exist (unknown — the D-104E read-only legacy audit was never run), but the code path is unambiguously unsafe and trivially fixable.

### D.2 — LOW (consistency): Review inspect panel shows raw `quality`, not the D-103 label/class

The inspect panel pushes `['Quality', esc(item.quality)]` — so `vibes` shows as **"vibes"**, not "weak argument", and there is no tier styling. The D-103B quality clarity (label map + tier colour) reached the public Study evidence rows but **not** the Review inspect panel. Minor admin-side inconsistency; not a trust risk to the public.

### D.3 — LOW (consistency): Review inspect panel has no "no source provided" / no-source cue

Unlike `sourceLink` (D-103B), the inspect panel simply omits the Source field when `source_url` is empty. An admin can't distinguish "no source" from a rendering gap. Cosmetic.

### D.4 — INFO: Evidence/Testability/Survivability shown as raw `/100` in inspect

The inspect panel shows scores as `N/100` with no D-100B qualifier. Acceptable on the admin surface (the admin understands the model); the public-facing qualifier is what mattered and is live.

### D.5 — INFO: Layout / ergonomics
Review cards use a responsive grid; the inspect panel collapses fields to one column at ≤600px; `.source`/`.ev-bad-source` use `word-break:break-all`; reused evidence groups/collapses at ≥4. No overflow or dense-queue readability issues found in CSS. ✅

### Good observations
- The card-row Approve 2-step + deliberate inspect Approve + 2-step Reject combination is sound — no accidental one-click publish.
- Truth-derived / category-echo / borderline-origin advisories still render and read correctly (advisory, not artefact).
- Admin token handling is clean (no leak).

---

## E. Evidence / Source Display Behavior in Review (summary)

| Element | Public Study path | Review inspect path |
|---|---|---|
| Source URL safety | ✅ `sourceLink`→`safeHttpUrl` (http/https only, else non-clickable text) | 🔴 **own raw anchor — unsanitised (D.1)** |
| Quality label | ✅ `vibes`→"weak argument" + tier class | 🟡 raw `vibes` (D.2) |
| No-source cue | ✅ "no source provided" | 🟡 field omitted (D.3) |
| Reused grouping | ✅ | n/a (inspect shows a single item's fields) |

---

## F. Existing Test Coverage

- **No test** covers `renderReviewInspectPanel`'s Source field rendering or scheme safety (confirmed — search for review/inspect source href returns nothing).
- D-104B Section 46 locks `sourceLink` safety, but only the public helper — not the inspect panel's inline anchor.
- D-96B Section 40 locks the Approve 2-step; D-93D/E Section 38 locks the advisory badges; D-95B Section 39 locks inspect scroll. Review *workflow* is well covered; Review *evidence-source rendering* is not.

---

## G. Recommended D-107B Patch

### G.1 — Safe frontend-only (RECOMMENDED — closes the XSS gap)
| ID | Change | Risk | Addresses |
|---|---|---|---|
| W-1 | **Route the Review inspect panel Source field through `sourceLink(item.source_url)`** (same helper the public path uses) instead of the inline `<a href="${esc(...)}">`. Non-http(s)/malformed → non-clickable "not a valid web address"; empty → "no source provided". | Low — reuse existing tested helper | **D.1 (HIGH)**, D.3 |
| W-2 | **Route the inspect Quality field through `evidenceQualityLabel(item.quality)`** (and optionally the tier class) so `vibes`→"weak argument" matches the public path. | Low — display text | D.2 |

**Smallest meaningful patch:** W-1 alone closes the admin-surface XSS gap by reusing the already-deployed, already-tested `sourceLink`. W-2 is a cheap consistency add-on.

### G.2 — Backend / admin route thought
| ID | Item | Note |
|---|---|---|
| BE-1 | Read-only D1 audit for legacy non-http(s) `source_url` rows (the D-104E deferred item) | More warranted now that D.1 shows an unsafe render path; remediation exact-ID via review, never bulk/migration |

### G.3 — Operational / manual only
| ID | Item |
|---|---|
| OPS-1 | `HUMANX_ADMIN_TOKEN` rotation (still deferred per current instruction) — unrelated to D-107B but the standing follow-up |

### G.4 — Do not build
| ID | Reason |
|---|---|
| DN-1 | Auto-clean/delete evidence with unsafe source URLs | No-hide policy; render safely instead (W-1) |
| DN-2 | Verification/"trusted source" badges in Review | Implies HumanX verifies sources |
| DN-3 | Removing the Source field from Review | Admins need to see it — just render it safely |
| DN-4 | Bulk D1 source_url rewrite/migration | Out of scope; exact-ID only if ever needed |

---

## H. Suggested Hardening Tests for D-107B

| # | Test |
|---|---|
| 1 | `renderReviewInspectPanel` Source field uses `sourceLink(` (no inline `<a href="${esc(item.source_url)}"`) — asserts W-1 |
| 2 | `renderReviewInspectPanel` contains no raw `href="${esc(item.source_url)}"` pattern (regression guard for the XSS gap) |
| 3 | Review inspect Quality uses `evidenceQualityLabel(` — asserts W-2 |
| 4 | `sourceLink`/`safeHttpUrl` still reject non-http(s) (existing D-104B locks remain) |
| 5 | Review Approve 2-step + advisory badges still present (D-96B/D-93D regression) |
| 6 | No "verified/trusted source" wording added in Review |
| 7 | No backend/D1/wrangler/deploy references added in the changed inspect rendering |

---

## I. Final D-107B Recommendation

**Implement G.1 W-1 (+ cheap W-2) as a small frontend-only patch, with hardening tests H.1–H.3 + H.6.**

Rationale:
- **D.1 is a real residual security gap on the admin surface** — the Review inspect panel renders evidence source URLs through its own unsanitised `href`, bypassing the D-104B `sourceLink` fix. A moderator clicking a legacy `javascript:` source link would execute it with the admin token. The fix is to reuse the already-deployed, already-tested `sourceLink` helper — minimal, low-risk, frontend-only, and it consolidates source rendering onto one safe path.
- W-2 folds the D-103B quality clarity into the Review surface for consistency (`vibes`→"weak argument").
- Pair with **BE-1** (read-only legacy `source_url` audit) as a follow-up to quantify exposure — the display fix (W-1) is the immediate mitigation regardless.
- Severity note: although framed as a "smoke review", **D.1 is a genuine XSS vulnerability** completing the D-104 source-safety story (the one render path it missed). Prioritise D-107B accordingly.

---

## J. No Mutation Confirmation

> No code changes were made during this audit.
> No production admin token was used. No approve/reject/keep/archive/duplicate/cleanup action was taken.
> No admin mutation route was called. No live-write test run. No token rotation.
> No Wrangler, D1, backend, or schema change. No exploit executed.

---

## K. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **362 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
