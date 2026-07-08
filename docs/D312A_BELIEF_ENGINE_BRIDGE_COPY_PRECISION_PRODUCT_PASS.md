# D-312A — Belief Engine Bridge-Copy Precision Product Pass

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 78 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at pass:** `8354f8e` (D-311A)

---

## Context

D-311A closed the Belief Engine results Review handoff arc and named two remaining narrow candidates: bridge-copy precision and the abandoned quick-record stubs — explicitly not to be bundled. Per instruction, this pass takes **only** bridge-copy precision: is the wording around "Send to HumanX" and the results-page bridge/export elements precise about what is sent, what is not sent, and that public display still waits for Review?

---

## 1. Current-State Summary

The Belief Engine results page (`screen-results`) has two separate copy surfaces that talk about sending data to HumanX, and they are not perfectly aligned with each other:

1. **A static paragraph inside the "Export & Share" panel**, written directly in `public/apps/humanx-belief-engine/index.html`.
2. **A dynamically injected note and button**, added at runtime by `public/apps/humanx-belief-engine/humanx-bridge.js`'s `injectHumanXButton()`.
3. **A one-time `alert()`**, shown only after a successful "Send to HumanX" click, also from `humanx-bridge.js`.

D-310B already added a Review-gate sentence to the *separate* "What to Test Next" section, which covers the **Claim-conversion path** ("if you turn a belief into a claim..."). That sentence does not live in, and does not get reused by, the Export & Share panel — so this pass evaluates the Export & Share/bridge copy on its own terms.

---

## 2. Results-Page Bridge/Export Elements Found

| Element | Source | Exact text |
|---|---|---|
| Export & Share static paragraph | `index.html` (static) | `"Download or copy your pressure map. \"Send to HumanX\" saves a snapshot to your session — it does not publish anything automatically."` |
| Injected note (`#send-humanx-note`) | `humanx-bridge.js` `injectHumanXButton()` (runtime) | `"Saved: dimension scores, alignment patterns, contradiction summary, and moral-scenario responses. Not saved: private timeline text or free-text answers you typed. Nothing is published — the snapshot enters your Drift for your own review only."` |
| Post-click success alert | `humanx-bridge.js` `sendBeliefEngineToHumanX()` (transient, one-time) | `"Snapshot saved to HumanX. Open the main app → Drift to see it. It is not published; turning it into a Truth or Claim enters Review before becoming visible to others. Nothing has been proven or verified."` |
| Buttons in the same row | `index.html` static + bridge-injected | `Send to HumanX` (injected, appears first), `Download PNG`, `Copy Summary`, `Start Over` |

---

## 3. `humanx-bridge.js` Behavior Summary

- `buildHumanXBeliefSnapshot()` constructs the payload sent to `/api/belief-snapshots`. It includes: dominant pattern, summary, dimension scores, top alignments, contradiction text, derived stress-scenario labels — **and also a `raw` sub-object containing `scores`, `alignments`, `contradictions`, `identity` (chip selections), `answers` (the 77 structured scale responses), `profileMode`, and `exportedAt`.**
- Raw free-text timeline answers (`fearTrue`, `isolate`, `identity` free-text fields) are explicitly excluded — confirmed by an inline code comment and unchanged from D-306A's original audit.
- `sendBeliefEngineToHumanX()` posts only to `/api/belief-snapshots`. No Claim, Truth, or RunPack route is ever called.
- `injectHumanXButton()` adds the button and note to `.results-actions`, running once via a `MutationObserver` plus a `DOMContentLoaded`/immediate fallback.

---

## 4. Privacy / Safety Boundary Assessment

**Q4/Q5. Does the bridge send raw free-text answers? Does it only send safe summary/snapshot fields?** Mostly yes, with one precision gap: the payload's `raw` sub-object includes the 77 structured scale **answers**, the full **alignments** array, the full **contradictions** array, and **identity** chip selections — none of which are free text, but none of which are mentioned in the injected note's "Saved: X, Y, Z" list either. The note's list (`"dimension scores, alignment patterns, contradiction summary, and moral-scenario responses"`) reads as a curated *summary* description but the actual payload also includes the underlying raw structured data behind that summary. This is not a privacy violation (nothing sensitive/free-text leaks), but it is an **incompleteness** — the "Saved:" list undersells what is actually transmitted.

