# D-78-Blocker: Seed Source Updated to Launch v2

Date: 2026-06-07
Branch: feature/d78-blocker-seed-source-v2
Type: Worker source change — branch + PR.
No D1 commands. No Wrangler. No import routes called. No production mutations.

---

## 1. Problem

`src/importer.js` imports the seed data directly from `src/seed-data.js`:

```js
import { HUMANX_SEED } from './seed-data.js';
```

Before this PR, `src/seed-data.js` exported `version: 1` with 4 demo claims:

| seed_id | claim | source_url |
|---------|-------|-----------|
| `seed-flat-earth` | The Earth is flat | (empty) |
| `seed-moon-landing` | Humans landed on the Moon | (empty) |
| `seed-dream-prediction` | A dream predicted my future | (empty) |
| `seed-perpetual-motion` | Perpetual motion machines can produce free energy forever | (empty) |

All 4 demo evidence items had empty `source_url` fields. The SOURCE_NEEDED apply-mode
guard in `src/importer.js` (lines 22–40) would have blocked `mode=apply` for these.
More importantly, none of these claims are part of the approved launch seed.

If `/api/import-seed?mode=dry-run` had been called before this PR, the dry-run report
would have shown the 4 demo claims — not the 5 D-76D approved launch claims from
`data/seed_claims_v2.json`.

This was identified as the primary blocker in D-78A (`docs/D78_DRY_RUN_IMPORT_PLAN.md`,
Section 4.1).

---

## 2. Change

`src/seed-data.js` now exports `HUMANX_SEED` with `version: 2` and the 5 D-76D approved
launch claims. The export shape is unchanged — `{ version, claims: [...] }`.

| Field changed | Before | After |
|---------------|--------|-------|
| `version` | `1` | `2` |
| `claims` | 4 demo claims (empty source_url) | 5 approved launch claims (all source_url populated) |

No other file was changed in this PR:
- `src/importer.js` — **unchanged**
- `src/worker.js` — **unchanged**
- `data/seed_claims_v2.json` — **unchanged** (remains canonical reference)
- All Worker route behavior — **unchanged**

---

## 3. Approved Claims Now in src/seed-data.js

| seed_id | Claim | Status | Evidence | Pressure |
|---------|-------|--------|----------|---------|
| `launch-B5` | The Holocaust resulted in the murder of approximately six million Jews | Proven | 2 | 1 |
| `launch-A1` | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism | Strongly Supported | 2 | 1 |
| `launch-A4` | Rising CO2 levels from human activity are the primary driver of observed global warming | Proven | 2 | 1 |
| `launch-C1` | Online platform recommendation systems can use engagement signals that influence which information spreads widely | Plausible | 2 | 1 |
| `launch-D2` | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy | Proven | 2 | 0 |

Total evidence items: 10 (all have populated source_url)
Total pressure items: 4
Total tests: 0

Human review provenance: all 5 claims carry `APPROVE_FOR_D76` from review cycle
D-76A through D-76D. Recorded in `docs/D76D_FINAL_REVIEW_APPROVAL.md`.

---

## 4. Non-Execution Confirmation

This PR makes no calls to any import route, touches no D1 database, and runs no Wrangler
command. It is a source file update only.

| Action | Status |
|--------|--------|
| `/api/import-seed` called | ✅ NOT called |
| `/api/import-seed?mode=dry-run` called | ✅ NOT called |
| `/api/import-seed?mode=apply` called | ✅ NOT called |
| D1 commands issued | ✅ NOT issued |
| Wrangler run | ✅ NOT run |
| Production data mutated | ✅ NOT mutated |
| curl to production | ✅ NOT run |

---

## 5. Expected Future D-78B Dry-Run Behavior

Once this PR is merged and Cloudflare deploys the updated Worker, calling
`GET /api/import-seed?mode=dry-run` with a valid admin token should produce:

