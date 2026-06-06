# D-54: Seed Data Inventory and Classification

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes. No D1 commands. No data mutations.

---

## Purpose

Read-only inventory of all seed and database files in the repo. Classifies each seed claim
and truth against the launch quality framework defined in D-53. Identifies which SQL files
are schema definitions vs. import artefacts. Produces a gap summary and recommendations for
D-55 (launch seed pack draft).

No files are edited. No D1 commands are run. No data is imported, archived, or deleted.

---

## Part 1 — File Inventory

### Seed content files

| File | Type | Contents | Import path | Production import status |
|------|------|----------|-------------|--------------------------|
| `data/seed_claims_v1.json` | JSON | 4 seed claims with evidence, pressure, home tests | Read by `src/seed-data.js` (JS re-export of same data) | Canonical source — not directly imported; `src/seed-data.js` is the runtime version |
| `data/seed_truths_v1.json` | JSON | 12 seed truth statements | Read by `src/truth-seed.js` (JS re-export) | Canonical source — not directly imported |
| `src/seed-data.js` | JS module | `HUMANX_SEED` export — 4 claims, same as JSON | Imported by `src/importer.js` → `GET /api/import-seed` (admin-only) | **Confirmed import path** — callable via authenticated admin route |
| `src/truth-seed.js` | JS module | `SEED_TRUTHS` array + `importTruthSeeds()` function — 12 truths | Imported by `src/worker.js` → `GET /api/import-truths` (admin-only) | **Confirmed import path** — callable via authenticated admin route |
| `src/importer.js` | JS module | `importSeedData(env)` — iterates `HUMANX_SEED.claims`, inserts claims/evidence/pressure/tests | Called from `GET /api/import-seed` | **Confirmed** — imports claims as `review_state='public'`, evidence without `review_state` field |

### Import route summary

| Route | Method | Auth | Function | Inserts as |
|-------|--------|------|----------|------------|
| `GET /api/seed` | GET | None (public) | `seedDemoClaims()` — inserts only the 3 `demoClaims()` fallback entries if DB is empty | `review_state='public'` |
| `GET /api/import-seed` | GET | Admin token | `importSeedData(env)` — full 4-claim seed from `HUMANX_SEED` | Claims: `review_state='public'`; evidence: no `review_state` set (defaults to column default) |
| `GET /api/import-truths` | GET | Admin token | `importTruthSeeds(env)` — 12 truths from `SEED_TRUTHS` | `review_state='public'` |

**Key finding:** Both admin import routes insert directly as `review_state='public'`, bypassing
the moderation queue. This is intentional for seed content but means any future seed pack
must be carefully reviewed before import — once imported as public, items are immediately
visible to all users without an approval step.

**Key finding:** `GET /api/seed` (no auth) inserts from `demoClaims()` — the hardcoded
3-item fallback in `worker.js`, not the full `HUMANX_SEED`. It fires only when `claims`
table is empty. This is the bootstrap safety valve.

### Database schema SQL files (`database/`)

| File | Type | Contents | Production relevance |
|------|------|----------|---------------------|
| `database/humanx_d1_schema_v1.sql` | Schema definition | `users`, `claims`, `evidence`, `pressure_points`, `rate_limits` tables + indexes | Historical baseline — superseded by migrations 0001–0007; do not re-run on production |
| `database/humanx_d1_schema_v2_upgrade.sql` | Schema upgrade | `claim_votes`, `evidence_votes`, `home_tests`, `aip_packets`, `reports`, `users` columns | Historical upgrade snapshot — superseded by migrations; do not re-run on production |
| `database/humanx_truths_v1.sql` | Schema definition | `truths`, `truth_votes` tables + indexes | Historical — `truths` table created via production migrations; do not re-run |
| `database/humanx_truth_claim_bridge_v1.sql` | Schema definition + ALTER | `truth_claim_links` table; `ALTER TABLE truths ADD COLUMN converted_claim_count` | Historical — contains ALTER that would fail if column already exists; do not re-run |
| `database/humanx_claim_normalized_key_v1.sql` | Schema + backfill | `ALTER TABLE claims ADD COLUMN normalized_claim`; index; UPDATE backfill query | **Production risk:** contains an ALTER + UPDATE backfill — applied historically; do not re-run; column and index are live |
| `database/humanx_evidence_reuse_v1.sql` | Schema definition | `evidence_claim_links` table + indexes | Historical — table created via production migrations; do not re-run |
| `database/humanx_analysis_results_v1.sql` | Schema definition | `analysis_results` table + indexes | Historical — table created via production migrations; do not re-run |
| `database/humanx_belief_snapshots_v1.sql` | Schema definition | `belief_snapshots` table + indexes | Historical — table created via production migrations; do not re-run |

