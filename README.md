# HumanX

**Map personal belief. Record what gets repeated as fact. Pressure-test public claims with evidence.**

HumanX organises what people assert and what challenges those assertions. It does not decide what is true — it tracks the structure of claims and the evidence attached to them.

Live app → **[humanx.rinkimirikata.com](https://humanx.rinkimirikata.com)**

---

## What it does

| Stage | What happens |
|-------|-------------|
| **Beliefs** | Record personal belief structure using the 77-statement Belief Engine. Maps source, identity load, inheritance, and pressure. |
| **Truths** | Record statements that circulate as fact — slogans, doctrines, inherited certainties. These are not automatically verified by HumanX. |
| **Claims** | Submit a precise, testable public statement. Claims enter moderation before becoming public. |
| **Evidence** | Attach supporting sources or pressure attacks to any claim. Evidence is reusable across multiple claims. |
| **RunPack** | Export a structured evidence packet for any claim. Paste into any AI for external analysis. No owner API credits used. |

---

## The pipeline

```
Beliefs → Truths → Claims → Evidence → RunPack → AI analysis
```

Every stage is pseudonymous. No account or email required.

New claims and truths enter admin **Review** before going public. HumanX does not surface unreviewed content to other users.

---

## Key concepts

**Truths** are widely-repeated statements — not facts verified by HumanX. The name reflects common usage ("everyone knows this is true"), not an assertion that HumanX has confirmed correctness. They can be converted into pressure-testable Claims.

**Claims** are public, testable statements. Evidence Score, Testability, and Survivability scores reflect what has been submitted — not an automated verdict.

**RunPack** is a portable evidence and investigation packet. It does not use owner API credits. The user pastes it into their own AI.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS (`public/app-v10.js`), single CSS file |
| Backend | Cloudflare Workers (`src/worker.js`) |
| Database | Cloudflare D1 (SQLite) |
| Static hosting | Cloudflare Pages |
| Belief Engine | Standalone HTML/JS app (`public/apps/humanx-belief-engine/`) |

---

## Local static checks

```sh
node --check public/app-v10.js
node scripts/hardening-smoke-test.mjs
node scripts/belief-engine-static-check.mjs
node scripts/worker-route-static-check.mjs
```

Expected: 77 / 24 / 35 passed, 0 failed.

---

## Repo notes

- Do not rerun `migrations/0004_unique_normalized_content.sql` — already applied to production.
- Do not run Wrangler or D1 commands without explicit approval.
- No live write smoke tests without explicit per-session approval.
- PHUL / AI-use policy files (`robots.txt`, `llms.txt`, `ai.txt`, `LICENSE-PHUL.txt`, `_headers`) remain in the repo root and are served as-is.

---

© EMVY CHECK / Michal Veltruský — see `LICENSE-PHUL.txt`
