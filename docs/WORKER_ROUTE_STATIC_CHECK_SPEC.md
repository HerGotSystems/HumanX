# Worker Route Static Check Spec

## 1. Purpose

This spec defines a local static guardrail script for the HumanX Worker API routes.
The script compares route strings found in `src/worker.js` against the documented
endpoint inventory in `docs/API_ENDPOINT_INVENTORY.md`, and confirms that high-risk
and public-write routes named in `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` are still
documented.

It must pass before any Worker routing change, module extraction, or endpoint behaviour
modification. It is a documentation-level consistency check — not a behaviour test.

This is a specification file only. The script is not implemented here.

See `docs/BACKEND_SMOKE_TEST_PLAN.md` for the broader backend test context this spec
builds on.

---

## 2. Why Static Route Checking First

A static text-extraction check is the right first layer for Worker route safety because
it:

- Makes **no production calls** — reads local files only.
- Causes **no D1 mutation** — no Worker execution, no database.
- Requires **no Wrangler or Cloudflare access** — runs with plain `node`.
- Requires **no admin token** — entirely local.
- Catches **accidental route removal or rename** before a refactor lands — a route
  present in docs but absent from code, or vice versa, surfaces immediately.
- Produces a reliable manifest of actual vs documented routes to support the future
  Worker modular split planning in `docs/WORKER_MODULAR_SPLIT_PLAN.md`.
- Is safe to run at any time without side effects.

---

## 3. Proposed Script Name

```
scripts/worker-route-static-check.mjs
```

Follows the naming convention of the existing static check scripts. Should be runnable
with:

```
node scripts/worker-route-static-check.mjs
```

No arguments, no environment variables, no gates.

---

## 4. Files to Inspect

| File | Role |
|---|---|
| `src/worker.js` | Source of truth for routes actually handled by the Worker |
| `docs/API_ENDPOINT_INVENTORY.md` | Documented inventory of all `/api/...` routes |
| `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` | Risk map listing public-write routes that must remain documented |

---

## 5. Checks the Script Should Perform

Each check should report PASS, FAIL, or WARN with a clear message.

### File existence

- [ ] `src/worker.js` exists and is readable.
- [ ] `docs/API_ENDPOINT_INVENTORY.md` exists and is readable.
- [ ] `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` exists and is readable.

### Route extraction from `src/worker.js`

Extract `/api/...` path strings by scanning for literal string patterns of the form
`'/api/...'` or `"/api/..."` in the routing block. From inspection of the current
`src/worker.js` (lines 28–58), all active routes use exact `=== '/api/...'` equality
checks — no `startsWith`-style parameterised dispatch is present in the main routing
block beyond the `/api/` prefix guard on line 30.

**Known extraction limitation:** `/api/claims/:id` (GET, full claim detail) does not
appear as a literal string in the worker routing block. It is listed in
`docs/API_ENDPOINT_INVENTORY.md` as a documented route. The script should treat it as
a docs-only route and issue a WARN rather than a hard FAIL, since its handling may be
delegated to a module or handled via a pattern not visible as a simple string literal.

Confirmed literal routes in `src/worker.js` (as of spec date):

```
/api/health           GET    (public)
/api/ai/analyse       GET    (public, always 402)
/api/debug            GET    (internal)
/api/seed             GET    (internal)
/api/import-seed      GET    (admin)
/api/import-truths    GET    (admin)
/api/claim-vote       POST   (public write)
/api/session          POST   (public write)
/api/claims           GET    (public)
/api/claims           POST   (public write)
/api/evidence-vault   GET    (public)
/api/truths           GET    (public)
/api/truths           POST   (public write)
/api/truth-to-claim   POST   (public write)
/api/evidence-attach  POST   (public write)
/api/graph-status     GET    (public)
/api/analysis         POST   (public write)
/api/belief-snapshots GET    (public)
/api/belief-snapshots POST   (public write)
/api/belief-promote   POST   (public write)
/api/evidence         POST   (public write)
/api/pressure         POST   (public write)
/api/tests            POST   (public write)
/api/report           POST   (public write)
/api/aip              POST   (public)
/api/runpack          POST   (public)
/api/review           GET    (admin)
/api/review/decision  POST   (admin write)
```

