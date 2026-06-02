# UI / Product QA Result — 2026-06-02

## 1. Purpose

This file records a manual UI/product QA checkpoint taken after a batch of frontend improvements. It confirms which areas were verified by the user on desktop and phone, documents known caveats, and identifies recommended next product work.

---

## 2. Date and Scope

**Date:** 2026-06-02

**Scope:**
- Frontend UI only — no backend logic changes during this QA session
- Manual browser and phone verification
- No new backend migrations applied during this QA session
- No Wrangler or D1 commands run during this QA session

---

## 3. Verified Areas

- [x] Home command center — loads, pipeline banner readable, action cards work
- [x] Mobile navigation — tab row now scrolls horizontally; no multi-row wrap on phone
- [x] Claims page — cards readable, Study button works
- [x] Study Claim page — readable on desktop and phone
- [x] Claim Flow — 4-step flow renders with first evidence / pressure / test / analysis previews
- [x] Investigation Board — 2×2 grid with section headers, counts, purpose lines
- [x] Add Test display path — form visible, submitted tests appear as distinct cards below form
- [x] Review / admin queue — loads with local admin token, cards show state badges
- [x] Context side panel — Add Evidence / RunPack / Report tools accessible
- [x] Phone layout — Study header, Claim Flow, Investigation Board, Tests, Analysis all readable; Context panel stacks at bottom
- [x] Desktop layout — Review queue, Claims, Study investigation board, and side panel all usable

---

## 4. Add Test Verification

Add Test was repaired in a prior session (migration `0005_add_home_tests_updated_at.sql` applied manually via Cloudflare D1 console). This QA confirms the display path is working end-to-end:

- Add Test submits successfully via `/api/tests`
- `Sniff / Sniff Butt` is visible in the Study Tests section and in Claim Flow under *3 · How to test it*
- `Lick Elbow / Lick Tip of Your Elbow` is also visible in the Tests section
- Tests appear as green-tinted cards visually distinct from the Add Test form
- Empty state displays correctly when no tests are present

---

## 5. Review / Admin Verification

- Admin token is local browser state — not shared across devices, users, or sessions
- Review queue loads correctly when a valid admin token is entered
- HOWGH test claim, submitted from phone, appeared in the review queue as expected
- Approve / Keep Review / Reject actions visibly update the card's state badge after the backend call completes
- Review cards now show:
  - Type badge (claim / truth)
  - State badge colour-coded: yellow for pending review, green for public, red for rejected
  - Report count as a red badge when reports > 0
  - Category, verdict/origin metadata line
  - Updated date

---

## 6. Known Caveats / Future Polish

- **Review action buttons on non-pending cards:** Rejected, public, and duplicate cards still show all three action buttons. This may be intentional to allow admin reversibility, but consider whether non-pending states should show disabled or different buttons if stricter one-way safety is desired.
- **Review detail:** Cards show whatever data the backend currently returns. Richer expansion (e.g. full claim body, evidence count) would require backend data to already be included in the review response — do not add new backend calls without planning.
- **`Sniff / Sniff Butt`:** Remains as a known, harmless smoke-test artefact. Leave it unless intentionally cleaning it through the normal UI or admin process.
- **`Lick Elbow / Lick Tip of Your Elbow`:** Similar artefact from phone testing. Leave it unless intentionally cleaning.
- **Mobile nav compactness:** The horizontal-scroll tab row is working. Preserve this — do not revert to wrapping tabs.
- **Phone browser chrome:** Top browser UI (address bar, system bar) is outside app control and reduces usable screen height on phone. Not an app issue.

---

## 7. What This Does Not Prove

- Does not prove all backend routes are working — only the paths exercised during this session
- Does not prove D1 schema correctness beyond the tested endpoints (`/api/tests`, `/api/claims`, `/api/review`)
- Does not replace read endpoint smoke tests (`scripts/read-endpoint-smoke-test.mjs`)
- Does not replace write endpoint smoke tests (`scripts/write-endpoint-smoke-test.mjs`)
- Does not replace Belief Engine static check or Worker route static check
- Does not prove all admin edge cases (duplicate handling, race conditions, concurrent decisions)
- Does not constitute a security review of admin token storage, review decision endpoint auth, or write endpoint protection

---

## 8. Recommended Next Product Work

In rough priority order:

- **Evidence Vault readability** — vault cards are functional but dense; apply the same investigation-board readability treatment
- **Truths page readability** — truth cards could benefit from clearer metadata layout and empty states
- **Review action policy refinement** — decide whether non-pending cards should show all buttons or a reduced set; document the decision
- **RunPack output readability** — the generated RunPack JSON is currently shown in a raw `<pre>` block; a structured preview or copy-friendly format would reduce friction before pasting into an AI
- **Claim detail expansion in Review** — if the existing backend review response includes additional claim fields (votes, evidence count, created date), surface them in the review card without adding new backend calls
