# D-163B — Submit Claim First-Time Clarity Layer

**Date:** 2026-06-24
**Scope:** Frontend only — `public/app-v10.js`, `public/styles.css`. No backend, no migration, no wrangler.toml, no owner-token work.

---

## What Changed

### 1. Builder-intro subtitle below "Claim Builder" heading (`renderBuilderStep1`)

Added immediately below `<h2>Claim Builder</h2>`:

> "Anyone can submit a claim pseudonymously. HumanX turns it into a testable public study after review."

CSS class `.builder-intro`: muted colour, `line-height: 1.45`, 6px bottom margin.

This closes the confusion caused by the homepage "invite-only preview" badge — submission is pseudonymously open to all visitors, and this is now explicit.

### 2. Step 1 footer note extended to mention review (`renderBuilderStep1`)

Changed footer note from:

> "Nothing is sent until Step 3."

To:

> "Start with one clear sentence. You'll add context next, and the claim will be reviewed before it appears publicly."

Users who read Step 1 now know the review step exists before they reach Step 3.

### 3. Truth-vs-Claim inline note in Step 2 truth route (`renderBuilderStep2`)

Added below the "looks like a Truth" paragraph, before the "Save as Truth for Review" button:

> "Truths are stronger conclusions. Claims are ideas still being tested. If unsure, submit as a claim."

CSS class `.builder-truth-vs-claim`: muted, italic, `line-height: 1.4`, 4px top / 8px bottom margin.

This explains the Truth/Claim routing decision at the exact point where it is made.

### 4. Review timeline note in success state (`submitBuilderClaim` + `saveClaim`)

Added to the existing moderation queue sentence:

> "…It will appear publicly after an admin approves it. Usually within a few days."

Applied to both success paths (`submitBuilderClaim` builder flow and `saveClaim` legacy path) for consistency.

### 5. CSS additions (`styles.css`)

```css
.builder-intro         { margin:0 0 6px; color:var(--muted); line-height:1.45 }
.builder-truth-vs-claim{ color:var(--muted); font-style:italic; margin:4px 0 8px; line-height:1.4 }
```

---

## Why It Reduces Invite/Access Confusion

Before D-163B, a visitor who saw the "invite-only preview" home badge and then clicked "Submit Claim" had no copy telling them they could submit without an invite. The builder opened directly to a form with no access signal. Many visitors would assume submission required account verification.

After D-163B, the first line below "Claim Builder" says: "Anyone can submit a claim pseudonymously." — the invite confusion is resolved at the entry point of the flow.

---

## Review-State Confirmation

`createClaim()` in `worker.js` still inserts `review_state = 'review'` on every new claim. This is unchanged. No submitted claim ever appears publicly without admin approval. The new "Usually within a few days" copy is an honest time-expectation note, not a guarantee, and does not affect the review gate.

---

## Privacy / Public Boundary Confirmation

- No backend changes of any kind
- `POST /api/claims` still requires `requireUser` (pseudonymous identity) — no weakening
- `createClaim()` still rate-limits (8/hr/IP) — unchanged
- No invite-required gate added or removed
- No `email`, `is_admin`, `owner_token`, or `invite_code` field is touched anywhere in the builder or success state
- Builder context (raw thought, why, scope, falsifier) continues to be stored as internal initial evidence — not rendered on public pages

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1198 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

11 new smoke tests added in Section 96.

---

## Recommended Next Step

D-163C: Bump, deploy, and owner-terminal preflight live verify. Expected:

```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-163B <commit> 1198/24/57
```

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
