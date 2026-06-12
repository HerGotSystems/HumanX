# D-116A — Read-Only D1 Data-Quality Audit PLAN

**Date:** 2026-06-10
**Mode:** DOCS ONLY — this is a *plan*. **No Wrangler, no D1, no production query, no mutation, no admin token, no deploy was run to produce it.**
**Repo input:** `bf53c97` · **Deployed Worker:** `3fe7ab7f-b603-407b-b7b8-31111956a3ea` · **Static baseline:** 416 / 24 / 56

> This document defines *exactly* what to inspect in production D1 **later**, as read-only `SELECT`/`COUNT` queries. It executes nothing. Running the queries requires a separate, explicitly-authorised task (D-116B or later).

---

## 0. Scope, Safety & Run Mechanics (for the future authorised run)

- **Read-only only.** Every query below is `SELECT` / `COUNT` / `GROUP BY`. **No `INSERT`/`UPDATE`/`DELETE`/`ALTER`/`DROP`/migration appears anywhere in this plan.**
- **Database:** `humanx` (binding `DB`, `database_id f68709d8…125`).
- **Intended later run command (NOT run now):** `npx wrangler d1 execute humanx --remote --command "<SELECT …>"` — read-only by construction. Prefer `--json` for parsing. **Do not** use `--file` with anything but read-only SELECTs.
- **No admin token is needed** for D1 reads via Wrangler (Cloudflare account auth handles it) — and no token is to be pasted anywhere regardless.
- **Result handling:** treat returned rows as potentially sensitive content; do not paste raw user PII; summarise counts/shapes. If any embarrassing public artefact is found, record its **ID only** plus a short description, not the full content.
- **All `LIMIT`ed** to bound output; counts are aggregate.

### SQLite/D1 dialect notes
- Scheme/shape checks on `source_url` use `LIKE` / `lower()` (D1 = SQLite). `LIKE` is case-insensitive for ASCII by default; use `lower()` where a scheme might be mixed-case.
- `COALESCE(col,'fallback')` mirrors the Worker's `COALESCE(review_state,'public')` public-visibility logic — reuse it so audit counts match live behavior.

---

## A. Claims — by review_state / status / category

| # | Query | Risk | Proves |
|---|---|---|---|
| A1 | `SELECT COALESCE(review_state,'public') AS rs, COUNT(*) n FROM claims GROUP BY rs ORDER BY n DESC;` | 🟢 none | Distribution of claim visibility states (public/review/rejected/archived/duplicate) |
| A2 | `SELECT status, COUNT(*) n FROM claims GROUP BY status ORDER BY n DESC;` | 🟢 | Verdict/status spread (Proven/Plausible/… / null) |
| A3 | `SELECT COALESCE(category,'(none)') c, COUNT(*) n FROM claims GROUP BY c ORDER BY n DESC LIMIT 40;` | 🟢 | Category coverage + junk/empty categories |
| A4 | `SELECT COUNT(*) total, SUM(CASE WHEN report_count>0 THEN 1 ELSE 0 END) reported, SUM(CASE WHEN status_locked=1 THEN 1 ELSE 0 END) locked FROM claims;` | 🟢 | Totals + reported/locked counts |

---

## B. Truths — by review_state / category / origin / type

| # | Query | Risk | Proves |
|---|---|---|---|
| B1 | `SELECT COALESCE(review_state,'public') rs, COUNT(*) n FROM truths GROUP BY rs ORDER BY n DESC;` | 🟢 | Truth visibility distribution |
| B2 | `SELECT COALESCE(truth_type,'(none)') tt, COUNT(*) n FROM truths GROUP BY tt ORDER BY n DESC;` | 🟢 | Truth-type spread (common/religious/political/…/personal-belief) |
| B3 | `SELECT COALESCE(origin,'(none)') o, COUNT(*) n FROM truths GROUP BY o ORDER BY n DESC LIMIT 40;` | 🟢 | Origin field hygiene |
| B4 | `SELECT COALESCE(category,'(none)') c, COUNT(*) n FROM truths GROUP BY c ORDER BY n DESC LIMIT 40;` | 🟢 | Category hygiene |
| B5 | `SELECT id, statement FROM truths WHERE length(trim(statement))<4 OR statement IS NULL LIMIT 50;` | 🟡 (content) | Stub/empty truth artefacts (matches `isTruthArtifact` length rule) |
| B6 | `SELECT COUNT(*) n FROM truths WHERE linked_claim_id IS NOT NULL;` | 🟢 | How many truths have a derived claim |

