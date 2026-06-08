-- Add last_assessment_date to profiles to prevent duplicate assessments
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_assessment_date DATE;
