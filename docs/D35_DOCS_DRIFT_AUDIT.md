# D-35: Docs Drift Audit and Index Cleanup

Date: 2026-06-06
Status: Docs-only. No frontend, no Worker, no workflow changes, no Wrangler, no D1, no live tests.

---

## Purpose

Audit all docs, scripts, and workflow files for references that present outdated state as current.
Fix anything that would mislead a future session about the actual baseline. Leave historical
records accurate as written — do not retroactively edit checkpoint docs.

---

## Search terms used

```
grep -RIn "Batch C-9\|70 checks\|91/24/35\|95/24/39\|99 passed\|Node 20\|D-23 planning is complete\|RunPack provenance Phase 2\|manual/live testing deferred\|read smoke blocked" docs scripts .github 2>/dev/null
```

All results evaluated below.

---

## Files reviewed

- `docs/README.md` — docs index, current-status section
- `docs/PROJECT_STATE.md` — single-page checkpoint, all sections
- `docs/READ_ENDPOINT_SMOKE_TEST_USAGE.md` — current-facing usage guide
- `docs/WRITE_ENDPOINT_SMOKE_TEST_USAGE.md` — current-facing usage guide
- `docs/D25_D24_OPERATIONAL_MODERATION_CHECKPOINT.md` — historical D-25 checkpoint
- `docs/D27_RUNPACK_PROVENANCE_PHASE2_WORKER_PLAN.md` — historical D-27 planning doc
- `docs/D33_READ_SMOKE_CI_RESULT.md` — historical D-33 result record
- `docs/D34_READ_SMOKE_NODE24_UPDATE.md` — historical D-34 change record
- `.github/workflows/read-smoke.yml` — current workflow (D-34 already updated to Node 24)

---

## Results: stale references found and fixed

### 1. `docs/README.md` — PROJECT_STATE.md description (stale)

**Before:**
```
Single-page checkpoint updated after D-30. Covers current functional state,
known-good check counts (100/24/39), full batch history A-2 → D-30, backend/D1
safety rules, and known limitations (Windows schannel live smoke).
```

**Problem:** PROJECT_STATE.md was updated through D-34, not D-30. The batch history now runs
A-2 → D-34. The Known Limitations section has been updated in D-32/D-33/D-34 to reflect that
the schannel issue is now mitigated by the CI workflow — calling it simply "Windows schannel live
smoke" no longer describes the current state accurately.

**Fixed to:**
```
Single-page checkpoint updated after D-34. Covers current functional state,
known-good check counts (100/24/39), full batch history A-2 → D-34, backend/D1
safety rules, and known limitations (Windows schannel local TLS — mitigated by D-32
CI workflow, first run confirmed green in D-33, updated to Node 24 in D-34).
```

---

## Results: stale references found but deferred (outside this task's commit scope)

### 2. `docs/READ_ENDPOINT_SMOKE_TEST_USAGE.md:197` — hardening smoke check count (stale)

```
1. `node scripts/hardening-smoke-test.mjs` — pure function tests, no network (70 checks)
```

**Problem:** The hardening smoke has 100 checks since D-29, not 70. This is a current-facing
usage guide that a developer would read before running the smoke chain — it should reflect the
actual count.

**Action:** Deferred from D-35 commit scope (task commit covers README.md and PROJECT_STATE.md
only). Should be fixed in a follow-up docs pass. Correct value: `100 checks`.

### 3. `docs/WRITE_ENDPOINT_SMOKE_TEST_USAGE.md:275` — hardening smoke check count (stale)

```
1. `node scripts/hardening-smoke-test.mjs` — pure function tests, no network (70 checks)
```

Same issue as above in the write smoke usage guide. **Deferred.** Correct value: `100 checks`.

---

## Results: historical references — intentionally left alone

| File | Line | Term | Assessment |
|------|------|------|------------|
| `docs/D25_D24_OPERATIONAL_MODERATION_CHECKPOINT.md` | 179 | "RunPack provenance Phase 2" not yet implemented | Historical D-25 checkpoint; accurate at time of writing (D-28 came after D-25). Left as written. |
| `docs/D27_RUNPACK_PROVENANCE_PHASE2_WORKER_PLAN.md` | 379 | "95/24/39" as threshold | Historical D-27 plan target; accurate at time of writing. Left as written. |
| `docs/D33_READ_SMOKE_CI_RESULT.md` | 72 | "passed successfully on Node 20" | Factually correct historical record — D-33 DID run on Node 20. Left as written. |
| `docs/D34_READ_SMOKE_NODE24_UPDATE.md` | 62 | "Node 20 deprecation annotation should no longer appear" | Historical context explaining the reason for the D-34 change. Left as written. |
| `docs/PROJECT_STATE.md` | 90 | "live read smoke blocked by local environment" | B-5 batch row; accurate at time of writing. The Known Limitations section (not the batch table) has been updated in D-32/D-33/D-34 to reflect current state. Batch rows are immutable historical records. Left as written. |
| `docs/PROJECT_STATE.md` | 130 | "91/24/35" | D-22 batch row; accurate at time of writing. Left as written. |
| `docs/PROJECT_STATE.md` | 137 | "Node 20" in D-34 batch row | D-34 batch row accurately describes what was changed from. Left as written. |
| `docs/PROJECT_STATE.md` | 144 | "RunPack provenance Phase 2 worker plan" | D-27 batch row; accurate historical label. Left as written. |
| `docs/PROJECT_STATE.md` | 146 | "manual/live testing deferred" in D-25 row | D-25 batch row; accurate at time of writing (D-26/D-33 came after). Left as written. |
| `docs/PROJECT_STATE.md` | 147 | "95/24/39" in D-24G row | D-24G batch row; accurate at time of writing. Left as written. |

---

## Results: terms with no matches

| Term | Result |
|------|--------|
| `Batch C-9` | No matches — not present in any file |
| `91/24/35` as current | Only in D-22 historical batch row — correctly historical |
| `99 passed` as current | No matches — not present in any file |
| `D-23 planning is complete` | No matches |

---

## Current baseline (as of D-34 / D-35)

| Item | State |
|------|-------|
| `docs/PROJECT_STATE.md` last updated | D-34 |
| `docs/README.md` PROJECT_STATE description | Now correctly says D-34 |
| Static checks | 100 / 24 / 39 — all passing, 0 failed |
| Read Smoke CI workflow | `.github/workflows/read-smoke.yml` — exists, on Node 24 (D-34) |
| First CI read smoke result | ✅ Green — D-33, 15s, all 8 endpoints passed |
| Node 20 deprecation | Resolved in D-34 — workflow now on Node 24 |
| Live write smoke | Deferred — requires explicit per-session approval |
| D-26 manual UI test | Deferred — requires explicit per-session browser session approval |
| Hardening smoke check count | 100 (updated through D-29; usage docs still say 70 — deferred fix) |

---

## Follow-up items (not fixed in D-35)

1. **`docs/READ_ENDPOINT_SMOKE_TEST_USAGE.md:197`** — update "(70 checks)" to "(100 checks)"
2. **`docs/WRITE_ENDPOINT_SMOKE_TEST_USAGE.md:275`** — update "(70 checks)" to "(100 checks)"

Both are single-character count updates in usage guides. Low risk; direct main acceptable when addressed.
