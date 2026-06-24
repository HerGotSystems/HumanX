# D-154A — Public Profile Product Audit

**Date:** 2026-06-24
**Scope:** Audit only. No code changes. No migration. No `wrangler.toml`. No owner-token work.

Audited against:
- `src/worker.js` — `/u/:slug` shell route + `/api/u/:slug` data route
- `public/app-v10.js` — `renderPublicProfile()`, `renderPublicProfileHtml()`, all helper functions
- `public/styles.css` — `.pp-*` classes
- `https://humanx.rinkimirikata.com/u/calenhir` (production, owner profile)

---

## 1. Current Behaviour — What the Profile Renders

### On load (`GET /u/:slug`)

The Worker intercepts `/u/<slug>` before static-asset fallback and returns `index.html` with injected OG/meta tags:

- `<title>` — `{displayName} on HumanX`
- `<meta name="robots" content="noindex">` — always, regardless of whether the slug resolves
- `<link rel="canonical">` — only for a resolved, public profile
- `og:title`, `og:description` (bio or generic fallback), `og:type: profile`, `og:url`
- `<meta name="twitter:card" content="summary">`

The frontend then boots and calls `GET /api/u/:slug`. If the slug resolves, `renderPublicProfileHtml()` renders:

1. **Header card** — display name, `/u/<slug>`, bio (if set), italic disclaimer
2. **Public Activity card** — badge counts for claims/truths/evidence/pressure
3. **Shared Belief Snapshot card** — only if owner chose to share one
4. **Recent Public Claims** — up to 10 rows with "Open Study →" button
5. **Recent Public Truths** — up to 10 rows (no action button)
6. **Recent Public Evidence** — up to 10 rows, title + quality label only (body/source_url withheld)
7. **Recent Public Pressure** — up to 10 rows, title + severity only (body withheld)
8. **Back button** — "← Back to Me" (owner) or "← Back to Home" (visitor)

---

## 2. Privacy / Public-Boundary Verdict

**No private or internal fields leak. The boundary is correctly implemented.**

| Field | API response | Frontend render |
|---|---|---|
| `is_admin` | Never selected from DB | Never rendered |
| `email` | Never in `SELECT` for `/api/u/:slug` | Never rendered |
| `trust_score`, `strike_count` | Not in `loadPublicProfileSummary` | Not rendered |
| `is_shadow_banned` | Not in `SELECT` | Not rendered |
| `profile_public` flag | Not in response | Not rendered |
| `HUMANX_ADMIN_TOKEN` | Never in any response | Never rendered |
| `owner_token` | Never in any response | Never rendered |
| `evidence.body` | Deliberately omitted (comment in code) | Not rendered |
| `evidence.source_url` | Deliberately omitted | Not rendered |
| `pressure_points.body` | Deliberately omitted | Not rendered |
| `user.id` (internal) | Included in `summary.userId` for internal use only; **never serialized into response** (confirmed by explicit comment at line 549 and audit of `return json(...)` block) | Never rendered |
| Non-public content | `review_state='public' AND archived_by_user=0` enforced on all 4 content queries | Never rendered |
| Shared belief snapshot | Only if `public_summary_enabled=1 AND hidden_at IS NULL`; only 7 summary-level fields (no raw answer payload, no full contradiction/alignment blobs) | Rendered with explicit disclaimer copy |

Verdict: **clean**. No field-level data leakage found.

---

## 3. Strengths

1. **Privacy by default.** Profile is off (`profile_public=0`) until the owner explicitly enables it. The Me settings panel leads with "Off by default. Nothing about your account is public until you turn this on."
2. **Consistent 404 treatment.** Missing slug, invalid slug, and private-but-existing slug all return `PROFILE_NOT_FOUND` — no signal distinguishes them.
3. **Evidence and pressure body withheld.** Only titles and metadata are shown publicly; the substantive content requires navigating into the claim's Study view.
4. **Belief snapshot is opt-in and summary-only.** The owner explicitly selects one snapshot to share; the raw answer data, contradiction text blobs, and full alignment arrays are never exposed.
5. **noindex unconditional.** The profile is share-link–only, not search-indexable.
6. **OG tags work.** Direct `/u/:slug` URL produces a meaningful share card with display name and bio as description.
7. **Owner recognises their own profile.** `isOwner` check in `renderPublicProfileHtml()` changes the back button to "← Back to Me" — a small but correct detail.

---

## 4. Friction Points

### F-1 (High): No HumanX explanation on the profile page

A visitor arriving via a share link sees "Public Profile", claim/truth/evidence/pressure counts, and a list of items — but nothing explains what HumanX is, what a "claim" means vs. a "truth," or why anyone is tracking "evidence" and "pressure." A first-time visitor has no anchor.

The only in-page text that gestures at this is the small italic disclaimer: "Public profile shows selected public HumanX activity only. It is not a truth ruling or personality diagnosis." This is a privacy hedge, not an introduction.

### F-2 (High): Terminology is jargon to outsiders

"Claims," "Truths," "Pressure Points," "Belief Snapshot" — these are meaningful inside HumanX but opaque to a profile visitor. A claim card rendered as raw text with a category badge and "Open Study →" button does not communicate what the person was doing or why it matters.

