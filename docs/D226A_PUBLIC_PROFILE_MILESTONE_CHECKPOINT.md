# D-226A — Public Profile Milestone Checkpoint

**Scope:** Docs only
**Status:** COMPLETE
**Baseline:** 2290 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/D226A_PUBLIC_PROFILE_MILESTONE_CHECKPOINT.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** No

---

## Purpose

Record the authoritative project state after completing the D-220 → D-225 public profile polish arc. This checkpoint updates `docs/PROJECT_STATE.md` as the living project reference and adds this document as a permanent milestone marker.

---

## D-220 → D-225 arc summary

The arc delivered six sequential improvements to the public profile page, all within the D-216A allowlist contract:

| Task | What changed | Live? |
|---|---|---|
| D-220A/B | Counts card moved to top; context block collapsed to native `<details>`; `pp-item-actions` wrapper on claim action buttons; truths empty state always renders | PASS |
| D-221A/B | Focus-visible ring on `.pp-item-actions .btn-mini`; mobile `min-height:44px` on claim action buttons | PASS |
| D-222A/B | `pp-copy-link` button in header for all visitors; `copyPublicProfileLink` now uses `window.location.href`; "Link copied" success; "Copy failed — use browser address bar" failure | PASS |
| D-223A/B | `<nav aria-label="Public profile sections">` with four HTML anchor links; `id` attributes on all four section targets; pure HTML anchors, no JS | PASS |
| D-224A/B | `pp-empty-card` class on snapshot/claims/truths empty states; snapshot always emits `id="public-snapshot"`; Snapshot nav link now unconditional | PASS |
| D-225A | Cross-arc regression lock — 13 composite tests covering page structure order, all CSS classes, copy-link contract, section nav, empty states, allowlist, privacy boundary, accessibility, deploy integrity | No deploy needed |

**Total arc tests added:** 91 (12 + 12 + 16 + 20 + 18 + 13).
**Total hardening smoke after arc:** 2290 passed / 0 failed.
**Owner deploys in arc:** 5 (D-220B, D-221B, D-222B, D-223B, D-224B).

---

## Current public profile behavior

Visitor experience on any public profile (`/u/:slug`):

1. **Profile header** — display name, slug, bio (if set), "Copy profile link" button
2. **Public Activity** (counts card) — Claims / Truths / Evidence / Pressure badge row
3. **Section nav** — Snapshot · Claims · Truths · About anchor links (all always present)
4. **Snapshot** — real card if shared; "No public snapshot shared yet." + note if not
5. **Claims** — list if any; "No public claims yet." if empty
6. **Truths** — list if any; "No public truths on this profile yet." if empty
7. **Evidence / Pressure** — collapsed sections when present; hidden when empty
8. **About** — native `<details>` disclosure; "About this profile page"

---

## Baseline (as of D-226A)

| Script | Expected |
|---|---|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2290 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (1 known warn)` |

**Known warn:** `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment state

All five arc features were deployed by owner from terminal and confirmed live via browser sanity. D-225A (regression lock) and D-226A (this checkpoint) are docs/tests only — no deploy needed. Current deploy needed: **No**.

---

## Privacy guarantees

- **No new public data fields** — zero new API fields introduced in D-220→D-225
- **No private My HumanX exposure** — private helpers (`renderMeHtml`, `meReflectionAvatarHtml`, etc.) excluded from all public render functions
- **No Reflection Avatar / public avatar exposure** — avatar remains private-only (D-214A)
- **No localStorage in public render path** — confirmed by D-225A composite test
- **No forbidden wording** — truth level / purity / ideology type / religious alignment / smart score / HumanX rank / good believer / bad believer all absent from public render slice
- **D-214A / D-215A / D-216A / D-225A regression locks active** — 2290 / 0 passed

---

## Future rule

Any subsequent change to the public profile must:

1. Confirm `node scripts/hardening-smoke-test.mjs` passes with 0 failures before commit
2. If D-225A lock tests fail, update the lock explicitly with owner approval and a `D-225A/D-NNN` annotation on the changed test(s)
3. Any new public class, copy, or anchor ID must be added to `PUBLIC_PROFILE_ALLOWED_MARKERS` with a comment
4. Any new live feature requires owner deploy + browser sanity before marking live PASS (D-xxxB)

---

## Suggested next lanes

These are suggestions only — do not start without explicit assignment:

- **Review / moderation ergonomics** — queue scanability, bulk actions, duplicate resolution UX
- **Claim / RunPack flow clarity** — Investigation Packet workflow, AI-return parsing, stale detection
- **My HumanX private dashboard usability** — filter ergonomics, activity counts, account card clarity
- **Public profile microcopy polish** — small copy improvements within existing `PUBLIC_PROFILE_ALLOWED_MARKERS`
- **Search / navigation cleanup** — cross-workspace nav, back-button context, mode-aware sidebar
