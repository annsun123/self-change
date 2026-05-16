-- =====================================================
-- 成为之旅 App - MVP 改造迁移 (2026-05-11)
-- 新增阴影自评记录 + 日程模板
-- =====================================================

-- 阴影自评记录表
CREATE TABLE IF NOT EXISTS public.shadow_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shadow_type TEXT NOT NULL, -- 'arrogance' | 'selfishness'
    date DATE NOT NULL,
    self_rating TEXT NOT NULL CHECK (self_rating IN ('+1', '-1', 'skip', 'breakthrough')),
    behavior_record TEXT NOT NULL, -- required, user's description of what happened
    reflection_detail TEXT, -- added after evening dialogue follow-up
    teacher_response TEXT, -- auto-generated teacher response
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, shadow_type, date)
);

-- 日程模板表
CREATE TABLE IF NOT EXISTS public.daily_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    goal_text TEXT,
    goal_shadow TEXT, -- 'arrogance' | 'selfishness' | null
    goal_reward TEXT,
    tasks JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- profiles 表新增字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wangde_veins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS today_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS today_goal_achieved BOOLEAN DEFAULT FALSE;

-- shadows 表新增字段
ALTER TABLE public.shadows ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;
ALTER TABLE public.shadows ADD COLUMN IF NOT EXISTS total_breakthroughs INTEGER DEFAULT 0;

-- 索引
CREATE INDEX IF NOT EXISTS idx_shadow_records_user_date ON public.shadow_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_shadow_records_shadow_type ON public.shadow_records(user_id, shadow_type, date);
CREATE INDEX IF NOT EXISTS idx_daily_schedules_user_date ON public.daily_schedules(user_id, date);

-- RLS 策略（复用现有模式）
ALTER TABLE public.shadow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_schedules ENABLE ROW LEVEL SECURITY;

-- 阴影记录：用户只能读写自己的
CREATE POLICY "Users can manage own shadow records"
    ON public.shadow_records
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 日程模板：用户只能读写自己的
CREATE POLICY "Users can manage own daily schedules"
    ON public.daily_schedules
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- profiles 字段更新不需要 RLS 策略（已有 policies）