**All `database/` SQL files are historical schema snapshots and upgrade scripts. None contain
row-level seed INSERT data. None should be re-executed against production.**

---

## Part 2 — Claim Seed Classification

### Classification key (from D-53)

| Tag | Meaning |
|----|---------|
| `launch-candidate` | Passes all launch quality criteria; suitable for public first impression |
| `add-sources` | Good structure; just needs real `source_url` entries |
| `demo-only` | Engine-test quality; not suitable as a public first impression |
| `rewrite` | Claim text or framing needs revision before launch |
| `archive-before-launch` | Should be set to `review_state='archived'` before public launch |

---

### Claim 1: "The Earth is flat"

| Field | Value |
|-------|-------|
| Seed ID | `seed-flat-earth` |
| Category | Cosmology |
| Type | Physical/Testable |
| Status target | Disproven |
| Evidence count | 2 |
| Evidence quality labels | `media`, `vibes` |
| Source URLs | `` (both empty) |
| Pressure points | 4 (severity 4–5) |
| Home tests | 2 |

**Evidence detail:**

| Title | Quality | Source URL |
|-------|---------|-----------|
| Local horizon often appears flat | `media` | *(empty)* |
| Water-level phrase argument | `vibes` | *(empty)* |

**Assessment:**

The claim is structurally excellent — four pressure points with high severity, two home tests,
evidence covering two quality tiers including the intentionally low-quality `vibes` entry that
demonstrates the scoring scale. The pressure body text is well-written and engine-pedagogical.

The problem is the first-impression signal. "The Earth is flat" is the canonical conspiracy-
theory test case. For a visitor arriving at HumanX for the first time with no prior context,
seeing flat-earth as the first claim reads as sensationalist. It works perfectly as a
**demonstration claim** for the evidence engine but not as a launch-front-page claim.

No `source_url` on either evidence item.

**Classification: `demo-only`**
**Reason:** Strong engine test; weak first impression. Keep in DB as demo; do not feature prominently on launch day. Add sources if retained for public browsing.

---

### Claim 2: "Humans landed on the Moon"

| Field | Value |
|-------|-------|
| Seed ID | `seed-moon-landing` |
| Category | History/Space |
| Type | Historical |
| Status target | Strongly Supported |
| Evidence count | 3 |
| Evidence quality labels | `documented`, `repeatable`, `documented` |
| Source URLs | `` (all empty) |
| Pressure points | 2 (severity 3–4) |
| Home tests | 1 |

**Evidence detail:**

| Title | Quality | Source URL |
|-------|---------|-----------|
| Apollo mission documentation chain | `documented` | *(empty)* |
| Lunar retroreflector experiments | `repeatable` | *(empty)* |
| Moon rocks and sample analysis | `documented` | *(empty)* |

**Assessment:**

This is the best-quality seed claim by structure. Three evidence items spanning `documented`
and `repeatable` tiers, appropriate pressure framing (hoax-claim burden and photo-anomaly
limits), one home test. Status target `Strongly Supported` is accurate to the evidence.
The body text is well-written and neutral in tone.

The only gap is `source_url: ''` on all three evidence items. With real URLs added
(NASA archive, retroreflector measurement papers, lunar sample studies) this becomes a
high-quality launch example showing how a well-evidenced historical claim is graded.

It also avoids the conspiracy-first signal of flat earth while still engaging with a
conspiracy-adjacent topic in a credible, evidence-led way.

**Classification: `add-sources` → `launch-candidate` after URL addition**
**Reason:** Structurally sound; needs 3 real source URLs to meet launch standard. Best current candidate for the launch seed pack.

---

### Claim 3: "A dream predicted my future"

| Field | Value |
|-------|-------|
| Seed ID | `seed-dream-prediction` |
| Category | Belief |
| Type | Religious/Belief |
| Status target | Untestable |
| Evidence count | 1 |
| Evidence quality labels | `testimony` |
| Source URLs | `` (empty) |
| Pressure points | 2 (severity 3–4) |
| Home tests | 1 |