The Truth section is particularly confusing: "widely asserted · not auto-verified" appears inside the app but not on the public profile. A visitor sees a list of statement strings with no context about what a "Truth" is.

### F-3 (Medium): Counts-first layout buries the interesting content

The activity badge row (`Claims N / Truths N / Evidence N / Pressure N`) appears before any content. Counts are the least interesting thing on a public profile — they feel like a dashboard metric table, not a human profile. The snapshot (if shared) comes after the counts card, which buries the most distinctive and personal element.

### F-4 (Medium): "Open Study →" CTA orphans the visitor

Clicking "Open Study →" on a claim navigates the app into arena/study mode, which is the full HumanX interface. For a visitor who hasn't used HumanX, this is a cold-drop into an unfamiliar tool with no onboarding path. The profile provides no CTA toward "try HumanX yourself" or "understand what this claim study is."

### F-5 (Medium): Bio is optional and often blank

The bio is capped at 240 characters, which is fine, but it renders as a plain paragraph with no visual weight. When blank, it simply doesn't appear — leaving the header card as just a display name and slug path. For profiles without a bio, the header card is thin.

### F-6 (Low): Belief Snapshot disclaimers are verbose and repetitive

The snapshot card has two `pp-disclaimer` paragraphs back to back:
- "A snapshot this person chose to share — pattern observations from their own self-reported answers, not a diagnosis or personality test."
- "One snapshot, shared by choice — not their complete profile."

Both say essentially the same thing (self-reported, not a diagnosis, one snapshot by choice). One clear sentence would be stronger than two hedges.

### F-7 (Low): Evidence quality label uses internal enum values

Evidence rows show the quality label via `evidenceQualityLabel(e.quality)`. If this function returns the raw DB enum (`'testimony'`, `'peer_reviewed'`, etc.) unchanged for unrecognised values, a visitor sees internal terminology. Worth verifying the label mapping is complete.

### F-8 (Low): No share / copy-link affordance on the public profile itself

The owner's Me → Profile Settings has a "Copy share link" button. But the public-facing profile has no copy-link or share mechanism for a visitor. A visitor who wants to share the profile they just viewed has to copy the URL bar manually. Low friction, but a missed opportunity.

### F-9 (Low): Pressure "severity" label reads as internal

The pressure rows render `severity ${p.severity}` — a numeric integer with no label. A visitor sees "severity 3" and has no idea what scale this is on or what it means in context.

---

## 5. Mobile / Readability Verdict

**Acceptable, minor gaps.**

- The `@media (max-width:640px)` block reduces padding on `.pp-header`, `.pp-counts-card`, `.pp-section` and item rows. This is present and functional.
- `.pp-item-row` uses `flex-wrap:wrap` which handles overflow gracefully.
- `.pp-display-name` drops from 18px to 16px on mobile — fine.
- No horizontal overflow or fixed-width elements observed in the CSS.
- The claim item rows include three elements per row (text, category badge, "Open Study →" button) — these wrap on mobile, which is correct.

The profile should render acceptably on a 375px viewport. Not polished, but not broken.

---

## 6. Recommended D-154B Implementation Plan

Priority order, from highest impact to lowest:

### Must-do (F-1, F-2)

**Add a minimal HumanX context block to the public profile header.** One or two sentences explaining what HumanX is and what "claims / truths / evidence" means in this context. This should be rendered below the bio and above the counts card. The goal is that a first-time share-link visitor can understand the page within 10 seconds.

Example copy (final wording is owner's call):
> "HumanX is a tool for tracking belief drift, evidence quality, and epistemic pressure. Claims are testable assertions. Truths are widely-circulated statements, whether verified or not."

This does not require a backend change — the text is static and can live in `renderPublicProfileHtml()`.

### Should-do (F-3)

**Reorder the cards.** Move the snapshot (if present) above the counts card. The snapshot is the most personal and distinctive element. Counts are metadata. Suggested order:
1. Header (name, slug, bio)
2. Belief Snapshot (if shared)
3. Context block (what is HumanX)
4. Public Activity counts
5. Content sections (claims, truths, evidence, pressure)

### Should-do (F-6)

**Consolidate snapshot disclaimers.** Replace the two repetitive `pp-disclaimer` paragraphs with a single sentence. Example: "Self-reported snapshot, shared by choice — not a diagnosis."

### Nice-to-have (F-4, F-8)

**Add a "What is HumanX?" link or CTA** near the back button — pointing to the home page or a brief explainer. This converts the profile from a dead-end into a light funnel.

**Add a "Share this profile" copy-link** button visible to visitors (not just the owner).

### Low priority (F-7, F-9)

**Review `evidenceQualityLabel` for completeness** and confirm all DB values map to human-readable strings.

**Replace `severity ${N}` with a readable label** (e.g. "Low pressure" / "High pressure") or a 1–5 description.

---

## 7. No Owner-Token Work Resumed

This audit contains no owner-token enforcement changes, no soft warning design, and no work related to the D-149H hold. The D-149H passive sampling protocol remains in effect.

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1057 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged. No code, migration, or test changes were made in this audit.
