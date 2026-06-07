# D-88D: Archive Dry Plan — Rejected Queue

Date: 2026-06-07
Step: D-88D — controlled archive dry-plan for rejected items (read-only)
Type: Planning document only. No archive calls made. No D1 writes.

Live data source: `GET /api/review` at commit `c3c71c1` (D-88C verified state).

---

## 1. Current State

| Metric | Value |
|--------|-------|
| Rejected | 25 |
| Review/pending | 13 |
| Public | 5 |
| archived_total | 1 (pre-existing, before D-88 work) |

---

## 2. Classification of All 25 Rejected Items

### Group A — Keyword artefacts (2 items)
Normal policy path: `test_artifact_v2` via keyword signal.
No override required. No `junk_override` body field needed.

| # | ID | Claim text | Keyword match | Locked |
|---|----|------------|--------------|--------|
| A1 | `clm_79f69a5075df45f181` | "HOWGH test" | `\btest\b` | No |
| A2 | `clm_8ad342e93c594f1082` | "People are stupid - TEST" | `\btest\b` | No |

---

### Group B — HX dev seed rows (2 items)
Normal policy path: `test_artifact_v2` via id-pattern signal (`/^HX-\d/i`).
Claim text itself looks factual — id pattern is the only artefact signal.

| # | ID | Claim text | Signal | Locked |
|---|----|------------|--------|--------|
| B1 | `HX-000001` | "The Earth is flat" | id `/^HX-\d/i` | No |
| B2 | `HX-000002` | "Humans landed on the Moon" | id `/^HX-\d/i` | No |

---

### Group C — Junk/gibberish/fragment items — junk_override path (6 items)
Each requires `junk_override: true` and a `reason` string (8–240 chars).
Each passes the backend secondary heuristic via `isShort` (trimmed length ≤ 40 chars).

| # | ID | Claim text | Length | Heuristic trigger | Risk | Locked |
|---|----|------------|--------|------------------|------|--------|
| C1 | `clm_1695187b3d6140b88b` | "Blablablabla" | 12 | isShort | Low | No |
| C2 | `clm_d02ac47783d0423c93` | "gfsdhdfhfdhdfhdfhgdfa" | 21 | isShort | Low | No |
| C3 | `clm_3905faadfa9c47159e` | "DOCTRINE" | 8 | isShort + all-caps single word | Low | No |
| C4 | `clm_6bd4e59efa2a44d1b2` | "EVERYBODY IS IDIOT" | 18 | isShort + all-caps 3-word | Low | No |
| C5 | `clm_2c1751dd6605412db2` | "I am the best" | 13 | isShort | Low | No |
| C6 | `clm_d1e4261798754199a6` | "Belief Engine Profile — Stoic Atheism" | 37 | isShort | Low | No |

C6 note: text appears to be app UI boilerplate accidentally submitted as a claim. Single admin review confirms it has no claim value.

---

### Group D — NOT archivable — substantive rejected content (15 items)

These items have real (if low-quality, vague, or rejected) claim content. None pass the intent of the archive policy. Some are short enough that the junk heuristic would technically fire on them, but archiving them would remove potentially useful rejected audit trail. They stay rejected-visible.

| # | ID | Claim text | Why NOT archivable |
|---|----|------------|-------------------|
| D1 | `clm_cdba3db932b84f279a` | "People are stupid" | Normative claim; rejected D-85G for credibility; keep for audit |
| D2 | `clm_4176a17d0a754b78aa` | "Science has proven it" | Ambiguous epistemic claim; rejected D-85F; keep for audit |
| D3 | `clm_ae59b53d5f4249f0b4` | "Never trust the experts" | Substantive anti-expert claim |
| D4 | `clm_eec72f024040428190` | "Children should always obey adults" | Substantive normative claim |
| D5 | `clm_ba71db1962b8474bb7` | "PEOPLE ARE STUPID" | All-caps variant of D1; same editorial reasoning |
| D6 | `clm_a51c7861a89945339b` | "GOD DONT EXIST" | Substantive belief claim |
| D7 | `clm_852333ac90654ab495` | "everyone knows the government is hiding everything" | Conspiracy-adjacent; testable topic |
| D8 | `clm_9c6e0a3aa9924c4e95` | "MONEY IS NO GOOD" | Normative claim |
| D9 | `clm_b3dd4907cb744831b1` | "God doesnt exist" | Substantive belief claim |
| D10 | `clm_180a9127f4ac4b5281` | "Trust the experts" | Substantive counter-position |
| D11 | `clm_93b05946babe4e7487` | "dont trust expert" | Near-duplicate of D3; substantive |
| D12 | `clm_da3304ebdfe44e7e8f` | "mOON LANDING" | Topically substantive (Moon landing); keep for audit |
| D13 | `clm_cca7de1026f043f5bb` | "Human really landed on Moon" | Substantive factual claim |
| D14 | `clm_721b8ea6de01457ab4` | "Humans didnt land on moon" | Substantive factual claim (counter) |
| D15 | `clm_697a5babed9a4332b4` | "We never went to space" | Substantive factual claim |

**None of the Group D items should be archived without a separate deliberate editorial review.** Archiving substantive rejected claims via junk_override is not appropriate even when the heuristic would technically permit it.

---

## 3. Archive Execution Plan — 10 Items

Ordered safest-first within each group. Group A first (no override), then Group B (id-pattern, clear dev artefacts), then Group C (junk_override, lowest-risk items first).

Each item maps to one future gate task (D-88E through D-88N). Each requires **explicit approval per item** before execution. **No batch archive.**

### Execution order

