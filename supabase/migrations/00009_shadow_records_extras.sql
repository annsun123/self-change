-- Add new columns to shadow_records for enhanced self-assessment
-- These are written by ShadowSelfRatingCard during evening rating_check phase
-- and by shadow-hall page during standalone shadow rating

ALTER TABLE public.shadow_records
ADD COLUMN IF NOT EXISTS reflection_depth INTEGER CHECK (reflection_depth >= 1 AND reflection_depth <= 5),
ADD COLUMN IF NOT EXISTS trigger_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS behavior_score INTEGER CHECK (behavior_score >= 1 AND behavior_score <= 10);