### Route extraction from `docs/API_ENDPOINT_INVENTORY.md`

Extract `/api/...` path strings by scanning for Markdown table rows or backtick-wrapped
path patterns matching `` `/api/...` `` or `| GET | `/api/...` |`. The inventory
currently documents the following paths not in the literal routing list above:

```
/api/claims/:id       GET    (public — parameterised)
```

### Cross-reference: code vs docs

- [ ] Report routes found in `src/worker.js` code but **absent from inventory** — list
      with method where detectable. These are undocumented routes.
- [ ] Report routes found in **inventory but not in code** — list with method. May
      indicate deleted routes, docs staleness, or delegated/parameterised handling.
      Issue WARN (not hard FAIL) for `/api/claims/:id` since its absence from the
      literal routing block is a known limitation of static string extraction.

### Method detection

Detect method alongside route where the pattern `request.method === 'POST'` (or GET,
PUT, etc.) appears on the same line as the route string. This is reliable for the
current `src/worker.js` structure. Mark method as **unknown** if it cannot be extracted
from the same line.

### High-risk route presence check

For each of the following routes, check whether the route string is present in
`src/worker.js` AND in `docs/API_ENDPOINT_INVENTORY.md`. Issue a hard FAIL if a route
is present in code but missing from the inventory.

| Route | Risk reason |
|---|---|
| `/api/claims` | Core public write — new claims; review-state gate |
| `/api/claim-vote` | Write — affects claim scores; rate-limited |
| `/api/evidence` | Write — affects claim scores |
| `/api/evidence-attach` | Write — links evidence across claims |
| `/api/truths` | Write — dedup via `normalized_statement` |
| `/api/truth-to-claim` | Write — two-table bridge; partial-failure risk |
| `/api/belief-snapshots` | Write — saves Belief Engine profile |
| `/api/belief-promote` | Write — cross-system promotion; highest consequence |
| `/api/review` | Admin-only read — leaks non-public content |
| `/api/review/decision` | Admin-only write — irreversible moderation |
| `/api/ai/analyse` | Public-facing intentional 402 — must remain blocked |

### Public-write route inventory coverage

For each public-write route listed in `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`, check
that the route path also appears in `docs/API_ENDPOINT_INVENTORY.md`. Issue a hard FAIL
if a risk-map route is absent from the inventory — this means the risk documentation
and the endpoint inventory have drifted.

---

## 6. Expected Output

```
Worker Route Static Check
--------------------------
  PASS: src/worker.js exists and is readable
  PASS: docs/API_ENDPOINT_INVENTORY.md exists and is readable
  PASS: docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md exists and is readable
  PASS: extracted N route strings from src/worker.js
  PASS: extracted M route paths from docs/API_ENDPOINT_INVENTORY.md

  Routes in code but not in inventory:
    (none) — or list of undocumented routes

  Routes in inventory but not in code:
    WARN: /api/claims/:id  — parameterised route; may be handled by module or path-prefix logic

  High-risk route checks:
  PASS: /api/claims present in code and inventory
  PASS: /api/claim-vote present in code and inventory
  ... (one line per high-risk route)

  Public-write risk map coverage:
  PASS: POST /api/session in inventory
  PASS: POST /api/claims in inventory
  ... (one line per risk-map route)

--------------------------
  X passed, 0 failed, Y warn
```

| Condition | Exit code |
|---|---|
| All hard checks pass | `0` |
| One or more hard checks fail | `1` |
| Required file is missing or unreadable | `2` |

---

## 7. Hard Failures vs Warnings

### Hard failures (exit 1)

- Required file (`src/worker.js`, `docs/API_ENDPOINT_INVENTORY.md`, or
  `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`) is missing or unreadable.