| Gate | ID | Claim | Policy path | Body shape | Risk |
|------|----|-------|------------|------------|------|
| **D-88E** | `clm_79f69a5075df45f181` | "HOWGH test" | `test_artifact_v2` (keyword) | `{"target_type":"claim","target_id":"clm_79f69a5075df45f181"}` | Very low |
| **D-88F** | `clm_8ad342e93c594f1082` | "People are stupid - TEST" | `test_artifact_v2` (keyword) | `{"target_type":"claim","target_id":"clm_8ad342e93c594f1082"}` | Very low |
| **D-88G** | `HX-000001` | "The Earth is flat" | `test_artifact_v2` (id-pattern) | `{"target_type":"claim","target_id":"HX-000001"}` | Low |
| **D-88H** | `HX-000002` | "Humans landed on the Moon" | `test_artifact_v2` (id-pattern) | `{"target_type":"claim","target_id":"HX-000002"}` | Low |
| **D-88I** | `clm_1695187b3d6140b88b` | "Blablablabla" | `junk_override_v1` | `{"target_type":"claim","target_id":"clm_1695187b3d6140b88b","junk_override":true,"reason":"Gibberish placeholder text — no claim content"}` | Low |
| **D-88J** | `clm_d02ac47783d0423c93` | "gfsdhdfhfdhdfhdfhgdfa" | `junk_override_v1` | `{"target_type":"claim","target_id":"clm_d02ac47783d0423c93","junk_override":true,"reason":"Keyboard mash — no claim content"}` | Low |
| **D-88K** | `clm_3905faadfa9c47159e` | "DOCTRINE" | `junk_override_v1` | `{"target_type":"claim","target_id":"clm_3905faadfa9c47159e","junk_override":true,"reason":"Single-word fragment — not a testable claim"}` | Low |
| **D-88L** | `clm_6bd4e59efa2a44d1b2` | "EVERYBODY IS IDIOT" | `junk_override_v1` | `{"target_type":"claim","target_id":"clm_6bd4e59efa2a44d1b2","junk_override":true,"reason":"All-caps fragment — grammatically broken, no specific assertion"}` | Low |
| **D-88M** | `clm_2c1751dd6605412db2` | "I am the best" | `junk_override_v1` | `{"target_type":"claim","target_id":"clm_2c1751dd6605412db2","junk_override":true,"reason":"Personal self-assessment — not a testable public claim"}` | Low |
| **D-88N** | `clm_d1e4261798754199a6` | "Belief Engine Profile — Stoic Atheism" | `junk_override_v1` | `{"target_type":"claim","target_id":"clm_d1e4261798754199a6","junk_override":true,"reason":"App UI boilerplate accidentally submitted as claim — not a claim"}` | Low |

---

## 4. Gate Rules for D-88E through D-88N

Each gate task must:

1. **Require explicit per-item approval** in the task prompt before any POST is made.
2. **Execute one single POST** to `POST /api/review/cleanup` with the exact body shown above.
3. **Verify response** — confirm `ok:true`, `new_state:'archived'`, `archive_policy` matches expected.
4. **Re-fetch** `GET /api/review` after each archive and confirm `archived_total` incremented by 1.
5. **Confirm** rejected count decreased by 1.
6. **Write** a brief result note (no full doc required for each; one combined result doc D-88-results.md is acceptable).
7. **Stop** if any archive returns an unexpected error — do not proceed to next item.
8. **No batch** — do not combine multiple items in one session without separate approvals.

---

## 5. Recommended First Archive Target

**D-88E: `clm_79f69a5075df45f181` — "HOWGH test"**

Rationale:
- Clearest possible artefact signal: claim text is literally two words, one being `test`.
- No editorial value whatsoever.
- Uses the simplest policy path (`test_artifact_v2`, keyword, no override flag).
- Tests the live route in isolation before proceeding to id-pattern (Group B) or junk_override (Group C).
- No risk of misidentification: "HOWGH test" is unambiguously a dev/test submission.

After D-88E succeeds and is verified, proceed to D-88F, then Groups B and C in order.

---

## 6. Protected Items Reminder

The following are **never archivable** via the cleanup route:

| ID | Claim | Protection |
|----|-------|-----------|
| `clm_seed_55e17c22e13e` | Large population studies / vaccines | `CLEANUP_PROTECTED_SEED` + `status_locked` |
| `clm_seed_8e095b6f6d30` | Holocaust murder statistics | `CLEANUP_PROTECTED_SEED` |
| `clm_seed_c4e0335e7aae` | CO2 / human activity / climate | `CLEANUP_PROTECTED_SEED` |
| `clm_seed_8ad9ff121579` | Platform recommendation systems | `CLEANUP_PROTECTED_SEED` |
| `clm_seed_7fb1c24747c2` | Sleep deprivation / cognitive performance | `CLEANUP_PROTECTED_SEED` |

These 5 are all currently in `public` state and would also fail the `review_state='rejected'` gate — double-protected.

---

## 7. Static Checks

| Script | Expected | Result |
|--------|----------|--------|
| `node --check src/worker.js` | exit 0 | ✅ |
| `node --check public/app-v10.js` | exit 0 | ✅ |
| `scripts/hardening-smoke-test.mjs` | 147 passed | ✅ 147 passed, 0 failed |
| `scripts/belief-engine-static-check.mjs` | 24 passed | ✅ 24 passed, 0 failed |
| `scripts/worker-route-static-check.mjs` | 39 passed | ✅ 39 passed, 0 failed |

---

## 8. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| No POST made | ✅ |
| No `/api/review/cleanup` called | ✅ |
| No moderation action | ✅ |
| No D1 writes | ✅ |
| No Wrangler | ✅ |
| Admin token not printed or committed | ✅ |
| No Co-Authored-By | ✅ |