**Evidence detail:**

| Title | Quality | Source URL |
|-------|---------|-----------|
| Personal testimony | `testimony` | *(empty)* |

**Assessment:**

A legitimate claim type — `Religious/Belief` / `Untestable` — that demonstrates the platform
does not dismiss personal or belief claims but grades them honestly. The framing is empathetic
("may matter emotionally") and the home test (timestamped dream log) is constructive.

The risks: only one evidence item (thin for launch); the framing can read as dismissive of
personal experience without the platform context; `Untestable` as a status label may feel
like a verdict rather than a category to a new visitor.

This claim is close to launch-ready for the `Untestable` / belief category if the body text
framing is preserved. It needs one more evidence item (the phenomenon of memory distortion
as documented research would strengthen it) and a real source URL.

**Classification: `add-sources` (stretch: one more evidence item)**
**Reason:** Good belief-category representative; needs at least 1 real source URL; optionally one more evidence item to avoid looking sparse. Not a first-banner claim but valid in the browseable set.

---

### Claim 4: "Perpetual motion machines can produce free energy forever"

| Field | Value |
|-------|-------|
| Seed ID | `seed-perpetual-motion` |
| Category | Physics |
| Type | Physical/Testable |
| Status target | Reality Collapse |
| Evidence count | 1 |
| Evidence quality labels | `media` |
| Source URLs | `` (empty) |
| Pressure points | 3 (all severity 5) |
| Home tests | 1 |

**Evidence detail:**

| Title | Quality | Source URL |
|-------|---------|-----------|
| Video demonstrations of magnet wheels | `media` | *(empty)* |

**Assessment:**

The structural purpose of this seed is to demonstrate `Reality Collapse` — the verdict tier
for claims that fail under the weight of pressure against weak evidence. Three maximum-
severity pressure points against a single low-quality (`media`) evidence item is a correct
rendering of the claim's actual epistemic status.

The problem is that `Reality Collapse` is an unusual and potentially confusing status label
for a new visitor who has not read the scoring guide. "Perpetual motion machines can produce
free energy forever" is also a long, awkward claim text that does not model good claim-writing.

This claim serves the engine well as a demonstration of the lower end of the scoring scale.
It is not appropriate as a first-impression launch claim.

**Classification: `demo-only`**
**Reason:** Demonstrates `Reality Collapse` verdict tier; good for engine testing; not suitable for public front page. Claim text is awkward and the verdict label is unexplained for newcomers.

---

### Claim summary

| Claim | Classification | Source URLs | Priority |
|-------|---------------|-------------|----------|
| The Earth is flat | `demo-only` | 0 / 2 | Not featured at launch |
| Humans landed on the Moon | `add-sources` → `launch-candidate` | 0 / 3 | Add 3 URLs; include in launch pack |
| A dream predicted my future | `add-sources` | 0 / 1 | Add 1 URL; include in browseable set |
| Perpetual motion machines… | `demo-only` | 0 / 1 | Not featured at launch |

**Source URL coverage: 0 / 7 evidence items (0%)**

---

## Part 3 — Truth Seed Classification

All 12 truths are inherited sayings, slogans, or common assertions. They are not factual
claims — the platform correctly labels them `confidence_label: 'claimed'`. The classification
below assesses launch framing risk for a first-time visitor.

### Classification key

| Tag | Meaning |
|----|---------|
| `launch-candidate` | Appropriate for launch; framing is clear even without platform context |
| `needs-framing` | Legitimate truth type; needs visible category/origin display to avoid being misread as HumanX's position |
| `demo-only` | Works for engine testing; too blunt or provocative for first impression |
| `archive-before-launch` | Recommend archiving before public launch |

---

