-- D-201C: Evidence source taxonomy — additive only
--
-- Adds two new columns to the evidence table to separate:
--   source_type     — what kind of source the evidence comes from (origin/category)
--   evidence_strength — how the submitter assesses the strength/weight of this item
--
-- The existing 'quality' column is legacy and remains completely untouched.
-- No existing rows are modified. No data is rewritten.
--
-- Key principle enforced here: source origin is not proof.
-- A scripture or tradition source records where a belief comes from;
-- it is not independent empirical verification of a factual claim.
-- That distinction is enforced in the UI layer, not here.
--
-- APPLY IS GATED — do not run this file directly.
-- See docs/D201C_SOURCE_TAXONOMY_MIGRATION_PREFLIGHT.md for the
-- exact preflight check and apply command.

-- source_type: origin/category of the evidence source.
-- Intended values (validated server-side, not by DB constraint yet):
--   empirical_study | expert_analysis | news_report | personal_experience |
--   eyewitness | argument_opinion | scripture_tradition | myth_folklore |
--   fiction_story | social_media | unknown
-- NULL means not yet classified (legacy rows, or submission before UI shipped).
ALTER TABLE evidence ADD COLUMN source_type TEXT;

-- evidence_strength: submitter's self-assessed confidence in this item.
-- Intended values (validated server-side, not by DB constraint yet):
--   strong | moderate | weak | disputed | unknown
-- NULL means not yet assessed (legacy rows, or submission before UI shipped).
-- This is self-reported — it does not affect the automated evidence_score.
ALTER TABLE evidence ADD COLUMN evidence_strength TEXT;
