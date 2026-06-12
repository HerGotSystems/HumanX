# D-118A — Moderator/Admin Journey QA PLAN

**Date:** 2026-06-12  
**Mode:** DOCS ONLY — this is a QA *plan/checklist*. No Wrangler, no D1, no production query, no admin token, no deploy, no Review action, and no mutation was performed to produce it.  
**Baseline:** main after D-117A · deployed Worker `3fe7ab7f-b603-407b-b7b8-31111956a3ea` · static 416 / 24 / 56

> This defines how to verify the moderator/admin journey later. It executes nothing. Admin-token use and any Review action require separate explicit authorisation. The admin token must never be pasted into chat, docs, issues, commits, logs, or PR bodies.

---

## 0. Authorisation & Safety Boundary

| Action | Allowed without explicit approval? |
|---|---|
| Reading this plan; reviewing code/docs | ✅ yes |
| Opening the public Review tab without token | ✅ yes — read-only/no secret |
| Confirming no-token UI does not look broken | ✅ yes |
| Entering `HUMANX_ADMIN_TOKEN` in browser | ❌ NO — requires explicit approval, token handled operator-locally only |
| Loading `/api/review` with admin token | ❌ NO — requires explicit approval |
| Inspecting queue contents with token | ❌ NO — may expose non-public content; requires approval |
| Approve / Reject / Requeue / Cleanup / Duplicate / Resolve similar | ❌ NO — mutates production D1; requires exact explicit approval per action/run |
| Wrangler / D1 / deploy | ❌ NO |

**Default:** D-118A is planning only. D-118B may run no-token read-only Review UI checks. D-118C or later may run tokened moderator QA only after explicit approval.

---

## 1. Pass/Fail Format

```text
[Step ID] <action>
  Expected: <expected result>
  Result:   PASS | FAIL | BLOCKED | SKIPPED(needs-approval)
  Notes:    <observation; for FAIL include screenshot/console/network detail>
```

- **PASS** — observed matches expected.
- **FAIL** — observed differs; capture detail.
- **BLOCKED** — could not test.
- **SKIPPED(needs-approval)** — admin-token or mutating path deferred.

---

## 2. No-Token Review Surface (safe read-only)

| ID | Step | Expected |
|---|---|---|
| NT-1 | Open main app → Review tab without token | Review page renders; shows `admin only` / moderation explanation; token input visible; no blank screen/raw JSON |
| NT-2 | Click/load queue without token if UI allows | Either stays on token prompt or shows clear `ADMIN_REQUIRED` style message; no non-public queue data visible |
| NT-3 | Inspect browser console | No fatal JS error from missing token; UI remains usable |
| NT-4 | Navigate away and back | Review tab remains understandable; no stuck loading state |

---

## 3. Token Handling Rules (for future authorised run)

| Rule | Requirement |
|---|---|
| Token source | Operator-local only. Do not paste token into chat/docs/issues/PRs. |
| Storage | Browser localStorage path is acceptable for current prototype, but token value must not be exported or screenshot if visible. |
| Screenshots | If a screenshot is needed, crop/blur the token input. |
| Logs | Do not copy request headers containing `x-humanx-admin`. |
| Rotation | `HUMANX_ADMIN_TOKEN` rotation remains deferred unless separately authorised. |

---

## 4. Tokened Queue Load (requires explicit approval)

| ID | Step | Expected |
|---|---|---|
| TQ-1 | Enter admin token locally in browser | Token is accepted locally; status changes enough to load queue; token not displayed in report |
| TQ-2 | Load Review queue | Pending/reported items render in cards or clear empty state; archived summary appears separately if nonzero |
| TQ-3 | Verify queue separation | Pending/reported items are visible to admin only; archived items are not mixed into active queue |
| TQ-4 | Verify item types | Claims, Truths, and Evidence items identify their target type clearly |
| TQ-5 | Verify report count wording | Report count is framed as user flags, not proof of wrongdoing |
| TQ-6 | Verify no raw content overflow | Long content is clipped/details-expanded; UI does not explode on long rows |

---

## 5. Inspect Panel QA (requires explicit approval)

| ID | Step | Expected |
|---|---|---|
| IP-1 | Click Inspect on a claim item | Inspect panel appears near/reachable; item title/body/status visible; action buttons visible |
| IP-2 | Click Inspect on a truth item | Truth context visible: category/origin/type/confidence/repetition/pressure where available |
| IP-3 | Click Inspect on an evidence item | Evidence title/body/quality/stance/source visible; parent claim context if available |
| IP-4 | Source rendering in inspect | http/https sources clickable with safe link attributes; non-web/empty sources non-clickable; no raw `javascript:`/`data:` href |
| IP-5 | Long text handling | Long content uses safe clipped/details display; no layout break |
| IP-6 | Scroll behaviour | Inspecting a card does not strand the moderator at the wrong scroll position; next card remains reachable |