- A known high-risk route (see list in section 5) is present in `src/worker.js` but
  absent from `docs/API_ENDPOINT_INVENTORY.md`.
- A public-write route listed in `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` is absent
  from `docs/API_ENDPOINT_INVENTORY.md` — inventory and risk map have drifted.

### Warnings (not exit 1)

- Dynamic route extraction uncertainty — any route whose path is assembled at runtime
  or matched by a non-literal pattern cannot be reliably extracted. The script should
  note this clearly.
- A route is present in code but not documented and is not classified as high-risk —
  flag as undocumented but do not fail; it may be intentionally undocumented (e.g.
  `/api/seed`, `/api/debug`).
- A route is documented in the inventory but not found in the literal routing block —
  may be delegated, parameterised, or removed. Issue WARN; require human review.
- Method detection is ambiguous or multi-line — flag as method-unknown rather than
  guessing.

---

## 8. What the Script Must Not Do

- **No network calls** — no `fetch`, no HTTP requests of any kind.
- **No live API calls** — no Worker, no HumanX production endpoint, no Cloudflare.
- **No D1 or Wrangler commands** — the script runs with `node` only.
- **No Worker execution** — the script reads `src/worker.js` as text; it does not
  `import` or `require` it.
- **No file edits** — the script is entirely read-only.
- **No endpoint behaviour checks** — the script checks for route string presence only,
  not response correctness, rate-limit behaviour, or auth logic.
- **No production writes** — nothing is submitted to any external system.
- **No admin token** — not required and must not be embedded.

---

## 9. Limitations

- **Static route extraction may miss dynamically assembled paths.** The current
  `src/worker.js` uses only exact string equality checks for routes, so extraction is
  reliable for the present structure. If future refactoring introduces dynamic
  `pathname.startsWith(...)` routing or a router library, the extraction logic will
  need updating.
- **Route parameters like `/api/claims/:id` may appear differently in code.** The
  detail route for a single claim is documented in the inventory but does not appear as
  a literal string in the main routing block. The script must treat this as an expected
  known-limitation WARN, not a code bug.
- **Method detection may be approximate.** The script extracts methods from the same
  line as the route string. Multi-line routing conditions or helper functions that
  accept a method argument would defeat this detection.
- **This does not prove endpoint behaviour.** Passing this check confirms routes are
  documented; it does not confirm rate limits, auth requirements, response shapes, or
  D1 write correctness. Those require the read/write smoke tests and hardening-smoke
  tests.
- **This does not replace read/write smoke tests.** See `docs/LIVE_READ_SMOKE_RESULT.md`
  and `docs/LIVE_WRITE_SMOKE_RESULT.md` for the live behaviour baseline.

---

## 10. Recommended First Implementation PR

The first implementation PR should:

- Add **only** `scripts/worker-route-static-check.mjs`.
- Make **no changes** to `src/worker.js`, docs, or any existing script.
- Run the script locally and paste the full output into the PR description.
- Record the result in a new `docs/WORKER_ROUTE_STATIC_CHECK_RESULT.md` file.
- Treat any WARN on `/api/claims/:id` as expected and document it in the result file.

---

## 11. Stop Conditions

Stop and do not proceed with implementation if any of the following occur:

- **Any need to edit `src/worker.js`** — the script must work against the current
  unmodified Worker; a route extraction failure is a finding to document, not a prompt
  to change the source.
- **Any need to run Wrangler or D1** — the script runs with `node` only; no
  infrastructure access is acceptable.
- **Any need to call production** — route presence must be determinable from local
  file text alone.
- **Any uncertainty that requires endpoint behaviour testing** — if a discrepancy
  cannot be explained by static analysis (e.g. a route present in code but clearly
  behaving differently than documented), stop and flag it for a separate investigation
  using the smoke tests, not by extending this script.
- **Any route mismatch that suggests docs or code are stale** — a route present in
  code but completely absent from both the inventory and the risk map, or a route
  documented as existing but not present in code in any form, should be flagged as a
  finding and resolved (docs updated or code investigated) before the script is
  committed as passing.
