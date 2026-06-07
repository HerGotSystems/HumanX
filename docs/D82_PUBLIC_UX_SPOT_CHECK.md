# D-82: Public UX Spot Check — Launch Seed Pack

Date: 2026-06-07
Step: D-82 — read-only public UX verification of all 5 launch seed claims
Type: Read-only. Docs-only commit to main.
No moderation actions. No POST calls. No D1. No Wrangler. No route writes.

---

## 1. Purpose

D-82 confirms that the five D-76D approved launch seed claims are correctly visible and
navigable in the public HumanX UI at `https://humanx.rinkimirikata.com`, following:

- D-80C–G: individual claim and evidence promotions to `review_state = 'public'`
- D-81: final launch seed pack verification checkpoint
- D-83A–E: scoring/status consistency audit, status lock implementation, and production A1 lock

This step verifies the public-facing UX state: claim visibility, evidence attachment,
pressure/contradiction display, and the A1 "Strongly Supported" status lock as seen by
a non-authenticated visitor.

---

## 2. Non-Mutation Statement

D-82 made no moderation decisions.
D-82 called no write routes.
D-82 called no POST endpoints.
D-82 made no D1 direct commands.
D-82 ran no Wrangler.
D-82 did not change any `review_state`, `status`, `status_locked`, or any other field.
No DB row was modified during D-82.
All temp API response files were deleted after reading.

---

## 3. Verification Methods and Endpoints Used

| Endpoint | Type | Purpose |
|----------|------|---------|
| `GET /api/claims?limit=50` | Public, no auth | Confirm all 5 seed claims in public feed with status |
| `GET /api/claims/<id>` × 5 | Public, no auth | Confirm evidence count, pressure count, detail structure, claim text |

All calls made with `--ssl-no-revoke` (Windows schannel TLS workaround documented in
PROJECT_STATE Known Limitations). No browser session required for API-level verification.

---

## 4. Claim Visibility Table

All 5 seed claims confirmed in public feed via `GET /api/claims?limit=50`.
Total public claims in feed: **27** (5 seed + 22 pre-existing user-submitted).

| seed_id | DB id | Claim text (abbreviated) | Visible | Status shown | statusLocked |
|---------|-------|--------------------------|---------|-------------|--------------|
| launch-B5 | `clm_seed_8e095b6f6d30` | The Holocaust resulted in the murder of approximately six million Jews | ✅ | Strongly Supported | false |
| launch-A1 | `clm_seed_55e17c22e13e` | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism | ✅ | **Strongly Supported** | **true** |
| launch-A4 | `clm_seed_c4e0335e7aae` | Rising CO2 levels from human activity are the primary driver of observed global warming | ✅ | Strongly Supported | false |
| launch-C1 | `clm_seed_8ad9ff121579` | Online platform recommendation systems can use engagement signals that influence which information spreads widely | ✅ | Plausible | false |
| launch-D2 | `clm_seed_7fb1c24747c2` | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy | ✅ | Strongly Supported | false |

**Full claim texts confirmed exact character-for-character match** against D-76D approved texts.

**Status assessment:**

| seed_id | Status shown | Expected range | Assessment |
|---------|-------------|----------------|------------|
| launch-B5 | Strongly Supported | Strongly Supported or Proven | ✅ Acceptable — computed from 2 `documented`-tier evidence items (avg=68); one band below Proven, defensible for a historical documentation claim |
| launch-A1 | Strongly Supported | **Strongly Supported required** | ✅ **Correct — editorially locked** |
| launch-A4 | Strongly Supported | Strongly Supported or Proven | ✅ Acceptable — computed from 2 `documented`-tier evidence items (avg=68); one band below Proven, defensible for climate science |
| launch-C1 | Plausible | **Plausible required** | ✅ Correct |
| launch-D2 | Strongly Supported | Strongly Supported or Proven | ✅ Acceptable — computed from `repeatable` + `documented` evidence (avg=77); Proven gates require avg≥80 AND surv≥75; surv=88 clears the survivability gate but avg=77 does not reach 80 |

---

## 5. Claim Detail Table

All 5 claim detail pages return valid JSON with no `error` field.
Response shape confirmed: `{ claim, evidence, pressure, tests, analyses, lineage }`.

