# Belief Engine Static Check Spec

## 1. Purpose

This spec defines a future static, non-mutating check script for the HumanX Belief
Engine. It must be implemented and passing before any change is made to Belief Engine
scoring logic, contradiction rules, the save bridge, or Drift classification in
`public/app-v10.js`.

This is a documentation and specification file only. The script is not implemented here.

See `docs/BELIEF_ENGINE_SCORING_NOTES.md` and `docs/BELIEF_ENGINE_TEST_PLAN.md` for
the deeper context this spec builds on.

---

## 2. Why Static First

A static file-read check is the safest first automated layer because it:

- Makes **no production calls** — reads local files only; no HTTP requests.
- Causes **no D1 mutation** — no Worker, no database, no Wrangler.
- Requires **no admin token** — entirely local.
- Requires **no browser automation** — runs with plain `node`.
- Catches broken route links, missing bridge script tags, missing heading markers, and
  absent `isFullBeliefProfile` classification strings **before** a browser ever loads.
- Provides a fast, scriptable safety net that can run before any Belief Engine change
  is committed — far cheaper than manual QA.
- Is safer to build before scoring logic is changed, because the scoring logic is
  fragile (see `docs/BELIEF_ENGINE_SCORING_NOTES.md`).

---

## 3. Files to Inspect

The script reads these three files as plain text and performs string/regex assertions.
No execution of their JavaScript is required.

| File | What it checks |
|---|---|
| `public/index.html` | Main app nav link to Belief Engine; `tab-belief` element |
| `public/app-v10.js` | `isFullBeliefProfile` classification function and its three marker strings; Beliefs nav tile link |
| `public/apps/humanx-belief-engine/index.html` | Page title, heading, questionnaire markers, result/profile section, bridge script tag, metadata marker strings |

---

## 4. Proposed Script Name

```
scripts/belief-engine-static-check.mjs
```

Follows the naming convention of the existing smoke scripts. Should be runnable with:

```
node scripts/belief-engine-static-check.mjs
```

No arguments, no env vars, no gates — this script is always safe to run.

---

## 5. Checks the Script Should Perform

Each check should be reported as PASS or FAIL with a short message. Checks are ordered
from coarsest to most specific so failures are easy to triage.

### File existence

- [ ] `public/apps/humanx-belief-engine/index.html` exists and is readable.
- [ ] `public/index.html` exists and is readable.
- [ ] `public/app-v10.js` exists and is readable.

### Main app nav (`public/index.html`)

- [ ] Contains a `tab-belief` id or equivalent nav button targeting the Belief Engine.
- [ ] Contains a reference to `/apps/humanx-belief-engine/` as a navigation destination.

### Main app Drift classification (`public/app-v10.js`)

- [ ] Contains `isFullBeliefProfile` function definition.
- [ ] The function checks for the string `standalone-humanx-belief-engine` in the
      `source` field (confirmed: line 36 of `public/app-v10.js`).
- [ ] The function checks for the string `humanx-belief-engine` in the `engineVersion`
      field (confirmed: same line).
- [ ] The function checks for the string `Belief Engine Profile` in the `label` field
      (confirmed: same line).
- [ ] Contains a link or reference to `/apps/humanx-belief-engine/` from the home tile.

### Belief Engine file structure (`public/apps/humanx-belief-engine/index.html`)

- [ ] `<title>` contains `Belief Engine` or equivalent heading marker.
- [ ] Page contains a visible `Belief Engine` heading or intro element (e.g. the
      `.intro-h1` div containing `Belief Engine` — confirmed present).
- [ ] Page contains questionnaire dimension labels — at least a subset of the known
      dimension label strings (e.g. `Reality & Existence`, `Truth & Evidence`,
      `Authority & Order`). These confirm the questionnaire content is present.
- [ ] Page contains a result/profile section marker — e.g. `Your Belief Architecture`
      heading or `Profile Snapshot` heading (both confirmed present).
- [ ] Page contains a `<script src="./humanx-bridge.js">` tag (confirmed present at
      line 2669). This is required for the save bridge to function.

### Bridge and metadata markers

- [ ] **Unclear:** Whether the Belief Engine HTML itself embeds the `source`,
      `engineVersion`, or `label` strings directly, or whether those values are set
      only in `humanx-bridge.js` at runtime. The static check should verify that
      `humanx-bridge.js` is referenced by a `<script src>` tag — confirming it will
      load — but should not assert the payload field values without reading
      `humanx-bridge.js`. If the bridge file is accessible, the script may optionally
      check that it contains `standalone-humanx-belief-engine` or `humanx-belief-engine`
      as a string, but this should be a soft check (warn, not fail) until confirmed.

### Security / provider-call absence

- [ ] No obvious raw API key strings are present in
      `public/apps/humanx-belief-engine/index.html` — e.g. no string matching
      `sk-`, `Bearer `, or `AIza` patterns.
- [ ] No direct Anthropic or OpenAI provider endpoint call is present in the Belief
      Engine frontend file (e.g. no `api.anthropic.com` or `api.openai.com` string).

---

## 6. What the Script Must Not Do

