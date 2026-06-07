# D-77: Launch Seed Claims v2 JSON Proposal

Date: 2026-06-07
Branch: feature/d77-launch-seed-v2-json
Type: Branch + PR. No direct main commit.
No code changes. No D1 commands. No Wrangler. No import routes called. No production mutations.

---

## 1. Summary

D-77 creates `data/seed_claims_v2.json` — the executable launch seed file containing the 5
claims that passed the full human review cycle (D-76A through D-76D).

All 5 claims carry `APPROVE_FOR_D76` from human review. Gate was recorded as
`UNBLOCKED_FOR_D77` in `docs/D76D_FINAL_REVIEW_APPROVAL.md`.

This PR is **file creation only**. No import route is called in this step. No D1 commands are
issued. D-78 (dry-run import) requires a separate explicit per-session approval.

---

## 2. File Created

`data/seed_claims_v2.json`

- Top-level wrapper: `version: 2`, `updated: 2026-06-07`, `metadata` block
- 5 claim objects using `src/seed-data.js` importer field shape
- All `source_url` values copied exactly from D-74 / D-76D approved records
- Zero SOURCE_NEEDED placeholders
- Zero blank `source_url` fields
- `review_state_intended` in top-level metadata only (not in claim objects)
- D-59 SOURCE_NEEDED guard will pass on dry-run

---

## 3. Claim Summary

| seed_id | Claim | Status | Evidence | Pressure |
|---------|-------|--------|----------|---------|
| `launch-B5` | The Holocaust resulted in the murder of approximately six million Jews | Proven | 2 | 1 |
| `launch-A1` | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism | Strongly Supported | 2 | 1 |
| `launch-A4` | Rising CO2 levels from human activity are the primary driver of observed global warming | Proven | 2 | 1 |
| `launch-C1` | Online platform recommendation systems can use engagement signals that influence which information spreads widely | Plausible | 2 | 1 |
| `launch-D2` | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy | Proven | 2 | 0 |

Total evidence items: 10
Total pressure items: 4

---

## 4. Source URLs

All source URLs verified during D-66 through D-73 source research and locked in D-74.
No URLs were changed in D-76C or D-76D.

| seed_id | Slot | URL | Score |
|---------|------|-----|-------|
| launch-B5 | ev[0] | https://avalon.law.yale.edu/imt/wannsee.asp | 85 |
| launch-B5 | ev[1] | https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution | 82 |
| launch-B5 | pr[0] | https://encyclopedia.ushmm.org/content/en/article/antisemitism | 78 |
| launch-A1 | ev[0] | https://pubmed.ncbi.nlm.nih.gov/22336803/ | 85 |
| launch-A1 | ev[1] | https://pubmed.ncbi.nlm.nih.gov/12421889/ | 84 |
| launch-A1 | pr[0] | https://pubmed.ncbi.nlm.nih.gov/21209060/ | 72 |
| launch-A4 | ev[0] | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ | 90 |
| launch-A4 | ev[1] | https://science.nasa.gov/climate-change/causes | 82 |
| launch-A4 | pr[0] | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ | 90 |
| launch-C1 | ev[0] | https://pubmed.ncbi.nlm.nih.gov/29590045/ | 86 |
| launch-C1 | ev[1] | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ | 55 |
| launch-C1 | pr[0] | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ | 55 |
| launch-D2 | ev[0] | https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117 | 87 |
| launch-D2 | ev[1] | https://www.cdc.gov/sleep/about/index.html | 80 |

---

## 5. Field Shape Compliance

Fields match `src/seed-data.js` importer shape:

| JSON field | Importer field | Status |
|------------|---------------|--------|
| `seed_id` | `seed_id` | ✅ |
| `claim` | `claim` | ✅ |
| `category` | `category` | ✅ |
| `type` | `type` | ✅ |
| `status` | `status` | ✅ |
| `evidence_score` | `evidence_score` | ✅ — null (recalculated post-import) |
| `testability` | `testability` | ✅ — null (recalculated post-import) |
| `survivability` | `survivability` | ✅ — null (recalculated post-import) |
| `evidence[]` | `evidence[]` | ✅ |
| `evidence[].stance` | `stance` | ✅ |
| `evidence[].quality` | `quality` | ✅ |
| `evidence[].title` | `title` | ✅ |
| `evidence[].body` | `body` | ✅ |
| `evidence[].source_url` | `source_url` | ✅ |
| `evidence[].media_type` | `media_type` | ✅ |
| `evidence[].reliability_score` | `reliability_score` | ✅ |
| `pressure[]` | `pressure[]` | ✅ |
| `pressure[].title` | `title` | ✅ |
| `pressure[].body` | `body` | ✅ |
| `pressure[].severity` | `severity` | ✅ |
| `tests[]` | `tests[]` | ✅ — all empty arrays |

Extended pressure fields (`source_url`, `stance`, `quality`, `reliability_score`) are
preserved for provenance. Importer ignores unknown fields — these do not cause errors.

---

## 6. Human Review Provenance

| seed_id | Review decision | Reviewer | Round |
|---------|----------------|---------|-------|
| `launch-B5` | APPROVE_FOR_D76 | ChatGPT (human-supervised) | D-76B |
| `launch-A1` | APPROVE_FOR_D76 (after edit) | ChatGPT (human-supervised) | D-76D |
| `launch-A4` | APPROVE_FOR_D76 | ChatGPT (human-supervised) | D-76B |
| `launch-C1` | APPROVE_FOR_D76 (after edit) | ChatGPT (human-supervised) | D-76D |
| `launch-D2` | APPROVE_FOR_D76 | ChatGPT (human-supervised) | D-76B |

---

## 7. D-78 / D-79 Gate (Next Steps)

| Step | Action | Gate |
|------|--------|------|
| D-78 | `GET /api/import-seed?mode=dry-run` | Explicit per-session approval required |
| D-79 | `GET /api/import-seed?mode=apply` | Separate explicit per-session D1/write approval required |

**Do not call any import route until D-78 approval is granted in a new session.**

---

## 8. Safety

| Rule | Status |
|------|--------|
| Branch + PR (no direct main commit) | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No frontend changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| Zero SOURCE_NEEDED in any evidence source_url | ✅ Confirmed — node validation passed |
| review_state_intended not on claim objects | ✅ Confirmed — in top-level metadata only |
| Static checks 119/24/39 | ✅ Confirmed |

---

## D-77 Completion Record

| Item | Status |
|------|--------|
| `data/seed_claims_v2.json` created on branch | ✅ |
| JSON valid (node parse check) | ✅ |
| 5 claims present (B-5, A-1, A-4, C-1, D-2) | ✅ |
| SOURCE_NEEDED guard check passed | ✅ |
| Field shape matches src/seed-data.js | ✅ |
| `docs/D77_LAUNCH_SEED_V2_JSON_PROPOSAL.md` created | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| Branch pushed | ✅ |
| PR opened | ✅ |
| No import route called | ✅ |
| No D1/Wrangler/live writes | ✅ |
