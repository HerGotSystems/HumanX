# D-217A — Hardening Smoke Index

**Scope:** Tests + docs only
**Status:** COMPLETE
**Baseline:** 2177 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 warn pre-existing)
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

`hardening-smoke-test.mjs` has grown to 2177 tests across many D-blocks. Without an index, a future contributor editing the file cannot quickly find:

- Which guard family covers a specific concern
- Where the privacy boundary lock tests live
- Which D-block comment to search for
- The rules for adding new tests safely

D-217A adds a structured comment index near the top of the file and a small set of maintainability tests that verify the index and key locks are still present.

---

## Why the index exists

The file is large and long-lived. The index serves three roles:

1. **Navigation** — named sections with D-block anchors let contributors `Ctrl+F` directly to a guard family
2. **Documentation** — the starred locks (★) are visually distinct so reviewers notice if they are being changed
3. **Rules** — the "Rules for future slices" section at the bottom of the index tells a fresh contributor exactly what to do when adding tests

---

## Major smoke-test guard families

| Family | D-block anchor | Notes |
|---|---|---|
| Baseline / allowlist | D-139B | README `N passed, 0 failed` allowlist |
| Worker route checks | separate file | `worker-route-static-check.mjs` — 57 checks / 1 pre-existing warn |
| Belief Engine checks | separate file | `belief-engine-static-check.mjs` — 24 checks |
| My HumanX private surface | D-155, D-171B | Private dashboard basics |
| Reflection Avatar concept card | D-210B | Private-only; guardrail + private notice |
| Reflection Avatar transparency | D-211A | "How this is formed" disclosure |
| Reflection Avatar hide/show | D-212A | localStorage-only; device-local |
| Reflection Avatar accessibility | D-213A | type=button, focus-visible, 32px touch |
| **★ Reflection Avatar regression lock** | **D-214A** | **Private boundary; forbidden chip labels; backend exclusion** |
| **★ My HumanX privacy boundary lock** | **D-215A** | **renderMeHtml vs renderPublicProfileHtml separation** |
| **★ Public Profile allowlist contract** | **D-216A** | **Positive + negative contract; deny-by-default rule** |
| Deploy integrity checks | D-212A–D-217A | Each task verifies it didn't touch app/CSS/worker |

---

## Current baseline

**2177 passed / 0 failed** (as of D-217A)
Worker route static: 57 passed / 0 failed / 1 warn (pre-existing, non-blocking)
Belief engine static: 24 passed / 0 failed

---

## How future slices should add tests

1. **Add a named block** with a `// ── D-NNN: description ───` comment header above the `{` block
2. **Reference the D-block** in the index at the top of the file (update the relevant family row or add a new row)
3. **Update the baseline** — change the count in the D-139B allowlist (`readmeSrc.includes('N passed, 0 failed')`) and update `docs/README.md`
4. **Include a deploy integrity test** for tests-only tasks confirming the relevant files were not modified

---

## Rule: do not loosen D-214/D-215/D-216 without explicit owner approval

The three starred privacy locks are the core fence:

| Lock | What it protects |
|---|---|
| D-214A | Reflection Avatar stays private; no identity/score labels; no backend storage |
| D-215A | My HumanX private render helpers never leak into public profile render path |
| D-216A | Public profile has a positive allowlist; deny-by-default for new fields |

**Removing, loosening, or commenting-out these tests requires:**
1. A new spec document explaining the intentional boundary change
2. Explicit owner approval
3. Updated README documenting the new rule

A PR that silently removes or weakens these tests without the above is a regression, not a refactor.

---

## Maintainability tests added (D-217A)

20 new tests:
- Index block present in smoke file
- Index names D-214A regression lock
- Index names D-215A privacy boundary lock
- Index names D-216A allowlist contract
- Index names deploy integrity checks
- Index includes rules for future slices
- Index rule mentions owner approval for loosening D-214/215/216
- Baseline allowlist includes 2157
- Index baseline count documented
- D-214A / D-215A / D-216A key tests still present (3 checks)
- D-214A forbidden wording check still present
- README references D-214A, D-215A, D-216A docs (3 checks)
- Deploy integrity: D-217A absent from app-v10.js, styles.css, worker.js, migrations (4 checks)

---

## Confirmations

- **Deploy needed:** No — tests and docs only
- **App UI unchanged:** Confirmed
- **CSS unchanged:** Confirmed
- **Worker unchanged:** Confirmed
- **D-214A / D-215A / D-216A privacy locks still active:** Confirmed by maintainability tests
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