| # | Statement | Category | Type | Risk / framing issue | Classification |
|---|-----------|----------|------|---------------------|---------------|
| 1 | Money is evil | culture | common | Blunt absolutist framing; common enough to be recognisable | `launch-candidate` — familiar phrase, clear cultural category |
| 2 | Hard work always pays off | culture | cultural | Widely known; origin in family/school; "always" is the testable pressure point | `launch-candidate` — good entry point for testability discussion |
| 3 | Everything happens for a reason | belief | religious | Common phrase; religious/self-help origin clearly stated | `launch-candidate` — origin label defuses implicit endorsement |
| 4 | Trust the experts | institution | institutional | Paired with #5 (Never trust…); shows the platform handles opposing truths | `launch-candidate` — pair shows epistemic balance |
| 5 | Never trust the experts | institution | common | Counterpart to #4; shows both positions can coexist | `launch-candidate` — pair shows epistemic balance |
| 6 | The customer is always right | business | common | Recognisable business saying; not politically sensitive | `launch-candidate` — safe, universally known |
| 7 | Children should always obey adults | family | family | Touches child safety / authority framing — may read as normative rather than descriptive | `needs-framing` — requires visible origin label and category to signal "inherited norm being examined" not "HumanX position" |
| 8 | Science has proven it | science | scientific | Familiar misuse pattern; good example of epistemic shorthand | `launch-candidate` — demonstrates the platform's core use case |
| 9 | My religion is the only true path | religion | religious | High sensitivity; without platform context reads as HumanX positioning on religion | `needs-framing` — must display origin (`religious doctrine`) and type (`religious`) prominently; not a first-banner truth |
| 10 | People are basically good | human nature | common | Philosophical claim; mild; paired implicitly with #11 | `launch-candidate` — familiar, discussion-worthy |
| 11 | People are stupid | human nature | common | Blunt and cynical; without framing reads as endorsement of a hostile worldview | `needs-framing` — origin (`cynicism / internet`) must be visible; not a first-banner truth |
| 12 | You can be anything you want | identity | cultural | Common aspiration; familiar school/self-help origin | `launch-candidate` — safe, widely recognised |

### Truth summary

| Classification | Count | Items |
|---------------|-------|-------|
| `launch-candidate` | 9 | #1–6, #8, #10, #12 |
| `needs-framing` | 3 | #7 (children/adults), #9 (religion), #11 (people are stupid) |
| `demo-only` | 0 | — |
| `archive-before-launch` | 0 | — |

All 12 truths are import-ready structurally. The 3 flagged as `needs-framing` require the
frontend to display `origin` and `category` fields visibly on truth cards. If those fields
are displayed (confirm via live browser session), all 12 are acceptable. If origin/category
are hidden, the 3 flagged items should be imported with an explicit admin review step
before being made public.

**Note:** `importTruthSeeds()` currently inserts all 12 as `review_state='public'` in one
pass. There is no per-truth approval step. Any future import should either add an approval
pass or confirm via live session that origin/category labels are visible before import.

---

## Part 4 — SQL File Classification

| File | Classification | Action |
|------|---------------|--------|
| `database/humanx_d1_schema_v1.sql` | Schema snapshot — historical baseline | Reference only; do not re-run |
| `database/humanx_d1_schema_v2_upgrade.sql` | Schema upgrade snapshot | Reference only; do not re-run |
| `database/humanx_truths_v1.sql` | Schema definition — `truths` + `truth_votes` | Reference only; superseded by migrations |
| `database/humanx_truth_claim_bridge_v1.sql` | Schema + ALTER — `truth_claim_links`, `converted_claim_count` | **Production risk:** ALTER fails if column exists; do not re-run |
| `database/humanx_claim_normalized_key_v1.sql` | Schema + ALTER + UPDATE backfill | **Production risk:** ALTER + UPDATE; already applied; do not re-run |
| `database/humanx_evidence_reuse_v1.sql` | Schema definition — `evidence_claim_links` | Reference only; superseded by migrations |
| `database/humanx_analysis_results_v1.sql` | Schema definition — `analysis_results` | Reference only; superseded by migrations |
| `database/humanx_belief_snapshots_v1.sql` | Schema definition — `belief_snapshots` | Reference only; superseded by migrations |

**No `database/` SQL file contains row-level INSERT seed data.** All are DDL schema
definitions or ALTER/UPDATE scripts. None should be re-executed against production.

The authoritative schema is now defined by the `migrations/` sequence (0001–0007), not the
`database/` files. The `database/` directory is a historical record.

---

## Part 5 — Launch Gap Summary

| Metric | Value |
|--------|-------|
| Total seed claims | 4 |
| Launch-candidate claims (as-is) | 0 |
| Claims reaching launch-candidate after adding sources | 1 (moon landing) |
| Demo-only claims (keep, not featured) | 2 (flat earth, perpetual motion) |
| Claims needing sources + possible rewrite | 1 (dream prediction) |
| Source URL coverage across all evidence items | **0 / 7 (0%)** |
| Total seed truths | 12 |
| Launch-candidate truths | 9 |
| Truths needing visible framing (origin/category display) | 3 |
| Archive-before-launch items | 0 |

