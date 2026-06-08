-- Behavior Entries table — stores all user behavior records from evening review
-- Includes lesson quality scores, general behavior journal entries, and kingly deeds

CREATE TABLE IF NOT EXISTS public.behavior_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('lesson', 'general_behavior', 'kingly_deed', 'meditation')),
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  response TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 10),
  reflection TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.behavior_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own behavior entries"
  ON public.behavior_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavior entries"
  ON public.behavior_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavior entries"
  ON public.behavior_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own behavior entries"
  ON public.behavior_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Unique constraint: one entry per user per date per entry_type per category
-- This makes upserts idempotent
CREATE UNIQUE INDEX IF NOT EXISTS idx_behavior_entries_unique
  ON public.behavior_entries(user_id, date, entry_type, category);

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_behavior_entries_user_date
  ON public.behavior_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_behavior_entries_type
  ON public.behavior_entries(user_id, entry_type, date);