```json
{
  "ok": true,
  "mode": "dry-run",
  "seed_version": 2,
  "review_state": "review",
  "claims": {
    "would_create": 5,
    "would_skip": 0,
    "created": 0,
    "skipped": 0
  },
  "evidence": {
    "would_create": 10,
    "would_skip": 0,
    "created": 0,
    "skipped": 0,
    "source_needed_blocked": 0
  },
  "pressure": {
    "would_create": 4,
    "would_skip": 0,
    "created": 0,
    "skipped": 0
  },
  "tests": {
    "would_create": 0,
    "would_skip": 0,
    "created": 0,
    "skipped": 0
  },
  "warnings": []
}
```

Expected counts assume a fresh DB with no existing launch seed claims. If any claim is
already present (duplicate detected via `normalized_claim`), its count moves from
`would_create` to `would_skip`.

`source_needed_blocked` must be `0` — all 10 evidence items have populated `source_url`.

`review_state` is `"review"` — all imported claims and evidence land invisible to the
public until promoted through the admin Review UI.

---

## 6. Gate — D-78B Remains Blocked

**D-78B (dry-run execution) is NOT unblocked by this PR.**

After this PR is merged, D-78B requires:
1. Cloudflare deployment of the updated Worker confirmed (or automatically triggered by merge)
2. Explicit per-session user approval granted in the same session as the curl call
3. Admin token confirmed
4. Dry-run response pasted back in full for review before any apply is considered

D-79 (production apply) remains separately gated — a distinct explicit per-session
D1/write approval is required after D-78B dry-run is reviewed.

---

## 7. Validation Results (D-78-Blocker)

All checks run locally before commit. No network, no production, no D1/Wrangler.

| Check | Result |
|-------|--------|
| `node --input-type=module` import of src/seed-data.js | ✅ No syntax errors — version: 2, claims: 5 |
| All 5 launch seed IDs present | ✅ launch-B5, launch-A1, launch-A4, launch-C1, launch-D2 |
| Old demo seed IDs absent from claim objects | ✅ seed-flat-earth/moon-landing/dream-prediction/perpetual-motion not in any claim object |
| SOURCE_NEEDED in src/seed-data.js | ✅ 0 matches |
| TODO in src/seed-data.js | ✅ 0 matches |
| launch_blocker in src/seed-data.js | ✅ 0 matches |
| Empty source_url in any evidence item | ✅ 0 (all 10 evidence items have populated source_url) |
| JSON parse — data/seed_claims_v2.json | ✅ valid — 5 claims |
| SOURCE_NEEDED in data/seed_claims_v2.json | ✅ 0 matches in claim objects |
| Hardening smoke test | ✅ 119 passed, 0 failed |
| Belief Engine static check | ✅ 24 passed, 0 failed |
| Worker route static check | ✅ 39 passed, 0 failed |

---

## 8. Safety

| Rule | Status |
|------|--------|
| Branch + PR (no direct main commit) | ✅ Confirmed |
| No import route called | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| Importer behavior unchanged | ✅ Confirmed — src/importer.js not modified |
| Worker route behavior unchanged | ✅ Confirmed — src/worker.js not modified |
| data/seed_claims_v2.json unchanged | ✅ Confirmed — not modified |
| Static checks 119/24/39 | ✅ All pass |

---

## D-78-Blocker Completion Record

| Item | Status |
|------|--------|
| Problem documented | ✅ |
| src/seed-data.js updated — version 2, 5 launch claims | ✅ |
| src/importer.js unchanged | ✅ |
| src/worker.js unchanged | ✅ |
| data/seed_claims_v2.json unchanged | ✅ |
| JS syntax/import validation passed | ✅ |
| All 5 launch seed IDs confirmed present | ✅ |
| All 4 demo seed IDs confirmed absent from claim objects | ✅ |
| SOURCE_NEEDED / TODO / launch_blocker grep — 0 matches | ✅ |
| Static checks 119/24/39 — all pass | ✅ |
| Non-execution confirmation | ✅ |
| Expected D-78B dry-run output documented | ✅ |
| D-78B gate — remains BLOCKED | ✅ |
| Branch pushed and PR opened | ✅ |