| seed_id | Page returns | Evidence count | Evidence public | Pressure count | Contradictions field |
|---------|-------------|----------------|----------------|----------------|---------------------|
| launch-B5 | ✅ OK | 2 / 2 expected | ✅ both public | 1 | 1 ✅ |
| launch-A1 | ✅ OK | 2 / 2 expected | ✅ both public | 1 | 1 ✅ |
| launch-A4 | ✅ OK | 2 / 2 expected | ✅ both public | 1 | 1 ✅ |
| launch-C1 | ✅ OK | 2 / 2 expected | ✅ both public | 1 | 1 ✅ |
| launch-D2 | ✅ OK | 2 / 2 expected | ✅ both public | 0 | 0 ✅ |

**Evidence items confirmed:**

| seed_id | Evidence 1 | Evidence 2 |
|---------|-----------|-----------|
| launch-B5 | `evd_4dadaaf88e1a42` — Wannsee Protocol (public) | `evd_acb865805d4a4a` — How Many People did the Nazis Murder? (public) |
| launch-A1 | `evd_d685a866788942` — Vaccines for measles, mumps and rubella in children (public) | `evd_450723b824024c` — A population-based study of measles, mumps, and rubella vaccination and autism (public) |
| launch-A4 | `evd_a7f3bd8a91204c` — Climate Change 2021: The Physical Science Basis — Summary for Policymakers (public) | `evd_573465cd124545` — The Causes of Climate Change (public) |
| launch-C1 | `evd_76673741550c44` — The spread of true and false news online (public) | `evd_904fd94e08554c` — On YouTube's recommendation system (public) |
| launch-D2 | `evd_ac0a748135aa4e` — The Cumulative Cost of Additional Wakefulness (public) | `evd_8651fab094cc48` — About Sleep (public) |

**Pressure items confirmed:**

| seed_id | Pressure title | ID |
|---------|---------------|-----|
| launch-B5 | Antisemitism: An Introduction | `prs_21a295bef11446` |
| launch-A1 | Wakefield's article linking MMR vaccine and autism was fraudulent | `prs_1ee5c84707ea49` |
| launch-A4 | Climate Change 2021: The Physical Science Basis — Summary for Policymakers (Attribution section) | `prs_fabab9d97e6643` |
| launch-C1 | On YouTube's recommendation system (responsibility framing) | `prs_9aff1fc32d5048` |
| launch-D2 | (none — no seed pressure for D2) | — |

---

## 6. A1 Status Lock UX Check

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Public feed `status` | `"Strongly Supported"` | `"Strongly Supported"` | ✅ |
| Public feed `statusLocked` | `true` | `true` | ✅ |
| Detail endpoint `status` | `"Strongly Supported"` | `"Strongly Supported"` | ✅ |
| Detail endpoint `statusLocked` | `true` | `true` | ✅ |
| A1 status is NOT "Proven" | Required | Confirmed — `"Strongly Supported"` | ✅ |
| `evidenceScore` unchanged by lock | 85 (computed) | 85 | ✅ |
| `survivability` unchanged by lock | 87 (computed) | 87 | ✅ |
| `contradictions` unchanged by lock | 1 | 1 | ✅ |

The D-83C lock guard is working as intended: computed fields are live, editorial status label
is preserved.

**What the frontend displays:** The `mapClaim` function in `src/worker.js` exposes
`statusLocked: true` in the API response. The current frontend (`public/app-v10.js`)
renders the `status` field as the displayed label. `statusLocked` is available in the
response payload for any future lock indicator UI but is not currently displayed as a
separate badge or icon in the public claims feed or claim detail view. This is expected —
the D-83C implementation spec noted this as a future optional enhancement.

---

## 7. Scoring Summary for Reference

Final computed values for all 5 seed claims, confirmed via `GET /api/claims/<id>`:

| seed_id | evidenceScore | survivability | contradictions | status |
|---------|---------------|---------------|----------------|--------|
| launch-B5 | 68 | 70 | 1 | Strongly Supported |
| launch-A1 | 85 | 87 | 1 | Strongly Supported (locked) |
| launch-A4 | 68 | 70 | 1 | Strongly Supported |
| launch-C1 | 55 | 57 | 1 | Plausible |
| launch-D2 | 77 | 88 | 0 | Strongly Supported |

---

## 8. Mobile / Narrow Viewport Notes