- **No network calls** of any kind — no `fetch`, no `http.get`, no DNS lookups.
- **No D1 or Wrangler commands** — the script is a local file reader only.
- **No live API calls** — no Worker, no HumanX production endpoints.
- **No browser automation** — no Puppeteer, Playwright, or headless browser.
- **No scoring changes** — the script reads and asserts; it does not modify logic.
- **No file edits** — the script is read-only in every sense.
- **No generated profiles** — the script does not execute Belief Engine JavaScript to
  produce a belief profile.
- **No production writes** — nothing is submitted to the live Worker or D1.

---

## 7. Expected Output

```
Belief Engine Static Check
--------------------------
  PASS: public/index.html exists and is readable
  PASS: public/app-v10.js exists and is readable
  PASS: public/apps/humanx-belief-engine/index.html exists and is readable
  PASS: public/apps/humanx-belief-engine/humanx-bridge.js exists and is readable
  PASS: main app nav contains tab-belief
  PASS: main app nav links to /apps/humanx-belief-engine/
  PASS: app-v10.js Drift classifier contains expected full-profile marker string(s)
  PASS: app-v10.js contains isFullBeliefProfile function
  PASS: app-v10.js home tile links to /apps/humanx-belief-engine/
  PASS: Belief Engine HTML contains "Belief Engine" identity marker
  PASS: Belief Engine HTML contains questionnaire marker: "Reality & Existence"
  PASS: Belief Engine HTML contains questionnaire marker: "Truth & Evidence"
  PASS: Belief Engine HTML contains questionnaire marker: "Authority & Order"
  PASS: Belief Engine HTML contains result marker: "Your Belief Architecture"
  PASS: Belief Engine HTML contains result marker: "Profile Snapshot"
  PASS: Belief Engine HTML references humanx-bridge.js via script tag
  PASS: Belief Engine HTML does not contain API key marker: "sk-ant-"
  PASS: Belief Engine HTML does not contain API key marker: "sk-proj-"
  PASS: Belief Engine HTML does not contain API key marker: "ANTHROPIC_API_KEY"
  PASS: Belief Engine HTML does not contain API key marker: "OPENAI_API_KEY"
  PASS: Belief Engine HTML does not contain API key marker: "Bearer "
  PASS: Belief Engine HTML does not contain provider API URL: "api.anthropic.com"
  PASS: Belief Engine HTML does not contain provider API URL: "api.openai.com"
  PASS: humanx-bridge.js contains bridge/profile marker(s): "standalone-humanx-belief-engine", "humanx-belief-engine", "Belief Engine Profile", "/api/belief-snapshots"
--------------------------
  24 passed, 0 failed (24 hard checks)

  All hard checks passed.
```

| Condition | Exit code |
|---|---|
| All checks pass | `0` |
| One or more static checks fail | `1` |
| A required file is missing or unreadable | `2` |

Failed checks should print a clear message naming the missing marker and the file it
was expected in, e.g.:

```
  FAIL: isFullBeliefProfile missing check for "standalone-humanx-belief-engine"
        Expected in: public/app-v10.js
```

---

## 8. Limitations

- **Does not prove the user can complete the questionnaire.** The script reads HTML; it
  cannot verify that interactions, scoring, or navigation work in a browser.
- **Does not prove scoring correctness.** Dimension weights, `CHOICE_SCALE`,
  contradiction rules, and score formulas are not exercised — see
  `docs/BELIEF_ENGINE_TEST_PLAN.md` for those.
- **Does not prove mobile layout.** No viewport or CSS check is included.
- **Does not prove the save bridge actually posts successfully.** The bridge call to
  `POST /api/belief-snapshots` is not exercised; only the `<script src>` tag presence
  is confirmed.
- **Does not replace manual Belief Engine QA.** `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md`
  and `docs/BELIEF_ENGINE_TEST_PLAN.md` must still be followed before any scoring or
  UI change is deployed.
- **Does not replace a future browser-based test.** A Playwright or similar test that
  actually drives the questionnaire will be needed before any major Belief Engine
  structural change.

---

## 9. Recommended First Implementation PR

The first implementation PR should:

- Add **only** `scripts/belief-engine-static-check.mjs`.
- Make **no changes** to any app file, Worker, migration, or existing script.
- Be small enough to review in a single pass.
- Include a manual run of the script and paste the output into the PR description as
  proof that all checks pass against the current codebase.

---

## 10. Stop Conditions

Stop and do not proceed with implementation if any of the following occur:

- **Any required app change** — the script must work against the current unmodified
  codebase; if a marker is absent that should exist, that is a finding to document,
  not a prompt to edit the app.
- **Any production call** — if an assertion cannot be made without hitting the live
  Worker, it is out of scope for this script.
- **Any D1 or Wrangler command** — the script runs with `node` only.
- **Any uncertainty about bridge payload requiring runtime testing** — mark it as
  unclear in the output and leave it as a soft/warn check; do not attempt to execute
  the bridge JavaScript.
- **Any scoring redesign request** — scoring changes belong in a separate PR with the
  full proof checklist from `docs/BELIEF_ENGINE_TEST_PLAN.md`, not in this script.