---

## C. Evidence — by review_state / quality / source_url shape

| # | Query | Risk | Proves |
|---|---|---|---|
| C1 | `SELECT COALESCE(review_state,'public') rs, COUNT(*) n FROM evidence GROUP BY rs ORDER BY n DESC;` | 🟢 | Evidence visibility distribution |
| C2 | `SELECT COALESCE(quality,'(none)') q, COUNT(*) n FROM evidence GROUP BY q ORDER BY n DESC;` | 🟢 | Quality-tier spread (repeatable/documented/media/testimony/vibes/null) |
| C3 | `SELECT COALESCE(stance,'(none)') s, COUNT(*) n FROM evidence GROUP BY s ORDER BY n DESC;` | 🟢 | Support vs pressure/attack balance |
| C4 | `SELECT COALESCE(source_domain,'(none)') d, COUNT(*) n FROM evidence GROUP BY d ORDER BY n DESC LIMIT 40;` | 🟡 | Source-domain concentration (if `source_domain` populated) |

---

## D. Legacy `source_url` shape (the D-104/D-107 follow-up — highest-value)

> D-104B (render) + D-104F (storage) + D-107B (Review render) made all *live render paths* and *future writes* http/https-only, but **legacy rows were never cleaned**. This section quantifies that exposure read-only. **No remediation here.**

| # | Query | Risk | Proves |
|---|---|---|---|
| D1q | `SELECT COUNT(*) n FROM evidence WHERE source_url IS NULL OR trim(source_url)='';` | 🟢 | Count of empty/no-source rows |
| D2q | `SELECT COUNT(*) n FROM evidence WHERE lower(source_url) LIKE 'http://%' OR lower(source_url) LIKE 'https://%';` | 🟢 | Count of valid http/https sources |
| D3q | `SELECT id, substr(source_url,1,40) AS head FROM evidence WHERE source_url IS NOT NULL AND trim(source_url)<>'' AND lower(source_url) NOT LIKE 'http://%' AND lower(source_url) NOT LIKE 'https://%' LIMIT 100;` | 🔴 **flag** | **Non-http(s) / malformed / scheme-less source rows** — the legacy XSS-shaped values (ID + truncated head only) |
| D4q | `SELECT COUNT(*) n FROM evidence WHERE lower(source_url) LIKE 'javascript:%' OR lower(source_url) LIKE 'data:%' OR lower(source_url) LIKE 'vbscript:%' OR lower(source_url) LIKE 'blob:%' OR lower(source_url) LIKE 'file:%';` | 🔴 **flag** | Count of dangerous-scheme legacy rows specifically |
| D5q | `SELECT COUNT(*) n FROM evidence WHERE source_url LIKE '//%';` | 🟡 | Protocol-relative legacy rows |

**Interpretation:** D2q+D1q should account for the vast majority. Any rows in D3q/D4q/D5q are display-safe today (render guards) but are candidates for a *future, separately-authorised, exact-ID* remediation — **never bulk, never in this audit**.

---

## E. Reports — open/closed & report_count hotspots

| # | Query | Risk | Proves |
|---|---|---|---|
| E1 | `SELECT COALESCE(status,'(none)') s, COUNT(*) n FROM reports GROUP BY s ORDER BY n DESC;` | 🟢 | Open vs closed/rejected report backlog |
| E2 | `SELECT target_type, COUNT(*) n FROM reports WHERE status='open' GROUP BY target_type ORDER BY n DESC;` | 🟢 | What kind of content is being reported |
| E3 | `SELECT target_type, target_id, COUNT(*) n FROM reports WHERE status='open' GROUP BY target_type,target_id ORDER BY n DESC LIMIT 25;` | 🟡 | Most-reported items (hotspots) — IDs only |
| E4 | `SELECT id, claim FROM claims WHERE report_count>=3 ORDER BY report_count DESC LIMIT 25;` | 🟡 (content) | High report_count claims needing moderator attention |

---

## F. Archived / rejected / smoke / test artefacts