---

## 6. Decision Controls — Dry Visual Check Only Unless Approved

| ID | Step | Expected |
|---|---|---|
| DC-1 | Locate Approve control | Clearly labelled; makes item public if used; should not be accidentally triggered during visual QA |
| DC-2 | Locate Reject control | Clearly labelled; keeps item private/rejected if used |
| DC-3 | Locate Requeue/Keep Pending if present | Clearly labelled; does not imply public visibility |
| DC-4 | Locate Cleanup control | Only appears/works for rejected smoke/test artefacts; not general deletion |
| DC-5 | Locate Duplicate/Resolve similar controls if present | Non-destructive wording: duplicate/resolve, not delete/merge unless actually implemented |

**Do not click mutating controls during D-118A.** In future tokened QA, decisions require explicit action-level approval and exact IDs.

---

## 7. Mutating Moderator Actions (separate future approval only)

| Action | Effect | Approval required |
|---|---|---|
| Approve claim/truth/evidence | Makes item public / approved | Yes — exact item ID and action |
| Reject claim/truth/evidence | Keeps item private/rejected | Yes — exact item ID and action |
| Requeue item | Moves item back to review | Yes — exact item ID and action |
| Cleanup rejected smoke/test artefact | Archives only eligible rejected artefacts | Yes — exact item ID and action |
| Mark duplicate | Marks duplicate non-destructively | Yes — exact source/target IDs |
| Resolve similar | Clears advisory only | Yes — exact item ID |

No bulk actions. No hard delete. No migration. No direct D1 cleanup.

---

## 8. Review Trust/Safety Wording

| ID | Surface | Expected wording/meaning |
|---|---|---|
| RW-1 | Review helper | Pending items are not public; approve makes public; reject keeps private |
| RW-2 | Archive helper | Archive is only for rejected smoke/test artefacts |
| RW-3 | Reports helper | Report count reflects user flags, not proof of wrongdoing |
| RW-4 | Truth-derived context | Truth-derived/category-echo/borderline context is advisory, not automatic decision |
| RW-5 | Evidence quality | `vibes` appears as `weak argument`; weak does not mean fake |
| RW-6 | Source display | source provided does not imply verified/trusted |

---

## 9. Stop Conditions

Stop immediately if:

1. Admin token is requested to be pasted into chat/docs/logs.
2. Review queue leaks non-public content without token.
3. A source URL in Review inspect renders clickable for `javascript:`, `data:`, `vbscript:`, `blob:`, `file:`, protocol-relative, or malformed values.
4. Any Review action mutates an item without a confirmation or without explicit approval.
5. Cleanup appears available for non-rejected or non-smoke/test artefacts.
6. UI shows raw JSON/stack trace/blank screen to admin or no-token user.
7. Moderator wording implies HumanX verifies truth or that reports prove wrongdoing.
8. Any test would require Wrangler/D1/deploy/admin-token use beyond the current authorisation boundary.

---

## 10. Optional Future D-118B / D-118C Split

| Task | Scope |
|---|---|
| **D-118B** | No-token Review UI read-only check. Safe browser-only, no admin token, no mutations. |
| **D-118C** | Tokened Review queue read-only inspection. Requires explicit approval; no decisions. |
| **D-118D** | Exact-ID moderator action smoke. Requires explicit approval per action; prefer rejected smoke/test artefact only. |

---

## 11. Coverage Map

| Prior work | Covered by |
|---|---|
| D-95 Review inspect ergonomics | IP-1, IP-6 |
| D-96 approve confirmation | DC-1, Section 7 |
| D-103 evidence quality labels | RW-5 |
| D-104/D-107 source safety | IP-4, stop condition 3 |
| D-106 admin/debug hardening | NT-2, token handling |
| D-111→D-114 public/mobile polish | no direct admin dependency, but should remain unaffected |
| D-116 D1 audit plan | not executed here; may inform queue/data-quality interpretation later |

---

## 12. Confirmation

> Docs-only. No Wrangler, no D1, no production query, no admin token, no deploy, no Review queue load with token, no approve/reject/requeue/cleanup/duplicate/resolve action, no mutation. Executing tokened moderator QA is a separate future task requiring explicit approval.