### Critical gaps

1. **Zero source URLs.** Every evidence item has `source_url: ''`. This is the single largest
   quality gap. A new visitor can read the evidence body text but cannot verify a single
   source. Adding real URLs to the moon landing claim alone would significantly raise
   credibility.

2. **No launch-ready claim pack.** The current four claims cover three categories (Cosmology,
   History/Space, Belief, Physics) but two of four are demo-only. A launch seed pack needs
   at least 4–6 new or rewritten claims across the five target categories, each with at
   least one real source URL.

3. **Truth framing dependency.** Three truths are marked `needs-framing`. Whether they are
   safe for launch depends on a live browser confirmation that `origin` and `category` fields
   are displayed on truth cards. This is a frontend verification task, not a data task.

4. **`importSeedData` sets `review_state='public'` directly.** Any new seed pack imported via
   `GET /api/import-seed` bypasses the moderation queue. The import route must either be run
   only after admin review of the seed content, or modified to insert as `'review'` and then
   approve through the queue.

5. **`importTruthSeeds` sets `review_state='public'` directly.** Same issue for truths.

---

## Part 6 — Recommendations

### Keep all current seed items

Do not delete or hard-archive any current seed content without a specific content decision.
The four seed claims and twelve truths are reasonable engine-demonstration content.
The issue is curation and framing, not safety.

### Separate demo seeds from launch-public seeds

The launch seed pack (D-55) should be a **new set** of 4–6 claims written to launch
quality standards. The existing four claims can remain in the database as browseable content
— they do not need to be the first things a new visitor sees if the UI presents claims in
order of submission date or score, not seed order.

### Add sources to moon landing before launch

The moon landing claim is one URL addition per evidence item away from being a strong launch
example. This is the highest-ROI seed improvement before launch.

Real source candidates (to be confirmed in D-55):
- `Lunar Retroreflector experiments` → [lro.gsfc.nasa.gov](https://lro.gsfc.nasa.gov) or Apache Point Observatory APOLLO experiment
- `Apollo mission documentation chain` → NASA Technical Reports Server
- `Moon rocks and sample analysis` → Lunar Sample Curation portal, NASA JSC

### Confirm truth framing in live UI before truth import

Before running `GET /api/import-truths` on production (if not already run), confirm in a
live browser session that truth cards display `origin` and `category` fields visibly.
If they are hidden, the 3 `needs-framing` truths should be held back.

### Do not modify import routes in D-54 or D-55

The `review_state='public'` insertion behaviour of the import routes is a separate code change
(Worker change → branch + PR). D-54 and D-55 are docs-only. Flag this as an optional D-56
or D-57 Worker change if the import route behaviour needs hardening.

### Next batches

| Batch | Type | Scope |
|-------|------|-------|
| **D-55** | Docs-only | Write proposed launch seed pack — 4–6 new claims with body text, evidence, pressure, tests, and source URL candidates. No D1 changes. |
| **D-56** | Docs-only then gated | Production seed cleanup plan — decides what to do with current seeds (keep/feature/demote), when and how to import D-55 pack, and whether to harden import routes. Execution gated by explicit D1 approval. |

---

## D-54 Completion Record

| Item | Status |
|------|--------|
| All seed/data files read: `data/`, `database/`, `src/importer.js`, `src/seed-data.js`, `src/truth-seed.js` | ✅ Done |
| Import routes identified: `/api/seed`, `/api/import-seed`, `/api/import-truths` | ✅ Done |
| `review_state='public'` bypass confirmed for both import routes | ✅ Documented |
| 4 claims classified: 2 demo-only, 1 add-sources, 1 add-sources (near launch-candidate) | ✅ Done |
| 12 truths classified: 9 launch-candidate, 3 needs-framing, 0 archive | ✅ Done |
| 8 database/ SQL files classified: all schema snapshots, no row INSERT data | ✅ Done |
| Source URL coverage: 0 / 7 (0%) | ✅ Documented |
| Critical gaps documented | ✅ Done |
| Recommendations written | ✅ Done |
| `docs/PROJECT_STATE.md` updated | ✅ Done |
| No code changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No seed data imported / edited / deleted | ✅ Confirmed |