| # | Query | Risk | Proves |
|---|---|---|---|
| F1 | `SELECT COUNT(*) n FROM claims WHERE review_state IN ('archived','rejected');` | 🟢 | Archived/rejected claim volume |
| F2 | `SELECT COUNT(*) n FROM truths WHERE review_state IN ('archived','rejected');` | 🟢 | Archived/rejected truth volume |
| F3 | `SELECT id, claim FROM claims WHERE lower(claim) LIKE '%sniff%' OR lower(claim) LIKE '%test%' OR lower(claim) LIKE '%demo%' OR lower(claim) LIKE '%smoke%' LIMIT 50;` | 🟡 (content) | Known smoke/test artefacts (e.g. `Sniff / Sniff Butt`) — confirm whether any are still **public** |
| F4 | `SELECT id, title FROM home_tests WHERE lower(title) LIKE '%sniff%' OR lower(instructions) LIKE '%sniff%' LIMIT 20;` | 🟡 | The known `Sniff / Sniff Butt` home-test marker location |

---

## G. Duplicate / near-duplicate rows

| # | Query | Risk | Proves |
|---|---|---|---|
| G1 | `SELECT COUNT(*) n FROM claims WHERE review_state='duplicate';` | 🟢 | Marked-duplicate claim count |
| G2 | `SELECT COUNT(*) n FROM claims WHERE near_duplicate_of IS NOT NULL;` | 🟢 | Advisory near-duplicate count |
| G3 | `SELECT normalized_claim, COUNT(*) n FROM claims WHERE normalized_claim IS NOT NULL GROUP BY normalized_claim HAVING n>1 ORDER BY n DESC LIMIT 25;` | 🟡 | Residual normalized-claim collisions (post-0004 unique index — should be ~0) |
| G4 | `SELECT COUNT(*) n FROM duplicate_signatures;` | 🟢 | Evidence dup-signature table size |

---

## H. Link tables — truth↔claim, evidence↔claim

| # | Query | Risk | Proves |
|---|---|---|---|
| H1 | `SELECT COUNT(*) n FROM truth_claim_links;` | 🟢 | Truth→claim bridge volume |
| H2 | `SELECT COUNT(*) n FROM evidence_claim_links;` | 🟢 | Reused-evidence link volume |
| H3 | `SELECT COUNT(*) orphan FROM evidence_claim_links l LEFT JOIN evidence e ON e.id=l.evidence_id WHERE e.id IS NULL;` | 🟡 | Orphaned reuse links (referential integrity) |
| H4 | `SELECT COUNT(*) orphan FROM truth_claim_links l LEFT JOIN claims c ON c.id=l.claim_id WHERE c.id IS NULL;` | 🟡 | Orphaned truth→claim links |

---

## I. Belief snapshots — count / size / latest

| # | Query | Risk | Proves |
|---|---|---|---|
| I1 | `SELECT COUNT(*) n FROM belief_snapshots;` | 🟢 | Total snapshots |
| I2 | `SELECT COUNT(*) full FROM belief_snapshots WHERE belief_count>=77;` | 🟢 | Full 77-statement profiles vs quick records |
| I3 | `SELECT id, label, engine_version, belief_count, length(raw_json) bytes, created_at FROM belief_snapshots ORDER BY created_at DESC LIMIT 10;` | 🟡 | Latest snapshots + per-row JSON size (growth/bloat signal) |
| I4 | `SELECT MAX(length(raw_json)) max_bytes, AVG(length(raw_json)) avg_bytes FROM belief_snapshots;` | 🟢 | Largest/avg snapshot payload (D1 row-size risk) |

---

## J. RunPack / aip_packets — count & growth risk

| # | Query | Risk | Proves |
|---|---|---|---|
| J1 | `SELECT COUNT(*) n FROM aip_packets;` | 🟢 | Total stored packets (grows on every Build RunPack) |
| J2 | `SELECT MAX(length(packet_json)) max_bytes, AVG(length(packet_json)) avg_bytes FROM aip_packets;` | 🟢 | Packet payload size (storage growth risk) |
| J3 | `SELECT claim_id, COUNT(*) n FROM aip_packets GROUP BY claim_id ORDER BY n DESC LIMIT 15;` | 🟢 | Packet accumulation per claim (unbounded re-build growth?) |
| J4 | `SELECT COUNT(*) n FROM aip_packets WHERE created_at < (strftime('%s','now')-7776000)*1000;` | 🟢 | Packets older than ~90 days (future retention decision input) |

---

## K. Latest public rows visible to users (embarrassing-artefact check)

