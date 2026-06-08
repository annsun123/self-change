-- DayRecords table — single-day container unifying all day-state data
-- Replaces scattered flag/homework/shadow/meditation/wangde tracking
-- with one atomic per-day record.

CREATE TABLE IF NOT EXISTS day_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  calendar_date DATE NOT NULL,
  phase TEXT NOT NULL DEFAULT 'awakening'
    CHECK (phase IN ('awakening','self_cultivation','trials','return')),

  -- Morning planning
  flag JSONB DEFAULT '{"text":"","associatedShadowIds":[],"reward":"","status":"unmarked","source":null,"confirmedAt":null}',
  schedule JSONB DEFAULT '[]',
  shadow_assessments JSONB DEFAULT '[]',
  kingly_deeds JSONB DEFAULT '[]',
  meditation JSONB DEFAULT null,

  -- Evening dialogue
  evening JSONB DEFAULT '{"mode":null,"completedAt":null}',

  -- Settlement
  summary JSONB DEFAULT null,

  -- Status: planning → in_progress → closing (terminal)
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning','in_progress','closing')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, calendar_date)
);

-- RLS policies
ALTER TABLE day_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own day records"
  ON day_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own day records"
  ON day_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own day records"
  ON day_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_dr_user_status ON day_records(user_id, status);
CREATE INDEX idx_dr_user_daynum ON day_records(user_id, day_number DESC);
CREATE INDEX idx_dr_user_date ON day_records(user_id, calendar_date DESC);
