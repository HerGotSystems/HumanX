-- D-275B: Add nullable packet_id column to analysis_results.
-- This links a saved AI analysis result to the RunPack packet that was given to the AI.
-- Additive only. Existing rows will have packet_id = NULL.
-- Do NOT apply this migration to production D1 without owner approval.
ALTER TABLE analysis_results ADD COLUMN packet_id TEXT;