| # | Query | Risk | Proves |
|---|---|---|---|
| K1 | `SELECT id, claim, status, category FROM claims WHERE COALESCE(review_state,'public')='public' ORDER BY created_at DESC LIMIT 25;` | 🟡 (content) | What a visitor sees first on Claims — scan for test/embarrassing artefacts |
| K2 | `SELECT id, statement, truth_type, category FROM truths WHERE COALESCE(review_state,'public')='public' ORDER BY created_at DESC LIMIT 25;` | 🟡 | Latest public Truths — same scan |
| K3 | `SELECT id, title, substr(source_url,1,50) src FROM evidence WHERE COALESCE(review_state,'public')='public' ORDER BY created_at DESC LIMIT 25;` | 🟡 | Latest public evidence + source shape |

---

## L. Latest pending review rows

| # | Query | Risk | Proves |
|---|---|---|---|
| L1 | `SELECT id, claim, review_state FROM claims WHERE COALESCE(review_state,'public') NOT IN ('public','archived','duplicate') ORDER BY updated_at DESC LIMIT 25;` | 🟡 | Pending claim backlog the moderator faces |
| L2 | `SELECT id, statement, review_state FROM truths WHERE COALESCE(review_state,'public') NOT IN ('public','archived') ORDER BY updated_at DESC LIMIT 25;` | 🟡 | Pending truth backlog |
| L3 | `SELECT id, title, review_state FROM evidence WHERE COALESCE(review_state,'public') NOT IN ('public','archived') ORDER BY created_at DESC LIMIT 25;` | 🟡 | Pending evidence backlog |

> Note: `clm_30889d651e3b4b2cb6` (`SMALL INDEFERENT TRUTH`-derived claim) is expected to still appear pending per the standing moderation state — its presence here is **expected, not a finding**.

---

## M. Risk Legend

- 🟢 **none** — pure aggregate counts; no content, no PII. Safe to run and to summarise freely.
- 🟡 **content/PII** — returns row content or IDs; safe to run read-only, but summarise (counts + IDs), do not paste full user text/PII.
- 🔴 **flag** — read-only but surfaces security-relevant legacy data (non-http(s) source rows); record **ID + truncated head only**, never the full value; feeds a *future* exact-ID remediation decision, not this audit.

---

## N. What Is Safe to Run Later (when authorised)

All queries A–L are **read-only and safe** under an explicit D-116B authorisation. Recommended order when run:
1. Aggregate-only first (all 🟢): A1–A4, B1–B4/B6, C1–C3, E1–E2, F1–F2, G1–G2/G4, H1–H2, I1–I2/I4, J1–J4.
2. Then the legacy-source shape (D1q–D5q) — the headline data-quality/security question.
3. Then content/ID samples (🟡): B5, C4, E3–E4, F3–F4, G3, H3–H4, I3, K1–K3, L1–L3.

---

## O. Explicit Stop Conditions (for the future run)

Stop and report immediately (do **not** continue or attempt any fix) if any of these occur:
1. Any query errors referencing a **missing table/column** → schema drift; reconcile before proceeding.
2. D4q returns **> 0** dangerous-scheme rows → record IDs, stop, escalate to a separate remediation-planning task (no fix in the audit run).
3. K1/K2 surface an **embarrassing public artefact** → record ID + description, stop public-row scanning, flag for moderator action via the normal Review UI (exact-ID).
4. Any query would need to be rewritten as anything other than `SELECT`/`COUNT` → **do not run it**; it is out of scope.
5. Result volume is unexpectedly huge (e.g. counts orders of magnitude beyond expectation) → stop, re-confirm you are on the intended `humanx` DB.

---

## P. Explicit Non-Inclusion Statement

> This plan contains **no** `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`, `CREATE`, migration, cleanup, archive, approve/reject, or any other mutating statement. Every query is read-only `SELECT`/`COUNT`/`GROUP BY` with `LIMIT`s. Producing this plan ran **no** Wrangler command, **no** D1 query, **no** production access, **no** admin token, and **no** deploy. Executing the queries is a separate, explicitly-authorised future task (D-116B); even then, only read-only SELECTs are permitted and **no remediation/cleanup/migration is included**.

---

## Q. Confirmation (this task)

> Docs-only. No Wrangler, no D1, no production query, no data mutation, no admin token, no deploy. Repo unchanged except this plan document.
