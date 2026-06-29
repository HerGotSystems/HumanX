# D-214A — Reflection Avatar Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE
**Baseline:** 2035 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 warn pre-existing)
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

Strengthen the permanent regression fence around the private Reflection Avatar so that future work — refactors, new features, copy changes, performance work — cannot accidentally:

- Push the Reflection Avatar onto the public profile
- Turn it into a score, rank, diagnosis, ideology/morality label, or identity type
- Add backend storage or API routes for avatar state
- Add new data fetches beyond existing private `/api/my-humanx` payload
- Remove accessibility guarantees (keyboard, focus-visible, native disclosure)

These tests supplement the existing D-210B, D-211A, D-212A, and D-213A test blocks. Together they form a complete lock.

---

## What is locked

### 1. Private render boundary

All avatar feature markers must remain inside `meReflectionAvatarHtml` (private My HumanX path):

| Marker | Status |
|---|---|
| `meReflectionAvatarHtml` function defined | LOCKED |
| Called from `renderMeHtml` (private path) | LOCKED |
| `me-avatar-card` class | LOCKED — in avatar slice only |
| `me-avatar-why` class | LOCKED — in avatar slice only |
| `me-avatar-hidden` class | LOCKED — in avatar slice only |
| `humanx.me.reflectionAvatar.hidden` key | LOCKED — in avatar scope only |
| "Reflection avatar hidden on this device." copy | LOCKED — in avatar slice only |
| "This only changes your private My HumanX view." | LOCKED — in avatar slice only |
| "Hide this" | LOCKED — in avatar slice only |
| "Show again" | LOCKED — in avatar slice only |

### 2. Public profile exclusion (10 locked markers)

`renderPublicProfileHtml` must not contain any of the above. Every marker is individually asserted absent from the public render slice.

### 3. Backend/API exclusion (5 checks)

`src/worker.js` must not contain:

- `reflection_avatar` or `reflectionAvatar` (storage)
- `avatar-hidden` or `avatar_hidden` (API route)
- `reflectionAvatar.hidden` (localStorage key)
- `me-avatar` class markers
- `public_avatar` or `publicAvatar` (public field)

### 4. Data minimization (5 checks)

Avatar reads only existing fields from the private `/api/my-humanx` payload:

- `data.evidence`
- `data.pressure`
- `data.home_tests`

The function must not:
- Call `api()` or `fetch()` internally
- Access new fields (`alignment`, `ideology`, `avatar_score`, `avatar_rank`, `avatar_hidden`, `avatar_setting`)

### 5. Copy guardrails (17 checks)

**Forbidden wording — must not appear in `app-v10.js`:**

- truth level
- purity
- ideology type
- religious alignment
- smart score
- HumanX rank
- good believer
- bad believer

**Forbidden identity/personality chip labels — must not appear in `chips.push(...)` calls:**

- Seeker, Warrior, Truth teller, Skeptic, Believer, Rational, Pure, Good, Bad

*Exception:* Docs may mention these terms in guardrail/checklist sections. Only the app UI is tested.

### 6. Accessibility lock (6 checks)

- All `<button>` elements in avatar function have `type="button"`
- Disclosure uses native `<details>` and `<summary>`
- `.me-avatar-hide-btn:focus-visible` CSS defined
- `.me-avatar-why-summary:focus-visible` CSS defined
- No custom JS disclosure toggle inside avatar function

### 7. Deploy lock (3 checks)

- `D-214A:` comment absent from `public/app-v10.js` (confirms app UI untouched)
- No migration file added for this task
- No schema reference (`me.reflectionAvatar`) in `worker.js`

---

## Future rule

**Any future Reflection Avatar change must:**

1. Keep the feature private by default (called from `renderMeHtml` only, not `renderPublicProfileHtml`)
2. Not add backend storage, DB columns, or API routes for avatar state without a separate explicit public opt-in spec written and approved first
3. Not introduce identity/personality/morality/ideology/score/rank labels as chip text
4. Keep all `<button>` elements with `type="button"` and native `<details>` disclosure
5. Re-run D-214A regression lock tests (they will catch boundary drift automatically)

If a future task intentionally exposes the Reflection Avatar on the public profile, that task must:
- Write a new spec documenting the deliberate change
- Get explicit owner approval
- Update these regression tests to reflect the new intentional boundary

---

## Test results

| Block | New tests | Total added in D-214A |
|---|---|---|
| Private render boundary | 10 | — |
| Public profile exclusion | 9 | — |
| Backend/API exclusion | 5 | — |
| Data minimization | 5 | — |
| Copy guardrails — forbidden wording | 8 | — |
| Copy guardrails — identity chips | 9 | — |
| Accessibility lock | 6 | — |
| Deploy lock | 3 | — |
| **Total** | **55** | 55 |

**Hardening smoke after D-214A:** 2035 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 warn (pre-existing, non-blocking)

---

## Confirmations

- **Deploy needed:** No — tests and docs only; `public/app-v10.js` and `public/styles.css` unchanged
- **App UI changes:** None
- **CSS changes:** None
- **Private-only:** Confirmed by 10 private boundary tests + 9 public exclusion tests
- **No public avatar/profile exposure:** Confirmed
- **No backend/API/migration/schema changes:** Confirmed by 5 backend exclusion tests + 3 deploy lock tests
- **Data minimization:** Confirmed — avatar still uses only `evidence`, `pressure`, `home_tests` from existing private payload
- **Copy guardrails clean:** Confirmed — 17 copy guardrail tests pass
- **Accessibility guarantees maintained:** Confirmed — 6 accessibility lock tests pass