**Q11. Does any wording imply "Send to HumanX" publishes directly?** No — all three copy surfaces explicitly say it does not publish automatically.

**Q12. Does any wording imply the snapshot itself is a verified Truth?** No.

**Q13. Does any wording imply Review is proof or verification?** Not as a false claim — but there is a **terminology collision**: the injected note says the snapshot enters "your Drift for your **own review** only" (lowercase, meaning "for you to look at"), while the post-click alert and the D-310B sentence both use capitalized **Review** to mean the actual admin approval gate. A user who only reads the injected note (visible before any click) could plausibly conflate "your own review" with the admin Review gate — this is the same ambiguity D-310A flagged and explicitly deferred, since fixing it requires editing `humanx-bridge.js`, which is off-limits in this pass.

**No safety-boundary violations found.** Both findings above are precision/completeness gaps, not accuracy or safety failures.

---

## 5. Review / Public-Display Wording Assessment

**Q6/Q7. Does the UI clearly say what is sent / not sent?** Partially — the injected note gives a specific but incomplete list (see section 4). The static Export panel paragraph doesn't attempt a what's-sent list at all; it only says "does not publish anything automatically."

**Q8. Does the UI clearly say the bridge/export does not publish a Truth?** Yes, in all three copy surfaces, in different words each time (`"does not publish anything automatically"` / `"Nothing is published"` / `"It is not published"`).

**Q9. Does the UI clearly say public display still waits for Review?** Only in the post-click alert (transient, one-time) and, separately, in the D-310B "What to Test Next" sentence (about the claim-conversion path, not the snapshot-save action). **The static, always-visible Export & Share paragraph never mentions Review at all** — a user who never clicks "Send to HumanX" (and so never sees the alert) has no on-page, persistent statement that anything they eventually publish would need Review, from this section specifically.

**Q10. Does the D-310 Review sentence already cover enough of this?** Not fully — it lives in a different section ("What to Test Next," about converting a belief into a claim) and is not visible from, or referenced by, the Export & Share panel. The two sections currently make the same point about Review independently, in different wording, rather than reinforcing each other.

---

## 6. Handoff-Copy Friction

- **Vocabulary drift:** the static Export panel says "saves a snapshot to your **session**" — vague, and inconsistent with the rest of the app's vocabulary, which correctly uses **Drift** as the actual named destination (confirmed by the injected note and the post-click alert, both of which say "Drift"). A user reading only the static text (which renders before the bridge script injects anything) sees "session," not "Drift."
- **No persistent Review mention in the Export & Share panel** — as above, only the transient post-click alert and the unrelated "What to Test Next" section mention Review.
- **Terminology collision** ("your own review" vs. capitalized Review) — real, but lives inside `humanx-bridge.js`, out of scope for this pass.
- **Incomplete "Saved:" list** — real, but also lives inside `humanx-bridge.js`, out of scope for this pass.

---

## 7. Candidate Options Considered

| Option | Verdict |
|---|---|
| No change | Rejected — a real, small, fixable gap exists in the static Export & Share paragraph (vague "session" wording, no Review mention) |
| **Add one static clarification sentence near existing results links** | Not needed as a *new* sentence — the fix is smaller: tightening the *existing* Export & Share paragraph |
| **Change one existing link label only** | Not applicable — no results link is imprecise; the gap is in panel copy, not link labels |
| **Add small "What is sent / what is not sent" note** | Rejected for this pass — the most complete version of this note would need to reflect the actual `raw` payload contents, which requires touching `humanx-bridge.js`'s own injected note; out of scope here |
| **Change `humanx-bridge.js` behavior** | Rejected — explicit hard boundary for this pass; the two bridge-script-specific findings (terminology collision, incomplete "Saved:" list) are real but deferred to a separately-scoped, explicitly-approved bridge-script pass |
| Add automated Claim Builder handoff | Rejected — unrelated to copy precision; already deferred by D-306A pending its own cross-app/session-risk audit |
| Add Claim/Truth/RunPack creation | Rejected — explicit hard boundary, unrelated to this pass's scope |

---

## 8. Recommended D-312B Candidate

