-- Evening Sessions table for persisting evening dialogue data
-- Stores user inputs from all rounds of evening conversation

CREATE TABLE IF NOT EXISTS evening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  dialogue_path TEXT NOT NULL CHECK (dialogue_path IN ('full', 'quick')),
  session_tone TEXT CHECK (session_tone IN ('positive', 'neutral', 'negative')),
  flag_answer TEXT CHECK (flag_answer IN ('completed', 'not_completed', 'forgot', 'skip')),
  lesson_feedback JSONB DEFAULT '{}',
  shadow_discussions JSONB DEFAULT '[]',
  infiltration_response TEXT,
  wangde_delta INTEGER DEFAULT 0,
  scroll_change INTEGER DEFAULT 0,
  shadow_damage JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS policies
ALTER TABLE evening_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evening sessions"
  ON evening_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evening sessions"
  ON evening_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evening sessions"
  ON evening_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evening sessions"
  ON evening_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_evening_sessions_user_id ON evening_sessions(user_id);
CREATE INDEX idx_evening_sessions_date ON evening_sessions(date);
CREATE INDEX idx_evening_sessions_user_date ON evening_sessions(user_id, date);