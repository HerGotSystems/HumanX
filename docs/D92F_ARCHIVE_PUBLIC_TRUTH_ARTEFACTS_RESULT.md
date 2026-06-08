# D-92F — Archive Public Truth Artefacts Result

**Date:** 2026-06-08
**Scope:** Docs-only / manual execution required. No code changes.
**Static baseline:** 220 / 24 / 39

---

## Status: MANUAL EXECUTION REQUIRED

CC cannot execute these POSTs directly because the admin token must remain as a shell variable `$TOKEN` and must not appear in tool call command arguments (logging risk). Exact curl commands are provided below. The user must set `TOKEN` in their own shell and run each command.

**Do not fake execution. This document records preflight audit findings and provides exact steps. Fill in actual results in Section G after execution.**

---

## A. Target List (exact 5 — confirmed per user)

| # | ID | Expected Statement |
|---|----|--------------------|
| 1 | `tru_8dda0954d7b14910bb` | gfsdhdfhdfhdfhgdfa |
| 2 | `tru_2544a80a73034a6a95` | Blablabla |
| 3 | `tru_67ae90e56f7449ee85` | SMALL INDEFERENT TRUTH |
| 4 | `tru_5fe9ce641c634fcba5` | Statement |
| 5 | `tru_a3ecc8ef96104c6ebe` | Slogan |

**NOT touched:**
- `tru_53ee59f3fa4247f4be` — Belief Engine Profile — Stoic Atheism — policy decision deferred
- All other truths — especially "People are stupid", "Children should always obey adults", and all socially real belief truths

---

## B. Preflight Code Audit

### Endpoints confirmed

| Action | Route | Method |
|--------|-------|--------|
| Reject | `POST /api/review/decision` | POST |
| Archive | `POST /api/review/cleanup` | POST |

**Auth header:** `x-humanx-admin: $TOKEN`
**Live base URL:** `https://humanx.rinkimirikata.com`

### reviewDecision — truth support

```
src/worker.js line 88 — targetType 'truth' path:
  UPDATE truths SET review_state=?, updated_at=? WHERE id=?
  → returns { ok:true, targetType:'truth', decision, item:row }
  → returns TRUTH_NOT_FOUND (404) if ID does not exist
```

Payload fields:
```json
{
  "targetType": "truth",
  "targetId":   "<exact ID>",
  "decision":   "rejected"
}
```

### reviewCleanup — truth support and archive path

```
src/worker.js line 89–157:
  - Requires review_state='rejected' → CLEANUP_REQUIRES_REJECTED if not
  - Protected seed blocklist: 5 clm_seed_* IDs only — none of our targets
  - status_locked gate: truths do not use status_locked by default
  - test_artifact_v2 detection:
      keywordMatch: 'smoke', 'test', 'automated write', 'automated smoke' in text
      idPatternMatch: starts with clm_seed_ or HX-\d
      handleMatch: known dev handle — BUT truth SQL omits handle column → always false
  - junk_override path: fires when junk_override=true AND reason≥8 chars AND junkHeuristicPass
    junkHeuristicPass = isShort (len≤40) OR isAllCapsFragment OR isLowAlpha
```

### Archive path analysis per target

| # | Statement | len | isShort? | test_artifact_v2? | junk_override path? |
|---|-----------|-----|----------|--------------------|----------------------|
| 1 | gfsdhdfhdfhdfhgdfa | 18 | ✅ | ❌ (no keyword/id/handle signal) | ✅ |
| 2 | Blablabla | 9 | ✅ | ❌ | ✅ |
| 3 | SMALL INDEFERENT TRUTH | 22 | ✅ | ❌ | ✅ |
| 4 | Statement | 9 | ✅ | ❌ | ✅ |
| 5 | Slogan | 6 | ✅ | ❌ | ✅ |

All 5 will use `junk_override:true`. All pass `isShort` (≤40 chars). **`junkHeuristicPass=true` for all.**

**Stop conditions:**
- `TRUTH_NOT_FOUND` (404) on reject → stop, report missing ID
- `CLEANUP_REQUIRES_REJECTED` → reject step did not take, stop
- `CLEANUP_JUNK_OVERRIDE_REJECTED` → heuristic failed unexpectedly, stop and report
- `CLEANUP_PROTECTED_SEED` → ID is on protected list (impossible for tru_* IDs, but stop if seen)

---

## C. Preflight Browser Verification Steps

Before running curl commands, confirm each target in the Review tab:

1. Enter admin token → Load Queue
2. Switch to **Truths** tab (public page) → confirm each of the 5 statements is still visible
3. Confirm none show a lock badge or "→ claim exists" (linked claim would not block archive, but note it)
4. Note the current short ID suffix displayed on each card — should match last 8 chars of each target ID

---

## D. Exact Execution Steps

Set your token in shell first (do NOT paste the token into this document):
```sh
TOKEN=<your-admin-token-here>
```

### Step 1 — Reject all 5 (loop or individual)

**Target 1 — gfsdhdfhdfhdfhgdfa**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/decision \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"targetType":"truth","targetId":"tru_8dda0954d7b14910bb","decision":"rejected"}' \
  | jq .