**Tighten the existing static "Export & Share" paragraph in `index.html`** (not the bridge-injected note, not `humanx-bridge.js`) to name "Drift" instead of "session" and to add a short Review-gate reinforcement, without duplicating the D-310B sentence verbatim.

Illustrative rewording (final exact wording to be decided at implementation time, not this pass):

> *"Download or copy your pressure map. \"Send to HumanX\" saves a snapshot privately to your Drift — it does not publish anything, and any claim made from it still waits for Review."*

This is deliberately:
- **Not** a new section or card
- **Not** a change to `humanx-bridge.js`, its injected note, or its alert
- **Not** a change to the "Send to HumanX" button, its behavior, or the payload it sends
- **Not** a duplicate of the D-310B sentence — it reinforces the same Review boundary from a different, currently-silent surface (the Export & Share panel), using different, non-duplicated wording

---

## 9. D-312B Classification

**Frontend-only copy/tests.** Touches only the static paragraph inside `public/apps/humanx-belief-engine/index.html`'s Export & Share section. No change to `humanx-bridge.js` (a "bridge-script frontend behavior" change, which this pass explicitly does not recommend). No backend/API/schema/storage changes. Must preserve every marker currently locked by `scripts/belief-engine-static-check.mjs` (78 checks).

**Q17/Q18/Q19.** No useful improvement in this recommendation requires changing bridge behavior, backend/API/schema/storage. The two deeper findings that *do* touch `humanx-bridge.js` (terminology collision, incomplete "Saved:" list) would require a separate, explicitly-scoped bridge-script pass — classified as "bridge-script frontend behavior," not "frontend-only copy/tests" — and are not recommended for this pass.

**Q20/Q22.** The smallest safe D-312B candidate is the one-paragraph tightening above. Bridge copy is **not** already clear enough to say stop — a real, small, evidence-backed gap exists in the one static paragraph this pass is scoped to fix.

---

## 10. Explicit "Do Not Do Next" List

- **Do not modify `humanx-bridge.js` in D-312B** — the injected note's "your own review" wording and its incomplete "Saved:" list are real findings but require their own explicitly-scoped, owner-approved bridge-script pass, not this copy-only fix.
- **Do not touch the "Send to HumanX" button, its `onclick` handler, or the payload it sends.**
- **Do not touch the post-click `alert()` text.**
- **Do not add a new "what is sent/not sent" card or section** — any future expansion of that idea belongs with the bridge-script pass above, since a complete list requires reflecting the actual `raw` payload contents that only `humanx-bridge.js` currently owns.
- **Do not duplicate the D-310B "What to Test Next" sentence verbatim** in the Export & Share panel — reinforce the same boundary with different wording instead.
- **Do not change the three "What to Test Next" links, `Download PNG`, `Copy Summary`, or `Start Over` buttons.**
- **Do not alter the 77-statement flow, scoring, dimension weights, archetype matching, or contradiction logic.**
- **Do not alter result generation.**
- **Do not weaken any existing safety copy** ("No diagnosis," "mirror not a verdict," the D-306B boundary line, the D-310B Review sentence).
- **Do not remove or alter any of the 78 markers locked by `scripts/belief-engine-static-check.mjs`.**

---

## Summary

| Question | Answer |
|---|---|
| Bridge/export elements found | Static Export & Share paragraph, bridge-injected note, bridge-injected post-click alert |
| Does bridge send raw free-text? | No — confirmed excluded, unchanged since D-306A |
| Biggest precision gap in scope | Static Export & Share paragraph says "session" (vague) instead of "Drift," and never mentions Review |
| Findings out of scope (require bridge-script pass) | Injected note's "your own review" vs. capital-R Review terminology collision; incomplete "Saved:" list relative to actual `raw` payload |
| Safety-boundary violations found | None |
| Smallest safe D-312B candidate | Tighten the existing static Export & Share paragraph — name "Drift," add a short Review-gate reinforcement |
| D-312B classification | Frontend-only copy/tests |
| Backend/schema/API needed | No |
| `humanx-bridge.js` change needed | No — explicitly deferred to a separate pass |
| Stop and do nothing? | No — a real, small, fixable gap exists within this pass's scope |