Full browser-rendered narrow viewport testing was not performed in this session (no browser
automation available in the current environment). The public frontend (`public/app-v10.js`
and `public/styles.css`) includes responsive layout rules confirmed in D-20D
(`button{width:100%}` at `max-width:900px`, `.actions{flex-direction:column}`). Based on
the D-21 visual QA audit and the D-22 D-series stabilization release, narrow-viewport
rendering of the claims feed, claim detail, evidence panel, and pressure section is expected
to be functional.

If a future manual browser session is conducted, the following narrow-viewport checks are
recommended:
- Claims feed loads and is scrollable at 375px width
- Claim detail page opens and claim text wraps cleanly
- Evidence items and pressure items are visible without horizontal scroll
- Status badge renders correctly (not clipped)
- Study dock action buttons stack vertically (D-20D `flex-direction:column` rule)

This is noted as a non-blocking observation — no layout regression has been introduced
since D-21/D-22. The narrow-viewport check is deferred to a future manual browser session.

---

## 9. Issues Found

### Blocking Issues

**None.** All 5 seed claims are visible, all evidence is attached and public, all pressure
points are present where expected, all claim texts match exactly, A1 status lock is correct.

### Non-Blocking Observations

**Observation 1 — `statusLocked` not surfaced as a UI badge (non-blocking)**

The API now exposes `statusLocked: true` for launch-A1. The current frontend does not
render a visual indicator (lock icon, badge, tooltip) to distinguish editorially locked
claims from computed-status claims. This is by design per the D-83C implementation spec
("backend-only initial implementation"). End users see `"Strongly Supported"` with no
visible distinction from other claims. This is acceptable for v1 — there is no misleading
information; the label is correct.

Future optional enhancement: add a small lock indicator or tooltip on the status badge
when `statusLocked === true`.

**Observation 2 — Narrow viewport not browser-tested (non-blocking)**

Narrow viewport rendering was verified via static code analysis only, not live browser
testing. Based on D-21/D-22 QA, no regression is expected. A manual browser narrow-viewport
session remains optional.

---

## 10. Final UX Status

### ✅ PASS

| Category | Status |
|----------|--------|
| All 5 seed claims visible in public feed | ✅ |
| All 5 claim texts exact match | ✅ |
| All 5 detail pages return valid structure | ✅ |
| All 10 evidence items visible and public | ✅ |
| All 4 expected pressure points visible | ✅ |
| D2 correctly shows 0 pressure points | ✅ |
| A1 status: Strongly Supported (locked) | ✅ |
| B5 / A4 / D2 status: Strongly Supported (acceptable computed) | ✅ |
| C1 status: Plausible | ✅ |
| A1 statusLocked: true in API | ✅ |
| No other seed claim locked | ✅ |
| Static checks 127/24/39 | ✅ |

The launch seed pack is fully operational in the public UI.

---

## 11. Next Optional Gates

| Step | Status |
|------|--------|
| D-83F — durability test | ⛔ BLOCKED / optional — requires explicit approval; trigger must be non-destructive |
| D-84 — reported claims cleanup audit | ⛔ BLOCKED / optional — 21 non-seed claims in review queue; 5 are reported public user-submitted claims |
| D-85 — homepage/feed polish | Not needed — no blocking UX issues found |
| D-47 — evidence moderation manual test | ⛔ BLOCKED — requires explicit live-write browser session approval |

---

## D-82 Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at D-83E commit (a5dc31f) | ✅ |
| GET /api/claims?limit=50 — all 5 seed claims in feed | ✅ |
| GET /api/claims/<id> × 5 — all detail pages valid | ✅ |
| All 5 claim texts exact match | ✅ |
| All 10 evidence items confirmed public and attached | ✅ |
| All 4 pressure points confirmed | ✅ |
| D2 confirmed 0 pressure (expected) | ✅ |
| A1 status: Strongly Supported, statusLocked: true | ✅ |
| B5/A4/D2 status: Strongly Supported (acceptable) | ✅ |
| C1 status: Plausible (correct) | ✅ |
| Scoring fields (evidenceScore, survivability, contradictions) confirmed | ✅ |
| No other claim locked | ✅ |
| Static checks 127/24/39 pass | ✅ |
| No moderation action | ✅ |
| No POST call | ✅ |
| No D1 | ✅ |
| No Wrangler | ✅ |
| No route write | ✅ |
| Temp files deleted | ✅ |
| docs/D82_PUBLIC_UX_SPOT_CHECK.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