```
Expected: `{"ok":true,"targetType":"truth","decision":"rejected","item":{...}}`
Stop if: `TRUTH_NOT_FOUND` or statement in `item.statement` does not match `gfsdhdfhdfhdfhgdfa`

**Target 2 — Blablabla**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/decision \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"targetType":"truth","targetId":"tru_2544a80a73034a6a95","decision":"rejected"}' \
  | jq .
```
Expected: `{"ok":true,"targetType":"truth","decision":"rejected","item":{...}}`

**Target 3 — SMALL INDEFERENT TRUTH**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/decision \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"targetType":"truth","targetId":"tru_67ae90e56f7449ee85","decision":"rejected"}' \
  | jq .
```

**Target 4 — Statement**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/decision \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"targetType":"truth","targetId":"tru_5fe9ce641c634fcba5","decision":"rejected"}' \
  | jq .
```

**Target 5 — Slogan**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/decision \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"targetType":"truth","targetId":"tru_a3ecc8ef96104c6ebe","decision":"rejected"}' \
  | jq .
```

---

### Step 2 — Archive all 5 via junk_override

**Target 1 — gfsdhdfhdfhdfhgdfa**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/cleanup \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"target_type":"truth","target_id":"tru_8dda0954d7b14910bb","junk_override":true,"reason":"Keyboard-mash artefact, no semantic content"}' \
  | jq .
```
Expected: `{"ok":true,"target_type":"truth","action":"archived","archive_policy":"junk_override_v1",...}`

**Target 2 — Blablabla**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/cleanup \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"target_type":"truth","target_id":"tru_2544a80a73034a6a95","junk_override":true,"reason":"Repeated-syllable placeholder, no semantic content"}' \
  | jq .
```

**Target 3 — SMALL INDEFERENT TRUTH**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/cleanup \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"target_type":"truth","target_id":"tru_67ae90e56f7449ee85","junk_override":true,"reason":"All-caps placeholder fragment, no substantive content"}' \
  | jq .
```

**Target 4 — Statement**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/cleanup \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"target_type":"truth","target_id":"tru_5fe9ce641c634fcba5","junk_override":true,"reason":"Single generic placeholder word, no semantic content"}' \
  | jq .
```

**Target 5 — Slogan**
```sh
curl -s -X POST https://humanx.rinkimirikata.com/api/review/cleanup \
  -H "Content-Type: application/json" \
  -H "x-humanx-admin: $TOKEN" \
  -d '{"target_type":"truth","target_id":"tru_a3ecc8ef96104c6ebe","junk_override":true,"reason":"Single generic placeholder word, no semantic content"}' \
  | jq .
```

---

## E. Verification After Execution

1. Reload public Truths page — none of the 5 statements should appear
2. Open Review tab with admin token → check **Archived** truths count has increased by 5
3. Confirm `Belief Engine Profile — Stoic Atheism` still visible on public Truths
4. Confirm all other truths (People are stupid, Hard work always pays off, etc.) still visible

---

## F. Stoic Atheism — Confirmed Untouched

`tru_53ee59f3fa4247f4be` — Belief Engine Profile — Stoic Atheism

This entry is NOT a junk artefact — it is a genuine belief profile output with `personal belief` badge from D-92C. Policy decision (withdraw from public, keep in review, or leave as-is with badge) is deferred to a future batch. **No action taken here.**

---

## G. Results (fill after execution)

| # | ID | Statement | Reject result | Archive result | Final state |
|---|----|-----------|-----------|-----------------------|-------------|
| 1 | tru_8dda0954d7b14910bb | gfsdhdfhdfhdfhgdfa | _(pending)_ | _(pending)_ | _(pending)_ |
| 2 | tru_2544a80a73034a6a95 | Blablabla | _(pending)_ | _(pending)_ | _(pending)_ |
| 3 | tru_67ae90e56f7449ee85 | SMALL INDEFERENT TRUTH | _(pending)_ | _(pending)_ | _(pending)_ |
| 4 | tru_5fe9ce641c634fcba5 | Statement | _(pending)_ | _(pending)_ | _(pending)_ |
| 5 | tru_a3ecc8ef96104c6ebe | Slogan | _(pending)_ | _(pending)_ | _(pending)_ |

Archived truth count before: _(pending)_
Archived truth count after: _(pending)_

---

## H. Safety Notes

- Every reject and archive call is ID-scoped to exact known IDs only
- `junk_override` path requires `isShort=true` (len≤40) — all 5 targets satisfy this
- The `junk_override` reason string is at least 8 chars for all 5 (backend minimum)
- Truth IDs are `tru_*` prefix — no overlap with claim ID protected seed blocklist (`clm_seed_*`)
- `status_locked` is not set on these truths (no score-lock mechanism exists for truths)
- No claims, evidence, pressure points, or votes are affected
- Archiving a truth does not cascade to any linked claim — `linked_claim_id` is a reference only

---

## I. No Code Changes

This batch is moderation-actions only. No frontend, Worker, or schema changes. Static baseline unchanged: **220 / 24 / 39**.
