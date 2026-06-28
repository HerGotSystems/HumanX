-- D-209E: per-field belief visibility consent storage
-- visibility_json TEXT column on belief_snapshots
--
-- stores per-field public visibility consent as a JSON object, e.g.:
--   {"basic_snapshot":true,"pattern_summary":false,"alignment_labels":false,"scores":false}
--
-- absent / null means all sensitive field groups are private by default.
-- public response shaping must whitelist fields via parseBeliefVisibility().
-- raw belief identity fields (dominant_pattern, top_beliefs_json) must
-- never be returned publicly by default regardless of this column's value.
--
-- additive only — no DROP, no UPDATE, no NOT NULL, no CHECK constraint.
-- rollback is code-level: ignore the column; D1 cannot drop columns.

ALTER TABLE belief_snapshots ADD COLUMN visibility_json TEXT;
