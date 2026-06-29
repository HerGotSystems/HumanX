# D-211A — Reflection Avatar Transparency

**Scope:** Frontend only
**Status:** SOURCE/STATIC COMPLETE — PENDING OWNER DEPLOY + LIVE SANITY
**Baseline:** 1933 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 warn pre-existing)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**Backend changes:** None
**Migration:** None
**Schema change:** None
**Public avatar:** None
**Public profile change:** None

---

## What was added

A native `<details>`/`<summary>` disclosure block inside the existing private `meReflectionAvatarHtml(data)` function. No new JS state, no new fetch, no new route.

The disclosure appears in both the populated card state and the empty state.

### Summary label

> How this is formed

### Body copy

- "This is based only on your private HumanX activity patterns."
- "It looks at investigation habits such as:"
  - Evidence added — *N*
  - Pressure checks — *N*
  - Tests created — *N*
- "It is not a score, rank, diagnosis, ideology, morality label, intelligence label, or truth rating."
- "It is private and is not shown on your public profile."

Counts shown are the raw `evidence.length`, `pressure.length`, and `home_tests.length` values already computed in the same function — no new data fetch.

---

## CSS added

Four new classes in `public/styles.css`, all scoped to the private card:

| Class | Purpose |
|---|---|
| `.me-avatar-why` | `<details>` container — top border, top padding |
| `.me-avatar-why-summary` | Collapsed/expanded indicator via CSS `::before` content |
| `.me-avatar-why-body` | Body wrapper — top margin |
| `.me-avatar-why-list` | Bullet list of source signals |

---

## Privacy confirmation

- `me-avatar-why` and the transparency copy exist only inside `meReflectionAvatarHtml`
- `renderPublicProfileHtml` does not call `meReflectionAvatarHtml`
- No transparency copy leaks into the public profile render path
- No new public API fields
- No backend or worker change

---

## What the transparency disclosure is not

The purpose is honest self-explanation, not gamification or user labelling.

The disclosure does not:
- Name the user as a type ("Seeker", "Warrior", "Skeptic", "Rational", etc.)
- Assign a score, rank, or level
- Use ideology, religion, or political framing
- Compare the user to others
- Imply correctness, virtue, or truth

Forbidden wording remains absent: truth level, purity, ideology type, religious alignment, smart score, HumanX rank, good believer, bad believer.

---

## Smoke tests added

19 new D-211A tests covering:

- Disclosure element presence inside `meReflectionAvatarHtml`
- "How this is formed" summary label
- Required explanation copy (private activity source, source signals listed, non-ranking disclaimer, private/not-public confirmation)
- Empty state also has transparency
- `renderPublicProfileHtml` does not include disclosure copy
- No banned wording in disclosure
- Four CSS classes present
- No migration file added
- D-211A comment present in `app-v10.js`

One pre-existing D-139B test ("forbidden wording absent from Mirror panel") was updated to strip the new transparency disclaimer text before scanning — the disclaimer's use of "diagnosis" is an approved exclusion sentence, not a misuse. Used `replaceAll` to cover both the populated and empty state copies.

---

## Deploy required

`public/app-v10.js` and `public/styles.css` changed. Owner must run `npx wrangler deploy` from local terminal. No migration required.

### Live sanity checklist

| Check | Expected | Actual |
|---|---|---|
| "How this is formed" disclosure visible in Reflection avatar card | Present, collapsed by default | — |
| Disclosure expands on click to show source signal counts | Expands correctly | — |
| Counts shown match user's actual evidence/pressure/test counts | Correct | — |
| Non-ranking disclaimer visible in body | Present | — |
| Private-and-not-public copy visible in body | Present | — |
| Disclosure absent from public profile | Absent | — |
| No forbidden wording on public profile | All absent | — |
