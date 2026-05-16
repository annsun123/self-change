-- =====================================================
-- 自我改变 App - 初始数据库架构
-- =====================================================

-- 枚举类型
CREATE TYPE phase_enum AS ENUM ('awakening', 'self_cultivation', 'trials', 'return');
CREATE TYPE shadow_type_enum AS ENUM ('arrogance', 'selfishness');
CREATE TYPE task_status_enum AS ENUM ('assigned', 'attempted', 'completed', 'skipped');
CREATE TYPE teacher_enum AS ENUM ('shen_xiansheng', 'xu_niangzi');
CREATE TYPE speaker_enum AS ENUM ('teacher', 'user', 'system');
CREATE TYPE dialogue_status_enum AS ENUM ('in_progress', 'completed', 'abandoned');

-- =====================================================
-- 用户档案
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    current_phase phase_enum DEFAULT 'awakening',
    wangde INTEGER DEFAULT 0 CHECK (wangde >= 0 AND wangde <= 15),
    consecutive_days INTEGER DEFAULT 0,
    last_completed_date DATE,
    scroll_position INTEGER DEFAULT 0 CHECK (scroll_position >= 0),
    day_in_journey INTEGER DEFAULT 0,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 阴影状态
-- =====================================================
CREATE TABLE public.shadows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shadow_type shadow_type_enum NOT NULL,
    current_hp INTEGER NOT NULL DEFAULT 7 CHECK (current_hp >= 0),
    max_hp INTEGER NOT NULL DEFAULT 7 CHECK (max_hp >= 1),
    shatter_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_damaged_at TIMESTAMPTZ,
    UNIQUE(user_id, shadow_type)
);

-- =====================================================
-- 每日任务
-- =====================================================
CREATE TABLE public.daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    task_description TEXT NOT NULL,
    task_category TEXT,
    target_shadow shadow_type_enum,
    status task_status_enum DEFAULT 'assigned',
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, assigned_date)
);

-- =====================================================
-- 对话会话
-- =====================================================
CREATE TABLE public.dialogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    daily_task_id UUID REFERENCES public.daily_tasks(id),
    teacher teacher_enum NOT NULL,
    dialogue_date DATE NOT NULL,
    phase_at_time phase_enum,
    summary TEXT,
    status dialogue_status_enum DEFAULT 'in_progress',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    wangde_delta INTEGER DEFAULT 0,
    shadow_damage_dealt JSONB,
    UNIQUE(user_id, dialogue_date)
);

-- =====================================================
-- 对话消息
-- =====================================================
CREATE TABLE public.dialogue_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dialogue_id UUID NOT NULL REFERENCES public.dialogues(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    speaker speaker_enum NOT NULL,
    content TEXT NOT NULL,
    choices JSONB,
    chosen_choice_id TEXT,
    shadow_effect JSONB,
    wangde_effect INTEGER DEFAULT 0,
    narrative_flag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 王德事件日志
-- =====================================================
CREATE TABLE public.wangde_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount >= -5 AND amount <= 5),
    source TEXT NOT NULL,
    source_id UUID,
    narrative_unlock BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 文物奖励
-- =====================================================
CREATE TABLE public.artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL,
    artifact_name TEXT NOT NULL,
    shadow_that_dropped shadow_type_enum,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    narrative_text TEXT
);

-- =====================================================
-- 叙事事件
-- =====================================================
CREATE TABLE public.narrative_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_key TEXT NOT NULL,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    event_data JSONB,
    UNIQUE(user_id, event_key)
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_shadows_user_id ON public.shadows(user_id);
CREATE INDEX idx_daily_tasks_user_date ON public.daily_tasks(user_id, assigned_date);
CREATE INDEX idx_dialogues_user_date ON public.dialogues(user_id, dialogue_date);
CREATE INDEX idx_dialogue_messages_dialogue ON public.dialogue_messages(dialogue_id, sequence_order);
CREATE INDEX idx_wangde_events_user ON public.wangde_events(user_id, created_at);
CREATE INDEX idx_artifacts_user ON public.artifacts(user_id);
CREATE INDEX idx_narrative_events_user ON public.narrative_events(user_id);

-- =====================================================
-- 自动更新时间戳函数
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shadows_updated_at
    BEFORE UPDATE ON public.shadows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
