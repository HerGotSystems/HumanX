# D-216A — Public Profile Allowlist Contract

**Scope:** Tests + docs only
**Status:** COMPLETE
**Baseline:** 2157 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 warn pre-existing)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Backend changes:** None
**Migration:** None
**Schema change:** None
**Public profile change:** None
**Deploy needed:** No

---

## Purpose

D-214A and D-215A established denylist locks — what must never appear on the public profile. D-216A adds the complementary positive contract: what IS intentionally allowed on the public profile, and a structural assertion that the allowed surface hasn't silently changed.

A denylist alone can pass while the public surface erodes in the other direction (previously-required public fields silently removed, or new private data silently added). The allowlist catches both.

---

## Why allowlist + denylist together

| Denylist only | Allowlist + denylist |
|---|---|
| Passes even if public profile becomes empty | Catches missing required public content |
| Passes even if previously-public fields are quietly removed | Requires explicit update when public surface changes |
| Does not document what is intentionally public | Makes the contract self-documenting |
| Future contributor cannot tell what belongs on the public profile | Named constants `PUBLIC_PROFILE_ALLOWED_MARKERS` and `PUBLIC_PROFILE_PRIVATE_DENYLIST` are readable |

---

## Current allowed public surface

### CSS classes (present on all public profile renders)

| Class | Purpose |
|---|---|
| `pp-card` | Card container |
| `pp-header` | Profile header (name, slug, bio) |
| `pp-snapshot-card` | Shared belief snapshot block |
| `pp-context-block` | Vocabulary/context explanation block |
| `pp-counts-card` | Public activity counts |
| `pp-section` | Claims/truths/evidence/pressure sections |
| `pp-item-list` | Item list container |
| `pp-item-row` | Single item row |
| `pp-disclaimer` | Disclaimers (not a diagnosis, not a score) |
| `pp-display-name` | Public display name |
| `pp-slug` | Public handle (/u/slug) |
| `pp-counts-note` | Counts note |
| `pp-footer-actions` | Navigation buttons |
| `section-head` | Section heading |

### Intentional public heading copy

| Copy | Location |
|---|---|
| "Public Profile" | h2 heading |
| "Shared Belief Snapshot" | h3 in snapshot block (if user enabled) |
| "Claims being tested" | h3 section header |
| "Public Activity" | h3 counts card |
| "Back to Home" | Navigation button |
| "Browse all claims" | Navigation button |

### API response shape (`getPublicProfile`)

| Field | Notes |
|---|---|
| `slug` | Public handle |
| `displayName` | Display name |
| `bio` | Public bio |
| `counts` | Aggregated public activity counts |
| `recentClaims` | Up to 10 public non-archived claims (id, claim, category, type, status, evidence_score, survivability, testability) |
| `recentTruths` | Up to 10 public non-archived truths (id, statement, category, confidence_label) |
| `recentEvidence` | Up to 10 public non-archived evidence items (id, title, stance, quality, source_type, media_type) — body and source_url excluded |
| `recentPressure` | Up to 10 public non-archived pressure points (id, title, severity) — body excluded |
| `sharedSnapshot` | Single public-enabled snapshot, shaped by `buildPublicSharedSnapshot()` only |

### Snapshot scores

If the user has opted in via `visibility_json.scores`, the public snapshot block may show stability/openness/pressure scores via `renderPublicProfileSnapshotHtml`. This is intentional and gated.

---

## What remains private (never in public profile response)

| Field | Reason |
|---|---|
| `top_beliefs_json` | Raw belief payload — permanently private |
| `dominant_pattern` | Identity label — permanently private |
| `alignment_labels` | Identity label — permanently private |
| `reflection_avatar` | Private device-local concept |
| `avatar_hidden` | Device-local localStorage preference |
| `home_tests` | Private test activity |
| Full evidence `body`/`source_url` | v1 deliberate omission |
| Full pressure `body` | v1 deliberate omission |
| Raw `belief_snapshots` array | Never; single gated snapshot only |

---

## Deny-by-default rule

**Any new public profile field must be explicitly named in docs and tests before merge.**

The test block defines two named constants readable by future contributors:

```js
const PUBLIC_PROFILE_ALLOWED_MARKERS = [ ... ];  // What IS on the public profile
const PUBLIC_PROFILE_PRIVATE_DENYLIST = [ ... ];  // What MUST NOT appear
```

Adding a new field to the public profile API or render path without updating `PUBLIC_PROFILE_ALLOWED_MARKERS` will not automatically cause a test failure — but the review checklist is:

1. Add the new field to the denylist tests in D-215A/D-216A (removing it from denylist if it moves to public)
2. Add it to `PUBLIC_PROFILE_ALLOWED_MARKERS` with a test confirming it is present
3. Document it in this file under "Current allowed public surface"
4. Get explicit owner sign-off

---

## Test structure

### 1. Public render function contract (6 tests)
- `renderPublicProfileHtml` exists
- `renderPublicProfileSnapshotHtml` exists
- `renderPublicProfileHtml` calls snapshot, claims, evidence, pressure helpers

### 2. Positive allowlist — markers that MUST be present (19 tests)
One test per `PUBLIC_PROFILE_ALLOWED_MARKERS` entry; each asserts the marker exists in the public render path.

### 3. Negative denylist — private markers absent from content helpers (22 tests)
One test per `PUBLIC_PROFILE_PRIVATE_DENYLIST` entry; each asserts the marker is absent from `renderPublicProfileClaimsHtml` / `renderPublicProfileTruthsHtml` / `renderPublicProfileEvidenceHtml` / `renderPublicProfilePressureHtml` / `renderPublicProfileSnapshotHtml`.

Note: `renderPublicProfileHtml` (the orchestrator) legitimately reads `meData` for the `isOwner` check — this is a read-only access and is excluded from the content helper denylist.

### 4. Private helper exclusion from orchestrator (11 tests)
`renderPublicProfileHtml` must not call private render helpers or access device-local state.

### 5. Backend API response shape (10 tests)
- `top_beliefs_json`, `dominant_pattern`, `reflection_avatar`, `avatar_hidden`, `alignment_labels` absent from `getPublicProfile`
- `slug`, `displayName`, `sharedSnapshot` present
- `buildPublicSharedSnapshot()` is the gating function
- `home_tests` and raw `belief_snapshots` array not returned

### 6. Deploy integrity (3 tests)
- D-216A comment absent from `app-v10.js`
- D-216A absent from `worker.js`
- No migration file added

**Total new tests: 79**

---

## Test results

**Hardening smoke after D-216A:** 2157 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 warn (pre-existing, non-blocking)

---

## Confirmations

- **Deploy needed:** No — tests and docs only
- **App UI unchanged:** Confirmed
- **CSS unchanged:** Confirmed
- **Worker unchanged:** Confirmed
- **Public profile allowlist contract added:** Confirmed — 79 new D-216A tests
- **Private My HumanX helpers/state remain excluded:** Confirmed by denylist and orchestrator tests
- **No public avatar/private preference exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
